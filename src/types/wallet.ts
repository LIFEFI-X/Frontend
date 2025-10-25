import type { Adapter, WalletReadyState } from '@solana/wallet-adapter-base'
export type Wallet = {
  adapter: Adapter
  readyState: WalletReadyState
}

export type SocialType = 'discord' | 'telegram' | 'x' | 'email'
export type EvmWallet =
  | 'metaMaskSDK'
  | 'okxWallet'
  | 'binanceWallet'
  | 'binanceWeb3Wallet'
  | 'walletConnect'
  | 'coinbaseWallet'
export type SolanaWallet = 'phantom' | 'solflare' | 'sollet' | 'ledger' | 'slope' | 'blocto'
export type LoginType = SocialType | EvmWallet | SolanaWallet
