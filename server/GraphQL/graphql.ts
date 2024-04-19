// Import gql from apollo-server-express
import { gql } from 'apollo-server-express';
import { Db } from 'mongodb';
import { Player } from '../data';
import { castVote, mafiaCastVote, nextRoundOrPhase, currentUser, gameState } from './Resolvers';


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
    hostId: String
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
    currentUser,
    gameState,
  },
  Mutation: {
    castVote,
    mafiaCastVote,
    nextRoundOrPhase,
  },
};
