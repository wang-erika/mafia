// Import gql from apollo-server-express
import { gql } from 'apollo-server-express';
import { Db } from 'mongodb';
import { GameState } from './data';


export const typeDefs = gql`
  type Query {
    gameState: GameState
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
// Assuming you have a specific context type for passing database access
interface IContext {
  db: Db;
}

export const resolvers = {
  Query: {
      gameState: async (_parent: any, _args: any, context: IContext) => {
          // Assuming there's one game state object or you manage which to fetch
          return await context.db.collection('GameState').findOne({});
      }
  }
};