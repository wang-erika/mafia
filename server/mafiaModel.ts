////////////////////////////////////////////////////////////////////////////////////////////
// data model for players

export interface Player {
  id: number;
  name: string;
  role: Role;
  status: Status;
  votes: String[];
}

export type Status = "Alive" | "Dead"

export type Role = "Mafia" | "Villager"

//export const players: Player[] = [];

export type GamePhase = "night" | "day" | "game-over"

export interface GameState {
  playerNames: Player[];
  round: number; // round refers to day 1, night 1, etc
  phase: GamePhase
}



