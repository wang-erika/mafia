// Import gql from apollo-server-express
import { gql } from 'apollo-server-express';
import { Db } from 'mongodb';


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
    updateGameSettings(dayLength: Int, nightLength: Int, roomName: String, maxPlayers: Int): GameState
    setStartTime(startTime:String!):GameState
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
    startTime: String,
    maxPlayers: Int
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
