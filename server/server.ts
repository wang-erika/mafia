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
import { assignRole } from './data';

// MongoDB setup
const url = process.env.MONGO_URL || 'mongodb://db:27017';
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
    origin: ["http://localhost:8130", "http://localhost:8130/graphql", "https://studio.apollographql.com"], // Add all necessary origins
    credentials: true
}));
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
app.get('/api/auth', passport.authenticate('oidc'));
/*
app.get('/api/callback', (req, res, next) => {
    console.log("Hi")
    passport.authenticate('oidc', (err: any, user: any) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect('/login');
        }
        req.logIn(user, async (loginErr) => {
            if (loginErr) {
                return next(loginErr);
            }
            const db = client.db("chatApp");
            const gameState = await db.collection("GameState").findOne({});
            if (gameState) {
                const isPlayerInGame = gameState.players.some((player: { id: String; }) => player.id === user.nickname);
                if (!isPlayerInGame) {
                    gameState.players.push({
                        id: user.nickname,
                        name: user.name,
                        role: assignRole(gameState.players),
                        status: 'Alive',
                        votes: [],
                        killVote: []
                    });
                    await db.collection("GameState").updateOne({}, { $set: { players: gameState.players } });
                }
            } 
            else {
                res.status(404).send("No game found")
            }
            return res.redirect('http://localhost:8130');
        });
    })(req, res, next);
});
*/
app.get('/api/callback', passport.authenticate('oidc', {
    failureRedirect: '/login',
}), (req, res) => {
    if (req.user) {
        res.redirect('http://localhost:31000');
    } else {
        res.redirect('http://localhost:31000')
    }
})


// Route to check on front end 
app.get('/api/check', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ isAuthenticated: true, user: req.user})
    } else {
        res.json({ isAuthenticated: false })
    }
})

app.use(express.json());

// app.use((req, res, next) => {
//     console.log("app.use: ", req.user, req.url, req.headers.cookie);
//     next()
// })

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
        context: ({ req }) => {
            // console.log("Apollo Context - Session:", req.session);
            // console.log("Apollo Context - User:", req.user);
            return {
                db: client.db("chatApp"),
                user: req.user
            };
        },
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({ app, path: '/graphql', cors: false }); // Apply middleware correctly
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
