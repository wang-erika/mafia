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


<script lang="ts">
import { defineComponent, watchEffect, ref, onMounted, nextTick, computed } from 'vue';
import { useTimestamp } from '@vueuse/core';
import { io } from "socket.io-client";
const socket = io('http://localhost:8131');
import moment from 'moment';
import { useQuery, useMutation } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import Sidebar from './Sidebar.vue';
import InfoBox from './InfoBox.vue';
import Vote from './Vote.vue';
import NextPhase from '../components/NextPhase.vue';

export default defineComponent({
  components: {
    Sidebar,
    InfoBox,
    Vote,
    NextPhase
  },
  setup() {
    interface Message {
      senderId: string;
      text: string;
      timestamp: Date;
    }

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


    const currentTime = ref();
    const { mutate: setStartTime, loading: mutateLoading, error: mutateError } = useMutation(gql`
      mutation SetStartTime($time: String!) {
        setStartTime(time: $time) {
          _id
          startTime
        }
      }
    `, () => ({
      variables: {
        time: currentTime.value  // This is how you correctly reference reactive data
      }
    }))

    const newMessage = ref('');
    const messagesData = ref<Message[]>([]);
    const userInfo = ref({ userId: '', name: '' });
    const gameState = computed(() => result.value?.gameState);
    const startTime = ref(gameState.value?.startTime || null);
    const timerDuration = ref(30000); // 30 seconds
    const now = useTimestamp({ interval: 200 });
    const timeRemaining = computed(() => {
      if (startTime.value) {
        const start = Date.parse(startTime.value);
        return Math.max(0, start + timerDuration.value - now.value);
      }
      return 0;
    });

    const start = async () => {
      currentTime.value = new Date().toISOString();
        setStartTime()
    };

    const stop = () => {
      startTime.value = null; // Clear the start time
    };

    const formatTimestamp = (timestamp: Date) => {
      return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
    };

    watchEffect(() => {
      if (gameState.value?.startTime) {
        startTime.value = gameState.value.startTime;
      }
    });

    onMounted(async () => {
      await fetchUser();
      await fetchMessages();
      scrollToBottom();
      socket.on("receiveMessage", (userNewMessage: any) => {
        messagesData.value.push(userNewMessage);
        scrollToBottom();
      });
    });

        watchEffect(() => {
      if (error.value) {
        console.error("Apollo Query Error:", error.value);
      }
      if (mutateError.value) {
        console.error("Apollo Mutation Error:", mutateError.value);
      }
    });

    const sendChatMessage = async () => {
      if (!newMessage.value.trim()) return;
      socket.emit('sendMessage', {
        senderId: userInfo.value.userId,
        text: newMessage.value
      });
      newMessage.value = '';
    };

    async function fetchUser() {
      try {
        const response = await fetch('/api/check');
        if (!response.ok) {
          throw new Error("Failed to fetch user information");
        }
        const data = await response.json();
        userInfo.value = { userId: data.user.nickname, name: data.user.name };
      } catch (error) {
        console.error("Error fetching user information:", error);
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
        const container = document.querySelector('.chat-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }

    return {
      result,
      loading,
      error,
      gameState,
      timeRemaining,
      start,
      stop,
      newMessage,
      sendChatMessage,
      messagesData,
      userInfo,
      timerDuration,
      formatTimestamp  // Now properly exposed
    };
  }
});
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
