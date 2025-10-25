// wallet.ts
import { defineStore } from 'pinia'
import { ref, nextTick } from 'vue'
import { connectWallet, confirmAccount } from '@/apis/assets' // Make sure this path matches your project structure
import { walletLogin, solanaWalletLogin, solanaWalletConnect } from '@/apis/uid'
import { useUserStore } from '@/stores/user'
import { useModalStore } from '@/stores/modal'

export interface WalletInfo {
  chainId: number | string
  address: string | undefined
  [key: string]: any
  signedGenesisProof?: boolean
}

export interface NeedCombineAccount {
  id: number
  points: number
  email: string
  twitter: string
  telegram: string
  discord: string
}

export const useWalletStore = defineStore(
  'wallet',
  () => {
    const userStore = useUserStore()

    const walletConnectType = ref<'sol' | 'evm' | ''>('')

    const wallet = ref<WalletInfo>({
      network: '',
      chainId: '',
      address: '',
      signedGenesisProof: false
    })

    const solanaWallet = ref<WalletInfo>({
      chainId: '',
      address: ''
    })

    const needCombineAccounts = ref<Array<NeedCombineAccount>>([])

    // EVM re-login anti-duplicate processing mark - use globally unique identifier
    let evmReLoginProcessId: string | null = null

    const loginWallet = async (info: WalletInfo) => {
      const data = {
        address: info.address,
        chainId: info.chainId,
        provider: info.type || 'evm'
      }
      try {
        console.log('🔐 Wallet login - callAPI:', data)
        
        // Call the real wallet login API
        const { walletLogin } = await import('@/apis/uid')
        const response = await walletLogin(data)
        
        console.log('✅ Wallet login successful:', response)
        return Promise.resolve(response)
      } catch (error) {
        console.error('❌ Wallet login failed:', error)
        return Promise.reject(error)
      }
    }

    // A method to update the wallet info and send the new info to the backend
    const setWallet = async (info: WalletInfo) => {
      const modalStore = useModalStore()
      try {
        // Only call the backend if both network and address are provided
        if (info.chainId && info.address) {
          const userStore = useUserStore()
          if (!userStore.accessToken) {
            const { accessToken, accounts, userInfo: userData,walletInfo,walletList}: any = await loginWallet(info)
            walletConnectType.value = 'evm'
            userStore.setAccessToken(accessToken)
            userStore.setUserInfo(userData)
            userStore.setWalletInfo(walletInfo)
            userStore.setWalletList(walletList)
            needCombineAccounts.value = accounts
          } else {
            await connectWallet({
              address: info.address
            })

            // Handle EVM re-login broadcast mechanism - add anti-duplication processing
            const pendingAction = sessionStorage.getItem('pendingReLoginAction')
            const pendingTarget = sessionStorage.getItem('pendingReLoginTarget')
            const currentTime = Date.now()

            // The broadcast is only triggered if there is a pending EVM operation that is not currently being processed
            if (pendingAction && pendingTarget && !evmReLoginProcessId) {
              // Generate unique processing ID and set tag instantly
              evmReLoginProcessId = `evm_relogin_${currentTime}_${Math.random().toString(36).substr(2, 9)}`

              console.log('detectedEVMLog in again and start processing', {
                action: pendingAction,
                target: pendingTarget,
                processId: evmReLoginProcessId
              })

              // Clear sessionStorage immediately to prevent repeated detection
              sessionStorage.removeItem('pendingReLoginAction')
              sessionStorage.removeItem('pendingReLoginTarget')

              // Temporarily store operation information in temporary sessionStorage for use by Layout
              sessionStorage.setItem('processingReLoginAction', pendingAction)
              sessionStorage.setItem('processingReLoginTarget', pendingTarget)
              sessionStorage.setItem('reLoginProcessId', evmReLoginProcessId)

              // Use nextTick to ensure execution on the next tick to avoid circular dependencies
              nextTick(() => {
                try {
                  // Dynamically import modalStore to avoid circular dependencies
                  import('@/stores/modal').then(({ useModalStore }) => {
                    const modalStore = useModalStore()
                    modalStore.setLoginSuccess()

                    console.log('EVMRe-login broadcast sent', 'processId:', evmReLoginProcessId)

                    // Reset marker after processing is complete - add time to ensure Layout completes processing
                    setTimeout(() => {
                      evmReLoginProcessId = null
                      sessionStorage.removeItem('reLoginProcessId')
                      console.log('EVMRelogin processing flag reset')
                    }, 5000) // Reset mark after 5 seconds
                  })
                } catch (error) {
                  console.warn('Failed to set EVM login success flag:', error)
                  evmReLoginProcessId = null
                  sessionStorage.removeItem('reLoginProcessId')
                }
              })
            } else if (pendingAction && pendingTarget && evmReLoginProcessId) {
              console.log(
                'DuplicateEVM setWalletcall ignored',
                'currentProcessId:',
                evmReLoginProcessId,
                'time:',
                currentTime
              )
            }
          }
          wallet.value = info
          return Promise.resolve(true)
        }
        return Promise.resolve(true)
      } catch (error) {
        console.error('Failed to connect wallet:', error)
        // Here, you might want to handle errors, such as by notifying the user
        if ((error as { code: string; detail: string }).code === '30000002') {
          modalStore.toggleBindNewWalletModal(true)
        }
        return Promise.reject(false)
      }
    }

    const emptyWallet = () => {
      wallet.value = {
        network: '',
        chainId: '',
        address: ''
      }
      solanaWallet.value = {
        chainId: '',
        address: ''
      }
      needCombineAccounts.value = []
    }

    const updateSignedGenesisProof = (signed: boolean) => {
      wallet.value.signedGenesisProof = signed
    }

    const confirmWalletAccount = async (accountId: number) => {
      try {
        const { token }: any = await confirmAccount(accountId)
        userStore.setAccessToken(token)
      } catch (error) {
        console.error('Failed to confirm account:', error)
      }
    }

    const loginSolanaWallet = async (publicKey: string) => {
      const data = {
        address: publicKey,
        provider: 'solana'
      }
      try {
        console.log('🔐 SolanaWallet login - callAPI:', data)
        
        // Call the real Solana wallet login API
        const { solanaWalletLogin } = await import('@/apis/uid')
        const response = await solanaWalletLogin(data)
        
        console.log('✅ SolanaWallet login successful:', response)
        
        const { accessToken, userInfo: userData, walletInfo, walletList } = response
        console.log('soltoken', accessToken)
        userStore.setAccessToken(accessToken)
        userStore.setUserInfo(userData) 
        userStore.setWalletInfo(walletInfo)
        userStore.setWalletList(walletList)
        walletConnectType.value = 'sol'
        solanaWallet.value.address = publicKey
        return Promise.resolve(accessToken)
      } catch (error) {
        console.error('Failed to login solana wallet:', error)
        return Promise.reject(false)
      }
    }

    const bindSolanaWallet = async (publicKey: string) => {
      const data = {
        address: publicKey
      }
      try {
        const res = await solanaWalletConnect(data)
        solanaWallet.value.address = publicKey
        return Promise.resolve(res)
      } catch (error: any) {
        console.error('Failed to bind solana wallet:', error)
        return Promise.reject({ ...error, code: 'bindError' })
      }
    }

    return {
      walletConnectType,
      wallet,
      solanaWallet,
      needCombineAccounts,
      setWallet,
      emptyWallet,
      updateSignedGenesisProof,
      confirmWalletAccount,
      loginSolanaWallet,
      bindSolanaWallet
    }
  }
)
