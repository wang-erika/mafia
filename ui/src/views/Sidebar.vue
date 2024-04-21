<template>
    <div class="sidebar">
        <div v-if="loading">Loading...</div>
        <div v-if="error">{{ error.message }}</div>
        <h1 v-if="gameStateResult">{{ gameStateResult.roomName}}'s Room</h1>
        <div class="table-container" v-if="gameStateResult && gameStateResult.players && gameStateResult.players.length">
            <table>
                <thead>
                    <tr>
                        <th>Player Name</th>
                        <th>Role</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="player in gameStateResult.players" :key="player.id">
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
            No current game. <a href = '/lobby'>Click here</a> to start a new game
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, watch, ref } from 'vue';
import { useQuery, useSubscription } from '@vue/apollo-composable';
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
              roomName
              startTime
          }
      }
    `);

    watch(result, (newData) => {
      if (newData && newData.gameState) {
        gameStateResult.value = newData.gameState;
        console.log("Initial data loaded:", newData.gameState);
      }
    }, { immediate: true });

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
            console.log(newData)
        }
    });

    return {
      gameStateResult,
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
