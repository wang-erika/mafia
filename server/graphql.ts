import { gql } from 'apollo-server';
import { GameState, startGame, Player} from './model2';
import { MongoClient, Db } from 'mongodb'
import { ApolloServer } from 'apollo-server';



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

`;

// Define TypeScript interface for Context
interface Context {
    db: Db;
  }
  
  
  // Define Resolvers with TypeScript Typing
  export const resolvers = {
    Query: {
      gameState: async (_: any, __: any, { db }: Context) => {
        return await db.collection('GameState').findOne({});
      }
    }
    // Mutation: {
    //   startGame: async (_: any, { playerInput }: { playerInput: PlayerInput }, { db }: Context) => {
    //     const gameState = await db.collection('GameState').findOne({});
    //     if (gameState) {
    //       // Assuming startGame modifies the gameState based on playerInput
    //       // This function should be defined elsewhere and properly typed
    //       startGame(gameState, playerInput);
    //       await db.collection('GameState').updateOne({}, { $set: gameState });
    //       return gameState;
    //     }
    //     throw new Error('No game to start');
    //   }
    // }
  };
