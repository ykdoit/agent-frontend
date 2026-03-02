import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_URL = 'http://localhost:8088'
const WELCOME_MESSAGE = '你好！我是你的智能办公助手。我可以帮你制定销售计划、处理审批流程、查询业务数据等。有什么我可以帮助你的吗？'

export const useChatStore = defineStore('chat', () => {
  // State
  const chats = ref([])
  const currentChatId = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  // Agent 状态推送（工具调用过程）
  const currentStatus = ref('')
  
  // 执行阶段状态
  const currentExecutionStage = ref('')
  const executionStatus = ref('idle')
  
  // 推理过程
  const thinkingContent = ref('')
  
  // 工作流阶段
  const workflowStages = ref([])
  const currentProgress = ref(0)
  
  // 计算属性
  const currentChat = computed(() => {
    return chats.value.find(c => c.id === currentChatId.value)
  })
  
  const currentMessages = computed(() => {
    return currentChat.value?.messages || []
  })

  // Actions
  
  // 设置当前状态（工具调用过程）
  function setCurrentStatus(status) {
    currentStatus.value = status
  }
  
  // 清除状态
  function clearStatus() {
    currentStatus.value = ''
  }
  
  // 加载会话列表
  async function loadChats() {
    try {
      const res = await fetch(`${API_URL}/sessions`)
      if (res.ok) {
        const data = await res.json()
        if (data.sessions && data.sessions.length > 0) {
          chats.value = data.sessions.map(s => ({
            id: s.session_id,
            sessionId: s.session_id,
            title: s.title,
            messages: [],
            messageCount: s.message_count
          }))
          currentChatId.value = chats.value[0].id
          await loadChatHistory(chats.value[0].id)
          return
        }
      }
    } catch (e) {
      console.error('加载会话列表失败:', e)
    }
    
    const saved = localStorage.getItem('chats')
    if (saved) {
      chats.value = JSON.parse(saved)
    }
    if (chats.value.length === 0) {
      await createChat()
    } else {
      currentChatId.value = chats.value[0].id
    }
  }
  
  async function refreshTitles() {
    try {
      const res = await fetch(`${API_URL}/sessions`)
      if (res.ok) {
        const data = await res.json()
        if (data.sessions && data.sessions.length > 0) {
          data.sessions.forEach(s => {
            const chat = chats.value.find(c => c.sessionId === s.session_id)
            if (chat && chat.title !== s.title) {
              chat.title = s.title
            }
          })
        }
      }
    } catch (e) {
      console.error('刷新标题失败:', e)
    }
  }
  
  async function loadChatHistory(chatId) {
    const chat = chats.value.find(c => c.id === chatId)
    if (!chat || !chat.sessionId) return
    if (chat.messages && chat.messages.length > 0) return
    
    try {
      const res = await fetch(`${API_URL}/sessions/${chat.sessionId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.messages && data.messages.length > 0) {
          const hasWelcome = chat.messages.some(m => m.isWelcome)
          const historyMessages = data.messages.map(m => ({
            id: m.message_id,
            role: m.role,
            content: m.content
          }))
          chat.messages = hasWelcome 
            ? [{ id: 'welcome', role: 'assistant', content: WELCOME_MESSAGE, isWelcome: true }, ...historyMessages]
            : historyMessages
        }
      }
    } catch (e) {
      console.error('加载历史消息失败:', e)
    }
  }
  
  async function createChat() {
    try {
      const res = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '新对话' })
      })
      
      if (!res.ok) throw new Error('创建会话失败')
      
      const session = await res.json()
      
      const chat = {
        id: session.session_id,
        sessionId: session.session_id,
        title: session.title,
        messages: [{
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_MESSAGE,
          isWelcome: true
        }]
      }
      chats.value.unshift(chat)
      currentChatId.value = chat.id
      saveChats()
      return chat
    } catch (e) {
      console.error('创建会话失败:', e)
      const chat = {
        id: Date.now().toString(),
        sessionId: null,
        title: '新对话',
        messages: [{
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_MESSAGE,
          isWelcome: true
        }]
      }
      chats.value.unshift(chat)
      currentChatId.value = chat.id
      saveChats()
      return chat
    }
  }
  
  async function switchChat(id) {
    currentChatId.value = id
    currentExecutionStage.value = ''
    executionStatus.value = 'idle'
    clearStatus()
    await loadChatHistory(id)
  }
  
  async function deleteChat(id) {
    const chat = chats.value.find(c => c.id === id)
    
    if (chat?.sessionId) {
      try {
        await fetch(`${API_URL}/sessions/${chat.sessionId}`, { method: 'DELETE' })
      } catch (e) {
        console.error('删除会话失败:', e)
      }
    }
    
    const index = chats.value.findIndex(c => c.id === id)
    if (index > -1) {
      chats.value.splice(index, 1)
      if (currentChatId.value === id) {
        currentChatId.value = chats.value[0]?.id || null
        if (!currentChatId.value) {
          await createChat()
        }
      }
      saveChats()
    }
  }
  
  function addMessage(chatId, message) {
    const chat = chats.value.find(c => c.id === chatId)
    if (chat) {
      chat.messages.push(message)
      saveChats()
    }
  }
  
  function updateMessage(chatId, messageIndex, content) {
    const chat = chats.value.find(c => c.id === chatId)
    if (chat && chat.messages[messageIndex]) {
      chat.messages[messageIndex].content = content
      saveChats()
    }
  }
  
  function appendMessageContent(chatId, messageIndex, content) {
    const chatIndex = chats.value.findIndex(c => c.id === chatId)
    if (chatIndex === -1) return
    
    const chat = chats.value[chatIndex]
    if (!chat.messages[messageIndex]) return
    
    const newMessages = [...chat.messages]
    newMessages[messageIndex] = {
      ...newMessages[messageIndex],
      content: newMessages[messageIndex].content + content
    }
    
    chats.value[chatIndex] = {
      ...chat,
      messages: newMessages
    }
  }
  
  function updateChatTitle(chatId, title) {
    const chat = chats.value.find(c => c.id === chatId)
    if (chat) {
      chat.title = title
      saveChats()
    }
  }
  
  function updateSessionId(chatId, sessionId) {
    const chat = chats.value.find(c => c.id === chatId)
    if (chat && !chat.sessionId) {
      chat.sessionId = sessionId
      saveChats()
    }
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
  
  function appendThinking(content) {
    thinkingContent.value += content
  }
  
  function clearThinking() {
    thinkingContent.value = ''
  }
  
  function saveChats() {
    localStorage.setItem('chats', JSON.stringify(chats.value))
  }

  return {
    // State
    chats,
    currentChatId,
    loading,
    error,
    currentStatus,
    currentExecutionStage,
    executionStatus,
    workflowStages,
    currentProgress,
    thinkingContent,
    
    // Computed
    currentChat,
    currentMessages,
    
    // Actions
    setCurrentStatus,
    clearStatus,
    loadChats,
    loadChatHistory,
    refreshTitles,
    createChat,
    switchChat,
    deleteChat,
    addMessage,
    updateMessage,
    appendMessageContent,
    updateChatTitle,
    updateSessionId,
    setExecutionStage,
    setWorkflowStages,
    setLoading,
    setError,
    clearError,
    saveChats,
    appendThinking,
    clearThinking
  }
})
