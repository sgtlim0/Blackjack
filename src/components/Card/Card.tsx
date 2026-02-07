import type { Card as CardType } from '../../types/index.ts'
import { SUIT_SYMBOLS, SUIT_COLORS } from '../../types/index.ts'
import styles from './Card.module.css'

interface CardProps {
  readonly card: CardType
  readonly delay?: number
  readonly animateIn?: boolean
}

export default function Card({ card, delay = 0, animateIn = false }: CardProps) {
  const suitSymbol = SUIT_SYMBOLS[card.suit]
  const suitColor = SUIT_COLORS[card.suit]
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds'

  const className = [
    styles.card,
    !card.faceUp ? styles.flipped : '',
    animateIn ? styles.animateIn : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={className} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.inner}>
        <div className={styles.face} style={{ color: suitColor }}>
          <div className={styles.corner}>
            <span className={`${styles.rank} ${isRed ? styles.red : styles.black}`}>{card.rank}</span>
            <span className={styles.suit}>{suitSymbol}</span>
          </div>
          <div className={styles.center}>
            <span className={styles.centerSuit}>{suitSymbol}</span>
          </div>
          <div className={`${styles.corner} ${styles.bottomCorner}`}>
            <span className={`${styles.rank} ${isRed ? styles.red : styles.black}`}>{card.rank}</span>
            <span className={styles.suit}>{suitSymbol}</span>
          </div>
        </div>
        <div className={styles.back}>
          <div className={styles.backPattern} />
        </div>
      </div>
    </div>
  )
}
