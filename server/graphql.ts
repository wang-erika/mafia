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

interface IContext {
  db: Db;
}

export const resolvers = {
  Query: {
      gameState: async (_parent: any, _args: any, context: IContext) => {
          return await context.db.collection('GameState').findOne({});
      }
  }
};