import express from 'express'
import { MongoClient, Collection, Db, ObjectId } from 'mongodb'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Message } from './data'

// MongoDB setup
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);
let db: Db;
let messages: Collection<Message>;

// Express setup
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);
const PORT = process.env.PORT || 3000;


client.connect().then(() => {
    console.log('Connected successfully to MongoDB');
    db = client.db("chatApp"); // Use your database name
    messages = db.collection('messages'); // Access your collection

    // Start server
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Socket.io setup
    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });

        socket.on('chat message', (msg) => {
            const message: Message = { //insert message into collection
                _id: new ObjectId().toString(), // Generate a new ObjectId for each message
                senderId: 'exampleSenderId', // This should come from the actual message data
                text: msg,
                timestamp: new Date()
            };

            messages.insertOne(message).then(() => {
                io.emit('chat message', msg);
            }).catch(console.error);
        });
    });
}).catch(console.error);