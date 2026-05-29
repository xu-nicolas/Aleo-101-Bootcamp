import type { AleoNetwork } from '../types'

export type WalletErrorCode =
  | 'wallet_missing'
  | 'connection_rejected'
  | 'wrong_network'
  | 'insufficient_balance'
  | 'transaction_rejected'
  | 'unsupported_method'
  | 'unknown'

export class WalletError extends Error {
  constructor(
    public readonly code: WalletErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'WalletError'
  }
}

export type ConnectedWallet = {
  address: string
  network: AleoNetwork
}

export type WalletTransactionRequest = {
  programId: string
  functionName: string
  inputs: string[]
}

export type WalletTransactionResult = {
  id: string
  status: 'pending'
}

export type WalletAdapter = {
  name: string
  connect(): Promise<ConnectedWallet>
  disconnect(): Promise<void>
  getAddress(): Promise<string | null>
  getNetwork(): Promise<AleoNetwork>
  getBalance(): Promise<number>
  requestTransaction(request: WalletTransactionRequest): Promise<WalletTransactionResult>
}