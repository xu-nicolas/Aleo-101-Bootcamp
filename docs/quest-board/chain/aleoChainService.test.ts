import { describe, expect, it, vi } from 'vitest'
import { AleoChainService } from './aleoChainService'

describe('AleoChainService', () => {
  it('maps a successful explorer transaction to verified', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'accepted',
        transaction: {
          transitions: [{ program: 'credits.aleo', function: 'transfer_private' }],
        },
      }),
    })
    const service = new AleoChainService({ fetcher, baseUrl: 'https://example.test' })

    await expect(
      service.getTransactionVerification('tx1', {
        programHint: 'credits.aleo',
        expectedTransition: 'transfer_private',
      }),
    ).resolves.toEqual({
      status: 'verified',
      transactionId: 'tx1',
    })
  })

  it('maps a pending transaction to pending_verification', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'pending' }),
    })
    const service = new AleoChainService({ fetcher, baseUrl: 'https://example.test' })

    await expect(
      service.getTransactionVerification('tx2', {
        programHint: 'credits.aleo',
        expectedTransition: 'transfer_private',
      }),
    ).resolves.toEqual({
      status: 'pending_verification',
      transactionId: 'tx2',
    })
  })

  it('maps failed lookup to failed state', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    })
    const service = new AleoChainService({ fetcher, baseUrl: 'https://example.test' })

    await expect(
      service.getTransactionVerification('missing', {
        programHint: 'credits.aleo',
        expectedTransition: 'transfer_private',
      }),
    ).resolves.toEqual({
      status: 'failed',
      transactionId: 'missing',
      reason: 'Transaction was not found.',
    })
  })
})