# 智能办公助手 - 前端应用

基于 Vue 3 的现代化 AI 对话界面，采用 Gemini 风格设计，支持深浅主题切换。

## 技术栈

- **框架**: Vue 3 + Vite
- **状态管理**: Pinia
- **UI 组件**: Naive UI
- **样式**: CSS Variables + Scoped CSS
- **测试**: Playwright

## 目录结构

```
frontend/
├── src/
│   ├── components/         # Vue 组件
│   │   ├── chat/           # 对话相关
│   │   │   ├── ChatInput.vue      # 输入框
│   │   │   ├── MessageList.vue    # 消息列表
│   │   │   ├── MessageItem.vue    # 消息项
│   │   │   └── Sidebar.vue        # 侧边栏
│   │   ├── common/         # 通用组件
│   │   │   ├── ConfirmationCard.vue
│   │   │   └── DatePicker.vue
│   │   └── workflow/       # 工作流组件
│   ├── composables/        # 组合式函数
│   │   ├── useChat.js      # 聊天逻辑
│   │   ├── useTheme.js     # 主题切换
│   │   └── useWorkflow.js  # 工作流管理
│   ├── stores/             # Pinia 状态
│   │   └── chat.js         # 聊天状态
│   ├── api/                # API 封装
│   │   ├── config.js       # API 配置
│   │   └── sse.js          # SSE 连接
│   ├── App.vue             # 根组件
│   ├── main.js             # 入口文件
│   └── style.css           # 全局样式
├── public/                 # 静态资源
├── index.html              # HTML 模板
├── vite.config.js          # Vite 配置
├── package.json            # 依赖配置
└── playwright.config.js    # 测试配置
```

## 快速开始

### 环境要求

- Node.js 16+
- npm 9+

### 安装

```bash
npm install
```

### 开发

```bash
npm run dev
```

访问 http://localhost:5173

### 构建

```bash
npm run build
```

### 测试

```bash
npm run test
```

## 核心功能

### 1. 对话管理

- 创建/切换/删除对话
- 对话历史自动加载
- 会话标题 AI 自动生成

### 2. 流式响应

- SSE 实时接收消息
- 打字机效果展示
- 自动滚动到最新消息

### 3. 主题切换

- 深色/浅色模式
- 平滑过渡动画
- 本地存储记忆

### 4. 交互确认

- 日期选择器
- 确认卡片
- 快捷选项

## 组件说明

### ChatInput 输入框

```vue
<ChatInput 
  v-model="inputText"
  :loading="isLoading"
  @send="handleSend"
/>
```

特性：
- 自动高度调整
- Enter 发送 / Shift+Enter 换行
- 加载状态禁用

### MessageList 消息列表

```vue
<MessageList
  :messages="messages"
  :loading="loading"
  @retry="handleRetry"
/>
```

特性：
- 自动滚动
- 欢迎消息
- 加载动画

### Sidebar 侧边栏

```vue
<Sidebar />
```

特性：
- 对话列表
- 新建对话
- 主题切换
- 可折叠

## 状态管理

### chat.js

```javascript
const chatStore = useChatStore()

// 状态
chatStore.chats           // 对话列表
chatStore.currentChatId   // 当前对话 ID
chatStore.loading         // 加载状态

// 方法
chatStore.loadChats()     // 加载对话列表
chatStore.createChat()    // 创建新对话
chatStore.switchChat(id)  // 切换对话
chatStore.deleteChat(id)  // 删除对话
```

## API 配置

### 开发环境

默认连接本地后端：

```javascript
// src/api/config.js
export const API_URL = 'http://localhost:8088'
```

### 生产环境

修改为实际后端地址，或使用环境变量：

```env
VITE_API_URL=https://your-api.com
```

## 样式规范

### CSS 变量

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f7f7f8;
  --text-primary: #1a1a1a;
  --accent: #1a73e8;
  --border-color: #e5e5e5;
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --accent: #8ab4f8;
  --border-color: #3d3d3d;
}
```

### 过渡动画

```css
 transition: all 0.2s ease;
```

## 开发指南

### 添加新组件

1. 在对应目录创建 `.vue` 文件
2. 在 `index.js` 中导出
3. 在需要的地方导入使用

### 添加新 API

1. 在 `src/api/` 下添加封装
2. 在 `composables/` 中调用
3. 在组件中响应状态变化

## 依赖说明

```json
{
  "dependencies": {
    "vue": "^3.5.25",
    "pinia": "^3.0.4",
    "naive-ui": "^2.43.2",
    "@vicons/ionicons5": "^0.13.0"
  },
  "devDependencies": {
    "vite": "^7.3.1",
    "@vitejs/plugin-vue": "^6.0.2",
    "@playwright/test": "^1.58.2"
  }
}
```

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
