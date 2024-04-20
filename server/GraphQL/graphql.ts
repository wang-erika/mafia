// Import gql from apollo-server-express
import { gql } from 'apollo-server-express';
import { Db } from 'mongodb';
import { setPubSub, castVote, mafiaCastVote, nextRoundOrPhase, currentUser, gameState, createGame, addPlayerToGame, updateGameSettings, setStartTime } from './Resolvers';
import { PubSub } from 'graphql-subscriptions';


const pubsub = new PubSub();
setPubSub(pubsub);
interface IContext {
  db: Db;
  user: any;
}
const GAME_STATE_CHANGED = 'GAME_STATE_CHANGED';



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

`;
