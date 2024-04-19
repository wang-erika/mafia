// Resolvers.ts

import { Player } from '../data'; // Import types as necessary
import { Db } from 'mongodb';

interface IContext {
    db: Db;
    user: any;
  }
  


// Query
async function currentUser(_parent: any, _args: any, context: IContext) {
  // Simply return the user from the context if it exists
  if (context.user) {
    return context.user.nickname;  // assuming `nickname` is the desired user identifier
  } else {
    return null;
  }
}

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

async function castVote(_parent: any, { voterId, voteeId }: { voterId: string, voteeId: string }, context: IContext) {
  const gameState = await context.db.collection('GameState').findOne({});
  if (!gameState) {
    throw new Error("Game state not found");
  }

  if(gameState.phase != "day"){
    throw new Error("Cannot vote during night.");
  }

  const voter = gameState.players.find((player: Player) => player.id === voterId);
  if (!voter) {
    throw new Error("Voter not found");
  }
  
  if (voter.votes.length < gameState.round) {
    voter.votes.push(voteeId);
  } else {
    throw new Error("You have already voted this round.");
  }

  await context.db.collection('GameState').updateOne(
    { _id: gameState._id },
    { $set: { players: gameState.players } }
  );

  return gameState;
}

async function mafiaCastVote(_parent: any, { voterId, voteeId }: { voterId: string, voteeId: string }, context: IContext) {
    const gameState = await context.db.collection('GameState').findOne({});
      if (!gameState) {
        throw new Error("Game state not found");
      }

      if(gameState.phase != "night"){
        throw new Error("Cannot cast mafia votes during the day.");
      }


      // Find the voter and update their votes array
      const voter = gameState.players.find((player: Player) => player.id === voterId);
      if (!voter) {
        throw new Error("Voter not found");
      }
      if(voter.role != "Mafia"){
        throw new Error("Only Mafia can vote at night.")
      }
      
      // Add the votee's ID to the voter's votes array
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

async function nextRoundOrPhase(_parent: any, args: any, context: IContext) {
    const gameState = await context.db.collection('GameState').findOne({});
      if (!gameState) {
        throw new Error("Game state not found");
      }

      if(gameState.phase === 'day'){
        await context.db.collection('GameState').updateOne(
          { _id: gameState._id },
          { $set: { round: gameState.round + 1, phase: 'night'} },  
        );
      }

      
      else if (gameState.phase === 'night'){
        await context.db.collection('GameState').updateOne(
          { _id: gameState._id },
          { $set: { phase: 'day'} },  
        );
      }

      else if (gameState.phase === 'pre-game'){
        await context.db.collection('GameState').updateOne(
          { _id: gameState._id },
          { $set: { round: 1, phase: 'night'} },  
        );
      }
      
      return await context.db.collection('GameState').findOne({});

}

export { castVote, mafiaCastVote, nextRoundOrPhase, currentUser, gameState };
