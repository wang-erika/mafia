import express from 'express'
import { MongoClient, Collection, Db, ObjectId } from 'mongodb'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Message } from './data'

// MongoDB setup
const url = 'mongodb://127.0.0.1:27017'
const client = new MongoClient(url)
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
            const senderId = 'exampleSenderId';
            
            const message: Omit<Message, '_id'> = { // Use Omit if your Message type requires _id, otherwise just omit it in the type definition
                senderId: senderId,
                text: msg,
                timestamp: new Date()
            };
        
            // Insert the message into the database
            messages.insertOne(message).then((result) => {
                // After successful insertion, the complete message, including its MongoDB-generated _id, is emitted to the clients
                const completeMessage = { ...message, _id: result.insertedId };
                io.emit('chat message', completeMessage);
            }).catch(console.error);
        });
    });
}).catch(console.error);