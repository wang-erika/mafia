<template>
  <div class="chat-container">
    <ul class="messages">
      <li v-for="message in messagesData" :key="message._id.toString()">
  <strong>{{ message.senderId }}</strong>: {{ message.text }} <br>
  <span class="timestamp">{{ formatTimestamp(message.timestamp) }}
</span>
</li>

    </ul>
    <form>
      <input v-model="newMessage" placeholder="Type a message..." />
      <button @click.prevent="sendChatMessage()">Send</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Message } from "../../../server/data";
import { io } from "socket.io-client";
const socket = io('http://localhost:8131');
import moment from 'moment'

const newMessage = ref('');
const messagesData = ref<Message[]>([]);

function formatTimestamp(timestamp: any) {
  return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
}


const sendChatMessage = () => { 
    if (!newMessage.value.trim()){
      console.log("no work")
      return}
    console.log(newMessage.value)
    socket.emit('sendMessage', { 
      senderId: 'SenderName',
      text: newMessage.value
  });
  newMessage.value = ''; // Clear the input field after sending
};

onMounted(() => {
  fetchMessages();

  socket.on("receiveMessage", (userNewMessage: any) => { //takes updated message and puts it into messagesData array to display
    messagesData.value.push(userNewMessage)
})
});

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

.chat-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
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
