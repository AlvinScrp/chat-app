<template>
  <div class="text-input-controls">
    <div class="input-container">
      <TextareaInput
        :value="inputMessage"
        @input="updateInput"
        @enter="sendMessage"
        placeholder="输入你想转换为语音的内容..."
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
        <span v-if="!loading">生成语音</span>
        <span v-else>...</span>
      </button>
    </div>
    <div class="input-hint">
      按 Enter 生成语音，Shift + Enter 换行
    </div>
  </div>
</template>

<script>
import TextareaInput from '../TextareaInput.vue'
import { textToSpeech } from '../../services/openai'

export default {
  name: 'Text2AudioInputControl',
  components: {
    TextareaInput
  },
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    messages: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      inputMessage: '',
      loading: false
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
     * 发送消息（文字转语音）
     */
    async sendMessage() {
      if (!this.inputMessage.trim() || this.loading) return
      this.loading = true
      await this.handleTextToSpeech(this.inputMessage)
      this.inputMessage = ''
      this.loading = false
      if (this.$refs.textareaInput) {
        this.$refs.textareaInput.resetHeight()
      }
    },

    /**
     * 处理文字转语音
     */
    async handleTextToSpeech(message) {
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
        // 调用文字转语音API
        const audioBlob = await textToSpeech(message)
        const audioUrl = URL.createObjectURL(audioBlob)
        // 添加AI语音消息
        const aiMessage = {
          id: Date.now() + 1,
          text: message,
          sender: 'ai',
          timestamp: new Date(),
          audioUrl: audioUrl,
          type: 'audio'
        }
        this.$emit('add-message', aiMessage)
        console.log('文字转语音成功:', audioUrl)
      } catch (error) {
        this.handleError(error, '语音生成失败，请稍后再试')
      }
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