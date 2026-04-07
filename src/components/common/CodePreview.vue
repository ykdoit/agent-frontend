<template>
  <div class="code-preview">
    <div class="preview-header">
      <span class="preview-title">🎮 代码预览</span>
      <div class="preview-actions">
        <button v-if="!isRunning" @click="runCode" class="run-btn">
          ▶ 运行
        </button>
        <button v-else @click="stopCode" class="stop-btn">
          ⏹ 停止
        </button>
        <button @click="copyCode" class="copy-btn">
          {{ copied ? '✓ 已复制' : '📋 复制' }}
        </button>
        <button @click="toggleFullscreen" class="fullscreen-btn">
          {{ isFullscreen ? '⛶ 退出全屏' : '⛶ 全屏' }}
        </button>
      </div>
    </div>

    <div class="preview-container" :class="{ fullscreen: isFullscreen }">
      <iframe
        v-if="isRunning"
        ref="previewFrame"
        class="preview-frame"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      ></iframe>
      <div v-else class="preview-placeholder">
        <p>点击"运行"按钮预览代码效果</p>
      </div>
    </div>

    <div class="code-section">
      <div class="code-header">
        <span class="code-lang">{{ language }}</span>
      </div>
      <pre class="code-block"><code>{{ code }}</code></pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

const props = defineProps({
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'html'
  }
})

const isRunning = ref(false)
const isFullscreen = ref(false)
const copied = ref(false)
const previewFrame = ref(null)

const runCode = () => {
  isRunning.value = true

  // 等待 iframe 渲染后注入代码
  setTimeout(() => {
    if (previewFrame.value) {
      const doc = previewFrame.value.contentDocument || previewFrame.value.contentWindow.document
      doc.open()
      doc.write(props.code)
      doc.close()
    }
  }, 100)
}

const stopCode = () => {
  isRunning.value = false
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

onUnmounted(() => {
  isRunning.value = false
})
</script>

<style scoped>
.code-preview {
  margin: 12px 0;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-secondary, #1e1f20);
  border: 1px solid var(--border-color, #2d2d2d);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--bg-tertiary, #2d2d2d);
  border-bottom: 1px solid var(--border-color, #2d2d2d);
}

.preview-title {
  font-weight: 600;
  color: var(--text-primary, #e3e3e3);
  font-size: 14px;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.run-btn, .stop-btn, .copy-btn, .fullscreen-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.run-btn {
  background: linear-gradient(135deg, #4285f4, #34a853);
  color: white;
}

.run-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(66, 133, 244, 0.4);
}

.stop-btn {
  background: linear-gradient(135deg, #ea4335, #fbbc04);
  color: white;
}

.copy-btn, .fullscreen-btn {
  background: var(--bg-hover, #3d3d3d);
  color: var(--text-secondary, #c4c4c4);
}

.copy-btn:hover, .fullscreen-btn:hover {
  background: var(--bg-tertiary, #4d4d4d);
}

.preview-container {
  width: 100%;
  height: 400px;
  background: white;
  position: relative;
  transition: all 0.3s;
}

.preview-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 14px;
}

.code-section {
  border-top: 1px solid var(--border-color, #2d2d2d);
}

.code-header {
  padding: 8px 14px;
  background: var(--bg-tertiary, #2d2d2d);
  border-bottom: 1px solid var(--border-color, #2d2d2d);
}

.code-lang {
  font-size: 12px;
  color: var(--accent, #4285f4);
  font-weight: 500;
}

.code-block {
  margin: 0;
  padding: 14px;
  background: var(--bg-primary, #131314);
  color: var(--text-primary, #e3e3e3);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

.code-block code {
  white-space: pre;
}
</style>
