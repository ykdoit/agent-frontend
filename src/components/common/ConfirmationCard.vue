<template>
  <div class="confirmation-overlay" @click="handleOverlayClick">
    <div class="confirmation-card" @click.stop>
      <!-- 卡片头部 -->
      <div class="card-header">
        <div class="header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
          </svg>
        </div>
        <h2 class="card-title">{{ title }}</h2>
        <button class="close-button" @click="$emit('cancel')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- 卡片内容 -->
      <div class="card-content">
        <!-- 计划摘要信息 -->
        <div class="plan-summary">
          <h3 class="summary-title">📋 计划详情</h3>
          
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">🏢 客户</span>
              <span class="info-value">{{ planData.customerName }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">👤 联系人</span>
              <span class="info-value">{{ planData.contactName }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">🎯 行动类型</span>
              <span class="info-value tag" :class="getActionTypeClass(planData.actionType)">
                {{ getActionTypeName(planData.actionType) }}
              </span>
            </div>
            
            <div class="info-item">
              <span class="info-label">📅 日期</span>
              <span class="info-value">{{ formatDate(planData.planDate) }}</span>
            </div>
            
            <div class="info-item full-width">
              <span class="info-label">📍 地点</span>
              <span class="info-value">{{ planData.location }}</span>
            </div>
            
            <div v-if="planData.remark" class="info-item full-width">
              <span class="info-label">📝 备注</span>
              <span class="info-value">{{ planData.remark }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮区域 -->
        <div class="action-buttons">
          <button class="btn btn-cancel" @click="$emit('cancel')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
            取消
          </button>
          
          <button class="btn btn-confirm" @click="$emit('confirm')" :disabled="loading">
            <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <div v-else class="spinner"></div>
            {{ loading ? '创建中...' : '确认创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  planData: {
    type: Object,
    required: true,
    default: () => ({
      customerName: '',
      contactName: '',
      actionType: '',
      planDate: '',
      location: '',
      remark: ''
    })
  },
  title: {
    type: String,
    default: '确认行动计划'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel'])

// 行动类型映射
const actionTypeMap = {
  'NEED_COMM': '需求沟通',
  'DAILY_MAINTAIN': '日常维护',
  'OPP_CONFIRM': '商机确认',
  'CONTRACT_NEGO': '合同谈判',
  'TECH_EXCHANGE': '技术交流',
  'BUSINESS_DINNER': '商务宴请'
}

// 获取行动类型名称
function getActionTypeName(type) {
  return actionTypeMap[type] || type
}

// 获取行动类型样式类
function getActionTypeClass(type) {
  const classMap = {
    'NEED_COMM': 'primary',
    'DAILY_MAINTAIN': 'secondary',
    'OPP_CONFIRM': 'warning',
    'CONTRACT_NEGO': 'danger',
    'TECH_EXCHANGE': 'info',
    'BUSINESS_DINNER': 'success'
  }
  return classMap[type] || 'default'
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  } catch {
    return dateString
  }
}

// 处理遮罩层点击
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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  animation: overlay-in 0.25s ease;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.confirmation-card {
  background: var(--bg-secondary, #1e1f20);
  border-radius: var(--radius-lg, 20px);
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.4));
  border: 1px solid var(--border-color, #2d2d2d);
  animation: card-in 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.card-header {
  display: flex;
  align-items: center;
  padding: 22px 26px;
  border-bottom: 1px solid var(--border-color, #2d2d2d);
  background: var(--bg-tertiary, #2d2d2d);
}

.header-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent-gradient, linear-gradient(135deg, #4285f4, #34a853));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  color: white;
  box-shadow: var(--shadow-glow, 0 0 20px rgba(66, 133, 244, 0.3));
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
  padding: 8px;
  border-radius: var(--radius-sm, 8px);
  transition: all var(--transition-fast, 0.15s ease);
}

.close-button:hover {
  background: var(--bg-hover, #3d3d3d);
  color: var(--text-primary, #e3e3e3);
  transform: rotate(90deg);
}

.card-content {
  padding: 26px;
}

.plan-summary {
  margin-bottom: 26px;
}

.summary-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #e3e3e3);
  margin: 0 0 18px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: var(--bg-tertiary, #2d2d2d);
  border-radius: var(--radius-sm, 8px);
  transition: all var(--transition-fast, 0.15s ease);
}

.info-item:hover {
  background: var(--bg-hover, #3d3d3d);
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 12px;
  color: var(--text-muted, #8e8e8e);
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary, #e3e3e3);
  font-weight: 500;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: var(--radius-full, 9999px);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  width: fit-content;
}

.tag.primary { background: var(--accent-light, rgba(66, 133, 244, 0.15)); color: var(--accent, #4285f4); }
.tag.secondary { background: rgba(154, 160, 166, 0.15); color: #9aa0a6; }
.tag.warning { background: var(--warning-light, rgba(251, 188, 4, 0.15)); color: var(--warning, #fbbc04); }
.tag.danger { background: var(--error-light, rgba(234, 67, 53, 0.15)); color: var(--error, #ea4335); }
.tag.info { background: var(--info-light, rgba(66, 133, 244, 0.15)); color: var(--info, #4285f4); }
.tag.success { background: var(--success-light, rgba(52, 168, 83, 0.15)); color: var(--success, #34a853); }

.action-buttons {
  display: flex;
  gap: 14px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid var(--border-color, #2d2d2d);
}

.btn {
  padding: 12px 24px;
  border-radius: var(--radius-md, 12px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all var(--transition-fast, 0.15s ease);
  border: none;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: white;
  opacity: 0;
  transition: opacity var(--transition-fast, 0.15s ease);
}

.btn:active::before {
  opacity: 0.15;
}

.btn-confirm {
  background: var(--accent-gradient, linear-gradient(135deg, #4285f4, #34a853));
  color: white;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.2));
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow, 0 0 20px rgba(66, 133, 244, 0.3));
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-cancel {
  background: var(--bg-tertiary, #2d2d2d);
  color: var(--text-secondary, #c4c4c4);
  border: 1px solid var(--border-color, #2d2d2d);
}

.btn-cancel:hover {
  background: var(--bg-hover, #3d3d3d);
  color: var(--text-primary, #e3e3e3);
  border-color: var(--border-subtle, #3d3d3d);
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

/* 响应式设计 */
@media (max-width: 600px) {
  .confirmation-card {
    width: 95%;
    margin: 16px;
  }
  
  .card-header {
    padding: 18px 20px;
  }
  
  .card-content {
    padding: 20px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .action-buttons {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>