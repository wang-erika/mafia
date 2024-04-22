// Resolvers.ts

import { Player, GameState } from '../data'; // Import types as necessary
import { Db } from 'mongodb';
import { PubSub } from 'graphql-subscriptions';
import { assignRole } from '../data';
import e from 'express';

interface IContext {
  db: Db;
  user: any;
}

export const pubSub = new PubSub();

const GAME_STATE_CHANGED = 'GAME_STATE_CHANGED';
const START_TIME_UPDATED = 'START_TIME_UPDATED';

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

async function filterPlayerRoles(players: Player[], currentUser: Player){
  return players.map((player: Player) => {
    if(player.id === currentUser.id){
      return player;
    }
    if(player.role === "Mafia" && currentUser.role === "Mafia"){
      return player;
    }
    if (player.status === 'Dead') {
      return player; // Show or hide roles for dead players based on game rules
    }
    return { ...player, role: "?" }; // Hide role for others
  })

}
/*
  Queries for the GameState in the current database. Will limit information shown to users.
*/
async function gameState(_parent: any, _args: any, context: IContext) {
  const gameState = await context.db.collection('GameState').findOne({});
  if (!gameState) {
    return null;
  }
  // Check if the user is authenticated
  if (!context.user) {
    gameState.players = gameState.players.map((player: Player) => ({
      ...player,
      role: "?"
    }));
  } 

  else{
    const currentUser = gameState.players.find((player: Player) => player.id === context.user.nickname);
    if(!currentUser){
      gameState.players = gameState.players.map((player: Player) => ({
        ...player,
        role: "?"
      }));
    }
    else{
      gameState.players = await(filterPlayerRoles(gameState.players, currentUser));
    }
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
    throw new Error("Cannot vote now.");
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
  if (votee) {
    if (votee.status === "Dead") {
      throw new Error("Cannot vote for a dead player.");
    }
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

  //pubSub.publish(GAME_STATE_CHANGED, { gameStateChanged: gameState });
  //return gameState
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
  if (votee) {
    if (votee.status === "Dead") {
      throw new Error("Cannot vote for a dead player.");
    }
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


  //pubSub.publish(GAME_STATE_CHANGED, { gameStateChanged: gameState });
}


/*
  Calculates who was the most voted during the last daytime phase
*/
async function calculateMostVoted(gameState: any): Promise<string | null> {
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

  return mostVotedPlayerId; // Return the player ID with the most votes
}

/*
  Calculates who was the most voted during the last nighttime phase
*/
async function calculateMafiaMostVoted(gameState: any): Promise<string | null> {
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
  return mostVotedPlayerId; // Return the player ID with the most kill votes
}


async function checkGameEndCondition(gameState: any): Promise<String | null> {
  let mafiaCount = 0;
  let villagerCount = 0;

  gameState.players.forEach((player: Player) => {
    if (player.status !== 'Dead') {
      if (player.role === 'Mafia') {
        mafiaCount++;
      }
      else if (player.role === 'Villager') {
        villagerCount++;
      }
    }
  });

  if (mafiaCount >= villagerCount) {
    return "mafia-win"
  }
  else if (mafiaCount === 0){
    return "villager-win"
  }
  return null;
}


/*
  Progresses game to the next phase/round. Updates player statuses based on votes. 
  */
async function nextRoundOrPhase(_parent: any, args: any, context: IContext) {

  
  const gameState = await context.db.collection('GameState').findOne({});

  if (!gameState) {
    throw new Error("Game state not found");
  }

  if (context.user.nickname !== gameState.hostId) {
    throw new Error("Only the host can move to next round");
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

    const toKill = await(calculateMostVoted(gameState));

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
    gameState.phase = "night"
    gameState.round = gameState.round + 1

    const endMessage = await(checkGameEndCondition(gameState))

    if (endMessage) {
      gameState.phase = endMessage
      await context.db.collection('GameState').updateOne(
        { _id: gameState._id },
        { $set: { phase: endMessage } },
      );
    }

    else{    // Update game state with the new player status and move to the next round
      await context.db.collection('GameState').updateOne(
        { _id: gameState._id },
        {
          $set: {
            players: gameState.players,
            round: gameState.round, 
            phase: gameState.phase
          }
        }
      );
    }
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

    const toKill = await(calculateMafiaMostVoted(gameState));

    if (toKill) {
      // Update the status of the player with the most votes to 'dead'
      gameState.players = gameState.players.map((player: Player) => {
        if (player.id === toKill) {

          return { ...player, status: 'Dead' };
        }
        return player;
      });
    }

    gameState.phase = "day"
    

    const endMessage = await(checkGameEndCondition(gameState))

    if (endMessage) {
      gameState.phase = endMessage
      await context.db.collection('GameState').updateOne(
        { _id: gameState._id },
        { $set: { phase: endMessage } },
      );
    }
    // Update game state with the new player status and move to the next round
    else{
      await context.db.collection('GameState').updateOne(
        { _id: gameState._id },
        {
          $set: {
            players: gameState.players,
            round: gameState.round, 
            phase: gameState.phase
          }
        }
      );
    }
  }

  else if (gameState.phase === 'pre-game') {
    gameState.phase = "night"
    gameState.round = 1


    const endMessage = await(checkGameEndCondition(gameState))

    if (endMessage) {
      gameState.phase = endMessage
      await context.db.collection('GameState').updateOne(
        { _id: gameState._id },
        { $set: { phase: endMessage } },
      );
    }

    else{
      await context.db.collection('GameState').updateOne(
        { _id: gameState._id },
        { $set: { round: gameState.round, phase: gameState.phase } },
      );
    }

  }

  // Check if the user is authenticated
  if (!context.user) {
    gameState.players = gameState.players.map((player: Player) => ({
      ...player,
      role: "?"
    }));
  } 

  else{
    const currentUser = gameState.players.find((player: Player) => player.id === context.user.nickname);
    if(!currentUser){
      gameState.players = gameState.players.map((player: Player) => ({
        ...player,
        role: "?"
      }));
    }
    else{
      gameState.players = await(filterPlayerRoles(gameState.players, currentUser));
    }
  }


  pubSub.publish(GAME_STATE_CHANGED, { gameStateChanged: gameState });
}

async function createGame(_parent: any, _args: any, context: IContext) {
  if (!context.user.groups.includes("mafia-admin")) {
    throw new Error("Only admins can create a game.");
  }
  console.log()
  const newRole = assignRole([], 2, 4);
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
    phase: 'pre-game',
    players: [newHost] as Player[],
    hostId: newHost.id,
    numMafia: 2,
    numVillager: 4,
    maxPlayers: 6
  };
  const result = await context.db.collection('GameState').insertOne(newGame);
  return await context.db.collection('GameState').findOne({ _id: result.insertedId });
}

async function addPlayerToGame(_parent: any, { playerId }: { playerId: String }, context: IContext) {
  const gameState = await context.db.collection('GameState').findOne({})
  console.log("maf", gameState.numVillager);
  console.log("vil", gameState.numMafia);

  if (!gameState) {
    throw new Error("Game not found");
  }

  if (gameState.players.length >= gameState.maxPlayers) {
    throw new Error("Max Players reached!")
  }

  const playerExists = gameState.players.some((player: Player) => player.id === playerId);
  if (playerExists) {
    return gameState
  }

  const newRole = assignRole(gameState.players, gameState.numMafia, gameState.numVillager)
  console.log(newRole);

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

async function updateGameSettings(_parent: any, { numMafia, numVillager, roomName, maxPlayers }: { numMafia: number, numVillager: number, roomName: String, maxPlayers: number }, context: IContext) {
  const gameState = await context.db.collection('GameState').findOne({})
  if (!gameState) {
    throw new Error("Game not found")
  }
  if (context.user.nickname !== gameState.hostId) {
    throw new Error("Only the host can change game settings");
  }

  const updateDoc = {
    numMafia: numMafia,
    numVillager: numVillager,
    roomName: roomName,
    maxPlayers: maxPlayers
  };

  await context.db.collection('GameState').updateOne(
    { _id: gameState._id },
    { $set: updateDoc }
  );

  return await context.db.collection('GameState').findOne({ _id: gameState._id });
}

async function setStartTime(_parent: any, { startTime }: { startTime: string }, context: IContext) {

  if(startTime){
    try {
      const gameState = await context.db.collection('GameState').findOne({})
      gameState.startTime = startTime
      await context.db.collection('GameState').updateOne(
        { _id: gameState._id },
        { $set: { startTime: gameState.startTime } }
      );
      return await context.db.collection('GameState').findOne({ _id: gameState._id });
    } 
    catch (error) {
      console.error('Database operation failed:', error);
      throw new Error('Failed to update the database.');
    } 
  }
  else{
    throw new Error("No starttime.")
  }

}

export const resolvers = {
  Query: {
    currentUser,
    gameState,
  },
  Mutation: {
    castVote,
    mafiaCastVote,
    nextRoundOrPhase,
    createGame,
    addPlayerToGame,
    updateGameSettings,
    setStartTime
  },
  Subscription: {
    startTimeUpdated: {
      subscribe: () => pubSub.asyncIterator([START_TIME_UPDATED])
    },
    gameStateChanged: {
      subscribe: () => pubSub.asyncIterator([GAME_STATE_CHANGED])
    },
  }
};

export { castVote, mafiaCastVote, nextRoundOrPhase, currentUser, gameState, createGame, addPlayerToGame, updateGameSettings, setStartTime };