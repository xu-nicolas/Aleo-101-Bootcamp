export type AleoNetwork = 'aleo-testnet' | 'aleo-mainnet' | 'unknown'

export type QuestStatus =
  | 'not_started'
  | 'ready'
  | 'in_progress'
  | 'pending_verification'
  | 'verified'
  | 'failed'

export type VerificationConfig =
  | {
      type: 'manual_submission'
      submissionHint: string
    }
  | {
      type: 'wallet_connection'
      requiredNetwork: AleoNetwork
    }
  | {
      type: 'transaction'
      programHint: string
      expectedTransition: string
    }

export type QuestReward = {
  points: number
  badgeName: string
  badgeDescription: string
}

export type Quest = {
  id: string
  title: string
  summary: string
  sourcePath: string
  steps: string[]
  requiresWallet: boolean
  requiredNetwork: AleoNetwork
  reward: QuestReward
  verification: VerificationConfig
}