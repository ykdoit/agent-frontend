<template>
  <div class="messages" ref="messagesRef">
    <div class="messages-inner">
      <MessageItem
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        :loading="loading && msg.id === messages[messages.length - 1]?.id"
        @retry="retryMessage"
        @select-time="onSelectTime"
      />
      
      <!-- 推理过程展示（仅在有内容时显示） -->
      <ThinkingBlock 
        v-if="thinkingContent"
        :content="thinkingContent"
        :is-loading="false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import MessageItem from './MessageItem.vue'
import ThinkingBlock from '@/components/workflow/ThinkingBlock.vue'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: '正在思考'
  }
})

// 推理内容
const thinkingContent = computed(() => chatStore.thinkingContent)

const emit = defineEmits(['retry', 'selectTime'])

const messagesRef = ref(null)

function retryMessage(msg) {
  emit('retry', msg)
}

function onSelectTime(time) {
  emit('selectTime', time)
}

// 自动滚动到底部
function scrollToBottom() {
  nextTick(() => {
    // 使用浏览器级别的滚动
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    })
  })
}

// 监听消息变化，自动滚动
watch(() => props.messages, () => {
  scrollToBottom()
}, { deep: true })

// 暴露方法给父组件
defineExpose({
  scrollToBottom
})
</script>

<style scoped>
/* 消息区 */
.messages { 
  flex: 1; 
}

.messages-inner { 
  max-width: 860px; 
  margin: 0 auto; 
  padding: 24px;
}
</style>
