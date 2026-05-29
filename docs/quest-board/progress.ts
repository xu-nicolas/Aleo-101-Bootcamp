import type { Quest, QuestStatus } from './types'

export type QuestProgressItem = {
  questId: string
  status: QuestStatus
  transactionId?: string
  failureReason?: string
}

export type QuestProgress = Record<string, QuestProgressItem>

type VerificationResult = {
  status: Extract<QuestStatus, 'pending_verification' | 'verified' | 'failed'>
  transactionId: string
  reason?: string
}

export function createInitialProgress(quests: Quest[]): QuestProgress {
  return Object.fromEntries(
    quests.map((quest) => [
      quest.id,
      {
        questId: quest.id,
        status: quest.requiresWallet ? 'not_started' : 'ready',
      },
    ]),
  )
}

export function applyTransactionSubmitted(
  progress: QuestProgress,
  questId: string,
  transactionId: string,
): QuestProgress {
  return {
    ...progress,
    [questId]: {
      questId,
      status: 'pending_verification',
      transactionId,
    },
  }
}

export function applyVerificationResult(
  progress: QuestProgress,
  questId: string,
  result: VerificationResult,
): QuestProgress {
  return {
    ...progress,
    [questId]: {
      questId,
      status: result.status,
      transactionId: result.transactionId,
      failureReason: result.reason,
    },
  }
}

export function calculateCompletedPoints(
  quests: Quest[],
  progress: QuestProgress,
): number {
  return quests.reduce((total, quest) => {
    return progress[quest.id]?.status === 'verified'
      ? total + quest.reward.points
      : total
  }, 0)
}