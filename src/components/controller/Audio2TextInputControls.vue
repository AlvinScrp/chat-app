<template>
  <div class="audio-controls">
    <div class="control-row">
      <div class="file-upload-container">
        <input type="file" accept="audio/*" @change="onAudioUpload" class="file-input" ref="fileInput" id="audio-file-input" />
        <label for="audio-file-input" class="file-input-label">
          <span class="upload-icon">📁</span>
          <span class="upload-text">选择音频文件</span>
        </label>
      </div>
      <div class="empty-space"></div>
      <div class="recording-controls">
        <button
          @click="recording ? stopRecording() : startRecording()"
          :disabled="loading"
          class="record-button"
          :class="{ recording: recording }"
        >
          <span class="button-icon">{{ recording ? '⏹️' : '▶️' }}</span>
          <span class="button-text">{{ recording ? '停止录音' : '开始录音' }}</span>
        </button>
      </div>
      <label class="translate-option">
        <input type="checkbox" v-model="needTranslate" :disabled="loading" class="translate-checkbox" />
        <span class="translate-text">同时翻译</span>
      </label>
      <button @click="sendAudio" :disabled="!audioBlob || loading" class="send-button" :class="{ 'has-audio': audioBlob }">
        <span class="button-text">{{ loading ? '处理中...' : '发送语音' }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import { transcribeAudio, translateAudio } from '@/services/openai';

export default {
  name: 'Audio2TextInputControls',
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      needTranslate: false,
      audioBlob: null,
      recording: false,
      loading: false,
      mediaRecorder: null,
      audioChunks: [],
    };
  },
  methods: {
    /**
     * 处理音频文件上传
     */
    onAudioUpload(e) {
      const file = e.target.files[0];
      if (file) {
        this.audioBlob = file;
        console.log('音频文件已选择:', file.name);
      }
    },

    /**
     * 开始录音
     */
    async startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
        this.mediaRecorder.onstop = () => {
          this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          // 停止所有音频轨道
          stream.getTracks().forEach((track) => track.stop());
          console.log('录音完成');
        };

        this.mediaRecorder.start();
        this.recording = true;
        console.log('开始录音');
      } catch (error) {
        console.error('Error accessing microphone:', error);

        // 通知外部添加错误消息
        this.$emit('add-message', {
          id: Date.now(),
          sender: 'ai',
          text: '无法访问麦克风，请检查权限设置',
          timestamp: new Date(),
          type: 'text',
          error: true,
        });
      }
    },

    /**
     * 停止录音
     */
    stopRecording() {
      if (this.mediaRecorder && this.recording) {
        this.mediaRecorder.stop();
        this.recording = false;
        console.log('停止录音');
      }
    },

    /**
     * 发送音频进行处理
     */
    async sendAudio() {
      if (!this.audioBlob || this.loading) return;

      this.loading = true;

      // 通知外部添加用户语音消息
      this.$emit('add-message', {
        id: Date.now(),
        sender: 'user',
        text: '[语音消息]',
        timestamp: new Date(),
        type: 'user-audio',
      });

      try {
        let text = '';
        if (this.needTranslate) {
          text = await translateAudio(this.audioBlob);
        } else {
          text = await transcribeAudio(this.audioBlob);
        }

        // 通知外部添加AI响应消息
        this.$emit('add-message', {
          id: Date.now() + 1,
          sender: 'ai',
          text: text,
          timestamp: new Date(),
          type: 'text',
        });

        console.log('音频处理成功:', text);
      } catch (error) {
        console.error('Speech recognition error:', error);

        // 通知外部添加错误消息
        this.$emit('add-message', {
          id: Date.now() + 2,
          sender: 'ai',
          text: this.needTranslate ? '翻译失败，请稍后再试' : '语音识别失败，请稍后再试',
          timestamp: new Date(),
          type: 'text',
          error: true,
        });
      }

      // 清理状态
      this.audioBlob = null;
      this.loading = false;

      // 清空文件输入
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },

    /**
     * 重置控件状态
     */
    reset() {
      this.audioBlob = null;
      this.recording = false;
      this.loading = false;
      this.needTranslate = false;

      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
  },
};
</script>

<style scoped>
/* 导入通用样式 */
@import './common-input-controls.css';

.audio-controls {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-top: 1px solid #e2e8f0;
  border-radius: 0 0 12px 12px;
}
.control-row {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.empty-space {
  flex-grow: 1;
}


/* 文件上传区域 */
.file-upload-container {
  flex-shrink: 0;
  flex-grow: 0;
  width: 150px;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.file-input-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  background: #ffffff;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  color: #64748b;
}

.file-input-label:hover {
  border-color: #3b82f6;
  background: #f8fafc;
  color: #1e40af;
}

.upload-icon {
  font-size: 1.125rem;
}

.upload-text {
  font-weight: 500;
}

/* 录音控制区域 */
.recording-controls {
  display: flex;
  gap: 0.5rem;
}

.record-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}
.record-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4);
}

.record-button.recording {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  animation: pulse 2s infinite;
}

.record-button:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.button-icon {
  font-size: 1rem;
}

.button-text {
  font-weight: 500;
}

/* 选项区域 */
.translate-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  flex-shrink: 0;
  flex-grow: 0;
  cursor: pointer;
  user-select: none;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.translate-option:hover {
  background: #f3f4f6;
}

.translate-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.translate-checkbox:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.translate-text {
  font-weight: 500;
}

/* 发送按钮特殊样式 */
.send-button.has-audio {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.send-button.has-audio:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
}

/* 动画效果 */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .audio-controls {
    padding: 1rem;
  }

  .file-input-label {
    justify-content: center;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .audio-controls {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-top-color: #334155;
  }

  .file-input-label {
    background: #1f2937;
    border-color: #475569;
    color: #cbd5e1;
  }

  .file-input-label:hover {
    border-color: #3b82f6;
    background: #1e293b;
    color: #60a5fa;
  }

  .translate-option {
    color: #e2e8f0;
  }

  .translate-option:hover {
    background: #374151;
  }
}
</style>
