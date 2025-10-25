<script lang="ts" setup>
import { useWalletStore } from '@/stores/wallet'
import { useWallet } from '@/hooks/useWallet'

import { useUserStore } from '@/stores/user'
import { useModalStore, type LoginEntryConnectType, type LoginEntryType } from '@/stores/modal'
import type { EvmWallet, Wallet } from '@/types/wallet'
import { ref, watch, onMounted } from 'vue'


// Define modelValue for two-way binding
interface Props {
  modelValue: boolean
}
const props = defineProps<Props>()

// Monitor modelValue through watch to modify data
const showModal = ref<boolean>(false)
const isSocialShow = ref<boolean>(false)
const loginEntryType = ref<LoginEntryType>('all')
const loginEntryConnectType = ref<LoginEntryConnectType>('login')
watch(
  () => props.modelValue,
  (newV) => {
    showModal.value = newV
  }
)

const global = useUserStore()
const walletStore = useWalletStore()

// Get wallet-related features, including Binance Web3 Connect functionality
const {
  connectWallet,
  solanaWallets,
  connectSolana,
  isBinanceEnvironment,
  evmWalletLoading,
  solanaWalletLoading,
  getEvmWalletLoading,
  getSolanaWalletLoading
} = useWallet()

// Detect if you are in Binance environment
const isInBinanceWallet = ref(false)
onMounted(() => {
  try {
    isInBinanceWallet.value = isBinanceEnvironment()
    console.log('Binance environment detected:', isInBinanceWallet.value)
  } catch (error) {
    console.warn('Failed to detect Binance environment:', error)
  }
})

// Monitor user login and re-obtain user information
watch(
  () => global.accessToken,
  (newToken) => {
    global.fetchAccountInfo()
  }
)

const modalStore = useModalStore()
watch(
  () => modalStore.isLoginEntryVisible,
  (newVal) => {
    showModal.value = newVal

    // Re-detect the Binance environment every time the pop-up box is opened to ensure that it can be detected correctly in the ReLoginVerifyModal scenario.
    if (newVal) {
      try {
        isInBinanceWallet.value = isBinanceEnvironment()
        console.log('LoginEntry opened - Binance environment detected:', isInBinanceWallet.value)
      } catch (error) {
        console.warn('Failed to detect Binance environment in LoginEntry:', error)
      }
    }
  }
)
watch(
  () => modalStore.loginEntryType,
  (newVal) => {
    loginEntryType.value = newVal
    // If it is a social login type, the social login section will be automatically expanded.
    if (newVal === 'social') {
      isSocialShow.value = true
    }
  }
)
watch(
  () => modalStore.loginEntryConnectType,
  (newVal) => {
    loginEntryConnectType.value = newVal
  }
)

// Two-way binding, sending update events
const emit = defineEmits(['update:modelValue'])

// Close modal and send event
const handleClose = () => {
  showModal.value = false
  modalStore.toggleLoginEntryModal(false)
  emit('update:modelValue', false)
}

// Solana wallet login
const solanaWalletLogin = async (wallet: Wallet, type: LoginEntryConnectType = 'login') => {

  try {
    // In Binance environment, give additional preparation time for Solana wallet connection
    if (isInBinanceWallet.value) {
      console.log('🔄 Binance environment detected for Solana, adding preparation delay...')
      await new Promise((resolve) => setTimeout(resolve, 800)) // Solana takes longer
    }

    await connectSolana(wallet, type)
    handleClose()
  } catch (error) {
    console.error('❌ solanaWalletLogin error:', error)
    // In the Binance environment, if the connection fails, do not close the popup immediately and give the user a chance to try again.
    if (!isInBinanceWallet.value) {
      handleClose()
    }
  }
}

// EVM wallet login
const evmWalletLogin = async (wallet: EvmWallet, type: LoginEntryConnectType = 'login') => {
  console.log('🎯 evmWalletLogin called:', {
    wallet,
    type,
    isInBinanceWallet: isInBinanceWallet.value
  })

  try {
    // In Binance environment, give wallet connection extra preparation time
    if (isInBinanceWallet.value && (wallet === 'binanceWeb3Wallet' || wallet === 'binanceWallet')) {
      console.log('🔄 Binance environment detected, adding preparation delay...')
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    await connectWallet(wallet, type)
    if (walletStore.needCombineAccounts.length > 0) {
      showCombineAccount.value = true
    }
    handleClose()
  } catch (error) {
    console.error('❌ evmWalletLogin error:', error)
    // In the Binance environment, if the connection fails, do not close the popup immediately and give the user a chance to try again.
    if (!isInBinanceWallet.value) {
      handleClose()
    }
  }
}



// Open privacy policy
const openPrivacyPolicy = () => {
}

// Open terms of service
const openTermsOfService = () => {
}

</script>

<template>
  <a-modal
    wrapClassName="custom-modal modal-entry"
    ref="modalRef"
    v-model:open="showModal"
    :width="480"
    :footer="null"
    :closable="false"
    @cancel="handleClose"
  >
    <div class="header">
      <div class="title">
        <template v-if="loginEntryConnectType === 'login'"> Log in to LiFEFi </template>
        <template v-else-if="loginEntryConnectType === 'connect'"> Connect Wallet </template>
        <template v-else-if="loginEntryConnectType === 'bind'"> Bind Wallet </template>
      </div>
      <SvgIcon name="header-close" @click="handleClose()"></SvgIcon>
    </div>
    <section
      class="block"
      v-if="!!loginEntryType && (loginEntryType === 'evm' || loginEntryType === 'all')"
    >
      <div class="label">EVM Chain</div>
      <div class="list">
        <div class="item">
          <div class="item__left">
            <div class="icon-wrapper">
              <SvgIcon name="entry-metamask"></SvgIcon>
            </div>
            <span>MetaMask</span>
          </div>
          <div class="item__right">
            <div
              class="button button-default"
              :class="{ loading: getEvmWalletLoading('metaMaskSDK') }"
              :disabled="getEvmWalletLoading('metaMaskSDK')"
              @click="
                evmWalletLogin('metaMaskSDK', loginEntryType === 'evm' ? 'connect' : undefined)
              "
            >
              <SvgIcon
                v-if="getEvmWalletLoading('metaMaskSDK')"
                name="dashboard-loading"
                class="loading-icon"
              />
              {{ getEvmWalletLoading('metaMaskSDK') ? 'Connecting...' : 'Connect' }}
            </div>
          </div>
        </div>
        <!-- Display different Binance wallet options depending on the environment -->
        <div class="item" v-if="!isInBinanceWallet">
          <div class="item__left">
            <div class="icon-wrapper">
              <SvgIcon name="entry-binance"></SvgIcon>
            </div>
            <span>Binance Wallet</span>
          </div>
          <div class="item__right">
            <div
              class="button button-default"
              :class="{ loading: getEvmWalletLoading('binanceWallet') }"
              :disabled="getEvmWalletLoading('binanceWallet')"
              @click="
                evmWalletLogin('binanceWallet', loginEntryType === 'evm' ? 'connect' : undefined)
              "
            >
              <SvgIcon
                v-if="getEvmWalletLoading('binanceWallet')"
                name="dashboard-loading"
                class="loading-icon"
              />
              {{ getEvmWalletLoading('binanceWallet') ? 'Connecting...' : 'Connect' }}
            </div>
          </div>
        </div>

        <!-- Show Web3 Connect options in Binance environment -->
        <div class="item" v-if="isInBinanceWallet">
          <div class="item__left">
            <div class="icon-wrapper">
              <SvgIcon name="entry-binance"></SvgIcon>
            </div>
            <span>Binance Wallet</span>
          </div>
          <div class="item__right">
            <div
              class="button button-default"
              :class="{ loading: getEvmWalletLoading('binanceWeb3Wallet') }"
              :disabled="getEvmWalletLoading('binanceWeb3Wallet')"
              @click="
                evmWalletLogin(
                  'binanceWeb3Wallet',
                  loginEntryType === 'evm' ? 'connect' : undefined
                )
              "
            >
              <SvgIcon
                v-if="getEvmWalletLoading('binanceWeb3Wallet')"
                name="dashboard-loading"
                class="loading-icon"
              />
              {{ getEvmWalletLoading('binanceWeb3Wallet') ? 'Connecting...' : 'Connect' }}
            </div>
          </div>
        </div>
        <div class="item">
          <div class="item__left">
            <div class="icon-wrapper">
              <SvgIcon name="entry-okx"></SvgIcon>
            </div>

            <span>OKX Wallet</span>
          </div>
          <div class="item__right">
            <div
              class="button button-default"
              :class="{ loading: getEvmWalletLoading('okxWallet') }"
              :disabled="getEvmWalletLoading('okxWallet')"
              @click="evmWalletLogin('okxWallet', loginEntryType === 'evm' ? 'connect' : undefined)"
            >
              <SvgIcon
                v-if="getEvmWalletLoading('okxWallet')"
                name="dashboard-loading"
                class="loading-icon"
              />
              {{ getEvmWalletLoading('okxWallet') ? 'Connecting...' : 'Connect' }}
            </div>
          </div>
        </div>
        <div class="item">
          <div class="item__left">
            <div class="icon-wrapper">
              <SvgIcon name="entry-walletConnect"></SvgIcon>
            </div>

            <span>WalletConnect</span>
          </div>
          <div class="item__right">
            <div
              class="button button-default"
              :class="{ loading: getEvmWalletLoading('walletConnect') }"
              :disabled="getEvmWalletLoading('walletConnect')"
              @click="
                evmWalletLogin('walletConnect', loginEntryType === 'evm' ? 'connect' : undefined)
              "
            >
              <SvgIcon
                v-if="getEvmWalletLoading('walletConnect')"
                name="dashboard-loading"
                class="loading-icon"
              />
              {{ getEvmWalletLoading('walletConnect') ? 'Connecting...' : 'Connect' }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section
      class="block"
      v-if="!!loginEntryType && (loginEntryType === 'solana' || loginEntryType === 'all')"
    >
      <div class="label">Solana Chain</div>
      <div class="list">
        <div
          class="item"
          v-for="wallet in solanaWallets.filter((w) => w.adapter.name !== 'MetaMask')"
          :key="wallet.adapter.name"
        >
          <div class="item__left">
            <div class="icon-wrapper">
              <img :src="wallet.adapter.icon" alt="wallet icon" />
            </div>
            <span>{{ wallet.adapter.name }}</span>
          </div>
          <div class="item__right">
            <div
              class="button button-default"
              :class="{ loading: getSolanaWalletLoading(wallet.adapter.name) }"
              :disabled="getSolanaWalletLoading(wallet.adapter.name)"
              @click="
                solanaWalletLogin(wallet, loginEntryType === 'solana' ? 'connect' : undefined)
              "
            >
              <SvgIcon
                v-if="getSolanaWalletLoading(wallet.adapter.name)"
                name="dashboard-loading"
                class="loading-icon"
              />
              {{ getSolanaWalletLoading(wallet.adapter.name) ? 'Connecting...' : 'Connect' }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section
      class="block social"
      v-if="!!loginEntryType && (loginEntryType === 'social' || loginEntryType === 'all')"
    >
      <div class="privacy-terms">
        By creating an account or logging in, you confirm that you accept our
        <span class="highlight-text" @click="openPrivacyPolicy">Privacy Policy</span> and
        <span class="highlight-text" @click="openTermsOfService">Terms of Service</span>
      </div>
    </section>
  </a-modal>
</template>

<style lang="scss" scoped>
.header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;

  .title {
    color: #ffffff; // Make sure the title is clearly visible against a black background
    font-size: 28px;
    font-weight: 800;
    line-height: 130%;
    letter-spacing: -0.56px;
  }

  .svg-icon {
    width: 20px;
    height: 20px;
    color: #ffffff; // Change the close button to white
    flex-shrink: 0;
    cursor: pointer;
    
    &:hover {
      color: #cccccc; // Darkens slightly when hovering
    }
  }
}

.block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  margin-bottom: 32px; // block spacing
  
  &:last-child {
    margin-bottom: 0; // The last block does not require bottom spacing
  }

  .block-header {
    display: flex;
    justify-content: space-between;
    flex: 1;
    align-self: stretch;

    .arrow-wrapper {
      display: flex;
      width: 20px;
      height: 20px;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      .svg-icon {
        width: 14.94px;
        height: 8px;
        flex-shrink: 0;
        color: rgba(255, 255, 255, 0.6); // Arrow icon uses translucent white
      }

      &.reverse {
        transform: rotate(180deg);
      }
    }
  }

  .label {
    color: #ffffff; // Block labels changed to white to ensure visibility against black background
    font-family: Urbanist;
    font-size: 16px;
    font-style: normal;
    font-weight: 600;
    line-height: 150%;
  }

  .list {
    width: 100%;
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .item {
      display: flex;
      height: 64px;
      padding: 16px;
      justify-content: space-between;
      align-items: center;
      align-self: stretch;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08); // Translucent white background, suitable for black themes
      border: 1px solid rgba(255, 255, 255, 0.1); // Add thin borders to enhance layering
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.12); // Slightly enhance the background when hovering
        border-color: rgba(255, 255, 255, 0.2);
      }

      .item__left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;

        .icon-wrapper {
          display: flex;
          width: 32px;
          height: 32px;
          justify-content: center;
          align-items: center;
          gap: 13.333px;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05); // Slight background enhancement icon display effect
          border: 1px solid rgba(255, 255, 255, 0.08);

          .svg-icon,
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
          }
          
          .svg-icon {
            color: #ffffff; // Make sure the SVG icon is white
          }
        }

        span {
          color: #ffffff; // Wallet name changed to white
          font-family: Urbanist;
          font-size: 16px;
          font-style: normal;
          font-weight: 600;
          line-height: 20px;
          /* 125% */
        }
      }

      .item__right {
        .button {
          height: 36px;
          padding: 0px 16px;
          border-radius: 40px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #007AFF; // Blue background to ensure sufficient contrast
          color: #ffffff; // white text
          border: none;
          font-family: Urbanist;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;

          &:hover:not(:disabled):not(.loading) {
            background: #0056CC; // Darkens slightly when hovering
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
          }

          &:active:not(:disabled):not(.loading) {
            transform: translateY(0);
            background: #004999;
          }

          .loading-icon {
            width: 14px;
            height: 14px;
            animation: spin 1s linear infinite;
            color: #ffffff;
          }

          &.loading {
            cursor: not-allowed;
            pointer-events: none;
            background: #007AFF;
            opacity: 0.8;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background: #666666;
          }
        }
      }
    }
  }

  &.social .list {
    will-change: height, opacity;
    transition:
      height 0.2s cubic-bezier(0.645, 0.045, 0.355, 1),
      opacity 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  }
}

.privacy-terms {
  width: 100%;
  text-align: center;
  font-family: Urbanist;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.7); // Translucent white to maintain readability but not stand out too much
  margin-top: 40px;
  padding: 0 12px;

  .highlight-text {
    font-weight: 700;
    color: #ffffff; // Use pure white for important links
    text-decoration: underline;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: #007AFF; // Use blue theme color when floating
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// Optimize the overall style of the modal box for dark themes
:deep(.custom-modal.modal-entry) {
  .ant-modal-content {
    background-color: #1a1a1a; // dark background
    border: 1px solid rgba(255, 255, 255, 0.1); // Thin borders
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8); // stronger shadow
  }
  
  .ant-modal-body {
    padding: 32px;
  }
}
</style>
