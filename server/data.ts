import { MongoClient, Collection, Db, ObjectId } from 'mongodb'

export interface Message {
    senderId: string;
    text: string;
    timestamp: Date;
}

export interface Player {
    id: String;
    name: String;
    role: Role;
    status: String;
    votes: String[];
    killVote: String[];
  }
export interface GameState {
  players: Player[];
  round: number;
  phase: String;
}

export enum Role {
  Villager = "Villager",
  Mafia = "Mafia",
  Godfather = "Godfather",
  Detective = "Detective",
  Doctor = "Doctor"
}

const roleCounts = new Map<Role, number>([
  [Role.Villager, 2],
  [Role.Mafia, 2],
  [Role.Doctor, 1],
  [Role.Detective, 1]
]);

export function assignRole(players): Role | null {

}