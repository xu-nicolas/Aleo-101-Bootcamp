import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MockWalletAdapter } from './mockWalletAdapter'
import { ShieldWalletAdapter } from './shieldWalletAdapter'

describe('MockWalletAdapter', () => {
  it('connects and exposes address, network, and balance', async () => {
    const wallet = new MockWalletAdapter({
      address: 'aleo1mockaddress',
      network: 'aleo-testnet',
      balance: 12.5,
    })

    await expect(wallet.connect()).resolves.toEqual({
      address: 'aleo1mockaddress',
      network: 'aleo-testnet',
    })
    await expect(wallet.getBalance()).resolves.toBe(12.5)
  })

  it('returns a deterministic transaction id', async () => {
    const wallet = new MockWalletAdapter()

    await wallet.connect()

    await expect(
      wallet.requestTransaction({
        programId: 'credits.aleo',
        functionName: 'transfer_private',
        inputs: ['aleo1recipient', '1u64'],
      }),
    ).resolves.toEqual({
      id: 'mock-transfer-private-transaction',
      status: 'pending',
    })
  })
})

describe('ShieldWalletAdapter', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports missing wallet when no Shield-like provider is injected', async () => {
    const wallet = new ShieldWalletAdapter()

    await expect(wallet.connect()).rejects.toMatchObject({
      code: 'wallet_missing',
    })
  })

  it('wraps a Shield-like provider', async () => {
    vi.stubGlobal('window', {
      shield: {
        connect: vi.fn().mockResolvedValue({ address: 'aleo1shield' }),
        getNetwork: vi.fn().mockResolvedValue('aleo-testnet'),
        getBalance: vi.fn().mockResolvedValue('9.25'),
        requestTransaction: vi.fn().mockResolvedValue('tx123'),
      },
    })

    const wallet = new ShieldWalletAdapter()

    await expect(wallet.connect()).resolves.toEqual({
      address: 'aleo1shield',
      network: 'aleo-testnet',
    })
    await expect(wallet.getBalance()).resolves.toBe(9.25)
    await expect(
      wallet.requestTransaction({
        programId: 'credits.aleo',
        functionName: 'transfer_private',
        inputs: ['aleo1recipient', '1u64'],
      }),
    ).resolves.toEqual({ id: 'tx123', status: 'pending' })
  })
})