import { request } from './request'

// NFT list interface parameters
export interface GetNftListParams {
  status?: number // Status filtering (1-Buy Now 2-Action 3-New)
  marketplace?: string // trading market
  maxPrice?: number // highest price
  minPrice?: number // lowest price
  category?: string // Classification
  collectionId?: number // Collection ID
  pageNum?: number // page number
  pageSize?: number // page size
}

// NFT data type
export interface NftItem {
  id: number
  name: string
  description: string
  imageUrl: string
  animationUrl: string
  externalUrl: string
  collectionId: number
  collectionName: string
  collection: {
    id: number
    name: string
    imageUrl: string
    category: string
    isVerified: boolean
    floorPrice: number
    totalVolume: number
    totalItems: number
    royaltyPercentage: number
  }
  tokenId: string
  creatorAddress: string
  ownerAddress: string
  contractAddress: string
  blockchainNetwork: string
  mintTimestamp: string
  rarityRank: number
  rarityScore: number
  price: number
  priceCurrency: string
  usdPrice: number
  lastSalePrice: number
  listingPrice: number
  highestBid: number
  lowestAsk: number
  isListed: number
  marketplace: string
  category: string
  createdAt: string
  lastSaleTimestamp: string
}

// API response type
export interface NftListResponse {
  code: number
  message: string
  data: {
    size: number
    records: NftItem[]
    total: number
    current: number
    pages: number
  }
  timestamp: number
}

/**
 * Get NFT list
 * @param params query parameters
 * @returns Promise<NftListResponse>
 */
export const getNftList = (params: GetNftListParams = {}): Promise<NftListResponse> => {
  return request({
    url: '/marketplace/nfts',
    method: 'GET',
    params: {
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 20,
      status: params.status,
      marketplace: params.marketplace,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      category: params.category,
      collectionId: params.collectionId
    }
  }) as Promise<NftListResponse>
}

// Create NFT request parameters
export interface CreateNftParams {
  collectionId?: number
  name: string
  description: string
  imageUrl: string
  displayImageUrl?: string
  animationUrl?: string
  displayAnimationUrl?: string
  tokenStandard: string
  blockchainNetwork: string
  contractAddress: string
  creatorAddress?: string
  metadataUrl: string
  rarityRank?: number
  rarityScore?: number
  price?: number
  listingPrice?: number
  priceCurrency?: string
  marketplace?: string
  isListed?: number
}

// Create NFT response
export interface CreateNftResponse {
  code: number
  message: string
  data: {
    id: number
    name: string
    description: string
    imageUrl: string
    tokenId: string
    contractAddress: string
    blockchainNetwork: string
    creatorAddress: string
    ownerAddress: string
    mintTimestamp: string
    createdAt: string
  }
  timestamp: number
}

/**
 * Create NFT
 * @param params CreateNftParams
 * @returns Promise<CreateNftResponse>
 */
export const createNft = (params: CreateNftParams): Promise<CreateNftResponse> => {
  return request({
    url: '/nfts',
    method: 'POST',
    data: params
  }) as Promise<CreateNftResponse>
}

// NFT details interface response data type
export interface NftDetailData {
  id: number
  name: string
  description: string
  imageUrl: string
  animationUrl: string
  displayAnimationUrl: string
  tokenId: string
  creatorAddress: string
  ownerAddress: string
  contractAddress: string
  blockchainNetwork: string
  mintTransactionHash: string
  mintTimestamp: string
  metadataUri: string
  rarityRank: number
  rarityScore: number
  collection: {
    id: number
    name: string
    imageUrl: string
    category: string
    isVerified: boolean
    floorPrice: number
    totalVolume: number
    totalItems: number
    royaltyPercentage: number
  }
  priceInfo: {
    price: number
    priceCurrency: string
    usdPrice: number
    lastSalePrice: number
    listingPrice: number
    highestBid: number
    lowestAsk: number
    isListed: boolean
    marketplace: string
    lastSaleTimestamp: string
    priceChange24h: number
    tradingVolume24h: number
  }
  attributes: Array<{
    traitType: string
    traitValue: string
    displayType: string
    maxValue: number
  }>
  createdAt: string
  updatedAt: string
}

// NFT details interface response type
export interface NftDetailResponse {
  code: number
  message: string
  data: NftDetailData
  timestamp: number
}

/**
 * Get NFT details based on tokenAddress and tokenId
 * @param tokenAddress token contract address
 * @param tokenId token ID
 * @returns Promise<NftDetailResponse>
 */
export const getNftDetail = (tokenAddress: string, tokenId?: string): Promise<NftDetailResponse> => {
  const url = tokenId 
    ? `/nfts/${tokenAddress}/${tokenId}` 
    : `/nfts/${tokenAddress}`
  
  return request({
    url,
    method: 'GET'
  }) as Promise<NftDetailResponse>
}

// Create collection interface parameters
export interface CreateCollectionParams {
  name: string // Collection name
  description: string // describe
  shortUrl: string // short link
  imageUrl: string // Image URL
  bannerImageUrl: string // Banner image URL
  category: string // Classification
  projectUrl: string // Project URL
  mintPrice: number // casting price
  priceUnits: string // Price unit (1-ETH 2-SOL 3-USDT)
  royaltyFee: number // Royalty rate
  maxSupply: number // maximum supply
  mintLimit: number // casting restrictions
}

// Create collection response
export interface CreateCollectionResponse {
  code: number
  message: string
  data?: {
    id: number
    name: string
    description: string
    shortUrl: string
    imageUrl: string
    bannerImageUrl: string
    category: string
    projectUrl: string
    mintPrice: number
    priceUnits: string
    royaltyFee: number
    maxSupply: number
    mintLimit: number
    createdAt: string
    updatedAt: string
  }
  success: boolean
}

/**
 * Create a collection
 * @param params CreateCollectionParams
 * @returns Promise<CreateCollectionResponse>
 */
export const createCollection = (params: CreateCollectionParams): Promise<CreateCollectionResponse> => {
  return request({
    url: '/collections',
    method: 'POST',
    data: params
  }) as Promise<CreateCollectionResponse>
}

// NFT bidding related interface

// Bid request parameters
export interface PlaceBidParams {
  nftId: number
  bidPrice: number
  currency: string
  expireAt: number
  bidderAddress: string
}

// bid response
export interface PlaceBidResponse {
  code: number
  message: string
  data: {
    bidId: number
    nftId: number
    bidderId: number
    bidderName: string
    bidPrice: number
    currency: string
    createdAt: number
    expireAt: number
    status: string
  }
  timestamp: number
}

/**
 * User bids on NFT
 * @param params PlaceBidParams
 * @returns Promise<PlaceBidResponse>
 */
export const placeNftBid = (params: PlaceBidParams): Promise<PlaceBidResponse> => {
  return request({
    url: `/bids/create`,
    method: 'POST',
    data: params
  }) as Promise<PlaceBidResponse>
}

// Get NFT bid list parameters
export interface GetNftBidListParams {
  nftId: number
  pageNum?: number
  pageSize?: number
}

// bid list data item
export interface BidListItem {
  bidId: number
  nftId: number
  bidderId: number
  bidderName: string
  bidderAddress: string
  bidPrice: number
  currency: string
  createdAt: number
  expireAt: number
  status: string
}

// bid list response
export interface GetNftBidListResponse {
  code: number
  message: string
  data: {
    size: number
    records: BidListItem[]
    total: number
    current: number
    pages: number
  }
  timestamp: number
}

/**
 * Get NFT bid list
 * @param params GetNftBidListParams
 * @returns Promise<GetNftBidListResponse>
 */
export const getNftBidList = (params: GetNftBidListParams): Promise<GetNftBidListResponse> => {
  return request({
    url: `/bids/list`,
    method: 'GET',
    params: {
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 50,
      nftId: params.nftId
    }
  }) as Promise<GetNftBidListResponse>
}

// Authorize bidding parameters
export interface ApproveBidParams {
  bidId: number
}

// Authorize bid response
export interface ApproveBidResponse {
  code: number
  message: string
  data: {
    bidId: number
    nftId: number
    bidderId: number
    bidderName: string
    bidPrice: number
    currency: string
    createdAt: number
    expireAt: number
    status: string
  }
  timestamp: number
}

/**
 * Authorize bid (agree to bid)
 * @param params ApproveBidParams & { nftId: number }
 * @returns Promise<ApproveBidResponse>
 */
export const approveNftBid = (params: ApproveBidParams & { nftId?: number }): Promise<ApproveBidResponse> => {
  // According to the backend interface requirements, the nftId parameter is required
  if (!params.nftId) {
    console.warn('approveNftBid: nftId is required but not provided')
  }
  
  return request({
    url: `/bids/${params.bidId}/approve`,
    method: 'POST',
    data: params
  }) as Promise<ApproveBidResponse>
}

// NFT purchase request parameters
export interface PurchaseNftParams {
  nftId: number
  buyerAddress: string
  sellerAddress: string
  price: number
  currency: string
  listingId?: number
  bidId?: number
  proof?: {
    value: string
    method: string
  }
}

// NFT purchase response
export interface PurchaseNftResponse {
  code: number
  message: string
  data: {
    orderId: number
    nftId: number
    listingId: number | null
    bidId: number | null
    buyer: string
    buyerId: number
    seller: string
    sellerId: number
    price: number
    currency: string
    chain: string
    txHash: string
    transferMethod: string
    status: string
    createdAt: string
    nftOwnershipUpdated: {
      previousOwner: string
      newOwner: string
      updatedAt: string
    }
  }
  timestamp: number
}

/**
 * Buy NFT
 * @param params PurchaseNftParams
 * @returns Promise<PurchaseNftResponse>
 */
export const purchaseNft = (params: PurchaseNftParams): Promise<PurchaseNftResponse> => {
  return request({
    url: `/nfts/${params.nftId}/purchase`,
    method: 'POST',
    data: params
  }) as Promise<PurchaseNftResponse>
}