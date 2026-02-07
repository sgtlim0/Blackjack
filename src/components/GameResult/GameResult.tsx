import type { GameResult as GameResultType } from '../../types/index.ts'
import styles from './GameResult.module.css'

interface GameResultProps {
  readonly result: GameResultType
  readonly payout: number
  readonly bet: number
}

const RESULT_CONFIG: Record<GameResultType, { label: string; className: string }> = {
  playerBlackjack: { label: 'Blackjack!', className: 'blackjack' },
  playerWin: { label: 'You Win!', className: 'win' },
  dealerBust: { label: 'Dealer Busts!', className: 'win' },
  push: { label: 'Push', className: 'push' },
  dealerWin: { label: 'Dealer Wins', className: 'lose' },
  dealerBlackjack: { label: 'Dealer Blackjack', className: 'lose' },
  playerBust: { label: 'Bust!', className: 'lose' },
}

export default function GameResult({ result, payout, bet }: GameResultProps) {
  const config = RESULT_CONFIG[result]
  const net = payout - bet

  return (
    <div className={`${styles.overlay} ${styles[config.className]}`}>
      <div className={styles.banner}>
        <span className={styles.label}>{config.label}</span>
        {net !== 0 && (
          <span className={styles.payout}>
            {net > 0 ? '+' : ''}{net.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  )
}
