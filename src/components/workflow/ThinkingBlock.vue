<template>
  <div class="thinking-section">
    <!-- 正在思考中（步骤执行期间） -->
    <div v-if="isLoading" class="thinking-active">
      <div class="thinking-header">
        <span class="thinking-icon pulse">💭</span>
        <span class="thinking-title">思考中...</span>
      </div>
      <div class="thinking-animation">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>

    <!-- 思考完成，显示推理内容（可折叠） -->
    <details v-else-if="content" class="thinking-block" open>
      <summary class="thinking-summary">
        <span class="thinking-icon">💭</span>
        <span class="thinking-title">推理过程</span>
        <span class="thinking-arrow">▼</span>
      </summary>
      <div class="thinking-content">{{ content }}</div>
    </details>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

// 有内容时显示折叠块，否则显示加载动画
const showLoading = computed(() => {
  return props.isLoading && !props.content
})
</script>

<style scoped>
.thinking-section {
  margin-bottom: 16px;
}

/* 正在思考中 - 动画效果 */
.thinking-active {
  background: var(--info-light);
  border: 1px solid rgba(66, 133, 244, 0.2);
  border-left: 3px solid var(--info);
  border-radius: 12px;
  padding: 12px 16px;
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.thinking-icon {
  font-size: 16px;
}

.thinking-icon.pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.95); }
}

.thinking-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--info);
}

.thinking-animation {
  display: flex;
  gap: 4px;
  padding-left: 24px;
}

.thinking-animation .dot {
  width: 6px;
  height: 6px;
  background: var(--info);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.thinking-animation .dot:nth-child(1) { animation-delay: 0s; }
.thinking-animation .dot:nth-child(2) { animation-delay: 0.2s; }
.thinking-animation .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1.2); opacity: 1; }
}

/* 思考完成 - 折叠块 */
.thinking-block {
  background: var(--info-light);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--info);
  border-radius: 12px;
  overflow: hidden;
}

.thinking-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
  list-style: none;
  transition: background 0.2s ease;
}

.thinking-summary::-webkit-details-marker {
  display: none;
}

.thinking-summary:hover {
  background: var(--bg-hover);
}

.thinking-arrow {
  font-size: 10px;
  color: var(--text-muted);
  transition: transform 0.2s ease;
}

.thinking-block[open] .thinking-arrow {
  transform: rotate(180deg);
}

.thinking-content {
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-muted);
  white-space: pre-wrap;
  border-top: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}
</style>
