import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sessionApi } from '@/api'
import { get } from '@/api/request'

/**
 * 会话状态管理
 * 
 * 职责：
 * - 会话列表管理
 * - 会话 CRUD 操作
 * - 当前会话切换
 */
export const useSessionStore = defineStore('session', () => {
  // ============== State ==============
  const sessions = ref([])
  const currentSessionId = ref(null)

  // ============== Computed ==============
  const currentSession = computed(() => {
    return sessions.value.find(s => s.id === currentSessionId.value)
  })

  const hasSessions = computed(() => {
    return sessions.value.length > 0
  })

  // ============== 内部方法 ==============

  /**
   * 排序会话（置顶优先）
   */
  function sortSessions() {
    sessions.value.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return 0
    })
  }

  /**
   * 保存到本地缓存
   */
  function saveToCache() {
    localStorage.setItem('sessions', JSON.stringify(sessions.value))
  }

  // ============== 会话操作 ==============

  /**
   * 加载会话列表
   */
  async function loadSessions() {
    try {
      const data = await sessionApi.list()

      if (data.sessions && data.sessions.length > 0) {
        sessions.value = data.sessions.map(s => ({
          id: s.session_id,
          sessionId: s.session_id,
          title: s.title,
          pinned: s.pinned || false,
          messageCount: s.message_count,
          createdAt: s.created_at,
          updatedAt: s.updated_at
        }))
        sortSessions()
        saveToCache()
        return true
      }

      // 后端没有会话，清除本地缓存
      sessions.value = []
      currentSessionId.value = null
      localStorage.removeItem('sessions')
      return false
    } catch (e) {
      console.error('加载会话列表失败:', e)

      // 网络失败时使用本地缓存
      const saved = localStorage.getItem('sessions')
      if (saved) {
        try {
          sessions.value = JSON.parse(saved)
          sortSessions()
          if (sessions.value.length > 0) {
            return true
          }
        } catch (parseErr) {
          console.error('本地缓存数据损坏，已清除:', parseErr)
          localStorage.removeItem('sessions')
        }
      }
      return false
    }
  }

  /**
   * 创建新会话
   */
  async function createSession() {
    try {
      const session = await sessionApi.create({ title: '新对话' })

      const newSession = {
        id: session.session_id,
        sessionId: session.session_id,
        title: session.title,
        pinned: false,
        messageCount: 0,
        createdAt: session.created_at,
        updatedAt: session.updated_at
      }

      sessions.value.unshift(newSession)
      sortSessions()
      currentSessionId.value = newSession.id
      saveToCache()
      return newSession
    } catch (e) {
      console.error('创建会话失败:', e)
      const tempId = `local-${Date.now()}`
      const newSession = {
        id: tempId,
        sessionId: tempId,
        title: '新对话',
        pinned: false,
        messageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      sessions.value.unshift(newSession)
      sortSessions()
      currentSessionId.value = newSession.id
      saveToCache()
      return newSession
    }
  }

  /**
   * 切换会话
   */
  function switchSession(id) {
    currentSessionId.value = id
  }

  /**
   * 删除会话
   */
  async function deleteSession(id) {
    const session = sessions.value.find(s => s.id === id)

    if (session?.sessionId) {
      try {
        await sessionApi.delete(session.sessionId)
      } catch (e) {
        console.error('删除会话失败:', e)
      }
    }

    const index = sessions.value.findIndex(s => s.id === id)
    if (index > -1) {
      sessions.value.splice(index, 1)
      // 注意：不再自动设置 currentSessionId，由路由控制
      saveToCache()
    }
  }

  /**
   * 重命名会话
   */
  async function renameSession(sessionId, newTitle) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session || !session.sessionId) return

    try {
      await sessionApi.rename(session.sessionId, newTitle)
      session.title = newTitle
      saveToCache()
    } catch (e) {
      console.error('重命名会话失败:', e)
    }
  }

  /**
   * 置顶/取消置顶会话
   */
  async function togglePinSession(sessionId) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session || !session.sessionId) return

    const newPinned = !session.pinned

    try {
      await sessionApi.setPinned(session.sessionId, newPinned)
      session.pinned = newPinned
      sortSessions()
      saveToCache()
    } catch (e) {
      console.error('置顶操作失败:', e)
    }
  }

  /**
   * 刷新会话标题
   */
  async function refreshTitles() {
    try {
      const data = await sessionApi.list()
      if (data.sessions && data.sessions.length > 0) {
        data.sessions.forEach(s => {
          const session = sessions.value.find(sess => sess.sessionId === s.session_id)
          if (session && session.title !== s.title) {
            session.title = s.title
          }
        })
      }
    } catch (e) {
      console.error('刷新标题失败:', e)
    }
  }

  /**
   * 更新会话 ID（首次创建后）
   */
  function updateSessionId(localId, serverSessionId) {
    const session = sessions.value.find(s => s.id === localId)
    if (session && !session.sessionId) {
      session.sessionId = serverSessionId
      session.id = serverSessionId
      if (currentSessionId.value === localId) {
        currentSessionId.value = serverSessionId
      }
      saveToCache()
    }
  }

  // ============== 搜索 ==============
  const searchResults = ref([])
  const searchLoading = ref(false)
  const searchQuery = ref('')

  async function searchSessions(query) {
    if (!query.trim()) {
      searchResults.value = []
      searchQuery.value = ''
      return
    }
    searchLoading.value = true
    searchQuery.value = query
    try {
      const data = await get('/sessions/search', { q: query })
      searchResults.value = data.results || []
    } catch (e) {
      console.error('搜索失败:', e)
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }

  return {
    // State
    sessions,
    currentSessionId,
    searchResults,
    searchLoading,
    searchQuery,

    // Computed
    currentSession,
    hasSessions,

    // Actions
    loadSessions,
    createSession,
    switchSession,
    deleteSession,
    renameSession,
    togglePinSession,
    refreshTitles,
    updateSessionId,
    searchSessions,
  }
})
