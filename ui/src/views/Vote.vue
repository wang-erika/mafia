<template>
    <div>
      <div v-if="loading">Loading...</div>
      <div v-if="error">{{ error.message }}</div>
      <div class="table-container" v-if="gameStateResult && gameStateResult.players && gameStateResult.players.length">
        <div v-if="message">{{ message }}</div>
        <h1 v-if="dayOrNight === 'Night'">Mafia is selecting a target...</h1>
        <h1 v-if="dayOrNight === 'Day'">Vote</h1>
        <p v-if="!canVote" >You are currently unable to vote.</p>
        <form @submit.prevent="castVote" class="vote-form">
          <table>
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Select</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="player-name" :class="{'disabled-text': !canVote}">No Vote</td>
                <td>
                  <label class="custom-radio">
                    <input type="radio" value="" v-model="selectedVote" :disabled="!canVote">
                    <span class="radio-box"></span>
                  </label>
                </td>
              </tr>
              <tr v-for="player in alivePlayers" :key="player.id" :class="{'disabled-row': player.status !== 'Alive' || !canVote}">
                <td class="player-name" :class="{'disabled-text': !canVote}">{{ player.name }}</td>
                <td>
                  <label class="custom-radio">
                    <input type="radio" :value="player.id" v-model="selectedVote" :disabled="player.status !== 'Alive' || !canVote">
                    <span class="radio-box"></span>
                  </label>
                </td>
              </tr>
            </tbody>
          </table>
          <button type="submit" :disabled="selectedVote === null || !canVote" class="submit-btn">Submit Vote</button>
        </form>
      </div>
      <div v-else>
        No players data available.
      </div>
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
    const dayOrNight = ref('Night');
    const canVote = ref(false);
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
                dayOrNight.value = 'Day';
                try {
                    await castVoteMutation();
                    //selectedVote.value = '';
                    message.value = "Vote successfully cast!";
                    canVote.value = true;
                }
                catch (e: any) {
                    message.value = e.message; // Display any errors from the mutation
                    selectedVote.value = ''; // Reset the vote selection
                }
            }
            else if (gameStateResult.value?.phase == "night"){
                dayOrNight.value = 'Night';
                try {
                    await castMafiaVoteMutation();
                    //selectedVote.value = '';
                    message.value = "Vote successfully cast!";
                    canVote.value = true;

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
      castVote,
      canVote,
      dayOrNight
    };
  }
});
</script>


<style scoped>
.table-container {
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 20px;
    background-color: #f5f5f5;
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

.disabled-row td {
    color: #ccc;
    cursor: not-allowed;
}

.disabled-row .custom-radio {
    pointer-events: none; /* Disable radio button interactions */
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

.submit-btn:hover:not(:disabled) {
    background-color: #367c39;
}

</style>

