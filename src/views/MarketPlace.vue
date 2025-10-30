<template>
  <AigcHeader />
  <div class="marketplace-container">
    <!-- Top search and control area -->
    <div class="marketplace-header">
      <div class="search-section">
        <button class="back-btn" @click="goBack">
          ← FILTERS
        </button>
        <div class="search-container">
          <input 
            type="text" 
            placeholder="Search items, collections and accounts"
            v-model="searchQuery"
            class="search-input"
          />
          <button class="search-btn"><SvgIcon name="search" /></button>
        </div>
        <div class="sort-container">
          <select v-model="sortOption" @change="handleSortChange" class="sort-select">
            <option value="price-low-high">Price: Low to High</option>
            <option value="price-high-low">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
        <!-- debug button -->
        <!-- <div v-if="isDev" class="debug-controls">
          <button @click="debugLocalStorage" class="debug-btn">Debug Storage</button>
          <button @click="clearAllData" class="debug-btn">Clear Data</button>
          <button @click="initSampleData" class="debug-btn">Init Sample</button>
        </div> -->
      </div>
      <div class="layout-controls">
        <button 
          class="layout-btn" 
          :class="{ active: layoutMode === 'grid' }"
          @click="setLayoutMode('grid')"
          title="Grid View (4 columns)"
        >
          <SvgIcon name="box1" />
        </button>
        <button 
          class="layout-btn" 
          :class="{ active: layoutMode === 'large' }"
          @click="setLayoutMode('large')"
          title="Large View (5 columns)"
        >
           <SvgIcon name="box2" />
        </button>
        <button 
          class="layout-btn" 
          :class="{ active: layoutMode === 'list' }"
          @click="setLayoutMode('list')"
          title="List View"
        >
            <SvgIcon name="lines" />
        </button>
      </div>
    </div>

    <!-- main content area -->
    <div class="marketplace-body">
      <!-- Filter area on the left -->
      <aside class="filters-sidebar">
        <div class="filters-header">
          <h3 class="filters-title">FILTERS</h3>
        </div>

      <!-- price filter -->
      <div class="filter-section">
        <button class="filter-header" @click="toggleSection('price')" :class="{ active: openSections.price }">
          <span>PRICE</span>
          <span class="toggle-icon">{{ openSections.price ? '−' : '+' }}</span>
        </button>
        <div class="filter-content" v-show="openSections.price">
          <div class="price-container">
            <div class="price-inputs">
              <input type="number" placeholder="Min" v-model="filters.priceMin" class="price-input" />
              <span class="price-separator">to</span>
              <input type="number" placeholder="Max" v-model="filters.priceMax" class="price-input" />
              <select v-model="filters.currency" class="currency-select">
                <option value="LIFI">LIFI</option>
              </select>
            </div>
            <button class="apply-btn" @click="applyPriceFilter">APPLY</button>
          </div>
        </div>
      </div>

      <!-- status filter -->
      <div class="filter-section">
        <button class="filter-header" @click="toggleSection('status')" :class="{ active: openSections.status }">
          <span>STATUS</span>
          <span class="toggle-icon">{{ openSections.status ? '−' : '+' }}</span>
        </button>
        <div class="filter-content" v-show="openSections.status">
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input type="checkbox" v-model="filters.status" :value="1" />
              <span class="checkmark"></span>
              Buy Now
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="filters.status" :value="2" />
              <span class="checkmark"></span>
              Auction
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="filters.status" :value="3" />
              <span class="checkmark"></span>
              New
            </label>
          </div>
        </div>
      </div>

      <!-- Market screening -->
      <div class="filter-section">
        <button class="filter-header" @click="toggleSection('marketplace')" :class="{ active: openSections.marketplace }">
          <span>MARKETPLACE</span>
          <span class="toggle-icon">{{ openSections.marketplace ? '−' : '+' }}</span>
        </button>
        <div class="filter-content" v-show="openSections.marketplace">
          <div class="checkbox-group">
            <label class="checkbox-item" v-for="marketplace in marketplaces" :key="marketplace.id">
              <input type="checkbox" v-model="filters.marketplace" :value="marketplace.id" />
              <span class="checkmark"></span>
              <span class="marketplace-icon">{{ marketplace.icon }}</span>
              {{ marketplace.name }}
            </label>
          </div>
        </div>
      </div>

      <!-- Classification filter -->
      <div class="filter-section">
        <button class="filter-header" @click="toggleSection('category')" :class="{ active: openSections.category }">
          <span>CATEGORY</span>
          <span class="toggle-icon">{{ openSections.category ? '−' : '+' }}</span>
        </button>
        <div class="filter-content" v-show="openSections.category">
          <!-- Category content will be added here -->
        </div>
      </div>

      <!-- Collection filtering -->
      <div class="filter-section">
        <button class="filter-header" @click="toggleSection('collection')" :class="{ active: openSections.collection }">
          <span>COLLECTION</span>
          <span class="toggle-icon">{{ openSections.collection ? '−' : '+' }}</span>
        </button>
        <div class="filter-content" v-show="openSections.collection">
          <div class="collection-search">
            <input type="text" placeholder="Search by collection" class="collection-search-input" />
            <button class="collection-search-btn"><SvgIcon name="search" /></button>
          </div>
          <div class="checkbox-group">
            <label class="checkbox-item" v-for="collection in collections" :key="collection.id">
              <input type="checkbox" v-model="filters.collections" :value="collection.id" />
              <span class="checkmark"></span>
              {{ collection.name }}
            </label>
          </div>
        </div>
      </div>
    </aside>

      <!-- Right content area -->
      <main class="main-content">
      <!-- NFT list -->
      <div v-if="layoutMode !== 'list'" class="nft-grid" :class="`layout-${layoutMode}`">
        <GlassCard 
          v-for="nft in filteredNfts" 
          :key="nft.id"
          :background-image="nft.imageUrl || '/default-nft.png'"
          :height="layoutMode === 'large' ? '380px' : '420px'"
          border-radius="12px"
          :hover-effect="true"
          @click="selectNft(nft)"
          class="nft-glass-card"
        >
          <!-- Upper frosted glass layer - Creator information -->
          <template #topOverlay>
            <div class="user-info">
              <div class="user-avatar">
                <img :src="createAvatarPlaceholder(nft.creatorAddress || 'unknown')" :alt="nft.creatorAddress || 'Unknown'" />
              </div>
              <div class="user-details">
                <h3 class="user-name">{{ formatAddress(nft.creatorAddress) }}</h3>
                <p class="user-id">Creator</p>
              </div>
              <button class="follow-btn">Follow</button>
            </div>
          </template>

          <!-- Lower frosted glass layer - NFT details -->
          <template #bottomOverlay>
            <div class="stats-container">
              <div class="stat-row">
                <div class="stat-item left">
                  <div class="artwork-title">
                    <h4>{{ nft.name || 'Unnamed NFT' }}</h4>
                    <SvgIcon name="verified" class="verified-icon" v-if="nft.collection?.isVerified" />
                  </div>
                  <span class="stat-label-only">{{ nft.collectionName || 'No Collection' }}</span>
                </div>
                <div class="stat-item center">
                  <span class="stat-value">{{ getFloorPrice(nft) }}</span>
                  <span class="stat-label">FLOOR</span>
                </div>
                <div class="stat-item right">
                  <span class="stat-value">{{ getTotalVolume(nft) }}</span>
                  <span class="stat-label">TOTAL VOLUME</span>
                </div>
              </div>
            </div>
          </template>
        </GlassCard>
      </div>

      <!-- list view -->
      <div v-else class="nft-list">
        <div class="list-header">
          <div class="header-cell">ITEM</div>
          <div class="header-cell">CURRENT PRICE</div>
          <div class="header-cell">BEST OFFER</div>
          <div class="header-cell">LAST SALE</div>
          <div class="header-cell">OWNERS</div>
          <div class="header-cell">TIME</div>
        </div>
        <div 
          class="list-row" 
          v-for="nft in filteredNfts" 
          :key="nft.id"
          @click="selectNft(nft)"
        >
          <div class="list-item-info">
            <input type="checkbox" class="item-checkbox" />
            <img :src="nft.imageUrl || '/default-nft.png'" :alt="nft.name || 'NFT'" class="list-item-image" />
            <span class="list-item-name">{{ nft.name || 'Unnamed NFT' }}</span>
          </div>
          <div class="list-cell">{{ formatPrice(nft) }}</div>
          <div class="list-cell">{{ nft.highestBid || '--' }}</div>
          <div class="list-cell">{{ nft.lastSalePrice || '--' }}</div>
          <div class="list-cell">
            <span class="owner-name">{{ formatAddress(nft.ownerAddress) }}</span>
          </div>
          <div class="list-cell">{{ formatTime(nft.createdAt) }}</div>
        </div>
      </div>

      <!-- load more -->
      <div class="load-more" v-if="hasMore">
        <button class="load-more-btn" @click="loadMore" :disabled="loading">
          {{ loading ? 'Loading...' : 'Load More' }}
        </button>
      </div>
      </main>
    </div>
  </div>
  <Footer />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import AigcHeader from '@/components/AigcHeader.vue'
import GlassCard from '@/components/GlassCard.vue'
import SvgIcon from '@/components/SvgIcon.vue'
import Footer from '@/components/Footer.vue'
import { getNftList, type GetNftListParams, type NftItem } from '@/apis/nft'

// routing
const router = useRouter()

// Development environment identification
const isDev = ref(import.meta.env.DEV)

// Responsive data
const searchQuery = ref('')
const layoutMode = ref('grid') // 'grid', 'list', 'large'
const loading = ref(false)
const hasMore = ref(true)
const sortOption = ref('price-low-high') // Sorting options
const nfts = ref<NftItem[]>([])
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0,
  pages: 0
})

// Filter expansion status
const openSections = reactive({
  price: true,
  status: true,
  marketplace: true,
  category: false,
  collection: true
})

// Filter criteria
const filters = reactive({
  priceMin: '',
  priceMax: '',
  currency: 'LIFI',
  status: [], // By default, all NFTs are displayed without filtering.
  marketplace: [],
  collections: []
})

// state mapping
const statusMapping = {
  'buyNow': 1,
  'auction': 2,
  'new': 3
}

// market data
const marketplaces = [
  { id: 'opensea', name: 'OpenSea', icon: 'O' },
  { id: 'looksrare', name: 'LooksRare', icon: 'L' },
  { id: 'foundation', name: 'Foundation', icon: 'F' },
  { id: 'superrare', name: 'SuperRare', icon: 'S' },
  { id: 'async', name: 'Async Art', icon: 'A' }
]

// Collection data (will be obtained from API)
const collections = ref<Array<{ id: number, name: string }>>([])

// sorting map
const sortMapping = {
  'price-low-high': 'price_asc',
  'price-high-low': 'price_desc',
  'name-asc': 'name_asc',
  'name-desc': 'name_desc',
  'newest': 'created_desc',
  'oldest': 'created_asc',
  'popular': 'volume_desc'
}

// Create an avatar placeholder
const createAvatarPlaceholder = (address: string) => {
if(!address) return ''
  const firstLetter = address.charAt(0).toUpperCase()
  const bgColor = '#666666' 
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" fill="${bgColor}" rx="20"/>
      <text x="20" y="26" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle" fill="white">
        ${firstLetter}
      </text>
    </svg>
  `)}`
}

// Load NFT list data
const loadNftList = async (append: boolean = false) => {
  if (loading.value) return
  
  loading.value = true
  try {
    // Build API parameters
    const params: GetNftListParams = {
      pageNum: append ? pagination.current + 1 : 1,
      pageSize: pagination.size
    }
    
    // price filter
    if (filters.priceMin) (params as any).minPrice = Number(filters.priceMin)
    if (filters.priceMax) (params as any).maxPrice = Number(filters.priceMax)
    
    // status filter
    if (filters.status.length > 0) {
      (params as any).status = filters.status[0] // The API may only support a single state
    }
    
    // Market screening
    if (filters.marketplace.length > 0) {
      (params as any).marketplace = filters.marketplace[0] // The API may only support a single market
    }
    
    // Collection filtering
    if (filters.collections.length > 0) {
      (params as any).collectionId = filters.collections[0] // The API may only support a single collection
    }
    
    const response = await getNftList(params)
    console.log('NFT API Response:', response)
    
    if (response.code === 200 && response.data) {
      const { records = [], total = 0, current = 1, pages = 0 } = response.data
      
      console.log('NFT Records:', records)
      
      if (append) {
        nfts.value = [...nfts.value, ...(records as any)]
      } else {
        nfts.value = records as any
      }
      
      pagination.current = current
      pagination.total = total
      pagination.pages = pages
      hasMore.value = current < pages
      
      console.log('Updated NFTs:', nfts.value.length, 'items')
      console.log('Pagination:', { current, total, pages, hasMore: hasMore.value })
    } else {
      console.error('NFT API Error:', response)
      message.error(response.message || 'Failed to load NFT list')
    }

  } catch (error) {
    console.error('Failed to load NFT list:', error)
    message.error('Failed to load NFT list')
  } finally {
    loading.value = false
  }
}

// Computed properties: NFT after filtering and sorting (local filtering, API already handles most of the filtering)
const filteredNfts = computed(() => {

  let filtered = nfts.value.filter(nft => {
    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      const name = (nft.name || '').toLowerCase()
      const description = (nft.description || '').toLowerCase()
      const collectionName = (nft.collectionName || '').toLowerCase()
      
      if (!name.includes(query) && !description.includes(query) && !collectionName.includes(query)) {
        return false
      }
    }
    
    return true
  })
  
  // Local sorting (if the API does not support sorting)
  switch (sortOption.value) {
    case 'price-low-high':
      return filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
    case 'price-high-low':
      return filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
    case 'name-asc':
      return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    case 'name-desc':
      return filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
    case 'newest':
      return filtered.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeB - timeA
      })
    case 'oldest':
      return filtered.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeA - timeB
      })
    case 'popular':
      return filtered.sort((a, b) => {
        const volumeA = a.collection?.totalVolume || 0
        const volumeB = b.collection?.totalVolume || 0
        return volumeB - volumeA
      })
    default:
      return filtered
  }
})

// method
const toggleSection = (section: string) => {
  (openSections as any)[section] = !(openSections as any)[section]
}

const setLayoutMode = (mode: string) => {
  layoutMode.value = mode
}

const applyPriceFilter = () => {
  console.log('Apply price filter:', filters.priceMin, filters.priceMax, filters.currency)
  loadNftList() // Reload data
}

const selectNft = (nft: NftItem) => {
  console.log('chooseNFT:', nft)
  // Navigate to the NFT details page and use the contract address and tokenId as parameters
  router.push(`/nft/${nft.contractAddress}/`)
}

const loadMore = () => {
  if (hasMore.value && !loading.value) {
    loadNftList(true) // Append mode loads more data
  }
}

const goBack = () => {
  // return logic
  window.history.back()
}

const handleSortChange = () => {
  console.log('Sorting changed to:', sortOption.value)
  // If the API supports sorting, the data can be reloaded
  // loadNftList()
}

// Formatted volume
const formatVolume = (volume: number) => {
  if (volume >= 1000000) {
    return (volume / 1000000).toFixed(1) + 'M'
  } else if (volume >= 1000) {
    return (volume / 1000).toFixed(1) + 'K'
  }
  return volume.toString()
}

// Format time
const formatTime = (timestamp: string) => {
  if (!timestamp) return '--'
  
  try {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days > 0) {
      return `${days}d ago`
    } else if (hours > 0) {
      return `${hours}h ago`
    } else if (minutes > 0) {
      return `${minutes}m ago`
    } else {
      return 'Just now'
    }
  } catch (error) {
    return '--'
  }
}

// Get floor price
const getFloorPrice = (nft: NftItem) => {
  if (nft.collection?.floorPrice !== undefined && nft.collection.floorPrice !== null) {
    return nft.collection.floorPrice.toFixed(2)
  }
  if (nft.price !== undefined && nft.price !== null) {
    return nft.price.toFixed(2)
  }
  return '--'
}

// Get total transaction volume
const getTotalVolume = (nft: NftItem) => {
  if (nft.collection?.totalVolume !== undefined && nft.collection.totalVolume !== null) {
    return formatVolume(nft.collection.totalVolume)
  }
  return '--'
}

// Format price
const formatPrice = (nft: NftItem) => {
  if (nft.price !== undefined && nft.price !== null && nft.priceCurrency) {
    return `${nft.price} ${nft.priceCurrency}`
  }
  return '--'
}

// Format address
const formatAddress = (address: string) => {
  if (!address) return '--'
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Monitor changes in filter conditions
const onFiltersChange = () => {
  pagination.current = 1 // Reset page numbers
  loadNftList() // Reload data
}

// Debugging method - local storage related has been removed
const debugLocalStorage = () => {
  console.log('🔍 Debug Info:', {
    nftsCount: nfts.value.length,
    currentFilters: filters,
    pagination: pagination
  })
  
  message.info(`Loaded: ${nfts.value.length} NFTs`)
}

const clearAllData = () => {
  nfts.value = []
  message.success('All data cleared!')
}

const initSampleData = () => {
  // Has been changed to API mode and no longer uses local storage
  loadNftList()
  message.success('Refreshing data from API...')
}

onMounted(() => {
  // Initial load data
  loadNftList()
})
</script>

<style scoped lang="scss">
.marketplace-container {
  min-height: 100vh;
  background: #000000;
  padding-top: 72px; // Leave space for fixed header
  display: flex;
  flex-direction: column;
}

// Top search and control area
.marketplace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  border-bottom: 1px solid #333333;
  background: #111111;
  gap: 26px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;
    
    .sort-container {
      order: 2; // Place sort selector after search area on mobile
    }
    
    .search-section {
      order: 1;
    }
  }
}

.search-section {
  display: flex;
  align-items: center;
  gap: 26px;
  flex: 1;

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }
}

// main content area
.marketplace-body {
  display: flex;
  flex: 1;
}

// Left filter bar
.filters-sidebar {
  width: 320px;
  background: #111111;
  border-right: 1px solid #333333;
  padding: 20px;
  overflow-y: auto;
  flex-shrink: 0;

  @media (max-width: 1024px) {
    width: 280px;
    padding: 16px;
  }

  @media (max-width: 768px) {
    display: none; // Hide sidebar on mobile
  }
}

.filters-header {
  margin-bottom: 24px;
}

.filters-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.back-btn {
  background: #222222;
  border: none;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0 16px;
  border-radius: 40px;
  transition: background 0.2s ease;
  height: 52px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  
  &:hover {
    color: #FFFFFF;
    background: #333333;
  }
}

.search-container {
  position: relative;
  flex: 1;
  height: 52px;
  
  @media (max-width: 768px) {
    width: 100%;
  }
}

.search-input {
  width: 100%;
  height: 52px;
  background: #222222;
  border: 1px solid #333333;
  border-radius: 40px;
  padding: 0 40px 0 16px;
  color: #ffffff;
  font-size: 14px;
  box-sizing: border-box;
  
  &::placeholder {
    color: #666666;
  }
  
  &:focus {
    outline: none;
    border-color: #FFFFFF;
  }
}

.search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666666;
  cursor: pointer;
}

.sort-container {
  display: flex;
  align-items: center;
  height: 52px;
  
  @media (max-width: 768px) {
    width: 100%;
  }
}

.sort-select {
  background: #222222;
  border: 1px solid #333333;
  border-radius: 40px;
  color: #cccccc;
  font-size: 12px;
  padding: 0 32px 0 12px;
  cursor: pointer;
  min-width: 160px;
  height: 52px;
  white-space: nowrap;
  appearance: none; // Remove default style
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 12px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #FFFFFF;
    color: #ffffff;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FFFFFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  }
  
  &:hover {
    border-color: #555555;
  }
  
  option {
    background: #222222;
    color: #cccccc;
    padding: 8px;
    
    &:hover {
      background: #333333;
    }
  }
  
  @media (max-width: 768px) {
    width: 100%;
    min-width: auto;
    font-size: 14px;
    padding: 10px 32px 10px 12px;
  }
}

// filter blocks
.filter-section {
  margin-bottom: 16px;
  border-bottom: 1px solid #333333;
}

.filter-header {
  width: 100%;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  padding: 16px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:hover {
    color: #FFFFFF;
  }
  
  &.active {
    color: #FFFFFF;
  }
}

.toggle-icon {
  font-size: 16px;
  transition: transform 0.2s ease;
}

.filter-content {
  padding-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden; // Prevent overflow
  
  // Price filter special style
  .price-container {
    margin-top: 8px;
  }
}

// Price filter container (according to design draft style)
.price-container {
  border-radius: 8px;
  padding: 12px;
  background: rgba(34, 34, 34, 0.3);
  transition: border-color 0.3s ease;
  width: 100%;
  box-sizing: border-box;
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.5);
  }
}

.price-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  width: 100%;
}

.price-input {
  flex: 1;
  background: #333333;
  border: 1px solid #555555;
  border-radius: 6px;
  padding: 8px 10px;
  color: #ffffff;
  font-size: 13px;
  min-width: 0; // Allow shrinkage
  
  &::placeholder {
    color: #999999;
  }
  
  &:focus {
    outline: none;
    border-color: #FFFFFF;
    background: #3a3a3a;
  }
}

.price-separator {
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
  padding: 0 2px;
}

.currency-select {
  background: #333333;
  border: 1px solid #555555;
  border-radius: 6px;
  padding: 8px 8px;
  color: #ffffff;
  font-size: 13px;
  cursor: pointer;
  width: 70px; // fixed width
  flex-shrink: 0;
  
  &:focus {
    outline: none;
    border-color: #FFFFFF;
    background: #3a3a3a;
  }
  
  option {
    background: #333333;
    color: #ffffff;
  }
}

.apply-btn {
  background: #FFFFFF;
  border: none;
  border-radius: 20px;
  color: #000000;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 100%;
  box-sizing: border-box;
  
  &:hover {
    background: #FFFFFF;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgb(255, 255, 255);
  }
  
  &:active {
    transform: translateY(0);
  }
}

// Price filter responsive optimization
@media (max-width: 768px) {
  .price-container {
    padding: 10px;
    border-width: 1px;
  }
  
  .price-inputs {
    flex-direction: column;
    gap: 8px;
    margin-bottom: 10px;
  }
  
  .price-separator {
    display: none;
  }
  
  .price-input {
    width: 100%;
    padding: 10px;
    font-size: 16px; // Prevent iOS zooming
    box-sizing: border-box;
  }
  
  .currency-select {
    width: 100%;
    padding: 10px;
    font-size: 16px;
    box-sizing: border-box;
  }
  
  .apply-btn {
    padding: 10px 16px;
    font-size: 13px;
  }
}

// checkbox group
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #cccccc;
  font-size: 14px;
  cursor: pointer;
  
  input[type="checkbox"] {
    display: none;
  }
  
  .checkmark {
    width: 16px;
    height: 16px;
    border: 1px solid #666666;
    border-radius: 3px;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      left: 5px;
      top: 2px;
      width: 4px;
      height: 8px;
      border: solid #000000;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      opacity: 0;
      transition: opacity 0.2s ease;
    }
  }
  
  input:checked + .checkmark {
    background: #FFFFFF;
    border-color: #FFFFFF;
    
    &::after {
      opacity: 1;
    }
  }
  
  &:hover {
    color: #ffffff;
    
    .checkmark {
      border-color: #FFFFFF;
    }
  }
}

.marketplace-icon {
  width: 16px;
  height: 16px;
  background: #333333;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #ffffff;
}

// Collection search
.collection-search {
  position: relative;
  margin-bottom: 16px;
}

.collection-search-input {
  width: 100%;
  background: #222222;
  border: 1px solid #333333;
  border-radius: 6px;
  padding: 8px 32px 8px 12px;
  color: #ffffff;
  font-size: 14px;
  
  &::placeholder {
    color: #666666;
  }
  
  &:focus {
    outline: none;
    border-color: #FFFFFF;
  }
}

.collection-search-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666666;
  cursor: pointer;
}

// main content area
.main-content {
  flex: 1;
  padding: 20px;
  overflow: auto;

  @media (max-width: 768px) {
    padding: 16px;
  }
}

// Content information
.content-info {
  margin-bottom: 24px;
  
  span {
    color: #cccccc;
    font-size: 14px;
  }
}

// Layout control button group
.layout-controls {
  display: flex;
  gap: 16px;
  border: 1px solid #3d3d3d;
  border-radius: 40px;
  padding: 8px;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
}

.layout-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 20px;
  color: #666666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #333333;
    color: #FFFFFF;
  }
  
  &.active {
    background: #FFFFFF;
    color: #000000;
  }
}



// NFT grid
.nft-grid {
  display: grid;
  gap: 24px;
  
  &.layout-grid {
    grid-template-columns: repeat(4, 1fr); // 4 in a row
  }
  
  &.layout-large {
    grid-template-columns: repeat(5, 1fr); // 5 in a row
  }

  @media (max-width: 1400px) {
    &.layout-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    &.layout-large {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (max-width: 1024px) {
    &.layout-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    &.layout-large {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
}

// NFT Glass Card Style
.nft-glass-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 24px rgba(255, 255, 255, 0.1);
  }
}

// Upper frosted glass layer - user information (optimized to prevent spillage)
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.user-avatar {
  width: 32px; // Reduce avatar size
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #2a2a2a, #404040);
  flex-shrink: 0; // Prevent avatar from being compressed
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.user-details {
  flex: 1;
  min-width: 0; // Allow shrinkage
  overflow: hidden;
}

.user-name {
  font-weight: 600;
  font-size: 12px; // Reduce font size
  line-height: 110%;
  color: #FFFFFF;
  margin: 0 0 1px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-id {
  font-weight: 400;
  font-size: 9px; // Reduce font size
  line-height: 110%;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.follow-btn {
  box-sizing: border-box;
  background: linear-gradient(98.99deg, rgba(254, 254, 254, 0.325) 0%, rgba(0, 0, 0, 0.4355) 100%);
  border-radius: 12px; // Reduce fillet
  border: none;
  color: #FFFFFF;
  padding: 4px 10px; // Reduce padding
  font-size: 10px; // Reduce font size
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  white-space: nowrap;
  flex-shrink: 0; // Prevent buttons from being compressed
  min-width: 50px; // minimum width
  text-align: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.35);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
  }
  
  // Alternate style
  @supports not (backdrop-filter: blur(10px)) {
    background: rgba(0, 0, 0, 0.6);
    
    &:hover {
      background: rgba(0, 0, 0, 0.8);
    }
  }
}

// Lower frosted glass layer - work information and statistics (optimized to prevent overflow)
.artwork-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  
  h4 {
    font-weight: 700;
    font-size: 16px; // Reduce font size to avoid overflow
    line-height: 110%;
    color: #FFFFFF;
    margin: 0;
    font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
}

.verified-badge {
  color: #FFFFFF;
  font-size: 12px;
}

.verified-icon {
  width: 14px; // Reduce icon size
  height: 14px;
  color: #00B7FF;
  flex-shrink: 0;
}

.stats-container {
  width: 100%;
  
  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 8px; // Reduce spacing to avoid overflow
    width: 100%;
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0; // Allow flex items to shrink
    
    &.left {
      align-items: flex-start;
      justify-content: flex-end;
      flex: 0 0 auto;
      max-width: 40%; // Limit maximum width
    }
    
    &.center {
      align-items: center;
      text-align: center;
      flex: 1;
      min-width: 0;
    }
    
    &.right {
      align-items: flex-end;
      text-align: right;
      flex: 1;
      min-width: 0;
    }
  }
}

.stat-label {
  font-weight: 400;
  font-size: 8px; // Reduce font size
  line-height: 110%;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.3px; // Reduce word spacing
  order: 2;
  white-space: nowrap;
}

.stat-label-only {
  font-weight: 400;
  font-size: 8px; // Reduce font size
  line-height: 110%;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.stat-value {
  font-weight: 600;
  font-size: 11px; // Reduce font size
  line-height: 110%;
  color: #FFFFFF;
  order: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// load more
.load-more {
  text-align: center;
  margin-top: 48px;
}

.load-more-btn {
  background: #222222;
  border: 1px solid #333333;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  padding: 12px 32px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #333333;
    border-color: #FFFFFF;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// List view style
.nft-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
  gap: 16px;
  padding: 12px 16px;
  background: #111111;
  border-bottom: 1px solid #333333;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-cell {
  color: #666666;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.list-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #222222;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: #1a1a1a;
  }
}

.list-item-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #FFFFFF;
}

.list-item-image {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.list-item-name {
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
}

.list-cell {
  display: flex;
  align-items: center;
  color: #cccccc;
  font-size: 14px;
  font-weight: 500;
}

.owner-name {
  color: #FFFFFF;
  text-decoration: underline;
  cursor: pointer;
  
  &:hover {
    color: #FFFFFF;
  }
}

// Responsive list view
@media (max-width: 1024px) {
  .list-header,
  .list-row {
    grid-template-columns: 2fr 1fr 1fr 1fr;
  }
  
  .header-cell:nth-child(3),
  .list-cell:nth-child(3),
  .header-cell:nth-child(6),
  .list-cell:nth-child(6) {
    display: none;
  }
}

@media (max-width: 768px) {
  .list-header,
  .list-row {
    grid-template-columns: 2fr 1fr 1fr;
    gap: 8px;
  }
  
  .header-cell:nth-child(5),
  .list-cell:nth-child(5) {
    display: none;
  }
}

// Debug control button
.debug-controls {
  display: flex;
  gap: 8px;
  
  .debug-btn {
    background: #ff6b35;
    border: none;
    color: white;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 4px;
    transition: background 0.2s ease;
    
    &:hover {
      background: #e55a2b;
    }
  }
}

// Scroll bar style
.filters-sidebar::-webkit-scrollbar {
  width: 6px;
}

.filters-sidebar::-webkit-scrollbar-track {
  background: #111111;
}

.filters-sidebar::-webkit-scrollbar-thumb {
  background: #333333;
  border-radius: 3px;
  
  &:hover {
    background: #555555;
  }
}
</style> 