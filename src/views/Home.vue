<template>
  <div class="welcome-view">
    <div class="welcome-header">
      <div class="welcome-avatar">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <h1 class="welcome-title">你好，我是智能办公助手</h1>
      <p class="welcome-subtitle">我可以帮你制定销售计划、处理审批流程、查询业务数据等</p>
    </div>

    <div class="suggestions">
      <div class="suggestion-title">你可以这样问我：</div>
      <div class="suggestion-grid">
        <button
          v-for="suggestion in suggestions"
          :key="suggestion"
          class="suggestion-card"
          @click="$emit('select', suggestion)"
        >
          <span class="suggestion-text">{{ suggestion }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineEmits(['select'])

const suggestions = ref([
  '帮我创建明天去拜访客户的销售行动计划',
  '查询本周需要跟进的客户有哪些',
  '帮我写一份项目汇报材料',
  '我明天请假，帮我提交请假申请'
])
</script>

<style scoped>
/* 欢迎界面 */
.welcome-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  max-width: 800px;
  margin: 0 auto;
}

.welcome-header {
  text-align: center;
  margin-bottom: 48px;
}

.welcome-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--accent-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: white;
  box-shadow: var(--shadow-glow);
}

.welcome-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.welcome-subtitle {
  font-size: 15px;
  color: var(--text-muted);
  margin: 0;
  max-width: 400px;
  line-height: 1.6;
}

.suggestions {
  width: 100%;
}

.suggestion-title {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 16px;
  text-align: center;
}

.suggestion-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.suggestion-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.suggestion-card:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.suggestion-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.suggestion-card:hover .suggestion-text {
  color: var(--text-primary);
}

@media (max-width: 600px) {
  .suggestion-grid {
    grid-template-columns: 1fr;
  }

  .welcome-title {
    font-size: 24px;
  }
}
</style>
