import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sessionApi } from '@/api'

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
  }

  /**
   * 更新消息
   */
  function updateMessage(sessionId, messageIndex, content) {
    const messages = messagesMap.value[sessionId]
    if (messages && messages[messageIndex]) {
      messages[messageIndex].content = content
    }
  }

  /**
   * 追加消息内容（流式输出）
   */
  function appendMessageContent(sessionId, messageIndex, content) {
    const messages = messagesMap.value[sessionId]
    if (messages && messages[messageIndex]) {
      messages[messageIndex].content += content
    }
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
   * 加载会话历史消息
   */
  async function loadHistory(sessionId) {
    if (messagesMap.value[sessionId]?.length > 0) return

    try {
      const data = await sessionApi.get(sessionId)
      if (data.messages && data.messages.length > 0) {
        messagesMap.value[sessionId] = data.messages.map(m => ({
          id: m.message_id,
          role: m.role,
          content: m.content
        }))
      }
    } catch (e) {
      console.error('加载历史消息失败:', e)
    }
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
