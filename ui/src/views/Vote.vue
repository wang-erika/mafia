<template>
    <div>
      <div v-if="loading">Loading...</div>
      <div v-if="error" class="error-message">{{ error.message }}</div>
      <div class="table-container" v-if="gameStateResult && gameStateResult.players && gameStateResult.players.length">
        <div v-if="message" class="message">{{ message }}</div>
        <h1 v-if="gameStateResult.phase === 'day'" class="phase-heading">Vote</h1>
        <h1 v-if="gameStateResult.phase === 'night'" class="phase-heading">Mafia is selecting a target</h1>
        <form @submit.prevent="castVote" class="vote-form">
          <table>
            <thead>
              <tr>
                <th>Player Names</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>No Vote</td>
                <td>
                  <label class="custom-radio">
                    <input type="radio" value="" v-model="selectedVote">
                    <span class="radio-box"></span>
                  </label>
                </td>
              </tr>
              <tr v-for="player in alivePlayers" :key="player.id" :class="{ 'disabled-row': player.status !== 'Alive' || (gameStateResult.phase === 'night' && player.role !== 'Mafia')}">
                <td>{{ player.name }}</td>
                <td>
                  <label class="custom-radio">
                    <input type="radio" :value="player.id" v-model="selectedVote" :disabled="player.status !== 'Alive'|| (gameStateResult.phase === 'night' && player.role !== 'Mafia')">
                    <span class="radio-box"></span>
                  </label>
                </td>
              </tr>
            </tbody>
          </table>
          <button type="submit" :disabled="selectedVote === null" class="submit-btn">Submit Vote</button>
        </form>
      </div>
      <div v-else class="no-data-message">No players data available.</div>
    </div>
  </template>



<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useQuery, useMutation, useSubscription } from '@vue/apollo-composable';
import gql from 'graphql-tag';

enum Role {
  Villager = "Villager",
  Mafia = "Mafia",
  Detective = "Detective",
  Doctor = "Doctor"
}

interface Player {
    id: string;
    name: string;
    role: Role;
    status: "Alive" | "Dead";
    votes: string[];
    killVote: string[];
  }

interface GameState {
  players: Player[];
  round: number;
  phase: "day" | "night" | "pre-game" | "end";
  hostId: string;
  roomName: string;
}

interface SubscriptionData {
    gameStateChanged: GameState;
}



export default defineComponent({
  setup() {

    const gameStateResult = ref<GameState | null>(null);
    const selectedVote = ref('');
    const message = ref('');
    const alivePlayers = computed(() => {
      return gameStateResult.value?.players.filter((player: Player) => player.status === 'Alive') || [];
    })

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
    `)

    const { result: userResult } = useQuery(gql`
      query getUser {
        currentUser
      }
    `)
    
    watch(result, (newData) => {
      if (newData && newData.gameState) {
        gameStateResult.value = newData.gameState;
      }
    }, { immediate: true });

    

    const { mutate: castVoteMutation } = useMutation(gql`
      mutation CastVote($voterId: String!, $voteeId: String!) {
          castVote(voterId: $voterId, voteeId: $voteeId) {
              _id
              players {
                  id
                  votes
              }
          }
      }
    `, () => ({
        variables: {
            voterId: userResult.value.currentUser,
            voteeId: selectedVote.value
        },
    }))

    const { mutate: castMafiaVoteMutation } = useMutation(gql`
      mutation MafiaCastVote($voterId: String!, $voteeId: String!) {
        mafiaCastVote(voterId: $voterId, voteeId: $voteeId) {
              _id
              players {
                  id
                  votes
              }
          }
      }
    `, () => ({
        variables: {
            voterId: userResult.value.currentUser,
            voteeId: selectedVote.value
        },
    }))


    const { result: pubSubResult } = useSubscription<SubscriptionData>(gql`
        subscription Subscription {
            gameStateChanged {
                _id
                hostId
                phase
                players {
                    id
                    killVote
                    name
                    role
                    status
                    votes
                }
                round
            }
        }
    `);

    watch(pubSubResult, (newData, oldData) => {
        if (newData) {
            gameStateResult.value = newData.gameStateChanged;
            message.value = ""
        }
    }, { immediate: true });

    // In your castVote method:
    const castVote = async () => {
        if (selectedVote.value != null) { // This allows the empty string to be a valid choice
            if (gameStateResult.value?.phase === "day") {
                try {
                    await castVoteMutation();
                    //selectedVote.value = '';
                    message.value = "Vote successfully cast!";
                }
                catch (e: any) {
                    message.value = e.message; // Display any errors from the mutation
                    selectedVote.value = ''; // Reset the vote selection
                }
            }
            else if (gameStateResult.value?.phase == "night"){
                try {
                    await castMafiaVoteMutation();
                    //selectedVote.value = '';
                    message.value = "Vote successfully cast!";
                }
                catch (e: any) {
                    message.value = e.message; // Display any errors from the mutation
                    selectedVote.value = ''; // Reset the vote selection
                }
            }
            else{
                message.value = "Game is not running."
            }
        }
    };


    return {
      gameStateResult,
      loading,
      error,
      selectedVote,
      alivePlayers,
      userResult,
      message,
      castVote
    };
  }
});
</script>


<style scoped>

.table-container {
  border: 1px solid #4CAF50;
  border-radius: 5px;
  padding: 25px;
  background-color: #f0f8ff;
  font-family: Verdana, sans-serif;
}

.phase-heading {
  color: #290eee;
  font-size: 30px;
  text-align: center;

}
.phase-subheading{
    text-align:center
}

.message, .error-message, .no-data-message {
  margin-bottom: 10px;
  padding: 10px;
  background-color: #ffe4e1;
  border: 1px solid #ff6347;
  border-radius: 5px;
  text-align:center;
}

.vote-form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

table {
  width: 100%;
  margin-bottom: 20px;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  padding: 8px;
}

.custom-radio input[type="radio"] {
  display: none;
}

.custom-radio .radio-box {
  height: 20px;
  width: 20px;
  display: inline-block;
  position: relative;
  background-color: #f1f1f1;
  border: 1px solid #d1d1d1;
  cursor: pointer;
  vertical-align: middle;
}

.custom-radio input[type="radio"]:checked + .radio-box {
  background-color: #4CAF50;
  border-color: #4CAF50;
}

.custom-radio .radio-box::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background-color: white;
  border-radius: 50%;
  display: none;
}

.custom-radio input[type="radio"]:checked + .radio-box::after {
  display: block;
}

.submit-btn {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  align-self: center;
  margin-top: 10px;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.disabled-row td {
  color: #ccc;
  cursor: not-allowed;
}
</style>
