import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';


import App from './App.vue';
import Chat from './views/Chat.vue';

const routes = [
  {
    path: "/",
    component: Chat,
  }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
  });

  createApp(App)
  .use(router)
  .mount('#app')
