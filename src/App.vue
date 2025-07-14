<template>
  <div id="app" :class="{ 'mobile': isMobile, 'sidebar-expanded': isSidebarExpanded }">
    <!-- 移动端标题栏 -->
    <div class="mobile-header" v-if="isMobile">
      <button class="mobile-trigger" @click="toggleMobileSidebar">
        <span class="trigger-icon">☰</span>
      </button>
      <h2>{{ getPageTitle() }}</h2>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <ChatWindow 
        :key="componentKey" 
        :pageType="currentPageType" 
        :session-id="currentSessionId" 
      />
    </div>

    <!-- 侧边栏 -->
    <left-side-bar
      ref="sidebar"
      :isVisible="showSidebar"
      :isExpanded="isSidebarExpanded"
      :currentPageType="currentPageType"
      @close="closeSidebar"
      @toggle="toggleDesktopSidebar"
      @switch-page="handleSwitchPage"
    />
  </div>
</template>

<script>
import LeftSideBar from '@components/LeftSideBar';
import historyService from '@services/historyService';
import { PAGE_TYPE } from '@utils/constants';
import ChatWindow from '@views/ChatWindow.vue';

export default {
  name: 'App',
  components: {
    LeftSideBar,
    ChatWindow,
  },
  data() {
    return {
      showSidebar: true, // 桌面端默认显示侧边栏
      isSidebarExpanded: false, // 桌面端默认收起状态
      currentPageType: PAGE_TYPE.textChat,
      currentSessionId: '',
      componentKey: Date.now(),
      isMobile: window.innerWidth <= 768,
    };
  },
  mounted() {
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize);
    this.handleResize();

    // 初始化页面
    const path = this.$route.path;
    const pageType = path.split('/')[1] || PAGE_TYPE.textChat;
    let sessionId = path.split('/')[2] || null;
    if (!historyService.hasExistingSession(pageType, sessionId)) {
      sessionId = null;
    }
    this.handleSwitchPage({ pageType, sessionId });
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    /**
     * 处理窗口大小变化
     */
    handleResize() {
      const newIsMobile = window.innerWidth <= 768;
      if (this.isMobile !== newIsMobile) {
        this.isMobile = newIsMobile;
        
        if (this.isMobile) {
          // 切换到移动端：关闭侧边栏
          this.showSidebar = false;
          this.isSidebarExpanded = false;
        } else {
          // 切换到桌面端：显示收起状态的侧边栏
          this.showSidebar = true;
          this.isSidebarExpanded = false;
        }
      }
    },

    /**
     * 切换移动端侧边栏
     */
    toggleMobileSidebar() {
      this.showSidebar = !this.showSidebar;
    },

    /**
     * 切换桌面端侧边栏展开状态
     */
    toggleDesktopSidebar() {
      this.isSidebarExpanded = !this.isSidebarExpanded;
    },

    /**
     * 关闭侧边栏
     */
    closeSidebar() {
      if (this.isMobile) {
        // 移动端：直接关闭
        this.showSidebar = false;
      } else {
        // 桌面端：切换到收起状态
        this.isSidebarExpanded = false;
      }
    },

    /**
     * 获取页面标题
     */
    getPageTitle() {
      const titles = {
        [PAGE_TYPE.textChat]: '文字聊天',
        [PAGE_TYPE.text2audio]: '文字转语音',
        [PAGE_TYPE.audio2text]: '语音转文字',
        [PAGE_TYPE.imageGen]: '图片生成',
      };
      return titles[this.currentPageType] || 'AI Assistant';
    },

    /**
     * 处理页面切换
     */
    handleSwitchPage({ pageType, sessionId }) {
      this.currentPageType = pageType;
      this.ensurePageHasSession(pageType, sessionId);
      this.updatePageRoute(pageType, this.currentSessionId);
      this.componentKey = Date.now();
      
      // 移动端切换页面后关闭侧边栏
      if (this.isMobile) {
        this.showSidebar = false;
      }
      
      console.log(`切换到${pageType}页面 ${this.currentSessionId}`);
      this.$store.dispatch('notifyMessageUpdate', {
            sessionId: this.currentSessionId,
            pageType: this.currentPageType
          })
      
    },

    /**
     * 更新页面路由
     */
    updatePageRoute(pageType, sessionId) {
      try {
        const routePath = sessionId ? `/${pageType}/${sessionId}` : `/${pageType}`;
        if (this.$route.path !== routePath) {
          this.$router.push({ path: routePath }).catch(err => {
            if (err.name !== 'NavigationDuplicated') {
              console.error('路由跳转失败:', err);
            }
          });
        }
        console.log(`页面路由已更新: ${routePath}`);
      } catch (error) {
        console.error('更新页面路由失败:', error);
      }
    },

    /**
     * 确保指定页面有活跃的session
     */
    ensurePageHasSession(pageType, sessionId) {
      try {
        if (!sessionId) {
          const newSessionId = historyService.generateNewSessionId(pageType);
          this.currentSessionId = newSessionId;
          console.log(`为${pageType}页面自动创建session: ${newSessionId}`);
        } else {
          this.currentSessionId = sessionId;
          console.log(`${pageType}页面 session: ${sessionId}`);
        }
      } catch (error) {
        console.error('确保页面session失败:', error);
      }
    },
  },
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #ffffff;
  color: #1f2937;
}

#app {
  height: 100vh;
  display: flex;
  position: relative;
}

/* 移动端标题栏 */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  z-index: 1001;
}

.mobile-trigger {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  margin-right: 1rem;
  padding: 0.5rem;
}

.mobile-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
}

.trigger-icon {
  font-size: 1.25rem;
  font-weight: 500;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  height: 100vh;
  transition: margin-left 0.3s ease;
}

/* 桌面端：侧边栏收起状态 */
#app:not(.mobile) .main-content {
  margin-left: 60px;
}

/* 桌面端：侧边栏展开状态 */
#app.sidebar-expanded:not(.mobile) .main-content {
  margin-left: 240px;
}

/* 移动端：标题栏存在时主内容上移 */
#app.mobile .main-content {
  padding-top: 60px;
}

/* 隐藏移动端元素在桌面端 */
@media (min-width: 769px) {
  .mobile-header {
    display: none;
  }
}

/* 隐藏桌面端元素在移动端 */
@media (max-width: 768px) {
  #app:not(.mobile) .main-content {
    margin-left: 0;
  }
}
</style>
