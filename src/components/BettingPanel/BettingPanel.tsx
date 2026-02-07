import type { GameStats } from '../../types/index.ts'
import { MIN_BET, BET_STEP, MAX_BET_RATIO } from '../../types/index.ts'
import styles from './BettingPanel.module.css'

interface BettingPanelProps {
  readonly chips: number
  readonly currentBet: number
  readonly onBetChange: (bet: number) => void
  readonly onQuickBet: (bet: number) => void
  readonly onDeal: () => void
  readonly stats: GameStats
  readonly isResult: boolean
  readonly onNextHand: () => void
}

export default function BettingPanel({
  chips,
  currentBet,
  onBetChange,
  onQuickBet,
  onDeal,
  stats,
  isResult,
  onNextHand,
}: BettingPanelProps) {
  const maxBet = Math.floor(chips * MAX_BET_RATIO / BET_STEP) * BET_STEP
  const canDeal = currentBet >= MIN_BET && currentBet <= chips

  function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = parseInt(e.target.value, 10)
    onBetChange(Math.max(MIN_BET, Math.min(value, maxBet)))
  }

  function handleQuickBet(amount: number) {
    onQuickBet(Math.min(amount, maxBet))
  }

  return (
    <div className={styles.panel}>
      {isResult ? (
        <div className={styles.nextHandRow}>
          <button className={styles.dealButton} onClick={onNextHand}>
            Next Hand
          </button>
        </div>
      ) : (
        <>
          <div className={styles.betRow}>
            <span className={styles.betLabel}>Bet: ${currentBet.toLocaleString()}</span>
            <input
              type="range"
              className={styles.slider}
              min={MIN_BET}
              max={maxBet || MIN_BET}
              step={BET_STEP}
              value={currentBet}
              onChange={handleSliderChange}
            />
          </div>
          <div className={styles.quickBets}>
            {[100, 500, 1000, 2500].map(amount => (
              <button
                key={amount}
                className={styles.quickBetChip}
                onClick={() => handleQuickBet(amount)}
                disabled={amount > maxBet}
              >
                ${amount >= 1000 ? `${amount / 1000}K` : amount}
              </button>
            ))}
          </div>
          <button
            className={styles.dealButton}
            onClick={onDeal}
            disabled={!canDeal}
          >
            Deal
          </button>
        </>
      )}
      <div className={styles.stats}>
        <span>W:{stats.wins}</span>
        <span>L:{stats.losses}</span>
        <span>P:{stats.pushes}</span>
        <span>BJ:{stats.blackjacks}</span>
      </div>
    </div>
  )
}
