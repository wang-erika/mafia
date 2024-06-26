import express from 'express';
import http from 'http';
import { MongoClient, Collection, Db } from 'mongodb';
import { Server as SocketIO } from 'socket.io';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './GraphQL/graphql'
import {resolvers} from './GraphQL/Resolvers'
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import moment from 'moment';
import { setupOIDC } from './auth';
import { execute, subscribe } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

// OIDC testing
const passportStrategies = ["disable-security", "oidc"]

// graphql setup
const schema = makeExecutableSchema({ typeDefs, resolvers });

// MongoDB setup
const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);
const app = express();
const PORT = parseInt(process.env.PORT) || 8131;
const server = http.createServer(app);
const mode = process.env.ENV_MODE;
let uiPort: number;
if (mode === 'production') {
    uiPort = 31000;
} else {
    uiPort = 8130;
}
const io = new SocketIO(server, {
    cors: {
        origin: `http://localhost:31000`,
        methods: ["GET", "POST"],
    },
});

const corsOptions = {
    origin: ["http://localhost:31000", "http://localhost:8130", "http://localhost:8130/graphql", "https://studio.apollographql.com"],
    credentials: true
};

// Setup CORS and session
app.use(cors(corsOptions))
app.use(session({
    secret: 'session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false
    }
}));

app.use(passport.initialize());
app.use(passport.session());

//serialize user
passport.serializeUser((user, done) => {
    done(null, user)
  })
passport.deserializeUser((user, done) => {
    done(null, user)
    })

// Authentication routes

app.get('/api/auth', passport.authenticate(passportStrategies, {
    successReturnToOrRedirect: "/"
  }))
  
app.get('/api/callback', passport.authenticate(passportStrategies, {
    successReturnToOrRedirect: 'http://localhost:31000/lobby',
    failureRedirect: '/',
}))


function checkAuthenticated(req: any, res: any, next: any) {
    if (!req.isAuthenticated()) {
      res.sendStatus(401)
      return
    }
    next()
  }

// Route to check on front end 
app.get('/api/check', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ isAuthenticated: true, user: req.user})
    } else {
        res.json({ isAuthenticated: false })
    }
})

app.use(express.json());

// API route for fetching message entries
app.get('/api/entries', checkAuthenticated, async (req, res) => {
    try {
        const db = client.db("chatApp");
        const messages = db.collection('messages');
        const entries = await messages.find({}).toArray();
        const formattedEntries = entries.map(entry => ({
            ...entry,
            timestamp: moment(entry.timestamp).format('YYYY-MM-DD HH:mm:ss')
        }));
        res.status(200).json(formattedEntries);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch entries", error: error.message });
    }
});

// WebSocket handling
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => console.log('Client disconnected'));
    socket.on('sendMessage', async ({ senderId, text }) => {
        const db = client.db("chatApp");
        const messages = db.collection('messages');
        console.log('Message received:', text, 'from', senderId);
        const messageDocument = { senderId, text, timestamp: new Date() };
        try {
            const result = await messages.insertOne(messageDocument);
            console.log('Message saved to database with id:', result.insertedId);
            io.emit('receiveMessage', { ...messageDocument, _id: result.insertedId });
        } catch (error) {
            console.error('Failed to save message to database', error);
        }
    });
});

// Initialize Apollo Server for GraphQL

async function startApolloServer() {
    const apolloServer = new ApolloServer({
        schema,
        context: ({ req }) => {
            return {
                db: client.db("chatApp"),
                user: req.user
            };
        },
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({ app, path: '/graphql', cors: false }); // Apply middleware correctly

    // Set up WebSocket server.
    const wsServer = new WebSocketServer({
        server: server,
        path: '/graphql',
    });

    useServer({
        schema, 
        context: async () => ({
            db: client.db("chatApp"), 
        })
    }, wsServer);

    console.log(`GraphQL API available at http://localhost:${PORT}${apolloServer.graphqlPath}`);
}


// Connect to MongoDB and start the server
client.connect().then(async () => {
    console.log('Connected successfully to MongoDB');

    await startApolloServer(); // Initialize Apollo Server after MongoDB connection
    await setupOIDC(); // Initialize OIDC

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Failed to connect to MongoDB', error);
});
