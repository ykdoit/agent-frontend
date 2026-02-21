/**
 * API 配置
 */
export const API_CONFIG = {
  baseURL: 'http://localhost:8088',
  timeout: 120000,  // 2分钟
}

/**
 * 获取完整的 API URL
 */
export function getApiURL(path) {
  return `${API_CONFIG.baseURL}${path}`
}
