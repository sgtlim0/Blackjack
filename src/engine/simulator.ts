import type { Card, SimulationResult } from '../types/index.ts'
import { SIMULATION_TRIALS } from '../types/index.ts'
import { createShuffledDeck, drawCard } from './deck.ts'
import { calculateFullScore } from './scoring.ts'
import { shouldDealerHit } from './rules.ts'

function simulateDealerPlay(
  dealerHand: readonly Card[],
  deck: readonly Card[]
): { readonly score: number; readonly isBust: boolean } {
  let currentHand = dealerHand.map(c => ({ ...c, faceUp: true }))
  let currentDeck = [...deck]

  while (shouldDealerHit(currentHand)) {
    if (currentDeck.length === 0) {
      currentDeck = [...createShuffledDeck()]
    }
    const { card, remainingDeck } = drawCard(currentDeck, true)
    currentHand = [...currentHand, card]
    currentDeck = [...remainingDeck]
  }

  const state = calculateFullScore(currentHand)
  return { score: state.score, isBust: state.isBust }
}

function buildSimDeck(
  originalDeck: readonly Card[],
  excludeCards: readonly Card[]
): Card[] {
  const excluded = new Set(excludeCards.map(c => `${c.suit}-${c.rank}`))
  const filtered = originalDeck.filter(c => !excluded.has(`${c.suit}-${c.rank}`))

  if (filtered.length < 10) {
    const fresh = createShuffledDeck()
    return [...fresh].filter(c => !excluded.has(`${c.suit}-${c.rank}`))
  }

  // Shuffle for randomness
  const shuffled = [...filtered]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function simulateHit(
  playerHand: readonly Card[],
  dealerHand: readonly Card[],
  deck: readonly Card[],
  trials: number = SIMULATION_TRIALS
): SimulationResult {
  let wins = 0, losses = 0, pushes = 0, busts = 0
  const knownCards = [...playerHand, ...dealerHand.filter(c => c.faceUp)]

  for (let i = 0; i < trials; i++) {
    const simDeck = buildSimDeck(deck, knownCards)
    if (simDeck.length === 0) continue

    // Draw one card for player
    const { card: newCard, remainingDeck } = drawCard(simDeck, true)
    const newPlayerHand = [...playerHand, newCard]
    const playerState = calculateFullScore(newPlayerHand)

    if (playerState.isBust) {
      busts++
      losses++
      continue
    }

    // Simulate dealer
    const dealerResult = simulateDealerPlay(dealerHand, remainingDeck)

    if (dealerResult.isBust) {
      wins++
    } else if (playerState.score > dealerResult.score) {
      wins++
    } else if (playerState.score < dealerResult.score) {
      losses++
    } else {
      pushes++
    }
  }

  return {
    action: 'hit',
    winRate: wins / trials,
    loseRate: losses / trials,
    pushRate: pushes / trials,
    bustRate: busts / trials,
    trials,
  }
}

export function simulateStand(
  playerHand: readonly Card[],
  dealerHand: readonly Card[],
  deck: readonly Card[],
  trials: number = SIMULATION_TRIALS
): SimulationResult {
  let wins = 0, losses = 0, pushes = 0
  const knownCards = [...playerHand, ...dealerHand.filter(c => c.faceUp)]
  const playerState = calculateFullScore(playerHand)

  for (let i = 0; i < trials; i++) {
    const simDeck = buildSimDeck(deck, knownCards)
    const dealerResult = simulateDealerPlay(dealerHand, simDeck)

    if (dealerResult.isBust) {
      wins++
    } else if (playerState.score > dealerResult.score) {
      wins++
    } else if (playerState.score < dealerResult.score) {
      losses++
    } else {
      pushes++
    }
  }

  return {
    action: 'stand',
    winRate: wins / trials,
    loseRate: losses / trials,
    pushRate: pushes / trials,
    bustRate: 0,
    trials,
  }
}

export function simulateDouble(
  playerHand: readonly Card[],
  dealerHand: readonly Card[],
  deck: readonly Card[],
  trials: number = SIMULATION_TRIALS
): SimulationResult {
  // Double = draw exactly one card, then stand
  let wins = 0, losses = 0, pushes = 0, busts = 0
  const knownCards = [...playerHand, ...dealerHand.filter(c => c.faceUp)]

  for (let i = 0; i < trials; i++) {
    const simDeck = buildSimDeck(deck, knownCards)
    if (simDeck.length === 0) continue

    const { card: newCard, remainingDeck } = drawCard(simDeck, true)
    const newPlayerHand = [...playerHand, newCard]
    const playerState = calculateFullScore(newPlayerHand)

    if (playerState.isBust) {
      busts++
      losses++
      continue
    }

    const dealerResult = simulateDealerPlay(dealerHand, remainingDeck)

    if (dealerResult.isBust) {
      wins++
    } else if (playerState.score > dealerResult.score) {
      wins++
    } else if (playerState.score < dealerResult.score) {
      losses++
    } else {
      pushes++
    }
  }

  return {
    action: 'double',
    winRate: wins / trials,
    loseRate: losses / trials,
    pushRate: pushes / trials,
    bustRate: busts / trials,
    trials,
  }
}
