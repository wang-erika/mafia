<template>
    <div class="mx-3 my-3">
        <h1>GameState</h1>
        <div v-if="loading">Loading...</div>
        <div v-if="error">{{ error.message }}</div>
        <p> Phase and Round: {{ result.gameState.phase }} {{ result.gameState.round }}</p>

        <table v-if="result && result.gameState && result.gameState.players && result.gameState.players.length">
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
                    <td>{{ player.status }}</td>
                </tr>
            </tbody>
        </table>
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

// Log to check what's inside result
console.log(result);
</script>
