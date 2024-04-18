<template>
    <div class="login-container">
      <h1>Mafia Game</h1>
      <div class="login-form">
        <button @click="loginWithOIDC">Sign in </button>
      </div>
    </div>
  </template>
  
  <script lang = "ts">
  export default {
    name: 'Login',
    methods: {
      loginWithOIDC() {
        window.location.href = '/auth';
      }
    }
  }
  </script>
  
  <style scoped>
  .login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
  }
  
  .login-form button {
    cursor: pointer;
    background-color: #4CAF50; /* Green */
    border: none;
    color: white;
    padding: 15px 32px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 2px;
    transition-duration: 0.4s;
  }
  
  .login-form button:hover {
    background-color: white;
    color: black;
    border: 2px solid #4CAF50;
  }
  </style>
  