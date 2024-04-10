<template>
    <div class="player-list-sidebar">
      <ul>
        <li v-for="player in players" :key="player.id">
          {{ player.name }} - {{ player.status }} <span v-if="player.status === 'Dead'">({{ player.role }})</span>
        </li>
      </ul>
    </div>
  </template>
  
  
  <script>
  export default {
    props: ['players']
  };
  </script>
  
  <style>
  /* Add styles for your sidebar here */
  .player-list-sidebar {
    /* Styles */
  }
  </style>