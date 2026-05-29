import type { AleoNetwork } from '../types'
import type {
  ConnectedWallet,
  WalletAdapter,
  WalletTransactionRequest,
  WalletTransactionResult,
} from './types'
import { WalletError } from './types'

type MockWalletOptions = {
  address?: string
  network?: AleoNetwork
  balance?: number
  rejectConnection?: boolean
}

export class MockWalletAdapter implements WalletAdapter {
  name = 'Mock Wallet'

  private address: string | null
  private network: AleoNetwork
  private balance: number
  private connected = false
  private rejectConnection: boolean

  constructor(options: MockWalletOptions = {}) {
    this.address = options.address ?? 'aleo1mocklearneraddress'
    this.network = options.network ?? 'aleo-testnet'
    this.balance = options.balance ?? 10
    this.rejectConnection = options.rejectConnection ?? false
  }

  async connect(): Promise<ConnectedWallet> {
    if (this.rejectConnection) {
      throw new WalletError('connection_rejected', 'Mock wallet connection was rejected.')
    }

    this.connected = true
    return {
      address: this.address ?? 'aleo1mocklearneraddress',
      network: this.network,
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  async getAddress(): Promise<string | null> {
    return this.connected ? this.address : null
  }

  async getNetwork(): Promise<AleoNetwork> {
    return this.network
  }

  async getBalance(): Promise<number> {
    return this.balance
  }

  async requestTransaction(
    request: WalletTransactionRequest,
  ): Promise<WalletTransactionResult> {
    if (!this.connected) {
      throw new WalletError('connection_rejected', 'Connect wallet before requesting a transaction.')
    }

    return {
      id: `mock-${request.functionName.replaceAll('_', '-')}-transaction`,
      status: 'pending',
    }
  }
}