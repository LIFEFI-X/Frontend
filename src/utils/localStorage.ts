// Local storage tool class
export class LocalStorageManager {
  // Store key name constants
  private static readonly KEYS = {
    NFT_LIST: 'local_nft_list',
    COLLECTIONS: 'local_collections',
    BID_LIST: 'local_bid_list',
    NEXT_NFT_ID: 'next_nft_id',
    NEXT_COLLECTION_ID: 'next_collection_id',
    NEXT_BID_ID: 'next_bid_id',
  } as const

  // Secure JSON parsing
  private static safeJsonParse<T>(value: string | null, fallback: T): T {
    if (!value) return fallback
    try {
      return JSON.parse(value) as T
    } catch (error) {
      console.warn('Failed to parse stored data:', error)
      return fallback
    }
  }

  // Secure storage settings
  private static safeSetItem(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      return false
    }
  }

  // Secure storage access
  private static safeGetItem<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key)
      return this.safeJsonParse(item, fallback)
    } catch (error) {
      console.error('Failed to read from localStorage:', error)
      return fallback
    }
  }

  // Get next ID
  private static getNextId(key: string, startFrom: number = 1): number {
    const currentId = this.safeGetItem(key, startFrom)
    const nextId = currentId + 1
    this.safeSetItem(key, nextId)
    return currentId
  }

  // NFT related methods
  static getNftList(): any[] {
    return this.safeGetItem(this.KEYS.NFT_LIST, [])
  }

  static saveNftList(nfts: any[]): boolean {
    return this.safeSetItem(this.KEYS.NFT_LIST, nfts)
  }

  static addNft(nft: any): any {
    const nfts = this.getNftList()
    const newNft = {
      ...nft,
      id: this.getNextId(this.KEYS.NEXT_NFT_ID, 1000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    nfts.push(newNft)
    this.saveNftList(nfts)
    return newNft
  }

  static getNftById(id: number): any | null {
    const nfts = this.getNftList()
    return nfts.find(nft => nft.id === id) || null
  }

  static getNftByContractAddress(contractAddress: string): any | null {
    const nfts = this.getNftList()
    return nfts.find(nft => nft.contractAddress === contractAddress) || null
  }

  static updateNft(id: number, updates: any): boolean {
    const nfts = this.getNftList()
    const index = nfts.findIndex(nft => nft.id === id)
    if (index !== -1) {
      nfts[index] = { ...nfts[index], ...updates, updatedAt: new Date().toISOString() }
      return this.saveNftList(nfts)
    }
    return false
  }

  // Collection related methods
  static getCollections(): any[] {
    return this.safeGetItem(this.KEYS.COLLECTIONS, [])
  }

  static saveCollections(collections: any[]): boolean {
    return this.safeSetItem(this.KEYS.COLLECTIONS, collections)
  }

  static addCollection(collection: any): any {
    const collections = this.getCollections()
    const newCollection = {
      ...collection,
      id: this.getNextId(this.KEYS.NEXT_COLLECTION_ID, 100),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    collections.push(newCollection)
    this.saveCollections(collections)
    return newCollection
  }

  static getCollectionById(id: number): any | null {
    const collections = this.getCollections()
    return collections.find(collection => collection.id === id) || null
  }

  // Bid related methods
  static getBidList(): any[] {
    return this.safeGetItem(this.KEYS.BID_LIST, [])
  }

  static saveBidList(bids: any[]): boolean {
    return this.safeSetItem(this.KEYS.BID_LIST, bids)
  }

  static addBid(bid: any): any {
    const bids = this.getBidList()
    const newBid = {
      ...bid,
      bidId: this.getNextId(this.KEYS.NEXT_BID_ID, 1),
      createdAt: Date.now(),
      status: 'pending'
    }
    bids.push(newBid)
    this.saveBidList(bids)
    return newBid
  }

  static getBidsByNftId(nftId: number): any[] {
    const bids = this.getBidList()
    return bids.filter(bid => bid.nftId === nftId)
  }

  static updateBid(bidId: number, updates: any): boolean {
    const bids = this.getBidList()
    const index = bids.findIndex(bid => bid.bidId === bidId)
    if (index !== -1) {
      bids[index] = { ...bids[index], ...updates }
      return this.saveBidList(bids)
    }
    return false
  }

  // Clear all data
  static clearAll(): void {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }

  // Initialize sample data
  static initializeSampleData(): void {
    // Check if data already exists
    const existingNfts = this.getNftList()
    const existingCollections = this.getCollections()
    
    console.log('🔍 Checking existing data:', {
      nfts: existingNfts.length,
      collections: existingCollections.length
    })
    
    if (existingNfts.length === 0 && existingCollections.length === 0) {
      // Create a sample Collection
      const sampleCollection = this.addCollection({
        name: 'Demo Art Collection',
        description: 'A sample collection for demonstration',
        shortUrl: 'demo-art',
        imageUrl: 'https://via.placeholder.com/400x400/333/fff?text=Collection',
        bannerImageUrl: 'https://via.placeholder.com/800x200/333/fff?text=Banner',
        category: 'art',
        projectUrl: 'https://example.com',
        mintPrice: 0.1,
        priceUnits: 'SOL',
        royaltyFee: 5,
        maxSupply: 1000,
        mintLimit: 10,
        isVerified: true,
        floorPrice: 0.08,
        totalVolume: 15.5,
        totalItems: 25,
        royaltyPercentage: 5
      })

      // Create a sample NFT
      const sampleNfts = [
        {
          name: 'Abstract Art #001',
          description: 'A beautiful abstract art piece',
          imageUrl: 'https://lifeif.oss-ap-southeast-1.aliyuncs.com/uploads/y5_1757070080831_7rk3gu.png',
          displayImageUrl: 'https://lifeif.oss-ap-southeast-1.aliyuncs.com/uploads/y5_1757070080831_7rk3gu.png',
          animationUrl: '',
          displayAnimationUrl: '',
          tokenStandard: 'ERC721',
          blockchainNetwork: 'solana',
          contractAddress: 'demo_contract_' + Math.random().toString(36).substr(2, 9),
          creatorAddress: '3xA9rhpRrnpc5nUqH5JxzbNkMk5TCMcrWk9BfoD5vmgd',
          ownerAddress: '3xA9rhpRrnpc5nUqH5JxzbNkMk5TCMcrWk9BfoD5vmgd',
          metadataUrl: 'https://example.com/metadata/1',
          tokenId: 'token_001',
          collectionId: sampleCollection.id,
          collectionName: sampleCollection.name,
          collection: sampleCollection,
          rarityRank: 15,
          rarityScore: 85.5,
          price: 0.25,
          priceCurrency: 'SOL',
          usdPrice: 25,
          listingPrice: 0.25,
          lastSalePrice: 0.2,
          highestBid: 0.22,
          lowestAsk: 0.25,
          isListed: 1,
          marketplace: 'opensea',
          category: 'art',
          mintTimestamp: new Date().toISOString(),
          mintTransactionHash: '0x' + Math.random().toString(16).substr(2, 64),
          attributes: [
            { traitType: 'Color', traitValue: 'Blue', displayType: '', maxValue: 0 },
            { traitType: 'Style', traitValue: 'Abstract', displayType: '', maxValue: 0 }
          ],
          priceInfo: {
            price: 0.25,
            priceCurrency: 'SOL',
            usdPrice: 25,
            lastSalePrice: 0.2,
            listingPrice: 0.25,
            highestBid: 0.22,
            lowestAsk: 0.25,
            isListed: true,
            marketplace: 'opensea',
            lastSaleTimestamp: '',
            priceChange24h: 0.05,
            tradingVolume24h: 1.2
          }
        },
        {
          name: 'Digital Landscape #002',
          description: 'A stunning digital landscape',
          imageUrl: 'https://lifeif.oss-ap-southeast-1.aliyuncs.com/uploads/y3_1757070053046_tjv8b7.png',
          displayImageUrl: 'https://lifeif.oss-ap-southeast-1.aliyuncs.com/uploads/y3_1757070053046_tjv8b7.png',
          animationUrl: '',
          displayAnimationUrl: '',
          tokenStandard: 'ERC721',
          blockchainNetwork: 'solana',
          contractAddress: 'demo_contract_' + Math.random().toString(36).substr(2, 9),
          creatorAddress: '3xA9rhpRrnpc5nUqH5JxzbNkMk5TCMcrWk9BfoD5vmgd',
          ownerAddress: '3xA9rhpRrnpc5nUqH5JxzbNkMk5TCMcrWk9BfoD5vmgd',
          metadataUrl: 'https://example.com/metadata/2',
          tokenId: 'token_002',
          collectionId: sampleCollection.id,
          collectionName: sampleCollection.name,
          collection: sampleCollection,
          rarityRank: 8,
          rarityScore: 92.1,
          price: 0.18,
          priceCurrency: 'SOL',
          usdPrice: 18,
          listingPrice: 0.18,
          lastSalePrice: 0.15,
          highestBid: 0.16,
          lowestAsk: 0.18,
          isListed: 1,
          marketplace: 'opensea',
          category: 'art',
          mintTimestamp: new Date().toISOString(),
          mintTransactionHash: '0x' + Math.random().toString(16).substr(2, 64),
          attributes: [
            { traitType: 'Color', traitValue: 'Green', displayType: '', maxValue: 0 },
            { traitType: 'Style', traitValue: 'Landscape', displayType: '', maxValue: 0 }
          ],
          priceInfo: {
            price: 0.18,
            priceCurrency: 'SOL',
            usdPrice: 18,
            lastSalePrice: 0.15,
            listingPrice: 0.18,
            highestBid: 0.16,
            lowestAsk: 0.18,
            isListed: true,
            marketplace: 'opensea',
            lastSaleTimestamp: '',
            priceChange24h: 0.03,
            tradingVolume24h: 0.8
          }
        }
      ]

      // Add sample NFT to local storage
      sampleNfts.forEach(nft => this.addNft(nft))

      console.log('✅ Sample data initialized:', {
        collections: 1,
        nfts: sampleNfts.length
      })
    }
  }
}
