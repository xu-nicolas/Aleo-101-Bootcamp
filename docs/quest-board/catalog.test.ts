import { describe, expect, it } from 'vitest'
import { questCatalog } from './catalog'

describe('questCatalog', () => {
  it('contains four bootcamp quests with stable unique ids', () => {
    expect(questCatalog).toHaveLength(4)
    expect(new Set(questCatalog.map((quest) => quest.id)).size).toBe(4)
    expect(questCatalog.map((quest) => quest.id)).toEqual([
      'privacy-foundations',
      'shield-wallet-setup',
      'aleo-program-basics',
      'private-transaction-proof',
    ])
  })

  it('defines reward and verification metadata for every quest', () => {
    for (const quest of questCatalog) {
      expect(quest.title.length).toBeGreaterThan(3)
      expect(quest.steps.length).toBeGreaterThanOrEqual(3)
      expect(quest.reward.points).toBeGreaterThan(0)
      expect(quest.reward.badgeName.length).toBeGreaterThan(2)
      expect(['manual_submission', 'wallet_connection', 'transaction']).toContain(
        quest.verification.type,
      )
    }
  })

  it('marks the transaction quest as requiring wallet and testnet balance', () => {
    const transactionQuest = questCatalog.find(
      (quest) => quest.id === 'private-transaction-proof',
    )

    expect(transactionQuest?.requiresWallet).toBe(true)
    expect(transactionQuest?.requiredNetwork).toBe('aleo-testnet')
    expect(transactionQuest?.verification).toEqual({
      type: 'transaction',
      programHint: 'credits.aleo',
      expectedTransition: 'transfer_private',
    })
  })
})