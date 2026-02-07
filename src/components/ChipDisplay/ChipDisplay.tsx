import styles from './ChipDisplay.module.css'

interface ChipDisplayProps {
  readonly amount: number
}

export default function ChipDisplay({ amount }: ChipDisplayProps) {
  return (
    <div className={styles.display}>
      <div className={styles.chip}>
        <span className={styles.chipInner}>$</span>
      </div>
      <span className={styles.amount}>${amount.toLocaleString()}</span>
    </div>
  )
}
