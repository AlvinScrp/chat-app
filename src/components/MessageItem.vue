<template>
  <div class="message-item" :class="messageClass">
    <!-- AI Avatar on left -->
    <!-- <div class="message-avatar">
      <div class="avatar ai">{{message.sender === 'ai' ? 'AI' : 'U'}}</div>
    </div> -->
    
    <div class="message-wrapper">
      <div class="message-content">
        <!-- 图片消息 -->
        <div v-if="message.type === 'image'" class="message-image">
          <img :src="message.imageUrl" alt="Generated Image" />
          <div class="message-time">
            {{ formatTime(message.timestamp) }}
          </div>
          <div class="image-actions">
            <button @click="downloadImage(message.imageUrl, message.text)" class="download-image-button">
              <span>⬇️</span> 下载图片
            </button>
          </div>
        </div>
        <!-- 用户语音消息 -->
        <div v-else-if="message.type === 'user-audio'" class="user-audio-message">
          <div class="audio-icon">🎤</div>
          <div class="audio-text">{{ message.text || '[语音消息]' }}</div>
          <div class="message-time">
            {{ formatTime(message.timestamp) }}
          </div>
        </div>
        <!-- 文本消息 -->
        <div v-else class="text-message">
          <div class="message-text" :class="{ 'error': message.error, 'streaming': message.isStreaming }">
            <MessageItemMarkedText 
              v-if="message.sender === 'ai' && !message.error"
              :text="message.text"
              :isStreaming="message.isStreaming"
            />
            <span v-else>
            {{ message.text }}
              <span v-if="message.isStreaming" class="typing-cursor">|</span>
            </span>
          </div>
          <!-- <div class="message-time">
            {{ formatTime(message.timestamp) }}
          </div> -->
        </div>
      </div>
      
      <!-- Audio controls below message content for AI audio messages -->
      <div v-if="message.type === 'audio' && message.audioUrl && message.sender === 'ai'" class="audio-controls">
        <div class="audio-indicator">🎵 语音消息</div>
        <div class="audio-buttons">
          <button @click="playAudio(message.audioUrl)" class="play-button">
            <span>▶️</span> 播放
          </button>
          <button @click="downloadAudio(message.audioUrl, message.text)" class="download-button">
            <span>⬇️</span> 下载
          </button>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script>
import MessageItemMarkedText from './MessageItemMarkedText.vue'

export default {
  name: 'MessageItem',
  components: {
    MessageItemMarkedText
  },
  props: {
    message: {
      type: Object,
      required: true
    },
  
  },
  computed: {
    messageClass() {
      return {
        'user-message': this.message.sender === 'user',
        'ai-message': this.message.sender === 'ai'
      }
    }
  },
  methods: {
    formatTime(timestamp) {
      // console.log('formatTime', timestamp)
      return new Date(timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    playAudio(audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play().catch(error => {
        console.error('Error playing audio:', error)
      })
    },
    
    downloadAudio(audioUrl, filename) {
      const link = document.createElement('a')
      link.href = audioUrl
      link.download = `${filename.substring(0, 20)}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },

    downloadImage(imageUrl, filename) {
      // 创建一个临时的canvas来处理图片下载
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        // 转换为blob并下载
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${(filename || 'generated-image').substring(0, 30)}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }, 'image/png')
      }
      
      // 如果跨域加载失败，使用简单的下载方式
      img.onerror = () => {
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = `${(filename || 'generated-image').substring(0, 30)}.png`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      img.src = imageUrl
    }
  }
}
</script>

<style scoped>
.message-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
  width: 100%;
}

.user-message {
  flex-direction: row-reverse;
  justify-content: flex-start;
}

.ai-message {
  flex-direction: row;
}

.message-wrapper {
  flex: 1;
  max-width: 100%;
  min-width: 0;
}

.user-message .message-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.ai-message .message-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.message-content {
  padding: 0.0rem 1rem;
  border-radius: 12px;
  word-wrap: break-word;
  max-width: 100%;
  line-height: 1;
}

.user-message .message-content {
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  color: #1f2937;
  border: 1px solid #e5e7eb;
  border-top-right-radius: 4px;
}

.ai-message .message-content {
  /* background: #f8f9fa; */
  color: #1f2937;
  /* border: 1px solid #e5e7eb; */
  /* border-bottom-left-radius: 4px; */
}

.text-message .message-text {
  line-height: 1.25;
}

.message-text.error {
  color: #dc2626;
}

.message-text.streaming {
  opacity: 0.9;
}

.typing-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  color: #2563eb;
  font-weight: bold;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.message-time {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.375rem;
  padding: 0 0.125rem;
}

/* 图片消息样式 */
.message-image {
  padding: 0.75rem;
  background: transparent;
  border-radius: 12px;
}

.message-image img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  display: block;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ai-message .message-image {
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
}

.user-message .message-image {
  background: #2563eb;
  border: 1px solid #1d4ed8;
}

/* 图片操作按钮样式 */
.image-actions {
  margin-top: 0.5rem;
  display: flex;
  justify-content: center;
}

.download-image-button {
  padding: 0.5rem 0.875rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.15s ease;
  background: #10b981;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: 500;
}

.download-image-button:hover {
  background: #059669;
  transform: translateY(-1px);
}

.download-image-button:active {
  transform: translateY(0);
}

/* 用户语音消息样式 */
.user-audio-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 140px;
}

.audio-icon {
  font-size: 1.25rem;
}

.audio-text {
  font-size: 0.9rem;
  flex: 1;
}

.audio-controls {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f3f4f6;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  width: fit-content;
}

.audio-indicator {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.audio-buttons {
  display: flex;
  gap: 0.5rem;
}

.play-button, .download-button {
  padding: 0.5rem 0.875rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.15s ease;
  background: #10b981;
  color: white;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.play-button:hover, .download-button:hover {
  background: #059669;
  transform: translateY(-1px);
}

.message-avatar {
  flex-shrink: 0;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  border: 2px solid transparent;
}

.avatar.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #e5e7eb;
}

.avatar.ai {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: #e5e7eb;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-item {
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }
  
  .message-wrapper {
    max-width: calc(100% - 44px);
  }
  
  .avatar {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }

  
  .message-image img {
    max-width: 160px;
    max-height: 160px;
  }
}
</style>