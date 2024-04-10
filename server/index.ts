import express from 'express'
import { MongoClient, Collection, Db, ObjectId } from 'mongodb'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Message } from './data'
import moment from 'moment';


// MongoDB setup
const url = 'mongodb://127.0.0.1:27017'
const client = new MongoClient(url)
let db: Db;
let messages: Collection<Message>;

// Express setup
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);
const PORT = process.env.PORT || 8131;

app.use(express.json())

client.connect().then(() => {
    console.log('Connected successfully to MongoDB');
    db = client.db("chatApp"); 
    messages = db.collection('messages'); // Access your collection

    //getting all the entries: 
    app.get('/api/entries', async (req, res) => {
        try {
            const entries = await messages.find({}).toArray();
            const formattedEntries = entries.map(entry => ({
                ...entry,
                timestamp: moment(entry.timestamp).format('YYYY-MM-DD HH:mm:ss')
            }));
            console.log(formattedEntries)
            res.status(200).json(formattedEntries);    
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch entries", error: error.message });
        }
    })

    // Start HTTP server
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    io.on('connection', (socket) => {
        console.log('New client connected');
    
        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
            socket.on('sendMessage', async ({ msg, senderId }) => {
            console.log('Message received:', msg, 'from', senderId);
    
            const messageDocument = {
                senderId,
                text: msg, // Ensure this aligns with your database schema; previously it was just `msg`
                timestamp: new Date(),
            };
          
            try {
                const result = await messages.insertOne(messageDocument);
                console.log('Message saved to database with id:', result.insertedId);
    
                // Emit the message to all clients, including the sender, with its database ID
                io.emit('receiveMessage', {
                    ...messageDocument,
                    _id: result.insertedId,
                });
            } catch (error) {
                console.error('Failed to save message to database', error);
            }
        });
    });
    
})