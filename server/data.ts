import { MongoClient, Collection, Db, ObjectId } from 'mongodb'

export interface Message {
    senderId: string;
    text: string;
    timestamp: Date;
}

export interface Player {
    id: String;
    name: String;
    role: String;
    status: String;
    votes: String[]; // Array of player Ids that this player has voted for
    killVote: String[]; // Optional property to store the kill vote for Mafia players for each night
  }
  export interface GameState {
    players: Player[];
    round: number;
    phase: String;
  }
