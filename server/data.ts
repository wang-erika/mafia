import { MongoClient, Collection, Db, ObjectId } from 'mongodb'

export interface Message {
    senderId: string;
    text: string;
    timestamp: Date;
}


