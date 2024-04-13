import { gql } from 'apollo-server';
import { GameState, startGame } from './model2';

export const typeDefs = gql`
  enum Status {
    Alive
    Dead
  }

  enum Role {
    Mafia
    Villager
  }

  enum GamePhase {
    pre_game
    night
    day
    game_over
  }

  type Player {
    id: String!
    name: String!
    role: Role!
    status: Status!
    votes: [String]!
    killVote: [String]
  }

  type GameState {
    players: [Player!]!
    hostId: String!
    round: Int!
    phase: GamePhase!
  }

  type Query {
    gameState: GameState
  }

  type Mutation {
    startGame(playerInput: PlayerInput!): GameState
  }

  input PlayerInput {
    id: String!
    name: String!
    role: Role!
    status: Status!
    votes: [String]!
    killVote: [String]
  }
`;


// export const resolvers = {
//     Query: {
//       gameState: async (_, __, { db }) => {
//         // Fetch the current game state
//         return await db.collection('GameState').findOne({});
//       }
//     },
//     Mutation: {
//       startGame: async (_, { playerInput }, { db }) => {
//         const gameState = await db.collection('GameState').findOne({});
//         if (gameState) {
//           // Assuming startGame modifies gameState in some way
//           startGame(gameState, playerInput);
//           await db.collection('GameState').updateOne({}, { $set: gameState });
//           return gameState;
//         }
//         throw new Error('No game to start');
//       }
//     }
//   };