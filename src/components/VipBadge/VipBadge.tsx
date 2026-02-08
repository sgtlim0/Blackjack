import type { VipInfo } from '../../types/index.ts'
import styles from './VipBadge.module.css'

interface VipBadgeProps {
  readonly vip: VipInfo
  readonly handsPlayed: number
  readonly justLeveledUp: boolean
}

export default function VipBadge({ vip, handsPlayed, justLeveledUp }: VipBadgeProps) {
  const progress = vip.nextHandsRequired
    ? ((handsPlayed - vip.handsRequired) / (vip.nextHandsRequired - vip.handsRequired)) * 100
    : 100

  return (
    <div className={`${styles.badge} ${justLeveledUp ? styles.levelUp : ''}`}>
      <span className={styles.tierIcon} style={{ color: vip.color }}>
        {vip.tier === 'diamond' ? '\u2666' : vip.tier === 'gold' ? '\u2605' : vip.tier === 'silver' ? '\u25C6' : '\u25CF'}
      </span>
      <div className={styles.info}>
        <span className={styles.tierLabel} style={{ color: vip.color }}>{vip.label}</span>
        {vip.nextHandsRequired && (
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(100, progress)}%`, background: vip.color }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
