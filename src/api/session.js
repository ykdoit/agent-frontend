/**
 * 会话 API
 * 
 * 职责：
 * - 会话 CRUD 操作
 * - 会话列表查询
 */

import { get, post, patch, del } from './request'

/**
 * 会话 API
 */
export const sessionApi = {
  /**
   * 获取会话列表
   * @param {Object} params - 查询参数
   * @param {string} params.user_id - 用户 ID
   * @param {number} params.page - 页码
   * @param {number} params.page_size - 每页数量
   * @returns {Promise<{sessions: Array, total: number}>}
   */
  list(params = {}) {
    return get('/sessions', params)
  },

  /**
   * 创建会话
   * @param {Object} data - 会话数据
   * @param {string} data.title - 会话标题
   * @param {string} data.user_id - 用户 ID
   * @returns {Promise<Object>}
   */
  create(data = {}) {
    return post('/sessions', data)
  },

  /**
   * 获取会话详情
   * @param {string} sessionId - 会话 ID
   * @returns {Promise<Object>}
   */
  get(sessionId) {
    return get(`/sessions/${sessionId}`)
  },

  /**
   * 更新会话
   * @param {string} sessionId - 会话 ID
   * @param {Object} data - 更新数据
   * @param {string} data.title - 会话标题
   * @param {boolean} data.pinned - 是否置顶
   * @returns {Promise<Object>}
   */
  update(sessionId, data = {}) {
    const params = {}
    if (data.title !== undefined) params.title = data.title
    if (data.pinned !== undefined) params.pinned = data.pinned
    return patch(`/sessions/${sessionId}`, params)
  },

  /**
   * 删除会话
   * @param {string} sessionId - 会话 ID
   * @returns {Promise<{success: boolean, message: string}>}
   */
  delete(sessionId) {
    return del(`/sessions/${sessionId}`)
  },

  /**
   * 重命名会话
   * @param {string} sessionId - 会话 ID
   * @param {string} title - 新标题
   * @returns {Promise<Object>}
   */
  rename(sessionId, title) {
    return this.update(sessionId, { title })
  },

  /**
   * 置顶/取消置顶会话
   * @param {string} sessionId - 会话 ID
   * @param {boolean} pinned - 是否置顶
   * @returns {Promise<Object>}
   */
  setPinned(sessionId, pinned) {
    return this.update(sessionId, { pinned })
  },
}
