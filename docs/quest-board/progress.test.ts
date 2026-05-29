import { describe, expect, it } from 'vitest'
import { questCatalog } from './catalog'
import {
  applyTransactionSubmitted,
  applyVerificationResult,
  calculateCompletedPoints,
  createInitialProgress,
} from './progress'

describe('quest progress', () => {
  it('creates initial progress for every quest', () => {
    const progress = createInitialProgress(questCatalog)

    expect(Object.keys(progress)).toHaveLength(4)
    expect(progress['privacy-foundations']).toEqual({
      questId: 'privacy-foundations',
      status: 'ready',
    })
    expect(progress['private-transaction-proof']).toEqual({
      questId: 'private-transaction-proof',
      status: 'not_started',
    })
  })

  it('moves transaction quest to pending verification after submit', () => {
    const progress = createInitialProgress(questCatalog)
    const next = applyTransactionSubmitted(
      progress,
      'private-transaction-proof',
      'tx123',
    )

    expect(next['private-transaction-proof']).toEqual({
      questId: 'private-transaction-proof',
      status: 'pending_verification',
      transactionId: 'tx123',
    })
  })

  it('awards points only for verified quests', () => {
    const progress = applyVerificationResult(
      createInitialProgress(questCatalog),
      'private-transaction-proof',
      { status: 'verified', transactionId: 'tx123' },
    )

    expect(calculateCompletedPoints(questCatalog, progress)).toBe(200)
  })
})