import { ref, computed, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useSessionStore } from '@/stores/session'
import { chatApi, SSEConnectionManager } from '@/api'

/**
 * 聊天 Composable
 * 
 * 职责：
 * - 处理用户输入验证
 * - 管理 SSE 连接
 * - 分发后端事件到 Store
 */
export function useChat() {
  const chatStore = useChatStore()
  const sessionStore = useSessionStore()
  const connectionManager = new SSEConnectionManager()
  const inputText = ref('')
  
  let currentAiMsgIndex = -1
  let currentSessionId = null

  /**
   * 当前会话的消息列表
   */
  const currentMessages = computed(() => {
    const sessionId = sessionStore.currentSessionId
    if (!sessionId) return []
    return chatStore.getMessages(sessionId)
  })
  
  /**
   * 当前会话
   */
  const currentSession = computed(() => sessionStore.currentSession)
  
  /**
   * 验证用户输入
   */
  function validateInput(text) {
    if (!text || text.trim().length === 0) {
      return { valid: false, error: '请输入有效内容' }
    }
    if (/<script|javascript:|on\w+\s*=/.test(text.toLowerCase())) {
      return { valid: false, error: '输入内容包含不安全字符' }
    }
    if (text.length > 1000) {
      return { valid: false, error: '输入内容过长' }
    }
    return { valid: true }
  }
  
  /**
   * 滚动到底部
   */
  function scrollToBottom() {
    nextTick(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      })
    })
  }
  
  /**
   * 处理 SSE 事件
   */
  async function handleSSEEvent(json) {
    // 更新 sessionId
    if (json.session_id && currentSessionId) {
      sessionStore.updateSessionId(currentSessionId, json.session_id)
    }
    
    const eventType = json.event
    
    switch (eventType) {
      case 'status':
        console.log(`🔄 [${json.stage}] ${json.text}`)
        chatStore.setCurrentStatus(json.text)
        break
        
      case 'workflow':
        if (json.stages && json.stages.length > 0) {
          chatStore.setWorkflowStages(json.stages)
        }
        break
        
      case 'thought':
        if (json.stage_id) {
          chatStore.setExecutionStage(json.stage_id)
          if (json.detail) {
            chatStore.appendThinking(json.detail + '\n')
          }
        }
        break
        
      case 'interaction':
        console.log(`✋ 交互请求:`, json)
        break
        
      case 'control':
        if (json.state === 'waiting_for_input' || json.state === 'completed') {
          chatStore.setLoading(false)
        }
        if (json.error) {
          console.error('❌ Error:', json.error)
          chatStore.appendMessageContent(currentSessionId, currentAiMsgIndex, `\n\n[错误: ${json.error}]`)
        }
        break
    }
    
    // 兼容 OpenAI 格式
    if (!eventType && json.choices?.[0]?.delta?.content) {
      const content = json.choices[0].delta.content
      chatStore.appendMessageContent(currentSessionId, currentAiMsgIndex, content)
      scrollToBottom()
    }
  }
  
  /**
   * 发送消息
   */
  async function sendMessage() {
    const text = inputText.value.trim()
    const validation = validateInput(text)
    if (!validation.valid || chatStore.loading) return
    
    const session = sessionStore.currentSession
    if (!session) return
    
    currentSessionId = session.id
    inputText.value = ''
    
    // 添加用户消息
    chatStore.addMessage(session.id, {
      id: Date.now().toString(),
      role: 'user',
      content: text
    })
    
    // 更新标题（首次发送）
    const messages = chatStore.getMessages(session.id)
    if (messages.filter(m => m.role === 'user').length === 1) {
      const cleanTitle = text.replace(/[\n\r]/g, ' ').replace(/\s+/g, ' ').trim()
      sessionStore.renameSession(session.id, cleanTitle.slice(0, 20) + (cleanTitle.length > 20 ? '...' : ''))
    }
    
    scrollToBottom()
    chatStore.setLoading(true)
    chatStore.clearError()
    chatStore.clearThinking()
    chatStore.clearStatus()
    
    // 添加空的 AI 消息
    chatStore.addMessage(session.id, {
      id: 'ai-' + Date.now(),
      role: 'assistant',
      content: ''
    })
    
    currentAiMsgIndex = chatStore.getMessages(session.id).length - 1
    
    // 建立 SSE 连接
    await connectionManager.connect(
      chatApi.getChatCompletionsUrl(),
      {
        model: 'Pro/zai-org/GLM-4.7',
        message: text,
        session_id: session.sessionId,
        stream: true
      },
      handleSSEEvent,
      (error) => {
        chatStore.appendMessageContent(currentSessionId, currentAiMsgIndex, '抱歉，发生了网络错误，请稍后重试。')
        chatStore.setError(error)
        chatStore.clearStatus()
      },
      () => {
        chatStore.setLoading(false)
        chatStore.clearStatus()
        scrollToBottom()
        setTimeout(() => sessionStore.refreshTitles(), 3000)
      }
    )
  }
  
  /**
   * 重试消息
   */
  async function retryMessage(msg) {
    const sessionId = sessionStore.currentSessionId
    if (!sessionId || chatStore.loading) return
    
    const messages = chatStore.getMessages(sessionId)
    const msgIndex = messages.findIndex(m => m.id === msg.id)
    if (msgIndex <= 0) return
    
    const userMsg = messages[msgIndex - 1]
    if (userMsg.role !== 'user') return
    
    // 移除 AI 消息
    messages.splice(msgIndex, 1)
    inputText.value = userMsg.content
    await sendMessage()
  }
  
  /**
   * 使用指定文本发送消息
   */
  async function sendMessageWithText(text) {
    inputText.value = text
    await sendMessage()
  }
  
  /**
   * 断开连接
   */
  function disconnect() {
    connectionManager.disconnect()
  }
  
  /**
   * 恢复会话
   */
  async function resumeSession(sessionId, response) {
    return await chatApi.resumeSession(sessionId, response)
  }
  
  /**
   * 获取会话状态
   */
  async function getSessionState(sessionId) {
    return await chatApi.getSessionState(sessionId)
  }
  
  return {
    inputText,
    currentMessages,
    currentSession,
    chatStore,
    sessionStore,
    sendMessage,
    retryMessage,
    sendMessageWithText,
    scrollToBottom,
    disconnect,
    validateInput,
    resumeSession,
    getSessionState
  }
}
