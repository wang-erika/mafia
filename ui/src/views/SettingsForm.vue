<template>
    <div class="settings-form">
      <h2>Update Game Settings</h2>
      <form class = "form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="roomName">Room Name (current: {{ gameStateResult?.roomName }})</label>
          <input type="text" id="roomName" v-model="form.roomName" required>
        </div>
        <div class="form-group">
          <label for="numMafia">Number of Mafia (current: {{ gameStateResult?.numMafia }})</label>
          <input type="number" id="numMafia" v-model="form.numMafia" min="1" required>
        </div>
        <div class="form-group">
          <label for="numVillager"> Number of Villagers (current: {{ gameStateResult?.numVillager }})</label>
          <input type="number" id="numVillager" v-model="form.numVillager" min="2" required>
        </div>
        <div class="form-group">
          <label for="maxPlayers">Max Players (current: {{ gameStateResult?.maxPlayers }})</label>
          <input type="number" id="maxPlayers" v-model="form.maxPlayers" min="3" required>
        </div>
        <button type="submit" :disabled="loading">Update Settings</button>
      </form>
      <div v-if="error">{{ error.message }}</div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, watch } from 'vue';
  import { useQuery, useMutation } from '@vue/apollo-composable';
  import { GameState } from './data';
  
  import gql from 'graphql-tag';
  
  export default defineComponent({
    setup() {



    const gameStateResult = ref<GameState | null>(null);

      const { result } = useQuery(gql`
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
                numMafia
                numVillager
                maxPlayers
            }
        }
`);

      watch(result, (newData) => {
        if (newData && newData.gameState) {
          gameStateResult.value = newData.gameState;
        }
      }, { immediate: true });

      const form = ref({
        roomName: '',
        numMafia: '',
        numVillager: '',
        maxPlayers: ''
      });



      const { mutate: updateGameSettings, loading, error } = useMutation(gql`
        mutation UpdateGameSettings( $numMafia: Int!, $numVillager: Int!, $roomName: String!, $maxPlayers: Int!) {
          updateGameSettings(numMafia: $numMafia, numVillager: $numVillager, roomName: $roomName, maxPlayers: $maxPlayers) {
            numMafia
            numVillager
            roomName
            maxPlayers
          }
        }
      `, () => ({
        variables: {
            numMafia: form.value.numMafia,
            numVillager: form.value.numVillager,
            roomName: form.value.roomName,
            maxPlayers: form.value.maxPlayers
        }
      }));
  
  
      const handleSubmit = async () => {
        try {
          await updateGameSettings();
          window.location.href = '/'
        } catch (err) {
          console.error('Error updating settings:', err);
        }
      };
  
      return {
        form,
        handleSubmit,
        loading,
        error,
        gameStateResult
      };
    }
  });
  </script>
  
  <style scoped>
.settings-form {
  display: flex;
  flex-direction: column;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  max-width: 400px;
  margin: 20px auto;
  background: #f9f9f9;
}

.form {
  display: flex;
  flex-direction: column
}

.form-group {
  margin-bottom: 16px;
  width: 100%;
}

label {
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
}

input[type="text"],
input[type="number"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

.error {
  color: #ff0000;
  margin-top: 10px;
}
</style>