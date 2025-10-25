interface Network {
  id: number
  name: string
  chainId: string
  currencySymbol: string | null
  blockExplorerUrl: string | null
}

export interface Nft {
  id: number
  isEnabled: boolean
  createdAt: string
  updatedAt: string
  contractAddress: string
  abi: string
  name: string
  displayName: string
  image: string | null
  video?: string | null
  description: string
  closeTime: string
  maxNumber: number
  mintedNumber: number
  normalPrice: number
  price: number
  priceUnit: string
  mintPriceEther: string
  network: Network
  countDownSeconds: number
  minted: boolean
  mintFunction: string
  whitelistInfo: any
  mintButtonText: string
  mintEnabled: boolean
  merkleProof: string[]
}

export interface WalletInfoResponse {
  walletAddresses: Array<{
    id: number
    isEnabled: boolean
    createdAt: string
    updatedAt: string
    address: string
    account: number
    network: number
  }>
  nfts: Nft[]
}

interface Ranking {
  pointsRanking: number
  speedRanking: number
}

interface RankingRise {
  pointsRanking: number
  speedRanking: number
}

enum GAME_TYPE {
  WUKONG = 'black myth-Wukong',
  LOL = 'League of Legends',
  DOTA2 = 'DOTA2',
  VALORANT = 'Valante',
  APEX = 'Apexhero',
  GLOBAL = 'worldwide',
  QUEST = 'Task'
}

export interface GameInfo {
  id: number | null
  season: Season
  type: keyof typeof GAME_TYPE
  miningPoints?: number
  miningTime?: number
  points: number
  totalPoints: number
  questPoints: number
  ranking: string | number
  rankingRise: string | number
  totalRanking: string | number
  totalRankingRise: string | number
  userInviteRanking: number | string
  userInviteRankingRise: number | string
  userInvitePoints: number | string
  userInviteCount: number | string
  unit: string
  lastPlayed: number | null
  mintInviteCount: number | string
}

export interface Statistics {
  boomerHolders: number
  userRegistered: number
  totalTransactions: number
}

export interface SharingTask {
  name: string
  code: string
  displayText: string
  id: number
  icon: string
  amount: number
  sectionName: string
  visible: boolean
  completed: boolean
  rewardDirect: boolean
  redirectUrl: string | URL | undefined
  completeText: string
  dailyLimit?: number
  loading?: boolean
  verified?: boolean
  failed?: boolean
  clickTime?: number
  [key: string]: any
}

export type GameType = keyof typeof GAME_TYPE

export interface Moment {
  id: number
  brief: string
  coverUrl: string
  videoUrl: string
  order: number
  type?: string
}

export interface Rewards {
  id: number
  name: string
  startAt: string
  endAt: string
  totalRefferals: number
  questPoints: number
  seasonPoints: number
}

export interface NavMenu {
  path: string
  icon: string
  title: string
}

export interface Game {
  id: number
  name: GameType
  overwolfId: string
  fullName: string
}

export interface Season {
  id: number
  name: string
  startAt: string
  endAt: string
  default: boolean
  display: boolean
  live?: boolean
  highlight: boolean
  order: number
  games: Game[]
  needPasscard?: boolean
}

enum WALLET_TYPE {
  metaMaskSDK = 'Meta Mask',
  okxWallet = 'OKX Wallet',
  mathWallet = 'Math Wallet',
  coinbase = 'Coinbase Smart Wallet',
  binanceWallet = 'Binance Smart Chain',
  walletConnect = 'WalletConnect',
}

export type WalletType = keyof typeof WALLET_TYPE

export type WhiteType = 'GTD' | 'FCFS' | 'GW' | 'public'

export interface PerceptronDetail {
  id: number
  currentRound: number
  rounds: number
  inviteMintCount: number
  minted: boolean
  isEnabled: boolean
  createdAt: string
  updatedAt: string
  isPasscard: boolean
  contractAddress: string
  abi: string
  name: string
  displayName: string
  image: string
  video: string
  description: string
  startTime: string
  closeTime: string
  mintLimit: number
  maxNumber: number
  mintedNumber: number
  originPrice: number
  price: number
  priceUnit: string
  mintPriceEther: string
  order: number
  mintFunction: string
  mintButtonText: string
  mintEnabled: boolean
  network: number
  season: string
}

export interface MintRecord {
  id: number
  walletAddress: string
  amount: number
}

export interface CheckInRecord {
  walletAddress: string
  createdAt: string
}
