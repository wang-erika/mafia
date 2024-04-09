import express from 'express';
import { MongoClient, Collection, Db, ObjectId } from 'mongodb';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Message } from './data'; // Ensure this matches your schema

// MongoDB setup
const url = 'mongodb://127.0.0.1:27017/chatApp'; // Directly include DB name in connection string
const client = new MongoClient(url);

// Express and Socket.IO setup
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');
        
        const db = client.db(); // `db` is already specified in the connection string
        const messages: Collection<Message> = db.collection('messages');

        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

        io.on('connection', (socket) => {
            console.log('New client connected');
            
            // Load and emit previous messages
            messages.find().toArray().then((msgs) => {
                socket.emit('previous messages', msgs);
            });

            socket.on('chat message', async (text: string) => {
                // Assuming `senderId` is known or derived from context (adjust as necessary)
                const message: Message = {
                    _id: new ObjectId(), // Correct usage of ObjectId
                    senderId: 'exampleSenderId', // Adjust according to your application's logic
                    text,
                    timestamp: new Date()
                };

                await messages.insertOne(message);
                io.emit('chat message', message); // Emit the message object
            });

            socket.on('disconnect', () => console.log('Client disconnected'));
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}

startServer();
