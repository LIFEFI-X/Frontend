<script lang="ts" setup>
import { useWalletStore } from '@/stores/wallet'
import { useUserStore } from '@/stores/user'
import { useWallet } from '@/hooks/useWallet'
import { formatAddress, formatUserName } from '@/utils/index'
import BoomAvatar from './BoomAvatar.vue'
import { ref, watch } from 'vue'
import { useModalStore, type ProfileType } from '@/stores/modal'

const { disconnectWallet } = useWallet()
const userStore = useUserStore()
const openProfile = ref<boolean>(false)
const profileType = ref<ProfileType>('email')
const isHovering = ref<boolean>(false)

const editProfile = (type: ProfileType) => {
  openProfile.value = true
  profileType.value = type
}

const disconnectWalletClick = async (event: any) => {
  event.stopPropagation()
  console.log('Wallet Disconnected')
  await disconnectWallet()
  window.location.reload()
}

const showLinkWallet = ref<boolean>(false)
const handleWalletConnect = () => {
  // If the wallet has been bound, open linkwallet directly and only connect the wallet.
  if (userStore.account.walletAddress) {
    showLinkWallet.value = true
  } else {
    // Go to bind wallet
    editProfile('wallet')
  }
}

const modalStore = useModalStore()
const showLoginEntryDialog = () => {
  modalStore.toggleLoginEntryModal(true)
  modalStore.setLoginEntryType('all')
  modalStore.setLoginEntryConnectType('login')
}
</script>

<template>
  <div class="connect-button">
    <div
      class="wallet"
      v-if="
        !userStore.account.walletAddress &&
        !userStore.account.solanaAddress &&
        !userStore.accessToken
      "
      @click="showLoginEntryDialog"
    >
      <SvgIcon name="header-wallet" />
      <span>Connect Wallet</span>
    </div>
    <a-dropdown v-else overlayClassName="dropdown" placement="bottomRight">
      <div>
        <div
          :class="[isHovering ? 'wallet' : 'wallet-address']"
          v-if="
            !userStore.account.walletAddress &&
            !userStore.account.solanaAddress &&
            userStore.accessToken
          "
          @click="handleWalletConnect"
          @mouseenter="isHovering = true"
          @mouseout="isHovering = false"
        >
          <template v-if="isHovering">
            <SvgIcon name="header-wallet" />
            <span>Connect Wallet</span>
          </template>
          <template v-else>
            <BoomAvatar
              :size="20"
              :src="userStore.account.avatar"
              :username="userStore.account.name"
            />
            <span>{{ formatUserName(userStore.account.name) }}</span>
          </template>
        </div>
        <div
          class="wallet-address"
          v-if="userStore.account.walletAddress || userStore.account.solanaAddress"
        >
          <span>
            {{ formatAddress(userStore.account.walletAddress || userStore.account.solanaAddress) }}
          </span>
          <div class="arrow-down-wrapper">
            <SvgIcon class="arrow-down" name="common-arrow-up" style="transform: rotate(180deg)" />
          </div>
        </div>
      </div>

      <template #overlay>
        <a-menu>
          <a-menu-item @click="editProfile('setting')">
            <span>Setting</span>
            <SvgIcon name="header-setting" />
          </a-menu-item>
          <a-menu-item
            @click="editProfile('wallet')"
            v-if="!userStore.account.solanaAddress && !userStore.account.walletAddress"
          >
            <span>Bind Wallet</span>
            <SvgIcon name="header-profile" />
          </a-menu-item>
          <a-menu-item @click="disconnectWalletClick">
            <span> Sign Out </span>
            <SvgIcon name="header-logout" />
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
    <ModalProfile v-model="openProfile" :type="profileType" :show-twitter="true" />
    <LinkWallet v-model="showLinkWallet" />
  </div>
</template>

<style lang="scss" scoped>
.connect-button {
  width: 100%;
}

.wallet {
  width: 100%;
  position: relative;
  display: inline-flex;
  height: 36px;
  padding: 0px 16px;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  border-radius: 40px;
  background: var(--color-primary);

  color: var(--color-white);
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  line-height: calc(142.857 * 100vw / 1920);
  cursor: pointer;
  overflow: hidden;

  span {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .svg-icon {
    width: 20px;
    height: 20px;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
  }

  &:hover::after {
    background: rgba(255, 255, 255, 0.16);
  }

  &:active::after {
    background: rgba(var(--color-primary-rgb), 0.16);
  }
}

.wallet-address {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 36px;
  padding: 0px 16px;
  align-items: center;
  gap: 8px;
  border-radius: 40px;
  border: 1px solid #1d1d1f;

  color: #1d1d1f;
  text-align: center;
  font-feature-settings:
    'ss01' on,
    'cv01' on,
    'cv11' on;
  font-family: Poppins;
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
  line-height: 20px;
  /* 142.857% */
  cursor: pointer;

  .metamask {
    width: 20px;
    height: 20px;
  }

  .arrow-down-wrapper {
    display: flex;
    width: 20px;
    height: 20px;
    padding: 10px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;

    .arrow-down {
      width: 14px;
      height: 7px;
      flex-shrink: 0;
      color: #1d1d1f;
      stroke-width: 0.4px;
      stroke: #1d1d1f;
    }
  }
}

@media screen and (min-width: 1921px) {
  .wallet {
    height: calc(36 * 100vw / 1920);
    padding: 0px calc(16 * 100vw / 1920);
    gap: calc(8 * 100vw / 1920);
    border-radius: calc(40 * 100vw / 1920);

    font-size: calc(14 * 100vw / 1920);

    .svg-icon {
      width: calc(20 * 100vw / 1920);
      height: calc(20 * 100vw / 1920);
    }
  }

  .wallet-address {
    height: calc(36 * 100vw / 1920);
    padding: 0px calc(16 * 100vw / 1920);
    gap: calc(8 * 100vw / 1920);
    border-radius: calc(40 * 100vw / 1920);
    border: calc(1 * 100vw / 1920) solid #1d1d1f;

    font-size: calc(14 * 100vw / 1920);
    line-height: calc(20 * 100vw / 1920);

    .metamask {
      width: calc(20 * 100vw / 1920);
      height: calc(20 * 100vw / 1920);
    }

    .arrow-down-wrapper {
      width: calc(20 * 100vw / 1920);
      height: calc(20 * 100vw / 1920);
      padding: calc(10 * 100vw / 1920);
      gap: calc(10 * 100vw / 1920);

      .arrow-down {
        width: calc(14 * 100vw / 1920);
        height: calc(7 * 100vw / 1920);
        stroke-width: calc(0.4 * 100vw / 1920);
      }
    }
  }
}
</style>
<style lang="scss">
.dropdown {
  position: fixed;
  // top: 70px !important;

  .ant-dropdown-menu {
    padding: 0;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.1);
    overflow: hidden;

    .ant-dropdown-menu-item {
      padding: 0;
    }

    .ant-dropdown-menu-title-content {
      display: flex;
      height: 44px;
      padding: 0px 16px;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      align-self: stretch;
      color: #6e6e73;

      span {
        font-family: Poppins;
        font-size: 14px;
        font-style: normal;
        font-weight: 600;
        line-height: 20px;
        /* 142.857% */
      }

      .svg-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      &:hover {
        color: #1d1d1f;
        background: rgba(29, 29, 31, 0.03);
      }
    }
  }
}
</style>
