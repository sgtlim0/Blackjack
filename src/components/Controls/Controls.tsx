import styles from './Controls.module.css'

interface ControlsProps {
  readonly onHit: () => void
  readonly onStand: () => void
  readonly onDouble: () => void
  readonly canDouble: boolean
  readonly disabled: boolean
}

export default function Controls({ onHit, onStand, onDouble, canDouble, disabled }: ControlsProps) {
  return (
    <div className={styles.controls}>
      <button
        className={`${styles.button} ${styles.hit}`}
        onClick={onHit}
        disabled={disabled}
      >
        Hit
      </button>
      <button
        className={`${styles.button} ${styles.stand}`}
        onClick={onStand}
        disabled={disabled}
      >
        Stand
      </button>
      {canDouble && (
        <button
          className={`${styles.button} ${styles.double}`}
          onClick={onDouble}
          disabled={disabled}
        >
          Double
        </button>
      )}
    </div>
  )
}
