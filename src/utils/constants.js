export const  PAGE_TYPE = {
  textChat: 'chat',
  text2audio: 'text2audio',
  audio2text: 'audio2text',
  imageGen: 'imagegen'
}

export const MESSAGE_TYPES = {
  USER: 'user',
  AI: 'ai'
}

export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络错误，请检查网络连接',
  TIMEOUT_ERROR: '请求超时，请稍后再试',
  API_KEY_ERROR: 'API密钥无效，请检查配置',
  RATE_LIMIT_ERROR: 'API请求频率过高，请稍后再试',
  SERVER_ERROR: 'OpenAI服务器错误，请稍后再试',
  UNKNOWN_ERROR: '未知错误，请稍后再试'
}