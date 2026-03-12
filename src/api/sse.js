/**
 * SSE 连接管理器 - 支持断线重连
 */
export class SSEConnectionManager {
  constructor() {
    this.reader = null
    this.abortController = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 3
    this.baseDelay = 1000
    this.isConnecting = false
    this.shouldReconnect = true
  }
  
  getReconnectDelay() {
    return this.baseDelay * Math.pow(2, this.reconnectAttempts)
  }
  
  async connect(url, body, onMessage, onError, onComplete) {
    if (this.isConnecting) {
      console.warn('连接正在进行中，请勿重复连接')
      return
    }
    
    this.isConnecting = true
    this.shouldReconnect = true
    this.abortController = new AbortController()
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: this.abortController.signal
      })
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      
      this.reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      
      this.reconnectAttempts = 0
      
      while (true) {
        const { done, value } = await this.reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              onComplete?.()
              return
            }
            
            try {
              const json = JSON.parse(data)
              await onMessage(json)
            } catch (e) {
              console.warn('解析 SSE 消息失败:', e)
            }
          }
        }
      }
      
      onComplete?.()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('连接已取消')
        return
      }
      
      console.error('SSE 连接错误:', error)
      
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = this.getReconnectDelay()
        console.log(`${delay/1000}秒后尝试重连 (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        // 等待期间用户可能已调用 disconnect()，再次检查
        if (!this.shouldReconnect) return
        this.reconnectAttempts++
        this.isConnecting = false
        await this.connect(url, body, onMessage, onError, onComplete)
      } else {
        onError?.(error)
        this.reconnectAttempts = 0
      }
    } finally {
      this.isConnecting = false
    }
  }
  
  disconnect() {
    this.shouldReconnect = false
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    if (this.reader) {
      this.reader.cancel().catch(() => {})  // 忽略 already-aborted 的 rejection
      this.reader = null
    }
    this.reconnectAttempts = 0
  }
}
