////  Data Model

export interface Player {
    id: string;
    name: string;
    role: Role;
    status: Status;
    votes: string[]; // Array of player Ids that this player has voted for
    killVote?: String[]; // Optional property to store the kill vote for Mafia players for each night
  }
  
  export type Status = "Alive" | "Dead";
  
  export type Role = "Mafia" | "Villager";
  
  export type GamePhase = "pre-game" | "night" | "day" | "game-over";
  
  export interface GameState {
    players: Player[];
    hostId: String; // Identifier of the game host
    round: number;
    phase: GamePhase;
  }

  export interface Action { // actions that will be saved to the database
    playerId: string; // The ID of the player who took the action
    targetId?: string; // The ID of the player who was targeted by the action, if applicable
    type: string; // The type of action, e.g., "vote", "kill"
    round: number; // The game round in which the action took place
    phase: GamePhase;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////
  // Functions


  export function createEmptyGame(player: Player): GameState {
    return {
      players: [player], // Adds the host as the first player
      hostId: player.id,
      round: 0, // Consider starting at round 0 in the pregame phase
      phase: "pre-game",
    };
  }

  export function joinGame(gameState: GameState, player: Player): GameState {
    if (gameState.phase === "pre-game") {
      gameState.players.push(player);
      console.log(`${player.name} has joined the game.`);
    } else {
      console.log(`Cannot join; the game is already in progress.`);
    }
    return gameState;
  }


  export function startGame(gameState: GameState, player: Player): void {
    if(player.id == gameState.hostId){
        initializeRoles(gameState.players);
        gameState.phase = "night";
        gameState.round = 1;
        console.log(`The game has started with ${gameState.players.length} players.`);
    }
    else {
      console.log(`Host has not started the game.`);
    }
  }




  
  