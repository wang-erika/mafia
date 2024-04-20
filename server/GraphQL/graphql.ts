// Import gql from apollo-server-express
import { gql } from 'apollo-server-express';
import { Db } from 'mongodb';
import { setPubSub, castVote, mafiaCastVote, nextRoundOrPhase, currentUser, gameState, createGame, addPlayerToGame, updateGameSettings, setStartTime } from './Resolvers';
import { PubSub } from 'graphql-subscriptions';


const pubsub = new PubSub();
setPubSub(pubsub);
const GAME_STATE_CHANGED = 'GAME_STATE_CHANGED';
const START_TIME_UPDATED = 'START_TIME_UPDATED';


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

  type Subscription {
    gameStateChanged: GameState
    startTimeUpdated : GameState
  }

  type GameState {
    _id: String
    round: Int
    phase: String
    players: [Player]
    hostId: String
    dayLength: Int
    nightLength: Int
    roomName: String
    startTime: String
  }

  type Player {
    id: String!
    name: String!
    role: String!
    status: String!
    votes: [String]!
    killVote: [String]!
  }

<<<<<<< HEAD
`;
=======
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
    gameStateChanged: {
      subscribe: () => pubsub.asyncIterator([GAME_STATE_CHANGED])
    },
    startTimeUpdated: {
      subscribe: () => pubsub.asyncIterator([START_TIME_UPDATED])
    }
  },
};
>>>>>>> 5bcbe51c (added subscription for startTime)
