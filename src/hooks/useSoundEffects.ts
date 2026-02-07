import { useEffect, useRef, useState, useCallback } from 'react'
import type { GamePhase, GameResult } from '../types/index.ts'
import {
  playDealSequence,
  playHit,
  playStand,
  playDouble,
  playWin,
  playBlackjack,
  playLose,
  playBust,
  playPush,
  playCardFlip,
  playChipClick,
  playChipTick,
  playButtonPress,
  playButtonRelease,
  hapticLight,
  hapticMedium,
  hapticHeavy,
  hapticSuccess,
  hapticError,
} from '../engine/sound.ts'

interface SoundTriggers {
  readonly phase: GamePhase
  readonly result: GameResult | null
  readonly playerCardCount: number
  readonly dealerCardCount: number
}

export function useSoundEffects(triggers: SoundTriggers) {
  const [muted, setMuted] = useState(false)
  const prevRef = useRef<SoundTriggers>(triggers)
  const initialized = useRef(false)

  const toggleMute = useCallback(() => {
    setMuted(prev => !prev)
  }, [])

  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = triggers

    // Skip initial render
    if (!initialized.current) {
      initialized.current = true
      return
    }

    if (muted) return

    // Phase transitions
    if (triggers.phase !== prev.phase) {
      // Deal started
      if (triggers.phase === 'playerTurn' && prev.phase === 'betting') {
        playDealSequence()
        hapticMedium()
      }

      // Dealer turn started (card flip)
      if (triggers.phase === 'dealerTurn') {
        playCardFlip()
        hapticLight()
      }

      // Result arrived
      if (triggers.phase === 'result' && triggers.result) {
        setTimeout(() => {
          if (muted) return
          switch (triggers.result) {
            case 'playerBlackjack':
              playBlackjack()
              hapticSuccess()
              break
            case 'playerWin':
            case 'dealerBust':
              playWin()
              hapticSuccess()
              break
            case 'playerBust':
              playBust()
              hapticError()
              break
            case 'dealerWin':
            case 'dealerBlackjack':
              playLose()
              hapticHeavy()
              break
            case 'push':
              playPush()
              hapticLight()
              break
          }
        }, 200)
      }
    }

    // Player drew a card (hit) during player turn
    if (
      triggers.phase === 'playerTurn' &&
      prev.phase === 'playerTurn' &&
      triggers.playerCardCount > prev.playerCardCount
    ) {
      playHit()
      hapticLight()
    }

    // Dealer drew a card during dealer turn
    if (
      triggers.phase === 'dealerTurn' &&
      prev.phase === 'dealerTurn' &&
      triggers.dealerCardCount > prev.dealerCardCount
    ) {
      playCardFlip()
      hapticLight()
    }
  }, [triggers, muted])

  return { muted, toggleMute, playChipClick, playChipTick, playButtonPress, playButtonRelease, playStand, playDouble, hapticLight }
}
