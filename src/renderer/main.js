// Must be first: installs browser fallbacks for the Electron preload APIs.
import './browser-shim.js'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import { createPinia } from 'pinia';
import { useAuthStore } from './stores/auth.js';
import { useUserStore } from './stores/user.js'
import {createMetaManager} from 'vue-meta'
// import 'core-js';
// import VueMeta from 'vue-meta';
import '@fortawesome/fontawesome-free/css/all.css'
import './assets/smallverse.css'

loadFonts()

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
const authStore = useAuthStore();
const userStore = useUserStore();
// Restoring the previous session must never decide whether the app mounts.
// This chain had no .catch(), so a single rejection left the page blank.
authStore.initialize().then(() => {
  if (authStore.isLoggedIn) {
    return userStore.initialize()
  }
}).catch((err) => {
  console.error('Could not restore session state; continuing signed out:', err)
}).finally(() => {
  app
    .use(router)
    .use(createMetaManager())
    .use(vuetify, {icons:{iconfont: 'fa'}})
    .mount('#app')
})

// createApp(App)
//   .use(router)
//   .use(createPinia())
//   .use(vuetify, {icons:{iconfont: 'fa'}})
//   .mount('#app')
