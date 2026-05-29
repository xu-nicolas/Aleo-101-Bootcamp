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