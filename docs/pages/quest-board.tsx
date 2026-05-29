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