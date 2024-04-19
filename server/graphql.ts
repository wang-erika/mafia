// Import gql from apollo-server-express
import { gql } from 'apollo-server-express';
import { Db } from 'mongodb';
import { Player } from './data';



export const typeDefs = gql`
  type Query {
    gameState: GameState
    currentUser: String
  }

  type Mutation {
    castVote(voterId: String!, voteeId: String!): GameState
    nextRoundOrPhase: GameState
    mafiaCastVote(voterId: String!, voteeId: String!): GameState
  }

  type GameState {
    _id: String
    round: Int
    phase: String
    players: [Player]
  }

  type Player {
    id: String!
    name: String!
    role: String!
    status: String!
    votes: [String]!
    killVote: [String]!
  }
`;

interface IContext {
  db: Db;
  user: any;
}


export const resolvers = {
  Query: {
    currentUser: (_parent: any, _args: any, context: IContext) => {
      // Simply return the user from the context if it exists
      if(context.user){
        return context.user.nickname
      }
      else{
        return null
      }
    },
    gameState: async (_parent: any, _args: any, context: IContext) => {
      const gameState = await context.db.collection('GameState').findOne({});
      if (!gameState) {
        return null;
      }

      // Check if a user is signed in
      if (!context.user) {
        // If no user is signed in, return all players with role set to null
        gameState.players = gameState.players.map((player: Player) => ({
          ...player,
          role: "?"
        }));
      } else {
        // Modify the players array to selectively show roles
        gameState.players = gameState.players.map((player: Player) => {
          if (player.status === 'Dead' || player.id === context.user.nickname) {
            return player; // Player is dead or is the current user, show role
          } 
          else {
            return { ...player, role: "?" }; // Hide role for alive players
          }
        });
      }

      return gameState;
    }
  },
  Mutation: {
    castVote: async (_parent: any, { voterId, voteeId }: { voterId: string, voteeId: string }, context: IContext) => {
      const gameState = await context.db.collection('GameState').findOne({});
      if (!gameState) {
        throw new Error("Game state not found");
      }

      if(gameState.phase != "day"){
        throw new Error("Cannot vote during night.");
      }

      // Find the voter and update their votes array
      const voter = gameState.players.find((player: Player) => player.id === voterId);
      if (!voter) {
        throw new Error("Voter not found");
      }
      
      // Add the votee's ID to the voter's votes array
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
    },

    mafiaCastVote: async (_parent: any, { voterId, voteeId }: { voterId: string, voteeId: string }, context: IContext) => {
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
    },


    nextRoundOrPhase: async (_parent: any, { voterId, voteeId }: { voterId: string, voteeId: string }, context: IContext) => {
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

  }
};
