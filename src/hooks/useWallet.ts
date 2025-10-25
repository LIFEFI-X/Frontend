import {
  useConnect,
  useDisconnect,
  useSignMessage,
  useChainId,
  useAccount,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChains
} from '@wagmi/vue'
import { ref } from 'vue'
import { useWallet as useSolanaWallet } from 'solana-wallets-vue'
import { useWalletStore } from '@/stores/wallet'
import { useNftStore } from '@/stores/nft'
import { useUserStore } from '@/stores/user'
import { useModalStore, type LoginEntryConnectType } from '@/stores/modal'
import { message } from 'ant-design-vue'
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'
import type { EvmWallet, Wallet } from '@/types/wallet'
import { bsc } from 'viem/chains'
// Add Binance Web3 Connect related imports
import { isInBinance } from '@binance/w3w-utils'
// Add Binance Web3 Connect related imports - using wagmi v1 method
import { getWagmiConnector } from '@binance/w3w-wagmi-connector'

// Constant definition to avoid repeated strings
const SIGNATURE_MESSAGE =
  'You hereby confirm that you are the owner of this connected wallet. This is a safe and gasless transaction to verify your ownership. \n\nSigning this message will not give LiFEFi permission to make transactions with your wallet.'
const WALLET_DOWNLOAD_URLS = {
  metaMaskSDK: 'https://metamask.io/download',
  okxWallet: 'https://www.okx.com/download',
  binanceWallet: 'https://www.bnbchain.org/en/binance-wallet',
  // Added download link for Binance Web3 Connect
  binanceWeb3Wallet: 'https://www.bnbchain.org/en/binance-wallet',
  coinbaseWallet: 'https://www.coinbase.com/wallet/downloads',
  walletConnect: 'https://walletconnect.com/downloads',
  Phantom: 'https://phantom.app/download',
  Solflare: 'https://solflare.com/download',
  OKX: 'https://www.okx.com/download',
  OKXWallet: 'https://www.okx.com/download',
  'OKX Wallet': 'https://www.okx.com/download',
  Binance: 'https://www.bnbchain.org/en/binance-wallet',
  Coinbase: 'https://www.coinbase.com/wallet/downloads'
}

export function useWallet() {
  const walletStore = useWalletStore()
  const nftStore = useNftStore()
  const userStore = useUserStore()
  const modalStore = useModalStore()
  const { connectAsync, connectors } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const { signMessageAsync } = useSignMessage()
  const chainId = useChainId()
  const chains = useChains()
  const account = useAccount()
  const {
    connect,
    signMessage: signMessageOfSolana,
    wallets: solanaWallets,
    wallet: solanaWallet,
    select,
    ready,
    publicKey,
    connected,
    disconnect: disconnectSolana
  } = useSolanaWallet()

  // Loading state management
  const evmWalletLoading = ref<Record<string, boolean>>({})
  const solanaWalletLoading = ref<Record<string, boolean>>({})
  const socialLoginLoading = ref<Record<string, boolean>>({})

  // Set EVM wallet loading status
  const setEvmWalletLoading = (walletType: string, loading: boolean) => {
    evmWalletLoading.value[walletType] = loading
  }

  // Set Solana wallet loading status
  const setSolanaWalletLoading = (walletName: string, loading: boolean) => {
    solanaWalletLoading.value[walletName] = loading
  }

  // Set social login loading status
  const setSocialLoginLoading = (socialType: string, loading: boolean) => {
    socialLoginLoading.value[socialType] = loading
  }

  // Get EVM wallet loading status
  const getEvmWalletLoading = (walletType: string): boolean => {
    return evmWalletLoading.value[walletType] || false
  }

  // Get Solana wallet loading status
  const getSolanaWalletLoading = (walletName: string): boolean => {
    return solanaWalletLoading.value[walletName] || false
  }

  // Get social login loading status
  const getSocialLoginLoading = (socialType: string): boolean => {
    return socialLoginLoading.value[socialType] || false
  }

  // Create Binance Web3 Connect connector factory function
  const createBinanceConnector = () => {
    const BinanceConnector = getWagmiConnector()
    return new BinanceConnector({
      chains: [...chains.value], // Use the spread operator to solve readonly problems
      options: {
        chainId: 56, // Default BSC network
        rpc: {
          1: 'https://ethereum-rpc.publicnode.com',
          56: 'https://bsc-dataseed.binance.org/'
        }
      }
    })
  }

  // Detect if you are in Binance environment
  const isBinanceEnvironment = (): boolean => {
    try {
      // Use the two officially recommended detection methods
      return isInBinance() || !!(window as any).ethereum?.isBinance
    } catch (error) {
      console.warn('Failed to detect Binance environment:', error)
      // Alternate detection method
      return !!(window as any).ethereum?.isBinance
    }
  }

  // Get Binance connector instance (use existing injected connector)
  const getBinanceConnector = () => {
    // First look for the official Binance connector from the connectors list
    const binanceConnectorFromList = connectors.find((connector: any) => {
      return (
        connector.id === 'BinanceW3WSDK' ||
        connector.id === 'wallet.binance.com' ||
        connector.name?.includes('Binance')
      )
    })

    if (binanceConnectorFromList) {
      console.log('Found Binance connector in connectors list:', binanceConnectorFromList.name)
      return binanceConnectorFromList
    }

    // If no official connector is found, return to the Binance Web3 Connect connector we created
    console.log('Using Binance Web3 Connect connector')
    return createBinanceConnector()
  }

  // RPC index cache key name
  const SOLANA_RPC_INDEX_CACHE_KEY = 'solana_rpc_index'
  const EVM_RPC_INDEX_CACHE_KEY = 'evm_rpc_index'

  // Read Solana RPC index from browser cache
  const getSolanaRpcIndexFromCache = (): number => {
    try {
      const cachedIndex = localStorage.getItem(SOLANA_RPC_INDEX_CACHE_KEY)
      if (cachedIndex !== null) {
        const index = parseInt(cachedIndex, 10)
        if (!isNaN(index) && index >= 0) {
          console.log('Loaded Solana RPC index from cache:', index)
          return index
        }
      }
    } catch (error) {
      console.warn('Failed to read Solana RPC index from cache:', error)
    }
    console.log('Using default Solana RPC index: 0')
    return 0
  }

  // Save Solana RPC index to browser cache
  const saveSolanaRpcIndexToCache = (index: number): void => {
    try {
      localStorage.setItem(SOLANA_RPC_INDEX_CACHE_KEY, index.toString())
      console.log('Saved Solana RPC index to cache:', index)
    } catch (error) {
      console.warn('Failed to save Solana RPC index to cache:', error)
    }
  }

  // Read EVM RPC index from browser cache
  const getEvmRpcIndexFromCache = (chainId: number): number => {
    try {
      const cacheKey = `${EVM_RPC_INDEX_CACHE_KEY}_${chainId}`
      const cachedIndex = localStorage.getItem(cacheKey)
      if (cachedIndex !== null) {
        const index = parseInt(cachedIndex, 10)
        if (!isNaN(index) && index >= 0) {
          console.log(`Loaded EVM RPC index from cache for chain ${chainId}:`, index)
          return index
        }
      }
    } catch (error) {
      console.warn(`Failed to read EVM RPC index from cache for chain ${chainId}:`, error)
    }
    console.log(`Using default EVM RPC index for chain ${chainId}: 0`)
    return 0
  }

  // Save EVM RPC index to browser cache
  const saveEvmRpcIndexToCache = (chainId: number, index: number): void => {
    try {
      const cacheKey = `${EVM_RPC_INDEX_CACHE_KEY}_${chainId}`
      localStorage.setItem(cacheKey, index.toString())
      console.log(`Saved EVM RPC index to cache for chain ${chainId}:`, index)
    } catch (error) {
      console.warn(`Failed to save EVM RPC index to cache for chain ${chainId}:`, error)
    }
  }

  // Solana RPC index status, used to switch RPC when retrying, the initial value is read from the cache
  const rpcIndex = ref(getSolanaRpcIndexFromCache())

  // Update Solana RPC index and save to cache
  const updateRpcIndex = (newIndex: number): void => {
    rpcIndex.value = newIndex
    saveSolanaRpcIndexToCache(newIndex)
    console.log('Updated Solana RPC index:', newIndex)
  }

  // Reset Solana RPC index function
  const resetSolanaRpcIndex = () => {
    updateRpcIndex(0)
    console.log('Solana RPC index reset to 0')
  }

  // Reset EVM RPC index function
  const resetEvmRpcIndex = (chainId: number) => {
    saveEvmRpcIndexToCache(chainId, 0)
    console.log(`EVM RPC index reset to 0 for chain ${chainId}`)
  }

  // Reset all RPC index functions (backwards compatible)
  const resetRpcIndex = () => {
    resetSolanaRpcIndex()
    // Reset the EVM RPC index of the current chain
    if (chainId.value) {
      resetEvmRpcIndex(chainId.value)
    }
    console.log('All RPC indexes reset to 0')
  }

  // Clear RPC index cache
  const clearRpcIndexCache = () => {
    try {
      // Clear Solana RPC index cache
      localStorage.removeItem(SOLANA_RPC_INDEX_CACHE_KEY)
      rpcIndex.value = 0

      // Clear all EVM RPC index caches
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith(EVM_RPC_INDEX_CACHE_KEY)) {
          localStorage.removeItem(key)
        }
      })

      console.log('All RPC index caches cleared')
    } catch (error) {
      console.warn('Failed to clear RPC index cache:', error)
    }
  }

  // Get current EVM address
  const getCurrentAddress = (): string => {
    return account.address?.value?.toString() ?? ''
  }

  // Get the encoded signed message
  const getEncodedSignatureMessage = (): Uint8Array => {
    return new TextEncoder().encode(SIGNATURE_MESSAGE)
  }

  // Set wallet information and obtain related data
  const setWallet = async (): Promise<void> => {
    try {
      // Test EVM RPC connection stability
      console.log('Testing EVM RPC connection during wallet setup...')
      try {
        const rpcProvider = await createEvmRpcProvider()
        console.log('EVM RPC connection established during setup:', rpcProvider.rpcUrl)
      } catch (rpcError) {
        console.warn('EVM RPC connection unstable during setup:', rpcError)
        message.warning('Network connection unstable, but proceeding with wallet setup...')
      }

      await walletStore.setWallet({
        chainId: chainId.value,
        address: getCurrentAddress()
      })
      message.success('Connected successful!')
      await Promise.all([
        userStore.fetchAccountInfo(),
        nftStore.fetchWalletInfo(getCurrentAddress())
      ])
    } catch (error) {
      console.error('Error setting wallet:', error)
      message.error('Failed to set wallet information')
    }
  }

  // Open the wallet download page
  const openWalletDownloadPage = (walletType: string): void => {
    const url = WALLET_DOWNLOAD_URLS[walletType as keyof typeof WALLET_DOWNLOAD_URLS]
    if (url) {
      window.open(url, '_blank')
    }
  }

  // Connect to Ethereum wallet
  const connectWallet = async (wallet: EvmWallet, type?: LoginEntryConnectType): Promise<void> => {
    // Set loading status
    setEvmWalletLoading(wallet, true)

    try {
      // Check if bound
      if (!userStore.account.walletAddress && type !== 'bind' && type !== 'login') {
        modalStore.toggleBindNewWalletModal(true)
        modalStore.setBindNewWalletType('evm')
        return
      }

      // Check if you need to switch addresses
      if (
        !!userStore.account.walletAddress &&
        !!getCurrentAddress() &&
        userStore.account.walletAddress !== getCurrentAddress()
      ) {
        return modalStore.toggleSwitchAddressModal(true)
      }

      // If the wallet plug-in is logged in but the website is not logged in, disconnect first and then log in to the website again
      if (!userStore.accessToken && getCurrentAddress()) {
        await disconnectAsync()
      }

      let connector: any

      // Special handling for Binance Web3 Connect
      if (wallet === 'binanceWeb3Wallet') {
        connector = getBinanceConnector()
        console.log('Using Binance Web3 Connect connector:', connector.name || connector.id)
      } else {
        connector = connectors.find((connector: any) => connector.id === wallet)
      }

      if (!connector) {
        message.error(`Connector ${wallet} not found`)
        return
      }
      console.log('✅ Starting EVM wallet connection:', wallet)
      console.log('🔍 Found connector:', connector.name)
      console.log('🎯 Connection type:', type)

      // Force reconnect to ensure state is in sync
      console.log('🔄 Force reconnecting for fresh state')

      // Completely disconnect everything first
      try {
        await disconnectAsync()
        await new Promise((resolve) => setTimeout(resolve, 500)) // Give enough time to disconnect
      } catch (disconnectError) {
        console.warn('Disconnect warning:', disconnectError)
      }

      // Connect wallet
      console.log('🔌 Connecting to wallet...')
      await connectAsync({ connector, chainId: chainId.value })

      // Waiting for connection status to be synchronized
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Verify connection status and get address
      console.log('🔍 Verifying connection state...')
      let currentAddress = ''
      let isValidConnection = false
      let retryCount = 0
      const maxRetries = 10

      // Use a retry mechanism to wait for an address to become available
      while (retryCount < maxRetries && !isValidConnection) {
        currentAddress = getCurrentAddress()

        console.log(`Connection attempt ${retryCount + 1}/${maxRetries}:`, {
          hasAddress: !!currentAddress,
          accountConnected: !!account.address?.value,
          address: currentAddress
        })

        if (currentAddress && account.address?.value) {
          isValidConnection = true
          console.log('✅ Valid connection state achieved:', currentAddress)
          break
        }

        retryCount++

        if (retryCount % 3 === 0) {
          console.log(`⏳ Retry ${retryCount}: Actively refreshing connection state...`)
          try {
            // Try to reacquire status
            await new Promise((resolve) => setTimeout(resolve, 300))
          } catch (refreshError) {
            console.warn('State refresh attempt failed:', refreshError)
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      }

      // Verify final connection status
      if (!isValidConnection || !currentAddress) {
        console.error('❌ Failed to establish valid connection after retries')
        console.log('Final state check:', {
          currentAddress,
          accountValue: account.address?.value,
          isValidConnection,
          retryCount
        })
        throw new Error('Failed to establish valid wallet connection')
      }

      console.log('✅ Connection verified, starting RPC test...')

      // Test EVM RPC connection
      console.log('Testing EVM RPC connection for chain:', chainId.value)
      try {
        const rpcProvider = await createEvmRpcProvider()
        console.log('✅ Successfully established EVM RPC connection:', rpcProvider.rpcUrl)
        console.log('📊 Network:', rpcProvider.networkName, 'Block:', rpcProvider.blockNumber)
      } catch (rpcError) {
        console.warn('⚠️ EVM RPC connection issues detected:', rpcError)
        message.warning('Network connection may be unstable. Some features might be affected.')
      }

      // Signature function - use verified address, refer to the processing method of verifyEvmWallet
      const signWalletMessage = async (): Promise<boolean> => {
        try {
          console.log('🖊️ Starting wallet signature with address:', currentAddress)

          // Detect Binance environment and add delay before signing
          const isBinanceEnv = isBinanceEnvironment()
          if (isBinanceEnv && (wallet === 'binanceWeb3Wallet' || wallet === 'binanceWallet')) {
            console.log('🔄 Binance environment detected, adding pre-signature delay...')
            await new Promise((resolve) => setTimeout(resolve, 1000)) // 1 second delay ensures wallet status is stable
          }

          // Using retry mechanism in Binance environment
          let signatureSuccess = false
          let retryCount = 0
          const maxRetries = isBinanceEnv ? 3 : 1

          while (!signatureSuccess && retryCount < maxRetries) {
            try {
              if (retryCount > 0) {
                console.log(
                  `🔄 Signature retry ${retryCount + 1}/${maxRetries} in Binance environment`
                )
                await new Promise((resolve) => setTimeout(resolve, 1500)) // Delay before retrying
              }

              await signMessageAsync({
                account: currentAddress as `0x${string}`,
                connector: connector,
                message: SIGNATURE_MESSAGE
              })

              signatureSuccess = true
              console.log('✅ Signature successful')
            } catch (signError: any) {
              retryCount++

              // Check if user canceled
              if (
                signError?.name === 'UserRejectedRequestError' ||
                signError?.message?.includes('User rejected') ||
                signError?.message?.includes('user rejected') ||
                signError?.message?.includes('User denied') ||
                signError?.code === 4001
              ) {
                console.log('🚫 User cancelled signature')
                throw new Error('USER_REJECTED_SIGNATURE')
              }

              // In the Binance environment, if it is not the last retry, continue to retry
              if (isBinanceEnv && retryCount < maxRetries) {
                console.log(
                  `⚠️ Signature attempt ${retryCount} failed, retrying...`,
                  signError.message
                )
                continue
              } else {
                // Non-Binance environment or last retry failed
                throw signError
              }
            }
          }

          if (!signatureSuccess) {
            throw new Error('Signature failed after multiple attempts')
          }

          // The binding/login operation is performed only after the signature is successful.
          if (!type || type === 'login' || type === 'bind') {
            console.log('✅ Signature successful, setting wallet...')
            await setWallet()
          }

          return true
        } catch (error: any) {
          console.error('❌ Signing error:', error)

          // Special handling for signature errors
          if (
            error?.name === 'UserRejectedRequestError' ||
            error?.message?.includes('User rejected') ||
            error?.message?.includes('user rejected') ||
            error?.message?.includes('User denied') ||
            error?.message?.includes('USER_REJECTED_SIGNATURE') ||
            error?.code === 4001
          ) {
            // User refuses to sign, specific error is thrown but no message is shown
            console.log('🚫 User cancelled signature')
            throw new Error('USER_REJECTED_SIGNATURE')
          } else {
            message.error('Failed to sign message')
            throw error
          }
        }
      }

      // If the chain is not supported, add the chain. If the chain is not supported, an error will be prompted. If it is supported, the signature will be added.
      const chain = chains.value.find((chain) => chain.id === connector.chainId)
      if (!chain) {
        const newChain = chains.value.find((chain) => chain.id === chainId.value)
        if (newChain) {
          try {
            console.log('🔄 Switching to supported chain:', newChain.name, newChain.id)
            console.log('🔍 Current chain ID:', chainId.value, 'Target chain ID:', newChain.id)

            // Check if it is already on the target chain
            if (chainId.value === newChain.id) {
              console.log('✅ Already on target chain, skipping switch')
            } else {
              console.log('🔄 Performing chain switch...')

              // Add timeout handling
              const switchPromise = switchChainAsync({
                connector,
                chainId: newChain.id
              })

              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Chain switch timeout')), 10000)
              )

              await Promise.race([switchPromise, timeoutPromise])
            }

            console.log('✅ Chain switch successful, proceeding with signature')
            try {
              await signWalletMessage()
            } catch (signError: any) {
              // If the user cancels, it will be processed silently.
              if (signError?.message?.includes('USER_REJECTED_SIGNATURE')) {
                console.log('🚫 User cancelled signature after chain switch')
                return
              }
              throw signError
            }
          } catch (switchError: any) {
            console.error('❌ Chain switch error:', switchError)

            // Special handling for network switching errors
            if (
              switchError?.name === 'UserRejectedRequestError' ||
              switchError?.message?.includes('User rejected') ||
              switchError?.message?.includes('user rejected') ||
              switchError?.message?.includes('User denied') ||
              switchError?.code === 4001
            ) {
              // User refuses network switching and handles silently
              console.log('🚫 User cancelled network switch')
              return
            } else {
              message.error('Network switch failed, please switch to the correct network manually')
              throw switchError
            }
          }
        } else {
          message.error('Unsupported network, please switch to the correct network')
          return
        }
      } else {
        console.log('✅ Chain already supported, proceeding with signature')
        try {
          await signWalletMessage()
        } catch (signError: any) {
          // If the user cancels, it will be processed silently.
          if (signError?.message?.includes('USER_REJECTED_SIGNATURE')) {
            console.log('🚫 User cancelled signature')
            return
          }
          throw signError
        }
      }
    } catch (error: any) {
      console.error('❌ Connection error:', error)

      // Extract error information
      const errorMessage = error?.message || 'Failed to connect wallet'
      const errorName = error?.name || error?.constructor?.name || ''

      console.log('Error details:', {
        name: errorName,
        message: errorMessage,
        code: error?.code,
        details: error?.details
      })

      // Provide different handling for different types of errors
      if (
        errorName === 'UserRejectedRequestError' ||
        errorMessage.includes('User rejected') ||
        errorMessage.includes('user rejected') ||
        errorMessage.includes('User denied') ||
        errorMessage.includes('USER_REJECTED_SIGNATURE') ||
        error?.code === 4001
      ) {
        // The user rejected the wallet operation, no error message is displayed, only the log is recorded
        console.log('🚫 User cancelled wallet operation')
        return // Process silently without displaying error prompts
      } else if (
        errorMessage.includes('Provider not found') ||
        errorMessage.includes('No provider')
      ) {
        // Wallet not installed
        console.log('📥 Wallet not installed, opening download page')
        message.error('wallet not installed')
        openWalletDownloadPage(wallet)
      } else if (
        errorMessage.includes('Already processing') ||
        errorMessage.includes('Request already pending')
      ) {
        // Repeat operation
        message.warning('Already processing')
      } else if (
        errorMessage.includes('Network Error') ||
        errorMessage.includes('Failed to fetch')
      ) {
        // network error
        message.error('Network Error please try again')
      } else if (errorMessage.includes('Connector not found')) {
        // Connector not found
        message.error(`Connector not found`)
      } else if (errorMessage.includes('Chain not supported')) {
        // The chain does not support
        message.error('Chain not supported')
      } else if (errorMessage.includes('Failed to establish valid wallet connection')) {
        // Connection status verification failed
        console.error('⚠️ Connection state verification failed')
        message.error('Failed to establish connection. Please try again.')
      } else {
        // Other unknown errors
        console.error('❌ Unexpected wallet connection error:', error)
        message.error('Failed to connect wallet. Please try again or try a different wallet.')
      }
    } finally {
      // Regardless of success or failure, clear the loading status
      setEvmWalletLoading(wallet, false)
    }
  }

  // Disconnect all wallets
  const disconnectWallet = async (): Promise<void> => {
    try {
      if (walletStore.wallet.address) {
        await disconnectAsync()
      }

      await disconnectSolana()

      // Clear all storage
      walletStore.emptyWallet()
      userStore.clearAll()

      // Reset the RPC cache and start the next connection from the first RPC
      clearRpcIndexCache()
      console.log('resetRPCCaching, the next connection starts from the first oneRPCstart')
      // message.success('Disconnected successful!')
    } catch (error) {
      console.error('Disconnect error:', error)
      message.error('Failed to disconnect wallet')
    }
  }

  // Get Phantom Wallet
  const getPhantomWallet = () => {
    // If there is already a Phantom wallet connection
    if (solanaWallet.value) {
      // If the wallet is not installed, open the download page
      if (solanaWallet.value.readyState === 'NotDetected') {
        openWalletDownloadPage('Phantom')
        return null
      }
      return solanaWallet.value
    }

    // Find Phantom Wallet
    const wallet = solanaWallets.value.find((wallet) => wallet.adapter.name === 'Phantom')
    if (!wallet) return null

    if (wallet.readyState === 'NotDetected') {
      openWalletDownloadPage('Phantom')
      return null
    } else if (wallet.readyState === 'Installed') {
      select(wallet.adapter.name)
      return wallet
    }

    return null
  }

  // Connect Phantom wallet (with timeout option)
  const connectPhantomOnly = async (
    needSignMessage: boolean = true,
    timeoutMs: number = 30000
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      console.log('Starting connection Phantom wallet, timeout time:', timeoutMs)

      // Get Phantom Wallet
      const phantomWallet = getPhantomWallet()
      if (!phantomWallet) {
        reject(new Error('Phantom wallet not installed or not available'))
        return
      }

      // Set timeout processing
      const timeout = setTimeout(() => {
        clearInterval(interval)
        console.error('Phantom connection timeout')
        reject(new Error(`Connection timeout (${timeoutMs}ms)`))
      }, timeoutMs)

      let attemptCount = 0
      const maxAttempts = 10

      // Poll until Phantom wallet connection is successful
      const interval = setInterval(async () => {
        attemptCount++
        console.log(`Connection attempt ${attemptCount}/${maxAttempts}`)
        console.log('Current status:', {
          solanaWallet: !!solanaWallet.value,
          ready: ready.value,
          connected: connected.value,
          publicKey: !!publicKey.value
        })

        if (attemptCount > maxAttempts) {
          clearInterval(interval)
          clearTimeout(timeout)
          reject(new Error('Exceeded maximum attempt times, connection failed'))
          return
        }

        if (solanaWallet.value && ready.value) {
          try {
            console.log('Starting connection...')
            await connect()

            // Wait for connection status update
            await new Promise((resolve) => setTimeout(resolve, 200))

            if (connected.value) {
              console.log('Connection successful, check if signature is needed')
              clearInterval(interval)
              clearTimeout(timeout)

              if (needSignMessage && signMessageOfSolana.value) {
                try {
                  console.log('Starting signature message')
                  await signMessageOfSolana.value(getEncodedSignatureMessage())
                  console.log('Signature successful')
                  resolve(true)
                } catch (signError) {
                  console.error('Signature failed:', signError)
                  if (signError instanceof Error && signError.message.includes('User rejected')) {
                    reject(new Error('User rejected signature request'))
                  } else {
                    reject(new Error(`Signature failed: ${(signError as Error).message}`))
                  }
                }
              } else {
                console.log('Connection completed, no signature needed')
                resolve(true)
              }
            }
          } catch (connectError) {
            console.error(`Connection attempt ${attemptCount} failed:`, connectError)
            if (attemptCount >= maxAttempts) {
              clearInterval(interval)
              clearTimeout(timeout)
              reject(new Error(`Connection failed: ${(connectError as Error).message}`))
            }
            // Continue polling
          }
        }
      }, 300)
    })
  }

  // Connect to Solana wallet (no login required)
  const connectSolanaOnly = async (wallet: Wallet): Promise<boolean> => {
    if (['NotDetected', 'Loadable'].includes(wallet.readyState)) {
      openWalletDownloadPage(wallet.adapter.name)
      throw new Error(`${wallet.adapter.name} wallet not detected`)
    }

    try {
      console.log('✅ Starting Solana wallet connection:', wallet.adapter.name)
      console.log('Wallet status:', wallet.readyState)

      // Simplify connection logic - force reconnection to ensure state is in sync
      console.log('🔄 Force reconnecting for fresh state')

      // Completely disconnect everything first
      try {
        await disconnectSolana()
        await new Promise((resolve) => setTimeout(resolve, 500)) // Give enough time to disconnect
      } catch (disconnectError) {
        console.warn('Disconnect error:', disconnectError)
      }

      // Choose and connect a new wallet
      select(wallet.adapter.name)
      await new Promise((resolve) => setTimeout(resolve, 500)) // Wait for selection to complete

      // Directly connect wallet adapter
      try {
        console.log('🔌 Connecting wallet adapter directly')
        await wallet.adapter.connect()
        await new Promise((resolve) => setTimeout(resolve, 800)) // Give more time for status to sync
      } catch (connectError) {
        console.error('❌ Direct wallet connection failed:', connectError)
        throw connectError
      }

      // Simplified state verification - get state directly from wallet adapter
      console.log('🔍 Verifying wallet connection state')
      let isValidConnection = false

      // Get status from wallet adapter first (most reliable)
      if (wallet.adapter.publicKey && wallet.adapter.connected) {
        isValidConnection = true
        console.log('✅ Valid connection from wallet adapter:', wallet.adapter.publicKey.toBase58())
      }
      // Alternative: Get from global state
      else {
        console.log('⏳ Wallet adapter state not ready, waiting for global state sync...')

        // Wait for global state to sync, but set a short timeout
        let syncRetries = 0
        const maxSyncRetries = 10

        while (syncRetries < maxSyncRetries) {
          await new Promise((resolve) => setTimeout(resolve, 300))

          if (connected.value && publicKey.value) {
            isValidConnection = true
            console.log('✅ Valid connection from global state:', publicKey.value.toBase58())
            break
          }

          syncRetries++
          console.log(`⏳ Waiting for state sync... ${syncRetries}/${maxSyncRetries}`)
        }
      }

      // Verify connection status
      if (!isValidConnection) {
        console.error('❌ Failed to establish valid wallet connection')
        console.log('Debug info:', {
          adapterConnected: wallet.adapter.connected,
          adapterPublicKey: !!wallet.adapter.publicKey,
          globalConnected: connected.value,
          globalPublicKey: !!publicKey.value
        })
        throw new Error('Connection verification failed: unable to establish valid connection')
      }

      console.log('✅ Wallet connection verified successfully')
      console.log('🎉 Connection completed successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to connect Solana wallet:', error)

      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new Error('User rejected wallet connection request')
        } else if (error.message.includes('timeout')) {
          throw new Error('Wallet connection timeout, please try again')
        } else if (error.message.includes('not found')) {
          throw new Error('Wallet not found, please ensure wallet is installed and unlocked')
        }
      }

      throw error
    }
  }

  // Connect Solana wallet and log in
  const connectSolana = async (wallet: Wallet, type?: LoginEntryConnectType): Promise<boolean> => {
    // Set loading status
    setSolanaWalletLoading(wallet.adapter.name, true)

    try {
      console.log('Starting Solana wallet connection:', wallet.adapter.name)
      console.log('Connection type:', type)
      await connectSolanaOnly(wallet)

      // Use enhanced state synchronization mechanism
      let retryCount = 0
      const maxRetries = 20
      let hasValidState = false

      while (retryCount < maxRetries && !hasValidState) {
        const currentState = {
          connected: connected.value,
          publicKey: !!publicKey.value,
          adapterPublicKey: !!wallet?.adapter?.publicKey,
          solanaWalletConnected: !!solanaWallet.value?.adapter?.connected,
          readyState: ready.value
        }

        console.log(`Login retry ${retryCount + 1}: State check:`, {
          ...currentState,
          walletAddress:
            wallet?.adapter?.publicKey?.toBase58() || publicKey.value?.toBase58() || 'none'
        })

        const hasValidPublicKey =
          publicKey.value || wallet?.adapter?.publicKey || solanaWallet.value?.adapter?.publicKey

        const isConnected =
          connected.value || wallet?.adapter?.connected || solanaWallet.value?.adapter?.connected

        if (hasValidPublicKey && isConnected) {
          console.log('Found valid state for login!')
          hasValidState = true
          break
        }

        retryCount++

        if (retryCount % 5 === 0) {
          console.log(`Login attempt ${retryCount}: Actively refreshing wallet state...`)
          try {
            if (wallet?.adapter && !wallet.adapter.connected) {
              await wallet.adapter.connect()
            }
            await new Promise((resolve) => setTimeout(resolve, 500))
          } catch (refreshError) {
            console.warn('Login state refresh attempt failed:', refreshError)
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      }

      console.log('Connection status check:')
      console.log('- connected.value:', connected.value)
      console.log('- publicKey.value:', publicKey.value)
      console.log('- wallet.adapter.publicKey:', wallet?.adapter?.publicKey?.toBase58())
      console.log('- wallet.adapter.connected:', wallet?.adapter?.connected)
      console.log('- solanaWallet.adapter.connected:', solanaWallet.value?.adapter?.connected)
      console.log('- solanaWallet.value:', solanaWallet.value)
      console.log('- retry count:', retryCount)
      console.log('- hasValidState:', hasValidState)

      // More flexible status checks
      const finalPublicKey =
        publicKey.value || wallet?.adapter?.publicKey || solanaWallet.value?.adapter?.publicKey
      const isAnyConnected =
        connected.value || wallet?.adapter?.connected || solanaWallet.value?.adapter?.connected

      if (!hasValidState && (!finalPublicKey || !isAnyConnected)) {
        throw new Error('Failed to establish valid wallet connection for login after retries')
      }

      // Check if bound
      if (!userStore.account.solanaAddress && type !== 'bind' && type !== 'login') {
        console.log('No Solana address bound, showing bind modal')
        modalStore.toggleBindNewWalletModal(true)
        modalStore.setBindNewWalletType('solana')
        return true
      }

      // Get the latest wallet address - use a confirmed valid source
      let currentAddress = ''

      // Get addresses by priority: wallet adapter > solanaWallet adapter > publicKey status
      if (wallet?.adapter?.publicKey) {
        currentAddress = wallet.adapter.publicKey.toBase58()
        console.log('Login address from wallet adapter:', currentAddress)
      } else if (solanaWallet.value?.adapter?.publicKey) {
        currentAddress = solanaWallet.value.adapter.publicKey.toBase58()
        console.log('Login address from solanaWallet adapter:', currentAddress)
      } else if (publicKey.value) {
        currentAddress = publicKey.value.toBase58()
        console.log('Login address from publicKey state:', currentAddress)
      }

      if (!currentAddress) {
        throw new Error('Failed to get wallet address from any valid source')
      }

      console.log('Current wallet address for login:', currentAddress)

      // Check if you need to switch addresses
      if (!!userStore.account.solanaAddress && userStore.account.solanaAddress !== currentAddress) {
        console.log('Address mismatch, showing switch modal')
        console.log('Expected:', userStore.account.solanaAddress)
        console.log('Actual:', currentAddress)
        modalStore.toggleSwitchAddressModal(true)
        modalStore.setSwitchAddressType('solana')
        return true
      }

      // If it is a binding type, only connection verification is performed and binding is not performed (binding is handled by the bindSolana function)
      if (type === 'bind') {
        console.log('Bind type connection, connection verified successfully')
        return true
      }

      // Perform login operation (including type === 'login' or type is empty)
      if (type === 'login' || !type) {
        console.log('Login type connection, performing signature verification before login')

        // Perform signature verification
        if (!signMessageOfSolana.value) {
          console.error('❌ No signature function available for login')
          throw new Error('Signature function not available')
        }

        try {
          console.log('🖊️ Starting signature verification for login')
          await signMessageOfSolana.value(getEncodedSignatureMessage())
          console.log('✅ Signature successful, proceeding with login')

          // Execute login after successful signature
          await walletStore.loginSolanaWallet(currentAddress)
          message.success('Solana wallet connected successfully')
          return true
        } catch (signError: any) {
          console.error('❌ Signature verification failed for login:', signError)

          // Check if the user rejected the operation
          if (
            signError?.message?.includes('User rejected') ||
            signError?.message?.includes('user rejected') ||
            signError?.message?.includes('User cancelled') ||
            signError?.name?.includes('WalletSignMessageError') ||
            signError?.code === 4001
          ) {
            console.log('🚫 User cancelled signature for login')
            throw new Error('USER_REJECTED_SIGNATURE')
          }

          throw signError
        }
      }

      // Other types of connections also return success
      console.log('Other type connection completed successfully')
      return true
    } catch (error) {
      console.error('Failed to connect Solana wallet:', error)

      // Check whether the user refuses to sign, if so, handle it silently
      if (error instanceof Error && error.message.includes('USER_REJECTED_SIGNATURE')) {
        console.log('🚫 User cancelled Solana wallet signature')
        return false
      }

      // const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      message.error('Wallet loading, please refresh if it fails.')
      throw error
    } finally {
      // Regardless of success or failure, clear the loading status
      setSolanaWalletLoading(wallet.adapter.name, false)
    }
  }

  // Bind Solana wallet
  const bindSolana = async (wallet: Wallet): Promise<boolean> => {
    // Set loading status
    setSolanaWalletLoading(wallet.adapter.name, true)

    try {
      console.log('Starting Solana wallet binding:', wallet.adapter.name)
      await connectSolanaOnly(wallet)

      // Use enhanced state synchronization mechanism
      let retryCount = 0
      const maxRetries = 20
      let hasValidState = false

      while (retryCount < maxRetries && !hasValidState) {
        const currentState = {
          connected: connected.value,
          publicKey: !!publicKey.value,
          adapterPublicKey: !!wallet?.adapter?.publicKey,
          solanaWalletConnected: !!solanaWallet.value?.adapter?.connected,
          readyState: ready.value
        }

        console.log(`Bind retry ${retryCount + 1}: State check:`, {
          ...currentState,
          walletAddress:
            wallet?.adapter?.publicKey?.toBase58() || publicKey.value?.toBase58() || 'none'
        })

        const hasValidPublicKey =
          publicKey.value || wallet?.adapter?.publicKey || solanaWallet.value?.adapter?.publicKey

        const isConnected =
          connected.value || wallet?.adapter?.connected || solanaWallet.value?.adapter?.connected

        if (hasValidPublicKey && isConnected) {
          console.log('Found valid state for binding!')
          hasValidState = true
          break
        }

        retryCount++

        if (retryCount % 5 === 0) {
          console.log(`Bind attempt ${retryCount}: Actively refreshing wallet state...`)
          try {
            if (wallet?.adapter && !wallet.adapter.connected) {
              await wallet.adapter.connect()
            }
            await new Promise((resolve) => setTimeout(resolve, 500))
          } catch (refreshError) {
            console.warn('Bind state refresh attempt failed:', refreshError)
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      }

      console.log('Pre-binding status check:')
      console.log('- connected.value:', connected.value)
      console.log('- publicKey.value:', publicKey.value)
      console.log('- wallet.adapter.publicKey:', wallet?.adapter?.publicKey?.toBase58())
      console.log('- wallet.adapter.connected:', wallet?.adapter?.connected)
      console.log('- solanaWallet.adapter.connected:', solanaWallet.value?.adapter?.connected)
      console.log('- retry count:', retryCount)
      console.log('- hasValidState:', hasValidState)

      // More flexible status checks
      const finalPublicKey =
        publicKey.value || wallet?.adapter?.publicKey || solanaWallet.value?.adapter?.publicKey
      const isAnyConnected =
        connected.value || wallet?.adapter?.connected || solanaWallet.value?.adapter?.connected

      if (!hasValidState && (!finalPublicKey || !isAnyConnected)) {
        throw new Error('Failed to establish valid wallet connection for binding after retries')
      }

      // Get the latest wallet address - use a confirmed valid source
      let currentAddress = ''

      // Get addresses by priority: wallet adapter > solanaWallet adapter > publicKey status
      if (wallet?.adapter?.publicKey) {
        currentAddress = wallet.adapter.publicKey.toBase58()
        console.log('Binding address from wallet adapter:', currentAddress)
      } else if (solanaWallet.value?.adapter?.publicKey) {
        currentAddress = solanaWallet.value.adapter.publicKey.toBase58()
        console.log('Binding address from solanaWallet adapter:', currentAddress)
      } else if (publicKey.value) {
        currentAddress = publicKey.value.toBase58()
        console.log('Binding address from publicKey state:', currentAddress)
      }

      if (!currentAddress) {
        throw new Error('Failed to get wallet address for binding from any valid source')
      }

      // Perform signature verification
      if (!signMessageOfSolana.value) {
        console.error('❌ No signature function available for binding')
        throw new Error('Signature function not available')
      }

      try {
        console.log('🖊️ Starting signature verification for binding')
        await signMessageOfSolana.value(getEncodedSignatureMessage())
        console.log('✅ Signature successful, proceeding with binding')

        // Execute binding after successful signature
        await walletStore.bindSolanaWallet(currentAddress)
        message.success('Bind successful!')
        return true
      } catch (signError: any) {
        console.error('❌ Signature verification failed for binding:', signError)

        // Check if the user rejected the operation
        if (
          signError?.message?.includes('User rejected') ||
          signError?.message?.includes('user rejected') ||
          signError?.message?.includes('User cancelled') ||
          signError?.name?.includes('WalletSignMessageError') ||
          signError?.code === 4001
        ) {
          console.log('🚫 User cancelled signature for binding')
          throw new Error('USER_REJECTED_SIGNATURE')
        }

        throw signError
      }
    } catch (error) {
      console.error('Failed to bind Solana wallet:', error)

      // Check whether the user refuses to sign, if so, handle it silently
      if (error instanceof Error && error.message.includes('USER_REJECTED_SIGNATURE')) {
        console.log('🚫 User cancelled Solana wallet signature for binding')
        return false
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      message.error('Failed to bind Solana wallet: ' + errorMessage)
      throw error
    } finally {
      // Regardless of success or failure, clear the loading status
      setSolanaWalletLoading(wallet.adapter.name, false)
    }
  }

  // EVM wallet signature verification (only for identity verification, not binding)
  const verifyEvmWallet = async (wallet: EvmWallet): Promise<boolean> => {
    // Set loading status
    setEvmWalletLoading(wallet, true)

    try {
      console.log('✅ Starting EVM wallet verification:', wallet)

      // Find the corresponding connector
      const connector = connectors.find(
        (c) => c.id === wallet || c.name.toLowerCase().includes(wallet.toLowerCase())
      )
      if (!connector) {
        console.error('❌ Connector not found for wallet:', wallet)
        return false
      }

      console.log('🔍 Found connector:', connector.name)

      // Force reconnect to ensure state is in sync
      console.log('🔄 Force reconnecting for fresh state')

      // Completely disconnect everything first
      try {
        await disconnectAsync()
        await new Promise((resolve) => setTimeout(resolve, 500)) // Give enough time to disconnect
      } catch (disconnectError) {
        console.warn('Disconnect warning:', disconnectError)
      }

      // Connect wallet
      console.log('🔌 Connecting to wallet...')
      await connectAsync({ connector, chainId: chainId.value })

      // Waiting for connection status to be synchronized
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Verify connection status and get address
      console.log('🔍 Verifying connection state...')
      let currentAddress = ''
      let isValidConnection = false
      let retryCount = 0
      const maxRetries = 10

      // Use a retry mechanism to wait for an address to become available
      while (retryCount < maxRetries && !isValidConnection) {
        currentAddress = getCurrentAddress()

        console.log(`Verification attempt ${retryCount + 1}/${maxRetries}:`, {
          hasAddress: !!currentAddress,
          accountConnected: !!account.address?.value,
          address: currentAddress
        })

        if (currentAddress && account.address?.value) {
          isValidConnection = true
          console.log('✅ Valid connection state achieved:', currentAddress)
          break
        }

        retryCount++

        if (retryCount % 3 === 0) {
          console.log(`⏳ Retry ${retryCount}: Actively refreshing connection state...`)
          try {
            // Try to reacquire status
            await new Promise((resolve) => setTimeout(resolve, 300))
          } catch (refreshError) {
            console.warn('State refresh attempt failed:', refreshError)
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      }

      // Verify final connection status
      if (!isValidConnection || !currentAddress) {
        console.error('❌ Failed to establish valid connection after retries')
        console.log('Final state check:', {
          currentAddress,
          accountValue: account.address?.value,
          isValidConnection,
          retryCount
        })
        return false
      }

      console.log('✅ Connection verified, starting RPC test...')

      // Test EVM RPC connection
      try {
        const rpcProvider = await createEvmRpcProvider()
        console.log('✅ EVM RPC connection verified:', rpcProvider.rpcUrl)
      } catch (rpcError) {
        console.warn('⚠️ EVM RPC connection unstable, but continuing:', rpcError)
        // Do not throw an error and continue the verification process
      }

      // Perform signature verification
      console.log('🖊️ Starting signature verification with address:', currentAddress)
      try {
        await signMessageAsync({
          account: currentAddress as `0x${string}`,
          connector: connector,
          message: SIGNATURE_MESSAGE
        })
        console.log('✅ EVM wallet signature verification successful')
        return true
      } catch (signError: any) {
        console.error('❌ EVM wallet signing error:', signError)

        // Check if the user rejected the operation
        if (
          signError?.name === 'UserRejectedRequestError' ||
          signError?.message?.includes('User rejected') ||
          signError?.message?.includes('user rejected') ||
          signError?.message?.includes('User cancelled') ||
          signError?.message?.includes('USER_REJECTED_SIGNATURE') ||
          signError?.code === 4001
        ) {
          // The user refuses the operation and handles it silently.
          console.log('🚫 User cancelled EVM wallet verification')
          return false
        }

        console.error('❌ Unexpected signing error:', signError)
        return false
      }
    } catch (error: any) {
      console.error('❌ EVM wallet verification failed:', error)
      const errorMessage = error?.message || 'Failed to verify EVM wallet'

      // Check if the user rejected the operation
      if (
        error?.name === 'UserRejectedRequestError' ||
        error?.message?.includes('User rejected') ||
        error?.message?.includes('user rejected') ||
        error?.message?.includes('User cancelled') ||
        error?.code === 4001
      ) {
        // The user refuses the operation and handles it silently.
        console.log('🚫 User cancelled EVM wallet verification')
        return false
      }

      if (errorMessage.includes('Provider not found')) {
        console.log('📥 Opening wallet download page')
        openWalletDownloadPage(wallet)
      }

      return false
    } finally {
      // Regardless of success or failure, clear the loading status
      setEvmWalletLoading(wallet, false)
    }
  }

  // Solana wallet signature verification (only for authentication, no binding)
  const verifySolanaWallet = async (
    wallet: Wallet
  ): Promise<{ success: boolean; address?: string }> => {
    // Set loading status
    setSolanaWalletLoading(wallet.adapter.name, true)

    try {
      console.log('Starting Solana wallet verification:', wallet.adapter.name)

      // Check if wallet is available
      if (['NotDetected', 'Loadable'].includes(wallet.readyState)) {
        openWalletDownloadPage(wallet.adapter.name)
        return { success: false }
      }

      // Simplify connection logic - force reconnection to ensure state is in sync
      console.log('Force reconnecting wallet for fresh state')

      // Completely disconnect everything first
      try {
        await disconnectSolana()
        await new Promise((resolve) => setTimeout(resolve, 500)) // Give enough time to disconnect
      } catch (disconnectError) {
        console.warn('Disconnect error:', disconnectError)
      }

      // Choose and connect a new wallet
      select(wallet.adapter.name)
      await new Promise((resolve) => setTimeout(resolve, 500)) // Wait for selection to complete

      // Connect directly to wallet adapter for more direct control
      try {
        console.log('Connecting wallet adapter directly')
        await wallet.adapter.connect()
        await new Promise((resolve) => setTimeout(resolve, 800)) // Give more time for status to sync
      } catch (connectError) {
        console.error('Direct wallet connection failed:', connectError)
        return { success: false }
      }

      // Simplified state verification - get state directly from wallet adapter
      console.log('Verifying wallet connection state')
      let currentAddress = ''
      let isValidConnection = false

      // Get status from wallet adapter first (most reliable)
      if (wallet.adapter.publicKey && wallet.adapter.connected) {
        currentAddress = wallet.adapter.publicKey.toBase58()
        isValidConnection = true
        console.log('✅ Valid state from wallet adapter:', currentAddress)
      }
      // Alternative: Get from global state
      else {
        console.log('Wallet adapter state not ready, waiting for global state sync...')

        // Wait for global state to sync, but set a short timeout
        let syncRetries = 0
        const maxSyncRetries = 10

        while (syncRetries < maxSyncRetries) {
          await new Promise((resolve) => setTimeout(resolve, 300))

          if (connected.value && publicKey.value) {
            currentAddress = publicKey.value.toBase58()
            isValidConnection = true
            console.log('✅ Valid state from global state:', currentAddress)
            break
          }

          syncRetries++
          console.log(`Waiting for state sync... ${syncRetries}/${maxSyncRetries}`)
        }
      }

      // Verify connection status
      if (!isValidConnection || !currentAddress) {
        console.error('❌ Failed to establish valid wallet connection')
        console.log('Debug info:', {
          adapterConnected: wallet.adapter.connected,
          adapterPublicKey: !!wallet.adapter.publicKey,
          globalConnected: connected.value,
          globalPublicKey: !!publicKey.value,
          currentAddress
        })
        return { success: false }
      }

      console.log('✅ Wallet connection verified, proceeding with signature')

      // Perform signature verification
      if (!signMessageOfSolana.value) {
        console.error('❌ No signature function available')
        return { success: false }
      }

      console.log('🖊️ Starting signature verification')
      try {
        await signMessageOfSolana.value(getEncodedSignatureMessage())
        console.log('✅ Signature verification successful')
        return { success: true, address: currentAddress }
      } catch (signError: any) {
        console.error('❌ Signature verification failed:', signError)

        // Check if the user rejected the operation
        if (
          signError?.message?.includes('User rejected') ||
          signError?.message?.includes('user rejected') ||
          signError?.message?.includes('User cancelled') ||
          signError?.name?.includes('WalletSignMessageError') ||
          signError?.code === 4001
        ) {
          console.log('🚫 User cancelled signature')
          return { success: false }
        }

        return { success: false }
      }
    } catch (error) {
      console.error('❌ Solana wallet verification failed:', error)

      // Check if the user rejected the operation
      if (error instanceof Error) {
        if (
          error.message.includes('User rejected') ||
          error.message.includes('user rejected') ||
          error.message.includes('User cancelled') ||
          error.message.includes('USER_REJECTED_SIGNATURE')
        ) {
          console.log('🚫 User cancelled wallet verification')
          return { success: false }
        }
      }

      return { success: false }
    } finally {
      // Regardless of success or failure, clear the loading status
      setSolanaWalletLoading(wallet.adapter.name, false)
    }
  }

  // Check in using Phantom Wallet
  const checkInWithPhantom = async (): Promise<string> => {
    try {
      // Check whether to bind Solana wallet
      console.log('Starting Phantom check-in process')
      console.log('userStore.account.solanaAddress', userStore.account.solanaAddress)
      if (!userStore.account.solanaAddress) {
        modalStore.toggleBindNewWalletModal(true)
        modalStore.setBindNewWalletType('solana')
        throw new Error('Please bind your Solana wallet first')
      }

      console.log('Connection status check:')
      console.log('- connected.value:', connected.value)
      console.log('- publicKey.value:', publicKey.value)
      console.log('- solanaWallet.value:', !!solanaWallet.value)
      console.log('- ready.value:', ready.value)

      // Check if Solana wallet is connected
      if (!connected.value || !publicKey.value) {
        console.warn('Phantom wallet not connected or publicKey not available')
        modalStore.toggleLoginEntryModal(true)
        modalStore.setLoginEntryConnectType('connect')
        modalStore.setLoginEntryType('solana')
        throw new Error('Phantom wallet not connected or public key not available')
      }

      console.log('Address matching check:')
      console.log('- userStore.account.solanaAddress:', userStore.account.solanaAddress)
      console.log('- publicKey.value.toBase58():', publicKey.value.toBase58())

      // Check whether the bound wallet address is correct
      if (
        !!userStore.account.solanaAddress &&
        !!publicKey.value.toBase58() &&
        userStore.account.solanaAddress !== publicKey.value.toBase58()
      ) {
        console.warn('Wallet address not matched')
        modalStore.toggleSwitchAddressModal(true)
        modalStore.setSwitchAddressType('solana')
        throw new Error('Please switch to the correct wallet')
      }

      console.log('All checks passed, starting check-in processing...')
      // show loading status
      message.loading({ content: 'Processing check-in...', key: 'checkInStatus' })

      // Function to verify node synchronization status
      const validateNodeSync = async (
        connection: Connection,
        rpcEndpoint: string
      ): Promise<boolean> => {
        try {
          const MAX_SLOT_DIFFERENCE = 50 // Maximum slot difference allowed
          const VALIDATION_TIMEOUT = 3000 // Verification timeout (milliseconds)

          console.log(`🔍 Validating node sync status for: ${rpcEndpoint}`)

          // Add timeout control using Promise.race
          const slotValidation = Promise.race([
            connection.getSlot('confirmed'),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Slot validation timeout')), VALIDATION_TIMEOUT)
            )
          ]) as Promise<number>

          const currentSlot = await slotValidation
          console.log(`📍 Current slot from ${rpcEndpoint}: ${currentSlot}`)

          // There are multiple RPCs that can be compared to other RPC slots
          // Check whether slot is a valid number and not 0
          if (!currentSlot || currentSlot <= 0) {
            console.warn(`❌ Invalid slot received: ${currentSlot}`)
            return false
          }

          // Reference RPC comparison
          const referenceSlot = await getReferenceSlot(rpcEndpoint)
          if (referenceSlot && Math.abs(currentSlot - referenceSlot) > MAX_SLOT_DIFFERENCE) {
            console.warn(
              `❌ Node is behind by ${referenceSlot - currentSlot} slots (max allowed: ${MAX_SLOT_DIFFERENCE})`
            )
            return false
          }

          console.log(`✅ Node sync validation passed for: ${rpcEndpoint}`)
          return true
        } catch (error) {
          console.error(`❌ Node sync validation failed for ${rpcEndpoint}:`, error)
          return false
        }
      }

      // Get reference slot
      const getReferenceSlot = async (excludeRpc: string): Promise<number | null> => {
        try {
          const VITE_APP_SOLANA_RPCS_STRING = import.meta.env.VITE_APP_SOLANA_RPCS_STRING
          const rpcEndpoints = VITE_APP_SOLANA_RPCS_STRING.split(',').filter(
            (rpc: string) => rpc !== excludeRpc
          )

          if (rpcEndpoints.length === 0) return null

          // Try to get the slot from the first other available RPC
          for (const rpc of rpcEndpoints.slice(0, 2)) {
            // Try up to 2 reference RPCs
            try {
              const referenceConnection = new Connection(rpc as string, 'confirmed')
              const referenceSlot = (await Promise.race([
                referenceConnection.getSlot('confirmed'),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Reference slot timeout')), 2000)
                )
              ])) as Promise<number>

              console.log(`📊 Reference slot from ${rpc}: ${referenceSlot}`)
              return referenceSlot
            } catch (error) {
              console.warn(`Failed to get reference slot from ${rpc}:`, error)
              continue
            }
          }

          return null
        } catch (error) {
          console.error('Error getting reference slot:', error)
          return null
        }
      }

      // Create a Solana connection - configure RPC according to the environment, support trying from the specified index
      const createConnection = async (startIndex: number = 0) => {
        const VITE_APP_SOLANA_RPCS_STRING = import.meta.env.VITE_APP_SOLANA_RPCS_STRING
        const rpcEndpoints = VITE_APP_SOLANA_RPCS_STRING.split(',')

        // Starting from the specified index, try all RPC endpoints
        const totalEndpoints = rpcEndpoints.length
        let successfulRpc = ''

        for (let i = 0; i < totalEndpoints; i++) {
          const currentIndex = (startIndex + i) % totalEndpoints
          const rpc = rpcEndpoints[currentIndex]

          try {
            console.log(`Trying RPC endpoint [${currentIndex}]: ${rpc}`)
            const connection = new Connection(rpc, 'confirmed')

            // Based on official documentation rate limits, add request interval to avoid 429 errors
            await new Promise((resolve) => setTimeout(resolve, 100))

            // Verify node sync status - check if node is lagging behind
            const isNodeSynced = await validateNodeSync(connection, rpc)
            if (!isNodeSynced) {
              console.warn(
                `RPC [${currentIndex}] ${rpc} is behind or not synced, trying next endpoint`
              )
              continue
            }

            // Test that the connection is valid - use confirmed commitment level for improved stability
            const result = await connection.getLatestBlockhash('confirmed')
            console.log(`Successfully connected to: ${rpc}`)
            console.log(`📊 Latest blockhash: ${result.blockhash}`)
            console.log(`🔢 Last valid block height: ${result.lastValidBlockHeight}`)

            successfulRpc = rpc
            // Update the RPC index to the next index of a successful connection for the next retry.
            const nextIndex = (currentIndex + 1) % totalEndpoints
            updateRpcIndex(nextIndex)

            return {
              connection,
              blockhash: result.blockhash,
              lastValidBlockHeight: result.lastValidBlockHeight,
              rpcEndpoint: rpc,
              rpcIndex: currentIndex
            }
          } catch (error) {
            console.warn(`Failed to connect to RPC [${currentIndex}] ${rpc}:`, error)
            continue
          }
        }
        throw new Error('Unable to connect to any Solana RPC endpoint')
      }

      const { connection, blockhash, lastValidBlockHeight, rpcEndpoint } = await createConnection(
        rpcIndex.value
      )
      console.log(`Using RPC endpoint: ${rpcEndpoint}`)

      // Instructions for creating a Memo program
      const memoProgram = new PublicKey('FT76o9KjJCXuznwVy699ebwQkDsCxXhbAauoUQH4hov8')
      const checkInMessage = `lifefi Daily Check-in on Solana!`

      const instruction = new TransactionInstruction({
        keys: [],
        programId: memoProgram,
        data: Buffer.from(checkInMessage)
      })

      // Create transaction
      const transaction = new Transaction().add(instruction)

      transaction.recentBlockhash = blockhash
      transaction.lastValidBlockHeight = lastValidBlockHeight
      transaction.feePayer = publicKey.value

      // Send transaction for signature
      console.log('🖊️ Starting transaction signing...')
      const signedTx = await (solanaWallet.value?.adapter as any).signTransaction(transaction)
      if (!signedTx) {
        message.destroy('checkInStatus')
        message.error('Transaction signing failed')
        throw new Error('Transaction signing failed')
      }
      console.log('✅ Transaction signed successfully')

      // Send transaction and wait for confirmation
      console.log('📤 Sending transaction to network...')
      message.loading({ content: 'Sending transaction...', key: 'checkInStatus' })

      // Use confirmed commitment level to balance speed and security as recommended by Solana RPC documentation
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3 // Increase the number of retries to handle network fluctuations
      })
      console.log('📝 Transaction signature:', signature)

      // Wait for transaction confirmation
      console.log('⏳ Waiting for transaction confirmation...')
      message.loading({ content: 'Confirming transaction...', key: 'checkInStatus' })

      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: blockhash,
          lastValidBlockHeight: lastValidBlockHeight
        },
        'confirmed'
      )

      console.log('🎉 Transaction confirmation result:', confirmation)

      if (confirmation.value.err) {
        message.destroy('checkInStatus')
        message.error(`Transaction failed: ${confirmation.value.err}`)
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
      }

      message.destroy('checkInStatus')
      message.success('Check-in Success!')
      console.log('✅ Check-in completed successfully with signature:', signature)

      // After success, reset the RPC index and start from the first RPC next time
      resetSolanaRpcIndex()

      return signature
    } catch (error: unknown) {
      console.error('❌ Check-in failed:', error)
      message.destroy('checkInStatus')

      // More detailed error handling - best practices based on Solana RPC official documentation
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('User rejected')) {
        message.warning('Transaction was cancelled by user')
      } else if (
        errorMessage.includes('insufficient funds') ||
        errorMessage.includes('Attempt to debit an account')
      ) {
        message.error(
          'Insufficient SOL balance for transaction fee. Please add SOL to your wallet.'
        )
      } else if (
        errorMessage.includes('429') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('Too Many Requests')
      ) {
        message.error('Rate limit exceeded. Please wait a moment before trying again.')
      } else if (
        errorMessage.includes('403') ||
        errorMessage.includes('Forbidden') ||
        errorMessage.includes('blocked')
      ) {
        message.error('Access blocked by RPC provider. Please try again later.')
      } else if (
        errorMessage.includes('Node is behind') ||
        errorMessage.includes('Simulation failed')
      ) {
        message.error(
          'Network node is lagging. Please try again in a moment. Click the check-in button again to retry with a different RPC.'
        )
      } else if (errorMessage.includes('blockhash not found') || errorMessage.includes('expired')) {
        message.error('Transaction expired. Please try again to retry with the next RPC.')
      } else if (errorMessage.includes('RPC') || errorMessage.includes('network')) {
        message.error('Network connection error. Please try again to retry with a different RPC.')
      } else if (errorMessage.includes('Transaction failed')) {
        message.error(
          'Transaction confirmation failed. Please try again to retry with the next RPC.'
        )
      } else {
        message.error(
          `Check-in failed: ${errorMessage || 'Unknown error'} .If the click does not take effect, you can try clicking again`
        )
      }

      throw error
    }
  }

  // Define constants
  const EVM_NETWORK_CONFIG = {
    production: {
      chainId: bsc.id,
      networkName: 'BSC Mainnet'
    },
    development: {
      chainId: bsc.id,
      networkName: 'BSC Mainnet'
    }
  }

  // Create EVM RPC Provider (supports multiple RPC endpoints and caching)
  const createEvmRpcProvider = async (startIndex?: number) => {
    // Detect environment and chain ID
    const currentChainId = chainId.value
    const appEnv = import.meta.env.VITE_APP_ENV
    const isProduction = appEnv === 'production'

    console.log('🌐 EVM Environment Detection:')
    console.log('- VITE_APP_ENV:', appEnv)
    console.log('- Current Chain ID:', currentChainId)
    console.log('- Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT')

    let rpcEndpoints: string[] = []
    let networkName = ''

    // Configure different RPC endpoints based on the current chain ID
    if (currentChainId === 1) {
      // Ethereum mainnet RPC endpoint list
      networkName = 'Ethereum Mainnet'
      rpcEndpoints = import.meta.env.VITE_APP_ETH_RPCS.split(',')
    } else if (currentChainId === 56) {
      // BSC mainnet RPC endpoint list
      networkName = 'BSC Mainnet'
      rpcEndpoints = import.meta.env.VITE_APP_BSC_RPCS.split(',')
    } else {
      // For other chain IDs, use common configuration
      networkName = `Chain ${currentChainId}`
      rpcEndpoints = import.meta.env.VITE_APP_ETH_RPCS.split(',') // Default fallback
    }

    console.log(`Testing ${networkName} RPC endpoints...`)

    // Get the cached RPC index, or use the index passed in, or use the default value of 0
    const cachedIndex = getEvmRpcIndexFromCache(currentChainId)
    const initialIndex = startIndex !== undefined ? startIndex : cachedIndex
    const totalEndpoints = rpcEndpoints.length

    // Starting from the specified index, try all RPC endpoints
    for (let i = 0; i < totalEndpoints; i++) {
      const currentIndex = (initialIndex + i) % totalEndpoints
      const rpcUrl = rpcEndpoints[currentIndex]

      try {
        console.log(`Trying ${networkName} RPC endpoint [${currentIndex}]: ${rpcUrl}`)

        // Test RPC connection
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          }),
          signal: AbortSignal.timeout(5000) // 5 seconds timeout
        })

        if (response.ok) {
          const result = await response.json()
          if (result.result) {
            const blockNumber = parseInt(result.result, 16)
            console.log(`Successfully connected to ${networkName} RPC: ${rpcUrl}`)
            console.log(`Current block number: ${blockNumber}`)

            // Update EVM RPC index to next for retries
            const nextIndex = (currentIndex + 1) % totalEndpoints
            saveEvmRpcIndexToCache(currentChainId, nextIndex)

            return {
              rpcUrl,
              chainId: currentChainId,
              networkName,
              blockNumber,
              rpcIndex: currentIndex
            }
          }
        }

        console.warn(
          `${networkName} RPC endpoint [${currentIndex}] ${rpcUrl} returned invalid response`
        )
      } catch (error) {
        console.warn(`Failed to connect to ${networkName} RPC [${currentIndex}] ${rpcUrl}:`, error)
        continue
      }
    }

    throw new Error(`Unable to connect to any ${networkName} RPC endpoint`)
  }

  // Get the current EVM environment configuration
  const getCurrentEVMNetwork = () => {
    const isProduction = import.meta.env.VITE_APP_ENV === 'production'
    return isProduction ? EVM_NETWORK_CONFIG.production : EVM_NETWORK_CONFIG.development
  }

  const {
    data: checkInHash,
    writeContractAsync,
    reset,
    isSuccess: isCheckInSuccess
  } = useWriteContract()
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: checkInReceipt
  } = useWaitForTransactionReceipt({
    confirmations: 1,
    hash: checkInHash,
    query: {
      enabled: !!checkInHash && isCheckInSuccess
    }
  })


  return {
    connectors,
    solanaWallets,
    connectWallet,
    disconnectWallet,
    connectSolana,
    bindSolana,
    checkInWithPhantom,
    connectPhantomOnly,
    verifyEvmWallet,
    verifySolanaWallet,
    createEvmRpcProvider,
    resetRpcIndex,
    resetSolanaRpcIndex,
    resetEvmRpcIndex,
    clearRpcIndexCache,
    // Add Binance Web3 Connect related functions
    isBinanceEnvironment,
    getBinanceConnector,
    evmWalletLoading,
    solanaWalletLoading,
    socialLoginLoading,
    setEvmWalletLoading,
    setSolanaWalletLoading,
    setSocialLoginLoading,
    getEvmWalletLoading,
    getSolanaWalletLoading,
    getSocialLoginLoading
  }
}
