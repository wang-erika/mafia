export enum Role {
    Villager = "Villager",
    Mafia = "Mafia",
    Detective = "Detective",
    Doctor = "Doctor"
  }
  
  export interface Player {
      id: string;
      name: string;
      role: Role;
      status: "Alive" | "Dead";
      votes: string[];
      killVote: string[];
    }
  
    export interface GameState {
      players: Player[];
      round: number;
      phase: "day" | "night" | "pre-game" | "mafia-win" | "villager-Win";
      hostId: string;
      startTime: string;
      maxPlayers?: number;
      numMafia?: number;
      numVillager?: number;
      roomName?: string;
    }
    
  
  export interface SubscriptionData {
      gameStateChanged: GameState;
  }
  