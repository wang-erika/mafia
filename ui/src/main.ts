import { createApp, h } from 'vue';
import { createRouter, createWebHistory, NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import App from './App.vue';
import Chat from './views/Chat.vue';
import LoginPage from './views/LoginPage.vue'
import GameLobby from './views/GameLobby.vue'
import Sidebar from './views/Sidebar.vue';
import SettingsForm from './views/SettingsForm.vue'
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

const routes = [
  {
    path: "/",
    component: Chat,
  },
  {
    path: "/login",
    component: LoginPage
  },
  { 
    path: "/graphql", 
    component: Sidebar
  },
  {
    path: "/lobby",
    component: GameLobby
  },
  {
    path: '/settings',
    component: SettingsForm
  },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
  });

const app = createApp({
    // setup() {
    //   provide(DefaultApolloClient, apolloClient);
    // },
    render: () => h(App)
});
  app.use(BootstrapVue as any)
  app.use(BootstrapVueIcons as any)
  app.use(router);
  app.mount('#app');

  
//router guard 
router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  fetch('/api/check')
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