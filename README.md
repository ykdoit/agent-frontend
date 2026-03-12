# 企业智能办公助手 — 前端

基于 Vue 3 的 AI 对话前端，支持流式响应、多会话管理、WebSocket 实时推送、深浅主题切换等特性。

---

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Vue 3 (Composition API) | ^3.5.25 |
| 状态管理 | Pinia | ^3.0.4 |
| 路由 | Vue Router 4 | — |
| 构建工具 | Vite | ^7.3.1 |
| Markdown 渲染 | markdown-it + DOMPurify | latest |
| 实时通信 | SSE（流式输出）+ WebSocket（推送通知）| 原生 |
| E2E 测试 | Playwright | ^1.58.2 |

---

## 快速开始

**环境要求：** Node.js 18+，后端服务运行在 `http://localhost:8088`

```bash
# 安装依赖
npm install

# 开发模式（热更新）
npm run dev        # http://localhost:5173

# 构建生产包
npm run build

# E2E 测试
npm run test
```

---

## 目录结构

```
src/
├── api/
│   ├── request.js          # 统一 fetch 封装（请求 ID 追踪、超时、错误处理）
│   ├── chat.js             # 聊天相关接口
│   ├── session.js          # 会话 CRUD 接口
│   └── sse.js              # SSE 连接管理器（含指数退避重连）
│
├── composables/
│   ├── useChat.js          # 消息发送、SSE 事件分发、输入校验
│   ├── useWebSocket.js     # WebSocket 单例连接、订阅/取消订阅
│   ├── useWorkflow.js      # AI 响应内容解析（提取内嵌交互组件）
│   └── useTheme.js         # 深色/浅色主题切换与 localStorage 持久化
│
├── stores/
│   ├── chat.js             # 消息列表、加载状态、推理内容、工作流阶段
│   └── session.js          # 会话列表、当前会话、全文搜索
│
├── components/
│   ├── chat/
│   │   ├── MessageList.vue     # 消息列表容器（自动滚动）
│   │   ├── MessageItem.vue     # 单条消息渲染（用户/AI，含交互组件）
│   │   ├── ChatInput.vue       # 输入框（快捷键、自动高度、防重发）
│   │   ├── Sidebar.vue         # 侧边栏（会话管理、搜索、主题切换）
│   │   └── ExportButton.vue    # 导出聊天记录为 Markdown 文件
│   ├── common/
│   │   └── ConfirmationCard.vue  # 行动计划确认弹窗（含字段、状态标签）
│   └── workflow/
│       └── ThinkingBlock.vue     # 可折叠的 AI 推理过程展示
│
├── views/
│   ├── Home.vue            # 欢迎页（4 个快捷建议入口）
│   └── Chat.vue            # 对话页（消息列表 + 标题栏 + 导出按钮）
│
└── App.vue                 # 根组件（布局、主题、WebSocket 生命周期、路由监听）
```

---

## 聊天完整流程

### 第一步：发送消息

```
用户输入文字 → ChatInput.vue（Enter 发送 / Shift+Enter 换行）
    → App.vue handleSend()
        ├── 无当前会话 → 先创建会话 → 路由跳转 → pendingMessage 补发
        └── 有当前会话 → useChat.sendMessage()
```

`sendMessage()` 内部流程：

```
1. 输入校验（非空 / XSS 过滤 / 长度 ≤ 1000）
2. store.addMessage()  写入用户消息（唯一 ID）
3. 首条消息自动重命名会话（前 20 字 + "..."）
4. store.addMessage()  写入空白 AI 占位（streaming: true）
5. SSEConnectionManager.connect()  建立 SSE 长连接
```

---

### 第二步：SSE 流式接收

后端以 OpenAI 兼容格式推送事件流，前端逐行解析并按事件类型分发：

| 事件类型 | 处理逻辑 |
|----------|---------|
| `status` | 更新状态栏文字（"💭 思考中..." / "🔄 调用工具：xxx"）|
| `thought` | 追加推理内容，ThinkingBlock 实时展示 |
| `workflow` | 设置工作流阶段 |
| `control` | 处理完成 / 等待输入 / 错误状态 |
| OpenAI `delta` | `appendMessageContent()` 逐 token 追加，触发 Markdown 实时重渲染 |

---

### 第三步：流式正常结束

```
SSE [DONE] 到达
    → onComplete 回调
        ├── markMessageComplete()  → streaming: false（清除加载动画）
        ├── setLoading(false)
        └── 延迟 3s → sessionStore.refreshTitles()（等后端 AI 生成标题写入）
```

---

### 第四步：会话切换（流式中断 & 恢复）

这是系统最复杂的状态处理，核心目标：**AI 后台继续跑，回复不丢失，用户看到加载动画而非空白**。

```
用户切换至新会话（AI 仍在回复中）
    ↓
chat.disconnect()           前端断开 SSE，AI 气泡保持 streaming: true
    ↓
后端检测到客户端断开
    → _background_save()    后台任务等待 agent 跑完（最长 5 分钟）
    → append_message()      完整结果写入 Redis
    → ws_manager.notify()   WebSocket 广播 session_updated 事件

用户切换回原会话
    ↓
loadHistory(sessionId)
    ├── 发现末尾消息 streaming: true
    ├── 保留 AI 气泡（显示跳动圆点，不显示空白）
    └── _subscribeSessionUpdate()  订阅 WebSocket
            ├── 收到 session_updated → _fetchAndUpdateHistory()
            │       → 从服务器拉取完整消息 → 替换展示 → streaming: false
            └── 60 秒兜底：WS 未触发 → 主动拉一次 API
```

---

## 关键技术点

### SSE 流式输出

- 使用原生 `fetch` + `ReadableStream` 逐行读取，无需第三方库
- `SSEConnectionManager` 封装重连逻辑（指数退避，最多 3 次）
- **按消息 ID 追加**，而非数组下标，避免并发场景乱序

```js
// sse.js
const { done, value } = await this.reader.read()
buffer += decoder.decode(value, { stream: true })
for (const line of lines) {
    if (line.startsWith('data: ')) { /* 解析 + 分发 */ }
}
```

### WebSocket 推送通知

- 模块级**单例**（`useWebSocket.js` 模块顶层变量），多组件复用同一连接
- **订阅者模式**：`subscribe(sessionId, callback)` 返回 unsubscribe 函数，自动清理
- 支持通配符 `'*'`，可监听所有 session 的更新事件
- **指数退避重连**（1s → 2s → 4s → ... 最大 30s）

```js
// 订阅特定会话更新，收到后立即刷新消息
const unsubscribe = subscribe(sessionId, async (id) => {
    await _fetchAndUpdateHistory(id)
    unsubscribe()  // 一次性，收到即取消
})
```

### 消息 ID 防碰撞

模块级计数器 + 时间戳组合，确保同毫秒内创建多条消息也不会冲突：

```js
let _msgCounter = 0
function genMsgId(prefix = 'msg') {
    return `${prefix}-${Date.now()}-${++_msgCounter}`
}
```

### Markdown 安全渲染

- `markdown-it` 渲染 → `DOMPurify` 过滤，防止 XSS 注入
- 支持标题、加粗、斜体、代码块、表格、引用、链接
- 流式渲染：每个 token 到来时触发 `computed` 重算，实时更新

### 主题系统

20+ 个 CSS 自定义属性统一管理颜色、阴影、圆角、过渡：

```css
:root {
    --bg-primary: #131314;
    --accent: #4285f4;
    --shadow-glow: 0 0 20px rgba(66, 133, 244, 0.3);
    --transition-normal: 0.25s ease;
    /* ...20+ 个语义化变量 */
}
.light { --bg-primary: #ffffff; --accent: #1a73e8; }
```

主题切换仅修改 class，CSS 过渡自动平滑切换，无白屏闪烁。

### 请求追踪

每个 HTTP 请求自动注入唯一 `X-Request-ID`（UUID v4），后端日志与前端请求一一对应，方便排查问题：

```js
const generateRequestId = () =>
    crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
```

### 全文搜索安全高亮

搜索结果高亮先转义 HTML 再匹配，防止关键词本身含 XSS payload：

```js
function escapeHtml(str) { /* 转义 & < > " ' */ }
// 先转义，再用 <mark> 包裹关键词
return escapeHtml(text).replace(regex, '<mark>$&</mark>')
```

---

## 巧妙的用户交互设计

### 🌊 实时打字效果
AI 回复逐 token 渲染，Markdown 同步解析，打字机效果的同时排版不乱。

### 💫 状态条 Shimmer 动画
AI 思考期间，状态栏有流光扫过的效果（CSS `@keyframes shimmer`），传达"正在工作"的感知。

### 🔄 Avatar 旋转指示
AI 回复过程中，左侧 Avatar 图标持续旋转，视觉上提示模型运行中。

### ⏳ 中断会话加载气泡保活
切换会话再切回时，空白 AI 气泡**不消失**，保持 `streaming: true` 显示跳动圆点。用户看到"AI 还在想"，而非空白页面，等后台完成后内容自动替换。

### ✨ 消息入场动画
每条消息都有 `translateY(12px) → 0` 配合 `opacity 0 → 1` 的入场动画，对话流感更自然。

### 📋 复制反馈 + 防抖
点击复制后按钮文字变为"已复制"并保持 2 秒，再次点击重置计时器，不会出现文字反复闪烁。

### 🔁 一键重试
AI 回复失败时，Retry 按钮自动将上一条用户消息还原至输入框并重新发送，无需手动复制粘贴。

### 🔍 搜索上下文片段
侧边栏搜索不仅匹配标题，还展示命中消息的上下文片段（前后 60 字），关键词蓝色高亮，帮助快速定位历史对话。

### 📌 置顶会话
置顶会话显示黄色背景，永远排在列表顶部，不被新建对话挤走。

### ✏️ 内联重命名
点击会话名称右侧编辑按钮，直接进入内联编辑状态，`Enter` 保存，`Esc` 取消，失焦自动保存。

### 📤 一键导出
聊天记录导出为标准 Markdown 文件，文件名自动包含会话标题和日期（`{标题}-2026-03-12.md`），超 500 条消息自动截断并标注。

### ⌨️ 快捷键 + 自适应高度
- `Enter` 发送，`Shift+Enter` 换行
- 输入框随内容自动增高（上限 200px），内容多时不撑开整个页面

### 🧩 AI 响应内嵌交互组件
AI 回复中可携带特殊标记，前端自动解析渲染为真实 UI 组件：

| 组件 | 触发格式 | 功能 |
|------|----------|------|
| ConfirmationCard | `[CONFIRM_CARD]{...}[/CONFIRM_CARD]` | 行动计划确认弹窗（字段展示、状态标签、确认/取消）|
| TimePicker | `[TIME_PICKER]{...}[/TIME_PICKER]` | 时段快捷选择（上午/下午/晚上/全天）|
| ThinkingBlock | SSE `thought` 事件 | 可折叠推理过程展示 |

### 🌗 主题切换无闪烁
所有颜色通过 CSS 变量管理，切换主题时 `background`、`color`、`border` 全部同步以 250ms 过渡动画平滑切换，无任何白屏闪烁。

### 🚫 防重发保护
`chatStore.loading` 为 true 时发送按钮禁用；`SSEConnectionManager.isConnecting` 防止并发连接建立，避免用户快速点击导致消息重发。

### 🔔 错误 Toast 自动消失
错误提示 5 秒后自动关闭。手动点击关闭后旧 timer 被正确清理，不会出现关闭后又弹回的问题。

### 💡 首次发送自动命名
发送第一条消息后，会话标题自动设置为消息前 20 字，后端 AI 生成正式标题后（约 3 秒延迟）再次刷新，标题从"新对话"→临时标题→AI 生成标题逐步精确。

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/v1/chat/completions` | 发送消息（SSE 流式响应）|
| WS | `/ws` | WebSocket 长连接（接收 session_updated 推送）|
| GET | `/sessions` | 获取会话列表 |
| POST | `/sessions` | 创建会话 |
| GET | `/sessions/:id` | 获取会话详情及消息历史 |
| PATCH | `/sessions/:id` | 更新标题 / 置顶状态 |
| DELETE | `/sessions/:id` | 删除会话 |
| GET | `/sessions/search?q=` | 全文搜索 |

---

## 浏览器支持

Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+
