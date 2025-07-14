<template>
  <div class="ai-content">
    <div class="markdown-content" v-html="renderedMarkdown"></div>
    <span v-if="isStreaming" class="typing-cursor">|</span>
  </div>
</template>

<script>
import { marked } from 'marked'

export default {
  name: 'MessageItemMarkedText',
  props: {
    text: {
      type: String,
      required: true
    },
    isStreaming: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    renderedMarkdown() {
      if (!this.text) return ''
      
      // 配置marked选项
      marked.setOptions({
        breaks: true, // 支持换行
        gfm: true,    // 支持GitHub风格的markdown
        sanitize: false, // 允许HTML（谨慎使用）
        smartLists: true,
        smartypants: true
      })
      
      return marked(this.text)
    }
  }
}
</script>

<style scoped>
/* AI内容容器 */
.ai-content {
  display: inline;
  
}

/* Markdown样式 */
.markdown-content {
  line-height: 1.6;
  display: inline;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin: 1rem 0 0.5rem 0;
  font-weight: bold;
  color: inherit;
}

.markdown-content h1 { font-size: 1.25rem; }
.markdown-content h2 { font-size: 1.1rem; }
.markdown-content h3 { font-size: 1rem; }

.markdown-content p {
  margin: 0.5rem 0;
}

.markdown-content ul,
.markdown-content ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.markdown-content li {
  margin: 0.25rem 0.5rem;
}

.markdown-content code {
  background: rgba(0, 0, 0, 0.15);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}

.markdown-content pre {
  background: rgba(0, 0, 0, 0.15);
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.markdown-content pre code {
  background: none;
  padding: 0;
}

.markdown-content blockquote {
  border-left: 3px solid #ddd;
  margin: 0.5rem 0;
  padding-left: 1rem;
  color: #666;
  font-style: italic;
}

.markdown-content strong {
  font-weight: bold;
}

.markdown-content em {
  font-style: italic;
}

.markdown-content a {
  color: #1976d2;
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.markdown-content hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 1rem 0;
}

.typing-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  color: #1976d2;
  font-weight: bold;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
