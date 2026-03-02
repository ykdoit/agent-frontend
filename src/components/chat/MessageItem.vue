<template>
  <div :class="['message', message.role]">
    <!-- 用户消息 -->
    <div v-if="message.role === 'user'" class="user-message">
      <div class="user-text">{{ message.content }}</div>
    </div>

    <!-- AI 消息 -->
    <div v-else class="ai-message">
      <div class="ai-avatar" :class="{ spinning: loading && !message.content }">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <div class="ai-content">
        <!-- 状态条：工具调用过程 -->
        <div v-if="currentStatus && loading" class="status-bar">
          <div class="status-spinner"></div>
          <span class="status-text">{{ currentStatus }}</span>
        </div>
        
        <!-- 加载动画 -->
        <div v-if="!message.content && loading" class="loading-dots">
          <span></span><span></span><span></span>
        </div>

        <!-- 消息内容 -->
        <template v-else>
          <!-- 确认卡片 -->
          <ConfirmationCard
            v-if="parsed.confirmationCard && !confirmationHandled"
            :plan-data="parsed.confirmationCard"
            @confirm="handleConfirmation(true)"
            @cancel="handleConfirmation(false)"
          />

          <!-- 最终内容 -->
          <div class="ai-text" v-html="formattedContent"></div>

          <!-- 时间选择器 -->
          <div v-if="parsed.timePicker && !timeSelected" class="time-picker">
            <button
              v-for="opt in timeOptions"
              :key="opt.value"
              class="time-btn"
              @click="onTimeSelect(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
          <div v-if="timeSelected" class="selected-value">
            已选择时段：{{ timeSelectedLabel }}
          </div>

          <!-- 操作按钮 -->
          <div v-if="message.content && !message.isWelcome" class="message-actions">
            <button class="action-btn" @click="copyContent" :title="copied ? '已复制' : '复制'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span class="action-label">{{ copied ? '已复制' : '复制' }}</span>
            </button>
            <button class="action-btn" @click="retry" title="重新生成">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 4v6h6"></path>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              <span class="action-label">重试</span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { parseStreamContent } from '@/composables/useWorkflow'
import { useChatStore } from '@/stores/chat'
import ConfirmationCard from '@/components/common/ConfirmationCard.vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['copy', 'retry', 'selectTime'])
const chatStore = useChatStore()

const copied = ref('')
const timeSelected = ref('')
const confirmationHandled = ref(false)

// 订阅 Store 的状态
const unsubscribe = ref(null)

onMounted(() => {
  // 订阅 currentStatus 变化
  const store = chatStore.$patch ? chatStore : { $state: chatStore.$state }
  if (store.$subscribe) {
    unsubscribe.value = store.$subscribe((mutation, state) => {
      console.log('🔄 状态更新:', state.currentStatus)
    })
  }
})

onUnmounted(() => {
  if (unsubscribe.value) {
    unsubscribe.value()
  }
})

// 当前状态（从 Store 获取）
const currentStatus = computed(() => chatStore.currentStatus)

// 时间选项映射
const timeOptions = computed(() => {
  const map = {
    'AM': '上午',
    'PM': '下午',
    'NIGHT': '晚上',
    'ALL': '全天'
  }
  return (props.parsed?.timePicker?.options || ['AM', 'PM', 'NIGHT', 'ALL']).map(opt => ({
    value: opt,
    label: map[opt] || opt
  }))
})

const timeSelectedLabel = computed(() => {
  const map = { 'AM': '上午', 'PM': '下午', 'NIGHT': '晚上', 'ALL': '全天' }
  return map[timeSelected.value] || timeSelected.value
})

// 解析内容
const parsed = computed(() => {
  return parseStreamContent(props.message.content)
})

// 处理确认操作
function handleConfirmation(confirmed) {
  confirmationHandled.value = true
  console.log('用户确认结果:', confirmed)
}

// 时间选择
function onTimeSelect(time) {
  timeSelected.value = time
  emit('selectTime', time)
}

// 格式化最终内容
const formattedContent = computed(() => {
  let content = parsed.value.displayContent
  if (!content) return ''

  content = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  content = content.replace(/\n/g, '<br>')
  content = content.replace(/<br>\s*<br>/g, '<br>')
  content = content.replace(/^<br>/, '')
  content = content.replace(/<br>$/g, '')

  return content
})

// 复制内容
async function copyContent() {
  try {
    await navigator.clipboard.writeText(props.message.content)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
    emit('copy', props.message.content)
  } catch (e) {
    console.error('复制失败:', e)
  }
}

// 重试
function retry() {
  emit('retry', props.message)
}
</script>

<style scoped>
.message {
  margin-bottom: 24px;
  animation: message-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 用户消息 */
.user-message {
  display: flex;
  justify-content: flex-end;
}

.user-text {
  background: var(--accent-light);
  border: 1px solid var(--accent);
  color: var(--text-primary);
  padding: 14px 20px;
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm);
  font-size: 15px;
  line-height: 1.6;
  max-width: 70%;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.user-text:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* AI 消息 */
.ai-message {
  display: flex;
  gap: 16px;
}

.ai-avatar {
  width: 40px;
  height: 40px;
  background: var(--accent-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: var(--shadow-glow);
}

.ai-avatar.spinning {
  animation: avatar-spin 1.5s linear infinite;
}

@keyframes avatar-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ai-content {
  flex: 1;
  padding-top: 8px;
}

/* 状态条 */
.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--text-secondary);
  animation: status-in 0.2s ease-out;
}

@keyframes status-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-text {
  font-weight: 500;
}

.ai-text {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-wrap;
}

/* 加载动画 */
.loading-dots {
  display: flex;
  gap: 6px;
  padding: 12px 0;
  align-items: center;
}

.loading-dots span {
  width: 10px;
  height: 10px;
  background: var(--accent);
  border-radius: 50%;
  animation: dot-bounce 1.4s infinite;
  box-shadow: 0 0 8px var(--accent);
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes dot-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* 操作按钮 */
.message-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  opacity: 0;
  transform: translateY(4px);
  transition: all var(--transition-fast);
}

.ai-message:hover .message-actions {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 50%;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.action-btn .action-label {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 6px;
  padding: 4px 8px;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.action-btn:hover .action-label {
  opacity: 1;
}

/* 选中值显示 */
.selected-value {
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--success-light);
  border: 1px solid var(--success);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--success);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.selected-value::before {
  content: '✓';
  font-weight: bold;
}

/* 时间选择器 */
.time-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.time-btn {
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-radius: var(--radius-full);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.time-btn:hover {
  border-color: var(--accent);
  background: var(--accent-light);
  color: var(--accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.time-btn:active {
  transform: translateY(0);
}

/* 响应式 */
@media (max-width: 768px) {
  .user-text {
    max-width: 85%;
    padding: 12px 16px;
  }
  
  .ai-avatar {
    width: 36px;
    height: 36px;
  }
  
  .message-actions {
    opacity: 1;
    transform: translateY(0);
  }
  
  .status-bar {
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>
