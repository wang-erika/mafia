// Import gql from apollo-server-express
import { gql } from 'apollo-server-express';
import { Db } from 'mongodb';
import { castVote, mafiaCastVote, nextRoundOrPhase, currentUser, gameState, createGame, addPlayerToGame, updateGameSettings, setStartTime } from './Resolvers';


export const typeDefs = gql`
  type Query {
    gameState: GameState
    currentUser: String
  }

  type Mutation {
    castVote(voterId: String!, voteeId: String!): GameState
    nextRoundOrPhase: GameState
    mafiaCastVote(voterId: String!, voteeId: String!): GameState
    createGame: GameState
    addPlayerToGame(playerId: String!): GameState
    updateGameSettings(dayLength: Int, nightLength: Int, roomName: String): GameState
    setStartTime(time:String!):GameState
  }

  type GameState {
    _id: String
    round: Int
    phase: String
    startTime: String
    players: [Player]
    hostId: String
    dayLength: Int
    nightLength: Int
    roomName: String
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
    createGame,
    addPlayerToGame,
    updateGameSettings,
    setStartTime

  },
};
