<template>
    <div class="sidebar">
        <h1>Game State</h1>
        <div v-if="loading">Loading...</div>
        <div v-if="error">{{ error.message }}</div>
        <h2>{{ result.gameState.phase }} {{ result.gameState.round }}</h2>
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

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue';

const { result, loading, error } = useQuery(gql`
    query ExampleQuery {
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
</script>

<style scoped>
.sidebar {
    width: 300px;
    background-color: #f4f4f4;
    padding: 20px;
    height: 100vh; /* Full height of the viewport */
    box-shadow: 0 0 8px rgba(0,0,0,0.1);
    overflow-y: auto; /* Allows scrolling */
}

.table-container {
    margin-top: 20px;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th, td {
    text-align: left;
    padding: 8px;
    border-bottom: 1px solid #ddd;
}

th {
    background-color: #4CAF50;
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
