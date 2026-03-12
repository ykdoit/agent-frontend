import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sessionApi } from '@/api'
import { useWebSocket } from '@/composables/useWebSocket'

/**
 * 聊天状态管理
 * 
 * 职责：
 * - 消息管理
 * - 加载状态
 * - Agent 执行状态
 */
export const useChatStore = defineStore('chat', () => {
  // ============== State ==============
  // 消息存储：{ [sessionId]: Message[] }
  const messagesMap = ref({})
  
  // 加载状态
  const loading = ref(false)
  const error = ref(null)
  
  // Agent 状态推送
  const currentStatus = ref('')
  const currentExecutionStage = ref('')
  const executionStatus = ref('idle')
  
  // 推理过程
  const thinkingContent = ref('')
  
  // 工作流阶段
  const workflowStages = ref([])
  const currentProgress = ref(0)

  // ============== Computed ==============

  /**
   * 当前执行阶段文本（用于显示）
   */
  const currentExecutionStageText = computed(() => {
    return currentStatus.value || currentExecutionStage.value || ''
  })

  // ============== 消息操作 ==============

  /**
   * 获取会话的消息列表（确保返回数组）
   */
  function getMessages(sessionId) {
    const messages = messagesMap.value[sessionId]
    return Array.isArray(messages) ? messages : []
  }

  /**
   * 设置会话消息
   */
  function setMessages(sessionId, messages) {
    messagesMap.value[sessionId] = messages
  }

  /**
   * 添加消息
   */
  function addMessage(sessionId, message) {
    if (!messagesMap.value[sessionId]) {
      messagesMap.value[sessionId] = []
    }
    messagesMap.value[sessionId].push(message)
    return message.id  // return ID for caller to track
  }

  /**
   * 更新消息
   */
  function updateMessage(sessionId, messageId, content) {
    const messages = messagesMap.value[sessionId]
    if (!messages) return
    const msg = messages.find(m => m.id === messageId)
    if (msg) msg.content = content
  }

  /**
   * 追加消息内容（流式输出）
   */
  function appendMessageContent(sessionId, messageId, content) {
    const messages = messagesMap.value[sessionId]
    if (!messages) return
    const msg = messages.find(m => m.id === messageId)
    if (msg) msg.content += content
  }

  /**
   * 标记消息流式输出已完成
   */
  function markMessageComplete(sessionId, messageId) {
    const messages = messagesMap.value[sessionId]
    if (!messages) return
    const msg = messages.find(m => m.id === messageId)
    if (msg) msg.streaming = false
  }

  /**
   * 删除单条消息（通过 store action，保持响应式）
   */
  function removeMessage(sessionId, messageId) {
    const messages = messagesMap.value[sessionId]
    if (!messages) return
    const index = messages.findIndex(m => m.id === messageId)
    if (index > -1) messages.splice(index, 1)
  }

  /**
   * 清空会话消息
   */
  function clearMessages(sessionId) {
    messagesMap.value[sessionId] = []
  }

  // ============== 状态操作 ==============

  function setCurrentStatus(status) {
    currentStatus.value = status
  }

  function clearStatus() {
    currentStatus.value = ''
  }

  function setLoading(status) {
    loading.value = status
    if (!status) {
      executionStatus.value = 'success'
      currentExecutionStage.value = 'completed'
      clearStatus()
    }
  }

  function setError(errorInfo) {
    error.value = errorInfo
    executionStatus.value = 'error'
  }

  function clearError() {
    error.value = null
    executionStatus.value = 'idle'
  }

  function setExecutionStage(stage) {
    currentExecutionStage.value = stage
    if (stage) {
      executionStatus.value = 'processing'
    }
  }

  function setWorkflowStages(stages) {
    workflowStages.value = stages
    currentProgress.value = 0
  }

  function appendThinking(content) {
    thinkingContent.value += content
  }

  function clearThinking() {
    thinkingContent.value = ''
  }

  // ============== 历史消息加载 ==============

  /**
   * 从服务器拉取会话消息并更新 store（仅当服务器有 assistant 消息时才覆盖本地）
   * 返回 true 表示已拿到完整对话（含 assistant），false 表示还没
   */
  async function _fetchAndUpdateHistory(sessionId) {
    try {
      const data = await sessionApi.get(sessionId)
      if (data.messages && data.messages.length > 0) {
        const hasAssistant = data.messages.some(m => m.role === 'assistant')
        if (hasAssistant) {
          messagesMap.value[sessionId] = data.messages.map(m => ({
            id: m.message_id,
            role: m.role,
            content: m.content,
            streaming: false
          }))
          return true
        }
      }
    } catch (e) {
      console.error('加载历史消息失败:', e)
    }
    return false
  }

  /**
   * 订阅 WebSocket session_updated 事件，收到后立即刷新消息
   * 兜底：60 秒内没有 WS 推送则轮询一次（应对断线重连场景）
   */
  function _subscribeSessionUpdate(sessionId) {
    const { subscribe } = useWebSocket()
    let done = false

    const unsubscribe = subscribe(sessionId, async (updatedSessionId) => {
      if (done) return
      done = true
      unsubscribe()
      clearTimeout(fallbackTimer)
      await _fetchAndUpdateHistory(updatedSessionId)
    })

    // 兜底：60s 后如果 WS 没推来，主动拉一次
    const fallbackTimer = setTimeout(async () => {
      if (done) return
      done = true
      unsubscribe()
      // 移除 streaming 标记，避免永远显示 loading
      const msgs = messagesMap.value[sessionId]
      if (msgs?.length) {
        const last = msgs[msgs.length - 1]
        if (last.streaming) last.streaming = false
      }
      await _fetchAndUpdateHistory(sessionId)
    }, 60000)

    return unsubscribe
  }

  /**
   * 加载会话历史消息
   *
   * 三种情况：
   * 1. 无本地缓存 → 直接从服务器拉
   * 2. 有本地缓存且正常结束 → 直接用缓存
   * 3. 有本地缓存但流被中断（streaming: true）：
   *    - 标记完成，继续显示本地已有内容（避免空白）
   *    - 移除空的 AI 气泡（如果啥都没收到）
   *    - 订阅 WebSocket，backend_save 完成时立即推送更新
   */
  async function loadHistory(sessionId) {
    const existing = messagesMap.value[sessionId]

    if (existing?.length > 0) {
      const lastMsg = existing[existing.length - 1]

      if (lastMsg.streaming !== true) {
        return // 正常结束，直接用缓存
      }

      // 流被中断：保留 streaming: true，让 AI 气泡持续显示 loading 动画
      // 不删空气泡 —— 用户能看到"AI 正在回复"而不是空白
      // 若内容为空，加一个占位提示，避免气泡高度塌陷
      if (lastMsg.role === 'assistant' && !lastMsg.content.trim()) {
        lastMsg.content = ''  // 保持空，loading dots 会显示
      }
      // WebSocket 推送到后，_fetchAndUpdateHistory 替换为真实内容（streaming→false）
      _subscribeSessionUpdate(sessionId)
      return
    }

    // 无本地缓存，直接拉服务器
    await _fetchAndUpdateHistory(sessionId)
  }

  return {
    // State
    messagesMap,
    loading,
    error,
    currentStatus,
    currentExecutionStage,
    currentExecutionStageText,
    executionStatus,
    workflowStages,
    currentProgress,
    thinkingContent,

    // 消息操作
    getMessages,
    setMessages,
    addMessage,
    updateMessage,
    appendMessageContent,
    markMessageComplete,
    removeMessage,
    clearMessages,

    // 状态操作
    setCurrentStatus,
    clearStatus,
    setLoading,
    setError,
    clearError,
    setExecutionStage,
    setWorkflowStages,
    appendThinking,
    clearThinking,

    // 历史加载
    loadHistory,
  }
})
