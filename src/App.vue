<template>
  <div class="app" :class="currentTheme">
    <!-- 侧边栏 -->
    <Sidebar />

    <!-- 主区域 -->
    <main class="main">
      <div class="main-layout">
        <!-- 对话区域 -->
        <div class="chat-area">
          <!-- 路由视图 -->
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" @select="handleSuggestion" />
            </keep-alive>
          </router-view>

          <!-- 输入区 -->
          <ChatInput
            v-model="chat.inputText.value"
            :loading="chatStore.loading"
            @send="handleSend"
          />
        </div>
      </div>
    </main>

    <!-- 错误提示 -->
    <div v-if="chatStore.error" class="error-toast">
      <span>{{ chatStore.error }}</span>
      <button @click="chatStore.clearError()">关闭</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useSessionStore } from '@/stores/session'
import { useChat } from '@/composables/useChat'
import { useTheme } from '@/composables/useTheme'
import { Sidebar, ChatInput } from '@/components/chat'

const router = useRouter()
const route = useRoute()
const chatStore = useChatStore()
const sessionStore = useSessionStore()
const chat = useChat()
const { theme, loadTheme } = useTheme()
const currentTheme = theme

// Auto-dismiss error toast after 5 seconds
watch(() => chatStore.error, (err) => {
  if (err) {
    setTimeout(() => chatStore.clearError(), 5000)
  }
})

// 待发送的消息（用于首页创建会话后发送）
const pendingMessage = ref('')

onMounted(async () => {
  loadTheme()
  await sessionStore.loadSessions()
})

/**
 * 监听路由变化，切换会话并加载历史
 */
watch(() => route.params.id, async (newId) => {
  // Disconnect any active SSE stream before switching sessions
  chat.disconnect()

  if (newId) {
    // 设置当前会话
    sessionStore.switchSession(newId)
    // 加载历史消息
    const session = sessionStore.sessions.find(s => s.id === newId)
    if (session?.sessionId) {
      await chatStore.loadHistory(session.sessionId)
    }

    // 如果有待发送的消息，发送它
    if (pendingMessage.value) {
      chat.inputText.value = pendingMessage.value
      pendingMessage.value = ''
      chat.sendMessage()
    }
  } else {
    // 首页，清空当前会话
    sessionStore.switchSession(null)
  }
}, { immediate: true })

/**
 * 处理发送消息
 */
async function handleSend() {
  const text = chat.inputText.value.trim()
  if (!text) return
  
  // 如果没有当前会话，先创建一个
  if (!sessionStore.currentSession) {
    pendingMessage.value = text
    chat.inputText.value = ''
    const newSession = await sessionStore.createSession()
    router.push({ name: 'chat', params: { id: newSession.id } })
    return
  }
  chat.sendMessage()
}

/**
 * 处理选择建议
 */
async function handleSuggestion(suggestion) {
  // 如果没有当前会话，先创建一个
  if (!sessionStore.currentSession) {
    pendingMessage.value = suggestion
    const newSession = await sessionStore.createSession()
    router.push({ name: 'chat', params: { id: newSession.id } })
    return
  }
  // 使用建议文本发送消息
  chat.inputText.value = suggestion
  chat.sendMessage()
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  /* 背景色 */
  --bg-primary: #131314;
  --bg-secondary: #1e1f20;
  --bg-tertiary: #2d2d2d;
  --bg-hover: #3d3d3d;
  --bg-elevated: #252526;

  /* 边框与分割线 */
  --border-color: #2d2d2d;
  --border-subtle: #3d3d3d;

  /* 文字色 */
  --text-primary: #e3e3e3;
  --text-secondary: #c4c4c4;
  --text-muted: #8e8e8e;

  /* 主题色 */
  --accent: #4285f4;
  --accent-hover: #5a9bff;
  --accent-light: rgba(66, 133, 244, 0.15);
  --accent-gradient: linear-gradient(135deg, #4285f4, #34a853);

  /* 语义色 */
  --success: #34a853;
  --success-light: rgba(52, 168, 83, 0.15);
  --warning: #fbbc04;
  --warning-light: rgba(251, 188, 4, 0.15);
  --error: #ea4335;
  --error-light: rgba(234, 67, 53, 0.15);
  --info: #4285f4;
  --info-light: rgba(66, 133, 244, 0.15);

  /* 阴影 */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.4);
  --shadow-glow: 0 0 20px rgba(66, 133, 244, 0.3);

  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-full: 9999px;

  /* 过渡 */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
  --transition-slow: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.light {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #e8eaed;
  --bg-hover: #dadce0;
  --bg-elevated: #ffffff;
  --border-color: #e8eaed;
  --border-subtle: #dadce0;
  --text-primary: #202124;
  --text-secondary: #3c4043;
  --text-muted: #5f6368;
  --accent: #1a73e8;
  --accent-hover: #1557b0;
  --accent-light: rgba(26, 115, 232, 0.1);
  --accent-gradient: linear-gradient(135deg, #1a73e8, #34a853);
  --success: #1e8e3e;
  --success-light: rgba(30, 142, 62, 0.1);
  --warning: #f9ab00;
  --warning-light: rgba(249, 171, 0, 0.1);
  --error: #d93025;
  --error-light: rgba(217, 48, 37, 0.1);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.16);
  --shadow-glow: 0 0 20px rgba(26, 115, 232, 0.2);
}

body {
  font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background var(--transition-normal), color var(--transition-normal);
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 滚动条样式 - 自动适配深色/浅色主题 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 4px;
  transition: background var(--transition-normal);
}

::-webkit-scrollbar-thumb {
  background: var(--bg-tertiary);
  border-radius: 4px;
  transition: background var(--transition-normal);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--bg-hover);
}

::-webkit-scrollbar-corner {
  background: var(--bg-secondary);
}

/* Firefox 滚动条 */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--bg-tertiary) var(--bg-secondary);
}

.app { display: flex; min-height: 100vh; }

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  transition: background 0.25s ease;
}

.main-layout {
  display: flex;
  flex: 1;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

/* 错误提示 */
.error-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--error);
  color: white;
  padding: 14px 24px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  animation: toast-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.error-toast button {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  transition: background var(--transition-fast);
}

.error-toast button:hover {
  background: rgba(255,255,255,0.3);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .chat-area {
    max-width: 100%;
  }
}
</style>
