<template>
  <AigcHeader />
  <div class="nft-detail-container">
    <!-- Loading status -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">Loading NFT details...</div>
    </div>
    
    <!-- back button -->
    <div class="back-section">
      <button class="back-btn" @click="goBack">
        ← Back to summary
      </button>
    </div>

    <!-- main content area -->
    <div class="main-content">
      <!-- Left - NFT image -->
      <div class="nft-image-section">
        <div class="nft-image-container">
          <div class="rating-badge">
            <span class="rating-number">#1</span>
            <span class="rating-text">Top Rating</span>
          </div>
          <img v-if="nftData.image" :src="nftData.image" :alt="nftData.name" class="nft-image" />
          <div v-else class="nft-image-placeholder">
            <span>Loading NFT details...</span>
          </div>
        </div>

        <!-- tab page -->
        <div class="tabs-section">
          <div class="tabs-container">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              :class="['tab-button', { active: activeTab === tab.id }]"
              @click="activeTab = tab.id"
            >
              {{ tab.name }}
            </button>
          </div>

          <!-- Tag content -->
          <div class="tab-content">
            <div v-show="activeTab === 'description'" class="description-content">
              <p>{{ nftData.description }}</p>
              <div class="stats">
                <div class="stat-item">
                  <span class="stat-label">Times Entered:</span>
                  <span class="stat-value">{{ nftData.stats.timesEntered }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Times Hosted:</span>
                  <span class="stat-value">{{ nftData.stats.timesHosted }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Times Won:</span>
                  <span class="stat-value">{{ nftData.stats.timesWon }}</span>
                </div>
              </div>
            </div>
            
            <div v-show="activeTab === 'properties'" class="properties-content">
              <div v-if="nftDetail?.attributes?.length" class="attributes-grid">
                <div 
                  v-for="attribute in nftDetail.attributes" 
                  :key="`${attribute.traitType}-${attribute.traitValue}`"
                  class="attribute-item"
                >
                  <div class="trait-type">{{ attribute.traitType }}</div>
                  <div class="trait-value">{{ attribute.traitValue }}</div>
                  <div v-if="attribute.displayType" class="display-type">{{ attribute.displayType }}</div>
                </div>
              </div>
              <div v-else class="no-attributes">
                No properties available
              </div>
            </div>
            
            <div v-show="activeTab === 'details'" class="details-content">
              <div v-if="nftDetail" class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">Contract Address:</span>
                  <span class="detail-value">{{ formatAddress(nftDetail.contractAddress) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Token ID:</span>
                  <span class="detail-value">{{ nftDetail.tokenId }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Blockchain:</span>
                  <span class="detail-value">{{ nftDetail.blockchainNetwork }}</span>
                </div>
                <div class="detail-item" v-if="nftDetail.rarityRank">
                  <span class="detail-label">Rarity Rank:</span>
                  <span class="detail-value">#{{ nftDetail.rarityRank }}</span>
                </div>
                <div class="detail-item" v-if="nftDetail.rarityScore">
                  <span class="detail-label">Rarity Score:</span>
                  <span class="detail-value">{{ nftDetail.rarityScore.toFixed(2) }}</span>
                </div>
                <div class="detail-item" v-if="nftDetail.metadataUri">
                  <span class="detail-label">Metadata:</span>
                  <a :href="nftDetail.metadataUri" target="_blank" class="detail-link">View Metadata</a>
                </div>
              </div>
              <div v-else class="no-details">
                Loading details...
              </div>
            </div>
            
            <div v-show="activeTab === 'listing'" class="listing-content">
              <!-- Listing content -->
            </div>
          </div>
        </div>
      </div>

      <!-- Right side - NFT information -->
      <div class="nft-info-section">
        <!-- Top information area -->
        <div class="nft-header">
          <div class="collection-badge">
            <span class="collection-name">{{ nftData.collection }}</span>
            <span class="collection-icon" v-if="nftDetail?.collection?.isVerified">
              <SvgIcon name="verified" class="verified-icon" />
            </span>
          </div>
          <div class="action-icons">
            <SvgIcon name="heart" class="icon-btn" />
            <SvgIcon name="share" class="icon-btn" />
             <SvgIcon name="refresh" class="icon-btn" />
            <SvgIcon name="copy" class="icon-btn" />
           
          </div>
        </div>

        <h1 class="nft-title">{{ nftData.name }}</h1>
        <div class="owner-info">
          <span>Owned by <a href="#" class="owner-link">{{ nftData.owner }}</a></span>
          <span v-if="wallet.connected.value && nftDetail?.ownerAddress === wallet.publicKey?.value?.toString()" class="own-indicator">
            (You own this NFT)
          </span>
        </div>

        <!-- price information -->
        <div class="price-section">
          <div class="total-value">
            <span class="label">TOTAL VALUE</span>
            <div class="price">
              <span class="amount">{{ nftData.price }} LIFI</span>
              <span class="usd-value">${{ nftData.usdValue }}</span>
            </div>
          </div>
        </div>

        <!-- Action button -->
        <div class="action-buttons">
          <button 
            class="buy-now-btn" 
            :disabled="purchaseLoading"
            @click="handlePurchaseNft"
          >
            <span v-if="purchaseLoading">Purchasing...</span>
            <span v-else-if="!wallet.connected.value">Connect Wallet</span>
            <span v-else-if="nftDetail?.ownerAddress === wallet.publicKey?.value?.toString()">Your NFT</span>
            <span v-else-if="hasApprovedBid">BUY NOW</span>
            <span v-else>PLACE BID FIRST</span>
          </button>
          <button 
            class="cart-btn" 
            @click="hasApprovedBid ? handlePurchaseNft : handleMakeOffer" 
            :disabled="!wallet.connected.value || nftDetail?.ownerAddress === wallet.publicKey?.value?.toString() || purchaseLoading"
          >
            <SvgIcon :name="hasApprovedBid ? 'cart' : 'storke'" class="icon-btn" />
          </button>
          <button 
            class="make-offer-btn" 
            @click="handleMakeOffer"
            :disabled="!wallet.connected.value || nftDetail?.ownerAddress === wallet.publicKey?.value?.toString()"
          >
            PLACE BID
          </button>
        </div>

        <!-- price history -->
        <div class="price-history-section">
          <div class="section-header" @click="toggleSection('priceHistory')">
            <span>PRICE HISTORY</span>
            <span class="expand-icon">{{ openSections.priceHistory ? '▲' : '▼' }}</span>
          </div>
          <div v-show="openSections.priceHistory" class="section-content">
            <div class="currency-tabs">
              <button 
                v-for="currency in currencies" 
                :key="currency"
                :class="['currency-tab', { active: selectedCurrency === currency }]"
                @click="selectedCurrency = currency"
              >
                {{ currency }}
              </button>
            </div>
            <div class="price-chart">
              <!-- ECharts chart, average price information will be displayed on hover -->
              <div class="chart-placeholder">
                <VChart :option="chartOption" ref="chartRef" />
              </div>
            </div>
          </div>
        </div>

        <!-- Quotation list -->
        <div class="offers-section">
          <div class="section-header" @click="toggleSection('offers')">
            <span>OFFERS</span>
            <span class="expand-icon">
                <SvgIcon name="expand" class="icon-btn" />
            </span>
          </div>
          <div v-show="openSections.offers" class="section-content">
            <div class="offers-table">
              <div class="table-header">
                <span>PRICE</span>
                <span>STATUS</span>
                <span>EXPIRATION</span>
                <span>FROM</span>
                <span>ACTION</span>
              </div>
              <div 
                v-for="offer in offers" 
                :key="offer.id"
                class="table-row"
              >
                <span class="price">{{ offer.price }} SOL</span>
                <span class="status" :class="offer.status">{{ offer.status }}</span>
                <span class="expiration">{{ offer.expiration }}</span>
                <span class="from">{{ offer.from }}</span>
                                     <div class="action-cell">
                      <button 
                        class="approve-btn"
                        @click="handleApproveBid(offer.bidId, offer.fromAddress)"
                        :disabled="offer.approving"
                      >
                        <span v-if="offer.approving">Approving...</span>
                        <span v-else>APPROVE</span>
                      </button>
                      <!-- <span v-else-if="offer.hasTransferDelegate" class="approved-text">Transfer Authorized</span>
                      <span v-else-if="offer.status === 'expired'" class="expired-text">Expired</span>
                      <span v-else class="pending-text">Pending</span> -->
                    </div>
              </div>
              <div v-if="offers.length === 0" class="no-offers">
                No bids yet. Be the first to place a bid!
              </div>
            </div>
          </div>
        </div>

        <!-- Shelf list -->
        <div class="listing-section">
          <div class="section-header" @click="toggleSection('listing')">
            <span>LISTING</span>
            <span class="expand-icon">
                <SvgIcon name="expand" class="icon-btn" />
            </span>
          </div>
          <div v-show="openSections.listing" class="section-content">
            <div class="listing-table">
              <div class="table-header">
                <span>PRICE</span>
                <span>USD OFFER</span>
                <span>EXPIRATION</span>
                <span>FROM</span>
                <span></span>
              </div>
              <div 
                v-for="listing in listings" 
                :key="listing.id"
                class="table-row"
              >
                <span class="price">{{ listing.price }} SOL</span>
                <span class="usd-price">${{ listing.usdPrice }}</span>
                <span class="expiration">{{ listing.expiration }}</span>
                <span class="from">{{ listing.from }}</span>
                <button class="buy-btn">BUY</button>
              </div>
            </div>
          </div>
        </div>

        <!-- activity record -->
        <div class="activity-section">
          <div class="section-header" @click="toggleSection('activity')">
            <span>ACTIVITY</span>
            <span class="expand-icon">
                <SvgIcon name="expand" class="icon-btn" />
            </span>
          </div>
          <div v-show="openSections.activity" class="section-content">
            <div class="activity-filters">
              <label class="filter-option">
                <input type="checkbox" v-model="activityFilters.transfer" />
                <span class="checkmark">
                    <SvgIcon name="storke" class="icon-btn" />
                </span>
                Transfer
              </label>
              <label class="filter-option">
                <input type="checkbox" v-model="activityFilters.sale" />
                <span class="checkmark">
                    <SvgIcon name="storke" class="icon-btn" />
                </span>
                Sale
              </label>
              <label class="filter-option">
                <input type="checkbox" v-model="activityFilters.listing" />
                <span class="checkmark"> 
                 <SvgIcon name="storke" class="icon-btn" />
                </span>
                Listing
              </label>
              <label class="filter-option">
                <input type="checkbox" v-model="activityFilters.offers" />
                <span class="checkmark"> 
                 <SvgIcon name="storke" class="icon-btn" />
                </span>
                Offers
              </label>
            </div>
            <div class="activity-table">
              <div class="table-header">
                <span>EVENT</span>
                <span>PRICE</span>
                <span>FROM</span>
                <span>TO</span>
                <span>DATE</span>
              </div>
              <div 
                v-for="activity in activities" 
                :key="activity.id"
                class="table-row"
              >
                <span class="event">
                    <SvgIcon name="cart2" class="icon-btn" />
                {{ activity.event }}</span>
                <span class="price">{{ activity.price }} SOL</span>
                <span class="from">{{ activity.from }}</span>
                <span class="to">{{ activity.to }}</span>
                <span class="date">{{ activity.date }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recommended collection -->
    <MoreFromCollection :collection="nftData.collection" />
  </div>
  
  <!-- Quote modal box -->
  <MakeOfferModal 
    :visible="showOfferModal"
    :nft-data="nftData"
    @close="handleOfferModalClose"
    @submit="handleOfferSubmit"
  />
  
  <!-- bid modal -->
  <MakeBidModal 
    :visible="showBidModal"
    :nft-data="nftData"
    :loading="bidLoading"
    @close="() => showBidModal = false"
    @submit="handlePlaceBid"
  />
  
  <Footer />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import AigcHeader from '@/components/AigcHeader.vue'
import Footer from '@/components/Footer.vue'
import MoreFromCollection from '@/components/MoreFromCollection.vue'
import MakeOfferModal from '@/components/MakeOfferModal.vue'
import MakeBidModal from '@/components/MakeBidModal.vue'
import { 
  getNftDetail, 
  placeNftBid, 
  getNftBidList, 
  approveNftBid,
  purchaseNft,
  type NftDetailData, 
  type PlaceBidParams,
  type BidListItem,
  type PurchaseNftParams
} from '@/apis/nft'
import { useCoreNftStore } from '@/stores/coreNft'
import { useWallet } from 'solana-wallets-vue'
import { useModalStore } from '@/stores/modal'

// Import ECharts components
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, MarkPointComponent } from 'echarts/components'
import VChart from 'vue-echarts'

// Register ECharts component
use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, MarkPointComponent])

// Import pictures removed - no default image needed

// Get routing parameters
const route = useRoute()

// Store and wallet
const coreNftStore = useCoreNftStore()
const wallet = useWallet()
const modalStore = useModalStore()

// Responsive data
const activeTab = ref('description')
const selectedCurrency = ref('LiFEFi')
const chartRef = ref<any>(null)
const loading = ref(false)
const nftDetail = ref<NftDetailData | null>(null)
const purchaseLoading = ref(false)
const showOfferModal = ref(false)
const bidList = ref<BidListItem[]>([])
const bidLoading = ref(false)
const showBidModal = ref(false)
const approvingBids = ref<Set<number>>(new Set())

const openSections = reactive({
  priceHistory: true,
  offers: true,
  listing: true,
  activity: true
})

const activityFilters = reactive({
  transfer: true,
  sale: true,
  listing: false,
  offers: false
})

// price history data
const priceHistoryData = ref([
  { date: '2025-01-15', price: 0.08 },
  { date: '2025-01-18', price: 0.10 },
  { date: '2025-01-22', price: 0.15 },
  { date: '2025-01-25', price: 0.12 },
  { date: '2025-01-28', price: 0.18 },
  { date: '2025-02-01', price: 0.22 },
  { date: '2025-02-05', price: 0.12 }
])

// Tab data
const tabs = [
  { id: 'description', name: 'DESCRIPTION' },
  { id: 'properties', name: 'PROPERTIES' },
  { id: 'details', name: 'DETAILS' },
  { id: 'listing', name: 'LISTING' }
]

// Currency options
const currencies = ['LiFEFi', 'BIT', 'USD', 'USDT', 'LTC', 'AVAX', 'BSV']

// NFT data - generated from API data using computed properties
const nftData = computed(() => {
  if (!nftDetail.value) {
    // Return default data as loading status
    return {
      name: 'Loading...',
      image: '',
      owner: '--',
      price: '--',
      currency: '--',
      usdValue: '--',
      collection: '--',
      description: 'Loading NFT details...',
      stats: {
        timesEntered: 0,
        timesHosted: 0,
        timesWon: 0
      }
    }
  }

  const detail = nftDetail.value
  return {
    name: detail.name || 'Unnamed NFT',
    image: detail.imageUrl || detail.displayAnimationUrl || '',
    owner: formatAddress(detail.ownerAddress),
    price: detail.priceInfo?.price?.toString() || '--',
    currency: detail.priceInfo?.priceCurrency || '--',
    usdValue: detail.priceInfo?.usdPrice?.toLocaleString() || '--',
    collection: detail.collection?.name || 'Unknown Collection',
    description: detail.description || 'No description available',
    stats: {
      timesEntered: 13, // These statistics may need to be obtained from other interfaces
      timesHosted: 0,
      timesWon: 0
    }
  }
})

// Computed properties: Convert bidList to offers format to be compatible with existing UI
const offers = computed(() => {
  return bidList.value.map(bid => ({
    id: bid.bidId,
    price: bid.bidPrice.toString(),
    currency: bid.currency,
    usdPrice: '0', // USD price can be calculated as needed
    floorDiff: '0%', // Floor differences can be calculated as needed
    expiration: formatExpiration(bid.expireAt),
    from: bid.bidderName,
    fromAddress: bid.bidderAddress,
    status: bid.status,
    bidId: bid.bidId,
    canApprove: canApproveBid(bid),
    approving: approvingBids.value.has(bid.bidId),
    hasTransferDelegate: checkHasTransferDelegateSync(bid.bidderAddress)
  }))
})

// Shelf data
const listings = ref([
  {
    id: 1,
    price: '1.1',
    currency: 'SOL',
    usdPrice: '12,321',
    expiration: '2 days',
    from: 'Mark Bold'
  },
  {
    id: 2,
    price: '1.1',
    currency: 'SOL',
    usdPrice: '12,321',
    expiration: '2 days',
    from: 'Mark Bold'
  },
  {
    id: 3,
    price: '1.1',
    currency: 'SOL',
    usdPrice: '12,321',
    expiration: '2 days',
    from: 'Mark Bold'
  },
  {
    id: 4,
    price: '1.1',
    currency: 'SOL',
    usdPrice: '12,321',
    expiration: '2 days',
    from: 'Mark Bold'
  }
])

// activity data
const activities = ref([
  {
    id: 1,
    event: 'Sale',
    price: '1.1',
    currency: 'SOL',
    from: 'Mark Bold',
    to: 'Alex Green',
    date: '2 days ago'
  },
  {
    id: 2,
    event: 'Sale',
    price: '1.1',
    currency: 'SOL',
    from: 'Mark Bold',
    to: 'Alex Green',
    date: '2 days ago'
  },
  {
    id: 3,
    event: 'Sale',
    price: '1.1',
    currency: 'SOL',
    from: 'Mark Bold',
    to: 'Alex Green',
    date: '2 days ago'
  },
  {
    id: 4,
    event: 'Sale',
    price: '1.1',
    currency: 'SOL',
    from: 'Mark Bold',
    to: 'Alex Green',
    date: '2 days ago'
  }
])

// Chart configuration
const chartOption = ref({})

// Update chart configuration
const updateChartOption = async () => {
  // Prepare chart data
  const dates = priceHistoryData.value.map((item) => {
    const date = new Date(item.date)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    return `${month} ${day}`
  })
  const prices = priceHistoryData.value.map((item) => item.price)

  chartOption.value = {
    grid: {
      left: '20px',
      right: '20px',
      bottom: '40px',
      top: '20px',
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        show: false
      },
      axisLabel: {
        color: '#999999',
        fontSize: 10,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      min: function(value: any) {
        return (value.min * 0.9).toFixed(2);
      },
      max: function(value: any) {
        return (value.max * 1.1).toFixed(2);
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: '#333333'
        }
      },
      axisLabel: {
        color: '#999999',
        fontSize: 10,
        formatter: function (value: number) {
          return value.toFixed(2) + ' SOL'
        }
      }
    },
    series: [
      {
        data: prices,
        type: 'line',
        smooth: true, // Enable smooth curves
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#FFFFFF',
          borderColor: '#FFFFFF',
          borderWidth: 2
        },
        lineStyle: {
          width: 3,
          color: '#FFFFFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(255, 255, 255, 0.3)'
              },
              {
                offset: 1,
                color: 'rgba(255, 255, 255, 0.05)'
              }
            ]
          }
        },
        emphasis: {
          scale: true,
          focus: 'series',
          itemStyle: {
            color: '#FFFFFF',
            borderColor: '#ffffff',
            borderWidth: 3
          },
          symbolSize: 10
        }
      }
    ],
    tooltip: {
      trigger: 'axis',
      formatter: function (params: any) {
        const dataIndex = params[0].dataIndex
        const value = params[0].value
        const date = dates[dataIndex]
        
        // Calculate average price
        const totalPrice = prices.reduce((sum: number, price: number) => sum + price, 0)
        const avgPriceValue = (totalPrice / prices.length).toFixed(2)
        
        // Get latest date - the last date using raw price data
        const latestPriceData = priceHistoryData.value[priceHistoryData.value.length - 1]
        const latestDateFormatted = new Date(latestPriceData.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })

        return `<div style="background: #222222; color: white; border-radius: 12px; padding: 16px; min-width: 160px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                  <div style="font-size:14px; color:#ffffff; text-transform: uppercase; margin-bottom: 8px; font-weight: 500;">AVG. PRICE:</div>
                  <div style="font-size:18px; font-weight:bold; color:#ffffff; margin-bottom: 4px;">${avgPriceValue} SOL</div>
                  <div style="font-size:14px; color:#ffffff;">${latestDateFormatted}</div>
                </div>`
      },
      backgroundColor: 'transparent',
      borderWidth: 0,
      textStyle: {
        color: '#ffffff'
      },
      extraCssText: 'box-shadow: none; border: none;'
    },
    axisPointer: {
      show: true,
      type: 'line',
      lineStyle: {
        color: '#FFFFFF',
        width: 1,
        type: 'dashed'
      }
    }
  }

  await nextTick()
  if (chartRef.value?.resize) {
    chartRef.value.resize()
  }
}

// method
const toggleSection = (section: string) => {
  (openSections as any)[section] = !(openSections as any)[section]
}

const goBack = () => {
  window.history.back()
}

// Format address
const formatAddress = (address: string) => {
  if (!address) return '--'
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Format expiration time
const formatExpiration = (expireAt: number) => {
  const now = Date.now()
  const diffMs = expireAt - now
  
  if (diffMs <= 0) return 'Expired'
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (diffDays > 0) return `${diffDays} days`
  if (diffHours > 0) return `${diffHours} hours`
  return 'Less than 1 hour'
}

// Check if bidding can be authorized
const canApproveBid = (bid: BidListItem) => {
  if (!wallet.connected.value || !nftDetail.value) return false
  
  // Only the NFT owner or VITE_MARKETPLACE_ADDRESS can authorize bidding
  const userAddress = wallet.publicKey?.value?.toString()
  const isOwner = userAddress === nftDetail.value.ownerAddress
  
  // Check if it is VITE_MARKETPLACE_ADDRESS authorized address
  const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS
  const isMarketplaceAuthorized = MARKETPLACE_ADDRESS && userAddress === MARKETPLACE_ADDRESS
  
  // Check if there is already a transfer authorization (using sync version)
  const hasDelegate = checkHasTransferDelegateSync(bid.bidderAddress)
  
  return (isOwner || isMarketplaceAuthorized) && bid.status === 'pending' && !hasDelegate
}

// Check if there is already transfer delegation authorization - use the method in Store
const checkHasTransferDelegate = async (bidderAddress: string) => {
  if (!nftDetail.value) return false
  
  try {
    // NFT contract address
    const assetAddress = nftDetail.value.contractAddress || route.params.contractAddress as string
    
    // Check Transfer Delegate using method in Store
    const result = await coreNftStore.checkTransferDelegate(assetAddress, bidderAddress)
    
    if (result.success) {
      console.log('🔍 Transfer delegate check result:')
      console.log('- Asset:', assetAddress)
      console.log('- Checking for bidder:', bidderAddress)
      console.log('- Has delegate:', result.hasDelegate)
      console.log('- Current delegate:', result.delegateAddress)
      
      return result.hasDelegate
    }
    
    return false
  } catch (error) {
    console.warn('⚠️ Failed to check transfer delegate:', error)
    return false
  }
}

// Synchronized version, used for computed properties
const checkHasTransferDelegateSync = (bidderAddress: string) => {
  // This function is used for UI rendering, and the actual inspection needs to be performed asynchronously.
  // Consider using caching or state management to store inspection results
  return true
}

// Check if the user has an authorized bid (on-chain Transfer Delegate)
const hasApprovedBid = computed(() => {
  if (!wallet.connected.value) return false
  
  const userAddress = wallet.publicKey?.value?.toString()
  return checkHasTransferDelegateSync(userAddress || '') 
  // return bidList.value.some(bid => 
  //   bid.bidderAddress === userAddress && (
  //     bid.status === 'approved' || 
  //     checkHasTransferDelegateSync(userAddress) // Check on-chain authorization
  //   )
  // )
})

// Load NFT details data
const loadNftDetail = async () => {
  const tokenAddress = route.params.contractAddress as string
  const tokenId = route.params.tokenId as string
  console.log(tokenAddress, tokenId,'x')
  if (!tokenAddress) {
    message.error('Invalid NFT parameters')
    return
  }
  
  loading.value = true
  try {
    const response = await getNftDetail(tokenAddress, tokenId)
    console.log('NFT Detail API Response:', response)
    
    if (response.code === 200 && response.data) {
      nftDetail.value = response.data
      // After loading the NFT details, load the bid list at the same time
      await loadBidList()
    } else {
      console.error('NFT Detail API Error:', response)
      message.error(response.message || 'Failed to load NFT details')
    }
  } catch (error) {
    console.error('Failed to load NFT details:', error)
    message.error('Failed to load NFT details')
  } finally {
    loading.value = false
  }
}

// Load bid list
const loadBidList = async () => {
  if (!nftDetail.value) return
  
  try {
    const response = await getNftBidList({
      nftId: nftDetail.value.id,
      pageNum: 1,
      pageSize: 50
    })
    
          if (response.code === 200 && response.data) {
        console.log('Bid list loaded:', response.data.records)
        bidList.value = response.data.records
      console.log('Bid list loaded:', response.data.records)
    } else {
      console.error('Failed to load bid list:', response)
    }
  } catch (error) {
    console.error('Failed to load bid list:', error)
  }
}

// Check wallet connection status
const checkWalletConnection = () => {
  if (!wallet.connected.value) {
      modalStore.toggleLoginEntryModal(true)
      modalStore.setLoginEntryConnectType('connect')
      modalStore.setLoginEntryType('solana')
    return false
  }
  return true
}

// Check if it is available for purchase
const canPurchase = computed(() => {
  if (!nftDetail.value || !wallet.connected.value) return false
  
  // Check if it is your own NFT
  if (nftDetail.value.ownerAddress === wallet.publicKey?.value?.toString()) {
    return false
  }
  
  // New purchase flow: only buy if user has an authorized bid
  return hasApprovedBid.value
})

// Buy NFT
const handlePurchaseNft = async () => {
  console.log('🛒 Initiating NFT purchase...')
  
  // Check wallet connection
  if (!checkWalletConnection()) {
    message.warning('Please connect your wallet first')
    return
  }
  
  if (!nftDetail.value) {
    message.error('NFT details not loaded')
    return
  }
  
  // Check if it is available for purchase
  if (!canPurchase.value) {
    if (nftDetail.value.ownerAddress === wallet.publicKey?.value?.toString()) {
      message.warning('You cannot purchase your own NFT')
    } else if (!hasApprovedBid.value) {
      message.warning('You need to place a bid and get it approved before you can purchase this NFT')
      showBidModal.value = true
      return
    } else {
      message.warning('This NFT is not available for purchase')
    }
    return
  }
  
  try {
    purchaseLoading.value = true
    
    // Get the contract address of the NFT as the asset address
    const assetAddress = nftDetail.value.contractAddress || route.params.contractAddress as string
    const buyerAddress = wallet.publicKey?.value?.toString()
    console.log(bidList.value,'bidList.value')
    // Find a user's bidding information
    const userBid = bidList.value.find(bid => bid.bidderAddress === buyerAddress)
    if (!userBid) {
      message.error('No valid bid found for this user')
      return
    }
    
    console.log('📝 Purchase details:')
    console.log('- Asset Address:', assetAddress)
    console.log('- Bid Price:', userBid.bidPrice, 'SOL')
    console.log('- Seller:', nftDetail.value.ownerAddress)
    console.log('- Buyer:', buyerAddress)
    
    // Check if there is Transfer Delegate authorization
    const hasTransferAuth = await checkHasTransferDelegate(buyerAddress || '')
    
    if (hasTransferAuth) {
      // With Transfer Delegate authorization, transfer NFT directly
      message.loading({ content: 'Transferring NFT using delegate authority...', key: 'purchaseNFT' })
      
      // 1. Use the method in the Store to transfer NFT (on-chain transaction)
      const transferResult = await coreNftStore.transferNftAsDelegate(assetAddress, userBid.bidPrice, nftDetail.value.ownerAddress)
      
      if (transferResult.success) {
        console.log('✅ NFT transferred using delegate authority!')
        console.log('- Transfer signature:', transferResult.signature)
        
        // 2. After the on-chain transaction is successful, call the backend API to update the database
        try {
          message.loading({ content: 'Updating NFT ownership in database...', key: 'purchaseNFT' })
          
          const purchaseParams: PurchaseNftParams = {
            nftId: nftDetail.value.id,
            buyerAddress: buyerAddress || '',
            sellerAddress: nftDetail.value.ownerAddress,
            price: userBid.bidPrice,
            currency: userBid.currency || 'SOL',
            bidId: userBid.bidId,
            proof: {
              value: transferResult.signature || '',
              method: 'delegate_transfer'
            }
          }
          
          console.log('📤 Calling purchase API:', purchaseParams)
          const purchaseResponse = await purchaseNft(purchaseParams)
          
          if (purchaseResponse.code === 200) {
            console.log('✅ Backend database updated successfully!')
            console.log('- Order ID:', purchaseResponse.data.orderId)
            console.log('- Ownership updated:', purchaseResponse.data.nftOwnershipUpdated)
            
            message.success({ 
              content: `NFT purchased and transferred successfully for ${userBid.bidPrice} SOL!`,
              key: 'purchaseNFT',
              duration: 5
            })
            
            // Reload NFT details after successful purchase
            await loadNftDetail()
            
            return {
              success: true,
              signature: transferResult.signature,
              orderId: purchaseResponse.data.orderId,
              transferred: true,
              paymentCompleted: true,
              method: 'delegate_transfer'
            }
          } else {
            console.warn('⚠️ Backend update failed:', purchaseResponse.message)
            message.warning({ 
              content: `NFT transferred on-chain but database update failed: ${purchaseResponse.message}`,
              key: 'purchaseNFT',
              duration: 8
            })
            
            // Details are reloaded even if the backend fails and the on-chain transaction is successful
            await loadNftDetail()
            
            return {
              success: true,
              signature: transferResult.signature,
              transferred: true,
              paymentCompleted: false,
              method: 'delegate_transfer',
              warning: 'Database update failed'
            }
          }
        } catch (apiError) {
          console.error('❌ Backend API error:', apiError)
          message.warning({ 
            content: 'NFT transferred on-chain but failed to update backend. Please refresh the page.',
            key: 'purchaseNFT',
            duration: 8
          })
          
          // Reload details
          await loadNftDetail()
          
          return {
            success: true,
            signature: transferResult.signature,
            transferred: true,
            paymentCompleted: false,
            method: 'delegate_transfer',
            error: apiError
          }
        }
      } else {
        console.error('❌ Transfer failed:', transferResult.error)
        message.error({ 
          content: transferResult.message || 'Failed to transfer NFT',
          key: 'purchaseNFT'
        })
        return {
          success: false,
          error: transferResult.error
        }
      }
      
    } else {
      // No Transfer Delegate authorization
      console.warn('⚠️ No Transfer Delegate authorization found for buyer')
      console.log('📝 Important: The seller must approve your bid first in a separate transaction')
      console.log('📝 After approval is confirmed on-chain, you can then purchase the NFT')
      
      message.error({ 
        content: 'Your bid needs to be approved first! Ask the seller to click "APPROVE" on your bid, then try purchasing again after the transaction is confirmed.',
        duration: 10
      })
      
      // Reload bid list to get latest status
      await loadBidList()
      
      return {
        success: false,
        error: 'No transfer delegate authorization found. Seller must approve bid first.',
        needsApproval: true
      }
    }
    
  } catch (error) {
    console.error('❌ Purchase error:', error)
    message.error('Failed to purchase NFT. Please try again.')
  } finally {
    purchaseLoading.value = false
  }
}

// Make an offer - redirect to bidding function
const handleMakeOffer = async () => {
  console.log('💰 Making offer for NFT...')
  
  // Check wallet connection
  if (!checkWalletConnection()) {
    message.warning('Please connect your wallet first')
    return
  }
  
  if (!nftDetail.value) {
    message.error('NFT details not loaded')
    return
  }
  
  // Show bid modal
  showBidModal.value = true
}

// Process bids
const handlePlaceBid = async (bidData: { amount: number, expiryDays: number }) => {
  console.log('📝 Placing bid:', bidData)
  
  if (!nftDetail.value) {
    message.error('NFT details not loaded')
    return
  }
  
  try {
    bidLoading.value = true
    
    const params: PlaceBidParams = {
      nftId: nftDetail.value.id,
      bidPrice: bidData.amount,
      currency: 'SOL', // Use SOL by default
      expireAt: Date.now() + (bidData.expiryDays * 24 * 60 * 60 * 1000),
      bidderAddress: wallet.publicKey?.value?.toString() || ''
    }
    
    const response = await placeNftBid(params)
    
    if (response.code === 200) {
      message.success(`Bid of ${bidData.amount} SOL placed successfully!`)
      showBidModal.value = false
      // Reload bid list
      await loadBidList()
    } else {
      message.error(response.message || 'Failed to place bid')
    }
    
  } catch (error) {
    console.error('❌ Place bid error:', error)
    message.error('Failed to place bid. Please try again.')
  } finally {
    bidLoading.value = false
  }
}

// Authorize bidding - using methods from the Store
const handleApproveBid = async (bidId: number, bidderAddress: string) => {
  console.log('✅ Approving bid on-chain:', bidId, 'for bidder:', bidderAddress)
  
  if (!nftDetail.value) {
    message.error('NFT details not loaded')
    return
  }
  
  // Check wallet connection
  if (!checkWalletConnection()) {
    message.warning('Please connect your wallet first')
    return
  }
  
  try {
    approvingBids.value.add(bidId)
    message.loading({ content: 'Creating transfer delegate on-chain...', key: 'approveBid' })
    
    // NFT contract address
    const assetAddress = nftDetail.value.contractAddress || route.params.contractAddress as string
    
    console.log('📝 Transfer delegate details:')
    console.log('- Asset Address:', assetAddress)
    console.log('- Delegate to:', bidderAddress)
    console.log('- Current user:', wallet.publicKey?.value?.toString())
    
    // Create Transfer Delegate authorization using methods in Store
    const result = await coreNftStore.approveTransferDelegate(assetAddress, bidderAddress)
    console.log(result,'result1')
    if (result.success) {
      console.log('✅ Transfer delegate approved on-chain!')
      console.log('- Transaction signature:', result.signature)
      
      // Get bid information to display prices
      const approvedBid = bidList.value.find(bid => bid.bidId === bidId)
      const bidPriceInfo = approvedBid ? ` NFT price updated to ${approvedBid.bidPrice} ${approvedBid.currency}.` : ''
      
      message.success(`Transfer authority granted to bidder! Transaction: ${result.signature}.${bidPriceInfo}`)
      
      // Update backend API status and update NFT price
      try {
        await approveNftBid({ 
          bidId,
          nftId: nftDetail.value.id 
        })
        console.log('✅ Backend bid status updated and NFT price updated')
      } catch (apiError) {
        console.warn('⚠️ Failed to update backend bid status:', apiError)
        // Does not block the main process because the on-chain authorization has been successful
      }
      
      // Reload NFT details (with updated price information)
      console.log('🔄 Reloading NFT detail after bid approval...')
      await loadNftDetail()
      console.log('✅ NFT detail reloaded. New price info:', nftDetail.value?.priceInfo)
    } else {
      console.error('❌ Transfer delegate failed:', result.error)
      message.error({ 
        content: result.message || 'Failed to create transfer delegate. Please try again.',
        key: 'approveBid'
      })
    }
    
  } catch (error) {
    console.error('❌ Approve bid error:', error)
    message.error({ 
      content: 'Failed to create transfer delegate. Please try again.',
      key: 'approveBid'
    })
  } finally {
    approvingBids.value.delete(bidId)
  }
}

// Handle quote submission - now redirected to bidding functionality
const handleOfferSubmit = async (offerData: { amount: number, expiryDays: number }) => {
  // Use new bidding features
  await handlePlaceBid(offerData)
}

// Close the quote modal box
const handleOfferModalClose = () => {
  showOfferModal.value = false
}

// Monitor currency changes and update charts
watch(selectedCurrency, () => {
  updateChartOption()
})

onMounted(async () => {

  // Load NFT details data
  await loadNftDetail()
  
  // Initialize chart
  await updateChartOption()
  
  // Delay chart resizing
  setTimeout(async () => {
    await nextTick()
    if (chartRef.value?.resize) {
      chartRef.value.resize()
    }
  }, 100)
})
</script>

<style scoped lang="scss">
.nft-detail-container {
  min-height: 100vh;
  background: #000000;
  color: #ffffff;
  padding-top: 72px;
}

.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  .loading-spinner {
    color: #FFFFFF;
    font-size: 18px;
    font-weight: 500;
  }
}

.back-section {
  padding: 20px 40px;
  border-bottom: 1px solid #333333;
  
  .back-btn {
    background: none;
    border: none;
    color: #999999;
    font-size: 14px;
    cursor: pointer;
    transition: color 0.2s ease;
    
    &:hover {
      color: #ffffff;
    }
  }
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  padding: 40px;
  margin: 0 auto;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 20px;
  }
}

.nft-image-section {
  .nft-image-container {
    position: relative;
    border-radius: 20px;
    background: rgba(187, 187, 187, 0.2);
    
    overflow: hidden;
    aspect-ratio: 1;
    padding: 16px; // Padding of image container
    
    .rating-badge {
      position: absolute;
      top: 14px;
      right: 16px;
      width: 182px;
      height: 46px;
      background: rgba(187, 187, 187, 0.2); // #BBBBBB with 20% opacity
      backdrop-filter: blur(10px); // frosted glass effect
      -webkit-backdrop-filter: blur(10px); // Safari support
      border-radius: 32px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1); // Weak bezel enhances frosted glass effect
      
      .rating-number {
        color: #fff;
        font-weight: bold;
        font-size: 16px;
        line-height: 1;
      }
      
      .rating-text {
        color: #fff;
        font-weight: 400;
        font-size: 16px;
        white-space: nowrap;
      }
    }
    
    .nft-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 12px; // Picture internal rounded corners
    }
    
    .nft-image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a1a;
      border-radius: 12px;
      color: #666666;
      font-size: 14px;
    }
  }

  .tabs-section {
    margin-top: 24px;
    border: 1px solid #3d3d3d;
    border-radius: 24px;
    padding: 16px;
    .tabs-container {
      display: flex;
      gap: 0;
      background: #1a1a1a;
      border-radius: 30px;
      padding: 4px;
      margin-bottom: 24px;
      
      .tab-button {
        flex: 1;
        background: transparent;
        border: none;
        color: #999999;
        font-weight: 600;
        font-size: 14px;
        padding: 12px 16px;
        cursor: pointer;
        border-radius: 26px;
        transition: all 0.2s ease;
        white-space: nowrap;
        
        &.active {
          background: #FFFFFF;
          color: #000000;
        }
        
        &:hover:not(.active) {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }
    
    .tab-content {
      .description-content {
        p {
          color: #cccccc;
          line-height: 1.6;
          margin-bottom: 24px;
          font-size: 14px;
        }
        
        .stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
          
          .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #333333;
            
            .stat-label {
              color: #999999;
              font-size: 14px;
            }
            
            .stat-value {
              color: #ffffff;
              font-weight: 600;
              font-size: 14px;
            }
          }
        }
      }
      
      .properties-content {
        .attributes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          
          .attribute-item {
            background: #1a1a1a;
            border: 1px solid #333333;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
            
            .trait-type {
              color: #999999;
              font-size: 12px;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            
            .trait-value {
              color: #ffffff;
              font-size: 16px;
              font-weight: 600;
            }
            
            .display-type {
              color: #666666;
              font-size: 10px;
              margin-top: 4px;
            }
          }
        }
        
        .no-attributes {
          color: #cccccc;
          text-align: center;
          padding: 40px 0;
          font-size: 14px;
        }
      }
      
      .details-content {
        .details-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
          
          .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #333333;
            
            &:last-child {
              border-bottom: none;
            }
            
            .detail-label {
              color: #999999;
              font-size: 14px;
            }
            
            .detail-value {
              color: #ffffff;
              font-size: 14px;
              font-weight: 500;
            }
            
            .detail-link {
              color: #FFFFFF;
              text-decoration: underline;
              font-size: 14px;
              
              &:hover {
                color: #FFFFFF;
              }
            }
          }
        }
        
        .no-details {
          color: #cccccc;
          text-align: center;
          padding: 40px 0;
          font-size: 14px;
        }
      }
      
      .listing-content {
        color: #cccccc;
        min-height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }
    }
  }
}

.nft-info-section {
  .nft-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .collection-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .collection-icon {
        font-size: 16px;
      }
      
      .collection-name {
        color: #fff;
        font-style: normal;
        font-weight: 500;
        font-size: 14px;
        line-height: 140%;
        text-transform: uppercase;

      }
    }
    
    .action-icons {
      display: flex;
      gap: 12px;
      
      .icon-btn {
        width: 24px;
        height: 24px;
        background: #222222;
        border: none;
        border-radius: 8px;
        color: #999999;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        
        &:hover {
          background: #333333;
          color: #ffffff;
        }
      }
    }
  }
  
  .nft-title {
    font-style: normal;
    font-weight: 900;
    font-size: 32px;
    line-height: 132%;
    color: #FFFFFF;
  }
  
  .owner-info {
    margin: 0 0 30px 0;
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 140%;
    color: #FFFFFF;
    
    .owner-link {
      color: #FFFFFF;
      text-decoration: underline;
    }
    
    .own-indicator {
      color: #FFFFFF;
      font-weight: 500;
      margin-left: 8px;
    }
  }
  
  .price-section {
    background: #111111;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    
    .total-value {
      .label {
        color: #999999;
        font-size: 14px;
        display: block;
        margin-bottom: 8px;
      }
      
      .price {
        .amount {
          font-size: 32px;
          font-weight: bold;
          color: #ffffff;
        }
        
        .usd-value {
          display: block;
          color: #999999;
          font-size: 18px;
          margin-top: 4px;
        }
      }
    }
  }
  
  .action-buttons {
    display: flex;
    gap: 12px;
    margin-bottom: 40px;
    
    .buy-now-btn {
      flex: 1;
      background: #FFFFFF;
      border: none;
      border-radius: 50px;
      color: #000000;
      font-weight: bold;
      font-size: 16px;
      padding: 16px 32px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        background: #FFFFFF;
        transform: translateY(-1px);
      }
      
      &:disabled {
        background: #666666;
        color: #999999;
        cursor: not-allowed;
        transform: none;
      }
    }
    
    .cart-btn {
      width: 52px;
      height: 52px;
      background: #FFFFFF;
      border: none;
      border-radius: 50%;
      color: #000000;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        background: #FFFFFF;
        transform: translateY(-1px);
      }
      
      &:disabled {
        background: #666666;
        color: #999999;
        cursor: not-allowed;
        transform: none;
      }
    }
    
    .make-offer-btn {
      flex: 1;
      background: #ffffff;
      border: 2px solid #ffffff;
      border-radius: 50px;
      color: #000000;
      font-weight: bold;
      font-size: 16px;
      padding: 16px 32px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        background: #000000;
        color: #ffffff;
      }
      
      &:disabled {
        background: #666666;
        border-color: #666666;
        color: #999999;
        cursor: not-allowed;
      }
    }
  }
}

// foldable area
.price-history-section,
.offers-section,
.listing-section,
.activity-section {
  background: #0a0a0a;
  border: 1px solid #3d3d3d;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 16px 0;
    border-bottom: none;
    cursor: pointer;
    font-weight: 600;
    font-size: 16px;
    color: #ffffff;
    text-transform: uppercase;
    
    &:hover {
      color: #FFFFFF;
    }
    
    .expand-icon {
      font-size: 14px;
      transition: transform 0.2s ease;
      color: #999999;
      .icon-btn {
        width: 24px;
        height: 24px;
      }
    }
  }
  
  .section-content {
    padding: 20px 0 0 0;
  }
}

// price history
.currency-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  
  .currency-tab {
    background: transparent;
    border: none;
    color: #666666;
    padding: 8px 0;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    position: relative;
    
    &.active {
      color: #FFFFFF;
      font-weight: 600;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: #FFFFFF;
      }
    }
    
    &:hover:not(.active) {
      color: #ffffff;
    }
  }
}

.price-chart {
  .chart-placeholder {
    height: 200px;
    background: #111111;
    border-radius: 8px;
    padding: 20px;
    position: relative;
    
    :deep(.echarts) {
      width: 100% !important;
      height: 160px !important;
    }
  }
}

// table style
.offers-table,
.listing-table,
.activity-table {
  .table-header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    gap: 16px;
    padding: 0 0 12px 0;
    border-bottom: 1px solid #3d3d3d;
    color: #666666;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  
  .table-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid #2a2a2a;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      margin: 0 -12px;
      padding: 16px 12px;
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    .price {
      color: #ffffff;
      font-weight: 600;
      font-size: 14px;
    }
    
    .usd-price {
      color: #999999;
      font-size: 14px;
    }
    
    .floor-diff {
      color: #ff6b6b;
      font-size: 14px;
    }
    
    .expiration {
      color: #999999;
      font-size: 14px;
    }
    
    .from {
      color: #ffffff;
      text-decoration: underline;
      cursor: pointer;
      font-size: 14px;
      
      &:hover {
        color: #FFFFFF;
      }
    }
    
    .status {
      font-size: 14px;
      font-weight: 500;
      text-transform: capitalize;
      
      &.pending {
        color: #ff9800;
      }
      
      &.approved {
        color: #4caf50;
      }
      
      &.expired {
        color: #f44336;
      }
    }
    
    .action-cell {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .approve-btn {
      background: #FFFFFF;
      border: none;
      border-radius: 20px;
      color: #000000;
      font-weight: bold;
      font-size: 12px;
      padding: 8px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      height: 32px;
      
      &:hover {
        background: #FFFFFF;
        transform: translateY(-1px);
      }
    }
    
    .approved-text {
      color: #4caf50;
      font-size: 12px;
      font-weight: 500;
    }
    
    .expired-text {
      color: #f44336;
      font-size: 12px;
      font-weight: 500;
    }
    
    .pending-text {
      color: #ff9800;
      font-size: 12px;
      font-weight: 500;
    }
    
    .no-offers {
      text-align: center;
      color: #999999;
      padding: 40px 20px;
      font-style: italic;
    }
    
    .buy-btn {
      background: #FFFFFF;
      border: none;
      border-radius: 20px;
      color: #000000;
      font-weight: bold;
      font-size: 12px;
      padding: 8px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      justify-self: end;
      height: 32px;
      
      &:hover {
        background: #FFFFFF;
        transform: translateY(-1px);
      }
    }
  }
}

// Activity filter
.activity-filters {
  display: flex;
  gap: 32px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  
  .filter-option {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    font-size: 14px;
    color: #ffffff;
    
    input[type="checkbox"] {
      display: none;
    }
    
    .checkmark {
      width: 20px;
      height: 20px;
      background: transparent;
      border: 2px solid #3d3d3d;
      border-radius: 4px;
      color: #FFFFFF;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      transition: all 0.2s ease;
      position: relative;
    }
    
    input:checked + .checkmark {
      background: #FFFFFF;
      border-color: #FFFFFF;
      
      &::before {
        opacity: 1;
        transform: scale(1);
        color: #000000;
      }
    }
    
    &:hover .checkmark {
      border-color: #FFFFFF;
    }
  }
}

// Activity record form special style
.activity-table {
  .table-row {
    .event {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ffffff;
      font-size: 14px;
    }
    
    .price {
      color: #ffffff;
      font-weight: 600;
      font-size: 14px;
    }
    
    .from,
    .to {
      color: #ffffff;
      text-decoration: underline;
      cursor: pointer;
      font-size: 14px;
      
      &:hover {
        color: #FFFFFF;
      }
    }
    
    .date {
      color: #999999;
      font-size: 14px;
    }
  }
}



// Responsive design
@media (max-width: 768px) {
  .main-content {
    padding: 20px;
  }
  
  .nft-info-section {
    .nft-title {
      font-size: 24px;
    }
    
    .action-buttons {
      flex-direction: column;
      
      .cart-btn {
        align-self: center;
      }
    }
  }
  
  .nft-image-section {
    .tabs-section {
      .tabs-container {
        flex-direction: column;
        gap: 8px;
        padding: 8px;
        
        .tab-button {
          padding: 10px 12px;
          font-size: 12px;
        }
      }
      
      .tab-content {
        .description-content {
          p {
            font-size: 12px;
          }
          
          .stats {
            .stat-item {
              .stat-label,
              .stat-value {
                font-size: 12px;
              }
            }
          }
        }
      }
    }
  }
  
  .offers-table,
  .listing-table,
  .activity-table {
    .table-header,
    .table-row {
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      font-size: 12px;
      
      span:nth-child(3),
      span:nth-child(4) {
        display: none;
      }
    }
    
    .table-row {
      padding: 12px 0;
      
      &:hover {
        margin: 0 -8px;
        padding: 12px 8px;
      }
    }
  }
  
  // Mobile area style adjustment
  .price-history-section,
  .offers-section,
  .listing-section,
  .activity-section {
    padding: 16px;
    margin-bottom: 16px;
    
    .section-header {
      font-size: 14px;
    }
    
    .section-content {
      padding: 16px 0 0 0;
    }
  }
  
  // Mobile Currency Tags
  .currency-tabs {
    gap: 8px;
    
    .currency-tab {
      font-size: 12px;
      padding: 6px 0;
    }
  }
  
  // Mobile activity filter
  .activity-filters {
    gap: 16px;
    
    .filter-option {
      gap: 8px;
      font-size: 12px;
      
      .checkmark {
        width: 16px;
        height: 16px;
        font-size: 10px;
      }
    }
  }
}
</style> 