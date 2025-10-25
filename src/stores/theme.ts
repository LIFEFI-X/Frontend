import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeMode = 'light' | 'dark'

export interface ThemeColors {
  // base color
  primary: string
  primaryHover: string
  secondary: string
  accent: string
  
  // background color
  background: string
  surface: string
  cardBackground: string
  headerBackground: string
  sidebarBackground: string
  
  // text color
  textPrimary: string
  textSecondary: string
  textMuted: string
  textInverse: string
  
  // Borders and dividing lines
  border: string
  divider: string
  
  // status color
  success: string
  warning: string
  error: string
  info: string
  
  // special effects
  overlay: string
  shadow: string
  hover: string
  active: string
}

// Light theme color matching
const lightTheme: ThemeColors = {
  primary: '#1890ff',
  primaryHover: '#40a9ff',
  secondary: '#722ed1',
  accent: '#52c41a',
  
  background: '#f5f5f5',
  surface: '#ffffff',
  cardBackground: '#ffffff',
  headerBackground: '#ffffff',
  sidebarBackground: '#ffffff',
  
  textPrimary: '#333333',
  textSecondary: '#666666',
  textMuted: '#999999',
  textInverse: '#ffffff',
  
  border: '#e8e8e8',
  divider: '#f0f0f0',
  
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#333333',
  
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  hover: 'rgba(0, 0, 0, 0.04)',
  active: 'rgba(0, 0, 0, 0.08)'
}

// Dark theme color
const darkTheme: ThemeColors = {
  primary: '#1890ff',
  primaryHover: '#40a9ff',
  secondary: '#9775fa',
  accent: '#69db7c',
  
  background: '#0f0f0f',
  surface: '#1a1a1a',
  cardBackground: '#2a2a2a',
  headerBackground: '#1f1f1f',
  sidebarBackground: '#1a1a1a',
  
  textPrimary: '#ffffff',
  textSecondary: '#b3b3b3',
  textMuted: '#808080',
  textInverse: '#000000',
  
  border: '#404040',
  divider: '#333333',
  
  success: '#69db7c',
  warning: '#ffd43b',
  error: '#ff6b6b',
  info: '#ffffff',
  
  overlay: 'rgba(0, 0, 0, 0.8)',
  shadow: 'rgba(0, 0, 0, 0.5)',
  hover: 'rgba(255, 255, 255, 0.1)',
  active: 'rgba(255, 255, 255, 0.15)'
}

export const useThemeStore = defineStore('theme', () => {
  // state
  const mode = ref<ThemeMode>('dark') // Set to dark theme by default
  
  // Computed properties
  const isDark = computed(() => mode.value === 'dark')
  const isLight = computed(() => mode.value === 'light')
  
  const currentTheme = computed(() => {
    return mode.value === 'dark' ? darkTheme : lightTheme
  })
  
  // Generate CSS variable string
  const cssVariables = computed(() => {
    const theme = currentTheme.value
    const variables: Record<string, string> = {}
    
    Object.entries(theme).forEach(([key, value]) => {
      // Convert camelCase naming to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      variables[`--theme-${cssKey}`] = value
    })
    
    return variables
  })
  
  // method
  const setTheme = (newMode: ThemeMode) => {
    mode.value = newMode
    applyTheme()
    saveThemeToStorage()
  }
  
  const toggleTheme = () => {
    setTheme(mode.value === 'light' ? 'dark' : 'light')
  }
  
  const applyTheme = () => {
    const root = document.documentElement
    const variables = cssVariables.value
    
    // Apply new CSS variables
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    
    // Set the body's class name to facilitate style selectors
    document.body.className = document.body.className.replace(/theme-\w+/g, '')
    document.body.classList.add(`theme-${mode.value}`)
  }
  
  const saveThemeToStorage = () => {
    localStorage.setItem('app-theme', mode.value)
  }
  
  const loadThemeFromStorage = () => {
    const savedTheme = localStorage.getItem('app-theme') as ThemeMode
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      mode.value = savedTheme
    }
    applyTheme()
  }
  
  const initTheme = () => {
    loadThemeFromStorage()
  }
  
  return {
    // state
    mode,
    
    // Computed properties
    isDark,
    isLight,
    currentTheme,
    cssVariables,
    
    // method
    setTheme,
    toggleTheme,
    applyTheme,
    initTheme
  }
}) 