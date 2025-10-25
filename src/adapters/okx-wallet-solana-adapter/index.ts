import {
  BaseMessageSignerWalletAdapter,
  isVersionedTransaction,
  scopePollingDetectionStrategy,
  WalletAccountError,
  WalletConnectionError,
  WalletDisconnectedError,
  WalletDisconnectionError,
  WalletError,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletPublicKeyError,
  WalletReadyState,
  WalletSendTransactionError,
  WalletSignMessageError,
  WalletSignTransactionError,
  type EventEmitter,
  type SendTransactionOptions,
  type WalletName
} from '@solana/wallet-adapter-base';
import {
  Connection,
  PublicKey,
  Transaction,
  type TransactionSignature,
  VersionedTransaction,
  type SendOptions,
  type TransactionVersion
} from '@solana/web3.js';

interface OKXWalletEvents {
  connect(publicKey: PublicKey): void;
  disconnect(): void;
  accountChanged(publicKey: PublicKey): void;
  error(error: WalletError): void;
}

interface OKXWalletSolanaAdapter extends EventEmitter<OKXWalletEvents> {
  publicKey?: { toBytes(): Uint8Array };
  isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;
  signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions
  ): Promise<{ signature: TransactionSignature }>;
}

interface OKXWindow extends Window {
  okxwallet?: {
    solana?: OKXWalletSolanaAdapter
  }
}

declare const window: OKXWindow

export const OKXWalletName = 'OKX Wallet' as WalletName<'OKX Wallet'>;

const RETRY_CONFIG = {
  maxAttempts: 3,
  retryDelay: 1000,
  retryableErrors: [
    'BlockhashNotFound',
    'Timeout',
    'Network Error',
    '429 Too Many Requests'
  ]
};

export class OKXWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = OKXWalletName;
  url = 'https://www.okx.com/web3';
  icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAAXNSR0IArs4c6QAADMhJREFUeF7tme1xW8cSRJcZABkAGZAZgBlIEYCMAFAERAhABCQjEDIgFQGRgZCBkAFfXVbZzz9srbTt9XzsuVUuVelydmZOL1oN+qqU8l54IACBIQlcYQBD6s7SEPgggAFwESAwMAEMYGDxWR0CGAB3AAIDE8AABhaf1SGAAXAHIDAwAQxgYPFZHQIYAHcAAgMTwAAGFp/VIYABcAcgMDABDGBg8VkdAhgAdwACAxPAAAYWn9UhgAFwByAwMAEMYGDxWR0CGAB3AAIDE8AABhaf1SGAAXAHIDAwAQxgYPFZHQIYAHcAAgMTwAAGFp/VIYABcAcgMDABDGBg8VkdAhgAdwACAxPAAAYWn9UhgAFwByAwMAEMYGDxWR0CGAB3AAIDE8AABhaf1SGAAXAHIDAwAQxgYPFZHQIYAHcAAgMTwAAGFp/VIYABcAcgMDABDGBg8VkdAhgAdwACAxPAAAYWn9UhgAFwByAwMAEMYGDxWR0CGAB3AAIDE8AABhaf1SGAAXAHIDAwAQwgAGFZ2UI/A8Z8Dv5v4g3zwAAAABJRU5ErkJggg==';
  supportedTransactionVersions: ReadonlySet<TransactionVersion> = new Set(['legacy', 0]);

  #wallet: OKXWalletSolanaAdapter | null = null;
  #publicKey: PublicKey | null = null;
  #readyState: WalletReadyState = WalletReadyState.Unsupported;
  #connecting = false;
  #listeners: (() => void)[] = [];

  constructor() {
    super();
    this.#initializeReadyState();
  }

  get publicKey(): PublicKey | null {
    return this.#publicKey;
  }

  get readyState(): WalletReadyState {
    return this.#readyState;
  }

  get connecting(): boolean {
    return this.#connecting;
  }

  get connected(): boolean {
    return this.#wallet?.isConnected ?? false;
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.#connecting) return;
      if (this.#readyState !== WalletReadyState.Installed) {
        window.open('https://www.okx.com/download', '_blank');
        throw new WalletNotReadyError();
      }

      this.#connecting = true;
      const wallet = window.okxwallet?.solana;
      if (!wallet) throw new WalletNotReadyError();

      try {
        await wallet.connect();
      } catch (error: any) {
        throw new WalletConnectionError(error?.message, error);
      }

      if (!wallet.publicKey) throw new WalletAccountError();

      let publicKey: PublicKey;
      try {
        publicKey = new PublicKey(wallet.publicKey.toBytes());
      } catch (error: any) {
        throw new WalletPublicKeyError(error?.message, error);
      }

      const disconnectListener = () => this.#handleDisconnect();
      const accountListener = (newKey: PublicKey) => this.#handleAccountChange(newKey);

      wallet.on('disconnect', disconnectListener);
      wallet.on('accountChanged', accountListener);
      this.#listeners.push(
        () => wallet.off('disconnect', disconnectListener),
        () => wallet.off('accountChanged', accountListener)
      );

      this.#wallet = wallet;
      this.#publicKey = publicKey;

      this.emit('connect', publicKey);
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    } finally {
      this.#connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    const wallet = this.#wallet;
    if (!wallet) return;

    try {
      await wallet.disconnect();
    } catch (error: any) {
      this.emit('error', new WalletDisconnectionError(error?.message, error));
    }

    this.#cleanup();
    this.emit('disconnect');
  }

  async sendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    connection: Connection,
    options: SendTransactionOptions = {}
  ): Promise<TransactionSignature> {
    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        const wallet = this.#wallet;
        if (!wallet) throw new WalletNotConnectedError();

        const preparedTx = await this.#prepareTransaction(transaction, connection, options);
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
          options.preflightCommitment || connection.commitment
        );

        if (isVersionedTransaction(preparedTx)) {
          preparedTx.message.recentBlockhash = blockhash;
        } else {
          (preparedTx as Transaction).recentBlockhash = blockhash;
        }

        const { signature } = await wallet.signAndSendTransaction(preparedTx, {
          ...options,
          preflightCommitment: options.preflightCommitment || connection.commitment
        });

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          options.preflightCommitment
        );

        return signature;
      } catch (error: any) {
        if (this.#shouldRetry(error, attempt)) {
          await new Promise(resolve => setTimeout(resolve, attempt * RETRY_CONFIG.retryDelay));
          continue;
        }
        throw this.#normalizeError(error);
      }
    }
    throw new WalletSendTransactionError('Max retry attempts exceeded');
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    try {
      const wallet = this.#wallet;
      if (!wallet) throw new WalletNotConnectedError();

      return wallet.signTransaction(transaction);
    } catch (error: any) {
      throw new WalletSignTransactionError(error?.message, error);
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> {
    try {
      const wallet = this.#wallet;
      if (!wallet) throw new WalletNotConnectedError();

      return wallet.signAllTransactions(transactions);
    } catch (error: any) {
      throw new WalletSignTransactionError(error?.message, error);
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      const wallet = this.#wallet;
      if (!wallet) throw new WalletNotConnectedError();

      const { signature } = await wallet.signMessage(message);
      return signature;
    } catch (error: any) {
      throw new WalletSignMessageError(error?.message, error);
    }
  }

  #initializeReadyState(): void {
    if (typeof window === 'undefined' || !window.okxwallet?.solana) {
      this.#readyState = WalletReadyState.Unsupported;
      return;
    }

    this.#readyState = WalletReadyState.NotDetected;
    scopePollingDetectionStrategy(() => {
      if (window.okxwallet?.solana) {
        this.#readyState = WalletReadyState.Installed;
        this.emit('readyStateChange', this.#readyState);
        return true;
      }
      return false;
    });
  }

  #cleanup(): void {
    this.#listeners.forEach(cleanup => cleanup());
    this.#listeners = [];
    this.#wallet = null;
    this.#publicKey = null;
  }

  #handleDisconnect(): void {
    this.#cleanup();
    this.emit('error', new WalletDisconnectedError());
    this.emit('disconnect');
  }

  #handleAccountChange(newPublicKey: PublicKey): void {
    if (!this.#publicKey) return;

    try {
      const publicKey = new PublicKey(newPublicKey.toBytes());
      if (this.#publicKey.equals(publicKey)) return;

      this.#publicKey = publicKey;
      this.emit('connect', publicKey);
    } catch (error: any) {
      this.emit('error', new WalletPublicKeyError(error?.message, error));
    }
  }

  async #prepareTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    connection: Connection,
    options: SendOptions
  ): Promise<T> {
    if (isVersionedTransaction(transaction)) return transaction;

    const preparedTx = await super.prepareTransaction(
      transaction as Transaction,
      connection,
      options
    );

    if (!preparedTx.recentBlockhash) {
      const { blockhash } = await connection.getLatestBlockhash(options.preflightCommitment);
      preparedTx.recentBlockhash = blockhash;
    }

    return preparedTx as T;
  }

  #shouldRetry(error: unknown, attempt: number): boolean {
    if (attempt >= RETRY_CONFIG.maxAttempts) return false;

    const message = error instanceof Error ? error.message : '';
    return RETRY_CONFIG.retryableErrors.some(err => message.includes(err));
  }

  #normalizeError(error: unknown): WalletError {
    if (error instanceof WalletError) return error;

    const message = error instanceof Error ? error.message : 'Unknown error';
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? (error as any).code
      : -1;

    if (message.includes('Blockhash')) {
      return new WalletSendTransactionError('Transaction expired, please try again', error);
    }

    if (code === 429) {
      return new WalletSendTransactionError('Too many requests, please try again later', error);
    }

    return new WalletSendTransactionError(message, error);
  }
}
