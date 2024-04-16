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
  Detective = "Detective",
  Doctor = "Doctor"
}

export function assignRole(players: Player[]): Role | null {
  const roleCounts = new Map<Role, number>([
    [Role.Villager, 2],
    [Role.Mafia, 2],
    [Role.Doctor, 1],
    [Role.Detective, 1]
  ]);
  players.forEach(player => {
    if (player.role && roleCounts.has(player.role)) {
      const currentCount = roleCounts.get(player.role) ?? 0;
      roleCounts.set(player.role, Math.max(0, currentCount - 1));
    }
  });
  const availableRoles: Role[] = [];
  roleCounts.forEach((count, role) => {
    for (let i = 0; i < count; i++) {
      availableRoles.push(role)
    }
  })
  const randomIndex = Math.floor(Math.random() * availableRoles.length);
  const selectedRole = availableRoles[randomIndex];
  return selectedRole;
}