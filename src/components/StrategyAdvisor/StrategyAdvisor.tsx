import type { StrategyAdvice } from '../../types/index.ts'
import ProbabilityBar from '../ProbabilityBar/ProbabilityBar.tsx'
import styles from './StrategyAdvisor.module.css'

interface StrategyAdvisorProps {
  readonly advice: StrategyAdvice | null
  readonly visible: boolean
  readonly onToggle: () => void
}

const ACTION_CONFIG = {
  hit: { label: 'HIT', color: '#27ae60', icon: '+' },
  stand: { label: 'STAND', color: '#e74c3c', icon: '=' },
  double: { label: 'DOUBLE', color: '#f39c12', icon: 'x2' },
} as const

const ADVANTAGE_LABELS = {
  player: { text: 'Player Edge', color: '#27ae60' },
  neutral: { text: 'Neutral', color: '#95a5a6' },
  dealer: { text: 'House Edge', color: '#e74c3c' },
} as const

export default function StrategyAdvisor({ advice, visible, onToggle }: StrategyAdvisorProps) {
  return (
    <div className={styles.advisor}>
      <button className={styles.toggle} onClick={onToggle}>
        <span className={styles.toggleIcon}>{visible ? '\u25BC' : '\u25B2'}</span>
        <span className={styles.toggleLabel}>AI Advisor</span>
      </button>

      {visible && advice && (
        <div className={styles.panel}>
          <div className={styles.recommendation}>
            <span className={styles.recLabel}>Recommended</span>
            <span
              className={styles.recAction}
              style={{ color: ACTION_CONFIG[advice.recommended].color }}
            >
              {ACTION_CONFIG[advice.recommended].icon}{' '}
              {ACTION_CONFIG[advice.recommended].label}
            </span>
          </div>

          <div className={styles.sections}>
            <div className={styles.section}>
              <span className={styles.sectionTitle}>If HIT</span>
              <ProbabilityBar label="Win" value={advice.hitResult.winRate} color="#27ae60" />
              <ProbabilityBar label="Bust" value={advice.hitResult.bustRate} color="#e74c3c" />
            </div>

            <div className={styles.section}>
              <span className={styles.sectionTitle}>If STAND</span>
              <ProbabilityBar label="Win" value={advice.standResult.winRate} color="#27ae60" />
              <ProbabilityBar label="Lose" value={advice.standResult.loseRate} color="#e74c3c" />
            </div>

            {advice.doubleResult && (
              <div className={styles.section}>
                <span className={styles.sectionTitle}>If DOUBLE</span>
                <ProbabilityBar label="Win" value={advice.doubleResult.winRate} color="#27ae60" />
                <ProbabilityBar label="Bust" value={advice.doubleResult.bustRate} color="#e74c3c" />
              </div>
            )}
          </div>

          <div className={styles.countInfo}>
            <span className={styles.countLabel}>True Count</span>
            <span className={styles.countValue} style={{
              color: advice.trueCount > 0 ? '#27ae60' : advice.trueCount < 0 ? '#e74c3c' : '#95a5a6'
            }}>
              {advice.trueCount > 0 ? '+' : ''}{advice.trueCount}
            </span>
            <span
              className={styles.advantage}
              style={{ color: ADVANTAGE_LABELS[advice.deckAdvantage].color }}
            >
              {ADVANTAGE_LABELS[advice.deckAdvantage].text}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
