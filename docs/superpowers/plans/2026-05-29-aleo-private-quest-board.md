# Aleo Private Quest Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 `docs/` Next/Nextra 项目中实现一个 Shield Wallet 优先的 Aleo 101 学员 Quest Board MVP。

**Architecture:** Quest Board 作为文档站里的独立页面 `/quest-board` 交付，领域逻辑放在 `docs/quest-board/`，页面只负责组合状态和渲染。钱包层使用 adapter 接口，默认 Shield，开发和测试使用 mock adapter；链上查询通过独立 service 转成产品状态。

**Tech Stack:** Next.js 13、React 18、TypeScript、Vitest、现有 `docs` package、Shield Wallet 浏览器扩展 API、Aleo explorer/RPC HTTP 查询。

---

## 文件结构

- Modify: `docs/package.json`
  - 增加 `test`、`test:run`、`typecheck` 脚本和 Vitest 依赖。
- Modify: `docs/package-lock.json`
  - 由 `npm install` 自动更新。
- Create: `docs/vitest.config.ts`
  - 配置 Vitest 在 `jsdom` 环境里跑 TypeScript 测试。
- Create: `docs/quest-board/types.ts`
  - 定义 quest、wallet、chain、progress 的共享类型。
- Create: `docs/quest-board/catalog.ts`
  - 静态任务 catalog，先覆盖 `task/task1.md` 到 `task/task4.md` 的代表性任务。
- Create: `docs/quest-board/catalog.test.ts`
  - 验证 catalog id 唯一、奖励有效、任务状态字段完整。
- Create: `docs/quest-board/wallet/types.ts`
  - 钱包 adapter 接口和标准错误类型。
- Create: `docs/quest-board/wallet/mockWalletAdapter.ts`
  - 本地开发和测试用 mock wallet。
- Create: `docs/quest-board/wallet/shieldWalletAdapter.ts`
  - Shield-first adapter，检测 `window.shield`、`window.aleo` 或 `window.aleoWallet`。
- Create: `docs/quest-board/wallet/walletAdapters.test.ts`
  - 验证 mock adapter、Shield 缺失、用户拒绝、网络读取等行为。
- Create: `docs/quest-board/chain/aleoChainService.ts`
  - Aleo transaction/balance 查询 service，把远端结果映射成产品状态。
- Create: `docs/quest-board/chain/aleoChainService.test.ts`
  - 验证 pending/success/failed/not_found 映射。
- Create: `docs/quest-board/progress.ts`
  - Quest 状态机、积分、徽章计算。
- Create: `docs/quest-board/progress.test.ts`
  - 验证任务状态流和积分计算。
- Create: `docs/quest-board/useQuestBoard.ts`
  - React hook，组合 wallet、catalog、chain service、localStorage progress。
- Create: `docs/quest-board/styles.ts`
  - 复用 Stitch 设计方向的 inline style token，避免引入新 CSS 框架。
- Create: `docs/pages/quest-board.tsx`
  - 真实 Quest Board 页面。
- Modify: `docs/pages/index.mdx`
  - 增加进入 Quest Board 的入口卡片。
- Modify: Stitch project `projects/2287702138354938825`
  - 编辑 Login、Main Dashboard、Task Detail、Wallet & Transaction Status 四个屏幕，让原型和实现一致。

---

## Task 1: 测试和类型检查基础设施

**Files:**
- Modify: `docs/package.json`
- Modify: `docs/package-lock.json`
- Create: `docs/vitest.config.ts`

- [ ] **Step 1: 添加 Vitest 依赖**

Run:

```bash
cd docs
npm install -D vitest jsdom @vitejs/plugin-react
```

Expected: `package.json` 和 `package-lock.json` 更新，安装完成且没有 dependency resolution error。

- [ ] **Step 2: 修改 `docs/package.json` 脚本**

把 scripts 改成：

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "typecheck": "tsc --noEmit",
  "test": "vitest",
  "test:run": "vitest run"
}
```

保留现有 dependencies，不删除 Next/Nextra/React。

- [ ] **Step 3: 创建 Vitest 配置**

Create `docs/vitest.config.ts`:

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['quest-board/**/*.test.ts', 'quest-board/**/*.test.tsx'],
  },
})
```

- [ ] **Step 4: 运行空测试命令**

Run:

```bash
cd docs
npm run test:run
```

Expected: FAIL，原因是还没有 test file，例如 `No test files found`。这是可接受的红灯。

- [ ] **Step 5: 运行类型检查**

Run:

```bash
cd docs
npm run typecheck
```

Expected: PASS，说明添加配置没有破坏现有 docs 类型检查。

- [ ] **Step 6: 提交**

```bash
git add docs/package.json docs/package-lock.json docs/vitest.config.ts
git commit -m "chore: add quest board test tooling"
```

---

## Task 2: Quest Catalog 领域模型

**Files:**
- Create: `docs/quest-board/types.ts`
- Create: `docs/quest-board/catalog.ts`
- Create: `docs/quest-board/catalog.test.ts`

- [ ] **Step 1: 写失败测试**

Create `docs/quest-board/catalog.test.ts`:

```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
cd docs
npm run test:run -- quest-board/catalog.test.ts
```

Expected: FAIL with module not found for `./catalog`。

- [ ] **Step 3: 创建共享类型**

Create `docs/quest-board/types.ts`:

```ts
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
```

- [ ] **Step 4: 创建 catalog**

Create `docs/quest-board/catalog.ts`:

```ts
import type { Quest } from './types'

export const questCatalog: Quest[] = [
  {
    id: 'privacy-foundations',
    title: 'Task 1: 为什么需要隐私？',
    summary: '理解 Aleo 的隐私模型、重复执行问题、Record Model 和 Leo 语言目标。',
    sourcePath: '../task/task1.md',
    steps: [
      '阅读 Task 1 的五个问题。',
      '完成对 Aleo 隐私、Record Model 和证明优势的回答。',
      '把答案提交到 learn/YourName/task1.md。',
    ],
    requiresWallet: false,
    requiredNetwork: 'unknown',
    reward: {
      points: 100,
      badgeName: 'Privacy Foundations',
      badgeDescription: 'Completed the Aleo privacy fundamentals quest.',
    },
    verification: {
      type: 'manual_submission',
      submissionHint: '提交 learn/YourName/task1.md 后在面板中标记为待验证。',
    },
  },
  {
    id: 'shield-wallet-setup',
    title: 'Shield Wallet 设置',
    summary: '安装 Shield Wallet、创建地址、切换 Aleo Testnet 并准备测试币。',
    sourcePath: '../Shield_Wallet_guide.md',
    steps: [
      '通过 Aleo 官方 Shield 页面安装浏览器扩展。',
      '创建钱包并离线保存助记词。',
      '切换到 Aleo Testnet 并通过 faucet 获取测试币。',
    ],
    requiresWallet: true,
    requiredNetwork: 'aleo-testnet',
    reward: {
      points: 120,
      badgeName: 'Shield Ready',
      badgeDescription: 'Connected Shield Wallet on Aleo Testnet.',
    },
    verification: {
      type: 'wallet_connection',
      requiredNetwork: 'aleo-testnet',
    },
  },
  {
    id: 'aleo-program-basics',
    title: 'Aleo Program 基础',
    summary: '学习 Aleo program、transition、mapping 和 Leo 基础开发流程。',
    sourcePath: '../task/task2.md',
    steps: [
      '阅读 Aleo program 和 Leo 基础材料。',
      '完成本地开发环境或示例程序练习。',
      '提交学习记录和关键命令输出。',
    ],
    requiresWallet: false,
    requiredNetwork: 'unknown',
    reward: {
      points: 140,
      badgeName: 'Program Explorer',
      badgeDescription: 'Completed the Aleo program basics quest.',
    },
    verification: {
      type: 'manual_submission',
      submissionHint: '提交 task2 学习记录后在面板中标记为待验证。',
    },
  },
  {
    id: 'private-transaction-proof',
    title: 'Private Transaction Proof',
    summary: '使用 Shield Wallet 发起测试网交易，并通过交易状态完成链上验证。',
    sourcePath: '../task/task4.md',
    steps: [
      '确认 Shield Wallet 已连接 Aleo Testnet。',
      '确认测试币余额足以支付交易。',
      '发起一次 credits.aleo private transfer 或等效测试网交易。',
      '等待交易完成并由 Quest Board 验证。',
    ],
    requiresWallet: true,
    requiredNetwork: 'aleo-testnet',
    reward: {
      points: 200,
      badgeName: 'Private Prover',
      badgeDescription: 'Submitted and verified an Aleo private transaction.',
    },
    verification: {
      type: 'transaction',
      programHint: 'credits.aleo',
      expectedTransition: 'transfer_private',
    },
  },
]
```

- [ ] **Step 5: 运行测试确认通过**

Run:

```bash
cd docs
npm run test:run -- quest-board/catalog.test.ts
```

Expected: PASS。

- [ ] **Step 6: 运行类型检查**

Run:

```bash
cd docs
npm run typecheck
```

Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add docs/quest-board/types.ts docs/quest-board/catalog.ts docs/quest-board/catalog.test.ts
git commit -m "feat: add quest catalog"
```

---

## Task 3: Wallet Adapter 和 Shield 接入边界

**Files:**
- Create: `docs/quest-board/wallet/types.ts`
- Create: `docs/quest-board/wallet/mockWalletAdapter.ts`
- Create: `docs/quest-board/wallet/shieldWalletAdapter.ts`
- Create: `docs/quest-board/wallet/walletAdapters.test.ts`

- [ ] **Step 1: 写失败测试**

Create `docs/quest-board/wallet/walletAdapters.test.ts`:

```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
cd docs
npm run test:run -- quest-board/wallet/walletAdapters.test.ts
```

Expected: FAIL with module not found for wallet adapter files。

- [ ] **Step 3: 创建钱包类型**

Create `docs/quest-board/wallet/types.ts`:

```ts
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
```

- [ ] **Step 4: 创建 mock adapter**

Create `docs/quest-board/wallet/mockWalletAdapter.ts`:

```ts
import type { AleoNetwork } from '../types'
import type {
  ConnectedWallet,
  WalletAdapter,
  WalletTransactionRequest,
  WalletTransactionResult,
} from './types'
import { WalletError } from './types'

type MockWalletOptions = {
  address?: string
  network?: AleoNetwork
  balance?: number
  rejectConnection?: boolean
}

export class MockWalletAdapter implements WalletAdapter {
  name = 'Mock Wallet'

  private address: string | null
  private network: AleoNetwork
  private balance: number
  private connected = false
  private rejectConnection: boolean

  constructor(options: MockWalletOptions = {}) {
    this.address = options.address ?? 'aleo1mocklearneraddress'
    this.network = options.network ?? 'aleo-testnet'
    this.balance = options.balance ?? 10
    this.rejectConnection = options.rejectConnection ?? false
  }

  async connect(): Promise<ConnectedWallet> {
    if (this.rejectConnection) {
      throw new WalletError('connection_rejected', 'Mock wallet connection was rejected.')
    }

    this.connected = true
    return {
      address: this.address ?? 'aleo1mocklearneraddress',
      network: this.network,
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  async getAddress(): Promise<string | null> {
    return this.connected ? this.address : null
  }

  async getNetwork(): Promise<AleoNetwork> {
    return this.network
  }

  async getBalance(): Promise<number> {
    return this.balance
  }

  async requestTransaction(
    request: WalletTransactionRequest,
  ): Promise<WalletTransactionResult> {
    if (!this.connected) {
      throw new WalletError('connection_rejected', 'Connect wallet before requesting a transaction.')
    }

    return {
      id: `mock-${request.functionName.replaceAll('_', '-')}-transaction`,
      status: 'pending',
    }
  }
}
```

- [ ] **Step 5: 创建 Shield adapter**

Create `docs/quest-board/wallet/shieldWalletAdapter.ts`:

```ts
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
```

- [ ] **Step 6: 运行钱包测试**

Run:

```bash
cd docs
npm run test:run -- quest-board/wallet/walletAdapters.test.ts
```

Expected: PASS。

- [ ] **Step 7: 运行类型检查**

Run:

```bash
cd docs
npm run typecheck
```

Expected: PASS。

- [ ] **Step 8: 提交**

```bash
git add docs/quest-board/wallet
git commit -m "feat: add shield wallet adapter boundary"
```

---

## Task 4: Aleo Chain Service

**Files:**
- Create: `docs/quest-board/chain/aleoChainService.ts`
- Create: `docs/quest-board/chain/aleoChainService.test.ts`

- [ ] **Step 1: 写失败测试**

Create `docs/quest-board/chain/aleoChainService.test.ts`:

```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
cd docs
npm run test:run -- quest-board/chain/aleoChainService.test.ts
```

Expected: FAIL with module not found。

- [ ] **Step 3: 创建 chain service**

Create `docs/quest-board/chain/aleoChainService.ts`:

```ts
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
```

- [ ] **Step 4: 运行 chain service 测试**

Run:

```bash
cd docs
npm run test:run -- quest-board/chain/aleoChainService.test.ts
```

Expected: PASS。

- [ ] **Step 5: 运行类型检查**

Run:

```bash
cd docs
npm run typecheck
```

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add docs/quest-board/chain
git commit -m "feat: add aleo transaction verification service"
```

---

## Task 5: Quest Progress 状态机

**Files:**
- Create: `docs/quest-board/progress.ts`
- Create: `docs/quest-board/progress.test.ts`

- [ ] **Step 1: 写失败测试**

Create `docs/quest-board/progress.test.ts`:

```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
cd docs
npm run test:run -- quest-board/progress.test.ts
```

Expected: FAIL with module not found。

- [ ] **Step 3: 创建状态机**

Create `docs/quest-board/progress.ts`:

```ts
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
```

- [ ] **Step 4: 运行 progress 测试**

Run:

```bash
cd docs
npm run test:run -- quest-board/progress.test.ts
```

Expected: PASS。

- [ ] **Step 5: 运行完整测试和类型检查**

Run:

```bash
cd docs
npm run test:run
npm run typecheck
```

Expected: both PASS。

- [ ] **Step 6: 提交**

```bash
git add docs/quest-board/progress.ts docs/quest-board/progress.test.ts
git commit -m "feat: add quest progress state machine"
```

---

## Task 6: React Hook 组合应用状态

**Files:**
- Create: `docs/quest-board/useQuestBoard.ts`

- [ ] **Step 1: 创建 hook**

Create `docs/quest-board/useQuestBoard.ts`:

```ts
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
```

- [ ] **Step 2: 运行类型检查**

Run:

```bash
cd docs
npm run typecheck
```

Expected: PASS。

- [ ] **Step 3: 提交**

```bash
git add docs/quest-board/useQuestBoard.ts
git commit -m "feat: compose quest board state hook"
```

---

## Task 7: Quest Board 页面 UI

**Files:**
- Create: `docs/quest-board/styles.ts`
- Create: `docs/pages/quest-board.tsx`
- Modify: `docs/pages/index.mdx`

- [ ] **Step 1: 创建样式 token**

Create `docs/quest-board/styles.ts`:

```ts
export const colors = {
  background: '#f9f9ff',
  surface: '#ffffff',
  surfaceMuted: '#f1f3ff',
  border: '#e5e7eb',
  text: '#141b2b',
  textMuted: '#464555',
  primary: '#4f46e5',
  primaryDark: '#3525cd',
  privateAccent: '#10b981',
  publicAccent: '#f59e0b',
  error: '#ba1a1a',
}

export const layout = {
  page: {
    minHeight: '100vh',
    background: colors.background,
    color: colors.text,
    fontFamily:
      'Geist, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  shell: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '32px',
  },
}
```

- [ ] **Step 2: 创建 Quest Board 页面**

Create `docs/pages/quest-board.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { colors, layout } from '../quest-board/styles'
import { useQuestBoard } from '../quest-board/useQuestBoard'
import type { Quest } from '../quest-board/types'

function statusLabel(status: string | undefined) {
  switch (status) {
    case 'ready':
      return 'Ready'
    case 'pending_verification':
      return 'Pending Verification'
    case 'verified':
      return 'Completed'
    case 'failed':
      return 'Failed'
    case 'in_progress':
      return 'In Progress'
    default:
      return 'Not Started'
  }
}

export default function QuestBoardPage() {
  const board = useQuestBoard()
  const [selectedQuestId, setSelectedQuestId] = useState(board.quests[0]?.id)

  const selectedQuest = useMemo(
    () => board.quests.find((quest) => quest.id === selectedQuestId) ?? board.quests[0],
    [board.quests, selectedQuestId],
  )

  return (
    <main style={layout.page}>
      <div style={layout.shell}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <p style={{ margin: 0, color: colors.privateAccent, fontWeight: 600 }}>
              Aleo 101 Bootcamp
            </p>
            <h1 style={{ margin: '8px 0', fontSize: 40, lineHeight: '48px' }}>
              Aleo Private Quest Board
            </h1>
            <p style={{ margin: 0, color: colors.textMuted, maxWidth: 680 }}>
              Connect Shield Wallet, complete quests, verify Aleo testnet activity, and
              collect progress badges.
            </p>
          </div>

          <section
            style={{
              minWidth: 280,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 14, color: colors.textMuted }}>Shield Wallet</div>
            <div style={{ marginTop: 8, fontWeight: 700 }}>
              {board.connectedWallet
                ? `${board.connectedWallet.address.slice(0, 10)}...`
                : 'Not connected'}
            </div>
            <div style={{ marginTop: 8, color: colors.textMuted }}>
              Network: {board.connectedWallet?.network ?? 'unknown'}
            </div>
            <div style={{ marginTop: 4, color: colors.textMuted }}>
              Balance: {board.balance ?? '--'} ALEO
            </div>
            <button
              onClick={board.connectWallet}
              style={{
                marginTop: 16,
                width: '100%',
                border: 0,
                borderRadius: 8,
                padding: '10px 14px',
                color: '#ffffff',
                background: colors.primary,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Connect Shield
            </button>
            {board.walletError ? (
              <p style={{ color: colors.error, margin: '12px 0 0', fontSize: 14 }}>
                {board.walletError}
              </p>
            ) : null}
          </section>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 24,
            marginTop: 32,
          }}
        >
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 16,
                marginBottom: 24,
              }}
            >
              <Metric label="Total Points" value={String(board.totalPoints)} />
              <Metric
                label="Completed"
                value={String(
                  Object.values(board.progress).filter((item) => item.status === 'verified')
                    .length,
                )}
              />
              <Metric label="Wallet" value={board.connectedWallet ? 'Ready' : 'Required'} />
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {board.quests.map((quest) => {
                const status = board.progress[quest.id]?.status
                return (
                  <button
                    key={quest.id}
                    onClick={() => setSelectedQuestId(quest.id)}
                    style={{
                      textAlign: 'left',
                      background:
                        quest.id === selectedQuest?.id ? colors.surfaceMuted : colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      padding: 18,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                      <strong>{quest.title}</strong>
                      <span style={{ color: colors.textMuted }}>{statusLabel(status)}</span>
                    </div>
                    <p style={{ margin: '8px 0 0', color: colors.textMuted }}>
                      {quest.summary}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedQuest ? <QuestDetail quest={selectedQuest} board={board} /> : null}
        </section>
      </div>
    </main>
  )
}

function Metric(props: { label: string; value: string }) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: 18,
      }}
    >
      <div style={{ color: colors.textMuted, fontSize: 14 }}>{props.label}</div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{props.value}</div>
    </div>
  )
}

function QuestDetail(props: {
  quest: Quest
  board: ReturnType<typeof useQuestBoard>
}) {
  const progress = props.board.progress[props.quest.id]
  const canStartTransaction =
    props.quest.verification.type === 'transaction' && props.board.connectedWallet

  return (
    <aside
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 24,
        alignSelf: 'start',
      }}
    >
      <div style={{ color: colors.textMuted }}>{statusLabel(progress?.status)}</div>
      <h2 style={{ margin: '8px 0 12px', fontSize: 24 }}>{props.quest.title}</h2>
      <p style={{ color: colors.textMuted }}>{props.quest.summary}</p>
      <ol style={{ paddingLeft: 20 }}>
        {props.quest.steps.map((step) => (
          <li key={step} style={{ marginBottom: 8 }}>
            {step}
          </li>
        ))}
      </ol>
      <div
        style={{
          marginTop: 16,
          padding: 14,
          borderRadius: 8,
          background: colors.surfaceMuted,
        }}
      >
        Reward: {props.quest.reward.points} points · {props.quest.reward.badgeName}
      </div>
      {props.quest.verification.type === 'transaction' ? (
        <>
          <button
            disabled={!canStartTransaction}
            onClick={() => props.board.startQuestTransaction(props.quest)}
            style={{
              marginTop: 16,
              width: '100%',
              border: 0,
              borderRadius: 8,
              padding: '10px 14px',
              color: '#ffffff',
              background: canStartTransaction ? colors.primary : '#9ca3af',
              fontWeight: 700,
              cursor: canStartTransaction ? 'pointer' : 'not-allowed',
            }}
          >
            Start On-chain Proof
          </button>
          <button
            disabled={!progress?.transactionId}
            onClick={() => props.board.verifyQuest(props.quest)}
            style={{
              marginTop: 10,
              width: '100%',
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: '10px 14px',
              background: colors.surface,
              color: colors.text,
              fontWeight: 700,
              cursor: progress?.transactionId ? 'pointer' : 'not-allowed',
            }}
          >
            Track Transaction
          </button>
        </>
      ) : (
        <p style={{ color: colors.textMuted }}>
          This quest is verified by submission review or wallet readiness.
        </p>
      )}
    </aside>
  )
}
```

- [ ] **Step 3: 给首页增加入口**

Modify `docs/pages/index.mdx`，在 `<Cards>` 内加入：

```mdx
  <Card title="Aleo Private Quest Board" href="/quest-board" />
```

- [ ] **Step 4: 运行类型检查和构建**

Run:

```bash
cd docs
npm run typecheck
npm run build
```

Expected: both PASS。

- [ ] **Step 5: 本地启动并手动验证**

Run:

```bash
cd docs
npm run dev
```

Expected: Next dev server starts. Open `http://localhost:3000/quest-board` and verify:

- 页面首屏是 Quest Board，而不是营销页。
- Shield Wallet 卡片可见。
- 任务列表有 4 个任务。
- 点击任务会更新右侧详情。
- development 环境点击 `Connect Shield` 会使用 mock wallet 成功连接。
- `Private Transaction Proof` 任务可以进入 pending verification。

- [ ] **Step 6: 提交**

```bash
git add docs/quest-board/styles.ts docs/pages/quest-board.tsx docs/pages/index.mdx
git commit -m "feat: add quest board page"
```

---

## Task 8: Stitch 原型同步

**Files:**
- Modify remote Stitch project: `projects/2287702138354938825`
- Screen ids:
  - Login: `ab1bb94feab64c69b0ccf0aa15591bf5`
  - Main Dashboard: `43dbf794edbd4476907a4642f5371aa2`
  - Task Detail: `2ac1e8a2eb4d48009991b67f6dadc547`
  - Wallet & Transaction Status: `d782b55e1cc847f09fce1640294b8e25`

- [ ] **Step 1: 编辑 Stitch Login / Connect**

Use Stitch `edit_screens` with:

```text
Update this screen to be the Shield Wallet connection screen for Aleo Private Quest Board.
Make Shield Wallet the primary wallet, with a primary "Connect Shield Wallet" button.
Show three preflight checks: Shield installed, Aleo Testnet selected, testnet balance available.
Add recovery actions for missing wallet, wrong network, and no testnet ALEO.
Keep the existing Aleo Quest design system: Geist, white surfaces, Aleo blue primary action, mint private-state accents, amber public/warning accents, 8px radius.
Avoid marketing copy; make this a functional dApp connection screen.
```

- [ ] **Step 2: 编辑 Stitch Main Dashboard**

Use Stitch `edit_screens` with:

```text
Update this screen to match the implemented learner Quest Board dashboard.
Top area should show Shield wallet address, Aleo network, testnet balance, total points, completed quests, and badge count.
Main area should show quest cards grouped by Ready, In Progress, Pending Verification, and Completed.
Use the four MVP quests: Privacy Foundations, Shield Wallet Setup, Aleo Program Basics, Private Transaction Proof.
Add a recent transaction status panel with pending/success/failed examples.
Keep the interface dense, calm, and work-focused.
```

- [ ] **Step 3: 编辑 Stitch Task Detail**

Use Stitch `edit_screens` with:

```text
Update this screen as the task detail view for the selected quest.
Show quest objective, source material, required steps, reward points, badge, wallet/network requirements, and verification type.
Primary action should change by state: Connect Shield, Switch to Testnet, Get Testnet ALEO, Start On-chain Proof, Track Transaction, Claim Badge.
Show a state timeline: Not connected, Connected, Network checked, Transaction requested, Pending, Verified, Badge awarded.
Include clear failed states for user rejected transaction, insufficient balance, transaction failed, and verification timeout.
```

- [ ] **Step 4: 编辑 Stitch Wallet & Transaction Status**

Use Stitch `edit_screens` with:

```text
Update this screen as the wallet and transaction recovery center.
Show Shield Wallet connection state, Aleo Testnet status, balance, recent transaction id, status, and expected transition.
Include recovery actions: install Shield, switch network, open faucet, retry transaction, return to task detail.
Use concise product language and do not include explanatory marketing sections.
```

- [ ] **Step 5: 记录 Stitch 修改结果**

Run or use Stitch `list_screens` and confirm the four screen titles still exist. Capture the updated screen IDs in the implementation notes or final response.

- [ ] **Step 6: 提交本地记录**

If implementation notes are added, commit them:

```bash
git add docs/superpowers/specs/2026-05-29-aleo-private-quest-board-design.md
git commit -m "docs: note stitch quest board updates"
```

If no local file changed, skip this commit.

---

## Task 9: 最终验证

**Files:**
- Read: `docs/package.json`
- Read: `docs/pages/quest-board.tsx`
- Read: `docs/quest-board/**/*.ts`

- [ ] **Step 1: 运行完整测试**

Run:

```bash
cd docs
npm run test:run
```

Expected: PASS。

- [ ] **Step 2: 运行类型检查**

Run:

```bash
cd docs
npm run typecheck
```

Expected: PASS。

- [ ] **Step 3: 运行 production build**

Run:

```bash
cd docs
npm run build
```

Expected: PASS。

- [ ] **Step 4: 启动本地开发服务器**

Run:

```bash
cd docs
npm run dev
```

Expected: Next prints a local URL, normally `http://localhost:3000`。

- [ ] **Step 5: 手动验收 `/quest-board`**

Verify:

- 首页有 Quest Board 入口。
- `/quest-board` 可以打开。
- mock wallet 在 development 环境可以连接。
- wallet card 显示 address、network、balance。
- 四个 quest 都显示。
- 任务详情切换正常。
- transaction quest 可以提交 mock transaction。
- transaction quest 可以进入 pending verification。
- 失败文案不泄露内部异常栈。

- [ ] **Step 6: 检查 git 状态**

Run:

```bash
git status --short
```

Expected: clean working tree, or only有明确说明的未提交本地开发文件。

---

## 自检清单

- Spec coverage:
  - 学员端 dApp：Task 7。
  - Shield-first：Task 3、Task 7、Task 8。
  - 钱包可扩展：Task 3 的 `WalletAdapter`。
  - 任务 catalog：Task 2。
  - 链上交易和状态查询：Task 4。
  - 积分和徽章反馈：Task 5、Task 7。
  - Stitch 原型同步：Task 8。
- Completeness scan:
  - 未发现会阻塞执行的空泛说明。
  - Shield 真实 API 通过 adapter 的 provider detection 包装，未知方法明确返回 `unsupported_method`，不会留下未定义行为。
- Type consistency:
  - `QuestStatus`、`Quest`、`WalletAdapter`、`AleoChainService`、`QuestProgress` 在后续任务中复用同名类型。
  - 页面只依赖 `useQuestBoard`，不直接访问 Shield provider 或 explorer response。
