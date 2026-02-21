/**
 * 聊天相关 API
 */
import { getApiURL } from './config'

/**
 * 恢复挂起的会话
 */
export async function resumeSession(sessionId, response) {
  try {
    const res = await fetch(getApiURL(`/sessions/${sessionId}/resume`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response })
    })
    return await res.json()
  } catch (error) {
    console.error('恢复会话失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 获取会话状态
 */
export async function getSessionState(sessionId) {
  try {
    const res = await fetch(getApiURL(`/sessions/${sessionId}/state`))
    return await res.json()
  } catch (error) {
    console.error('获取会话状态失败:', error)
    return { error: error.message }
  }
}

/**
 * 获取会话列表
 */
export async function getSessions() {
  try {
    const res = await fetch(getApiURL('/sessions'))
    return await res.json()
  } catch (error) {
    console.error('获取会话列表失败:', error)
    return []
  }
}

/**
 * 创建新会话
 */
export async function createSession(sessionId) {
  try {
    const res = await fetch(getApiURL('/sessions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    })
    return await res.json()
  } catch (error) {
    console.error('创建会话失败:', error)
    return { error: error.message }
  }
}

/**
 * 删除会话
 */
export async function deleteSession(sessionId) {
  try {
    const res = await fetch(getApiURL(`/sessions/${sessionId}`), {
      method: 'DELETE'
    })
    return await res.json()
  } catch (error) {
    console.error('删除会话失败:', error)
    return { error: error.message }
  }
}
