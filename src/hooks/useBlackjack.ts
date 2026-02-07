import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { Card, GameState, GameResult, StrategyAdvice, DealerComment } from '../types/index.ts'
import { INITIAL_CHIPS, MIN_BET, DEALER_DELAY_MS } from '../types/index.ts'
import { createShuffledDeck, drawCard } from '../engine/deck.ts'
import { calculateHandState, calculateFullScore } from '../engine/scoring.ts'
import { shouldDealerHit, canDoubleDown, determineResult, calculatePayout } from '../engine/rules.ts'
import { getStrategyAdvice, getDealerComment } from '../engine/strategy.ts'

const INITIAL_STATE: GameState = {
  phase: 'betting',
  deck: createShuffledDeck(),
  playerHand: [],
  dealerHand: [],
  playerChips: INITIAL_CHIPS,
  currentBet: MIN_BET,
  result: null,
  stats: { wins: 0, losses: 0, pushes: 0, blackjacks: 0, handsPlayed: 0 },
  showAdvisor: false,
}

function updateStats(stats: GameState['stats'], result: GameResult): GameState['stats'] {
  switch (result) {
    case 'playerBlackjack':
      return { ...stats, wins: stats.wins + 1, blackjacks: stats.blackjacks + 1, handsPlayed: stats.handsPlayed + 1 }
    case 'playerWin':
    case 'dealerBust':
      return { ...stats, wins: stats.wins + 1, handsPlayed: stats.handsPlayed + 1 }
    case 'push':
      return { ...stats, pushes: stats.pushes + 1, handsPlayed: stats.handsPlayed + 1 }
    case 'dealerWin':
    case 'dealerBlackjack':
    case 'playerBust':
      return { ...stats, losses: stats.losses + 1, handsPlayed: stats.handsPlayed + 1 }
  }
}

export function useBlackjack() {
  const [state, setState] = useState<GameState>(INITIAL_STATE)
  const [dealerComment, setDealerComment] = useState<DealerComment | null>(null)
  const dealerTimers = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    dealerTimers.current.forEach(id => clearTimeout(id))
    dealerTimers.current = []
  }, [])

  const runDealerTurn = useCallback((bet: number) => {
    clearTimers()

    const dealerLoop = (step: number) => {
      const timerId = window.setTimeout(() => {
        setState(prev => {
          if (prev.phase !== 'dealerTurn') return prev

          // First step: reveal hole card
          if (step === 0) {
            const revealedHand = prev.dealerHand.map(c => ({ ...c, faceUp: true }))
            const fullScore = calculateFullScore(revealedHand)

            if (!shouldDealerHit(revealedHand) || fullScore.isBlackjack) {
              const result = determineResult(prev.playerHand, revealedHand)
              const payout = calculatePayout(result, bet)
              setDealerComment(getDealerComment('result', result))
              return {
                ...prev,
                dealerHand: revealedHand,
                phase: 'result',
                result,
                playerChips: prev.playerChips + payout,
                stats: updateStats(prev.stats, result),
              }
            }

            dealerLoop(step + 1)
            return { ...prev, dealerHand: revealedHand }
          }

          // Subsequent steps: draw cards
          const { card, remainingDeck } = drawCard(prev.deck, true)
          const newHand = [...prev.dealerHand, card]
          const handState = calculateFullScore(newHand)

          if (handState.isBust || !shouldDealerHit(newHand)) {
            const result = determineResult(prev.playerHand, newHand)
            const payout = calculatePayout(result, bet)
            setDealerComment(getDealerComment('result', result))
            return {
              ...prev,
              deck: remainingDeck,
              dealerHand: newHand,
              phase: 'result',
              result,
              playerChips: prev.playerChips + payout,
              stats: updateStats(prev.stats, result),
            }
          }

          dealerLoop(step + 1)
          return { ...prev, deck: remainingDeck, dealerHand: newHand }
        })
      }, DEALER_DELAY_MS)

      dealerTimers.current.push(timerId)
    }

    dealerLoop(0)
  }, [clearTimers])

  const setBet = useCallback((bet: number) => {
    setState(prev => prev.phase === 'betting' ? { ...prev, currentBet: bet } : prev)
  }, [])

  const deal = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'betting') return prev

      let deck = prev.deck.length < 20 ? createShuffledDeck() : [...prev.deck]
      const playerHand = []
      const dealerHand = []

      let draw: { readonly card: Card; readonly remainingDeck: readonly Card[] }

      draw = drawCard(deck, true)
      playerHand.push(draw.card)
      deck = [...draw.remainingDeck]

      draw = drawCard(deck, true)
      dealerHand.push(draw.card)
      deck = [...draw.remainingDeck]

      draw = drawCard(deck, true)
      playerHand.push(draw.card)
      deck = [...draw.remainingDeck]

      draw = drawCard(deck, false)
      dealerHand.push(draw.card)
      deck = [...draw.remainingDeck]

      const playerScore = calculateFullScore(playerHand)
      const dealerVisible = calculateHandState(dealerHand)

      if (playerScore.isBlackjack) {
        if (dealerVisible.score === 10 || dealerVisible.score === 11) {
          const revealedDealer = dealerHand.map(c => ({ ...c, faceUp: true }))
          const dealerScore = calculateFullScore(revealedDealer)
          const result = dealerScore.isBlackjack ? 'push' as const : 'playerBlackjack' as const
          const payout = calculatePayout(result, prev.currentBet)
          setDealerComment(getDealerComment('result', result))
          return {
            ...prev,
            phase: 'result',
            deck,
            playerHand,
            dealerHand: revealedDealer,
            playerChips: prev.playerChips - prev.currentBet + payout,
            result,
            stats: updateStats(prev.stats, result),
          }
        }
        const payout = calculatePayout('playerBlackjack', prev.currentBet)
        setDealerComment(getDealerComment('result', 'playerBlackjack'))
        return {
          ...prev,
          phase: 'result',
          deck,
          playerHand,
          dealerHand: dealerHand.map(c => ({ ...c, faceUp: true })),
          playerChips: prev.playerChips - prev.currentBet + payout,
          result: 'playerBlackjack',
          stats: updateStats(prev.stats, 'playerBlackjack'),
        }
      }

      setDealerComment(getDealerComment('deal'))
      return {
        ...prev,
        phase: 'playerTurn',
        deck,
        playerHand,
        dealerHand,
        playerChips: prev.playerChips - prev.currentBet,
        result: null,
      }
    })
  }, [])

  const hit = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playerTurn') return prev

      const { card, remainingDeck } = drawCard(prev.deck, true)
      const newHand = [...prev.playerHand, card]
      const handState = calculateFullScore(newHand)

      if (handState.isBust) {
        const result: GameResult = 'playerBust'
        const payout = calculatePayout(result, prev.currentBet)
        setDealerComment(getDealerComment('result', result))
        return {
          ...prev,
          deck: remainingDeck,
          playerHand: newHand,
          dealerHand: prev.dealerHand.map(c => ({ ...c, faceUp: true })),
          phase: 'result',
          result,
          playerChips: prev.playerChips + payout,
          stats: updateStats(prev.stats, result),
        }
      }

      setDealerComment(getDealerComment('hit', undefined, handState.score))

      if (handState.score === 21) {
        return {
          ...prev,
          deck: remainingDeck,
          playerHand: newHand,
          phase: 'dealerTurn',
        }
      }

      return { ...prev, deck: remainingDeck, playerHand: newHand }
    })
  }, [])

  const stand = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playerTurn') return prev
      const playerState = calculateFullScore(prev.playerHand)
      setDealerComment(getDealerComment('stand', undefined, playerState.score))
      return { ...prev, phase: 'dealerTurn' }
    })
  }, [])

  const doubleDown = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playerTurn') return prev
      if (!canDoubleDown(prev.playerHand, prev.playerChips, prev.currentBet)) return prev

      const { card, remainingDeck } = drawCard(prev.deck, true)
      const newHand = [...prev.playerHand, card]
      const newBet = prev.currentBet * 2
      const handState = calculateFullScore(newHand)

      if (handState.isBust) {
        const result: GameResult = 'playerBust'
        const payout = calculatePayout(result, newBet)
        setDealerComment(getDealerComment('result', result))
        return {
          ...prev,
          deck: remainingDeck,
          playerHand: newHand,
          dealerHand: prev.dealerHand.map(c => ({ ...c, faceUp: true })),
          currentBet: newBet,
          playerChips: prev.playerChips - prev.currentBet + payout,
          phase: 'result',
          result,
          stats: updateStats(prev.stats, result),
        }
      }

      return {
        ...prev,
        deck: remainingDeck,
        playerHand: newHand,
        currentBet: newBet,
        playerChips: prev.playerChips - prev.currentBet,
        phase: 'dealerTurn',
      }
    })
  }, [])

  const nextHand = useCallback(() => {
    clearTimers()
    setDealerComment(null)
    setState(prev => ({
      ...prev,
      phase: 'betting',
      playerHand: [],
      dealerHand: [],
      result: null,
      currentBet: Math.min(prev.currentBet, Math.floor(prev.playerChips * 0.5 / 100) * 100) || MIN_BET,
    }))
  }, [clearTimers])

  const toggleAdvisor = useCallback(() => {
    setState(prev => ({ ...prev, showAdvisor: !prev.showAdvisor }))
  }, [])

  // Trigger dealer turn when phase changes to dealerTurn
  const { phase, currentBet } = state
  useEffect(() => {
    if (phase === 'dealerTurn') {
      runDealerTurn(currentBet)
    }
    return () => { clearTimers() }
  }, [phase, currentBet, runDealerTurn, clearTimers])

  const playerHandState = calculateHandState(state.playerHand)
  const dealerHandState = state.phase === 'result'
    ? calculateFullScore(state.dealerHand)
    : calculateHandState(state.dealerHand)

  const payout = state.result ? calculatePayout(state.result, state.currentBet) : 0

  // Compute strategy advice during player turn
  const strategyAdvice: StrategyAdvice | null = useMemo(() => {
    if (state.phase !== 'playerTurn' || !state.showAdvisor) return null
    return getStrategyAdvice(
      state.playerHand,
      state.dealerHand,
      state.deck,
      state.playerChips,
      state.currentBet
    )
  }, [state.phase, state.showAdvisor, state.playerHand, state.dealerHand, state.deck, state.playerChips, state.currentBet])

  return {
    state,
    playerHandState,
    dealerHandState,
    payout,
    canDouble: state.phase === 'playerTurn' && canDoubleDown(state.playerHand, state.playerChips, state.currentBet),
    strategyAdvice,
    dealerComment,
    setBet,
    deal,
    hit,
    stand,
    doubleDown,
    nextHand,
    toggleAdvisor,
  }
}
