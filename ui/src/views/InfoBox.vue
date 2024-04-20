<template>
    <div>
        <div v-if="loading">Loading...</div>
        <div v-if="error">{{ error.message }}</div>
        <div class="table-container" v-if="result && result.gameState && result.gameState.players && result.gameState.players.length">
            <h1>Welcome, {{ userResult.currentUser }}!</h1>
            <div v-if="currentUserDetails">
                <p>Your Role: {{ currentUserDetails.role }}</p>
                <p>Your Status: <span :class="{'status-alive': currentUserDetails.status === 'Alive', 'status-dead': currentUserDetails.status === 'Dead'}">{{ currentUserDetails.status }}</span></p>
                <div v-if="userResult.currentUser == result.gameState.hostId">
                    <a href = '/settings'>Game Settings</a> (Host only)
                </div>
            </div>
            <div v-if="Number(result.gameState.round) < 1">
                <a href = "/lobby">Go to Lobby</a>
            </div>
            <div v-else>
                Spectating
            </div>

        </div>
        <div v-else>
            No players data available.
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
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
              hostId
          }
      }
    `)

    const { result: userResult } = useQuery(gql`
      query getUser {
        currentUser
      }
    `)

    const currentUserDetails = computed(() => {
      if (result.value && userResult.value) {
        return result.value.gameState.players.find((player: any) => player.id === userResult.value.currentUser) || null;
      }
      return null;
    });



    return {
      result,
      loading,
      error,
      userResult,
      currentUserDetails
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
.status-alive {
    color: green;
}
.status-dead {
    color: red;
}
</style>