import styles from './ProbabilityBar.module.css'

interface ProbabilityBarProps {
  readonly label: string
  readonly value: number
  readonly color: string
  readonly showPercent?: boolean
}

export default function ProbabilityBar({ label, value, color, showPercent = true }: ProbabilityBarProps) {
  const percent = Math.round(value * 100)

  return (
    <div className={styles.bar}>
      <span className={styles.label}>{label}</span>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
      {showPercent && <span className={styles.percent}>{percent}%</span>}
    </div>
  )
}
