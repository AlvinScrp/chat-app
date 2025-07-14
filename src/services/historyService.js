import { v4 as uuidv4 } from 'uuid';
import { PAGE_TYPE } from '@utils/constants';
/**
 * 历史记录管理服务 - Session模式
 * 负责存储和读取文字聊天和图片生成的会话历史记录
 */

const STORAGE_KEYS = {
  TEXT_CHAT: 'chat_sessions_text',
  IMAGE_GEN: 'chat_sessions_image'
}

/**
 * 生成唯一的session ID
 */
function generateNewSessionId(type) {
  return `${uuidv4()}`
}

/**
 * 生成session名称（从第一条用户消息提取）
 */
function generateSessionName(messages) {
  if (!messages || messages.length === 0) {
    return '新对话'
  }

  // 找到第一条用户消息
  const firstUserMessage = messages.find(msg => msg.sender === 'user')
  if (firstUserMessage && firstUserMessage.text) {
    // 取前15个字符作为session名称
    let name = firstUserMessage.text.trim()
    if (name.length > 15) {
      name = name.substring(0, 15) + '...'
    }
    return name || '新对话'
  }

  return '新对话'
}

/**
 * 格式化时间显示
 */
function formatTimeDisplay(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const diffTime = today.getTime() - messageDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    // 今天，显示时间
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }
}

// /**
//  * 创建新的session
//  * @param {string} type - 'text' 或 'image'
//  * @returns {string} 新创建的session ID
//  */
// export function createNewSession(type) {
//   try {
//     const storageKey = type === 'text' ? STORAGE_KEYS.TEXT_CHAT : STORAGE_KEYS.IMAGE_GEN
//     const sessionId = generateSessionId(type)
//     const sessionName = generateSessionName(messages)
//     const currentTime = new Date().toISOString()

//     // 获取现有sessions
//     const existingSessions = JSON.parse(localStorage.getItem(storageKey) || '{}')

//     // 创建新session
//     const newSession = {
//       id: sessionId,
//       name: sessionName,
//       createdAt: currentTime,
//       lastUpdated: currentTime, // 设置最后更新时间
//       messages: messages ? [...messages] : []
//     }

//     // 保存新session
//     existingSessions[sessionId] = newSession
//     localStorage.setItem(storageKey, JSON.stringify(existingSessions))

//     console.log(`已创建新${type === 'text' ? '文字聊天' : '图片生成'}session:`, sessionName)
//     return sessionId
//   } catch (error) {
//     console.error('创建session失败:', error)
//     return null
//   }
// }

/**
 * 更新现有session的消息（自动保存功能）
 * @param {string} type - 'text' 或 'image'
 * @param {string} sessionId - session ID
 * @param {array} messages - 消息数组
 */
export function updateSessionMessages(type, sessionId, messages) {
  try {
    const storageKey = type === 'text' ? STORAGE_KEYS.TEXT_CHAT : STORAGE_KEYS.IMAGE_GEN
    const existingSessions = JSON.parse(localStorage.getItem(storageKey) || '{}')

    if (existingSessions[sessionId]) {
      existingSessions[sessionId].messages = [...messages]
      existingSessions[sessionId].lastUpdated = new Date().toISOString()
      localStorage.setItem(storageKey, JSON.stringify(existingSessions))
    }
  } catch (error) {
    console.error('更新session失败:', error)
  }
}

/**
 * 读取指定session的消息
 * @param {string} type - 'text' 或 'image'
 * @param {string} sessionId - session ID
 * @returns {array} 消息数组
 */
export function loadSessionMessages(type, sessionId) {
  try {
    const storageKey = storageKeyOfSessions(type)
    const allSessions = JSON.parse(localStorage.getItem(storageKey) || '{}')

    if (allSessions[sessionId]) {
      return allSessions[sessionId].messages || []
    }

    return []
  } catch (error) {
    console.error('读取session消息失败:', error)
    return []
  }
}

/**
 * 获取session列表
 * @param {string} type - 'text' 或 'image'
 * @returns {array} session列表
 */
export function getSessionList(type) {
  try {
    const storageKey = storageKeyOfSessions(type)
    const allSessions = JSON.parse(localStorage.getItem(storageKey) || '{}')

    // 转换为数组并按最后更新时间排序（最新的在前）
    const sessionList = Object.values(allSessions)
      .map(session => {
        // 使用lastUpdated时间，如果没有则使用createdAt
        const sortTime = session.lastUpdated || session.createdAt
        const displayTime = formatTimeDisplay(sortTime)

        return {
          id: session.id,
          name: session.name,
          messageCount: session.messages ? session.messages.length : 0,
          createdAt: session.createdAt,
          lastUpdated: session.lastUpdated,
          sortTime: sortTime,
          displayTime: displayTime
        }
      })
      .sort((a, b) => new Date(b.sortTime) - new Date(a.sortTime))

    return sessionList
  } catch (error) {
    console.error('获取session列表失败:', error)
    return []
  }
}

/**
 * 清空指定类型的所有session
 * @param {string} type - 'text' 或 'image'
 */
export function clearAllSessions(type) {
  try {
    const storageKey = storageKeyOfSessions(type)
    localStorage.removeItem(storageKey)
    console.log(`已清空${type === 'text' ? '文字聊天' : '图片生成'}所有session`)
  } catch (error) {
    console.error('清空session失败:', error)
  }
}

/**
 * 删除指定session
 * @param {string} type - 'text' 或 'image'  
 * @param {string} sessionId - session ID
 */
export function deleteSession(type, sessionId) {
  try {
    const storageKey = storageKeyOfSessions(type)
    const allSessions = JSON.parse(localStorage.getItem(storageKey) || '{}')

    if (allSessions[sessionId]) {
      const sessionName = allSessions[sessionId].name
      delete allSessions[sessionId]
      localStorage.setItem(storageKey, JSON.stringify(allSessions))
      console.log(`已删除session: ${sessionName}`)
      return true
    }
    return false
  } catch (error) {
    console.error('删除session失败:', error)
    return false
  }
}


/**
 * 创建空的session（用于页面首次加载）
 * @param {string} type - 'text' 或 'image'
 * @param {string} sessionName - session名称，默认为"新对话"
 * @returns {string} 新创建的session ID
 */
export function createNewSession(type, sessionName = '新对话') {
  try {
    const storageKey = storageKeyOfSessions(type)
    const sessionId = generateSessionId()
    const currentTime = new Date().toISOString()

    // 获取现有sessions
    const existingSessions = JSON.parse(localStorage.getItem(storageKey) || '{}')

    // 创建新的空session
    const newSession = {
      id: sessionId,
      name: sessionName,
      createdAt: currentTime,
      lastUpdated: currentTime,
      messages: []
    }

    // 保存新session
    existingSessions[sessionId] = newSession
    localStorage.setItem(storageKey, JSON.stringify(existingSessions))

    console.log(`已创建新的空${type === PAGE_TYPE.textChat ? '文字聊天' : '图片生成'}session:`, sessionName)
    return sessionId
  } catch (error) {
    console.error('创建空session失败:', error)
    return null
  }
}

function storageKeyOfSessions(type) {
  return type === PAGE_TYPE.textChat ? STORAGE_KEYS.TEXT_CHAT : STORAGE_KEYS.IMAGE_GEN;
}

export function hasExistingSession(type, sessionId) {
  try {
    if (sessionId) {
      const storageKey = storageKeyOfSessions(type)
      const allSessions = JSON.parse(localStorage.getItem(storageKey) || '{}')
      return allSessions && allSessions[sessionId]
    }


  } catch (error) {
    console.error('检查现有session失败:', error)
  }
  return false
}


/**
 * 保存单条消息到指定session
 * @param {string} sessionId - session ID
 * @param {object} message - 消息对象
 */
export function saveSessionMessage(type, sessionId, message) {
  try {
    // 先尝试从text类型中查找session
    const storageKey = storageKeyOfSessions(type)
    const allSessions = JSON.parse(localStorage.getItem(storageKey) || '{}')
    const currentTime = new Date().toISOString()

    if (!allSessions[sessionId]) {
      allSessions[sessionId] = {
        id: sessionId,
        name: message.text,
        createdAt: currentTime,
        lastUpdated: currentTime,
        messages: []
      }
    }
    // 添加消息到session
    if (!allSessions[sessionId].messages) {
      allSessions[sessionId].messages = []
    }
    const messages = allSessions[sessionId].messages
    //根据message.id 找到该条消息，如果存在，则更新该条消息
    const messageIndex = messages.findIndex(msg => msg.id === message.id)
    if (messageIndex !== -1) {
      messages[messageIndex] = message
    } else {
      allSessions[sessionId].messages.push(message)
      allSessions[sessionId].lastUpdated = currentTime
    }

    // 如果session名称还是"新对话"，根据第一条用户消息更新名称
    if (allSessions[sessionId].name === '新对话' && message.sender === 'user' && message.text) {
      allSessions[sessionId].name = generateSessionName([message])
    }

    localStorage.setItem(storageKey, JSON.stringify(allSessions))
    console.log('已保存消息到session:', sessionId)

  } catch (error) {
    console.error('保存消息到session失败:', error)
  }
}

export default {
  getSessionList,
  clearAllSessions,
  deleteSession,
  // createAndSaveEmptySession,
  hasExistingSession,
  generateNewSessionId,
  saveSessionMessage,
  loadSessionMessages,
}