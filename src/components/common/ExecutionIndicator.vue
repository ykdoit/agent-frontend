<template>
  <div v-if="isVisible" class="execution-indicator" :class="statusClass">
    <div class="indicator-content">
      <div class="spinner" v-if="status === 'processing'"></div>
      <svg v-else-if="status === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <svg v-else-if="status === 'error'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <span class="stage-text">{{ stageText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  stage: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'processing', // processing, success, error
    validator: (value) => ['processing', 'success', 'error'].includes(value)
  }
})

const isVisible = ref(false)
const currentStage = ref('')

// 映射阶段名称为用户友好的显示文本
const stageMap = {
  // 新增：Thought 事件阶段
  'understanding': '正在理解您的需求',
  'generating': '正在生成回复',
  'searching': '正在搜索相关信息...',
  'fetching_actions': '获取可执行操作...',
  'querying_contact': '查询联系人信息...',
  'fetching_contacts': '获取联系人列表...',
  'creating': '正在创建计划...',
  'completed': '处理完成'
}

const stageText = computed(() => {
  return stageMap[props.stage] || props.stage || '正在处理...'
})

const statusClass = computed(() => {
  return `status-${props.status}`
})

// 监听阶段变化，控制显示
watch(() => props.stage, (newStage) => {
  if (newStage && newStage !== 'completed') {
    currentStage.value = newStage
    isVisible.value = true
  } else if (newStage === 'completed') {
    isVisible.value = false
  }
})

// 监听状态变化
watch(() => props.status, (newStatus) => {
  if (newStatus === 'success' || newStatus === 'error') {
    setTimeout(() => {
      isVisible.value = false
    }, 2000)
  }
})
</script>

<style scoped>
.execution-indicator {
  position: fixed;
  top: 70px;  /* 调整到更合适的位置，避开顶部栏 */
  right: 20px;
  z-index: 1000;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 8px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  animation: slideIn 0.3s ease-out;
}

.indicator-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-top: 2px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.status-success {
  border-color: var(--success);
  color: var(--success);
}

.status-error {
  border-color: var(--error);
  color: var(--error);
}

.stage-text {
  white-space: nowrap;
}
</style>