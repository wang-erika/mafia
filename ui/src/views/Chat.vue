<template>
  <div class="main-container">
    <Sidebar /> <!-- Sidebar on the side -->
    <div class="chat-container"> <!-- Chat in the middle -->
      <span>
        <div v-if="loading">Loading...</div>
        <div v-if="error">{{ error.message }}</div>
        <h1 v-if="result && result.gameState">{{ result.gameState.phase }} {{ result.gameState.round }}</h1>
      </span>
      <ul class="messages">
        <li v-for="message in messagesData" :key="message._id.toString()">
          <strong>{{ message.senderId }}</strong>: {{ message.text }} <br>
          <span class="timestamp">{{ formatTimestamp(message.timestamp) }}</span>
        </li>
      </ul>
      <form>
        <input v-model="newMessage" placeholder="Type a message..." />
        <button @click.prevent="sendChatMessage()">Send</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, Ref, reactive, onMounted } from 'vue';
import { Message } from "../../../server/data";
import { io } from "socket.io-client";
const socket = io('http://localhost:8131');
import moment from 'moment'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import Sidebar from './Sidebar.vue';
import { nextTick } from 'vue';

const { result, loading, error } = useQuery(gql`
    query ExampleQuery {
        gameState {
            phase
            round
        }
    }

`);

const newMessage = ref('')
const messagesData = ref<Message[]>([])
const userInfo = ref({ userId: '', name: ''})


function formatTimestamp(timestamp: any) {
  return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
}

const sendChatMessage = () => { 
    if (!newMessage.value.trim()){
      console.log("no work")
      return}
    socket.emit('sendMessage', { 
      senderId: userInfo.value.name,
      text: newMessage.value
  });
  newMessage.value = ''; // Clear the input field after sending
};

onMounted(async () => {
  await fetchUser();
  await fetchMessages();
  scrollToBottom(); // Scroll to bottom after messages are loaded

  socket.on("receiveMessage", (userNewMessage: any) => {
    messagesData.value.push(userNewMessage);
    scrollToBottom(); // Scroll to bottom when new messages arrive
  });
});

async function fetchUser() {
  try {
    const response = await fetch('/auth/check');
    if (!response.ok) {
      throw new Error("Failed to fetch user information")
    }
    const data = await response.json();
    if (data.isAuthenticated) {
      userInfo.value = { userId: data.user.nickname, name: data.user.name}
    } else {
      userInfo.value = { userId: '', name: 'Guest'}
    }
  } catch (error) {
    console.error("Error fetching user information:", error)
  }
}
async function fetchMessages() {
    try {
        const response = await fetch('/api/entries'); 
        if (!response.ok) {
            throw new Error('Failed to fetch initial messages');
        }
        const data = await response.json();
        messagesData.value = data;
    } catch (error) {
        console.error('Error fetching initial messages:', error);
    }
}

function scrollToBottom() {
  nextTick(() => {
    const container = document.querySelector('.messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
}

</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');

.main-container {
  display: flex; /* Establishes a flex container */
  height: calc(100vh - 20px); /* Adjust 20px as needed */
  width: 100%;
  font-family: 'Roboto', sans-serif;
  align-items: flex-start;
}

.chat-container {
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  max-width: 600px;
  width: 600px; /* Set the width of the chat container to 600px */
  margin-left: 20px; /* Space between the sidebar and chat container */
  overflow-y: auto; /* Allows for scrolling within the chat box */
  /* Additional styles as needed */
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
.messages {
  list-style-type: none;
  padding: 0;
  margin-bottom: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.messages li {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #ddd;
  word-wrap: break-word;
}

strong {
  color: #007bff;
}

.timestamp {
  display: block;
  margin-top: 5px;
  font-size: 0.85em;
  color: #666;
}

input, button {
  padding: 10px;
  margin: 5px 0;
}

button {
  background-color: #0056b3;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #004494;
}

</style>
