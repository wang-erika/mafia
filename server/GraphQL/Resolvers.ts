// Resolvers.ts

import { Player, GameState } from '../data'; // Import types as necessary
import { Db } from 'mongodb';
import { assignRole } from '../data';

interface IContext {
  db: Db;
  user: any;
}



// Query

/*
  Queries for the current user and returns their "nickname".
*/
async function currentUser(_parent: any, _args: any, context: IContext) {
  // Simply return the user from the context if it exists
  if (context.user) {
    return context.user.nickname;  // assuming `nickname` is the desired user identifier
  } else {
    return null;
  }
}

/*
  Queries for the GameState in the current database. Will limit information shown to users.
*/
async function gameState(_parent: any, _args: any, context: IContext) {
  const gameState = await context.db.collection('GameState').findOne({});
  if (!gameState) {
    return null;
  }

  if (!context.user) {
    gameState.players = gameState.players.map((player: Player) => ({
      ...player,
      role: "?"
    }));
  } else {
    gameState.players = gameState.players.map((player: Player) => {
      if (player.status === 'Dead' || player.id === context.user.nickname) {
        return player;  // Show role if player is dead or is the current user
      } else {
        return { ...player, role: "?" };  // Hide role for alive players
      }
    });
  }

  return gameState;
}


// Mutations

/*
  Takes a voterId and a voteeId and casts a daytime vote from the voter -> votee. 
*/
async function castVote(_parent: any, { voterId, voteeId }: { voterId: string, voteeId: string }, context: IContext) {
  const gameState = await context.db.collection('GameState').findOne({});
  if (!gameState) {
    throw new Error("Game state not found");
  }

  // Check if it's the right phase to vote
  if (gameState.phase !== "day") {
    throw new Error("Cannot vote during night.");
  }

  // Find the voter and ensure they are alive
  const voter = gameState.players.find((player: Player) => player.id === voterId);
  if (!voter) {
    throw new Error("Voter not found");
  }
  if (voter.status === "Dead") {
    throw new Error("Cannot vote when dead.");
  }

  // Find the votee and check their status
  const votee = gameState.players.find((player: Player) => player.id === voteeId);
  if (!votee) {
    throw new Error("Votee not found");
  }
  if (votee.status === "Dead") {
    throw new Error("Cannot vote for a dead player.");
  }

  // Check if the voter has already voted this round
  if (voter.votes.length < gameState.round) {
    voter.votes.push(voteeId);
  } else {
    throw new Error("You have already voted this round.");
  }

  // Update the game state in the database
  await context.db.collection('GameState').updateOne(
    { _id: gameState._id },
    { $set: { players: gameState.players } }
  );

  return gameState;
}


/*
  Takes a voterId and a voteeId and casts a nighttime vote from the voter -> votee. 
*/
async function mafiaCastVote(_parent: any, { voterId, voteeId }: { voterId: string, voteeId: string }, context: IContext) {
  const gameState = await context.db.collection('GameState').findOne({});
  if (!gameState) {
    throw new Error("Game state not found");
  }

  if (gameState.phase !== "night") {
    throw new Error("Cannot cast mafia votes during the day.");
  }

  // Find the voter and validate their status and role
  const voter = gameState.players.find((player: Player) => player.id === voterId);
  if (!voter) {
    throw new Error("Voter not found");
  }
  if (voter.role !== "Mafia") {
    throw new Error("Only Mafia can vote at night.");
  }
  if (voter.status === "Dead") {
    throw new Error("Cannot vote when dead.");
  }

  // Find the votee and check their status
  const votee = gameState.players.find((player: Player) => player.id === voteeId);
  if (!votee) {
    throw new Error("Votee not found");
  }
  if (votee.status === "Dead") {
    throw new Error("Cannot vote for a dead player.");
  }

  // Check if the voter has already voted this round
  if (voter.killVote.length < gameState.round) {
    voter.killVote.push(voteeId);
  } else {
    throw new Error("You have already voted this round.");
  }

  // Update the game state in the database
  await context.db.collection('GameState').updateOne(
    { _id: gameState._id },
    { $set: { players: gameState.players } }
  );

  return gameState;
}


/*
  Calculates who was the most voted during the last daytime phase
*/
function calculateMostVoted(gameState: any): string | null {
  const voteCounts: Record<string, number> = {}; // A record to keep track of votes for each player
  const currentRoundIndex = gameState.round - 1; // Index for the current round's votes

  // Iterate over each player to tally votes from the current round
  gameState.players.forEach((player: Player) => {
    if (player.status === "Alive") {
      const voteId = player.votes[currentRoundIndex]; // Get the vote from the current round
      if (voteId !== null) {
        if (voteCounts[voteId]) {
          voteCounts[voteId]++;
        } else {
          voteCounts[voteId] = 1;
        }
      }
    }
  });

  // Find the player with the maximum number of votes
  let maxVotes = -1;
  let mostVotedPlayerId: string | null = null;

  for (const [playerId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      mostVotedPlayerId = playerId;
    } else if (count === maxVotes) {
      // If there's a tie, set mostVotedPlayerId to null or handle differently
      mostVotedPlayerId = null;
    }
  }
  console.log("most voted player: ", mostVotedPlayerId)

  return mostVotedPlayerId; // Return the player ID with the most votes
}

/*
  Calculates who was the most voted during the last nighttime phase
*/
function calculateMafiaMostVoted(gameState: any): string | null {
  const voteCounts: Record<string, number> = {}; // A record to keep track of votes for each player
  const currentRoundIndex = gameState.round - 1; // Index for the current round's votes

  // Iterate over each player to tally votes from the current round
  gameState.players.forEach((player: Player) => {
    if (player.role === "Mafia" && player.status === "Alive") {
      const voteId = player.killVote[currentRoundIndex]; // Get the vote from the current round
      if (voteId !== null) {
        if (voteCounts[voteId]) {
          voteCounts[voteId]++;
        } else {
          voteCounts[voteId] = 1;
        }
      }
    }
  }
  )

  // Find the player with the maximum number of kill votes
  let maxVotes = -1;
  let mostVotedPlayerId: string | null = null;

  // for ties, just picks the last person that was voted for
  for (const [playerId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      mostVotedPlayerId = playerId;
    }
  }
  console.log("most voted mafia player: ", mostVotedPlayerId)
  return mostVotedPlayerId; // Return the player ID with the most kill votes
}

/*
  Progresses game to the next phase/round. Updates player statuses based on votes. 
  */
async function nextRoundOrPhase(_parent: any, args: any, context: IContext) {
  const gameState = await context.db.collection('GameState').findOne({});
  if (!gameState) {
    throw new Error("Game state not found");
  }

  // if the current phase is day, check who was voted for the most and kill them (if not a tie or null).
  // then change the phase to "night" and increment the round.
  if (gameState.phase === 'day') {

    // Ensure every player has a vote recorded for this round, even if it's an empty vote
    gameState.players.forEach((player: Player) => {
      if (player.votes.length < gameState.round) {
        player.votes.push(""); // Push an empty string to indicate no vote was made
      }
    });

    const toKill = calculateMostVoted(gameState);

    // if toKill returned a valid playerId and not an empty string
    if (toKill) {
      // Update the status of the player with the most votes to 'dead'
      gameState.players = gameState.players.map((player: Player) => {
        if (player.id === toKill) {
          return { ...player, status: 'Dead' };
        }
        return player;
      });
    }

    // Update game state with the new player status and move to the next round
    await context.db.collection('GameState').updateOne(
      { _id: gameState._id },
      {
        $set: {
          players: gameState.players,
          round: gameState.round + 1,
          phase: 'night'
        }
      }
    );
  }

  // if the current phase is night, check who was voted for the most by the mafia and kill them.
  // then change the phase to "day". 
  else if (gameState.phase === 'night') {

    // Ensure every player has a vote recorded for this round, even if it's an empty vote
    gameState.players.forEach((player: Player) => {
      if (player.role === "Mafia") {
        if (player.killVote.length < gameState.round) {
          player.killVote.push(""); // Push an empty string to indicate no vote was made
        }
      }
    });

    const toKill = calculateMafiaMostVoted(gameState);
    console.log("Killed Tonight: ", toKill)

    if (toKill) {
      // Update the status of the player with the most votes to 'dead'
      gameState.players = gameState.players.map((player: Player) => {
        if (player.id === toKill) {

          return { ...player, status: 'Dead' };
        }
        return player;
      });
    }

    // Update game state with the new player status and move to the next round
    await context.db.collection('GameState').updateOne(
      { _id: gameState._id },
      {
        $set: {
          players: gameState.players,
          round: gameState.round,
          phase: 'day'
        }
      }
    );
  }

  else if (gameState.phase === 'pre-game') {
    await context.db.collection('GameState').updateOne(
      { _id: gameState._id },
      { $set: { round: 1, phase: 'night' } },
    );
  }

  return await context.db.collection('GameState').findOne({});
}

async function createGame(_parent: any, _args: any, context: IContext) {
  const newRole = assignRole([])
  const newHost = {
    id: context.user.nickname,
    name: context.user.name,
    role: newRole,
    status: "Alive",
    votes: [] as String[],
    killVote: [] as String[]
  };
  const newGame = {
    round: 0,
    phase: 'day',
    players: [newHost] as Player[],
    hostId: newHost.id
  };
  const result = await context.db.collection('GameState').insertOne(newGame);
  return await context.db.collection('GameState').findOne({ _id: result.insertedId });
}

async function addPlayerToGame(_parent: any, { playerId }: { playerId: String }, context: IContext) {
  const gameState = await context.db.collection('GameState').findOne({})
  if (!gameState) {
    throw new Error("Game not found");
  }

  const playerExists = gameState.players.some((player: Player) => player.id === playerId);
  if (playerExists) {
    return gameState
  }
  const newRole = assignRole(gameState.players)

  const newPlayer = {
    id: context.user.nickname,
    name: context.user.name,
    role: newRole,
    status: "Alive",
    votes: [] as String[],
    killVote: [] as String[]
  };

  gameState.players.push(newPlayer);

  await context.db.collection('GameState').updateOne(
    { _id: gameState._id },
    { $set: { players: gameState.players } }
  );

  return gameState;
}

async function updateGameSettings(_parent: any, { dayLength, nightLength, roomName }: { dayLength: number, nightLength: number, roomName: String }, context: IContext) {
  const gameState = await context.db.collection('GameState').findOne({})
  console.log(gameState)
  if (!gameState) {
    throw new Error("Game not found")
  }
  if (context.user.nickname !== gameState.hostId) {
    throw new Error("Only the host can change game settings");
  }

  const updateDoc = {
    dayLength: dayLength,
    nightLength: nightLength,
    roomName: roomName
  };

  await context.db.collection('GameState').updateOne(
    { _id: gameState._id },
    { $set: updateDoc }
  );

  return await context.db.collection('GameState').findOne({ _id: gameState._id });
}

export { castVote, mafiaCastVote, nextRoundOrPhase, currentUser, gameState, createGame, addPlayerToGame, updateGameSettings };
