// Import gql from apollo-server-express
import { gql } from 'apollo-server-express';
import { Db } from 'mongodb';
import { Player } from './data';



export const typeDefs = gql`
  type Query {
    gameState: GameState
  }

  type Mutation {
    castVote(voterId: String!, voteeId: String!): GameState
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

      // Find the voter and update their votes array
      const voter = gameState.players.find((player: Player) => player.id === voterId);
      if (!voter) {
        throw new Error("Voter not found");
      }
      
      // Add the votee's ID to the voter's votes array
      if (voter.votes.length < gameState.round) {
        voter.votes.push(voteeId);
      } else {
        throw new Error("Cannot cast more votes than the current round number");
      }

      // Update the game state in the database
      await context.db.collection('GameState').updateOne(
        { _id: gameState._id },
        { $set: { players: gameState.players } }
      );

      return gameState;
    }
  }
};
