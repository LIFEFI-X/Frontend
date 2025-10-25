export interface Wallet {
  // Define the properties of the Wallet interface
  publicKey: string
  connected: boolean
  adapter: any // Define the appropriate type according to the actual situation
}
