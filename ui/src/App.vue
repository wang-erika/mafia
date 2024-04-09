<template>
  <div class="chat-container">
    <ul class="messages">
      <li v-for="message in messages" :key="message.id">
        {{ message.sender }}: {{ message.text }}
      </li>
    </ul>
    <form @submit.prevent="sendMessage">
      <input v-model="newMessage" placeholder="Type a message..." />
      <button type="submit">Send</button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'ChatComponent',
  data() {
    return {
      newMessage: '',
      messages: [
        { id: 1, sender: 'User1', text: 'Hello!' },
        { id: 2, sender: 'User2', text: 'Hi there!' },
        // More messages can be added here
      ],
    };
  },
  methods: {
    sendMessage() {
      // This method would be updated to actually send the message
      // For demonstration, it just adds the message to the local array
      const newId = this.messages.length + 1;
      const message = {
        id: newId,
        sender: 'Me', // This should be dynamically set based on the actual user
        text: this.newMessage,
      };
      this.messages.push(message);
      this.newMessage = ''; // Reset input field after sending
    },
  },
};
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
