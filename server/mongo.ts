import { MongoClient, ObjectId } from "mongodb"
// import { createAdapter } from "@socket.io/mongo-adapter"
import { GameState, createEmptyGame } from "./model"

const DB = "game"
// const SOCKET_IO_EVENTS_COLLECTION = "socket.io-adapter-events"
const GAMES_COLLECTION = "games"
const GAME_STATE_ID = new ObjectId("000000000000000000000000")

export interface MongoGameState extends GameState {
	_id: ObjectId
	version: number
}

export async function setupMongo() {
	// const mongoClient = new MongoClient(process.env.MONGO_URL || "mongodb://localhost/?replicaSet=rs0")
	const mongoClient = new MongoClient(process.env.MONGO_URL || "mongodb://localhost/")
	await mongoClient.connect()
	
	// try {
	// 	await mongoClient.db(DB).createCollection(SOCKET_IO_EVENTS_COLLECTION, {
	// 		capped: true,
	// 		size: 1e6
	// 	})
	// } catch (e) {
	// 	// collection already exists; ignore
	// }

	const db = mongoClient.db(DB)
	// const socketIoEventsCollection = db.collection(SOCKET_IO_EVENTS_COLLECTION)
	const gamesCollection = db.collection(GAMES_COLLECTION)
	try {
		await gamesCollection.insertOne({ _id: GAME_STATE_ID, version: 0, ...createEmptyGame(["player1", "player2"], 2, 2) })
	} catch (e) {
		// ignore
	}

	return {
		// socketIoEventsCollection,
		gamesCollection,
		// socketIoAdapter: createAdapter(socketIoEventsCollection),
		getGameState: async () => {
			return await gamesCollection.findOne({ _id: GAME_STATE_ID }) as unknown as MongoGameState
		},
		tryToUpdateGameState: async (newGameState: MongoGameState) => {
			const result = await gamesCollection.replaceOne(
				{ _id: GAME_STATE_ID, version: newGameState.version },
				{ ...newGameState, version: newGameState.version + 1 },
			)
			if (result.modifiedCount > 0) {
				++newGameState.version
				return true
			} else {
				return false
			}
		},
	}
}