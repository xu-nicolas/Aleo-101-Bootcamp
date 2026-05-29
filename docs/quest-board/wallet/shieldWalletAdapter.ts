import type { AleoNetwork } from '../types'
import type {
  ConnectedWallet,
  WalletAdapter,
  WalletTransactionRequest,
  WalletTransactionResult,
} from './types'
import { WalletError } from './types'

type ShieldProvider = {
  connect?: () => Promise<{ address?: string } | string>
  disconnect?: () => Promise<void>
  getAddress?: () => Promise<string>
  getNetwork?: () => Promise<string>
  getBalance?: () => Promise<string | number>
  requestTransaction?: (request: {
    programId: string
    functionName: string
    inputs: string[]
  }) => Promise<string | { id?: string; transactionId?: string }>
}

declare global {
  interface Window {
    shield?: ShieldProvider
    aleo?: ShieldProvider
    aleoWallet?: ShieldProvider
  }
}

function normalizeNetwork(network: string | undefined): AleoNetwork {
  if (!network) return 'unknown'
  const lower = network.toLowerCase()
  if (lower.includes('testnet')) return 'aleo-testnet'
  if (lower.includes('mainnet')) return 'aleo-mainnet'
  return 'unknown'
}

function getInjectedProvider(): ShieldProvider | null {
  if (typeof window === 'undefined') return null
  return window.shield ?? window.aleo ?? window.aleoWallet ?? null
}

export class ShieldWalletAdapter implements WalletAdapter {
  name = 'Shield Wallet'

  private provider: ShieldProvider | null = null
  private address: string | null = null

  async connect(): Promise<ConnectedWallet> {
    this.provider = getInjectedProvider()

    if (!this.provider?.connect) {
      throw new WalletError('wallet_missing', 'Shield Wallet is not installed or not available.')
    }

    try {
      const result = await this.provider.connect()
      this.address = typeof result === 'string' ? result : result.address ?? null
      if (!this.address && this.provider.getAddress) {
        this.address = await this.provider.getAddress()
      }
    } catch (error) {
      throw new WalletError('connection_rejected', 'Shield Wallet connection was rejected.')
    }

    if (!this.address) {
      throw new WalletError('unknown', 'Shield Wallet did not return an Aleo address.')
    }

    return {
      address: this.address,
      network: await this.getNetwork(),
    }
  }

  async disconnect(): Promise<void> {
    await this.provider?.disconnect?.()
    this.address = null
  }

  async getAddress(): Promise<string | null> {
    if (this.provider?.getAddress) {
      this.address = await this.provider.getAddress()
    }
    return this.address
  }

  async getNetwork(): Promise<AleoNetwork> {
    if (!this.provider?.getNetwork) return 'unknown'
    return normalizeNetwork(await this.provider.getNetwork())
  }

  async getBalance(): Promise<number> {
    if (!this.provider?.getBalance) {
      throw new WalletError('unsupported_method', 'Shield Wallet balance lookup is not available.')
    }

    const balance = await this.provider.getBalance()
    return typeof balance === 'number' ? balance : Number.parseFloat(balance)
  }

  async requestTransaction(
    request: WalletTransactionRequest,
  ): Promise<WalletTransactionResult> {
    if (!this.provider?.requestTransaction) {
      throw new WalletError('unsupported_method', 'Shield Wallet transaction request is not available.')
    }

    try {
      const result = await this.provider.requestTransaction(request)
      const id = typeof result === 'string' ? result : result.id ?? result.transactionId

      if (!id) {
        throw new WalletError('unknown', 'Shield Wallet did not return a transaction id.')
      }

      return { id, status: 'pending' }
    } catch (error) {
      if (error instanceof WalletError) throw error
      throw new WalletError('transaction_rejected', 'Shield Wallet transaction request was rejected.')
    }
  }
}