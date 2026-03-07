<template>
  <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
    <div class="sidebar-header">
      <button class="menu-btn" @click="sidebarCollapsed = !sidebarCollapsed">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <span v-if="!sidebarCollapsed" class="brand" @click="goHome">智能办公助手</span>
    </div>
    
    <button class="new-chat-btn" @click="newChat">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span v-if="!sidebarCollapsed">发起新对话</span>
    </button>
    
    <div class="chat-list" v-if="!sidebarCollapsed">
      <div class="chat-section-title">对话历史</div>
      <div
        v-for="session in sessions"
        :key="session.id"
        :class="['chat-item', { active: session.id === currentSessionId, pinned: session.pinned }]"
        @click="switchChat(session.id)"
      >
        <span class="pin-icon" v-if="session.pinned">📌</span>
        <span class="chat-title" v-if="editingChatId !== session.id">{{ session.title }}</span>
        <input
          v-else
          v-model="editingTitle"
          class="rename-input"
          @click.stop
          @blur="finishRename(session.id)"
          @keydown.enter="finishRename(session.id)"
          @keydown.escape="cancelRename"
          ref="renameInput"
        />
        <div class="chat-actions" v-if="editingChatId !== session.id">
          <button class="action-btn" title="置顶" @click.stop="togglePin(session.id)">
            <svg v-if="!session.pinned" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v8m0 0l4-4m-4 4l-4-4m4 18v-6m0 0l4 4m-4-4l-4 4"/>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
              <path d="M12 2v8m0 0l4-4m-4 4l-4-4m4 18v-6m0 0l4 4m-4-4l-4 4"/>
            </svg>
          </button>
          <button class="action-btn" title="重命名" @click.stop="startRename(session.id, session.title)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="action-btn delete" title="删除" @click.stop="deleteChat(session.id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 底部设置区 -->
    <div class="sidebar-footer" v-if="!sidebarCollapsed">
      <button class="theme-btn" @click="toggleTheme">
        <svg v-if="theme === 'dark'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
        <span>{{ themeLabel }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route = useRoute()
const sessionStore = useSessionStore()
const { theme, toggleTheme, getThemeLabel } = useTheme()

const sidebarCollapsed = ref(false)
const editingChatId = ref(null)
const editingTitle = ref('')
const renameInput = ref(null)

const sessions = computed(() => sessionStore.sessions)
const currentSessionId = computed(() => sessionStore.currentSessionId)
const themeLabel = computed(() => getThemeLabel())

function goHome() {
  router.push({ name: 'home' })
}

async function newChat() {
  const newSession = await sessionStore.createSession()
  router.push({ name: 'chat', params: { id: newSession.id } })
}

function switchChat(id) {
  router.push({ name: 'chat', params: { id } })
}

async function deleteChat(id) {
  const wasCurrentSession = route.params.id === id
  await sessionStore.deleteSession(id)
  
  // 如果删除的是当前会话，导航到首页或下一个会话
  if (wasCurrentSession) {
    if (sessionStore.sessions.length > 0) {
      router.replace({ name: 'chat', params: { id: sessionStore.sessions[0].id } })
    } else {
      router.replace({ name: 'home' })
    }
  }
}

async function togglePin(id) {
  await sessionStore.togglePinSession(id)
}

function startRename(chatId, currentTitle) {
  editingChatId.value = chatId
  editingTitle.value = currentTitle
  nextTick(() => {
    renameInput.value?.focus()
    renameInput.value?.select()
  })
}

async function finishRename(chatId) {
  if (editingTitle.value.trim() && editingTitle.value !== sessions.value.find(s => s.id === chatId)?.title) {
    await sessionStore.renameSession(chatId, editingTitle.value.trim())
  }
  editingChatId.value = null
  editingTitle.value = ''
}

function cancelRename() {
  editingChatId.value = null
  editingTitle.value = ''
}
</script>

<style scoped>
/* 侧边栏 */
.sidebar { 
  width: 300px; 
  background: var(--bg-secondary); 
  display: flex; 
  flex-direction: column;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s ease;
  border-right: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg, transparent, var(--accent), transparent);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.sidebar:hover::before {
  opacity: 0.5;
}

.sidebar.collapsed { 
  width: 72px; 
}

.sidebar.collapsed .brand,
.sidebar.collapsed .chat-list,
.sidebar.collapsed .sidebar-footer,
.sidebar.collapsed .new-chat-btn span {
  opacity: 0;
  pointer-events: none;
}

.sidebar-header {
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.menu-btn {
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 10px;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.menu-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.menu-btn:hover { 
  background: var(--bg-tertiary);
  transform: scale(1.05);
}

.menu-btn:active::before {
  opacity: 0.1;
}

.brand {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: opacity var(--transition-normal);
  cursor: pointer;
  user-select: none;
}

.brand:hover {
  opacity: 0.8;
}

.new-chat-btn {
  margin: 12px 12px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  transition: all var(--transition-fast);
  width: calc(100% - 24px);
}

.new-chat-btn:hover { 
  background: var(--bg-tertiary);
}

.new-chat-btn:active {
  background: var(--bg-hover);
}

.new-chat-btn svg {
  flex-shrink: 0;
}

.chat-list { 
  flex: 1; 
  overflow-y: auto; 
  padding: 8px 12px; 
  transition: opacity var(--transition-normal);
}

.chat-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 12px 12px 8px;
  margin-top: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chat-item {
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  position: relative;
  margin-bottom: 2px;
}

.chat-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
  transition: height var(--transition-fast);
}

.chat-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.chat-item:hover::before {
  height: 20px;
}

.chat-item.active {
  background: var(--accent-light);
  color: var(--accent);
}

.chat-item.active::before {
  height: 28px;
  background: var(--accent);
}

.chat-item.pinned {
  background: rgba(251, 188, 4, 0.08);
}

.chat-item.pinned:hover {
  background: rgba(251, 188, 4, 0.12);
}

.pin-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.chat-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  font-size: 14px;
}

.rename-input {
  flex: 1;
  background: var(--bg-primary);
  border: 1px solid var(--accent);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
}

.chat-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.chat-item:hover .chat-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.action-btn.delete:hover {
  color: var(--error);
  background: var(--error-light);
}

/* 侧边栏底部 */
.sidebar-footer {
  padding: 14px 16px;
  border-top: 1px solid var(--border-color);
  transition: opacity var(--transition-normal);
}

.theme-btn {
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all var(--transition-fast);
}

.theme-btn:hover { 
  background: var(--bg-tertiary); 
  color: var(--text-primary);
  border-color: var(--border-subtle);
}

.theme-btn svg {
  transition: transform var(--transition-fast);
}

.theme-btn:hover svg {
  transform: rotate(15deg);
}

/* 响应式 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform var(--transition-slow);
  }
  
  .sidebar:not(.collapsed) {
    transform: translateX(0);
    box-shadow: var(--shadow-lg);
  }
}
</style>
