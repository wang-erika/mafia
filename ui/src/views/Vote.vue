<template>
    <div>
        <div v-if="loading">Loading...</div>
        <div v-if="error">{{ error.message }}</div>
        <div class="table-container" v-if="result && result.gameState && result.gameState.players && result.gameState.players.length">
            <div v-if="voteError">{{ voteError }}</div> <!-- Display vote-related errors -->
            <h1>Vote</h1>
            <form @submit.prevent="castVote" class="vote-form">
                <table>
                    <thead>
                        <tr>
                            <th>Player Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="player in alivePlayers" :key="player.id">
                            <td>{{ player.name }}</td>
                            <td>
                                <label class="custom-radio">
                                    <input type="radio" :value="player.id" v-model="selectedVote" :disabled="player.status !== 'Alive'">
                                    <span class="radio-box"></span>
                                </label>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <button type="submit" :disabled="!selectedVote" class="submit-btn">Submit Vote</button>
            </form>
        </div>
        <div v-else>
            No players data available.
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
    `)

    const { result: userResult } = useQuery(gql`
      query getUser {
        currentUser
      }
    `)

    interface Player {
        id: String;
        name: String;
        role: Role;
        status: String;
        votes: String[];
        killVote: String[];
    }
    enum Role {
        Villager = "Villager",
        Mafia = "Mafia",
        Detective = "Detective",
        Doctor = "Doctor"
    }

    const voteError = ref(''); // Reactive property for storing vote errors

    const selectedVote = ref('');

    const alivePlayers = computed(() => {
      return result.value?.gameState.players.filter((player: Player) => player.status === 'Alive') || [];
    })

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

    const castVote = async () => {
      if (selectedVote.value != null && selectedVote.value != "") {
        try{
            await castVoteMutation();
        }
        catch (e: any) {
          voteError.value = e.message; // Catch and display the error if the mutation fails
        }
      }
    };

    return {
      result,
      loading,
      error,
      selectedVote,
      alivePlayers,
      userResult,
      voteError,
      castVote,
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
    border-collapse: collapse; /* Add border-collapse */
}

th, td {
    text-align: left;
    padding: 8px; /* Add some padding to table cells */
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
    border: 1px solid #d1d1d1; /* Adjust border width for a lighter look */
    cursor: pointer;
    vertical-align: middle; /* Align the custom radio vertically */
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
    align-self: center; /* Center the button in the form */
    margin-top: 10px; /* Add space between the table and the button */
}

.submit-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}
</style>
