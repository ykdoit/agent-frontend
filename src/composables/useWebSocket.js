/**
 * WebSocket 全局连接管理
 *
 * 职责：
 * - 维持与后端的 WebSocket 长连接
 * - 收到 session_updated 事件时通知订阅者
 * - 自动断线重连（指数退避）
 */

const WS_URL = 'ws://localhost:8088/ws'
const MAX_RECONNECT_DELAY = 30000

// 模块级单例，避免多个组件重复建连
let socket = null
let reconnectTimer = null
let reconnectDelay = 1000
let shouldConnect = false

// 订阅者：session_id → Set<callback>
const subscribers = new Map()

function notifySubscribers(sessionId) {
  const cbs = subscribers.get(sessionId)
  if (cbs) cbs.forEach(cb => cb(sessionId))
  // 也通知通配符订阅者（监听所有 session）
  const allCbs = subscribers.get('*')
  if (allCbs) allCbs.forEach(cb => cb(sessionId))
}

function connect() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return

  socket = new WebSocket(WS_URL)

  socket.onopen = () => {
    reconnectDelay = 1000
    console.log('[WS] Connected')
  }

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'session_updated' && msg.session_id) {
        console.log(`[WS] session_updated: ${msg.session_id}`)
        notifySubscribers(msg.session_id)
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  socket.onclose = () => {
    socket = null
    if (!shouldConnect) return
    // 指数退避重连
    reconnectTimer = setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY)
      connect()
    }, reconnectDelay)
    console.log(`[WS] Disconnected, reconnecting in ${reconnectDelay}ms`)
  }

  socket.onerror = () => {
    // onclose will handle reconnect
  }
}

function disconnect() {
  shouldConnect = false
  clearTimeout(reconnectTimer)
  if (socket) {
    socket.close()
    socket = null
  }
}

/**
 * 订阅某个 session 的更新通知
 * @param {string} sessionId - 要监听的 session ID，传 '*' 监听全部
 * @param {Function} callback - 收到通知时调用 callback(sessionId)
 * @returns {Function} unsubscribe 函数
 */
function subscribe(sessionId, callback) {
  if (!subscribers.has(sessionId)) {
    subscribers.set(sessionId, new Set())
  }
  subscribers.get(sessionId).add(callback)

  return () => {
    const cbs = subscribers.get(sessionId)
    if (cbs) {
      cbs.delete(callback)
      if (cbs.size === 0) subscribers.delete(sessionId)
    }
  }
}

export function useWebSocket() {
  function start() {
    shouldConnect = true
    connect()
  }

  function stop() {
    disconnect()
  }

  return { start, stop, subscribe }
}
