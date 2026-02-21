<template>
  <div class="confirmation-overlay" @click="handleOverlayClick">
    <div class="confirmation-card" @click.stop>
      <!-- 卡片头部 -->
      <div class="card-header">
        <div class="header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
          </svg>
        </div>
        <h2 class="card-title">{{ template?.title || '请确认' }}</h2>
        <button class="close-button" @click="$emit('cancel')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- 卡片内容 - 通用渲染 -->
      <div class="card-content">
        <div class="sections">
          <div 
            v-for="(section, sIndex) in template?.sections" 
            :key="sIndex" 
            class="section"
          >
            <h3 class="section-title">
              <span class="section-icon">{{ getSectionIcon(section.icon) }}</span>
              {{ section.title }}
            </h3>
            
            <div class="fields">
              <div 
                v-for="(field, fIndex) in section.fields" 
                :key="fIndex"
                class="field-item"
              >
                <span class="field-label">{{ field.label }}</span>
                <span class="field-value" :class="getFieldClass(field)">
                  {{ getFieldValue(field) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button 
            v-for="(action, aIndex) in template?.actions"
            :key="aIndex"
            class="btn"
            :class="getActionClass(action.type)"
            @click="handleAction(action)"
            :disabled="loading && action.type === 'confirm'"
          >
            <svg v-if="action.type === 'confirm' && !loading" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <svg v-else-if="action.type === 'edit'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <svg v-else-if="action.type === 'cancel'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
            <div v-if="loading && action.type === 'confirm'" class="spinner"></div>
            {{ loading && action.type === 'confirm' ? '处理中...' : action.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  template: {
    type: Object,
    required: true,
    default: () => ({
      title: '请确认',
      sections: [],
      actions: []
    })
  },
  data: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel', 'edit'])

// 图标映射
const iconMap = {
  building: '🏢',
  user: '👤',
  users: '👥',
  target: '🎯',
  calendar: '📅',
  clock: '🕐',
  location: '📍',
  info: 'ℹ️',
  document: '📄',
  check: '✅',
  warning: '⚠️'
}

function getSectionIcon(icon) {
  return iconMap[icon] || '📋'
}

function getFieldValue(field) {
  const value = props.data[field.key]
  if (value === undefined || value === null) return '-'
  return value
}

function getFieldClass(field) {
  // 如果有特殊类型可以添加样式类
  if (field.type === 'tag') return 'tag'
  if (field.type === 'date') return 'date'
  return ''
}

function getActionClass(type) {
  const classMap = {
    confirm: 'btn-confirm',
    cancel: 'btn-cancel',
    edit: 'btn-edit'
  }
  return classMap[type] || 'btn-default'
}

function handleAction(action) {
  if (action.type === 'confirm') {
    emit('confirm', props.data)
  } else if (action.type === 'cancel') {
    emit('cancel')
  } else if (action.type === 'edit') {
    emit('edit', props.data)
  }
}

function handleOverlayClick() {
  emit('cancel')
}
</script>

<style scoped>
.confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.confirmation-card {
  background: var(--bg-primary, #1a1a1a);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color, #2d2d2d);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #2d2d2d);
  background: var(--bg-secondary, #252525);
}

.header-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent, #4285f4);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: white;
}

.card-title {
  flex: 1;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #e3e3e3);
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: var(--text-muted, #8e8e8e);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: var(--bg-tertiary, #2d2d2d);
  color: var(--text-secondary, #c4c4c4);
}

.card-content {
  padding: 24px;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.section {
  background: var(--bg-secondary, #252525);
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #e3e3e3);
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  font-size: 16px;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-label {
  font-size: 13px;
  color: var(--text-muted, #8e8e8e);
}

.field-value {
  font-size: 14px;
  color: var(--text-primary, #e3e3e3);
  font-weight: 500;
}

.field-value.tag {
  padding: 4px 12px;
  border-radius: 16px;
  background: rgba(66, 133, 244, 0.2);
  color: #4285f4;
}

.field-value.date {
  color: var(--accent, #4285f4);
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, #2d2d2d);
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  border: none;
}

.btn-confirm {
  background: var(--accent, #4285f4);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: var(--accent-hover, #3367d6);
  transform: translateY(-1px);
}

.btn-confirm:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-cancel {
  background: var(--bg-tertiary, #2d2d2d);
  color: var(--text-secondary, #c4c4c4);
}

.btn-cancel:hover {
  background: var(--bg-hover, #3d3d3d);
}

.btn-edit {
  background: transparent;
  color: var(--text-muted, #8e8e8e);
  border: 1px solid var(--border-color, #2d2d2d);
}

.btn-edit:hover {
  background: var(--bg-tertiary, #2d2d2d);
  color: var(--text-secondary, #c4c4c4);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 响应式 */
@media (max-width: 600px) {
  .field-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
