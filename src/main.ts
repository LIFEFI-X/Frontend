import './assets/scss/main.scss'
import './assets/styles/themes.scss'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { MobileUtils } from './utils/mobile'
import { useThemeStore } from './stores/theme'
import { useUserStore } from './stores/user'
import './utils/testWorkflow' // Import testing tools (development environment)
import 'virtual:svg-icons-register'
import { config } from './utils/wagmi'
import { walletSolanaOptions, SolanaWallets } from './utils/solana'
import { WagmiPlugin } from '@wagmi/vue'
// Import Ant Design Vue components
import { 
  Modal, 
  Tabs, 
  Button, 
  Input, 
  Form, 
  Spin, 
  Menu, 
  Dropdown, 
  Badge, 
  Select, 
  Upload,
  Table,
  DatePicker,
  Tag,
  Space,
  Empty,
  InputNumber,
  RangePicker,
  Breadcrumb,
  Radio,
  Rate,
  message
} from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

// Import vue3-lazy lazy loading library
import VueLazyload from 'vue3-lazy'

// Initialize mobile terminal adaptation
MobileUtils.addMobileClass()
MobileUtils.setViewport()
if (MobileUtils.isMobile()) {
  MobileUtils.preventZoom()
}

const app = createApp(App)
const pinia = createPinia()
const queryClient = new QueryClient()
app.use(SolanaWallets, walletSolanaOptions)
app.use(WagmiPlugin, { config })
app.use(VueQueryPlugin, { queryClient })

app.use(pinia)
app.use(router)
app.use(i18n)

// Configure vue3-lazy lazy loading
app.use(VueLazyload, {
  loading: '',
  error: '',
  observerOptions: {
    rootMargin: '0px',
    threshold: 0.1
  }
})

// Register Ant Design Vue component
app.component('a-modal', Modal)
app.component('a-tabs', Tabs)
app.component('a-tab-pane', Tabs.TabPane)
app.component('a-button', Button)
app.component('a-input', Input)
app.component('a-input-search', Input.Search)
app.component('a-input-group', Input.Group)
app.component('a-textarea', Input.TextArea)
app.component('a-input-number', InputNumber)
app.component('a-form', Form)
app.component('a-form-item', Form.Item)
app.component('a-spin', Spin)
app.component('a-menu', Menu)
app.component('a-menu-item', Menu.Item)
app.component('a-menu-divider', Menu.Divider)
app.component('a-dropdown', Dropdown)
app.component('a-badge', Badge)
app.component('a-select', Select)
app.component('a-select-option', Select.Option)
app.component('a-upload', Upload)
app.component('a-table', Table)
app.component('a-date-picker', DatePicker)
app.component('a-range-picker', RangePicker)
app.component('a-tag', Tag)
app.component('a-space', Space)
app.component('a-empty', Empty)
app.component('a-breadcrumb', Breadcrumb)
app.component('a-breadcrumb-item', Breadcrumb.Item)
app.component('a-radio-group', Radio.Group)
app.component('a-radio-button', Radio.Button)
app.component('a-radio', Radio)
app.component('a-rate', Rate)

// Global configuration message prompt
app.config.globalProperties.$message = message

// Initialize the theme system
const initTheme = () => {
  const themeStore = useThemeStore()
  themeStore.initTheme()
}

// Initialize user data
const initUserData = async () => {
  try {
    const userStore = useUserStore()
    const isValid = await userStore.hydrate()
    
    if (isValid) {
      console.log('User data hydrated successfully')
      
      // If you have user information but need to refresh the data, you can call it here
      if (userStore.accessToken && userStore.userInfo) {
        try {
          await userStore.fetchAccountInfo()
          console.log('User account info refreshed')
        } catch (error) {
          console.warn('Failed to refresh user account info:', error)
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize user data:', error)
  }
}

app.mount('#app')

// Initialized after the application is mounted
Promise.all([
  initTheme(),
  initUserData()
]).then(() => {
  console.log('Application initialization completed')
}).catch(error => {
  console.error('Application initialization failed:', error)
})
