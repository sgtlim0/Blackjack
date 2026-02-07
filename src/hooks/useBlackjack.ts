import { useState, useCallback, useEffect, useRef } from 'react'
import type { GameState, GameResult } from '../types/index.ts'
import { INITIAL_CHIPS, MIN_BET, DEALER_DELAY_MS } from '../types/index.ts'
import { createShuffledDeck, drawCard } from '../engine/deck.ts'
import { calculateHandState, calculateFullScore } from '../engine/scoring.ts'
import { shouldDealerHit, canDoubleDown, determineResult, calculatePayout } from '../engine/rules.ts'

const INITIAL_STATE: GameState = {
  phase: 'betting',
  deck: createShuffledDeck(),
  playerHand: [],
  dealerHand: [],
  playerChips: INITIAL_CHIPS,
  currentBet: MIN_BET,
  result: null,
  stats: { wins: 0, losses: 0, pushes: 0, blackjacks: 0, handsPlayed: 0 },
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

      // Deal: player, dealer, player, dealer(face down)
      let draw = drawCard(deck, true)
      playerHand.push(draw.card)
      deck = [...draw.remainingDeck]

      draw = drawCard(deck, true)
      dealerHand.push(draw.card)
      deck = [...draw.remainingDeck]

      draw = drawCard(deck, true)
      playerHand.push(draw.card)
      deck = [...draw.remainingDeck]

      draw = drawCard(deck, false) // dealer hole card face down
      dealerHand.push(draw.card)
      deck = [...draw.remainingDeck]

      const playerScore = calculateFullScore(playerHand)
      const dealerVisible = calculateHandState(dealerHand)

      // Check for immediate blackjacks
      if (playerScore.isBlackjack) {
        if (dealerVisible.score === 10 || dealerVisible.score === 11) {
          // Dealer might also have blackjack, need to reveal
          const revealedDealer = dealerHand.map(c => ({ ...c, faceUp: true }))
          const dealerScore = calculateFullScore(revealedDealer)
          const result = dealerScore.isBlackjack ? 'push' as const : 'playerBlackjack' as const
          const payout = calculatePayout(result, prev.currentBet)
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
        // Player blackjack, dealer can't have one
        const payout = calculatePayout('playerBlackjack', prev.currentBet)
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

      if (handState.score === 21) {
        // Auto-stand on 21
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

  // After state changes to dealerTurn from hit/stand, trigger dealer logic
  const stand = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playerTurn') return prev
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
        playerChips: prev.playerChips - prev.currentBet, // deduct the extra bet
        phase: 'dealerTurn',
      }
    })
  }, [])

  const nextHand = useCallback(() => {
    clearTimers()
    setState(prev => ({
      ...prev,
      phase: 'betting',
      playerHand: [],
      dealerHand: [],
      result: null,
      currentBet: Math.min(prev.currentBet, Math.floor(prev.playerChips * 0.5 / 100) * 100) || MIN_BET,
    }))
  }, [clearTimers])

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

  return {
    state,
    playerHandState,
    dealerHandState,
    payout,
    canDouble: state.phase === 'playerTurn' && canDoubleDown(state.playerHand, state.playerChips, state.currentBet),
    setBet,
    deal,
    hit,
    stand,
    doubleDown,
    nextHand,
  }
}
