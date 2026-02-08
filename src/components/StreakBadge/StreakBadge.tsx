import styles from './StreakBadge.module.css'

interface StreakBadgeProps {
  readonly streak: number
  readonly multiplier: number
}

export default function StreakBadge({ streak, multiplier }: StreakBadgeProps) {
  if (streak < 2) return null

  const isHot = streak >= 5
  const isWarm = streak >= 3

  return (
    <div className={`${styles.badge} ${isHot ? styles.hot : isWarm ? styles.warm : ''}`}>
      <span className={styles.fire}>{isHot ? '\uD83D\uDD25' : '\u26A1'}</span>
      <span className={styles.count}>{streak}</span>
      {multiplier > 1 && (
        <span className={styles.multiplier}>x{multiplier}</span>
      )}
    </div>
  )
}
