import { useState, useCallback } from 'react'
import type { GameResult, VipTier, VipInfo, LeaderboardEntry } from '../types/index.ts'
import { VIP_TIERS, VIP_ORDER } from '../types/index.ts'

const LEADERBOARD_KEY = 'blackjack_leaderboard'
const MAX_ENTRIES = 10

function getVipTier(handsPlayed: number): VipTier {
  for (let i = VIP_ORDER.length - 1; i >= 0; i--) {
    if (handsPlayed >= VIP_TIERS[VIP_ORDER[i]].handsRequired) {
      return VIP_ORDER[i]
    }
  }
  return 'bronze'
}

function getVipInfo(handsPlayed: number): VipInfo {
  const tier = getVipTier(handsPlayed)
  const tierIdx = VIP_ORDER.indexOf(tier)
  const nextTier = tierIdx < VIP_ORDER.length - 1 ? VIP_ORDER[tierIdx + 1] : null
  const config = VIP_TIERS[tier]

  return {
    tier,
    label: config.label,
    color: config.color,
    nextTier,
    handsRequired: config.handsRequired,
    nextHandsRequired: nextTier ? VIP_TIERS[nextTier].handsRequired : null,
  }
}

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY)
    if (!raw) return []
    return JSON.parse(raw) as LeaderboardEntry[]
  } catch {
    return []
  }
}

function saveLeaderboard(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries))
  } catch {
    // localStorage might be full or unavailable
  }
}

export interface ProgressionState {
  readonly streak: number
  readonly bestStreak: number
  readonly vip: VipInfo
  readonly leaderboard: readonly LeaderboardEntry[]
  readonly justLeveledUp: boolean
  readonly showLeaderboard: boolean
}

export function useProgression(handsPlayed: number, chips: number) {
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => loadLeaderboard())
  const [justLeveledUp, setJustLeveledUp] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [, setPrevTier] = useState<VipTier>('bronze')

  const vip = getVipInfo(handsPlayed)

  const checkLevelUp = useCallback((newHandsPlayed: number) => {
    const newTier = getVipTier(newHandsPlayed)
    setPrevTier(prev => {
      if (newTier !== prev) {
        const prevIdx = VIP_ORDER.indexOf(prev)
        const newIdx = VIP_ORDER.indexOf(newTier)
        if (newIdx > prevIdx) {
          setJustLeveledUp(true)
          setTimeout(() => setJustLeveledUp(false), 3000)
        }
      }
      return newTier
    })
  }, [])

  const recordResult = useCallback((result: GameResult, currentHandsPlayed: number) => {
    const isWin = result === 'playerWin' || result === 'playerBlackjack' || result === 'dealerBust'

    if (isWin) {
      setStreak(prev => {
        const newStreak = prev + 1
        setBestStreak(best => Math.max(best, newStreak))
        return newStreak
      })
    } else if (result !== 'push') {
      setStreak(0)
    }

    checkLevelUp(currentHandsPlayed)
  }, [checkLevelUp])

  const saveToLeaderboard = useCallback(() => {
    const entry: LeaderboardEntry = {
      chips,
      handsPlayed,
      tier: vip.tier,
      streak: bestStreak,
      date: new Date().toISOString().slice(0, 10),
    }

    const updated = [...leaderboard, entry]
      .sort((a, b) => b.chips - a.chips)
      .slice(0, MAX_ENTRIES)

    setLeaderboard(updated)
    saveLeaderboard(updated)
  }, [chips, handsPlayed, vip.tier, bestStreak, leaderboard])

  const toggleLeaderboard = useCallback(() => {
    setShowLeaderboard(prev => !prev)
  }, [])

  const streakMultiplier = streak >= 5 ? 1.5 : streak >= 3 ? 1.2 : 1.0

  return {
    streak,
    bestStreak,
    streakMultiplier,
    vip,
    leaderboard,
    justLeveledUp,
    showLeaderboard,
    recordResult,
    saveToLeaderboard,
    toggleLeaderboard,
  }
}
