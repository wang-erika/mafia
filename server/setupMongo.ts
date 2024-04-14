import { MongoClient} from 'mongodb'
import { Message } from './data'
import {GameState} from './model2'


// Connection URL and database name
const url = 'mongodb://127.0.0.1:27017'
const client = new MongoClient(url)

// Example messages data
const messages: Omit<Message, '_id'>[] = [ // Use Omit utility type if the Message type requires _id
    {
        senderId: 'user0',
        text: 'test0!',
        timestamp: new Date(),
    },
    {
        senderId: 'user1',
        text: 'test',
        timestamp: new Date(),
    },
]


  const GameState: GameState =
    {
        players: 
        [
            {
                id: '0',
                name: 'Erika',
                role: 'Mafia',
                status: 'Alive',
                votes: [], // Array of player Ids that this player has voted for
                killVote: [], // Optional property to store the kill vote for Mafia players for each night
            },
            {
                id: '1',
                name: 'Cynthia',
                role: 'Villager',
                status: 'Alive',
                votes: [] // Array of player Ids that this player has voted for
            }
        ],
        hostId: '0', // Identifier of the game host
        round: 0,
        phase: 'night'
    }

async function main() {
    await client.connect();
    console.log('Connected successfully to MongoDB')

    const db = client.db("chatApp")


    // set up unique index for upsert -- to make sure a customer cannot have more than one draft order
    //db.collection('messages').createIndex({ senderId: 1 })

    // add data
    console.log("inserting messages", await db.collection("messages").insertMany(messages as any))


    // checks if game state exists.
    const existingState = await db.collection("GameState").findOne({});
    if (existingState) {
        console.log("A game state already exists. Consider updating it instead of creating a new one.");
        // Optionally, update the existing game state here
    }
    else {
        // Insert new game state as it doesn't exist
        await db.collection("GameState").insertOne(GameState);
    }


    process.exit(0)
}

main()