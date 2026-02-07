import type { ReactNode } from 'react'
import styles from './Table.module.css'

interface TableProps {
  readonly dealerArea: ReactNode
  readonly playerArea: ReactNode
  readonly betDisplay: number
  readonly children?: ReactNode
}

export default function Table({ dealerArea, playerArea, betDisplay, children }: TableProps) {
  return (
    <div className={styles.table}>
      <div className={styles.felt}>
        <div className={styles.dealerZone}>
          {dealerArea}
        </div>
        <div className={styles.centerZone}>
          {betDisplay > 0 && (
            <div className={styles.potDisplay}>
              <span className={styles.potLabel}>BET</span>
              <span className={styles.potAmount}>${betDisplay.toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className={styles.playerZone}>
          {playerArea}
        </div>
      </div>
      {children}
    </div>
  )
}
