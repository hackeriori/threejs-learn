import { createApp } from 'vue'
import './style.css'
import router from "./router";
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'

createApp(App).use(router).use(ui).mount('#app')
