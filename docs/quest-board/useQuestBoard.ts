import { useEffect, useMemo, useState } from 'react'
import { questCatalog } from './catalog'
import { AleoChainService } from './chain/aleoChainService'
import {
  applyTransactionSubmitted,
  applyVerificationResult,
  calculateCompletedPoints,
  createInitialProgress,
  type QuestProgress,
} from './progress'
import type { Quest } from './types'
import { MockWalletAdapter } from './wallet/mockWalletAdapter'
import { ShieldWalletAdapter } from './wallet/shieldWalletAdapter'
import type { ConnectedWallet, WalletAdapter } from './wallet/types'
import { WalletError } from './wallet/types'

const STORAGE_KEY = 'aleo-private-quest-board-progress'

function readStoredProgress(): QuestProgress {
  if (typeof window === 'undefined') return createInitialProgress(questCatalog)

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (!stored) return createInitialProgress(questCatalog)

  try {
    return JSON.parse(stored) as QuestProgress
  } catch {
    return createInitialProgress(questCatalog)
  }
}

export function useQuestBoard(options: {
  wallet?: WalletAdapter
  chainService?: AleoChainService
} = {}) {
  const wallet = useMemo(() => {
    if (options.wallet) return options.wallet
    if (process.env.NODE_ENV === 'development') return new MockWalletAdapter()
    return new ShieldWalletAdapter()
  }, [options.wallet])

  const chainService = useMemo(
    () => options.chainService ?? new AleoChainService(),
    [options.chainService],
  )

  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [progress, setProgress] = useState<QuestProgress>(() => readStoredProgress())

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    }
  }, [progress])

  async function connectWallet() {
    setWalletError(null)
    try {
      const connected = await wallet.connect()
      const walletBalance = await wallet.getBalance()
      setConnectedWallet(connected)
      setBalance(walletBalance)
    } catch (error) {
      setWalletError(
        error instanceof WalletError
          ? error.message
          : 'Unable to connect Shield Wallet.',
      )
    }
  }

  async function startQuestTransaction(quest: Quest) {
    if (quest.verification.type !== 'transaction') return

    const transaction = await wallet.requestTransaction({
      programId: quest.verification.programHint,
      functionName: quest.verification.expectedTransition,
      inputs: [],
    })

    setProgress((current) =>
      applyTransactionSubmitted(current, quest.id, transaction.id),
    )
  }

  async function verifyQuest(quest: Quest) {
    if (quest.verification.type !== 'transaction') return
    const item = progress[quest.id]
    if (!item?.transactionId) return

    const result = await chainService.getTransactionVerification(item.transactionId, {
      programHint: quest.verification.programHint,
      expectedTransition: quest.verification.expectedTransition,
    })

    setProgress((current) => applyVerificationResult(current, quest.id, result))
  }

  return {
    quests: questCatalog,
    progress,
    connectedWallet,
    balance,
    walletError,
    totalPoints: calculateCompletedPoints(questCatalog, progress),
    connectWallet,
    startQuestTransaction,
    verifyQuest,
  }
}