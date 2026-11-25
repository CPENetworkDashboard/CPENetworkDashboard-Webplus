import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './styles.css'
import './styles/typography.css'

createApp(App).use(router).mount('#app')
