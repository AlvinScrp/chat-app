# Vue2 AI Chat App

## 项目配置

### 环境变量设置

在项目根目录创建 `.env.local` 文件：

```
VUE_APP_OPENAI_API_KEY=your_openai_api_key_here
```

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run serve
```

### 构建生产版本

```bash
npm run build
```

## 功能特性

- 💬 一问一答的聊天界面
- 🤖 集成OpenAI API
- 📱 响应式设计
- ⚡ 实时消息发送
- 🔄 加载状态提示
- ❌ 错误处理机制

## 技术栈

- Vue 2.x
- Axios
- OpenAI API
- ES6+
- CSS3

## 项目结构

```
src/
├── components/
│   ├── ChatWindow.vue      # 聊天窗口主组件
│   ├── MessageList.vue     # 消息列表组件
│   ├── MessageItem.vue     # 消息项组件
│   └── InputBox.vue        # 输入框组件
├── services/
│   └── openai.js           # OpenAI API服务
├── utils/
│   └── constants.js        # 常量配置
├── App.vue
└── main.js
```

## 使用说明

1. 配置OpenAI API密钥
2. 启动开发服务器
3. 在输入框中输入问题
4. 按回车键或点击发送按钮
5. 等待AI回复

## 注意事项

- 请确保网络连接正常
- API密钥需要有效且有足够的配额
- 建议在生产环境中通过后端代理API调用以保证安全性
