<template>
  <div class="agent-status-bar" :class="statusClass">
    <div class="status-content">
      <div class="status-icon">{{ statusIcon }}</div>
      <div class="status-text">{{ statusText }}</div>
      <div class="progress-bar" v-if="showProgress">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  state: {
    type: String,
    default: 'initializing'
  },
  progress: {
    type: Number,
    default: 0
  },
  currentStage: {
    type: String,
    default: ''
  }
})

const statusConfig = {
  initializing: { icon: '⚡', text: '正在初始化...', class: 'status-initializing' },
  processing: { icon: '🧠', text: '正在处理中...', class: 'status-processing' },
  suspended: { icon: '✋', text: '等待您的确认...', class: 'status-suspended' },
  resuming: { icon: '🔄', text: '正在恢复执行...', class: 'status-resuming' },
  completed: { icon: '✅', text: '处理完成', class: 'status-completed' },
  error: { icon: '❌', text: '发生错误', class: 'status-error' }
}

const statusIcon = computed(() => statusConfig[props.state]?.icon || '❓')
const statusText = computed(() => statusConfig[props.state]?.text || '未知状态')
const statusClass = computed(() => statusConfig[props.state]?.class || 'status-unknown')
const showProgress = computed(() => ['processing', 'resuming'].includes(props.state))
</script>

<style scoped>
.agent-status-bar {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.status-initializing { background: #e3f2fd; color: #1976d2; }
.status-processing { background: #fff3e0; color: #f57c00; }
.status-suspended { background: #fce4ec; color: #c2185b; }
.status-resuming { background: #e8f5e8; color: #388e3c; }
.status-completed { background: #e8f5e8; color: #388e3c; }
.status-error { background: #ffebee; color: #d32f2f; }

.status-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.status-text {
  flex: 1;
  font-weight: 500;
}

.progress-bar {
  width: 100px;
  height: 6px;
  background: rgba(0,0,0,0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: currentColor;
  transition: width 0.3s ease;
}
</style>