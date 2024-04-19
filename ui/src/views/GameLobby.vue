<template>
    <div class="lobby">
        <h1>Game Lobby</h1>
        {{result.gameState }}
        <div v-if="loading">Loading...</div>
        <div v-if="error">{{ error.message }}</div>
        <div v-if="result && result.gameState">
            <p>Round: {{ result.gameState.round }}, Phase: {{ result.gameState.phase }}</p>
            <div v-if="result.gameState.players && result.gameState.players.length > 0">
                <h2>Players in Lobby:</h2>
                <ul>
                    <li v-for="player in result.gameState.players" :key="player.id">
                        {{ player.name }}
                    </li>
                </ul>
            </div>
            <button class="button" v-if="!result.gameState.started" @click="handleAddPlayer">Join Game</button>
            <button class="button" @click="handleSpectateGame">Spectate</button>
        </div>
        <div v-else>
            <h4>No current game</h4>
            <button class="button" @click="handleCreateGame">Create Game</button>
        </div>
    </div>
</template>

  
  <script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import gql from 'graphql-tag';

export default defineComponent({
  setup() {

    const { result, loading, error } = useQuery(gql`
      query GameStateQuery {
          gameState {
              _id
              phase
              players {
                  name
                  role
                  status
                  id
                  killVote
                  votes
              }
              round
          }
      }
    `);
    const { result: userResult } = useQuery(gql`
      query getUser {
        currentUser
      }
    `)

    // Mutations
    const { mutate: createGame } = useMutation(gql`
        mutation CreateGame {
            createGame {
            _id
            round
            phase
            players {
                id
                name
                role
                status
                votes
                killVote
            }
            }
        }
        `);
    const { mutate: addPlayerToGame } = useMutation(gql`
        mutation AddPlayerToGame($playerId: String!) {
            addPlayerToGame(playerId: $playerId) {
            _id
            players {
                id
                name
                role
                status
                votes
                killVote
            }
            }
        }
        `, () => ({
            variables: {
                playerId: userResult.value.currentUser
            }
        }));

    // Method to handle game creation
    const handleCreateGame = async () => {
      try {
        const response = await createGame();
        console.log('Game Created:', response);
        window.location.href = '/'
      } catch (err) {
        console.error('Error creating game:', err);
      }
    };

    // Method to add a player to a game
    const handleAddPlayer = async ( playerId: any) => {
      try {
        const response = await addPlayerToGame({ variables: {playerId } });
        console.log('Player added:', response);
        window.location.href = '/'
      } catch (err) {
        console.error('Error adding player:', err);
      }
    };

    const handleSpectateGame = async () => {
        window.location.href = '/'
    }

    return {
      handleCreateGame,
      handleAddPlayer,
      handleSpectateGame,
      result,
      loading,
      error,
    };
  },
});

  </script>
  
  <style scoped>
  .lobby {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .button {
  cursor: pointer;
  background-color: #4CAF50; /* Green */
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  transition-duration: 0.4s;
}

.button:hover {
  background-color: white;
  color: black;
  border: 2px solid #4CAF50;
}
  </style>
  