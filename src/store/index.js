import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    sidebarRefresh: {
      time: null,
      pageType: null,
      sessionId: null
    },

  },
  mutations: {
    MESSSAGE_CHANGE(state, { time, pageType, sessionId }) {
      state.sidebarRefresh = {
        time: time,
        pageType: pageType,
        sessionId: sessionId
      }

    }
  },


  actions: {
    // 通知消息已更新
    notifyMessageUpdate({ commit }, { pageType, sessionId }) {
      console.log(`notifyMessageUpdate:${pageType} ${sessionId}`)
      commit('MESSSAGE_CHANGE', { time: Date.now(), pageType, sessionId })
    },

  },

  getters: {
    // 获取侧边栏刷新时间戳
    sidebarRefresh: state => state.sidebarRefresh,
  }
}) 