import express from 'express'
import { MongoClient, Collection, Db, ObjectId } from 'mongodb'
import http from 'http'
import { Server } from 'socket.io'
import { Message } from './data'
import { Player, GameState, createEmptyGame, getPlayerListAndStatus } from './model2'
import moment from 'moment';

// MongoDB setup
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);
let db: Db;
let messages: Collection<any>; 

// Express setup
const app = express();
const PORT = parseInt(process.env.PORT) || 8131;
const server = http.createServer(app); 
const io = new Server(server, { //set up cors because then server can accept connections from client's different port!
    cors: {
      origin: "http://localhost:8130",
      methods: ["GET", "POST"],
    },
  });
  

app.use(express.json());

app.get('/api/entries', async (req, res) => {
    try {
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

io.on('connection', (socket) => {
    console.log('New client connected');
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
    
    socket.on('sendMessage', async ({ senderId, text }) => {
        console.log('Message received:', text, 'from', senderId);
        const messageDocument = {
            senderId,
            text, 
            timestamp: new Date(),
        };
        try {
            const result = await messages.insertOne(messageDocument);
            console.log('Message saved to database with id:', result.insertedId);
            io.emit('receiveMessage', {
                ...messageDocument,
                _id: result.insertedId,
            });
        } catch (error) {
            console.error('Failed to save message to database', error);
        }
    });
});


client.connect().then(() => {
    console.log('Connected successfully to MongoDB');
    db = client.db("chatApp");
    messages = db.collection('messages');
    
    io.on('connection', (socket) => {
        console.log('New client connected');
    
        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });

        socket.on('sendMessage', async ({ msg, senderId }) => {
            console.log('Message received:', msg, 'from', senderId);
            const messageDocument = {
                senderId,
                text: msg,
                timestamp: new Date(),
            };

            try {
                const result = await messages.insertOne(messageDocument);
                console.log('Message saved to database with id:', result.insertedId);
                io.emit('messageSaved', { message: messageDocument, id: result.insertedId });
            } catch (error) {
                console.error('Failed to save message to database', error);
            }
        });
    });

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

}).catch(error => {
    console.error('Failed to connect to MongoDB', error);
});
