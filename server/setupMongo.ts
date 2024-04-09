import { MongoClient} from 'mongodb'
import { Message } from './data'


// Connection URL and database name
const url = 'mongodb://127.0.0.1:27017'
const client = new MongoClient(url)

// Example messages data
const messages: Message[] = [
    {
        _id: 'message1',
        senderId: 'user1',
        text: 'Hello, World!',
        timestamp: new Date(),
    },
    {
        _id: 'message2',
        senderId: 'user2',
        text: 'Hi there!',
        timestamp: new Date(),
    },
]

async function main() {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB')

        const db = client.db("chatApp")
  
        // set up unique index for upsert -- to make sure a customer cannot have more than one draft order
        await db.collection('messages').createIndex({ senderId: 1 })

        // Insert initial messages data if the collection is empty
        const messagesCount = await db.collection('messages').countDocuments()
        if (messagesCount === 0) {
            console.log("Inserting initial messages")
            await db.collection('messages').insertMany(messages as any)
        } else {
            console.log("Messages collection already has data, skipping initial insert")
        }
    } catch (err) {
        console.error('An error occurred:', err)
    } finally {
        await client.close()
    }
}

main().catch(console.error)

