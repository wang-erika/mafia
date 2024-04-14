////  Data Model

export interface Player {
  id: String;
  name: String;
  role: Role;
  status: Status;
  votes: String[]; // Array of player Ids that this player has voted for
  killVote?: String[]; // Optional property to store the kill vote for Mafia players for each night
}

export type Status = "Alive" | "Dead";

export type Role = "Mafia" | "Villager";

export type GamePhase = "pre-game" | "night" | "day" | "game-over";

export interface GameState {
  //gameId: String;
  players: Player[];
  hostId: String; // Identifier of the game host
  round: number;
  phase: GamePhase;
}

export interface Action { // actions that will be saved to the database
  //gameId: String;
  playerId: String; // The ID of the player who took the action
  targetId?: String; // The ID of the player who was targeted by the action, if applicable
  type: String; // The type of action, e.g., "vote", "kill"
  round: number; // The game round in which the action took place
  phase: GamePhase;
}

/////////////////////////////////////////////////////////////////////////////////////////////
// Functions

// get players name and status and returns in an array
export function getPlayerListAndStatus(gameState: GameState): Array<{ name: String, status: Status }> {
  return gameState.players.map(player => ({
    name: player.name,
    status: player.status
  }));
}

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

export function initializeRoles(players: Player[]): void {
  const totalPlayers = players.length;
  const numberOfMafia = Math.floor(totalPlayers / 3); // Adjust the ratio as needed
  const roles: Role[] = [];

  // Add Mafia roles
  for (let i = 0; i < numberOfMafia; i++) {
    roles.push("Mafia");
  }

  // Fill the rest with Villagers
  while (roles.length < totalPlayers) {
    roles.push("Villager");
  }

  // Shuffle the roles array to randomize role assignment
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]]; // Swap elements
  }

  // Assign roles to players
  for (let i = 0; i < totalPlayers; i++) {
    players[i].role = roles[i];
  }
}

  
  