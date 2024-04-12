import { MongoClient, Collection, Db, ObjectId } from 'mongodb'

export interface Message {
    senderId: string;
    text: string;
    timestamp: Date;
}

export interface Config {
    numberDays: number
    lengthDay: number
    lengthNight: number
    votingType: string
  }


