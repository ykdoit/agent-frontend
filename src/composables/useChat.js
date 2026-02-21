import { ref, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { getApiURL } from '@/api/config'
import { SSEConnectionManager } from '@/api/sse'
import { resumeSession as apiResumeSession, getSessionState as apiGetSessionState } from '@/api/chat'

/**
 * 聊天 Composable
 */
export function useChat() {
  const chatStore = useChatStore()
  const connectionManager = new SSEConnectionManager()
  const inputText = ref('')
  const messagesRef = ref(null)
  const inputRef = ref(null)
  
  // 当前 AI 消息索引
  let currentAiMsgIndex = -1
  let currentChatId = null
  
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
  
  function scrollToBottom() {
    nextTick(() => {
      // 使用浏览器级别的滚动
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
    if (json.session_id) {
      chatStore.updateSessionId(currentChatId, json.session_id)
    }
    
    const eventType = json.event
    
    // 处理不同事件类型
    switch (eventType) {
      case 'workflow':
        if (json.stages && json.stages.length > 0) {
          console.log('📊 Workflow stages:', json.stages)
          chatStore.setWorkflowStages(json.stages)
        }
        break
        
      case 'thought':
        if (json.stage_id) {
          console.log(`💭 [${json.stage_id}] ${json.detail || ''}`)
          chatStore.setExecutionStage(json.stage_id)
          if (json.detail) {
            chatStore.appendThinking(json.detail + '\n')
          }
        }
        break
        
      case 'message':
        const content = json.content
        if (content) {
          chatStore.appendMessageContent(currentChatId, currentAiMsgIndex, content)
          scrollToBottom()
        }
        if (json.finished) {
          chatStore.setExecutionStage('completed')
        }
        break
        
      case 'call':
        console.log(`🔧 工具调用:`, json.tool_name || json)
        break
        
      case 'interaction':
        console.log(`✋ 交互请求:`, json)
        chatStore.setInteractionRequest({
          type: json.type,
          step: json.step,
          description: json.description,
          template: json.template,
          timestamp: Date.now()
        })
        break
        
      case 'control':
        if (json.state === 'waiting_for_input') {
          chatStore.setLoading(false)
        } else if (json.state === 'completed') {
          chatStore.setLoading(false)
        }
        if (json.error) {
          console.error('❌ Error:', json.error)
          chatStore.appendMessageContent(currentChatId, currentAiMsgIndex, `\n\n[错误: ${json.error}]`)
        }
        break
    }
    
    // 兼容旧格式：OpenAI 风格
    if (!eventType && json.choices?.[0]?.delta?.content) {
      const content = json.choices[0].delta.content
      chatStore.appendMessageContent(currentChatId, currentAiMsgIndex, content)
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
    
    const chat = chatStore.currentChat
    if (!chat) return
    
    currentChatId = chat.id
    inputText.value = ''
    
    // 添加用户消息
    chatStore.addMessage(chat.id, {
      id: Date.now().toString(),
      role: 'user',
      content: text
    })
    
    // 更新标题（首条用户消息时）
    if (chat.messages.filter(m => m.role === 'user').length === 1) {
      const cleanTitle = text
        .replace(/[\n\r]/g, ' ')  // 换行转空格
        .replace(/\s+/g, ' ')       // 多空格合并
        .trim()
      chatStore.updateChatTitle(chat.id, cleanTitle.slice(0, 20) + (cleanTitle.length > 20 ? '...' : ''))
    }
    
    scrollToBottom()
    chatStore.setLoading(true)
    chatStore.clearError()
    chatStore.clearThinking()
    
    // 添加空的 AI 消息
    chatStore.addMessage(chat.id, {
      id: 'ai-' + Date.now(),
      role: 'assistant',
      content: ''
    })
    
    currentAiMsgIndex = chatStore.currentMessages.length - 1
    
    // 建立 SSE 连接
    await connectionManager.connect(
      getApiURL('/v1/chat/completions'),
      {
        model: 'Pro/zai-org/GLM-4.7',
        message: text,
        session_id: chat.sessionId,
        stream: true
      },
      handleSSEEvent,
      (error) => {
        chatStore.appendMessageContent(currentChatId, currentAiMsgIndex, '抱歉，发生了网络错误，请稍后重试。')
        chatStore.setError(error)
      },
      () => {
        chatStore.setLoading(false)
        scrollToBottom()
        // 延迟刷新标题，获取 AI 生成的新标题
        setTimeout(() => {
          chatStore.refreshTitles()
        }, 3000)
      }
    )
  }
  
  async function retryMessage(msg) {
    const chat = chatStore.currentChat
    if (!chat || chatStore.loading) return
    
    const msgIndex = chat.messages.findIndex(m => m.id === msg.id)
    if (msgIndex <= 0) return
    
    const userMsg = chat.messages[msgIndex - 1]
    if (userMsg.role !== 'user') return
    
    chat.messages.splice(msgIndex, 1)
    inputText.value = userMsg.content
    await sendMessage()
  }
  
  async function sendMessageWithText(text) {
    inputText.value = text
    await sendMessage()
  }
  
  function disconnect() {
    connectionManager.disconnect()
  }
  
  async function resumeSession(sessionId, response) {
    return await apiResumeSession(sessionId, response)
  }
  
  async function getSessionState(sessionId) {
    return await apiGetSessionState(sessionId)
  }
  
  return {
    inputText,
    messagesRef,
    inputRef,
    chatStore,
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
