<template>
  <div class="chat-window">
    <div class="chat-header">
      <h2>{{title()}}</h2>
      <!-- <div class="header-controls">
        <div v-if="pageType === PAGE_TYPE.textChat" class="stream-toggle">
          <label class="stream-option">
            <input type="checkbox" v-model="isStreamMode" :disabled="loading" />
            <span>流式输出</span>
          </label>
        </div>
      </div> -->
    </div>
    
    <div class="chat-body">
      <div class="messages-container">
        <MessageItem 
          v-for="message in messages" 
          :key="message.id"
          :message="message"
        />
        <div v-if="loading" class="loading-message">
          <div class="message-content">
            <div class="loading-text">{{ getLoadingText() }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-footer">
      <!-- 文本聊天模式 -->
      <TextChatInputControl 
        v-if="pageType === PAGE_TYPE.textChat"
        @add-message="handleAddMessage"
        @update-message="handleUpdateMessage"
        :disabled="loading"
        :is-stream-mode="isStreamMode"
        :messages="messages"
      />
      <!-- 文本转语音模式 -->
      <Text2AudioInputControl 
        v-if="pageType === PAGE_TYPE.text2audio"
        @add-message="handleAddMessage"
        :disabled="loading"
        :messages="messages"
      />
      <!-- 语音转文本模式 -->
      <Audio2TextInputControls 
        v-if="pageType === PAGE_TYPE.audio2text"
        @add-message="handleAddMessage"
        :disabled="loading"
      />
      <!-- 图片生成模式 -->
      <ImageGenInputControls 
        v-if="pageType === PAGE_TYPE.imageGen"
        @add-message="handleAddMessage"
        :disabled="loading"
      />
    </div>
  </div>
</template>

<script>
import MessageItem from '@components/MessageItem.vue'
import TextChatInputControl from '@components/controller/TextChatInputControl.vue'
import Text2AudioInputControl from '@components/controller/Text2AudioInputControl.vue'
import Audio2TextInputControls from '@components/controller/Audio2TextInputControls.vue'
import ImageGenInputControls from '@components/controller/ImageGenInputControls.vue'
import historyService from '@services/historyService'
import { PAGE_TYPE } from '@utils/constants'

export default {
  name: 'ChatWindow',
  components: {
    MessageItem,
    TextChatInputControl,
    Text2AudioInputControl,
    Audio2TextInputControls,
    ImageGenInputControls
  },
  props: {
    pageType: {
      type: String,
      default: PAGE_TYPE.textChat,
      validator: value => Object.values(PAGE_TYPE).includes(value)
    },
    sessionId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      PAGE_TYPE,
      messages: [],
      loading: false,
      isStreamMode: true, // 流式输出模式
      streamingMessageId: null // 当前流式输出的消息ID
    }
  },
  watch: {
    // 监听sessionId变化
    sessionId: {
      immediate: true,
      handler(newSessionId) {
         this.loadSessionMessages(newSessionId)
      }
    },
    // 监听消息变化，自动滚动到底部
    messages: {
      handler() {
        this.scrollToBottom()
        console.log('watch messages', this.messages)
        // 发射消息更新事件给父组件
        this.$emit('messages-updated', this.messages)
      },
      deep: true
    },
    // 监听加载状态变化
    loading() {
      this.scrollToBottom()
    }
  },
  mounted() {
    // 组件挂载后滚动到底部
    this.scrollToBottom()
  },
  updated() {
    // DOM更新后滚动到底部
    this.scrollToBottom()
  },
  methods: {
    /**
     * 根据页面类型返回标题
     */
    title(){
      switch(this.pageType) {
        case PAGE_TYPE.textChat:
          return 'AI Chat Assistant'
        case PAGE_TYPE.text2audio:
          return 'AI Audio Chat'
        case PAGE_TYPE.audio2text:
          return 'AI Speech Recognition'
        case PAGE_TYPE.imageGen:
          return 'AI Image Generator'
        default:
          return 'AI Assistant'
      }
    },

    /**
     * 根据页面类型返回加载文本
     */
    getLoadingText() {
      switch(this.pageType) {
        case PAGE_TYPE.textChat:
        case PAGE_TYPE.text2audio:
          return '正在思考...'
        case PAGE_TYPE.audio2text:
          return '正在处理语音...'
        case PAGE_TYPE.imageGen:
          return '正在生成图片...'
        default:
          return '正在处理...'
      }
    },

    /**
     * 处理来自输入组件的消息
     */
    handleAddMessage(message) {
      // 设置加载状态
      if (message.sender === 'user') {
        this.loading = true
      } else {
        this.loading = false
      }
      
      // 添加消息到列表
      this.messages.push(message)
      
      // 保存消息到session
      this.saveMessageToSession(message)
      
      console.log('添加消息:', message)
    },

    /**
     * 处理消息更新（用于流式输出）
     */
    handleUpdateMessage(updateData) {
      const messageIndex = this.messages.findIndex(msg => msg.id === updateData.id)
      if (messageIndex !== -1) {
        // 更新消息内容
        Object.assign(this.messages[messageIndex], updateData)
        
        // 如果流式输出结束，保存消息
        if (!updateData.isStreaming) {
          this.saveMessageToSession(this.messages[messageIndex])
          this.loading = false
        }
      }
    },

    /**
     * 加载session的历史消息
     */
    loadSessionMessages(sessionId) {
      try {
        if (sessionId) {
          // 如果有sessionId，加载对应的历史消息
          const sessionMessages = historyService.loadSessionMessages(this.pageType, sessionId)
          this.messages = sessionMessages || []
          console.log('已加载session消息:', sessionId, sessionMessages)
        } 
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      } catch (error) {
        console.error('加载session消息失败:', error)
        this.messages = []
      }
    },

    /**
     * 保存消息到当前session
     */
    saveMessageToSession(message) {
      if (this.sessionId) {
        try {
          historyService.saveSessionMessage(this.pageType, this.sessionId, message)
          
          // 通知Vuex store消息已更新
          this.$store.dispatch('notifyMessageUpdate', {
            sessionId: this.sessionId,
            pageType: this.pageType
          })
          
        } catch (error) {
          console.error('保存消息到session失败:', error)
        }
      }
    },

    /**
     * 滚动到底部
     */
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$el.querySelector('.messages-container')
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          })
        }
      })
    },
    
  }
}
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 900px;
  margin: 0 auto;
  background: #ffffff;
  position: relative;
}

.chat-header {
  background: #ffffff;
  color: #1f1f1f;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f1f1f;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stream-toggle {
  display: flex;
  align-items: center;
}

.stream-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
  user-select: none;
}

.stream-option input[type="checkbox"] {
  margin: 0;
  width: 16px;
  height: 16px;
  accent-color: #10b981;
}

.stream-option input[type="checkbox"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stream-option span {
  font-weight: 500;
}

.chat-body {
  flex: 1;
  overflow: hidden;
  background: #ffffff;
  position: relative;
}

.messages-container {
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
  scroll-behavior: smooth;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.loading-message {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1.5rem;
}

.loading-text {
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border-radius: 12px;
  color: #6b7280;
  font-style: italic;
  border: 1px solid #e5e7eb;
}

.chat-footer {
  background: #ffffff;
  border-top: 1px solid #e5e5e5;
  padding: 1rem 1.5rem 1.5rem;
  position: sticky;
  bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-window {
    max-width: 100%;
  }
  
  .chat-header {
    padding: 0.75rem 1rem;
  }
  
  .chat-header h2 {
    font-size: 1rem;
  }
  
  .messages-container {
    padding: 1rem;
  }
  
  .chat-footer {
    padding: 1rem;
  }
}
</style>