import { Redis } from "ioredis"
import { createAdapter } from "@socket.io/redis-adapter"

export async function setupRedis() {
	const pubClient = new Redis(process.env.REDIS_URL || undefined)
	const subClient = pubClient.duplicate()	
	
	return {
		socketIoAdapter: createAdapter(pubClient, subClient),
	}
}