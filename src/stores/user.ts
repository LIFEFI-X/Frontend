import { defineStore } from 'pinia'
import type { WalletInfo as OriginalWalletInfo } from '@/stores/wallet'
import { getAccount } from '@/apis/index'

// Store key name constants
const STORAGE_KEYS = {
  USER_DATA: 'user_data',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences'
} as const

// storage utility functions
const StorageUtils = {
  // Secure JSON parsing
  safeJsonParse: <T>(value: string | null, fallback: T): T => {
    if (!value) return fallback
    try {
      return JSON.parse(value) as T
    } catch (error) {
      console.warn('Failed to parse stored data:', error)
      return fallback
    }
  },

  // Secure storage settings
  safeSetItem: (key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      return false
    }
  },

  // Secure storage access
  safeGetItem: <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key)
      return StorageUtils.safeJsonParse(item, fallback)
    } catch (error) {
      console.error('Failed to read from localStorage:', error)
      return fallback
    }
  },

  // Secure storage deletion
  safeRemoveItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Failed to remove from localStorage:', error)
      return false
    }
  }
}

// User information type
export interface UserInfo {
  id: number
  username: string
  email: string
  displayName: string
  avatarUrl: string
  bio: string
  websiteUrl: string
  socialLinks: string
  userLevel: number
  verificationStatus: number
  status: number
  lastLoginAt: string
  createdAt: string
}

// API wallet information type
export interface ApiWalletInfo {
  walletId: number
  username: string
  address: string
  avatarUrl: string
  description: string
  websiteUrl: string
  socialLinks: string
  userLevel: number
  verificationStatus: number
  status: number
  lastLoginAt: string
}

// Wallet list item type
export interface WalletListItem {
  id: number
  userId: number
  walletAddress: string
  walletType: string
  blockchainNetwork: string
  isPrimary: boolean
  balance: number
  lastSyncAt: string
  version: number
  isDeleted: number
  createdAt: string
  updatedAt: string
  avatarUrl: string
  username: string
  description: string
}

// API response data type
export interface UserAccountResponse {
  code: number
  message: string
  data: {
    accessToken: string
    refreshToken: string
    tokenType: string
    expiresIn: number
    userInfo: UserInfo
    walletInfo: ApiWalletInfo
    walletList: WalletListItem[]
    scope: string
  }
  timestamp: number
}

// Compatible with the old Account interface (maintaining backward compatibility)
export interface Account {
  username: string
  name: string
  avatar: string
  wallet?: OriginalWalletInfo
  gbInviteCode?: string
  solanaAddress?: string
  // Add new field
  userInfo?: UserInfo
  walletInfo?: ApiWalletInfo
  walletList?: WalletListItem[]
  refreshToken?: string
  tokenType?: string
  expiresIn?: number
  scope?: string
  [key: string]: any
}

// Persistent data structures
interface PersistedUserData {
  account: Account
  userInfo: UserInfo | null
  walletInfo: ApiWalletInfo | null
  walletList: WalletListItem[]
  refreshToken: string
  tokenType: string
  expiresIn: number
  scope: string
  timestamp: number // Store timestamp for data validity verification
}

export const useUserStore = defineStore(
  'user',
  () => {
    // Data validity period (24 hours)
    const DATA_EXPIRY_TIME = 24 * 60 * 60 * 1000

    // Recover data from localStorage
    const restoreFromStorage = (): PersistedUserData => {
      const defaultData: PersistedUserData = {
        account: { username: '', name: '', avatar: '' },
        userInfo: null,
        walletInfo: null,
        walletList: [],
        refreshToken: '',
        tokenType: '',
        expiresIn: 0,
        scope: '',
        timestamp: Date.now()
      }

      const stored = StorageUtils.safeGetItem<PersistedUserData>(STORAGE_KEYS.USER_DATA, defaultData)
      
      // Check if data is expired
      const isExpired = Date.now() - stored.timestamp > DATA_EXPIRY_TIME
      if (isExpired) {
        console.log('Stored user data expired, using defaults')
        return defaultData
      }

      return stored
    }

    // Persist data to localStorage
    const persistToStorage = () => {
      const dataToStore: PersistedUserData = {
        account: account.value,
        userInfo: userInfo.value,
        walletInfo: walletInfo.value,
        walletList: walletList.value,
        refreshToken: refreshToken.value,
        tokenType: tokenType.value,
        expiresIn: expiresIn.value,
        scope: scope.value,
        timestamp: Date.now()
      }
      
      StorageUtils.safeSetItem(STORAGE_KEYS.USER_DATA, dataToStore)
      
      // Store access tokens separately (may require different expiration policies)
      if (accessToken.value) {
        StorageUtils.safeSetItem(STORAGE_KEYS.ACCESS_TOKEN, {
          token: accessToken.value,
          timestamp: Date.now()
        })
      }
    }

    // initialization data
    const initialData = restoreFromStorage()
    const storedToken = StorageUtils.safeGetItem<{token: string, timestamp: number} | null>(STORAGE_KEYS.ACCESS_TOKEN, null)

    // user object
    const account = ref<Account>(initialData.account)

    // Add user details
    const userInfo = ref<UserInfo | null>(initialData.userInfo)
    const walletInfo = ref<ApiWalletInfo | null>(initialData.walletInfo)
    const walletList = ref<WalletListItem[]>(initialData.walletList)
    const refreshToken = ref(initialData.refreshToken)
    const tokenType = ref(initialData.tokenType)
    const expiresIn = ref(initialData.expiresIn)
    const scope = ref(initialData.scope)

    const avatarColor = computed(() => localStorage.getItem('avatarColor') ?? undefined)

    // Get the current user’s wallet address
    const currentUserAddress = computed(() => {
      console.log('🔍 Computing currentUserAddress:', {
        walletInfo: walletInfo.value,
        walletList: walletList.value
      })
      
      // Prioritize using addresses in walletInfo
      if (walletInfo.value?.address) {
        console.log('✅ Using walletInfo address:', walletInfo.value.address)
        return walletInfo.value.address
      }
      
      // Secondly use the address of the main wallet in walletList
      const primaryWallet = walletList.value.find(wallet => wallet.isPrimary)
      if (primaryWallet?.walletAddress) {
        console.log('✅ Using primary wallet address:', primaryWallet.walletAddress)
        return primaryWallet.walletAddress
      }
      
      // Finally use the address of the first wallet in walletList
      if (walletList.value.length > 0) {
        console.log('✅ Using first wallet address:', walletList.value[0].walletAddress)
        return walletList.value[0].walletAddress
      }
      
      // If there are none, return an empty string
      console.log('❌ No wallet address found')
      return ''
    })

    // token - Check if it has expired
    const accessToken = ref('')
    if (storedToken && Date.now() - storedToken.timestamp < DATA_EXPIRY_TIME) {
      accessToken.value = storedToken.token
    }

    const resetPwAccessToken = ref('')

    // Monitor data changes and automatically persist
    watch([account, userInfo, walletInfo, walletList, refreshToken, tokenType, expiresIn, scope], 
      () => {
        persistToStorage()
      }, 
      { deep: true }
    )

    // Monitor accessToken changes and persist them separately
    watch(accessToken, (newToken) => {
      if (newToken) {
        StorageUtils.safeSetItem(STORAGE_KEYS.ACCESS_TOKEN, {
          token: newToken,
          timestamp: Date.now()
        })
      } else {
        StorageUtils.safeRemoveItem(STORAGE_KEYS.ACCESS_TOKEN)
      }
    })

    // Set user information
    const setAccount = (info: Partial<Account>) => {
      account.value = { ...account.value, ...info }
    }

    // Set user details
    const setUserInfo = (info: UserInfo) => {
      console.log('setUserInfo', info)
      userInfo.value = info
      // Also update compatible account fields
      account.value.username = info.username
      account.value.name = info.displayName
      account.value.avatar = info.avatarUrl
      account.value.userInfo = info
    }

    // Set wallet information
    const setWalletInfo = (info: ApiWalletInfo) => {
      walletInfo.value = info
      account.value.walletInfo = info
    }

    // Set wallet list
    const setWalletList = (list: WalletListItem[]) => {
      walletList.value = list
      account.value.walletList = list
    }

    // Set token related information
    const setTokenInfo = (tokenInfo: {
      accessToken: string
      refreshToken?: string
      tokenType?: string
      expiresIn?: number
      scope?: string
    }) => {
      accessToken.value = tokenInfo.accessToken
      if (tokenInfo.refreshToken) refreshToken.value = tokenInfo.refreshToken
      if (tokenInfo.tokenType) tokenType.value = tokenInfo.tokenType
      if (tokenInfo.expiresIn) expiresIn.value = tokenInfo.expiresIn
      if (tokenInfo.scope) scope.value = tokenInfo.scope
      
      // Update compatible account fields
      account.value.refreshToken = tokenInfo.refreshToken
      account.value.tokenType = tokenInfo.tokenType
      account.value.expiresIn = tokenInfo.expiresIn
      account.value.scope = tokenInfo.scope
    }

    // Anti-duplicate processing tags - use globally unique identifiers
    let reLoginProcessId: string | null = null

    // Set token
    function setAccessToken(v: string) {
      const currentTime = Date.now()

      accessToken.value = v
      console.log('setAccessToken', v, 'time:', currentTime)

      // If token is set (not empty), check if there is any pending re-login operation
      if (v) {
        // Check if there is any pending re-login operation
        const pendingAction = sessionStorage.getItem('pendingReLoginAction')
        const pendingTarget = sessionStorage.getItem('pendingReLoginTarget')

        // The login success flag is only triggered when there is an action pending and not currently being processed
        if (pendingAction && pendingTarget && !reLoginProcessId) {
          // Generate a unique processing ID and clear sessionStorage immediately
          reLoginProcessId = `relogin_${currentTime}_${Math.random().toString(36).substr(2, 9)}`

          console.log('Re-login operation detected and processing started', 'processId:', reLoginProcessId)

          // Clear sessionStorage immediately to prevent repeated detection
          sessionStorage.removeItem('pendingReLoginAction')
          sessionStorage.removeItem('pendingReLoginTarget')

          // Temporarily store operation information in a temporary sessionStorage for use by Layout
          sessionStorage.setItem('processingReLoginAction', pendingAction)
          sessionStorage.setItem('processingReLoginTarget', pendingTarget)
          sessionStorage.setItem('reLoginProcessId', reLoginProcessId)

          // Use nextTick to ensure execution on the next tick to avoid circular dependencies
          nextTick(() => {
            try {
              // Dynamically import modalStore to avoid circular dependencies
              import('@/stores/modal').then(({ useModalStore }) => {
                const modalStore = useModalStore()
                modalStore.setLoginSuccess()

                // Reset marker after processing is complete - add time to ensure Layout completes processing
                setTimeout(() => {
                  reLoginProcessId = null
                  console.log('Relogin processing flag reset')
                }, 5000) // Reset mark after 5 seconds
              })
            } catch (error) {
              console.warn('Failed to set login success flag:', error)
              reLoginProcessId = null
            }
          })
        } else if (pendingAction && pendingTarget && reLoginProcessId) {
          console.log(
            'DuplicatesetAccessTokencall ignored',
            'currentProcessId:',
            reLoginProcessId,
            'time:',
            currentTime
          )
        }
      }
    }

    function setResetPwAccessToken(v: string) {
      resetPwAccessToken.value = v
    }

    // Set avatar color
    const setAvatarColor = () => {
      const colors = ['#00FFB4', '#F6255A', '#10E4F4', '#FFCA47', '#CA59FF', '#8DA8DA']
      const color = colors[Math.floor(Math.random() * colors.length)]

      localStorage.setItem('avatarColor', color)
    }

    // Clear all user data
    function clearAll() {
      // clear status
      accessToken.value = ''
      resetPwAccessToken.value = ''
      refreshToken.value = ''
      tokenType.value = ''
      expiresIn.value = 0
      scope.value = ''
      userInfo.value = null
      walletInfo.value = null
      walletList.value = []
      account.value = {
        username: '',
        name: '',
        avatar: ''
      }

      // Clear all relevant localStorage data
      StorageUtils.safeRemoveItem(STORAGE_KEYS.USER_DATA)
      StorageUtils.safeRemoveItem(STORAGE_KEYS.ACCESS_TOKEN)
      StorageUtils.safeRemoveItem(STORAGE_KEYS.REFRESH_TOKEN)
      StorageUtils.safeRemoveItem(STORAGE_KEYS.USER_PREFERENCES)
      
      // Clear old storage format (backward compatibility)
      StorageUtils.safeRemoveItem('user')
      StorageUtils.safeRemoveItem('discord')
      StorageUtils.safeRemoveItem('avatarColor')
      
      console.log('All user data cleared from storage')
    }

    // Manually trigger data persistence
    const forcePersist = () => {
      persistToStorage()
    }

    // Check validity of stored data
    const validateStoredData = (): boolean => {
      const stored = StorageUtils.safeGetItem<PersistedUserData | null>(STORAGE_KEYS.USER_DATA, null)
      if (!stored) return false
      
      const isExpired = Date.now() - stored.timestamp > DATA_EXPIRY_TIME
      return !isExpired
    }

    // Data rehydration
    const hydrate = async () => {
      try {
        const isValid = validateStoredData()
        if (!isValid) {
          console.log('Stored data is invalid or expired, clearing...')
          clearAll()
          return false
        }

        // If there is valid user data but no token, try to refresh using refreshToken
        if (userInfo.value && !accessToken.value && refreshToken.value) {
          console.log('Attempting to refresh access token...')
          // Here you can call the API to refresh the token
          // await refreshAccessToken()
        }

        return true
      } catch (error) {
        console.error('Hydration failed:', error)
        clearAll()
        return false
      }
    }

    // Get user account information from API
    const fetchAccountInfo = async () => {
      try {
        if (!accessToken.value) {
          console.warn('No access token, skipping fetchAccountInfo')
          return
        }
        
        console.log('fetchAccountInfo - fromAPIGet user information')
        
        // Call the real API to obtain user information
        const response = await getAccount() as any
        
        if (response.code === 200 && response.data) {
          const { userInfo: userData, walletInfo: walletData, walletList: walletListData, ...tokenData } = response.data
          
          // Set user information
          if (userData) {
            setUserInfo(userData)
          }
          
          // Set wallet information
          if (walletData) {
            setWalletInfo(walletData)
          }
          
          // Set wallet list
          if (walletListData) {
            setWalletList(walletListData)
          }
          
          // Update token information (if the API returns a new token)
          if (tokenData.accessToken) {
            setTokenInfo({
              accessToken: tokenData.accessToken,
              refreshToken: tokenData.refreshToken,
              tokenType: tokenData.tokenType,
              expiresIn: tokenData.expiresIn,
              scope: tokenData.scope
            })
          }
          
          console.log('✅ User information is obtained successfully (fromAPI）:', userData)
          return Promise.resolve(response.data)
        } else {
          console.error('❌ Failed to obtain user information:', response)
          return Promise.reject(new Error(response.message || 'Failed to fetch account info'))
        }
      } catch (error) {
        console.error('❌ Exception in obtaining user information:', error)
        return Promise.reject(error)
      }
    }

    return {
      // state
      account,
      userInfo,
      walletInfo,
      walletList,
      avatarColor,
      currentUserAddress,
      accessToken,
      refreshToken,
      tokenType,
      expiresIn,
      scope,
      resetPwAccessToken,
      
      // method
      setAccessToken,
      setResetPwAccessToken,
      setAccount,
      setUserInfo,
      setWalletInfo,
      setWalletList,
      setTokenInfo,
      setAvatarColor,
      clearAll,
      fetchAccountInfo,
      
      // Persistence related methods
      forcePersist,
      validateStoredData,
      hydrate
    }
  }
)
