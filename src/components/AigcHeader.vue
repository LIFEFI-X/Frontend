<template>
  <header class="aigc-header">
    <div class="header-container">
      <!-- Logo area on the left -->
      <div class="logo-section">
        <span class="brand-name">LiFEFi</span>
      </div>

    

      <!-- Right operation button -->
      <!-- middle navigation menu -->
      <nav class="nav-menu">
        <router-link to="/marketplace" class="nav-link">
          EXCHANGE
        </router-link>
       <router-link to="/create-collection" class="nav-link">
          CREATIVE
        </router-link>
        <a href="#" class="nav-link" @click="handleNavClick('about')">
          ABOUT
        </a>  
        <a href="#" class="nav-link" @click="handleNavClick('top-content')">
          TOP CONTENT
        </a>
      </nav>

      <!-- Right action link -->
      <div class="action-links">
        <!-- Not logged in -->
        <template v-if="!isUserLoggedIn">
          <a href="#" class="nav-link" @click="handleWallet">
            SIGN IN
          </a>
          <a href="#" class="nav-link" @click="handleAccount">
            ACCOUNT
          </a>
        </template>
        
        <!-- Logged in status -->
        <template v-else>
          <div class="user-dropdown">
            <a-dropdown placement="bottomRight" :trigger="['click']">
              <div class="user-info" @click.prevent>
                <div class="user-avatar">
                  <img 
                    v-if="userStore.userInfo?.avatarUrl" 
                    :src="userStore.userInfo.avatarUrl" 
                    :alt="userStore.userInfo.displayName"
                    @error="handleAvatarError"
                  />
                  <div v-else class="avatar-placeholder">
                    {{ getAvatarText(userStore.userInfo?.displayName || userStore.userInfo?.username) }}
                  </div>
                </div>
                <div class="user-details">
                  <span class="user-name">{{ getUserDisplayName() }}</span>
                  <span class="wallet-address" v-if="getWalletAddress()">
                    {{ formatWalletAddress(getWalletAddress()) }}
                  </span>
                </div>
                <SvgIcon name="common-arrow-up" style="transform: rotate(180deg); margin-left: 8px;" />
              </div>
              
              <template #overlay>
                <a-menu>
                  <a-menu-item key="profile" @click="handleProfile">
                    <SvgIcon name="header-profile" style="margin-right: 8px;" />
                    Profile
                  </a-menu-item>
                  <a-menu-item key="wallet" @click="handleWalletManage">
                    <SvgIcon name="header-wallet" style="margin-right: 8px;" />
                    Wallet
                  </a-menu-item>
                  <a-menu-item key="setting" @click="handleSettings">
                    <SvgIcon name="header-setting" style="margin-right: 8px;" />
                    Settings
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="logout" @click="handleLogout" class="logout-item">
                    <SvgIcon name="header-logout" style="margin-right: 8px;" />
                    Logout
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </template>
      </div>

      <!-- Mobile menu button -->
      <button class="mobile-menu-btn" @click="toggleMobileMenu" :class="{ active: isMobileMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- Mobile menu -->
    <div class="mobile-menu" :class="{ active: isMobileMenuOpen }">
      <div class="mobile-menu-content">
        <nav class="mobile-nav">
          <router-link to="/marketplace" class="mobile-nav-link" @click="closeMobileMenu">
            EXCHANGE
          </router-link>
          <a href="#" class="/create-collection" @click="handleMobileNavClick('creative')">
            CREATIVE
          </a>
          <a href="#" class="mobile-nav-link" @click="handleMobileNavClick('about')">
            ABOUT
          </a>
          <a href="#" class="mobile-nav-link" @click="handleMobileNavClick('top-content')">
            TOP CONTENT
          </a>
        </nav>
        <div class="mobile-actions">
          <!-- Not logged in -->
          <template v-if="!isUserLoggedIn">
            <a href="#" class="mobile-nav-link" @click="handleMobileNavClick('wallet')">
              SIGN IN
            </a>
            <a href="#" class="mobile-nav-link" @click="handleMobileNavClick('account')">
              ACCOUNT
            </a>
          </template>
          
          <!-- Logged in status -->
          <template v-else>
            <div class="mobile-user-info">
              <div class="mobile-user-header">
                <div class="user-avatar">
                  <img 
                    v-if="userStore.userInfo?.avatarUrl" 
                    :src="userStore.userInfo.avatarUrl" 
                    :alt="userStore.userInfo.displayName"
                    @error="handleAvatarError"
                  />
                  <div v-else class="avatar-placeholder">
                    {{ getAvatarText(userStore.userInfo?.displayName || userStore.userInfo?.username) }}
                  </div>
                </div>
                <div class="user-details">
                  <span class="user-name">{{ getUserDisplayName() }}</span>
                  <span class="wallet-address" v-if="getWalletAddress()">
                    {{ formatWalletAddress(getWalletAddress()) }}
                  </span>
                </div>
              </div>
              
              <div class="mobile-user-actions">
                <a href="#" class="mobile-nav-link" @click="handleMobileNavClick('profile')">
                  Profile
                </a>
                <a href="#" class="mobile-nav-link" @click="handleMobileNavClick('wallet-manage')">
                  Wallet
                </a>
                <a href="#" class="mobile-nav-link" @click="handleMobileNavClick('settings')">
                  Settings
                </a>
                <a href="#" class="mobile-nav-link logout-link" @click="handleMobileNavClick('logout')">
                  Logout
                </a>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
      <LoginEntry v-model="modalStore.isLoginEntryVisible" />
  </header>

</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { InteractionUtils } from '@/utils/interaction'
import { useUserStore } from '@/stores/user'
import SvgIcon from './SvgIcon.vue'
import { useThemeStore } from '@/stores/theme'
import { useModalStore } from '@/stores/modal'
import LoginEntry from '@/components/uid/LoginEntry.vue'
const modalStore = useModalStore()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
const userStore = useUserStore()
const isMobileMenuOpen = ref(false)
console.log(isDark.value,'isDark')

// Computed properties
const isUserLoggedIn = computed(() => {
  return !!(userStore.accessToken && (userStore.userInfo || userStore.account.username))
})

// User-related methods
const getUserDisplayName = () => {
  return userStore.userInfo?.displayName || userStore.userInfo?.username || userStore.account.name || 'User'
}

const getWalletAddress = () => {
  return userStore.walletInfo?.address || userStore.account.walletAddress || userStore.account.solanaAddress
}

const formatWalletAddress = (address: string) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const getAvatarText = (name: string) => {
  if (!name) return 'U'
  return name.charAt(0).toUpperCase()
}

const handleAvatarError = (event: Event) => {
  // Hide img tag when avatar fails to load
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}
// Navigation click handler
const handleNavClick = (section: string) => {
  console.log(`Navigate to: ${section}`)
  // Add route navigation or scroll to corresponding section logic here
  InteractionUtils.vibrate() // Mobile haptic feedback
}

// Mobile navigation click handler
const handleMobileNavClick = (section: string) => {
  if (section === 'wallet') {
    handleWallet()
  } else if (section === 'account') {
    handleAccount()
  } else if (section === 'profile') {
    handleProfile()
  } else if (section === 'wallet-manage') {
    handleWalletManage()
  } else if (section === 'settings') {
    handleSettings()
  } else if (section === 'logout') {
    handleLogout()
  } else {
    handleNavClick(section)
  }
  closeMobileMenu()
}

// Wallet button click
const handleWallet = () => {
       modalStore.toggleLoginEntryModal(true)
          modalStore.setLoginEntryType('all')
          modalStore.setLoginEntryConnectType('login')
  InteractionUtils.vibrate()
}

// Account button click
const handleAccount = () => {
  console.log('Account clicked')
  // Add account-related logic here
  modalStore.toggleLoginEntryModal(true)
  modalStore.setLoginEntryType('all')
  modalStore.setLoginEntryConnectType('login')
  InteractionUtils.vibrate()
}

// User menu action methods
const handleProfile = () => {
  console.log('Profile clicked')
  // Navigate to profile page or open profile modal
  modalStore.toggleProfileModal(true)
  modalStore.setProfileType('setting')
  InteractionUtils.vibrate()
}

const handleWalletManage = () => {
  console.log('Wallet manage clicked')
  // Navigate to wallet management page or open wallet modal
  modalStore.toggleProfileModal(true)
  modalStore.setProfileType('wallet')
  InteractionUtils.vibrate()
}

const handleSettings = () => {
  console.log('Settings clicked')
  // Navigate to settings page or open settings modal
  modalStore.toggleProfileModal(true)
  modalStore.setProfileType('setting')
  InteractionUtils.vibrate()
}

const handleLogout = async () => {
  console.log('Logout clicked')
  try {
    // Clear user data
    userStore.clearAll()
    // Can add API call to logout server-side session
    // await logoutAPI()
    
    // Refresh page or redirect to home
    window.location.href = '/'
  } catch (error) {
    console.error('Logout failed:', error)
  }
  InteractionUtils.vibrate()
}

// Toggle mobile menu
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'auto'
  }
  
  InteractionUtils.vibrate(50) // Light vibration feedback
}

// Close mobile menu
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  document.body.style.overflow = 'auto'
}

// Listen for window size changes
const handleResize = () => {
  if (window.innerWidth > 768 && isMobileMenuOpen.value) {
    closeMobileMenu()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.body.style.overflow = 'auto'
})
</script>

<style scoped lang="scss">
.aigc-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #000000;
  border-bottom: 1px solid #333333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  
  // Mobile safe area adaptation
  padding-top: var(--safe-area-inset-top);
}

.header-container {
  // max-width: 1400px;
  margin: 0 auto;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  
  @media (max-width: 1200px) {
    max-width: 1200px;
    padding: 0 32px;
  }
  
  @media (max-width: 768px) {
    height: 64px;
    padding: 0 20px;
    justify-content: space-between;
  }
  
  @media (max-width: 480px) {
    padding: 0 16px;
  }
}

// Logo section
.logo-section {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.02);
  }
  
  .logo-icon {
    width: 16px;
    height: 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .svg-icon {
      width: 16px;
      height: 16px;
      color: #ffffff;
    }
  }
  
  .brand-name {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.02em;
    
    @media (max-width: 480px) {
      font-size: 18px;
    }
  }
}

// Navigation menu
.nav-menu {
  display: flex;
  align-items: center;
  gap: 36px;
  
  @media (max-width: 1024px) {
    gap: 32px;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
}

.nav-link {
  font-size: 16px;
  font-weight: 500;
  color: #cccccc;
  text-decoration: none;
  position: relative;
  transition: color 0.3s ease;
  cursor: pointer;
  
  &:hover {
    color: #ffffff;
  }
  
  &.router-link-active {
    color: #1890ff;
  }
  
  // Hover underline effect
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 0;
    height: 2px;
    background: #ffffff;
    transition: width 0.3s ease;
  }
  
  &:hover::after,
  &.router-link-active::after {
    width: 100%;
  }
  
  &.router-link-active::after {
    background: #1890ff;
  }
}

// Action links
.action-links {
  display: flex;
  align-items: center;
  gap: 36px;
  
  @media (max-width: 1024px) {
    gap: 32px;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
}

.btn {
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 44px; // Minimum click area on mobile terminal
  border-radius: 20px;
  &:active {
    transform: scale(0.98);
  }
  
  @media (max-width: 1024px) {
    padding: 10px 20px;
    font-size: 14px;
  }
  
  &.btn-primary {
    background: #ff6b35;
    color: #ffffff;
    
    &:hover {
      background: #e55a2e;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
    }
  }
  
  &.btn-ghost {
    background: transparent;
    color: #ffffff;
    border: 1px solid #444444;
    
    &:hover {
      background: #222222;
      border-color: #1890ff;
      color: #1890ff;
    }
  }
}

// Mobile menu button
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  
  @media (max-width: 768px) {
    display: flex;
  }
  
  span {
    width: 20px;
    height: 2px;
    background: #ffffff;
    border-radius: 1px;
    transition: all 0.3s ease;
    transform-origin: center;
    
    &:not(:last-child) {
      margin-bottom: 4px;
    }
  }
  
  &.active {
    span:nth-child(1) {
      transform: rotate(45deg) translate(6px, 6px);
    }
    
    span:nth-child(2) {
      opacity: 0;
    }
    
    span:nth-child(3) {
      transform: rotate(-45deg) translate(6px, -6px);
    }
  }
}

// Mobile menu
.mobile-menu {
  position: fixed;
  top: calc(64px + var(--safe-area-inset-top, 0px));
  left: 0;
  right: 0;
  bottom: 0;
  background: #000000;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 999;
  
  &.active {
    transform: translateX(0);
  }
  
  @media (min-width: 769px) {
    display: none;
  }
}

.mobile-menu-content {
  padding: 24px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
}

.mobile-nav-link {
  font-size: 18px;
  font-weight: 500;
  color: #ffffff;
  text-decoration: none;
  padding: 16px 0;
  border-bottom: 1px solid #333333;
  transition: color 0.3s ease;
  display: block;
  
  &:hover {
    color: #1890ff;
  }
  
  &.router-link-active {
    color: #1890ff;
    border-bottom-color: #1890ff;
  }
}

.mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: auto;
  padding-bottom: var(--safe-area-inset-bottom, 0px);
}

// Style changes when scrolling
.aigc-header.scrolled {
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-bottom-color: rgba(51, 51, 51, 0.8);
}

// Animation effects
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.aigc-header {
  animation: fadeInDown 0.6s ease-out;
}

// Medium screen optimization (1024px-1399px)
@media (min-width: 1024px) and (max-width: 1399px) {
  .header-container {
    height: 72px;
  }
  
  .logo-section {
    gap: 6px;
    
    .logo-icon {
      width: 20px;
      height: 20px;
      
      .svg-icon {
        width: 16px;
        height: 16px;
      }
    }
    
    .brand-name {
      font-size: 18px;
    }
  }
  
  .nav-menu {
    margin-left: 50px;
  }
  
  .nav-link {
    font-size: 15px;
    padding: 8px 0;
  }
  
  .btn {
    padding: 8px 16px;
    font-size: 13px;
    min-height: 36px;
  }
}

// PC optimization (1400px+)
@media (min-width: 1400px) {
  .header-container {
    height: 80px;
  }
  
  .logo-section {
    gap: 12px;
    
    .logo-icon {
      width: 32px;
      height: 32px;
      
      .svg-icon {
        width: 24px;
        height: 24px;
      }
    }
    
    .brand-name {
      font-size: 22px;
    }
  }
  
  .nav-menu {
    margin-left: 80px;
  }
  
  .nav-link {
    font-size: 17px;
    padding: 8px 0;
  }
  
  .btn {
    padding: 12px 24px;
    font-size: 15px;
    min-height: 44px;
  }
}

// User info display styles
.user-dropdown {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1890ff;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-placeholder {
    color: #ffffff;
    font-weight: 600;
    font-size: 14px;
  }
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  
  .user-name {
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
  }
  
  .wallet-address {
    color: #cccccc;
    font-size: 12px;
    line-height: 1.2;
  }
}

// Mobile user info styles
.mobile-user-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 0;
  border-top: 1px solid #333333;
}

.mobile-user-header {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .user-avatar {
    width: 40px;
    height: 40px;
  }
  
  .user-details {
    .user-name {
      font-size: 16px;
    }
    
    .wallet-address {
      font-size: 14px;
    }
  }
}

.mobile-user-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  .logout-link {
    color: #ff4d4f !important;
    border-bottom-color: #ff4d4f !important;
  }
}

// Dropdown menu style optimization
:global(.ant-dropdown-menu) {
  background: #1a1a1a;
  border: 1px solid #333333;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  
  .ant-dropdown-menu-item {
    color: #ffffff;
    padding: 12px 16px;
    
    &:hover {
      background: #333333;
    }
    
    &.logout-item {
      color: #ff4d4f;
      
      &:hover {
        background: rgba(255, 77, 79, 0.1);
      }
    }
  }
  
  .ant-dropdown-menu-item-divider {
    border-color: #333333;
  }
}

// Responsive optimization
@media (max-width: 480px) {
  .header-container {
    padding: 0 12px;
  }
  
  .logo-section {
    .brand-name {
      display: none; // Hide brand name on extra small screens
    }
  }
  
  .user-info {
    padding: 6px 12px;
    gap: 8px;
    
    .user-avatar {
      width: 28px;
      height: 28px;
    }
    
    .user-details {
      .user-name {
        font-size: 13px;
      }
      
      .wallet-address {
        font-size: 11px;
      }
    }
  }
}
</style> 