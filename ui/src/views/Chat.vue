<template>
  <div class="chat-container">
    <ul class="messages">
      <li v-for="message in messagesData" :key="message._id.toString()">
        {{ message.senderId }}: {{ message.text }}
        {{ message.timestamp }}
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

const newMessage = ref('');
const messagesData = ref<Message[]>([]);

const sendChatMessage = () => { 
    if (!newMessage.value.trim()){
      console.log("no work")
      return}
    console.log(newMessage.value)
    socket.emit('sendMessage', {  //emit with msg and senderId
      senderId: 'SenderName',
      text: newMessage.value
  });
  newMessage.value = ''; // Clear the input field after sending

};

onMounted(() => {
  fetchMessages();
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
