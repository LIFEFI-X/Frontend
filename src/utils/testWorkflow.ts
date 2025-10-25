// Tool functions for testing workflows
import { LocalStorageManager } from './localStorage'
import { createCollection, createNft, getNftList, getNftDetail, placeNftBid, getNftBidList, approveNftBid } from '@/apis/nft'

export class WorkflowTester {
  
  // Test creation Collection
  static async testCreateCollection() {
    console.log('🧪 Testing Collection Creation...')
    
    try {
      const collectionData = {
        name: 'Test Collection',
        description: 'A test collection for workflow testing',
        shortUrl: 'test-collection',
        imageUrl: 'https://via.placeholder.com/400x400/FF6B35/fff?text=Test+Collection',
        bannerImageUrl: 'https://via.placeholder.com/800x200/FF6B35/fff?text=Test+Banner',
        category: 'art',
        projectUrl: 'https://test.example.com',
        mintPrice: 0.05,
        priceUnits: 'SOL',
        royaltyFee: 2.5,
        maxSupply: 1000,
        mintLimit: 5
      }
      
      const result = await createCollection(collectionData)
      console.log('✅ Collection created:', result.data)
      return result.data
    } catch (error) {
      console.error('❌ Collection creation failed:', error)
      throw error
    }
  }
  
  // Test creating NFT
  static async testCreateNft(collectionId?: number) {
    console.log('🧪 Testing NFT Creation...')
    
    try {
      const nftData = {
        name: 'Test NFT #001',
        description: 'A test NFT for workflow testing',
        imageUrl: 'https://via.placeholder.com/400x400/1890FF/fff?text=Test+NFT',
        displayImageUrl: 'https://via.placeholder.com/400x400/1890FF/fff?text=Test+NFT',
        tokenStandard: 'ERC721',
        blockchainNetwork: 'solana',
        contractAddress: 'test_contract_' + Math.random().toString(36).substr(2, 9),
        creatorAddress: '3xA9rhpRrnpc5nUqH5JxzbNkMk5TCMcrWk9BfoD5vmgd',
        metadataUrl: 'https://test.example.com/metadata/1',
        price: 0.1,
        listingPrice: 0.1,
        priceCurrency: 'SOL',
        marketplace: 'opensea',
        isListed: 1,
        collectionId
      }
      
      const result = await createNft(nftData)
      console.log('✅ NFT created:', result.data)
      return result.data
    } catch (error) {
      console.error('❌ NFT creation failed:', error)
      throw error
    }
  }
  
  // Test to get the NFT list
  static async testGetNftList() {
    console.log('🧪 Testing NFT List Retrieval...')
    
    try {
      const result = await getNftList({ pageNum: 1, pageSize: 10 })
      console.log('✅ NFT list retrieved:', {
        total: result.data.total,
        records: result.data.records.length
      })
      return result.data
    } catch (error) {
      console.error('❌ NFT list retrieval failed:', error)
      throw error
    }
  }
  
  // Test to get NFT details
  static async testGetNftDetail(contractAddress: string) {
    console.log('🧪 Testing NFT Detail Retrieval...')
    
    try {
      const result = await getNftDetail(contractAddress)
      console.log('✅ NFT detail retrieved:', result.data.name)
      return result.data
    } catch (error) {
      console.error('❌ NFT detail retrieval failed:', error)
      throw error
    }
  }
  
  // Test bid
  static async testPlaceBid(nftId: number) {
    console.log('🧪 Testing Bid Placement...')
    
    try {
      const bidData = {
        nftId,
        bidPrice: 0.08,
        currency: 'SOL',
        expireAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // Expires in 7 days
      }
      
      const result = await placeNftBid(bidData)
      console.log('✅ Bid placed:', result.data)
      return result.data
    } catch (error) {
      console.error('❌ Bid placement failed:', error)
      throw error
    }
  }
  
  // Test getting bid list
  static async testGetBidList(nftId: number) {
    console.log('🧪 Testing Bid List Retrieval...')
    
    try {
      const result = await getNftBidList({ nftId })
      console.log('✅ Bid list retrieved:', result.data.length, 'bids')
      return result.data
    } catch (error) {
      console.error('❌ Bid list retrieval failed:', error)
      throw error
    }
  }
  
  // Test approved bids
  static async testApproveBid(bidId: number) {
    console.log('🧪 Testing Bid Approval...')
    
    try {
      const result = await approveNftBid({ bidId })
      console.log('✅ Bid approved:', result.data)
      return result.data
    } catch (error) {
      console.error('❌ Bid approval failed:', error)
      throw error
    }
  }
  
  // Run a complete workflow test
  static async runFullWorkflowTest() {
    console.log('🚀 Starting Full Workflow Test...')
    
    try {
      // 1. Create Collection
      const collection = await this.testCreateCollection()
      
      // 2. Create NFT
      const nft = await this.testCreateNft(collection.id)
      
      // 3. Get the NFT list
      const nftList = await this.testGetNftList()
      
      // 4. Get NFT details
      const nftDetail = await this.testGetNftDetail(nft.contractAddress)
      
      // 5. Create a bid
      const bid = await this.testPlaceBid(nft.id)
      
      // 6. Get bid list
      const bidList = await this.testGetBidList(nft.id)
      
      // 7. Approval of bids
      const approvedBid = await this.testApproveBid(bid.bidId)
      
      console.log('🎉 Full Workflow Test Completed Successfully!')
      
      return {
        collection,
        nft,
        nftList,
        nftDetail,
        bid,
        bidList,
        approvedBid
      }
    } catch (error) {
      console.error('💥 Full Workflow Test Failed:', error)
      throw error
    }
  }
  
  // Clear test data
  static clearTestData() {
    console.log('🧹 Clearing test data...')
    LocalStorageManager.clearAll()
    console.log('✅ Test data cleared')
  }
  
  // Display currently stored data statistics
  static showDataStats() {
    const nfts = LocalStorageManager.getNftList()
    const collections = LocalStorageManager.getCollections()
    const bids = LocalStorageManager.getBidList()
    
    console.log('📊 Current Data Stats:', {
      collections: collections.length,
      nfts: nfts.length,
      bids: bids.length
    })
    
    return {
      collections: collections.length,
      nfts: nfts.length,
      bids: bids.length
    }
  }
}

// Expose testing tools globally in development environments
if (import.meta.env.DEV) {
  (window as any).WorkflowTester = WorkflowTester
  console.log('🔧 WorkflowTester available in console as window.WorkflowTester')
}
