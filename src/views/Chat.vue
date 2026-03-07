<template>
  <div class="chat-view">
    <!-- 顶部标题栏 -->
    <header class="chat-header">
      <h1 class="chat-title">{{ sessionStore.currentSession?.title || '智能办公助手' }}</h1>
    </header>

    <!-- 消息区 -->
    <MessageList
      ref="messageListRef"
      :messages="messages"
      :loading="chatStore.loading"
      :loading-text="chatStore.currentExecutionStageText"
      @retry="retryMessage"
      @select-time="onSelectTime"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useSessionStore } from '@/stores/session'
import { useChat } from '@/composables/useChat'
import { MessageList } from '@/components/chat'

const chatStore = useChatStore()
const sessionStore = useSessionStore()
const chat = useChat()
const messageListRef = ref(null)

// 直接从 chatStore 获取消息，确保响应式追踪
const messages = computed(() => {
  const sessionId = sessionStore.currentSessionId
  if (!sessionId) return []
  return chatStore.getMessages(sessionId) || []
})

// 暴露方法给父组件
defineExpose({
  scrollToBottom: chat.scrollToBottom,
  retryMessage: chat.retryMessage,
  sendMessageWithText: chat.sendMessageWithText
})

function retryMessage(msg) {
  chat.retryMessage(msg)
}

function onSelectTime(time) {
  chat.sendMessageWithText(time)
}
</script>

<style scoped>
.chat-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chat-header {
  padding: 16px 24px;
  text-align: center;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
  transition: background var(--transition-normal), border-color var(--transition-normal);
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
