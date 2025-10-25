import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { uploadImage, type ImageUploadResponse } from '@/apis/assets'
import { uploadFileToOSS } from '@/utils/ossUpload'
import { 
  create,
  transfer,
  transferV1,
  burn,
  addPlugin,
  removePlugin,
  updatePlugin,
  createCollection,
  type AssetV1,
  type CollectionV1,
  MPL_CORE_PROGRAM_ID,
  revokePluginAuthority,
  approvePluginAuthority,
  fetchAssetV1,
  fetchCollectionV1,
  ruleSet,
  type RuleSet
} from '@metaplex-foundation/mpl-core'
import { 
  publicKey, 
  generateSigner, 
  sol, 
  percentAmount,
  type Umi,
  type PublicKey,
  type Signer,
  lamports,
  createAmount,
  type TransactionBuilder,
  type PublicKeyInput
} from '@metaplex-foundation/umi'
import { base58 } from '@metaplex-foundation/umi/serializers'
import { useWallet } from 'solana-wallets-vue'
import type { WalletAdapter } from '@solana/wallet-adapter-base'
import { message } from 'ant-design-vue'
import { useModalStore } from '@/stores/modal'
import { PublicKey as Web3PublicKey, Connection } from '@solana/web3.js'



// Core NFT configuration
export interface CoreNftConfig {
  name: string
  uri?: string  // URI is now optional as it can be generated from metadata
  sellerFeeBasisPoints?: number
  symbol?: string
  description?: string
  image?: string | File  // Support file or URL
  attributes?: Array<{trait_type: string, value: string}>  // Support properties
  imageUrl?: string  // Image access URL
  // Price information (optional)
  price?: number  // NFT Price (SOL)
  // Collection information (optional)
  collection?: string  // The address of the Collection, if provided the NFT will be added to the Collection
}



export class CoreNftManager {
  private umi: Umi | null = null
  private connection: Connection | null = null
  private platformCollection?: string // Platform collection address
  
  constructor() {
    // Restore platform collection address from localStorage
    const collectionData = localStorage.getItem('coreNft_platformCollection')
    if (collectionData) {
      this.platformCollection = collectionData
    }
  }

  // Save the platform collection address to localStorage
  private savePlatformCollection() {
    try {
      if (this.platformCollection) {
        localStorage.setItem('coreNft_platformCollection', this.platformCollection)
      }
    } catch (e) {
      console.error('Failed to save platform collection to localStorage:', e)
    }
  }

  // Check wallet connection status and initialize UMI
  private async ensureWalletAndUmi() {
    const { connected, publicKey, wallet } = useWallet()
    const modalStore = useModalStore()
    
    console.log('🔍 Checking wallet connection for Core NFT...')
    console.log('- connected:', connected.value)
    console.log('- publicKey:', !!publicKey.value)
    console.log('- wallet:', !!wallet.value)
    
    // Check if wallet is connected
    if (!connected.value || !publicKey.value) {
      console.warn('❌ Solana wallet not connected or publicKey not available')
      message.error('Please connect your Solana wallet first')
      modalStore.toggleLoginEntryModal(true)
      modalStore.setLoginEntryConnectType('connect')
      modalStore.setLoginEntryType('solana')
      throw new Error('Wallet not connected')
    }
    
    if (!wallet.value?.adapter) {
      console.warn('❌ Wallet adapter not available')
      message.error('Wallet adapter not available. Please try reconnecting your wallet.')
      throw new Error('Wallet adapter not available')
    }
    
    // Initialize UMI and Connection
    const endpoint = import.meta.env.VITE_APP_SOLANA_RPC || 'https://api.devnet.solana.com'
    this.umi = createUmi(endpoint)
      .use(walletAdapterIdentity(wallet.value.adapter as WalletAdapter))
    
    this.connection = new Connection(endpoint)
    
    console.log('✅ UMI initialized with wallet:', this.umi.identity.publicKey.toString())
    console.log('✅ Server-based file upload configured')
    return { umi: this.umi, connection: this.connection }
  }

  /**
   * Create a platform collection
   */
  async createPlatformCollection(config: {
    name: string
    uri?: string
    symbol?: string
    description?: string
    image?: string | File
  }) {
    try {
      const { umi } = await this.ensureWalletAndUmi()
      
      console.log('🎨 Creating platform collection...')
      message.loading({ content: 'Creating platform collection...', key: 'createCollection' })
      
      const collectionSigner = generateSigner(umi)
      let metadataUri:any = config.uri
      
      // If no URI is provided, create and upload metadata
      if (!metadataUri) {
        console.log('Creating and uploading collection metadata...')
        
        // Upload pictures
        let imageUri =  config.image
        
        // Create collection metadata
        const metadata = {
          name: config.name,
          symbol: config.symbol || 'LiFEFi',
          description: config.description || 'Platform Collection',
          seller_fee_basis_points: 0, // 0 platform royalties
          image: imageUri,
          properties: {
            category: 'collection',
            creators: [{
              address: umi.identity.publicKey.toString(),
              share: 100
            }]
          }
        }
        
        // Upload metadata
        message.loading({ content: 'Uploading collection metadata to server...', key: 'createCollection' })
        const metadataStr = JSON.stringify(metadata)
        const metadataBlob = new Blob([metadataStr], { type: 'application/json' })
        const metadataFile = new File([metadataBlob], 'collection-metadata.json', { type: 'application/json' })
        metadataUri=metadata
        // const metadataUploadResult = await uploadImage(metadataFile)
        // if (metadataUploadResult.code === 200 && metadataUploadResult.data) {
        //   metadataUri = metadataUploadResult.data.fileUrl
        //   console.log('Collection metadata uploaded:', metadataUri)
        // } else {
        //   throw new Error(`Metadata upload failed: ${metadataUploadResult.message || 'Unknown error'}`)
        // }
      }
      
      const result = await createCollection(umi, {
        collection: collectionSigner,
        name: config.name,
        uri: metadataUri,
        plugins: [
          // Royalty Plugin - Platform Default Royalty
          {
            type: 'Royalties',
            basisPoints: 0, // 0% platform royalties
            creators: [{
              address: umi.identity.publicKey,
              percentage: 100
            }],
            ruleSet: ruleSet('None')
          }
        ]
      }).sendAndConfirm(umi)
      
      console.log('✅ Platform collection created!')
      console.log('- Collection:', collectionSigner.publicKey.toString())
      console.log('- Metadata URI:', metadataUri)
      console.log('- Signature:', result.signature)
      
      this.platformCollection = collectionSigner.publicKey.toString()
      this.savePlatformCollection()
      
      message.success({ content: 'Platform collection created successfully!', key: 'createCollection' })
      
      // Convert signature to base58 string
      const txHash = typeof result.signature === 'string' 
        ? result.signature 
        : base58.deserialize(result.signature)[0]
      
      return {
        success: true,
        collection: this.platformCollection,
        signature: txHash,
        metadataUri
      }
    } catch (error) {
      console.error('Failed to create platform collection:', error)
      message.error('Failed to create platform collection')
      message.destroy('createCollection')
      return { success: false, error }
    }
  }

  /**
   * Upload files to OSS and return file URL
   */
  private async uploadToOSS(file: File | string, fileName: string): Promise<{ url: string }> {
    try {
      let fileToUpload: File
      
      if (typeof file === 'string') {
        // If it is a URL, download the file first
        const response = await fetch(file)
        const blob = await response.blob()
        fileToUpload = new File([blob], fileName, { type: blob.type || 'image/png' })
      } else {
        // If it is a File object
        fileToUpload = file
      }
      
      console.log('Uploading file to OSS:', fileToUpload.name)
      const response = await uploadFileToOSS(fileToUpload, {
        prefix: 'nft-images/',
        generateUniqueKey: true
      })
      console.log('OSS upload response:', response)
      
      if (response.success && response.url) {
        console.log('File uploaded to OSS successfully:', response.url)
        
        return {
          url: response.url
        }
      } else {
        throw new Error(`OSS upload failed: ${response.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to upload file to OSS:', error)
      throw error
    }
  }



  /**
   * User-created NFT (0 royalties)
   */
  async createUserNft(config: CoreNftConfig) {
    try {
      const { umi } = await this.ensureWalletAndUmi()
      
      console.log('🎯 Creating user NFT with 0% royalty...')
      console.log('Configuration parameters:', {
        name: config.name,
        imageUrl: config.imageUrl,
        price: config.price
      })
      message.loading({ content: 'Creating NFT...', key: 'createNFT' })
      
      const assetSigner = generateSigner(umi)
      let metadataUri = config.uri
      
      // Use the passed in imageUrl or upload a new image
      let imageUri = config.imageUrl || ''
      
      // If no URI is provided, create and upload metadata
      if (!metadataUri) {
        console.log('Creating and uploading metadata...')
        
        // If there is no imageUrl but there is an image file, upload it to OSS
        if (!imageUri && config.image) {
          message.loading({ content: 'Uploading image to OSS...', key: 'createNFT' })
          const uploadResult = await this.uploadToOSS(config.image, 'nft-image.png')
          imageUri = uploadResult.url
          console.log('Image uploaded to OSS:', imageUri)
        } else {
          console.log('Using provided image URL:', imageUri)
        }
        
        // Create metadata object
        const metadata = {
          name: config.name,
          symbol: config.symbol || 'NFT',
          description: config.description || '',
          seller_fee_basis_points: config.sellerFeeBasisPoints || 0,
          image: imageUri,
          attributes: config.attributes || [],
          properties: {
            files: imageUri ? [{
              uri: imageUri,
              type: 'image/png'
            }] : [],
            category: 'image',
            creators: [{
              address: umi.identity.publicKey.toString(),
              share: 100
            }]
          }
        }
        
        // Upload metadata
        message.loading({ content: 'Uploading metadata to server...', key: 'createNFT' })
        const metadataStr = JSON.stringify(metadata)
        const metadataBlob = new Blob([metadataStr], { type: 'application/json' })
        const metadataFile = new File([metadataBlob], 'nft-metadata.json', { type: 'application/json' })
        
        const metadataUploadResult = await uploadFileToOSS(metadataFile, {
          prefix: 'nft-metadata/',
          generateUniqueKey: true
        })
        if (metadataUploadResult.success && metadataUploadResult.url) {
          metadataUri = metadataUploadResult.url
          console.log('Metadata uploaded to OSS:', metadataUri)
        } else {
          throw new Error(`Metadata upload to OSS failed: ${metadataUploadResult.error || 'Unknown error'}`)
        }
      }
      
      // Prepare plugin list
      const plugins = [
        // Royalty plugin - set to 0
        {
          type: 'Royalties' as const,
          basisPoints: 0, // 0% Royalty
          creators: [{
            address: umi.identity.publicKey,
            percentage: 100
          }],
          ruleSet: ruleSet('None')
        }
      ]
     
      // If price is provided, add full pending order attributes and market authorization
      if (config.price && config.price > 0) {
        console.log('💰 Adding price and listing info to on-chain attributes:', config.price, 'SOL')
        const timestamp = Math.floor(Date.now() / 1000)
        
        // Add price attribute
        plugins.push({
          type: 'Attributes' as any,
          attributeList: [
            // NFT basic price information
            { key: 'nft_price', value: config.price.toString() },
            { key: 'price_currency', value: 'SOL' },
            { key: 'pricing_timestamp', value: timestamp.toString() },
            { key: 'pricing_status', value: 'listed' },
            // Pending order information
            { key: 'listing_price', value: config.price.toString() },
            { key: 'listing_seller', value: umi.identity.publicKey.toString() },
            { key: 'listing_timestamp', value: timestamp.toString() },
            { key: 'listing_status', value: 'active' }
          ]
        } as any)
        
        // Add Transfer Delegate authorization to the market (if the market address is configured)
        const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS
        if (MARKETPLACE_ADDRESS) {
          console.log('🔐 Adding Transfer Delegate for marketplace:', MARKETPLACE_ADDRESS)
          
          plugins.push({
            type: 'TransferDelegate' as any,
            authority: {
              type: 'Address' as any,
              address: publicKey(MARKETPLACE_ADDRESS)
            }
          } as any)
        } else {
          console.warn('⚠️ VITE_MARKETPLACE_ADDRESS not configured, skipping marketplace authorization')
        }
      }
      
      // Create NFT configuration
      const createConfig: any = {
        asset: assetSigner,
        name: config.name,
        uri: metadataUri,
        plugins
      }
      
      // If a Collection address is provided, add the NFT to the Collection
      if (config.collection) {
        console.log('📦 Adding NFT to collection:', config.collection)
        createConfig.collection = publicKey(config.collection)
      }
      
      message.loading({ content: 'Creating NFT on blockchain...', key: 'createNFT' })
      const result = await create(umi, createConfig).sendAndConfirm(umi)
      
      console.log('✅ User NFT created successfully!')
      console.log('- Asset:', assetSigner.publicKey.toString())
      console.log('- Metadata URI:', metadataUri)
      console.log('- Signature:', result.signature)
      if (config.price) {
        console.log('- Price stored on-chain:', config.price, 'SOL')
        console.log('- Marketplace authorized: Yes')
        console.log('- NFT frozen: Yes')
      }
      
      const successMsg = config.price && config.price > 0 
        ? `NFT created and listed for ${config.price} SOL (with marketplace authorization)!`
        : 'NFT created with 0% royalty!'
      message.success({ content: successMsg, key: 'createNFT' })
      
      // Convert signature to base58 string
      const txHash = typeof result.signature === 'string' 
        ? result.signature 
        : base58.deserialize(result.signature)[0]
      
      return {
        success: true,
        asset: assetSigner.publicKey.toString(),
        signature: txHash,
        owner: umi.identity.publicKey.toString(),
        metadataUri,
        price: config.price,
        isListed: !!(config.price && config.price > 0),
        isFrozen: !!(config.price && config.price > 0),
        marketplaceAuthorized: !!(config.price && config.price > 0),
        collection: config.collection || null
      }
    } catch (error) {
      console.error('Create user NFT fail:', error)
      message.error('Failed to create NFT')
      message.destroy('createNFT')
      return { success: false, error }
    }
  }

  /**
   * Parse the attribute list and extract pending order information
   */
  private parseAttributeList(attributeList: any[]): any {
    if (!Array.isArray(attributeList) || attributeList.length === 0) {
      return null
    }
    
    const listingInfo: any = {}
    const priceInfo: any = {}
    
    attributeList.forEach((attr: any) => {
      // Handle different data structure formats
      const key = attr.key || attr.trait_type || attr.name
      const value = attr.value?.toString() || ''
      
      switch (key) {
        // Pending order information (for trading)
        case 'listing_price':
          listingInfo.price = parseFloat(value)
          break
        case 'listing_seller':
          listingInfo.seller = value
          break
        case 'listing_timestamp':
          listingInfo.timestamp = parseInt(value)
          break
        case 'listing_status':
          listingInfo.status = value
          break
        // NFT original price information (for display)
        case 'nft_price':
          priceInfo.price = parseFloat(value)
          break
        case 'price_currency':
          priceInfo.currency = value
          break
        case 'pricing_timestamp':
          priceInfo.timestamp = parseInt(value)
          break
        case 'pricing_status':
          priceInfo.status = value
          break
      }
    })
    
    const result: any = {}
    
    // Check whether there is pending order information
    if (listingInfo.price && listingInfo.seller) {
      // If there is no status, defaults to active (compatibility)
      if (!listingInfo.status) {
        listingInfo.status = 'active'
      }
      
      result.listing = {
        ...listingInfo,
        isOnChain: true
      }
    }
    
    // Check if there is NFT price information
    if (priceInfo.price) {
      result.pricing = {
        ...priceInfo,
        currency: priceInfo.currency || 'SOL',
        isOnChain: true
      }
    }
    
    // In order to maintain backward compatibility, if there is only pending order information, the pending order information will be returned directly.
    if (result.listing && !result.pricing) {
      return result.listing
    }
    
    // Return if there is any information
    return Object.keys(result).length > 0 ? result : null
  }


  /**
   * Buy NFT - Smart Purchase (Transfer Delegate authorization required to complete transaction)
   */
  async buyNft(
    assetAddress: string, 
    price: number, 
    sellerAddress: string,
    royaltyPercentage: number = 5
  ) {
    try {
      const { umi } = await this.ensureWalletAndUmi()
      
      console.log('🛒 Initiating NFT purchase...')
      console.log('- Asset:', assetAddress)
      console.log('- Price:', price, 'SOL')
      console.log('- Seller:', sellerAddress)
      
      message.loading({ content: 'Checking NFT status...', key: 'buyNFT' })
      
      // Get NFT information
      const asset = await fetchAssetV1(umi, publicKey(assetAddress))
      
      console.log('📋 NFT Status:')
      console.log('- Current owner:', asset.owner.toString())
      console.log('- Is frozen:', asset.freezeDelegate?.frozen || false)
      
      // Securely obtain Transfer Delegate information
      let transferDelegateInfo = null
      try {
        if (asset.transferDelegate) {
          console.log('- Transfer delegate raw:', asset.transferDelegate)
          
          // Handle different data structures
          if (asset.transferDelegate.authority) {
            if (typeof asset.transferDelegate.authority === 'string') {
              transferDelegateInfo = asset.transferDelegate.authority
            } else if (asset.transferDelegate.authority.address) {
              transferDelegateInfo = asset.transferDelegate.authority.address.toString()
            } else if (asset.transferDelegate.authority.toString) {
              transferDelegateInfo = asset.transferDelegate.authority.toString()
            }
          }
          
          console.log('- Transfer delegate processed:', transferDelegateInfo)
        }
      } catch (e) {
        console.warn('Error processing transfer delegate:', e)
      }
      
      // Verify that the seller is the current owner
      console.log(asset.owner.toString(),'asset.owner.toString()')
      console.log(sellerAddress,'sellerAddress')
      if (asset.owner.toString() !== sellerAddress) {
        message.error('Seller is not the current owner of this NFT')
        return {
          success: false,
          error: 'Invalid seller address'
        }
      }
      // Check if there is a Transfer Delegate authorized to the buyer
      const buyerAddress = umi.identity.publicKey.toString()
      const hasTransferDelegate = transferDelegateInfo === buyerAddress
      
      console.log('🔐 Transfer Delegate Authorization Check:')
      console.log('- Buyer address:', buyerAddress)
      console.log('- Transfer delegate info:', transferDelegateInfo)
      console.log('- Delegate matches buyer:', hasTransferDelegate)
      console.log('- Raw comparison:', `"${transferDelegateInfo}" === "${buyerAddress}"`)
      
      if (!hasTransferDelegate) {
        console.warn('⚠️ No transfer delegate found for buyer')
        console.log('🔍 Debugging delegate mismatch:')
        console.log('- transferDelegateInfo type:', typeof transferDelegateInfo)
        console.log('- transferDelegateInfo length:', transferDelegateInfo?.length)
        console.log('- buyerAddress type:', typeof buyerAddress)
        console.log('- buyerAddress length:', buyerAddress.length)
        
        // Special handling: Check if authorization has just been made in the same transaction
        console.log('⚠️ IMPORTANT: Transfer Delegate authorization must be done in a separate transaction')
        console.log('⚠️ The seller needs to approve your bid first, then you can purchase in a new transaction')
        
        message.error('Please wait for seller to approve your bid before purchasing')
        return {
          success: false,
          needsApproval: true,
          error: 'Transfer delegate authorization must be completed first in a separate transaction',
          buyerAddress: buyerAddress,
          currentDelegate: transferDelegateInfo,
          message: 'Ask the seller to approve your bid, then try purchasing again'
        }
      }
      
      // Calculate fees
      const platformFeePercentage = 2.5 // Platform fee 0% (disabled)
      const platformFee = (price * platformFeePercentage) / 100
      const royaltyAmount = (price * royaltyPercentage) / 100
      const sellerAmount = price - platformFee - royaltyAmount
      
      console.log('💰 Fee calculation details:')
      console.log('- Original price:', price, 'SOL')
      console.log('- Platform fee percentage:', platformFeePercentage, '%')
      console.log('- Platform fee amount:', platformFee, 'SOL')
      console.log('- Royalty percentage:', royaltyPercentage, '%')
      console.log('- Royalty amount:', royaltyAmount, 'SOL')
      console.log('- Final seller amount:', sellerAmount, 'SOL')
      
      console.log('💰 Payment breakdown:')
      console.log('- Seller receives:', sellerAmount, 'SOL')
      console.log('- Platform fee:', platformFee, 'SOL')
      console.log('- Royalty:', royaltyAmount, 'SOL')
      
      // Import necessary methods
      const { transferSol } = await import('@metaplex-foundation/mpl-toolbox')
      const { transactionBuilder } = await import('@metaplex-foundation/umi')
      
      console.log('💰 Building atomic transaction: Payment + NFT Transfer')
      
      // Obtain Asset information for transfer
      const assetItem = await fetchAssetV1(umi, publicKey(assetAddress))
      console.log(assetItem,'assetItem')
      // Get Collection information (if any)
      const collectionItem = 
        assetItem.updateAuthority?.type === 'Collection' && assetItem.updateAuthority.address
          ? await fetchCollectionV1(umi, assetItem.updateAuthority.address)
          : undefined
      
      // Building Atomic Transactions: Payment + NFT Transfer
      let atomicTransaction = transactionBuilder()
        // 1. Pay to the seller
        .add(transferSol(umi, {
          source: umi.identity,
          destination: publicKey(sellerAddress),
          amount: sol(sellerAmount)
        }))
      
      // 2. Platform fee (use VITE_MARKETPLACE_ADDRESS as the platform address)
      const PLATFORM_FEE_ADDRESS = import.meta.env.VITE_PLATFORM_FEE_ADDRESS || import.meta.env.VITE_MARKETPLACE_ADDRESS
      
      console.log('💳 Platform fee details:')
      console.log('- Platform fee amount:', platformFee, 'SOL')
      console.log('- Platform fee address (VITE_PLATFORM_FEE_ADDRESS):', import.meta.env.VITE_PLATFORM_FEE_ADDRESS)
      console.log('- Marketplace address (VITE_MARKETPLACE_ADDRESS):', import.meta.env.VITE_MARKETPLACE_ADDRESS)
      console.log('- Using platform address:', PLATFORM_FEE_ADDRESS)
      
      if (PLATFORM_FEE_ADDRESS && platformFee > 0) {
        console.log('✅ Adding platform fee instruction:', platformFee, 'SOL to', PLATFORM_FEE_ADDRESS)
        try {
          // IMPORTANT: Must be reassigned to maintain chaining of calls
          atomicTransaction = atomicTransaction.add(transferSol(umi, {
            source: umi.identity,
            destination: publicKey(PLATFORM_FEE_ADDRESS),
            amount: sol(platformFee)
          }))
          console.log('✅ Platform fee transfer instruction added successfully')
        } catch (platformFeeError) {
          console.error('❌ Failed to add platform fee instruction:', platformFeeError)
          const errorMessage = platformFeeError instanceof Error ? platformFeeError.message : 'Unknown error'
          throw new Error(`Cannot add platform fee instruction: ${errorMessage}`)
        }
      } else if (platformFee > 0) {
        console.warn('⚠️ Platform fee address not configured, platform fee will be lost!')
        console.log('- Please set VITE_PLATFORM_FEE_ADDRESS or VITE_MARKETPLACE_ADDRESS')
        console.log('- platformFee:', platformFee)
        console.log('- PLATFORM_FEE_ADDRESS:', PLATFORM_FEE_ADDRESS)
      }
      
      // 3. Royalties (if there is a creator and not the seller)
      const creatorAddress = asset.updateAuthority?.address
      if (royaltyAmount > 0 && creatorAddress && creatorAddress.toString() !== sellerAddress) {
        // IMPORTANT: Must be reassigned to maintain chaining of calls
        atomicTransaction = atomicTransaction.add(transferSol(umi, {
          source: umi.identity,
          destination: creatorAddress,
          amount: sol(royaltyAmount)
        }))
      }
      
      // 4. NFT transfer (authorize using Transfer Delegate)
      console.log('🔄 Adding NFT transfer instruction:')
      console.log('- Asset address:', assetAddress)
      console.log('- Current owner:', assetItem.owner.toString())
      console.log('- New owner (buyer):', umi.identity.publicKey.toString())
      console.log('- Has collection:', !!collectionItem)
      console.log('- Transfer delegate info:', transferDelegateInfo)
      console.log('- Buyer has delegate authority:', hasTransferDelegate)
      
      // Check Transfer Delegate details
      if (assetItem.transferDelegate) {
        console.log('🔐 Transfer Delegate details:')
        console.log('- Raw delegate object:', assetItem.transferDelegate)
        console.log('- Authority type:', typeof assetItem.transferDelegate.authority)
        console.log('- Authority value:', assetItem.transferDelegate.authority)
      }
      
      // Declare freshAsset outside the try block for use during validation
      let freshAsset: any = null
      
      // NFT transfer - using transferV1 method (recommended way)
      console.log('🔄 Adding NFT transfer instruction using transferV1...')
      console.log('- Asset:', assetAddress)
      console.log('- Current owner:', assetItem.owner.toString())
      console.log('- New owner (buyer):', umi.identity.publicKey.toString())
      console.log('- Transfer delegate authorized to buyer:', hasTransferDelegate)
      
      // Use the transfer method - Important: The asset needs to be refreshed to get the latest plugin status
      try {
        console.log('📖 Refreshing asset to get latest plugin state...')
        
        // Re-acquire the asset to ensure the latest Transfer Delegate information
        freshAsset = await fetchAssetV1(umi, publicKey(assetAddress))
        
        console.log('🔍 Fresh asset info:')
        console.log('- Owner:', freshAsset.owner.toString())
        if (freshAsset.transferDelegate) {
          console.log('- Has Transfer Delegate:', true)
          console.log('- Delegate authority:', freshAsset.transferDelegate.authority)
        } else {
          console.log('- Has Transfer Delegate:', false)
        }
        
        // Check if NFT is frozen
        if (freshAsset.freezeDelegate && freshAsset.freezeDelegate.frozen) {
          console.log('❄️ NFT is frozen!')
          console.log('- Freeze authority:', freshAsset.freezeDelegate.authority)
          console.log('- Current user:', umi.identity.publicKey.toString())
          
          // Check whether the current user has unfreezing rights
          const freezeAuthority = freshAsset.freezeDelegate.authority
          let canUnfreeze = false
          
          if (typeof freezeAuthority === 'string') {
            canUnfreeze = freezeAuthority === umi.identity.publicKey.toString()
          } else if (freezeAuthority?.address) {
            canUnfreeze = freezeAuthority.address.toString() === umi.identity.publicKey.toString()
          }
          
          if (!canUnfreeze) {
            console.error('❌ Cannot unfreeze NFT - no authority')
            console.log('⚠️ NFT is frozen and buyer does not have unfreeze authority')
            console.log('⚠️ The seller should unfreeze the NFT when approving the bid')
            
            message.error({
              content: 'This NFT is frozen! Please ask the seller to unfreeze it when approving your bid.',
              duration: 10
            })
            
            throw new Error('NFT is frozen and cannot be transferred. Seller must unfreeze it first.')
          }
          
          // If you have permission, add a defrost command
          console.log('✅ User has unfreeze authority, adding unfreeze instruction...')
          atomicTransaction = atomicTransaction.add(updatePlugin(umi, {
            asset: publicKey(assetAddress),
            plugin: {
              type: 'FreezeDelegate',
              frozen: false  // Unfreeze NFT
            }
          }))
          
          console.log('✅ Unfreeze instruction added')
        }
        
        // Build the transfer directive
        console.log('📝 Building transfer instruction...')
        const transferInstruction = transfer(umi, {
          asset: freshAsset,  // Use the refreshed asset object
          newOwner: umi.identity.publicKey,  // New owner (buyer)
          collection: collectionItem,  // collection object (if any)
          // authority will automatically be inferred from the current umi.identity
        })
        
        // Add to transaction
        atomicTransaction = atomicTransaction.add(transferInstruction)
        
        console.log('✅ NFT transfer instruction added successfully')
        console.log('- Asset:', assetAddress)
        console.log('- Current owner:', freshAsset.owner.toString())
        console.log('- New owner:', umi.identity.publicKey.toString())
        console.log('- Frozen status handled')
        
      } catch (transferError) {
        console.error('❌ Failed to add NFT transfer instruction:', transferError)
        
        // If it still fails, you may need to check the settings of the Transfer Delegate
        console.log('🔍 Debugging transfer failure...')
        console.log('- Error message:', transferError instanceof Error ? transferError.message : 'Unknown error')
        console.log('- Current user:', umi.identity.publicKey.toString())
        console.log('- Has Transfer Delegate?', hasTransferDelegate)
        
        // Try using different permission configurations
        if (hasTransferDelegate) {
          console.log('🔄 Trying with plugin authority structure...')
          try {
            // Build transfer with plugin permissions
            const transferWithPluginAuth = transfer(umi, {
              asset: freshAsset || assetItem,  // Use freshAsset first
              newOwner: umi.identity.publicKey,
              collection: collectionItem,
              authority: {
                type: 'plugin',
                plugin: { type: 'TransferDelegate' }
              } as any
            })
            
            atomicTransaction = atomicTransaction.add(transferWithPluginAuth)
            console.log('✅ NFT transfer instruction added with plugin authority')
          } catch (pluginAuthError) {
            console.error('❌ Plugin authority attempt also failed:', pluginAuthError)
            throw new Error(`Cannot add NFT transfer instruction: ${transferError instanceof Error ? transferError.message : 'Unknown error'}`)
          }
        } else {
          throw new Error('No Transfer Delegate authority found for buyer')
        }
      }
      
      console.log('📤 Sending atomic transaction (Payment + Transfer)')
      
      // Print each command in detail
      let instructionCount = 0
      console.log('📋 Transaction instructions:')
      console.log(`${++instructionCount}. Seller payment: ${sellerAmount} SOL to ${sellerAddress}`)
      
      if (PLATFORM_FEE_ADDRESS && platformFee > 0) {
        console.log(`${++instructionCount}. Platform fee: ${platformFee} SOL to ${PLATFORM_FEE_ADDRESS}`)
      }
      
      if (royaltyAmount > 0 && creatorAddress && creatorAddress.toString() !== sellerAddress) {
        console.log(`${++instructionCount}. Royalty: ${royaltyAmount} SOL to ${creatorAddress.toString()}`)
      }
      
      console.log(`${++instructionCount}. NFT transfer: ${assetAddress} from ${assetItem.owner.toString()} to ${umi.identity.publicKey.toString()}`)
      console.log(`- Total instructions: ${instructionCount}`)
      
      // Check deal builder status
      console.log('🔧 Transaction builder status:')
      console.log('- Builder created:', !!atomicTransaction)
      
      const atomicResult = await atomicTransaction.sendAndConfirm(umi, {
        confirm: { commitment: 'confirmed' },
        send: { skipPreflight: false }
      })
      
      console.log('✅ Atomic transaction completed successfully!')
      
      // Convert Uint8Array signature to base58 string (transaction hash)
      const txHash = typeof atomicResult.signature === 'string' 
        ? atomicResult.signature 
        : base58.deserialize(atomicResult.signature)[0]
      
      console.log('- Transaction signature (raw):', atomicResult.signature)
      console.log('- Transaction hash (base58):', txHash)
      console.log('- Signature type:', typeof atomicResult.signature)
      console.log('- View on explorer:', `https://explorer.solana.com/tx/${txHash}`)
      console.log('- Payment sent to seller:', sellerAmount, 'SOL')
      console.log('- Platform fee sent:', platformFee, 'SOL')
      console.log('- Royalty sent:', royaltyAmount, 'SOL')
      
      // Verify if NFT transfer is successful
      console.log('🔍 Verifying NFT transfer...')
      return {
        success: true,
        signature: txHash,
        txHash: txHash,  // Provide the txHash field explicitly
        transferred: true,
        paymentCompleted: true,
        verificationStatus: 'verified',
        breakdown: {
          totalPrice: price,
          sellerAmount,
          royaltyAmount,
          platformFee
        }
      }
      
      // try {
      //   // Wait longer for the transaction to fully confirm and for the chain status to update
      //   console.log('⏳ Waiting for blockchain state update...')
      //   await new Promise(resolve => setTimeout(resolve, 3000))
        
      //   const updatedAsset = await fetchAssetV1(umi, publicKey(assetAddress))
      //   const newOwner = updatedAsset.owner.toString()
      //   const expectedOwner = umi.identity.publicKey.toString()
        
      //   console.log('- Previous owner:', assetItem.owner.toString())
      //   console.log('- Current owner:', newOwner)
      //   console.log('- Expected owner (buyer):', expectedOwner)
        
      //   // Check if Transfer Delegate status has been reset
      //   if (updatedAsset.transferDelegate) {
      //     console.log('- Transfer delegate after transfer:', updatedAsset.transferDelegate.authority)
      //     console.log('⚠️ Note: Transfer delegate still exists, this might indicate the transfer did not execute properly')
      //   } else {
      //     console.log('- Transfer delegate after transfer: None (expected after successful transfer)')
      //   }
        
      //   // Extra check: compare owner address details
      //   console.log('🔍 Detailed ownership verification:')
      //   console.log('- Seller address (from parameter):', sellerAddress)
      //   console.log('- Previous owner (freshAsset):', freshAsset ? freshAsset.owner.toString() : 'N/A')
      //   console.log('- Current owner (after transfer):', newOwner)
      //   console.log('- Expected owner (buyer):', expectedOwner)
      //   console.log('- Transfer successful:', newOwner === expectedOwner)
      //   console.log('- Owner changed from seller:', newOwner !== sellerAddress)
        
      //   if (newOwner === expectedOwner) {
      //     console.log('✅ NFT transfer verified successfully!')
      //     message.success({ 
      //       content: `NFT purchased and transferred successfully for ${price} SOL!`,
      //       key: 'buyNFT',
      //       duration: 5
      //     })
         
      //   } else {
      //     // Check if the ownership of the NFT has changed
      //     const previousOwner = freshAsset ? freshAsset.owner.toString() : sellerAddress
      //     const ownerChanged = newOwner !== previousOwner
          
      //     if (ownerChanged) {
      //       // Ownership has changed, but not to the intended buyer
      //       console.log('⚠️ NFT was transferred but to a different address than expected')
      //       console.log('- NFT is now owned by:', newOwner)
      //       console.log('- Expected new owner:', expectedOwner)
      //       message.warning({ 
      //         content: `Payment completed (${price} SOL). NFT was transferred to ${newOwner} instead of expected address. Please verify the transaction.`,
      //         key: 'buyNFT',
      //         duration: 10
      //       })
      //       return {
      //         success: true,
      //         signature: atomicResult.signature,
      //         transferred: true,
      //         paymentCompleted: true,
      //         verificationStatus: 'transferred_to_unexpected_address',
      //         actualOwner: newOwner,
      //         expectedOwner: expectedOwner,
      //         breakdown: {
      //           totalPrice: price,
      //           sellerAmount,
      //           royaltyAmount,
      //           platformFee
      //         }
      //       }
      //     } else {
      //       // Ownership has not changed - transfer failed
      //       console.warn('⚠️ NFT transfer failed - owner did not change')
      //       console.log('- Still owned by:', newOwner)
      //       console.log('- Expected transfer from:', previousOwner)
      //       console.log('- Expected transfer to:', expectedOwner)
            
      //       message.error({ 
      //         content: `Payment completed (${price} SOL), but NFT transfer failed. The NFT is still owned by the seller. Please contact support.`,
      //         key: 'buyNFT',
      //         duration: 10
      //       })
      //       return {
      //         success: false,
      //         signature: atomicResult.signature,
      //         transferred: false,
      //         paymentCompleted: true,
      //         verificationStatus: 'transfer_failed',
      //         currentOwner: newOwner,
      //         breakdown: {
      //           totalPrice: price,
      //           sellerAmount,
      //           royaltyAmount,
      //           platformFee
      //         }
      //       }
      //     }
      //   }
      // } catch (verifyError) {
      //   console.warn('⚠️ Could not verify NFT transfer:', verifyError)
      //   message.warning({ 
      //     content: `Payment completed (${price} SOL), but unable to verify NFT transfer. Please check your wallet.`,
      //     key: 'buyNFT',
      //     duration: 8
      //   })
      //   return {
      //     success: true, // Payment successful, but transfer cannot be verified
      //     signature: atomicResult.signature,
      //     transferred: false,
      //     paymentCompleted: true,
      //     verificationStatus: 'verification_failed',
      //     verificationError: verifyError instanceof Error ? verifyError.message : 'Unknown error',
      //     breakdown: {
      //       totalPrice: price,
      //       sellerAmount,
      //       royaltyAmount,
      //       platformFee
      //     }
      //   }
      // }
      
      // Message will be displayed based on verification result
      
    } catch (error) {
      console.error('❌ Purchase failed:', error)
      message.error({ content: 'Failed to complete purchase', key: 'buyNFT' })
      return { success: false, error }
    }
  }



  /**
   * The seller authorizes Transfer Delegate to the market
   */
  async approveTransferDelegate(assetAddress: string) {
    try {
      const { umi } = await this.ensureWalletAndUmi()
      
      console.log('🔐 Approving transfer delegate for asset:', assetAddress)
      
      // Market address (here we use the current user address as an example, it should actually be the market contract address)
      const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS // Replace with actual market address
      
      if (!MARKETPLACE_ADDRESS) {
        console.error('VITE_MARKETPLACE_ADDRESS not configured')
        message.error('Marketplace address not configured')
        return { success: false, error: 'Marketplace address not configured' }
      }
      
      const result = await addPlugin(umi, {
        asset: publicKey(assetAddress),
        plugin: {
          type: 'TransferDelegate',
          authority: {
            type: 'Address',
            address: publicKey(MARKETPLACE_ADDRESS)
          }
        }
      }).sendAndConfirm(umi)
      
      console.log('✅ Transfer delegate approved')
      message.success('Transfer delegate approved successfully')
      
      // Convert signature to base58 string
      const txHash = typeof result.signature === 'string' 
        ? result.signature 
        : base58.deserialize(result.signature)[0]
      
      return {
        success: true,
        signature: txHash,
        delegate: MARKETPLACE_ADDRESS
      }
      
    } catch (error) {
      console.error('Failed to approve transfer delegate:', error)
      message.error('Failed to approve transfer delegate')
      return { success: false, error }
    }
  }

}

// Export singleton instance
export const coreNftManager = new CoreNftManager()

// Convenience function
export const createPlatformCollection = (config: any) =>
  coreNftManager.createPlatformCollection(config)

export const createUserNft = (config: CoreNftConfig) =>
  coreNftManager.createUserNft(config)


export const buyNft = (
  assetAddress: string, 
  price: number, 
  sellerAddress: string,
  royaltyPercentage: number = 5
) =>
  coreNftManager.buyNft(assetAddress, price, sellerAddress, royaltyPercentage)


export const approveTransferDelegate = (assetAddress: string) =>
  coreNftManager.approveTransferDelegate(assetAddress)
