/**
 * 统一请求封装
 * 
 * 职责：
 * - 统一请求配置
 * - 错误处理
 * - 响应拦截
 */

const API_BASE_URL = 'http://localhost:8000'
const DEFAULT_TIMEOUT = 120000 // 2分钟

/**
 * 请求错误类
 */
class RequestError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'RequestError'
    this.status = status
    this.data = data
  }
}

/**
 * 基础请求方法
 */
async function request(url, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = DEFAULT_TIMEOUT,
  } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    signal: controller.signal,
  }

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config)
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new RequestError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      )
    }

    // 处理空响应
    const text = await response.text()
    return text ? JSON.parse(text) : null

  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      throw new RequestError('请求超时', 408, null)
    }

    throw error
  }
}

/**
 * GET 请求
 */
export function get(url, params = null) {
  let fullUrl = url
  if (params) {
    const searchParams = new URLSearchParams(params)
    fullUrl = `${url}?${searchParams.toString()}`
  }
  return request(fullUrl, { method: 'GET' })
}

/**
 * POST 请求
 */
export function post(url, body = null) {
  return request(url, { method: 'POST', body })
}

/**
 * PATCH 请求
 */
export function patch(url, params = null, body = null) {
  let fullUrl = url
  if (params) {
    const searchParams = new URLSearchParams(params)
    fullUrl = `${url}?${searchParams.toString()}`
  }
  return request(fullUrl, { method: 'PATCH', body })
}

/**
 * DELETE 请求
 */
export function del(url) {
  return request(url, { method: 'DELETE' })
}

/**
 * 获取完整 URL（用于 SSE 等需要完整 URL 的场景）
 */
export function getFullUrl(path) {
  return `${API_BASE_URL}${path}`
}

export { RequestError, API_BASE_URL }
