<template>
  <textarea
    :value="value"
    @input="handleInput"
    @keydown.enter.exact.prevent="handleEnter"
    @keydown.shift.enter.exact.prevent="handleShiftEnter"
    @compositionstart="handleCompositionStart"
    @compositionend="handleCompositionEnd"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
    :maxlength="maxLength"
    class="textarea-input"
    ref="textarea"
  ></textarea>
</template>

<script>
export default {
  name: 'TextareaInput',
  props: {
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '请输入...'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    rows: {
      type: Number,
      default: 1
    },
    maxHeight: {
      type: Number,
      default: 120
    },
    minHeight: {
      type: Number,
      default: 24
    },
    maxLength: {
      type: Number,
      default: null
    },
    autoResize: {
      type: Boolean,
      default: true
    },
    enterToSubmit: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      isComposing: false // 跟踪输入法状态
    }
  },
  mounted() {
    if (this.autoResize) {
      this.adjustHeight()
    }
  },
  watch: {
    value() {
      if (this.autoResize) {
        this.adjustHeight()
      }
    }
  },
  methods: {
    /**
     * 处理输入事件
     */
    handleInput(event) {
      const value = event.target.value
      this.$emit('input', value)
      
      if (this.autoResize) {
        this.adjustHeight()
      }
    },

    /**
     * 处理Enter键
     */
    handleEnter() {
      // 如果正在使用输入法，不处理
      if (this.isComposing) {
        return
      }
      
      if (this.enterToSubmit) {
        this.$emit('enter')
      } else {
        this.insertNewLine()
      }
    },

    /**
     * 处理Shift+Enter键
     */
    handleShiftEnter() {
      this.insertNewLine()
    },

    /**
     * 插入换行符
     */
    insertNewLine() {
      const newValue = this.value + '\n'
      this.$emit('input', newValue)
      
      this.$nextTick(() => {
        if (this.autoResize) {
          this.adjustHeight()
        }
      })
    },

    /**
     * 输入法开始输入
     */
    handleCompositionStart() {
      this.isComposing = true
      this.$emit('composition-start')
    },

    /**
     * 输入法结束输入
     */
    handleCompositionEnd() {
      this.isComposing = false
      this.$emit('composition-end')
    },

    /**
     * 自动调整textarea高度
     */
    adjustHeight() {
      this.$nextTick(() => {
        const textarea = this.$refs.textarea
        if (textarea) {
          textarea.style.height = 'auto'
          const scrollHeight = textarea.scrollHeight
          const newHeight = Math.max(
            this.minHeight,
            Math.min(scrollHeight, this.maxHeight)
          )
          textarea.style.height = newHeight + 'px'
        }
      })
    },

    /**
     * 聚焦输入框
     */
    focus() {
      if (this.$refs.textarea) {
        this.$refs.textarea.focus()
      }
    },

    /**
     * 失焦输入框
     */
    blur() {
      if (this.$refs.textarea) {
        this.$refs.textarea.blur()
      }
    },

    /**
     * 选择文本
     */
    select() {
      if (this.$refs.textarea) {
        this.$refs.textarea.select()
      }
    },

    /**
     * 设置光标位置
     */
    setCursorPosition(position) {
      if (this.$refs.textarea) {
        this.$refs.textarea.setSelectionRange(position, position)
      }
    },

    /**
     * 获取光标位置
     */
    getCursorPosition() {
      if (this.$refs.textarea) {
        return this.$refs.textarea.selectionStart
      }
      return 0
    },

    /**
     * 重置高度
     */
    resetHeight() {
      if (this.$refs.textarea && this.autoResize) {
        this.$refs.textarea.style.height = this.minHeight + 'px'
      }
    }
  }
}
</script>

<style scoped>
.textarea-input {
  flex: 1;
  resize: none;
  border: none;
  outline: none;
  font-size: 1rem;
  line-height: 1.5;
  color: #1f2937;
  background: transparent;
  font-family: inherit;
  overflow-y: auto;
  word-wrap: break-word;
  word-break: break-word;
}

.textarea-input::placeholder {
  color: #9ca3af;
  line-height: 1.5rem;
}

.textarea-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  color: #9ca3af;
}

/* 自定义滚动条 */
.textarea-input::-webkit-scrollbar {
  width: 4px;
}

.textarea-input::-webkit-scrollbar-track {
  background: transparent;
}

.textarea-input::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.textarea-input::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .textarea-input {
    font-size: 0.9rem;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .textarea-input {
    color: #f9fafb;
  }
  
  .textarea-input::placeholder {
    color: #6b7280;
  }
  
  .textarea-input:disabled {
    color: #6b7280;
  }
  
  .textarea-input::-webkit-scrollbar-thumb {
    background: #4b5563;
  }
  
  .textarea-input::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
}
</style> 