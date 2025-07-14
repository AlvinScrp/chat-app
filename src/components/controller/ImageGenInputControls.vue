<template>
  <div class="input-box">
    <div class="input-container">
      <TextareaInput
        :value="input"
        @input="updateInput"
        @enter="generateImage"
        placeholder="请输入图片描述..."
        :disabled="loading"
        :max-height="120"
        :min-height="24"
        ref="textareaInput"
      />
      <button 
        @click="generateImage"
        :disabled="loading || !input.trim()"
        class="send-button"
      >
        <span v-if="!loading">生成图片</span>
        <span v-else>生成中...</span>
      </button>
    </div>
    <div class="input-hint">
      按 Enter 生成图片，Shift + Enter 换行
    </div>
  </div>
</template>

<script>
import { generateImage } from '@/services/openai'
import TextareaInput from '../TextareaInput.vue'

export default {
  name: 'ImageGenInputControls',
  components: {
    TextareaInput
  },
  props: {
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      input: '',
      loading: false
    }
  },
  methods: {
    /**
     * 更新输入内容
     */
    updateInput(value) {
      this.input = value
    },

    /**
     * 生成图片
     */
    async generateImage() {
      if (!this.input.trim() || this.loading) return
      
      this.loading = true
      const userInput = this.input.trim()
      
      // 通知外部添加用户消息
      this.$emit('add-message', {
        id: Date.now(),
        role: 'user',
        sender: 'user',
        text: userInput,
        timestamp: new Date(),
        type: 'text'
      })
      
      try {
        // 调用图片生成API
        const imageUrl = await generateImage(userInput)
        
        // 通知外部添加AI生成的图片消息
        this.$emit('add-message', {
          id: Date.now() + 1,
          role: 'assistant',
          sender: 'ai',
          text: `生成的图片：${userInput}`,
          imageUrl: imageUrl,
          timestamp: new Date(),
          type: 'image'
        })
        
        console.log('图片生成成功:', imageUrl)
      } catch (error) {
        console.error('图片生成失败:', error)
        
        // 通知外部添加错误消息
        this.$emit('add-message', {
          id: Date.now() + 2,
          role: 'assistant',
          sender: 'ai',
          text: '生成失败，请稍后再试',
          timestamp: new Date(),
          type: 'text',
          error: true
        })
      }
      
      // 清理状态
      this.input = ''
      this.loading = false
      
      // 重置textarea高度
      if (this.$refs.textareaInput) {
        this.$refs.textareaInput.resetHeight()
      }
    },

    /**
     * 重置控件状态
     */
    reset() {
      this.input = ''
      this.loading = false
      if (this.$refs.textareaInput) {
        this.$refs.textareaInput.resetHeight()
      }
    },

    /**
     * 获取当前输入内容
     */
    getCurrentInput() {
      return this.input
    },

    /**
     * 设置输入内容
     */
    setInput(text) {
      this.input = text
    },

    /**
     * 聚焦输入框
     */
    focus() {
      if (this.$refs.textareaInput) {
        this.$refs.textareaInput.focus()
      }
    }
  }
}
</script>

<style scoped>
@import './common-input-controls.css';
</style> 