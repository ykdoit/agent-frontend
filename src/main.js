import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'

const app = createApp(App)

// 使用 Pinia 状态管理
app.use(createPinia())

// 使用 Vue Router
app.use(router)

app.mount('#app')
