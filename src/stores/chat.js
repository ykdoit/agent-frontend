import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'

const API_URL = 'http://localhost:8088'
const WELCOME_MESSAGE = '你好！我是你的智能办公助手。我可以帮你制定销售计划、处理审批流程、查询业务数据等。有什么我可以帮助你的吗？'

export const useChatStore = defineStore('chat', () => {
  // State
  const chats = ref([])
  const currentChatId = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  // 执行阶段状态
  const currentExecutionStage = ref('')
  const executionStatus = ref('idle')
  
  // 推理过程（用户可见的思考内容）
  const thinkingContent = ref('')
  
  // 工作流阶段（用于显示进度条）
  const workflowStages = ref([])
  const currentProgress = ref(0)
  
  // 计算属性
  const currentChat = computed(() => {
    return chats.value.find(c => c.id === currentChatId.value)
  })
  
  const currentMessages = computed(() => {
    return currentChat.value?.messages || []
  })
  
  const currentExecutionStageText = computed(() => {
    const stageTextMap = {
      // 通用阶段
      'understanding': '正在理解您的需求',
      'generating': '正在生成回复',
      'thinking': '正在思考',
      'processing': '正在处理数据',
      // 工作流步骤
      'searching': '正在搜索客户信息',
      'fetching_contacts': '正在获取联系人',
      'fetching_phases': '正在加载销售阶段',
      'fetching_actions': '正在加载销售动作',
      'selecting_customer': '请选择客户',
      'selecting_contact': '请选择联系人',
      'confirming': '请确认信息',
      'creating': '正在创建计划',
      'completed': '处理完成'
    }
    return stageTextMap[currentExecutionStage.value] || currentExecutionStage.value || '正在思考'
  })

  // Actions
  
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
          // 加载第一个会话的历史消息
          await loadChatHistory(chats.value[0].id)
          return
        }
      }
    } catch (e) {
      console.error('加载会话列表失败:', e)
    }
    
    // 降级：从 localStorage 加载
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
  
  // 刷新会话标题（不影响当前消息）
  async function refreshTitles() {
    try {
      const res = await fetch(`${API_URL}/sessions`)
      if (res.ok) {
        const data = await res.json()
        if (data.sessions && data.sessions.length > 0) {
          // 只更新标题，不改变消息
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
  
  // 加载会话历史消息
  async function loadChatHistory(chatId) {
    const chat = chats.value.find(c => c.id === chatId)
    if (!chat || !chat.sessionId) return
    
    // 如果已有消息，不再重复加载
    if (chat.messages && chat.messages.length > 0) return
    
    try {
      const res = await fetch(`${API_URL}/sessions/${chat.sessionId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.messages && data.messages.length > 0) {
          // 欢迎消息与历史消息合并
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
  
  // 创建新会话
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
      // 降级：本地创建
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
  
  // 切换会话
  async function switchChat(id) {
    currentChatId.value = id
    currentExecutionStage.value = ''
    executionStatus.value = 'idle'
    // 加载历史消息
    await loadChatHistory(id)
  }
  
  // 删除会话
  async function deleteChat(id) {
    const chat = chats.value.find(c => c.id === id)
    
    // 调用后端删除接口
    if (chat?.sessionId) {
      try {
        await fetch(`${API_URL}/sessions/${chat.sessionId}`, { method: 'DELETE' })
      } catch (e) {
        console.error('删除会话失败:', e)
      }
    }
    
    // 本地删除
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
  
  // 添加消息
  function addMessage(chatId, message) {
    const chat = chats.value.find(c => c.id === chatId)
    if (chat) {
      chat.messages.push(message)
      saveChats()
    }
  }
  
  // 更新消息
  function updateMessage(chatId, messageIndex, content) {
    const chat = chats.value.find(c => c.id === chatId)
    if (chat && chat.messages[messageIndex]) {
      chat.messages[messageIndex].content = content
      saveChats()
    }
  }
  
  // 追加消息内容（用于 SSE 流式更新）
  function appendMessageContent(chatId, messageIndex, content) {
    const chatIndex = chats.value.findIndex(c => c.id === chatId)
    if (chatIndex === -1) return
    
    const chat = chats.value[chatIndex]
    if (!chat.messages[messageIndex]) return
    
    // 创建新的消息数组来触发响应式更新
    const newMessages = [...chat.messages]
    newMessages[messageIndex] = {
      ...newMessages[messageIndex],
      content: newMessages[messageIndex].content + content
    }
    
    // 替换整个 chat 对象
    chats.value[chatIndex] = {
      ...chat,
      messages: newMessages
    }
  }
  
  // 更新会话标题
  function updateChatTitle(chatId, title) {
    const chat = chats.value.find(c => c.id === chatId)
    if (chat) {
      chat.title = title
      saveChats()
    }
  }
  
  // 更新 sessionId
  function updateSessionId(chatId, sessionId) {
    const chat = chats.value.find(c => c.id === chatId)
    if (chat && !chat.sessionId) {
      chat.sessionId = sessionId
      saveChats()
    }
  }
  
  // 设置执行阶段
  function setExecutionStage(stage) {
    currentExecutionStage.value = stage
    if (stage) {
      executionStatus.value = 'processing'
      // 更新进度
      const stageInfo = workflowStages.value.find(s => s.id === stage)
      if (stageInfo) {
        currentProgress.value = stageInfo.progress || 0
      }
    }
  }
  
  // 设置工作流阶段
  function setWorkflowStages(stages) {
    workflowStages.value = stages
    currentProgress.value = 0
  }
  
  // 设置加载状态
  function setLoading(status) {
    loading.value = status
    if (!status) {
      executionStatus.value = 'success'
      currentExecutionStage.value = 'completed'
    }
  }
  
  // 设置错误
  function setError(errorInfo) {
    error.value = errorInfo
    executionStatus.value = 'error'
  }
  
  // 清除错误
  function clearError() {
    error.value = null
    executionStatus.value = 'idle'
  }
  
  // 追加推理内容
  function appendThinking(content) {
    thinkingContent.value += content
  }
  
  // 清空推理内容
  function clearThinking() {
    thinkingContent.value = ''
  }
  
  // 保存到 localStorage
  function saveChats() {
    localStorage.setItem('chats', JSON.stringify(chats.value))
  }

  return {
    // State
    chats,
    currentChatId,
    loading,
    error,
    currentExecutionStage,
    executionStatus,
    workflowStages,
    currentProgress,
    thinkingContent,
    
    // Computed
    currentChat,
    currentMessages,
    currentExecutionStageText,
    
    // Actions
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
