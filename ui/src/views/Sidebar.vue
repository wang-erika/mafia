<template>
    <div class="sidebar">
        <h1>Game State</h1>
        <div v-if="loading">Loading...</div>
        <div v-if="error">{{ error.message }}</div>
        <div class="table-container" v-if="result && result.gameState && result.gameState.players && result.gameState.players.length">
            <table>
                <thead>
                    <tr>
                        <th>Player Name</th>
                        <th>Role</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="player in result.gameState.players" :key="player.id">
                        <td>{{ player.name }}</td>
                        <td>{{ player.role }}</td>
                        <td :class="{'status-alive': player.status === 'Alive', 'status-dead': player.status === 'Dead'}">
                            {{ player.status }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-else>
            No players data available.
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
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
          }
      }
    `);

    return {
      result,
      loading,
      error
    };
  }
});
</script>

<style scoped>
.sidebar {
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 20px;
    background-color: #f5f5f5;
}


.table-container {
    margin-top: 20px;
}

table {
    border-collapse: collapse;
}

th, td {
    text-align: left;
    padding: 8px;
    border-bottom: 1px solid #ddd;
}

th {
    background-color: #4d33e0;
    color: white;
}

tr:hover {
    background-color: #f5f5f5;
}

.status-alive {
    color: green;
}

.status-dead {
    color: red;
}
</style>
