# 智能办公助手 — 前端

基于 Vue 3 的 AI 对话界面，Gemini 风格设计，支持流式响应、Markdown 渲染和深浅主题切换。

## 技术栈

| 依赖 | 版本 | 用途 |
|------|------|------|
| Vue 3 | ^3.5.25 | 前端框架 |
| Pinia | ^3.0.4 | 状态管理 |
| Naive UI | ^2.43.2 | UI 组件库 |
| markdown-it | latest | Markdown 渲染 |
| DOMPurify | latest | XSS 防护 |
| Vite | ^7.3.1 | 构建工具 |
| Playwright | ^1.58.2 | E2E 测试 |

## 快速开始

**环境要求：** Node.js 18+，后端服务运行在 `http://localhost:8088`

```bash
# 安装依赖
npm install

# 开发模式（http://localhost:5173）
npm run dev

# 构建生产包
npm run build

# 预览生产包
npm run preview

# 运行 E2E 测试
npm run test
```

## 目录结构

```
src/
├── api/
│   ├── request.js        # HTTP 封装（GET/POST/PATCH/DELETE）
│   └── sse.js            # SSE 连接管理器
├── components/
│   ├── chat/
│   │   ├── MessageItem.vue    # 单条消息（Markdown 渲染）
│   │   ├── MessageList.vue    # 消息列表
│   │   ├── ChatInput.vue      # 输入框
│   │   └── Sidebar.vue        # 会话侧边栏
│   ├── agent/
│   │   └── AgentStatusBar.vue # Agent 执行状态条
│   ├── common/
│   │   ├── ConfirmationCard.vue
│   │   └── DatePicker.vue
│   └── workflow/              # 工作流可视化组件
├── composables/
│   ├── useChat.js        # 聊天逻辑 & SSE 事件处理
│   ├── useTheme.js       # 主题切换
│   └── useWorkflow.js    # 工作流 & 内容解析
├── stores/
│   ├── chat.js           # 消息状态
│   └── session.js        # 会话状态
├── App.vue
├── main.js
└── style.css             # 全局 CSS 变量 & 主题
```

## 核心功能

### 流式对话

通过 SSE 实时接收 Agent 响应，支持以下事件类型：

| 事件 | 说明 |
|------|------|
| `status` | Agent 执行阶段更新 |
| `thinking` | 推理过程输出 |
| `tool_call` | 工具调用事件 |
| `message` | 响应内容增量（OpenAI 格式） |

### Markdown 渲染

消息内容通过 `markdown-it` 渲染，`DOMPurify` 做 XSS 清洗：

- 标题（h1~h4）、粗体、斜体
- 有序 / 无序列表
- 行内代码 & 代码块
- 表格、引用块、分割线
- 自动链接识别

### 会话管理

- 创建 / 切换 / 删除会话
- 支持置顶会话
- AI 自动生成会话标题
- 本地缓存 + 后端 Redis 持久化

### 主题

支持深色（默认）/ 浅色切换，偏好持久化到 `localStorage`。

## API 对接

后端地址在 `src/api/request.js` 中配置：

```javascript
const API_BASE_URL = 'http://localhost:8088'
```

主要接口：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/v1/chat/completions` | 发送消息（SSE 流式） |
| GET | `/sessions` | 获取会话列表 |
| POST | `/sessions` | 创建会话 |
| GET | `/sessions/:id` | 获取会话详情及消息 |
| PATCH | `/sessions/:id` | 更新会话（标题/置顶） |
| DELETE | `/sessions/:id` | 删除会话 |

## 样式规范

全局使用 CSS 变量，定义在 `src/style.css`：

```css
/* 深色主题（默认） */
[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --accent: #8ab4f8;
  --border-color: #3d3d3d;
}

/* 浅色主题 */
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f7f7f8;
  --text-primary: #1a1a1a;
  --accent: #1a73e8;
  --border-color: #e5e5e5;
}
```

## 浏览器支持

Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+
