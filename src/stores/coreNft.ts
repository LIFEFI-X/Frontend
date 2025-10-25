import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  coreNftManager, 
  type CoreNftConfig, 
} from '@/utils/coreNft'

export const useCoreNftStore = defineStore('coreNft', () => {
  // state
  const platformCollection = ref<string | undefined>(undefined)
  const activeListings = ref<[]>([])
  const userListings = ref<[]>([])
  const userNfts = ref<any[]>([])
  const selectedNft = ref<any>(null)
  const isLoading = ref(false)

  // Create a platform collection
  async function createPlatformCollection(config: {
    name: string
    uri: string
    symbol?: string
  }) {
    try {
      isLoading.value = true
      const result = await coreNftManager.createPlatformCollection(config)
      
      if (result.success && result.collection) {
        platformCollection.value = result.collection
        return { success: true, message: 'Platform collection created successfully' }
      }
      
      return { success: false, message: 'Creation failed', error: result.error }
    } catch (error) {
      console.error('Error creating platform collection:', error)
      return { success: false, message: 'Failed to create platform collection', error }
    } finally {
      isLoading.value = false
    }
  }

  // Create user NFT (0% royalties)
  async function createUserNft(config: CoreNftConfig) {
    try {
      isLoading.value = true
      const result = await coreNftManager.createUserNft(config)
      
      if (result.success) {
        return { 
          success: true, 
          message: 'NFT Created successfully (0% royalties)',
          asset: result.asset 
        }
      }
      
      return { success: false, message: 'Creation failed', error: result.error }
    } catch (error) {
      console.error('create NFT mistake:', error)
      return { success: false, message: 'create NFT fail', error }
    } finally {
      isLoading.value = false
    }
  }


  // Buy NFT - Complete Transaction Process
  async function buyNft(
    assetAddress: string, 
    price: number, 
    sellerAddress: string,
    royaltyPercentage: number = 5
  ) {
    try {
      isLoading.value = true
      const result = await coreNftManager.buyNft(
        assetAddress, 
        price, 
        sellerAddress,
        royaltyPercentage
      )
      
      if (result.success) {
        // Refresh pending order list
        return { 
          success: true, 
          message: `NFT purchased for ${price} SOL!`,
          breakdown: result.breakdown,
          signature: result.signature
        }
      }
      
      return { success: false, message: 'Purchase failed', error: result.error }
    } catch (error) {
      console.error('Buy NFT mistake:', error)
      return { success: false, message: 'Buy NFT fail', error }
    } finally {
      isLoading.value = false
    }
  }


  // Generic method to create UMI instance
  async function createUmiInstance() {
    const wallet = useWallet()
    
    console.log('🔍 Creating UMI instance...')
    console.log('- wallet connected:', wallet.connected.value)
    console.log('- wallet value:', !!wallet.wallet.value)
    console.log('- adapter:', !!wallet.wallet.value?.adapter)
    
    if (!wallet.connected.value) {
      throw new Error('Wallet not connected')
    }
    
    if (!wallet.wallet.value?.adapter) {
      throw new Error('Wallet adapter not available')
    }
    
    const { createUmi } = await import('@metaplex-foundation/umi-bundle-defaults')
    const { walletAdapterIdentity } = await import('@metaplex-foundation/umi-signer-wallet-adapters')
    
    // Create UMI instance
    const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    const umi = createUmi(RPC_URL)
    
    // Set wallet identity
    umi.use(walletAdapterIdentity(wallet.wallet.value.adapter))
    
    console.log('✅ UMI instance created successfully')
    return umi
  }

  // Create a Transfer Delegate authorization for the bidder
  async function approveTransferDelegate(assetAddress: string, bidderAddress: string) {
    try {
      isLoading.value = true
      console.log('🔐 Creating transfer delegate authorization...')
      console.log('- Asset:', assetAddress)
      console.log('- Bidder:', bidderAddress)
      
      const { publicKey } = await import('@metaplex-foundation/umi')
      const { approvePluginAuthority, addPlugin, fetchAssetV1 } = await import('@metaplex-foundation/mpl-core')
      
      // Create UMI instance
      const umi = await createUmiInstance()
      
      // First check the NFT and permissions
      console.log('🔍 Checking NFT and permissions...')
      const asset = await fetchAssetV1(umi, publicKey(assetAddress))
      
      console.log('📋 NFT Information:')
      console.log('- Owner:', asset.owner.toString())
      console.log('- Current user:', umi.identity.publicKey.toString())
      console.log('- Update authority:', asset.updateAuthority)
      console.log('- Transfer delegate exists:', !!asset.transferDelegate)
      console.log('- Frozen:', asset.freezeDelegate?.frozen || false)
      
      // Check if you are the NFT owner
      const isOwner = asset.owner.toString() === umi.identity.publicKey.toString()
      if (!isOwner) {
        console.error('❌ Current user is not the NFT owner')
        return {
          success: false,
          error: 'Permission denied: Only NFT owner can approve transfer delegate',
          message: 'You must be the NFT owner to approve transfer delegate'
        }
      }
      
      let result;
      
      // Import necessary methods
      const { transactionBuilder } = await import('@metaplex-foundation/umi')
      const { revokePluginAuthority, updatePlugin } = await import('@metaplex-foundation/mpl-core')
      
      // Create deal builder
      let txBuilder = transactionBuilder()
      
      // Check if NFT needs to be unfrozen
      if (asset.freezeDelegate?.frozen) {
        console.log('❄️ NFT is frozen, adding unfreeze instruction...')
        txBuilder = txBuilder.add(updatePlugin(umi, {
          asset: publicKey(assetAddress),
          plugin: {
            type: 'FreezeDelegate',
            frozen: false
          }
        }))
        console.log('✅ Unfreeze instruction added')
      }
      
      if (!asset.transferDelegate) {
        // If the NFT does not have the Transfer Delegate plug-in, add the plug-in directly and set the authorization to the bidder.
        console.log('➕ Adding Transfer Delegate plugin with bidder authority...')
        
        txBuilder = txBuilder.add(addPlugin(umi, {
          asset: publicKey(assetAddress),
          plugin: {
            type: "TransferDelegate",
            authority: { type: 'Address', address: publicKey(bidderAddress) }
          },
        }))
        
        // Send combination transaction
        result = await txBuilder.sendAndConfirm(umi, {
          confirm: { commitment: 'confirmed' },
          send: { skipPreflight: false }
        })
        
        console.log('✅ Transfer Delegate plugin added with bidder authority!')
        if (asset.freezeDelegate?.frozen) {
          console.log('✅ NFT unfrozen!')
        }
        console.log('- Transaction signature:', result.signature)
        
      } else {
        // If the plug-in already exists, you need to revoke the existing authorization and then re-authorize it.
        console.log('🔄 Transfer Delegate plugin exists, updating authority...')
        
        // Revoke existing authorization first
        txBuilder = txBuilder.add(revokePluginAuthority(umi, {
          asset: publicKey(assetAddress),
          plugin: { type: "TransferDelegate" },
        }))
        
        // Reauthorize to new bidder
        txBuilder = txBuilder.add(approvePluginAuthority(umi, {
          asset: publicKey(assetAddress),
          plugin: { type: "TransferDelegate" },
          newAuthority: { 
            type: "Address", 
            address: publicKey(bidderAddress)
          },
        }))
        
        // Send combination transaction
        result = await txBuilder.sendAndConfirm(umi, {
          confirm: { commitment: 'confirmed' },
          send: { skipPreflight: false }
        })
        
        console.log('✅ Transfer delegate revoked and re-approved!')
        if (asset.freezeDelegate?.frozen) {
          console.log('✅ NFT unfrozen!')
        }
        console.log('- Transaction signature:', result.signature)
      }
      
      return {
        success: true,
        signature: result.signature,
        message: `Transfer authority granted to ${bidderAddress}`
      }
      
    } catch (error) {
      console.error('❌ Transfer delegate error:', error)
      
      // Provide more detailed error information
      let errorMessage = 'Failed to create transfer delegate authorization'
      if (error instanceof Error) {
        if (error.message.includes('custom program error: 0x4')) {
          errorMessage = 'Permission denied:'
        } else if (error.message.includes('Plugin not found')) {
          errorMessage = 'Transfer Delegate plugin not found on this NFT'
        } else if (error.message.includes('Simulation failed')) {
          errorMessage = 'Transaction simulation failed: Check permissions and NFT status'
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: errorMessage
      }
    } finally {
      isLoading.value = false
    }
  }

  // Check if there is Transfer Delegate authorization
  async function checkTransferDelegate(assetAddress: string, bidderAddress: string) {
    try {
      const { publicKey } = await import('@metaplex-foundation/umi')
      const { fetchAssetV1 } = await import('@metaplex-foundation/mpl-core')
      
      // Create a read-only UMI instance
      const umi = await createReadOnlyUmiInstance()
      
      // Get Asset information
      const asset = await fetchAssetV1(umi, publicKey(assetAddress))
      
      // Check Transfer Delegate plugin
      if (asset.transferDelegate) {
        const delegateAuthority: any = asset.transferDelegate.authority
        
        // Handle different data structures
        let delegateAddress = null
        
        // Debug the structure of delegateAuthority in depth
        console.log('🔍 Debugging delegateAuthority structure:')
        console.log('- Type:', typeof delegateAuthority)
        console.log('- Raw value:', delegateAuthority)
        console.log('- Has address property:', delegateAuthority && 'address' in delegateAuthority)
        console.log('- Has publicKey property:', delegateAuthority && 'publicKey' in delegateAuthority)
        
        if (typeof delegateAuthority === 'string') {
          delegateAddress = delegateAuthority
        } else if (delegateAuthority && delegateAuthority.address) {
          // Process { type: 'Address', address: PublicKey } structure
          const addr: any = delegateAuthority.address
          if (typeof addr === 'string') {
            delegateAddress = addr
          } else if (addr.toBase58) {
            delegateAddress = addr.toBase58()
          } else if (addr.toString) {
            delegateAddress = addr.toString()
          } else if (addr.publicKey) {
            delegateAddress = addr.publicKey.toString()
          }
        } else if (delegateAuthority && delegateAuthority.publicKey) {
          // Handles direct PublicKey objects
          delegateAddress = delegateAuthority.publicKey.toString()
        } else if (delegateAuthority && delegateAuthority.toBase58) {
          delegateAddress = delegateAuthority.toBase58()
        } else if (delegateAuthority && delegateAuthority.toString) {
          delegateAddress = delegateAuthority.toString()
        }
        
        // If it still cannot be parsed, try deeper access.
        if (!delegateAddress && delegateAuthority) {
          console.log('⚠️ Standard parsing failed, trying deep access...')
          console.log('- Keys:', Object.keys(delegateAuthority))
          // Trying to access nested publicKey
          if (delegateAuthority.type === 'Address' && delegateAuthority.address) {
            const addr: any = delegateAuthority.address
            if (addr._bn || addr.toBase58) {
              // Solana PublicKey object
              delegateAddress = addr.toBase58 ? addr.toBase58() : addr.toString()
            }
          }
        }
        
        console.log('🔍 Transfer delegate check:')
        console.log('- Asset:', assetAddress)
        console.log('- Checking for bidder:', bidderAddress)
        console.log('- Current delegate:', delegateAddress)
        
        return {
          hasDelegate: delegateAddress === bidderAddress,
          delegateAddress,
          success: true
        }
      }
      
      return {
        hasDelegate: false,
        delegateAddress: null,
        success: true
      }
    } catch (error) {
      console.warn('⚠️ Failed to check transfer delegate:', error)
      return {
        hasDelegate: false,
        delegateAddress: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Transfer NFT directly using Transfer Delegate
  async function transferNftAsDelegate(assetAddress: string, price: number, newOwnerAddress: string) {
    try {
      isLoading.value = true
      console.log('🚀 Starting NFT purchase with delegate authority...')
      console.log('- Asset:', assetAddress)
      console.log('- Price:', price, 'SOL')
      console.log('- Buyer (newOwner):', newOwnerAddress)
      
      // First get the NFT information to determine the current owner (seller)
      const { publicKey } = await import('@metaplex-foundation/umi')
      const { fetchAssetV1 } = await import('@metaplex-foundation/mpl-core')
      
      const umi = await createReadOnlyUmiInstance()
      const asset = await fetchAssetV1(umi, publicKey(assetAddress))
      const sellerAddress = asset.owner.toString()
      
      console.log('- Seller (current owner):', sellerAddress)
      
      // Call buyNft, passing the correct seller address
      const result = await coreNftManager.buyNft(assetAddress, price, sellerAddress)
      
      if (result.success) {
        return {
          success: true,
          signature: result.signature,
          message: `NFT purchased and transferred from ${sellerAddress} to ${newOwnerAddress} for ${price} SOL`
        }
      } else {
        return {
          success: false,
          error: result.error,
          message: 'Failed to complete NFT purchase'
        }
      }
      
    } catch (error) {
      console.error('❌ Transfer error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to transfer NFT'
      }
    } finally {
      isLoading.value = false
    }
  }
  // Create a read-only UMI instance
  async function createReadOnlyUmiInstance() {
    const { createUmi } = await import('@metaplex-foundation/umi-bundle-defaults')
    
    const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    const umi = createUmi(RPC_URL)
    
    return umi
  }
  // Computed properties
  const hasActiveListings = computed(() => activeListings.value.length > 0)
  const hasUserListings = computed(() => userListings.value.length > 0)


  return {
    // state
    platformCollection,
    activeListings,
    userListings,
    userNfts,
    selectedNft,
    isLoading,
    
    // Computed properties
    hasActiveListings,
    hasUserListings,
    
    // method
    createPlatformCollection,
    createUserNft,
    buyNft,
    
    // Transfer Delegate related methods
    createUmiInstance,
    approveTransferDelegate,
    checkTransferDelegate,
    transferNftAsDelegate
  }
})

// Need to import useWallet and other necessary packages
import { useWallet } from 'solana-wallets-vue'
import { message } from 'ant-design-vue' 