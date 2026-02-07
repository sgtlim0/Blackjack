import type { DealerComment } from '../../types/index.ts'
import styles from './DealerPersona.module.css'

interface DealerPersonaProps {
  readonly comment: DealerComment | null
}

const MOOD_CLASS: Record<DealerComment['mood'], string> = {
  neutral: styles.neutral ?? '',
  impressed: styles.impressed ?? '',
  warning: styles.warning ?? '',
  taunt: styles.taunt ?? '',
}

export default function DealerPersona({ comment }: DealerPersonaProps) {
  if (!comment) return null

  return (
    <div className={`${styles.persona} ${MOOD_CLASS[comment.mood] || ''}`}>
      <span className={styles.icon}>D</span>
      <span className={styles.text}>{comment.text}</span>
    </div>
  )
}
