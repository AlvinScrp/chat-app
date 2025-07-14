<template>
  <div class="sidebar-container" :class="containerClasses">
    <!-- 移动端遮罩层 -->
    <div v-if="isVisible && isMobile" class="sidebar-overlay" @click="$emit('close')"></div>

    <!-- 侧边栏主体 -->
    <div class="sidebar" :class="sidebarClasses">
      <!-- 桌面端收起状态：竖条模式 -->
      <div v-if="!isMobile && !isExpanded" class="sidebar-collapsed">
        <button class="expand-trigger" @click="$emit('toggle')" title="展开侧边栏">
          <span class="trigger-icon">☰</span>
        </button>

        <!-- 收起状态的功能图标 -->
        <div class="nav-icons">
          <div
            class="nav-icon-item"
            :class="{ active: currentPageType === PAGE_TYPE.textChat }"
            @click="switchPage(PAGE_TYPE.textChat)"
            title="文字聊天"
          >
            <span class="icon">💬</span>
          </div>
          <div
            class="nav-icon-item"
            :class="{ active: currentPageType === PAGE_TYPE.audio2text }"
            @click="switchPage(PAGE_TYPE.audio2text)"
            title="语音转文字"
          >
            <span class="icon">🎤</span>
          </div>
          <div
            class="nav-icon-item"
            :class="{ active: currentPageType === PAGE_TYPE.text2audio }"
            @click="switchPage(PAGE_TYPE.text2audio)"
            title="文字转语音"
          >
            <span class="icon">🎵</span>
          </div>
          <div
            class="nav-icon-item"
            :class="{ active: currentPageType === PAGE_TYPE.imageGen }"
            @click="switchPage(PAGE_TYPE.imageGen)"
            title="图片生成"
          >
            <span class="icon">🖼️</span>
          </div>
        </div>
      </div>

      <!-- 桌面端展开状态 / 移动端 -->
      <div v-if="isMobile || (!isMobile && isExpanded)" class="sidebar-expanded">
        <!-- 头部 -->
        <div class="sidebar-header">
          <button class="expand-trigger" @click="$emit('toggle')" title="隐藏侧边栏">
            <span class="trigger-icon">☰</span>
          </button>
          <button class="close-btn" @click="handleHeaderClose">
            <span v-if="isMobile">✕</span>
            <span v-else>◀</span>
          </button>
        </div>

        <!-- 功能导航 -->
        <div class="sidebar-section">
          <div class="nav-items">
            <div class="nav-item" :class="{ active: currentPageType === PAGE_TYPE.textChat }" @click="switchPage(PAGE_TYPE.textChat)">
              <span class="nav-icon">💬</span>
              <span class="nav-text">文字聊天</span>
            </div>
            <div class="nav-item" :class="{ active: currentPageType === PAGE_TYPE.audio2text }" @click="switchPage(PAGE_TYPE.audio2text)">
              <span class="nav-icon">🎤</span>
              <span class="nav-text">语音转文字</span>
            </div>
            <div class="nav-item" :class="{ active: currentPageType === PAGE_TYPE.text2audio }" @click="switchPage(PAGE_TYPE.text2audio)">
              <span class="nav-icon">🎵</span>
              <span class="nav-text">文字转语音</span>
            </div>
            <div class="nav-item" :class="{ active: currentPageType === PAGE_TYPE.imageGen }" @click="switchPage(PAGE_TYPE.imageGen)">
              <span class="nav-icon">🖼️</span>
              <span class="nav-text">图片生成</span>
            </div>
          </div>
        </div>

        <!-- 历史记录 -->
        <div class="sidebar-section">
          <div class="history-label">历史记录</div>
          <!-- 文字聊天Session -->
          <div class="history-group">
            <div class="history-title collapsible" @click="toggleHistoryCollapse('textChat')">
              <div class="title-content">
                <span class="history-icon">💬</span>
                <span>文字聊天</span>
              </div>
              <span class="collapse-icon" :class="{ collapsed: historyCollapsed.textChat }"> ▼ </span>
            </div>
            <transition name="collapse">
              <div class="history-list" v-show="!historyCollapsed.textChat">
                <div
                  v-for="session in textChatSessions"
                  :key="session.id"
                  class="history-item"
                   :class="{ active: isHistorySessionSelected(session.id) }"
                  @click="switchPage(PAGE_TYPE.textChat, session.id, session.name)"
                >
                  <div class="session-info">
                    <span class="session-name">{{ session.name }}</span>
                    <!-- <span class="session-time">{{ session.displayTime }}</span> -->
                  </div>
                  <!-- <span class="history-count">{{ session.messageCount }}条</span> -->
                </div>
                <div v-if="textChatSessions.length === 0" class="no-history">暂无对话记录</div>
              </div>
            </transition>
          </div>
          <!-- 图片生成Session -->
          <div class="history-group">
            <div class="history-title collapsible" @click="toggleHistoryCollapse('imageGen')">
              <div class="title-content">
                <span class="history-icon">🖼️</span>
                <span>图片生成</span>
              </div>
              <span class="collapse-icon" :class="{ collapsed: historyCollapsed.imageGen }"> ▼ </span>
            </div>
            <transition name="collapse">
              <div class="history-list" v-show="!historyCollapsed.imageGen">
                <div
                  v-for="session in imageGenSessions"
                  :key="session.id"
                  class="history-item"
                  :class="{ active: isHistorySessionSelected(session.id) }"
                  @click="switchPage(PAGE_TYPE.imageGen, session.id)"
                >
                  <div class="session-info">
                    <span class="session-name">{{ session.name }}</span>
                    <!-- <span class="session-time">{{ session.displayTime }}</span> -->
                  </div>
                  <!-- <span class="history-count">{{ session.messageCount }}条</span> -->
                </div>
                <div v-if="imageGenSessions.length === 0" class="no-history">暂无对话记录</div>
              </div>
            </transition>
          </div>
          <!-- 清空历史记录按钮 -->
          <div class="clear-history-section">
            <button class="clear-btn" @click="confirmClearHistory">清空所有历史</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getSessionList, clearAllSessions } from '../services/historyService';
import { PAGE_TYPE } from '../utils/constants';

export default {
  name: 'SideBar',
  props: {
    isVisible: {
      type: Boolean,
      default: false,
    },
    isExpanded: {
      type: Boolean,
      default: false,
    },
    currentPageType: {
      type: String,
      default: PAGE_TYPE.textChat,
    },
  },
  data() {
    return {
      PAGE_TYPE,
      textChatSessions: [],
      imageGenSessions: [],
      isMobile: window.innerWidth <= 768,
      // 历史记录折叠状态
      historyCollapsed: {
        textChat: false,
        imageGen: false,
      },
    };
  },
  computed: {
    containerClasses() {
      return {
        'mobile-mode': this.isMobile,
        'desktop-mode': !this.isMobile,
        visible: this.isVisible,
        expanded: !this.isMobile && this.isExpanded,
      };
    },
    sidebarClasses() {
      return {
        'sidebar-open': this.isVisible,
        'mobile-drawer': this.isMobile,
        'desktop-collapsed': !this.isMobile && !this.isExpanded,
        'desktop-expanded': !this.isMobile && this.isExpanded,
      };
    },
    sidebarRefresh() {
      return this.$store.getters.sidebarRefresh;
    },
  },
  watch: {
    sidebarRefresh() {
      if (this.sidebarRefresh) {
        console.log('Sidebar: 检测到消息更新，刷新历史记录列表');
        this.loadSessionList();
      }
    },
  },
  mounted() {
    this.loadSessionList();
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    /**
     * 处理窗口大小变化
     */
    handleResize() {
      this.isMobile = window.innerWidth <= 768;
    },

    /**
     * 切换页面
     */
    switchPage(pageType, sessionId) {
      this.$emit('switch-page', { pageType, sessionId });
      if (this.isMobile) {
        this.$emit('close');
      }
    },

    /**
     * 处理头部关闭按钮点击
     */
    handleHeaderClose() {
      if (this.isMobile) {
        this.$emit('close');
      } else {
        this.$emit('toggle');
      }
    },

    /**
     * 加载会话列表
     */
    loadSessionList() {
      const prevTextCount = this.textChatSessions.length;
      const prevImageCount = this.imageGenSessions.length;

      this.textChatSessions = getSessionList(PAGE_TYPE.textChat);
      this.imageGenSessions = getSessionList(PAGE_TYPE.imageGen);

      if (prevTextCount !== this.textChatSessions.length || prevImageCount !== this.imageGenSessions.length) {
        console.log('Sidebar session lists updated:', {
          textSessions: this.textChatSessions.length,
          imageSessions: this.imageGenSessions.length,
        });
      }
    },

    isHistorySessionSelected(sessionId) {
      const currentSessionId = this.sidebarRefresh?.sessionId;
      return currentSessionId && sessionId === currentSessionId;
    },

    /**
     * 切换历史记录折叠状态
     */
    toggleHistoryCollapse(type) {
      this.historyCollapsed[type] = !this.historyCollapsed[type];
    },

    /**
     * 确认清空历史记录
     */
    confirmClearHistory() {
      if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
        clearAllSessions(PAGE_TYPE.textChat);
        clearAllSessions(PAGE_TYPE.imageGen);
        this.loadSessionList();
        this.$emit('history-cleared');
      }
    },
  },
};
</script>

<style scoped>
.sidebar-container {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  height: 100vh;
}

/* 桌面模式 - 常驻左侧 */
.sidebar-container.desktop-mode {
  width: 60px; /* 收起状态宽度 */
  transition: width 0.3s ease;
}

.sidebar-container.desktop-mode.expanded {
  width: 240px; /* 展开状态宽度 */
}

/* 移动模式 */
.sidebar-container.mobile-mode {
  width: 240px;
  pointer-events: none;
}

.sidebar-container.mobile-mode.visible {
  pointer-events: all;
}

.sidebar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  pointer-events: all;
}

.sidebar {
  position: relative;
  height: 100%;
  background: #fffffff2;
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 桌面端收起状态 */
.sidebar.desktop-collapsed {
  width: 60px;
  border-right: 1px solid #e5e7eb;
  /* box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1); */
}

/* 桌面端展开状态 */
.sidebar.desktop-expanded {
  width: 240px;
  border-right: 1px solid #e5e7eb;
  /* box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1); */
  overflow: visible;
}

/* 移动端抽屉模式 */
.sidebar.mobile-drawer {
  position: absolute;
  left: 0;
  width: 240px;
  transform: translateX(-100%);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.sidebar.mobile-drawer.sidebar-open {
  transform: translateX(0);
}

/* 收起状态样式 */
.sidebar-collapsed {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0;
}

.expand-trigger {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 8px;
  transition: background 0.2s ease;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-trigger:hover {
  background: #f3f4f6;
}

.trigger-icon {
  font-size: 1.25rem;
  font-weight: 500;
}

.nav-icons {
  display: flex;
  flex-grow: 0;
  margin-top: 1rem;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
  padding: 0 0.5rem;
}

.nav-icon-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  cursor: pointer;
  /* transition: all 0.2s ease; */
  margin: 0 auto;
}

.nav-icon-item:hover {
  background: #eff6ff;
  border: 1px solid #dbeafe;
}

.nav-icon-item.active {
  background: #f3f4f6;
}

.nav-icon-item .icon {
  font-size: 1.2rem;
}

/* 展开状态样式 */
.sidebar-expanded {
  height: 100%;
  display: flex;
  width: 240px;
  flex-direction: column;
  overflow: hidden;
}

.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.sidebar-header {
  display: flex;
  margin-right: 1px;
  padding: 0.5rem 0.5rem 0 0.5rem;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.sidebar-section {
  padding-top: 1rem;
  padding-right: 1px;
  border-bottom: 1px solid #f3f4f6;
}

.sidebar-section:first-child {
  flex-grow: 0;
}

.sidebar-section:last-child {
  border-bottom: none;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.sidebar-section h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex-grow: 0;
  width: 239px;
  flex-shrink: 0;
  height: 44px;
  padding: 0.875rem 1rem;
  border-radius: 0px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #374151;
  font-weight: 500;
}

.nav-item:hover {
  background: #f8f9fa;
  color: #1f2937;
}

.nav-item.active {
  background: #eff6ff;
  color: #2563eb;
  border: 0px solid #dbeafe;
}

.nav-icon {
  font-size: 1.2rem;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.nav-text {
  font-size: 0.9rem;
  font-weight: 500;
}

.history-group {
  margin-left: 0.5rem;
  margin-bottom: 0.5rem;
}

.history-group:last-child {
  margin-bottom: 0;
}
.history-label {
  font-weight: 600;
  color: #1f2937;
  padding: 0.5rem;
}

.history-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  padding: 0.5rem 0;
}

.history-title.collapsible {
  cursor: pointer;
  transition: background 0.2s ease;
  border-radius: 6px;
  padding: 0.5rem 1rem 0.5rem 0.5rem;
  margin: 0 -0.5rem;
}

.history-title.collapsible:hover {
  background: #f8f9fa;
}

.title-content {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.collapse-icon {
  font-size: 1rem;
  line-height: 1.5rem;
  color: #6b7280;
  transition: transform 0.2s ease;
  user-select: none;
}

.collapse-icon.collapsed {
  transform: rotate(-180deg);
}

.history-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.history-list {
  margin-left: 0;
  margin-right: 0.5rem;
  transition: all 0.3s ease;
  overflow: hidden;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.5rem 0.5rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.875rem;
  border: 1px solid transparent;
}

.history-item:hover {
  background: #f3f4f6;
}

.history-item.active {
  background: #f8f9fa;
  border-color: #e5e7eb;
 
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.session-name {
  color: #333333;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.session-time {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 400;
}

.history-count {
  color: #6b7280;
  font-size: 0.75rem;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.no-history {
  color: #9ca3af;
  font-size: 0.8rem;
  text-align: center;
  padding: 2rem 1rem;
  font-style: italic;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #d1d5db;
}

.clear-history-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f3f4f6;
}

.clear-btn {
  width: 100%;
  padding: 0.875rem 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.clear-btn:hover {
  background: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
}

.clear-btn:active {
  transform: translateY(0);
}

/* 折叠动画 */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  opacity: 1;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar.mobile-drawer {
    width: 300px;
  }
}

@media (max-width: 480px) {
  .sidebar.mobile-drawer {
    width: 100%;
  }
}
</style>
