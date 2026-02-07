import type { AiDifficulty } from '../../types/index.ts'
import type { LabState, LabStats } from '../../hooks/useSimulationLab.ts'
import ProbabilityBar from '../ProbabilityBar/ProbabilityBar.tsx'
import styles from './SimulationLab.module.css'

interface SimulationLabProps {
  readonly labState: LabState
  readonly onSetHandCount: (count: number) => void
  readonly onToggleDifficulty: (d: AiDifficulty) => void
  readonly onRun: () => void
  readonly onCancel: () => void
  readonly onReset: () => void
  readonly onBack: () => void
}

const DIFFICULTY_CONFIG: Record<AiDifficulty, { label: string; description: string; color: string }> = {
  easy: { label: 'Random', description: 'Random hit/stand decisions', color: '#95a5a6' },
  pro: { label: 'Basic Strategy', description: 'Optimal strategy table', color: '#3498db' },
  casino: { label: 'Card Counting', description: 'Hi-Lo count + deviations', color: '#e74c3c' },
}

const HAND_OPTIONS = [500, 1000, 5000, 10000]

function ResultCard({ stats }: { readonly stats: LabStats }) {
  const config = DIFFICULTY_CONFIG[stats.difficulty]
  const netProfit = stats.finalChips - 10000
  const isProfit = netProfit > 0

  return (
    <div className={styles.resultCard}>
      <div className={styles.resultHeader}>
        <span className={styles.resultDot} style={{ background: config.color }} />
        <span className={styles.resultLabel}>{config.label}</span>
      </div>

      <div className={styles.resultGrid}>
        <div className={styles.statBox}>
          <span className={styles.statValue}>{(stats.winRate * 100).toFixed(1)}%</span>
          <span className={styles.statLabel}>Win Rate</span>
        </div>
        <div className={styles.statBox}>
          <span className={`${styles.statValue} ${stats.ev >= 0 ? styles.positive : styles.negative}`}>
            {stats.ev >= 0 ? '+' : ''}{stats.ev.toFixed(2)}%
          </span>
          <span className={styles.statLabel}>EV (Edge)</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statValue}>{stats.blackjacks}</span>
          <span className={styles.statLabel}>Blackjacks</span>
        </div>
        <div className={styles.statBox}>
          <span className={`${styles.statValue} ${isProfit ? styles.positive : styles.negative}`}>
            {isProfit ? '+' : ''}{netProfit.toLocaleString()}
          </span>
          <span className={styles.statLabel}>Net P&L</span>
        </div>
      </div>

      <div className={styles.resultBars}>
        <ProbabilityBar label="Win" value={stats.winRate} color="#27ae60" />
        <ProbabilityBar label="Lose" value={stats.handsPlayed > 0 ? stats.losses / stats.handsPlayed : 0} color="#e74c3c" />
        <ProbabilityBar label="Push" value={stats.handsPlayed > 0 ? stats.pushes / stats.handsPlayed : 0} color="#3498db" />
      </div>

      <div className={styles.resultMeta}>
        <span>{stats.handsPlayed.toLocaleString()} hands</span>
        <span>Peak: ${stats.peakChips.toLocaleString()}</span>
        <span>Final: ${stats.finalChips.toLocaleString()}</span>
      </div>
    </div>
  )
}

export default function SimulationLab({
  labState,
  onSetHandCount,
  onToggleDifficulty,
  onRun,
  onCancel,
  onReset,
  onBack,
}: SimulationLabProps) {
  return (
    <div className={styles.lab}>
      <div className={styles.labHeader}>
        <button className={styles.backButton} onClick={onBack}>&larr; Play</button>
        <span className={styles.labTitle}>AI vs AI Lab</span>
        <div className={styles.labBadge}>Experiment</div>
      </div>

      <div className={styles.labContent}>
        {labState.phase === 'config' && (
          <div className={styles.config}>
            <div className={styles.section}>
              <span className={styles.sectionTitle}>AI Strategies</span>
              <div className={styles.difficultyList}>
                {(Object.keys(DIFFICULTY_CONFIG) as AiDifficulty[]).map(d => {
                  const config = DIFFICULTY_CONFIG[d]
                  const selected = labState.selectedDifficulties.includes(d)
                  return (
                    <button
                      key={d}
                      className={`${styles.difficultyChip} ${selected ? styles.selected : ''}`}
                      style={{ borderColor: selected ? config.color : undefined }}
                      onClick={() => onToggleDifficulty(d)}
                    >
                      <span className={styles.chipDot} style={{ background: config.color }} />
                      <div className={styles.chipText}>
                        <span className={styles.chipLabel}>{config.label}</span>
                        <span className={styles.chipDesc}>{config.description}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={styles.section}>
              <span className={styles.sectionTitle}>Hands to Simulate</span>
              <div className={styles.handOptions}>
                {HAND_OPTIONS.map(count => (
                  <button
                    key={count}
                    className={`${styles.handChip} ${labState.handCount === count ? styles.handSelected : ''}`}
                    onClick={() => onSetHandCount(count)}
                  >
                    {count >= 1000 ? `${count / 1000}K` : count}
                  </button>
                ))}
              </div>
            </div>

            <button className={styles.runButton} onClick={onRun}>
              Run Simulation
            </button>
          </div>
        )}

        {labState.phase === 'running' && (
          <div className={styles.running}>
            <div className={styles.progressWrapper}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${labState.progress}%` }} />
              </div>
              <span className={styles.progressText}>
                Simulating... {labState.progress}%
              </span>
            </div>
            {labState.results.length > 0 && (
              <div className={styles.resultsList}>
                {labState.results.map(r => <ResultCard key={r.difficulty} stats={r} />)}
              </div>
            )}
            <button className={styles.cancelButton} onClick={onCancel}>Cancel</button>
          </div>
        )}

        {labState.phase === 'done' && (
          <div className={styles.done}>
            <div className={styles.resultsList}>
              {labState.results.map(r => <ResultCard key={r.difficulty} stats={r} />)}
            </div>

            {labState.results.length >= 2 && (
              <div className={styles.comparison}>
                <span className={styles.compTitle}>Strategy Comparison</span>
                <div className={styles.compBars}>
                  {labState.results.map(r => {
                    const config = DIFFICULTY_CONFIG[r.difficulty]
                    return (
                      <div key={r.difficulty} className={styles.compRow}>
                        <span className={styles.compLabel} style={{ color: config.color }}>{config.label}</span>
                        <div className={styles.compBarTrack}>
                          <div
                            className={styles.compBarFill}
                            style={{
                              width: `${Math.max(0, Math.min(100, (r.winRate * 100)))}%`,
                              background: config.color,
                            }}
                          />
                        </div>
                        <span className={styles.compValue}>{(r.winRate * 100).toFixed(1)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className={styles.insight}>
              {getBestInsight(labState.results)}
            </div>

            <div className={styles.doneActions}>
              <button className={styles.runButton} onClick={onReset}>New Experiment</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getBestInsight(results: readonly LabStats[]): string {
  if (results.length === 0) return ''
  const sorted = [...results].sort((a, b) => b.ev - a.ev)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  if (results.length === 1) {
    return `${best.label}: ${best.ev >= 0 ? '+' : ''}${best.ev.toFixed(2)}% expected value over ${best.handsPlayed.toLocaleString()} hands.`
  }

  const evDiff = Math.abs(best.ev - worst.ev).toFixed(2)
  return `${best.label} outperforms ${worst.label} by ${evDiff}% EV. Card counting narrows the house edge — it's math, not luck.`
}
