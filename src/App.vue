<template>
  <div class="app" :class="currentTheme">
    <!-- 侧边栏 -->
    <Sidebar />
    
    <!-- 主区域 -->
    <main class="main">
      <div class="main-layout">
        <!-- 对话区域 -->
        <div class="chat-area">
          <!-- 顶部标题栏 -->
          <header class="chat-header">
            <h1 class="chat-title">{{ currentChatTitle }}</h1>
          </header>
          
          <!-- 消息区 -->
          <MessageList
            ref="messageListRef"
            :messages="chatStore.currentMessages"
            :loading="chatStore.loading"
            :loading-text="chatStore.currentExecutionStageText"
            @retry="retryMessage"
            @select-time="onSelectTime"
          />
          
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
import { ref, onMounted, watch, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useChat } from '@/composables/useChat'
import { useTheme } from '@/composables/useTheme'
import { Sidebar, MessageList, ChatInput } from '@/components/chat'

const chatStore = useChatStore()
const { theme, loadTheme } = useTheme()

// 确保 theme 是响应式的
const currentTheme = theme

const messageListRef = ref(null)
const chat = useChat()

// 当前对话标题
const currentChatTitle = computed(() => {
  return chatStore.currentChat?.title || '新对话'
})

// 当 messageListRef 变化时，更新 chat 的 messagesRef
watch(messageListRef, (newRef) => {
  if (newRef) {
    chat.messagesRef = newRef
  }
})

onMounted(async () => {
  loadTheme()
  await chatStore.loadChats()
})

function handleSend(text) {
  chat.sendMessage()
}

function retryMessage(msg) {
  chat.retryMessage(msg)
}

function onSelectTime(time) {
  chat.sendMessageWithText(time)
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

/* 全局波纹效果 */
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: currentColor;
  opacity: 0;
  transform: scale(0);
  pointer-events: none;
}

.ripple:active::after {
  animation: ripple-effect 0.6s ease-out;
}

@keyframes ripple-effect {
  0% {
    opacity: 0.3;
    transform: scale(0);
  }
  100% {
    opacity: 0;
    transform: scale(2.5);
  }
}

/* Focus visible 全局样式 */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

button:focus:not(:focus-visible) {
  outline: none;
}

/* 骨架屏动画 */
@keyframes skeleton-loading {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-hover) 50%, var(--bg-tertiary) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: var(--radius-sm);
}

.app { display: flex; min-height: 100vh; }

/* 主区域 */
.main { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  background: var(--bg-primary);
  transition: background 0.25s ease;
}

/* 主布局 */
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

/* 标题栏 */
.chat-header {
  padding: 16px 24px;
  text-align: center;
  background: var(--bg-primary);
  position: sticky;
  top: 0;
  z-index: 10;
}

.chat-header .chat-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  
  .header {
    padding: 10px 16px;
  }
}
</style>
