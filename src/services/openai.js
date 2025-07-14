import axios from 'axios'

const OPENAI_API_URL = process.env.VUE_APP_OPENAI_API_URL
const OPENAI_API_KEY = process.env.VUE_APP_OPENAI_API_KEY

const openaiClient = axios.create({
  baseURL: OPENAI_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  },
  timeout: 30000
})



/**
 * 流式发送聊天消息到OpenAI，支持上下文和实时输出
 * @param {array} messages - 消息历史数组
 * @param {function} onChunk - 处理每个数据块的回调函数
 * @param {function} onComplete - 流结束时的回调函数
 * @param {function} onError - 错误处理回调函数
 */
export async function sendChatMessageStream(messages, onChunk, onComplete, onError) {
  try {
    // 使用fetch API处理流式响应，因为浏览器环境中axios不支持流
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        })),
        max_tokens: 1000,
        temperature: 0.7,
        stream: true
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      let errorMessage = '网络错误，请检查网络连接'
      
      if (response.status === 401) {
        errorMessage = 'API密钥无效，请检查配置'
      } else if (response.status === 429) {
        errorMessage = 'API请求频率过高，请稍后再试'
      } else if (response.status === 500) {
        errorMessage = 'OpenAI服务器错误，请稍后再试'
      } else {
        errorMessage = `API错误: ${errorData.error?.message || '未知错误'}`
      }
      
      onError && onError(new Error(errorMessage))
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          onComplete && onComplete(fullContent)
          break
        }

        // 解码数据块
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        // 保留最后一行（可能不完整）
        buffer = lines.pop() || ''
        
        // 处理完整的行
        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue
          
          if (trimmedLine === 'data: [DONE]') {
            onComplete && onComplete(fullContent)
            return
          }
          
          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6) // 移除 "data: " 前缀
              const data = JSON.parse(jsonStr)
              
              if (data.choices && data.choices[0] && data.choices[0].delta) {
                const deltaContent = data.choices[0].delta.content
                if (deltaContent) {
                  fullContent += deltaContent
                  onChunk && onChunk(deltaContent, fullContent)
                }
              }
            } catch (parseError) {
              console.warn('解析流数据时出错:', parseError, '原始数据:', trimmedLine)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

  } catch (error) {
    console.error('OpenAI API Error:', error)
    
    let errorMessage = '网络错误，请检查网络连接'
    
    if (error.name === 'AbortError') {
      errorMessage = '请求被取消'
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = '网络连接失败，请检查网络'
    }
    
    onError && onError(new Error(errorMessage))
  }
}

export async function sendChatMessage(messages) {
  try {
    const response = await openaiClient.post('/chat/completions', {
      model: 'gpt-4o',
      messages: messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      max_tokens: 1000,
      temperature: 0.7,
      n: 1,
    })
    return response.data.choices[0].message.content
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw error
  }
}

export async function textToSpeech(text) {
  try {
    const response = await openaiClient.post('/audio/speech', {
      model: 'tts-1',
      input: text,
      voice: 'alloy',
      response_format: 'mp3'
    }, {
      responseType: 'blob'
    })

    return response.data
  } catch (error) {
    console.error('OpenAI TTS Error:', error)
    throw error
  }
}

// 语音转文字
export async function transcribeAudio(audioBlob) {
  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.webm')
  formData.append('model', 'whisper-1')
  const response = await openaiClient.post('/audio/transcriptions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data.text
}

// 语音翻译
export async function translateAudio(audioBlob) {
  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.webm')
  formData.append('model', 'whisper-1')
  const response = await openaiClient.post('/audio/translations', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data.text
}

// 生成图片
export async function generateImage(prompt) {
  const response = await openaiClient.post('/images/generations', {
    prompt,
    n: 1,
    size: '1024x1024',
    model: 'dall-e-3'
  })
  return response.data.data[0].url
}