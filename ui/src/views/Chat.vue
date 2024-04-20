<template>
  <div class="main-container">
    <div class="vote-container">
      <InfoBox />
      <Vote/>
      <NextPhase />
    </div>
    <div class="content-container"> 
      <div class="chat-container"> 
        <div v-if="loading">Loading...</div>
        <div v-if="error">{{ error.message }}</div>
        <h1 v-if="gameState">{{ gameState.phase.charAt(0).toUpperCase() + gameState.phase.slice(1)}} {{ gameState.round }} </h1>
        
        <div>
          Time Remaining: 
          <b-form-input v-model="timerDuration" debounce="500" number class="mb-2" />
          <b-button v-if="!timeRemaining" @click="start">Start</b-button>
          <b-button v-else @click="stop">Stop</b-button>
        </div>
      <div class="timer">
      Time Remaining: {{ Math.round(timeRemaining) }} ms
      </div>
        <ul class="messages">
          <li v-for="message in messagesData" :key="message.senderId.toString()">
            <strong>{{ message.senderId }}</strong>: {{ message.text }} <br>
            <span class="timestamp">{{ formatTimestamp(message.timestamp) }}</span>
          </li>
        </ul>
        <form @submit.prevent="sendChatMessage">
          <b-form-input v-model="newMessage" placeholder="Type a message..." />
          <b-button type="submit">Send</b-button>
        </form>
      </div>
    </div>
    <Sidebar class = "sidebar-container"/> 
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import {  useTimestamp } from '@vueuse/core'
import { io } from "socket.io-client";
const socket = io('http://localhost:8131');
import moment from 'moment'
import { useQuery, useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import Sidebar from './Sidebar.vue';
import InfoBox from './InfoBox.vue';
import Vote from './Vote.vue';
import NextPhase from '../components/NextPhase.vue';

const GET_GAME_STATE = gql`
  query GetGameState {
    gameState {
      phase
      round
      startTime
    }
  }
`;

const SET_START_TIME = gql`
  mutation UpdateStartTime($time: String!) {
    setStartTime(input: { startTime: $time }) {
      _id
      startTime
    }
  }
`;

const { result, loading, error } = useQuery(GET_GAME_STATE);
const { mutate: setStartTime } = useMutation(SET_START_TIME);
const gameState = computed(() => result.value?.gameState);

interface Message {
    senderId: string;
    text: string;
    timestamp: Date;
}

const newMessage = ref('')
const messagesData = ref<Message[]>([])
const userInfo = ref({ userId: '', name: ''})


function formatTimestamp(timestamp: any) {
  return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
}

const sendChatMessage = () => { 
    if (!newMessage.value.trim()){
      return}
    socket.emit('sendMessage', { 
      senderId: userInfo.value.name,
      text: newMessage.value
  });
  newMessage.value = ''; 
};

//* TIMER  */
const startTime = ref(0);
const timerDuration = ref(30000)
const now = useTimestamp({ interval: 200 })
const timeRemaining = computed(() => startTime.value ? Math.max(0, startTime.value + timerDuration.value - now.value) : 0)

async function start() { //temporary for now (should connect to start button from config page)
	startTime.value = Date.now()
  await setStartTime(startTime);
}

function stop() {
	startTime.value = 0
}
//* TIMER  */
//* TIMER  */


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
    const response = await fetch('/api/check');
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
  display: flex;
  font-family: 'Roboto', sans-serif;
  flex-direction: row;
  flex-wrap: wrap;
  margin: 2em;
}
.vote-container {
  width: 25%;
  gap: 25px;
}
@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
    gap: 25px;
  }

  .content-container, .chat-container, .vote-container {
    width: 100%; /* Make each container take the full width */
    margin-left: 0;
    margin-right: 0;
  }

  .vote-container {
    width: 100%;
  }
}

.content-container {
  display: flex;
  flex-grow: 1;
  align-items: flex-start;
}

.chat-container {
  flex-grow: 1.5; 
  margin-left: 20px;
  margin-right: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 20px;
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
