# Aleo Private Quest Board Design

Date: 2026-05-29

## Summary

Aleo Private Quest Board is a learner-facing dApp for Aleo 101 Bootcamp participants. The first version focuses on a complete learner loop: connect Shield Wallet, verify the network and test balance, complete quest tasks, submit or trigger on-chain proof work, track transaction status, and receive points or badges.

The product starts from the existing Stitch project `Aleo Private Quest Board` and then becomes a real web application in this repository. Stitch remains the source for refining the user flow and interface; the implementation should keep the same Shield-first product direction.

## Goals

- Let learners see Bootcamp tasks, progress, points, and badges in one dashboard.
- Use Shield Wallet as the default wallet experience.
- Keep the wallet integration extensible so Leo, Puzzle, or other Aleo wallets can be added later.
- Support a real Aleo MVP path with wallet connection, network checks, transaction submission, and transaction status tracking.
- Use existing Bootcamp task content as the first quest catalog source.

## Non-Goals

- Build an admin or teaching-assistant dashboard in the first version.
- Build a multi-wallet product selector as a first-class first-version feature.
- Add a backend service for anti-cheat, manual review, or durable user progress in the first version.
- Solve every possible Aleo program interaction in the first pass.

## Product Scope

The first version is a learner dApp. A learner opens the app, connects Shield Wallet, confirms the wallet is on the expected Aleo network, chooses a task, performs the required chain action or proof submission, watches the transaction move through pending and verified states, then receives visible progress, points, and badge feedback.

The first implementation should prioritize a small number of representative tasks from the current Bootcamp materials. It should prove the full loop before expanding the task catalog.

## Primary User Flow

1. Learner opens the landing page and launches the board.
2. App asks the learner to connect Shield Wallet.
3. App checks wallet availability, address, network, and test balance.
4. Learner opens the dashboard and selects a quest.
5. Learner reads the quest requirements and starts the on-chain proof or transaction.
6. App shows transaction pending state and lets the learner track it.
7. App verifies success through Aleo chain data.
8. App marks the quest complete and awards points or a badge.

## Failure States

The UI must handle these states directly:

- Shield Wallet is not installed.
- Wallet connection is rejected by the learner.
- Wallet is on the wrong network.
- Test balance is insufficient.
- Transaction request is rejected.
- Transaction is pending longer than expected.
- Transaction fails.
- Verification times out or cannot find the expected chain result.

Every failure state should offer a concrete recovery action, such as installing Shield, switching to Testnet, opening the faucet, retrying the transaction, or returning to the task detail screen.

## Architecture

### Quest Catalog

The quest catalog describes Bootcamp tasks and maps each task to its product behavior. The initial source can be structured metadata derived from `task/task1.md` through `task/task4.md`, with each quest defining:

- id
- title
- description
- steps
- reward points
- badge metadata
- required wallet or network state
- verification type
- optional Aleo program or transaction requirements

### Wallet Layer

The wallet layer is Shield-first but adapter-based. Business logic should depend on a shared wallet interface instead of Shield-specific objects.

The initial wallet interface should cover:

- `connect`
- `disconnect`
- `getAddress`
- `getNetwork`
- `getBalance`
- `requestTransaction`
- `getTransactionHistory` or equivalent history lookup when Shield supports it
- connection and account-change events where available

The first concrete adapter is `ShieldWalletAdapter`. Later adapters can support Leo, Puzzle, or other Aleo wallets without rewriting quest UI or progress logic.

### Aleo Chain Service

The chain service converts Aleo chain data into product states. It should handle transaction lookup, balance lookup, and verification checks for quest completion. The UI should not need to know raw explorer or RPC response shapes.

Product states:

- `not_started`
- `ready`
- `in_progress`
- `pending_verification`
- `verified`
- `failed`

### Quest Progress

The first version can combine local state and chain verification. Local storage can keep UI continuity, while chain checks determine whether a task can be marked verified.

Points and badges are product feedback in the first version. If future versions need stronger anti-cheat guarantees, progress should move to a backend verifier or a dedicated on-chain record.

### UI Shell

The UI should use the existing Stitch direction: calm, high-legibility, Shield-first, and focused on learner progress. The app should not feel like a marketing landing page after launch; the main experience should be the quest board itself.

## Stitch Screen Plan

The existing Stitch screens should be refined in this order:

1. Login / Connect
   - Default action: connect Shield Wallet.
   - Show installation, network, and faucet recovery states.

2. Main Dashboard
   - Show wallet address, network, balance, points, badges, and quest cards.
   - Group quests by status: ready, in progress, pending verification, completed.

3. Task Detail
   - Show task requirements, steps, reward, and current status.
   - Main action changes based on wallet and quest state.

4. Wallet & Transaction Status
   - Show recent transactions, pending state, failure reasons, and recovery actions.

Landing can remain lightweight. The important product work is the connected quest flow.

## Implementation Direction

The code implementation should follow the Stitch flow after it is finalized. The likely path is:

1. Create a frontend app inside this repository or the existing docs app, depending on the final implementation plan.
2. Add static quest metadata from Bootcamp tasks.
3. Build the Shield-first wallet adapter and mock adapter for local development.
4. Add chain service functions for balance, transaction status, and quest verification.
5. Build Dashboard, Task Detail, and Wallet Status views.
6. Add focused tests around wallet adapter behavior, quest state transitions, and verification mapping.

## Open Implementation Questions

- What exact Shield Wallet browser API shape is available in the current extension version?
- Which Aleo network should the MVP target by default?
- Which first quest should perform the real on-chain action?
- Is the existing docs app the right host, or should the quest board be a separate app directory?

These are implementation-planning questions, not blockers for the current product design.
