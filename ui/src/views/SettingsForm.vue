<template>
    <div class="settings-form">
      <h2>Update Game Settings</h2>
      <form class = "form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="roomName">Room Name</label>
          <input type="text" id="roomName" v-model="form.roomName" required>
        </div>
        <div class="form-group">
          <label for="dayLength">Day Length</label>
          <input type="number" id="dayLength" v-model="form.dayLength" min="10" required>
        </div>
        <div class="form-group">
          <label for="nightLength">Night Length </label>
          <input type="number" id="nightLength" v-model="form.nightLength" min="10" required>
          </div>
        <button type="submit" :disabled="loading">Update Settings</button>
      </form>
      <div v-if="error">{{ error.message }}</div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { useMutation } from '@vue/apollo-composable';
  import gql from 'graphql-tag';
  
  export default defineComponent({
    setup() {
      const form = ref({
        roomName: '',
        dayLength: 60,
        nightLength: 30
      });
  
      const { mutate: updateGameSettings, loading, error } = useMutation(gql`
        mutation UpdateGameSettings( $dayLength: Int!, $nightLength: Int!, $roomName: String!) {
          updateGameSettings(dayLength: $dayLength, nightLength: $nightLength, roomName: $roomName) {
            dayLength
            nightLength
            roomName
          }
        }
      `, () => ({
        variables: {
            dayLength: form.value.dayLength,
            nightLength: form.value.nightLength,
            roomName: form.value.roomName,
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
        error
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