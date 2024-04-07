export interface Player {
  id: number;
  name: string;
  role: Role;
  status: Status;
  votes: string[]; // Array of player names that this player has voted for
}

export type Status = "Alive" | "Dead";

export type Role = "Mafia" | "Villager";

export type GamePhase = "night" | "day" | "game-over";

export interface GameState {
  playerNames: Player[];
  round: number; // round refers to day 1, night 1, etc
  phase: GamePhase;
}




