<template>
  <div class="text-input-controls">
    <div class="input-container">
      <TextareaInput
        :value="inputMessage"
        @input="updateInput"
        @enter="sendMessage"
        placeholder="输入你的问题..."
        :disabled="loading"
        :max-height="120"
        :min-height="24"
        ref="textareaInput"
      />
      <button 
        @click="sendMessage"
        :disabled="loading || !inputMessage.trim()"
        class="send-button"
      >
        <span v-if="!loading">发送</span>
        <span v-else>...</span>
      </button>
    </div>
    <div class="input-hint">
      按 Enter 发送，Shift + Enter 换行
    </div>
  </div>
</template>

<script>
import TextareaInput from '../TextareaInput.vue'
import { sendChatMessage, sendChatMessageStream } from '../../services/openai'

export default {
  name: 'TextChatInputControl',
  components: {
    TextareaInput
  },
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    isStreamMode: {
      type: Boolean,
      default: true
    },
    messages: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      inputMessage: '',
      loading: false,
      streamingMessageId: null
    }
  },
  methods: {
    /**
     * 更新输入内容
     */
    updateInput(value) {
      this.inputMessage = value
    },

    /**
     * 发送消息（文本聊天，支持流式和非流式）
     */
    async sendMessage() {
      if (!this.inputMessage.trim() || this.loading) return
      this.loading = true
      await this.handleTextMessage(this.inputMessage)
      this.inputMessage = ''
      this.loading = false
      if (this.$refs.textareaInput) {
        this.$refs.textareaInput.resetHeight()
      }
    },

    /**
     * 处理文本消息
     */
    async handleTextMessage(message) {
      // 发送用户消息
      const userMessage = {
        id: Date.now(),
        text: message,
        sender: 'user',
        timestamp: new Date(),
        type: 'text'
      }
      this.$emit('add-message', userMessage)
      try {
        if (this.isStreamMode) {
          await this.handleStreamMessage(message)
        } else {
          await this.handleNormalMessage(message)
        }
      } catch (error) {
        this.handleError(error)
      }
    },

    /**
     * 处理流式消息
     */
    async handleStreamMessage(message) {
      const aiMessageId = Date.now() + 1
      this.streamingMessageId = aiMessageId
      // 先添加一个空的AI消息
      const aiMessage = {
        id: aiMessageId,
        text: '',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
        isStreaming: true
      }
      this.$emit('add-message', aiMessage)
      // 使用流式函数
      await sendChatMessageStream(
        this.messages,
        (chunk, fullContent) => {
          this.$emit('update-message', {
            id: aiMessageId,
            text: fullContent,
            isStreaming: true,
          })
        },
        (finalContent) => {
          this.$emit('update-message', {
            id: aiMessageId,
            text: finalContent,
            isStreaming: false
          })
          this.streamingMessageId = null
        },
        (error) => {
          this.$emit('update-message', {
            id: aiMessageId,
            text: '抱歉，发生了错误，请稍后再试。',
            error: true,
            isStreaming: false
          })
          this.streamingMessageId = null
          console.error('Stream error:', error)
        }
      )
    },

    /**
     * 处理普通消息
     */
    async handleNormalMessage(message) {
      const response = await sendChatMessage(this.messages)
      const aiMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      }
      this.$emit('add-message', aiMessage)
    },

    /**
     * 处理错误
     */
    handleError(error, customMessage = '抱歉，发生了错误，请稍后再试。') {
      const errorMessage = {
        id: Date.now() + 1,
        text: customMessage,
        sender: 'ai',
        timestamp: new Date(),
        error: true,
        type: 'text'
      }
      this.$emit('add-message', errorMessage)
      console.error('Error:', error)
    },

    /**
     * 聚焦输入框
     */
    focus() {
      if (this.$refs.textareaInput) {
        this.$refs.textareaInput.focus()
      }
    },

    /**
     * 清空输入内容
     */
    clear() {
      this.inputMessage = ''
      if (this.$refs.textareaInput) {
        this.$refs.textareaInput.resetHeight()
      }
    },

    /**
     * 重置控件状态
     */
    reset() {
      this.inputMessage = ''
      this.loading = false
      this.streamingMessageId = null
      if (this.$refs.textareaInput) {
        this.$refs.textareaInput.resetHeight()
      }
    },

    /**
     * 设置输入内容
     */
    setInput(text) {
      this.inputMessage = text
    },

    /**
     * 获取当前输入内容
     */
    getCurrentInput() {
      return this.inputMessage
    }
  }
}
</script>

<style scoped>
/* 复用原有样式 */
@import './common-input-controls.css';
</style> 