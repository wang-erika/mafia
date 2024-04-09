<template>
  <div class="hello">
    <h3>Chat</h3>
    <input v-model="message" @keyup.enter="sendMessage" placeholder="Type a message...">
    <ul id="messages">
      <li v-for="msg in messages" :key="msg">{{ msg }}</li>
    </ul>
  </div>
</template>

<script>
import io from 'socket.io-client';
export default {
  name: 'HelloWorld',
  data() {
    return {
      socket: null,
      message: '',
      messages: []
    };
  },
  created() {
    this.socket = io('http://localhost:3000');

    this.socket.on('chat message', (msg) => {
      this.messages.push(msg);
    });
  },
  methods: {
    sendMessage() {
      if (this.message.trim() !== '') {
        this.socket.emit('chat message', this.message);
        this.message = ''; // Clear input field after sending
      }
    }
  }
};
</script>

<!-- Add your styles here -->
<style>
#messages {
  list-style-type: none;
  margin: 0;
  padding: 0;
}
</style>
