import type { LeaderboardEntry } from '../../types/index.ts'
import { VIP_TIERS } from '../../types/index.ts'
import styles from './Leaderboard.module.css'

interface LeaderboardProps {
  readonly entries: readonly LeaderboardEntry[]
  readonly visible: boolean
  readonly onClose: () => void
  readonly currentChips: number
}

export default function Leaderboard({ entries, visible, onClose, currentChips }: LeaderboardProps) {
  if (!visible) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Leaderboard</span>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.current}>
          <span className={styles.currentLabel}>Current Session</span>
          <span className={styles.currentChips}>${currentChips.toLocaleString()}</span>
        </div>

        {entries.length === 0 ? (
          <div className={styles.empty}>No records yet. Keep playing!</div>
        ) : (
          <div className={styles.list}>
            {entries.map((entry, i) => {
              const tierConfig = VIP_TIERS[entry.tier]
              return (
                <div key={`${entry.date}-${i}`} className={styles.row}>
                  <span className={styles.rank}>#{i + 1}</span>
                  <span className={styles.tierDot} style={{ color: tierConfig.color }}>
                    {entry.tier === 'diamond' ? '\u2666' : entry.tier === 'gold' ? '\u2605' : '\u25CF'}
                  </span>
                  <div className={styles.rowInfo}>
                    <span className={styles.chips}>${entry.chips.toLocaleString()}</span>
                    <span className={styles.meta}>
                      {entry.handsPlayed} hands &middot; {entry.streak} best streak &middot; {entry.date}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
