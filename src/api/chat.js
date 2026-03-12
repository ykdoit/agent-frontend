/**
 * 聊天 API
 *
 * 职责：
 * - 聊天消息相关操作
 * - 会话恢复
 * - 模型列表
 */

import { get, post, getFullUrl } from './request'

/**
 * 聊天 API
 */
export const chatApi = {
  /**
   * 获取可用模型列表
   * @returns {Promise<Array>}
   */
  getModels() {
    return get('/v1/models')
  },

  /**
   * 获取指定模型详情
   * @param {string} modelId - 模型 ID
   * @returns {Promise<Object>}
   */
  getModel(modelId) {
    return get(`/v1/models/${modelId}`)
  },

  /**
   * 恢复挂起的会话
   * @param {string} sessionId - 会话 ID
   * @param {string} response - 用户响应
   * @returns {Promise<Object>}
   */
  resumeSession(sessionId, response) {
    return post(`/sessions/${sessionId}/resume`, { response })
  },

  /**
   * 获取会话状态
   * @param {string} sessionId - 会话 ID
   * @returns {Promise<Object>}
   */
  getSessionState(sessionId) {
    return get(`/sessions/${sessionId}/state`)
  },

  /**
   * 获取聊天完成 API 的完整 URL（用于 SSE）
   * @returns {string}
   */
  getChatCompletionsUrl() {
    return getFullUrl('/v1/chat/completions')
  },
}
