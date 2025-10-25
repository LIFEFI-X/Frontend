<template>
  <div class="ai-chatbot-wrapper">
    <!-- floating trigger button -->
    <div 
      v-if="!isOpen" 
      class="chat-trigger-btn" 
      @click="openChat"
      :class="{ 'has-notification': hasNewMessage }"
    >
      <div class="trigger-icon">
        <MessageOutlined />
      </div>
      <div v-if="hasNewMessage" class="notification-dot"></div>
    </div>

    <!-- dialog window -->
    <div 
      v-if="isOpen" 
      class="ai-chatbot" 
      :class="{ 'fullscreen': isFullscreen }"
    >
      <!-- head -->
      <div class="chat-header">
        <div class="header-left">
          <div class="ai-avatar">
            <img src="/src/assets/images/ly.png" alt="AI Assistant" />
          </div>
          <div class="ai-info">
            <h3 class="ai-name">{{ t('aiChat.assistant') }}</h3>
            <span class="ai-status" :class="{ 'online': isAiOnline }">
              {{ isAiOnline ? t('aiChat.online') : t('aiChat.offline') }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button 
            class="action-btn" 
            @click="toggleFullscreen"
            :title="isFullscreen ? t('aiChat.exitFullscreen') : t('aiChat.fullscreen')"
          >
            <FullscreenOutlined v-if="!isFullscreen" />
            <FullscreenExitOutlined v-else />
          </button>
          <button class="action-btn" @click="closeChat" :title="t('aiChat.close')">
            <CloseOutlined />
          </button>
        </div>
      </div>

      <!-- Message list -->
      <div class="chat-messages" ref="messagesContainer" @scroll="handleUserScroll">
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="message-wrapper"
          :class="{ 'user': message.sender === 'user', 'ai': message.sender === 'ai' }"
        >
          <div class="message-content">
            <!-- User messages -->
            <div v-if="message.sender === 'user'" class="user-message">
              <div class="message-bubble">
                <div v-if="message.type === 'text'" class="text-content">
                  {{ message.content }}
                </div>
                <div v-else-if="message.type === 'image'" class="image-content">
                  <img :src="message.content" :alt="t('aiChat.userImage')" />
                </div>
                <div v-else-if="message.type === 'file'" class="file-content">
                  <FileOutlined />
                  <span>{{ message.fileName }}</span>
                </div>
              </div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>

            <!-- AI news -->
            <div v-else class="ai-message">
              <div class="ai-avatar-small">
                <img src="/src/assets/images/ly.png" :alt="t('aiChat.assistant')" />
              </div>
              <div class="ai-content">
                <div class="message-bubble">
                  <!-- Loading status -->
                  <div v-if="message.loading" class="loading-content">
                    <div class="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <div class="loading-text">{{ t('aiChat.thinking') }}</div>
                  </div>
                  
                  <!-- text content -->
                  <div v-else-if="message.type === 'text'" class="text-content">
                    <span ref="typewriterText" :data-message-id="message.id">
                      {{ message.displayContent || message.content || '' }}
                    </span>
                    <!-- Stop sign - now only shows when there is no content at all -->
                    <div v-if="message.isStopped && !message.displayContent && !message.content" class="stopped-indicator">
                      <span class="stopped-text">{{ t('aiChat.replyStopped') || 'Reply has stopped' }}</span>
                    </div>
                  </div>
                  
                  <!-- Graphic content -->
                  <div v-else-if="message.type === 'rich'" class="rich-content">
                    <div v-if="message.image" class="content-image">
                      <img :src="message.image" :alt="t('aiChat.aiImage')" />
                    </div>
                    <div class="content-text">
                      <span ref="typewriterText" :data-message-id="message.id">
                        {{ message.displayContent || message.content || '' }}
                      </span>
                      <!-- Stop sign - now only shows when there is no content at all -->
                      <div v-if="message.isStopped && !message.displayContent && !message.content" class="stopped-indicator">
                        <span class="stopped-text">{{ t('aiChat.replyStopped') || 'Reply has stopped' }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- error status -->
                  <div v-else-if="message.type === 'error'" class="error-content">
                    <ExclamationCircleOutlined />
                    <span>{{ message.content }}</span>
                  </div>
                </div>
                
                <!-- Message operations -->
                <div v-if="!message.loading" class="message-actions">
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                  <div class="action-buttons">
                    <button 
                      v-if="message.isTyping" 
                      class="stop-btn" 
                      @click="stopTyping(message.id)"
                      :title="t('aiChat.stop')"
                    >
                      <PauseOutlined />
                    </button>
                    <button class="copy-btn" @click="copyMessage(message.content)" :title="t('aiChat.copy')">
                      <CopyOutlined />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- new message button -->
      <div 
        v-if="!isAtBottom() && hasUnreadMessages" 
        class="new-message-indicator"
        @click="scrollToBottomWithAnimation"
      >
        <button class="new-message-btn">
          <DownOutlined />
          <span>{{ t('aiChat.newMessage') || 'New message' }}</span>
        </button>
      </div>

      <!-- input area -->
      <div class="chat-input">
        <div class="input-tools">
          <button class="tool-btn" @click="triggerImageUpload" :title="t('aiChat.uploadImage')">
            <PictureOutlined />
          </button>
          <button class="tool-btn" @click="triggerFileUpload" :title="t('aiChat.uploadFile')">
            <PaperClipOutlined />
          </button>
          <input 
            ref="imageInput" 
            type="file" 
            accept="image/*" 
            style="display: none" 
            @change="handleImageUpload"
          />
          <input 
            ref="fileInput" 
            type="file" 
            style="display: none" 
            @change="handleFileUpload"
          />
        </div>
        
        <div class="input-area">
          <a-textarea
            v-model:value="inputMessage"
            :placeholder="isAiTyping ? t('aiChat.replying') : t('aiChat.inputPlaceholder')"
            :disabled="isAiTyping"
            :auto-size="{ minRows: 1, maxRows: 4 }"
            @keydown="handleKeydown"
            class="message-input"
          />
          <button 
            class="send-btn" 
            @click="sendMessage"
            :disabled="!inputMessage.trim() || isAiTyping"
          >
            <SendOutlined />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, onUnmounted } from 'vue'
import { animate } from 'animejs'
import { useI18n } from 'vue-i18n'
import {
  MessageOutlined,
  CloseOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SendOutlined,
  PictureOutlined,
  PaperClipOutlined,
  FileOutlined,
  CopyOutlined,
  PauseOutlined,
  ExclamationCircleOutlined,
  DownOutlined
} from '@ant-design/icons-vue'

// Message type definition
interface Message {
  id: string
  sender: 'user' | 'ai'
  type: 'text' | 'image' | 'file' | 'rich' | 'error'
  content: string
  displayContent?: string
  fileName?: string
  image?: string
  timestamp: number
  loading?: boolean
  isTyping?: boolean
  isStopped?: boolean
}

// Responsive data
const isOpen = ref(false)
const isFullscreen = ref(false)
const isAiOnline = ref(true)
const hasNewMessage = ref(false)
const inputMessage = ref('')
const isAiTyping = ref(false)
const messages = reactive<Message[]>([])
const messagesContainer = ref<HTMLElement>()
const imageInput = ref<HTMLInputElement>()
const fileInput = ref<HTMLInputElement>()

// Use i18n
const { t } = useI18n()

// Typewriter effect related
const typewriterIntervals = new Map<string, NodeJS.Timeout>()
const abortControllers = new Map<string, AbortController>()

// Scroll related status
const isUserScrolling = ref(false)
const scrollTimeout = ref<NodeJS.Timeout>()
const hasUnreadMessages = ref(false)

// Open chat
const openChat = () => {
  isOpen.value = true
  hasNewMessage.value = false
  
  // If it is opened for the first time, a welcome message is displayed.
  if (messages.length === 0) {
    addWelcomeMessage()
  }
  
  nextTick(() => {
    scrollToBottom()
  })
}

// Close chat
const closeChat = () => {
  isOpen.value = false
  isFullscreen.value = false
}

// Toggle full screen
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  nextTick(() => {
    scrollToBottom()
  })
}

// Add welcome message
const addWelcomeMessage = () => {
  const welcomeContent = t('aiChat.welcome')
  const welcomeMessage: Message = {
    id: generateId(),
    sender: 'ai',
    type: 'rich',
    content: welcomeContent,
    displayContent: '', // Initialized to empty, waiting for the typewriter effect
    image: '/src/assets/images/ly.png',
    timestamp: Date.now(),
    loading: false
  }
  
  messages.push(welcomeMessage)
  
  // Start the typewriter effect immediately without delay
  startTypewriter(welcomeMessage)
}

// Send message
const sendMessage = () => {
  if (!inputMessage.value.trim()) return
  
  // Stop all typewriter effects in progress
  stopAllTyping()
  
  // Add user message
  const userMessage: Message = {
    id: generateId(),
    sender: 'user',
    type: 'text',
    content: inputMessage.value.trim(),
    timestamp: Date.now()
  }
  
  messages.push(userMessage)
  
  // Clear input
  const messageToSend = inputMessage.value.trim()
  inputMessage.value = ''
  
  // scroll to bottom
  nextTick(() => {
    scrollToBottom()
  })
  
  // Simulate AI reply
  setTimeout(() => {
    simulateAiResponse(messageToSend)
  }, 500)
}

// Simulate AI reply
const simulateAiResponse = async (userMessage: string) => {
  isAiTyping.value = true
  
  // Added AI message for loading status
  const aiMessage: Message = {
    id: generateId(),
    sender: 'ai',
    type: 'text',
    content: '',
    displayContent: '', // Initialized to an empty string
    timestamp: Date.now(),
    loading: true
  }
  
  messages.push(aiMessage)
  
  nextTick(() => {
    scrollToBottom()
  })
  
  // Create a cancellation controller
  const controller = new AbortController()
  abortControllers.set(aiMessage.id, controller)
  
  try {
    // Simulate API latency
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, 1500 + Math.random() * 2000)
      controller.signal.addEventListener('abort', () => {
        clearTimeout(timeout)
        reject(new Error('Request aborted'))
        // Mark message as stopped
        aiMessage.loading = false
        aiMessage.isStopped = true
        aiMessage.content = t('aiChat.stopped') || 'Conversation has stopped'
        aiMessage.displayContent = t('aiChat.stopped') || 'Conversation has stopped'
      })
    })
    
    // Check if canceled
    if (controller.signal.aborted) {
      return
    }
    
    // Remove loading status
    aiMessage.loading = false
    
    // Generate longer AI reply content
    const longResponses = [
      t('aiChat.responses.detailed'),
      t('aiChat.responses.analysis', { userMessage }),
      t('aiChat.responses.suggestions'),
      t('aiChat.responses.creative'),
      t('aiChat.responses.solution'),
      t('aiChat.responses.detailed')
    ]
    
    const randomResponse = longResponses[Math.floor(Math.random() * longResponses.length)]
    aiMessage.content = randomResponse
    
    // Start the typewriter effect directly without using nextTick
    startTypewriter(aiMessage)
    
  } catch (error) {
    if (error.message !== 'Request aborted') {
      // Show error message
      aiMessage.loading = false
      aiMessage.type = 'error'
      aiMessage.content = t('aiChat.requestError')
      aiMessage.displayContent = t('aiChat.requestError')
    }
  } finally {
    isAiTyping.value = false
    abortControllers.delete(aiMessage.id)
  }
}

// Scroll to bottom (using anime.js v4 optimized version)
const scrollToBottom = () => {
  if (!messagesContainer.value) return
  
  const container = messagesContainer.value
  const targetScroll = container.scrollHeight - container.clientHeight
  
  // If it is already near the bottom, set the scroll position directly
  if (Math.abs(container.scrollTop - targetScroll) < 10) {
    container.scrollTop = targetScroll
    return
  }
  
  // Optimized scroll animation using anime.js v4
  animate(container, {
    scrollTop: targetScroll,
    duration: 400, // Increase animation duration to make it smoother
    ease: 'outQuart', // Use the easing function recommended by animejs v4
    autoplay: true // Make sure it plays automatically
  })
}

// Smoothly scroll to the specified position (new feature)
const scrollToPosition = (scrollTop: number, smooth = true) => {
  if (!messagesContainer.value) return
  
  const container = messagesContainer.value
  
  if (!smooth) {
    container.scrollTop = scrollTop
    return
  }
  
  animate(container, {
    scrollTop: scrollTop,
    duration: 300,
    ease: 'outCubic',
    autoplay: true
  })
}

// Check if it is at the bottom (new tool function)
const isAtBottom = () => {
  if (!messagesContainer.value) return false
  
  const container = messagesContainer.value
  const threshold = 50
  return container.scrollTop + container.clientHeight >= container.scrollHeight - threshold
}

// Monitor user manual scrolling (based on animejs v4 concept)
const handleUserScroll = () => {
  isUserScrolling.value = true
  
  // If you scroll to the bottom, clear the unread message mark
  if (isAtBottom()) {
    hasUnreadMessages.value = false
  }
  
  // Clear previous timeout
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }
  
  // The state is reset after 1 second and the user scroll is considered to have ended.
  scrollTimeout.value = setTimeout(() => {
    isUserScrolling.value = false
  }, 1000)
}

// Smart scrolling to bottom (considers user behavior)
const smartScrollToBottom = () => {
  // If the user is scrolling manually, don't auto-scroll
  if (isUserScrolling.value) {
    return
  }
  
  // Don't force scrolling if the user isn't at the bottom
  if (!isAtBottom() && !isUserScrolling.value) {
    return
  }
  
  scrollToBottom()
}

// Optimized startup typewriter effect (using smart scrolling)
const startTypewriter = (message: Message) => {
  if (!message.content) {
    return
  }
  
  // Record whether it is at the bottom when starting typing
  const wasAtBottom = isAtBottom()
  
  // Display the first character immediately, avoiding whitespace
  message.displayContent = ''
  message.isTyping = true
  
  const chars = message.content.split('')
  let currentIndex = 0
  
  const typeInterval = setInterval(() => {
    if (currentIndex < chars.length) {
      message.displayContent += chars[currentIndex]
      currentIndex++
      
      // Automatically scroll only when user is at bottom and not scrolling manually
      if (wasAtBottom && !isUserScrolling.value && (currentIndex % 10 === 0 || currentIndex === chars.length)) {
        scrollToBottom()
      }
    } else {
      // Typing completed
      clearInterval(typeInterval)
      message.isTyping = false
      typewriterIntervals.delete(message.id)
      
      // Use smart scrolling when you're done typing
      if (wasAtBottom) {
        smartScrollToBottom()
      }
    }
  }, 20 + Math.random() * 20) // Optimized typing speed to be more consistent
  
  typewriterIntervals.set(message.id, typeInterval)
}

// Stop typewriter effect for specific messages
const stopTyping = (messageId: string) => {
  const interval = typewriterIntervals.get(messageId)
  if (interval) {
    clearInterval(interval)
    typewriterIntervals.delete(messageId)
    
    const message = messages.find(m => m.id === messageId)
    if (message) {
      // If part of the content is already displayed, retain the displayed content
      if (message.displayContent && message.displayContent.length > 0) {
        message.displayContent = message.displayContent + ' [' + (t('aiChat.stopped') || 'Stopped') + ']'
      } else {
        // If nothing is displayed, show a stop prompt
        message.displayContent = t('aiChat.replyStopped') || 'Reply has stopped'
      }
      message.isTyping = false
      message.isStopped = true
    }
  }
  
  // If there is an ongoing request, cancel it as well
  const controller = abortControllers.get(messageId)
  if (controller) {
    controller.abort()
  }
}

// Stop all typewriter effects
const stopAllTyping = () => {
  // Stop all typewriter effects
  typewriterIntervals.forEach((interval) => {
    clearInterval(interval)
  })
  typewriterIntervals.clear()
  
  // Cancel all ongoing requests
  abortControllers.forEach((controller) => {
    controller.abort()
  })
  abortControllers.clear()
  
  // Update message status
  messages.forEach(message => {
    if (message.isTyping) {
      message.displayContent = message.content
      message.isTyping = false
    }
    if (message.loading) {
      const index = messages.findIndex(m => m.id === message.id)
      if (index > -1) {
        messages.splice(index, 1)
      }
    }
  })
  
  isAiTyping.value = false
}

// Utility function
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Copy message
const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    // You can add a success tip here
    console.log(t('aiChat.messageCopied'))
  } catch (error) {
    console.error(t('aiChat.copyFailed'), error)
  }
}

// File upload
const triggerImageUpload = () => {
  imageInput.value?.click()
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageMessage: Message = {
        id: generateId(),
        sender: 'user',
        type: 'image',
        content: e.target?.result as string,
        timestamp: Date.now()
      }
      messages.push(imageMessage)
      nextTick(() => scrollToBottom())
    }
    reader.readAsDataURL(file)
  }
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const fileMessage: Message = {
      id: generateId(),
      sender: 'user',
      type: 'file',
      content: file.name,
      fileName: file.name,
      timestamp: Date.now()
    }
    messages.push(fileMessage)
    nextTick(() => scrollToBottom())
  }
}

// Keyboard events
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// life cycle
onMounted(() => {
  // Simulate receiving new messages
  setTimeout(() => {
    if (!isOpen.value) {
      hasNewMessage.value = true
    }
  }, 3000)
  
  // Add scroll event listener
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener('scroll', handleUserScroll)
  }
})

onUnmounted(() => {
  stopAllTyping()
  
  // Clean up scroll timeout
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }
  
  // Remove scroll event listener
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', handleUserScroll)
  }
})

// Animated scroll to bottom
const scrollToBottomWithAnimation = () => {
  hasUnreadMessages.value = false
  scrollToBottom()
}
</script>

<style scoped lang="scss">
.ai-chatbot-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

// trigger button
.chat-trigger-btn {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--theme-primary, #667eea) 0%, var(--theme-secondary, #764ba2) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 25px var(--theme-shadow, rgba(0, 0, 0, 0.15));
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
  }
  
  .trigger-icon {
    color: white;
    font-size: 24px;
    transition: transform 0.3s ease;
  }
  
  &.has-notification .trigger-icon {
    animation: bounce 1s infinite;
  }
  
  .notification-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 12px;
    height: 12px;
    background: var(--theme-error, #ff4757);
    border-radius: 50%;
    border: 2px solid var(--theme-text-inverse, white);
    animation: pulse 2s infinite;
  }
}

// dialog window
.ai-chatbot {
  width: 380px;
  height: 600px;
  background: var(--theme-card-background, #ffffff);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--theme-border, #e0e0e0);
  transition: all 0.3s ease;
  
  &.fullscreen {
    position: fixed;
    top: 20px;
    left: 20px;
    right: 20px;
    bottom: 20px;
    width: auto;
    height: auto;
    border-radius: 12px;
    z-index: 1001;
  }
}

// head
.chat-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--theme-primary, #667eea) 0%, var(--theme-secondary, #764ba2) 100%);
  color: var(--theme-text-inverse, white);
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .ai-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, 0.2);
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .ai-info {
    .ai-name {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .ai-status {
      font-size: 12px;
      opacity: 0.8;
      
      &.online {
        color: #2ed573;
        
        &::before {
          content: '●';
          margin-right: 4px;
        }
      }
    }
  }
  
  .header-actions {
    display: flex;
    gap: 8px;
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

// Message list
.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  scroll-behavior: smooth;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }
}

.message-wrapper {
  margin-bottom: 20px;
  
  &.user {
    display: flex;
    justify-content: flex-end;
  }
  
  &.ai {
    display: flex;
    justify-content: flex-start;
  }
}

// User messages
.user-message {
  
  .message-bubble {
    background: linear-gradient(135deg, var(--theme-primary, #667eea) 0%, var(--theme-secondary, #764ba2) 100%);
    color: var(--theme-text-inverse, white);
    padding: 12px 16px;
    border-radius: 18px 18px 4px 18px;
    box-shadow: 0 2px 8px var(--theme-shadow, rgba(0, 0, 0, 0.1));
    word-break: break-word;
    
    .text-content {
      line-height: 1.4;
      word-wrap: break-word;
      white-space: pre-wrap;
      word-break: break-word;
    }
    
    .image-content img {
      max-width: 100%;
      border-radius: 8px;
    }
    
    .file-content {
      display: flex;
      align-items: center;
      gap: 8px;
      
      span {
        font-size: 14px;
      }
    }
  }
  
  .message-time {
    text-align: right;
    font-size: 11px;
    color: var(--theme-text-muted, #999);
    margin-top: 4px;
  }
}

// AI news
.ai-message {
  max-width: 85%;
  display: flex;
  gap: 8px;
  
  .ai-avatar-small {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    margin-top: 4px;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .ai-content {
    flex: 1;
  }
  
  .message-bubble {
    background: var(--theme-surface, #f8f9fa);
    color: var(--theme-text-primary, #333);
    padding: 12px 16px;
    border-radius: 18px 18px 18px 4px;
    border: 1px solid var(--theme-border, #e0e0e0);
    
    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      
      .loading-text {
        color: var(--theme-text-tertiary, #999);
        font-size: 13px;
      }
    }
    
    .stopped-indicator {
      margin-top: 8px;
      
      .stopped-text {
        color: var(--theme-text-tertiary, #999);
        font-size: 12px;
        font-style: italic;
        opacity: 0.7;
      }
    }
    
    .text-content {
      line-height: 1.4;
      white-space: pre-wrap;
      word-wrap: break-word;
      color: var(--theme-text-secondary, #666);
      font-size: 14px;
    }
    
    .rich-content {
      .content-image {
        margin-bottom: 8px;
        
        img {
          max-width: 60px;
          border-radius: 8px;
        }
      }
      
      .content-text {
        line-height: 1.4;
        white-space: pre-wrap;
        color: var(--theme-text-secondary, #666);
        font-size: 14px;
      }
    }
    
    .error-content {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--theme-error, #ff4757);
    }
  }
  
  .message-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
    
    .message-time {
      font-size: 11px;
      color: var(--theme-text-muted, #999);
    }
    
    .action-buttons {
      display: flex;
      gap: 4px;
    }
    
    .stop-btn, .copy-btn {
      background: none;
      border: none;
      color: var(--theme-text-muted, #999);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: color 0.2s ease;
      font-size: 12px;
      
      &:hover {
        color: var(--theme-primary, #667eea);
      }
    }
  }
}

// typing indicator
.typing-indicator {
  display: inline-flex;
  gap: 2px;
  
  span {
    width: 6px;
    height: 6px;
    background: var(--theme-text-muted, #999);
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
    
    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

// input area
.chat-input {
  padding: 16px 20px;
  border-top: 1px solid var(--theme-divider, #e0e0e0);
  background: var(--theme-card-background, #ffffff);
  
  .input-tools {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .tool-btn {
    width: 36px;
    height: 36px;
    border: 1px solid var(--theme-border, #e0e0e0);
    background: var(--theme-surface, #f8f9fa);
    color: var(--theme-text-secondary, #666);
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    &:hover {
      color: var(--theme-primary, #667eea);
      border-color: var(--theme-primary, #667eea);
    }
  }
  
  .input-area {
    display: flex;
    gap: 12px;
    align-items: flex-end;
  }
  
  .message-input {
    flex: 1;
    border: 1px solid var(--theme-border, #e0e0e0);
    border-radius: 12px;
    
    &:focus {
      border-color: var(--theme-primary, #667eea);
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }
  }
  
  .send-btn {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--theme-primary, #667eea) 0%, var(--theme-secondary, #764ba2) 100%);
    border: none;
    color: var(--theme-text-inverse, white);
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px var(--theme-primary, rgba(102, 126, 234, 0.3));
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// animation
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes typing {
  0%, 100% { 
    opacity: 0.3; 
    transform: scale(0.8); 
  }
  50% { 
    opacity: 1; 
    transform: scale(1); 
  }
}

// Responsive design
@media (max-width: 768px) {
  .ai-chatbot {
    width: calc(100vw - 32px);
    height: calc(100vh - 100px);
    
    &.fullscreen {
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
    }
  }
  
  .chat-trigger-btn {
    width: 56px;
    height: 56px;
    bottom: 20px;
    right: 20px;
    
    .trigger-icon {
      font-size: 22px;
    }
  }
  
  .chat-messages {
    padding: 16px;
  }
  
  .chat-input {
    padding: 12px 16px;
  }
  
  .user-message {
  }
  
  .ai-message {
    max-width: 95%;
  }
}

@media (max-width: 480px) {
  .ai-chatbot {
    width: calc(100vw - 20px);
    height: calc(100vh - 80px);
    
    &.fullscreen {
      top: 5px;
      left: 5px;
      right: 5px;
      bottom: 5px;
    }
  }
  
  .chat-header {
    padding: 12px 16px;
    
    .ai-avatar {
      width: 36px;
      height: 36px;
    }
    
    .ai-info .ai-name {
      font-size: 14px;
    }
  }
  
  .chat-messages {
    padding: 12px;
  }
  
  .message-wrapper {
    margin-bottom: 16px;
  }
  
  .user-message {
    
    .message-bubble {
      padding: 10px 14px;
      font-size: 14px;
    }
  }
  
  .ai-message {
    max-width: 95%;
    
    .message-bubble {
      padding: 10px 14px;
      font-size: 14px;
    }
  }
}

// New message alert
.new-message-indicator {
  position: absolute;
  bottom: 80px;
  right: 20px;
  z-index: 10;
  
  .new-message-btn {
    background: var(--theme-primary, #667eea);
    color: var(--theme-text-inverse, white);
    border: none;
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
    animation: bounce 2s infinite;
    
    &:hover {
      background: var(--theme-primary-hover, #5a6fd8);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    
    .anticon {
      font-size: 12px;
    }
  }
}
</style> 