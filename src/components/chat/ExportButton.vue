<template>
  <button class="export-btn" @click="exportChat" :disabled="exporting" :title="'导出为 Markdown'">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7,10 12,15 17,10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
    <span>{{ exporting ? '导出中...' : '导出' }}</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { get } from '@/api/request'
import { useChatStore } from '@/stores/chat'
import { useSessionStore } from '@/stores/session'

const chatStore = useChatStore()
const sessionStore = useSessionStore()
const exporting = ref(false)

async function exportChat() {
  const session = sessionStore.currentSession
  if (!session) return
  exporting.value = true

  try {
    let messages = chatStore.getMessages(session.id)

    // If no messages in store, fetch from API
    if (!messages.length && session.sessionId) {
      const data = await get(`/sessions/${session.sessionId}`)
      messages = (data.messages || []).map(m => ({
        id: m.message_id,
        role: m.role,
        content: m.content,
      }))
    }

    if (!messages.length) return

    // Cap at 500 messages
    const capped = messages.length > 500
    const exportMessages = capped ? messages.slice(-500) : messages

    const title = session.title || '对话记录'
    const now = new Date().toLocaleString('zh-CN')

    let md = `# ${title}\n\n`
    if (capped) {
      md += `> 注意：此导出包含最新 500 条消息。\n\n`
    }
    md += `> 导出时间：${now}\n\n`

    for (const msg of exportMessages) {
      const roleLabel = msg.role === 'user' ? '**用户**' : '**AI**'
      md += `---\n\n${roleLabel}\n\n${msg.content || ''}\n\n`
    }

    // Trigger download
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const dateStr = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `${title.slice(0, 30)}-${dateStr}.md`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('导出失败:', e)
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.export-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-light);
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
