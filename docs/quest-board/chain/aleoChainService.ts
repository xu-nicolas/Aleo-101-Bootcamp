import type { QuestStatus } from '../types'

type Fetcher = typeof fetch

type ChainServiceOptions = {
  fetcher?: Fetcher
  baseUrl?: string
}

type VerificationRequest = {
  programHint: string
  expectedTransition: string
}

type VerificationResult = {
  status: Extract<QuestStatus, 'pending_verification' | 'verified' | 'failed'>
  transactionId: string
  reason?: string
}

type ExplorerTransition = {
  program?: string
  programId?: string
  function?: string
  functionName?: string
}

type ExplorerTransactionResponse = {
  status?: string
  transaction?: {
    transitions?: ExplorerTransition[]
  }
}

export class AleoChainService {
  private fetcher: Fetcher
  private baseUrl: string

  constructor(options: ChainServiceOptions = {}) {
    this.fetcher = options.fetcher ?? fetch
    this.baseUrl = options.baseUrl ?? 'https://testnet.explorer.provable.com'
  }

  async getTransactionVerification(
    transactionId: string,
    request: VerificationRequest,
  ): Promise<VerificationResult> {
    const response = await this.fetcher(`${this.baseUrl}/transaction/${transactionId}`)

    if (!response.ok) {
      return {
        status: 'failed',
        transactionId,
        reason: 'Transaction was not found.',
      }
    }

    const body = (await response.json()) as ExplorerTransactionResponse
    const status = body.status?.toLowerCase() ?? 'unknown'

    if (status.includes('pending')) {
      return { status: 'pending_verification', transactionId }
    }

    if (status.includes('fail') || status.includes('reject')) {
      return {
        status: 'failed',
        transactionId,
        reason: 'Transaction failed on Aleo network.',
      }
    }

    const transitions = body.transaction?.transitions ?? []
    const hasExpectedTransition = transitions.some((transition) => {
      const program = transition.program ?? transition.programId
      const functionName = transition.function ?? transition.functionName
      return (
        program === request.programHint && functionName === request.expectedTransition
      )
    })

    if (!hasExpectedTransition) {
      return {
        status: 'failed',
        transactionId,
        reason: 'Transaction did not include the expected Aleo transition.',
      }
    }

    return { status: 'verified', transactionId }
  }
}