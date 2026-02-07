import type { Card as CardType, HandState } from '../../types/index.ts'
import Card from '../Card/Card.tsx'
import styles from './Hand.module.css'

interface HandProps {
  readonly cards: readonly CardType[]
  readonly handState: HandState
  readonly label: string
  readonly isActive?: boolean
  readonly hideScore?: boolean
}

export default function Hand({ cards, handState, label, isActive = false, hideScore = false }: HandProps) {
  const scoreText = handState.isBust
    ? `${handState.score} BUST`
    : handState.isBlackjack
      ? 'Blackjack!'
      : handState.isSoft
        ? `${handState.score}`
        : `${handState.score}`

  return (
    <div className={`${styles.hand} ${isActive ? styles.active : ''}`}>
      <div className={styles.label}>
        <span className={styles.labelText}>{label}</span>
        {!hideScore && handState.cardCount > 0 && (
          <span className={`${styles.score} ${handState.isBust ? styles.bust : ''} ${handState.isBlackjack ? styles.blackjack : ''}`}>
            {scoreText}
          </span>
        )}
      </div>
      <div className={styles.cards}>
        {cards.map((card, i) => (
          <div key={`${card.suit}-${card.rank}-${i}`} className={styles.cardSlot} style={{ zIndex: i }}>
            <Card card={card} animateIn delay={i * 150} />
          </div>
        ))}
      </div>
    </div>
  )
}
