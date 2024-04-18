import { createApp, h } from 'vue';
import { createRouter, createWebHistory, NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import App from './App.vue';
import Chat from './views/Chat.vue';
import LoginPage from './views/LoginPage.vue'
import Sidebar from './views/Sidebar.vue';


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
  
  app.use(router);
  app.mount('#app');

  
//router guard 
router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
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