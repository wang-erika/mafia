import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';


import App from './App.vue';
import Chat from './views/Chat.vue';
import LoginPage from './views/LoginPage.vue'

const routes = [
  {
    path: "/",
    component: Chat,
  },
  {
    path: "/login",
    component: LoginPage
  }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
  });

createApp(App)
.use(router)
.mount('#app')

//router guard 
router.beforeEach((to, from, next) => {
  fetch('/auth/check')
    .then(res => res.json())
    .then(data => {
      if (data.isAuthenticated) {
        if (to.path === '/login') {
          next('/');
        } else {
          next();
        }
      } else {
        if (to.path !== '/login') {
          next('/login');
        } else {
          next();
        }
      }
    })
})