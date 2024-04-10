<template>
  <div class="chat-container">
    <ul class="messages">
      <li v-for="message in messagesData" :key="message._id">
        {{ message.senderId }}: {{ message.msg }}
      </li>
    </ul>
    <form @submit.prevent="sendChatMessage">
      <input v-model="newMessage" placeholder="Type a message..." />
      <button type="submit">Send</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Message } from "../../../server/data";
import { io } from "socket.io-client";
const socket = io('http://localhost:8130');
// No need to declare type here if you're not initializing immediately

const newMessage = ref('');
const messagesData = ref<Message[]>([]);

const sendChatMessage = (): void => {
  if (!newMessage.value.trim()) return;
  // Emitting the message to the server
  socket.emit('sendMessage', { 
    msg: newMessage.value, 
    senderId: 'SenderName' // Adjust as necessary
  });
  newMessage.value = ''; // Clear the input field after sending
};

onMounted(() => {
  fetchInitialMessages();
});

async function fetchInitialMessages() {
    try {
        const response = await fetch('/api/entries'); // Ensure this matches your Express route
        if (!response.ok) {
            throw new Error('Failed to fetch initial messages');
        }
        const data = await response.json();
        messagesData.value = data;
    } catch (error) {
        console.error('Error fetching initial messages:', error);
    }
}
</script>


<style scoped>
.chat-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.messages {
  list-style-type: none;
  padding: 0;
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.messages li {
  margin-bottom: 10px;
  line-height: 1.4;
}

form {
  display: flex;
}

input {
  flex: 1;
  padding: 10px;
  margin-right: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

button {
  padding: 10px;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>
