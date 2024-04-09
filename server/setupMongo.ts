import { MongoClient} from 'mongodb'
import { Message } from './data'


// Connection URL and database name
const url = 'mongodb://127.0.0.1:27017'
const client = new MongoClient(url)

// Example messages data
const messages: Omit<Message, '_id'>[] = [ // Use Omit utility type if the Message type requires _id
    {
        senderId: 'user0',
        text: 'Hello, World!',
        timestamp: new Date(),
    },
    {
        senderId: 'user1',
        text: 'Hi there!',
        timestamp: new Date(),
    },
]

async function main() {
        await client.connect();
        console.log('Connected successfully to MongoDB')

        const db = client.db("chatApp")
  
        // set up unique index for upsert -- to make sure a customer cannot have more than one draft order
        db.collection('messages').createIndex({ senderId: 1 })

        // add data
        console.log("inserting messages", await db.collection("messages").insertMany(messages as any))
        
        process.exit(0)
}

main()

