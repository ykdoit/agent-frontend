<template>
  <div class="input-area">
    <div class="input-container">
      <!-- 模型选择器 -->
      <div class="model-selector">
        <select
          v-model="localModel"
          class="model-select"
          :disabled="loading"
        >
          <option
            v-for="model in sessionStore.models"
            :key="model.id"
            :value="model.id"
          >
            {{ model.root || model.name || model.id }}
          </option>
        </select>
      </div>

      <div class="input-box">
        <textarea
          v-model="localInputText"
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.enter.shift.exact="() => {}"
          placeholder="向智能办公助手提问..."
          rows="1"
          ref="inputRef"
        ></textarea>
        <div class="input-actions">
          <!-- 清空按钮 -->
          <button
            v-if="localInputText.trim()"
            class="action-btn clear-btn"
            title="清空输入"
            @click="clearInput"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <button
            class="send-btn"
            :class="{ active: localInputText.trim() && !loading }"
            :disabled="!localInputText.trim() || loading"
            @click="sendMessage"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
      <div class="input-hint">
        智能办公助手可能会产生不准确的信息，请注意甄别。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['send', 'update:modelValue'])

const localInputText = ref(props.modelValue)
const localModel = ref(sessionStore.currentModel)
const inputRef = ref(null)

// 同步父组件的值
watch(() => props.modelValue, (newVal) => {
  localInputText.value = newVal
})

watch(localInputText, (newVal) => {
  emit('update:modelValue', newVal)
})

// 监听模型变化，同步到 store
watch(localModel, (newModel) => {
  sessionStore.setCurrentModel(newModel)
})

function sendMessage() {
  if (!localInputText.value.trim() || props.loading) return
  emit('send', localInputText.value)
  localInputText.value = ''
}

function clearInput() {
  localInputText.value = ''
  inputRef.value?.focus()
}
</script>

<style scoped>
/* 输入区 */
.input-area {
  position: sticky;
  bottom: 0;
  padding: 16px 24px 24px;
  background: var(--bg-primary);
  transition: background 0.25s ease;
}

.input-container {
  max-width: 860px;
  margin: 0 auto;
}

/* 模型选择器 */
.model-selector {
  margin-bottom: 12px;
}

.model-select {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 13px;
  padding: 6px 12px;
  cursor: pointer;
  outline: none;
  transition: all var(--transition-fast);
}

.model-select:hover {
  border-color: var(--accent);
}

.model-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-light);
}

.model-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-box {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 10px 10px 10px 22px;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.input-box:focus-within {
  border-color: var(--accent);
  box-shadow: var(--shadow-glow);
  background: var(--bg-primary);
}

.input-box textarea {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 16px;
  color: var(--text-primary);
  resize: none;
  outline: none;
  font-family: inherit;
  line-height: 1.6;
  max-height: 200px;
  padding: 10px 0;
}

.input-box textarea::placeholder { 
  color: var(--text-muted);
  transition: color var(--transition-fast);
}

.input-box:focus-within textarea::placeholder {
  color: var(--text-secondary);
}

.input-actions {
  display: flex;
  gap: 6px;
  padding-bottom: 6px;
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 10px;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  position: relative;
}

.action-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;
  border-radius: inherit;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.action-btn:hover { 
  color: var(--text-primary); 
  background: var(--bg-hover);
}

.action-btn:active::before {
  opacity: 0.15;
}

/* 清空按钮动画 */
.clear-btn {
  animation: fade-in 0.2s ease;
}

.clear-btn:hover {
  color: var(--error);
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.send-btn {
  background: var(--bg-tertiary);
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 12px;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: scale(1);
  position: relative;
  overflow: hidden;
}

.send-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, white 10%, transparent 10%);
  background-position: center;
  transform: scale(10);
  opacity: 0;
  transition: opacity 0.5s, transform 0.5s;
}

.send-btn:active::before {
  opacity: 0.2;
  transform: scale(0);
  transition: transform 0s;
}

.send-btn.active {
  background: var(--accent-gradient);
  color: #fff;
  transform: scale(1.08);
  box-shadow: var(--shadow-glow);
}

.send-btn.active:hover { 
  transform: scale(1.12);
  box-shadow: 0 0 28px rgba(66, 133, 244, 0.45);
}

.send-btn.active svg {
  animation: send-ready 0.5s ease;
}

@keyframes send-ready {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.send-btn:disabled { 
  cursor: not-allowed; 
  opacity: 0.4; 
  transform: scale(1);
}

.input-hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 14px;
  opacity: 0.8;
}

/* 响应式 */
@media (max-width: 768px) {
  .input-area {
    padding: 16px 16px 20px;
  }
  
  .input-box {
    padding: 8px 8px 8px 16px;
    border-radius: var(--radius-md);
  }
  
  .input-box textarea {
    font-size: 15px;
  }
}
</style>
