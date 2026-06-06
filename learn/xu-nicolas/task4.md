# Task 4 - 用起来：真实场景落地

## 项目名称

Aleo Private Quest Board

## 项目说明

这是一个面向 Aleo 101 Bootcamp 的链上学习打卡应用。用户可以连接 Shield Wallet，完成学习任务，并通过 Aleo Testnet 上的一笔真实交易完成链上打卡验证。

应用中的链上任务 `Private Transaction Proof` 会要求用户发起一次 Aleo 测试网交易，然后把交易 ID 填回 Quest Board。前端会调用 Provable Explorer API 查询该交易，并验证交易中是否包含 `credits.aleo / transfer_public` transition。

## 代码位置

项目仓库：`https://github.com/xu-nicolas/aleo-quest-board`

- Quest Board 页面：`https://github.com/xu-nicolas/aleo-quest-board/blob/main/quest-board.tsx`
- 钱包适配器：`https://github.com/xu-nicolas/aleo-quest-board/tree/main/quest-board/wallet`
- Aleo 测试网验证服务：`https://github.com/xu-nicolas/aleo-quest-board/tree/main/quest-board/chain`
- 任务配置：`https://github.com/xu-nicolas/aleo-quest-board/blob/main/quest-board/catalog.ts`
- 状态管理：`https://github.com/xu-nicolas/aleo-quest-board/blob/main/quest-board/useQuestBoard.ts`

## 测试网合约 / Program

- Network: Aleo Testnet
- Program ID: `credits.aleo`
- Function: `transfer_public`

本次 Task 4 使用 Aleo 测试网已部署的 `credits.aleo` 程序完成一次 public self-transfer，作为 Quest Board 的链上打卡凭证。

## 链上交互记录

- Transaction ID: `at1ymg4chr7axfcalt2wvck9ujdq9d2gw20a0684sdzj9and5yw0g9s8hsuvc`
- Explorer URL: `https://testnet.explorer.provable.com/transaction/at1ymg4chr7axfcalt2wvck9ujdq9d2gw20a0684sdzj9and5yw0g9s8hsuvc`
- API 验证地址: `https://api.explorer.provable.com/v1/testnet/transaction/at1ymg4chr7axfcalt2wvck9ujdq9d2gw20a0684sdzj9and5yw0g9s8hsuvc`

交易内容包含：

- Program: `credits.aleo`
- Transition: `transfer_public`
- Network: `testnet`
- Status: accepted

## 操作流程

1. 打开 Quest Board：`http://127.0.0.1:3006/quest-board`
2. 连接 Shield Wallet，并确认钱包网络为 Aleo Testnet。
3. 选择 `Private Transaction Proof` 任务。
4. 点击 `Start On-chain Proof`，在 Shield Wallet 中确认交易。
5. 等待 Shield Wallet 返回交易 ID。
6. 将交易 ID 填入 `Transaction ID` 输入框。
7. 点击 `Save Transaction ID`。
8. 点击 `Track Transaction`，应用会查询 Aleo Testnet explorer 并验证交易。
9. 验证通过后任务状态变为 `Completed`，总积分增加 200 points。

## 链上验证结果

Quest Board 已成功验证该交易，`Private Transaction Proof` 状态变为 `Completed`。

验证依据：

- Explorer API 返回 HTTP 200。
- 交易中包含 `credits.aleo`。
- 交易中包含 `transfer_public` transition。
- 本地 Quest Board 任务状态更新为 `verified`。

## 截图

已随 PR 提交链上交互截图和 Quest Board 验证完成截图：

- `learn/xu-nicolas/task4-chain-interaction.png`
- `learn/xu-nicolas/task4-quest-board-completed.png`
