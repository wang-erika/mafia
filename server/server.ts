import express from 'express';
import http from 'http';
import { MongoClient, Collection, Db } from 'mongodb';
import { Server as SocketIO } from 'socket.io';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs, resolvers } from './graphql'; // Import your GraphQL definitions
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import moment from 'moment';
import { setupOIDC } from './auth';

// MongoDB setup
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);
const app = express();
const PORT = parseInt(process.env.PORT) || 8131;
const server = http.createServer(app);
const io = new SocketIO(server, {
    cors: {
        origin: "http://localhost:8130",
        methods: ["GET", "POST"],
    },
});

// Setup CORS and session
app.use(cors({
    origin: ["http://localhost:8130", "https://studio.apollographql.com"], // Add all necessary origins
    credentials: true
}));
app.use(session({
    secret: 'session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

// Authentication routes
app.get('/auth', passport.authenticate('oidc'));
app.get('/auth/callback', passport.authenticate('oidc', {
    successRedirect: 'http://localhost:8130yh',
    failureRedirect: '/login'
}));

app.use(express.json());

// API route for fetching message entries
app.get('/api/entries', async (req, res) => {
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
        typeDefs,
        resolvers,
        context: () => ({ db: client.db("chatApp") })
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({ app }); // Apply middleware correctly
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
