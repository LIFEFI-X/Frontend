import { createI18n } from 'vue-i18n'

// Import language pack
import zh from './locales/zh-CN.json'
import en from './locales/en-US.json'

const messages = {
  'zh-CN': zh,
  'en-US': en
}

// Get browser language
const getLocale = () => {
  const stored = localStorage.getItem('locale')
  if (stored) return stored
  
  const browser = navigator.language
  // if (browser.startsWith('zh')) return 'zh-CN'
  return 'en-US'
}

const i18n = createI18n({
  legacy: false,
  locale: getLocale(),
  fallbackLocale: 'en-US',
  messages,
  globalInjection: true
})

export default i18n 