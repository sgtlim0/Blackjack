import type { Card, AiDifficulty, PlayerAction } from '../types/index.ts'
import { createShuffledDeck, drawCard } from './deck.ts'
import { calculateFullScore, calculateHandState } from './scoring.ts'
import { shouldDealerHit, determineResult, calculatePayout, canDoubleDown } from './rules.ts'
import { calculateRunningCount, calculateTrueCount } from './strategy.ts'

function getBasicStrategyAction(
  playerScore: number,
  isSoft: boolean,
  dealerUpcard: number,
  canDbl: boolean
): PlayerAction {
  if (isSoft) {
    if (playerScore >= 19) return 'stand'
    if (playerScore === 18) {
      if (dealerUpcard >= 9) return 'hit'
      if (dealerUpcard >= 3 && dealerUpcard <= 6 && canDbl) return 'double'
      return 'stand'
    }
    if (playerScore === 17) {
      if (dealerUpcard >= 3 && dealerUpcard <= 6 && canDbl) return 'double'
      return 'hit'
    }
    if (playerScore >= 15 && playerScore <= 16) {
      if (dealerUpcard >= 4 && dealerUpcard <= 6 && canDbl) return 'double'
      return 'hit'
    }
    if (playerScore >= 13 && playerScore <= 14) {
      if (dealerUpcard >= 5 && dealerUpcard <= 6 && canDbl) return 'double'
      return 'hit'
    }
    return 'hit'
  }

  if (playerScore >= 17) return 'stand'
  if (playerScore >= 13 && playerScore <= 16) {
    return dealerUpcard >= 7 ? 'hit' : 'stand'
  }
  if (playerScore === 12) {
    return (dealerUpcard >= 4 && dealerUpcard <= 6) ? 'stand' : 'hit'
  }
  if (playerScore === 11) return canDbl ? 'double' : 'hit'
  if (playerScore === 10) {
    if (dealerUpcard <= 9 && canDbl) return 'double'
    return 'hit'
  }
  if (playerScore === 9) {
    if (dealerUpcard >= 3 && dealerUpcard <= 6 && canDbl) return 'double'
    return 'hit'
  }
  return 'hit'
}

function getRandomAction(canDbl: boolean): PlayerAction {
  const roll = Math.random()
  if (canDbl && roll < 0.1) return 'double'
  return roll < 0.5 ? 'hit' : 'stand'
}

function getCasinoAction(
  playerScore: number,
  isSoft: boolean,
  dealerUpcard: number,
  canDbl: boolean,
  trueCount: number
): PlayerAction {
  const base = getBasicStrategyAction(playerScore, isSoft, dealerUpcard, canDbl)

  // Deviations based on true count (Illustrious 18 simplified)
  if (!isSoft) {
    // Insurance / deviation plays based on count
    if (playerScore === 16 && dealerUpcard === 10) {
      return trueCount >= 0 ? 'stand' : 'hit'
    }
    if (playerScore === 15 && dealerUpcard === 10) {
      return trueCount >= 4 ? 'stand' : 'hit'
    }
    if (playerScore === 12 && dealerUpcard === 3) {
      return trueCount >= 2 ? 'stand' : 'hit'
    }
    if (playerScore === 12 && dealerUpcard === 2) {
      return trueCount >= 3 ? 'stand' : 'hit'
    }
    if (playerScore === 11 && canDbl) {
      return 'double'
    }
    if (playerScore === 10 && dealerUpcard === 10 && canDbl) {
      return trueCount >= 4 ? 'double' : 'hit'
    }
    if (playerScore === 10 && dealerUpcard === 11 && canDbl) {
      return trueCount >= 4 ? 'double' : 'hit'
    }
  }

  return base
}

export function getAiAction(
  difficulty: AiDifficulty,
  playerHand: readonly Card[],
  dealerHand: readonly Card[],
  dealtCards: readonly Card[],
  remainingDeckSize: number,
  playerChips: number,
  currentBet: number
): PlayerAction {
  const playerState = calculateFullScore(playerHand)
  const dealerVisible = calculateHandState(dealerHand)
  const canDbl = canDoubleDown(playerHand, playerChips, currentBet)

  switch (difficulty) {
    case 'easy':
      return getRandomAction(canDbl)

    case 'pro':
      return getBasicStrategyAction(
        playerState.score,
        playerState.isSoft,
        dealerVisible.score,
        canDbl
      )

    case 'casino': {
      const runningCount = calculateRunningCount(dealtCards)
      const remainingDecks = Math.max(remainingDeckSize / 52, 0.5)
      const trueCount = calculateTrueCount(runningCount, remainingDecks)

      return getCasinoAction(
        playerState.score,
        playerState.isSoft,
        dealerVisible.score,
        canDbl,
        trueCount
      )
    }
  }
}

export interface LabHandResult {
  readonly result: 'win' | 'lose' | 'push'
  readonly isBlackjack: boolean
  readonly playerScore: number
  readonly dealerScore: number
  readonly payout: number
}

export function simulateOneHand(
  difficulty: AiDifficulty,
  deckRef: { deck: Card[]; dealtCards: Card[] },
  bet: number,
  chips: number
): LabHandResult {
  // Reshuffle if low
  if (deckRef.deck.length < 20) {
    deckRef.deck = [...createShuffledDeck()]
    deckRef.dealtCards = []
  }

  const playerHand: Card[] = []
  const dealerHand: Card[] = []

  // Deal 4 cards
  let draw = drawCard(deckRef.deck, true)
  playerHand.push(draw.card)
  deckRef.deck = [...draw.remainingDeck]
  deckRef.dealtCards.push(draw.card)

  draw = drawCard(deckRef.deck, true)
  dealerHand.push(draw.card)
  deckRef.deck = [...draw.remainingDeck]
  deckRef.dealtCards.push(draw.card)

  draw = drawCard(deckRef.deck, true)
  playerHand.push(draw.card)
  deckRef.deck = [...draw.remainingDeck]
  deckRef.dealtCards.push(draw.card)

  draw = drawCard(deckRef.deck, false)
  dealerHand.push(draw.card)
  deckRef.deck = [...draw.remainingDeck]

  const playerInitial = calculateFullScore(playerHand)

  // Check immediate blackjack
  if (playerInitial.isBlackjack) {
    deckRef.dealtCards.push({ ...dealerHand[1], faceUp: true })
    const dealerFull = calculateFullScore(dealerHand.map(c => ({ ...c, faceUp: true })))
    if (dealerFull.isBlackjack) {
      return { result: 'push', isBlackjack: true, playerScore: 21, dealerScore: 21, payout: bet }
    }
    return { result: 'win', isBlackjack: true, playerScore: 21, dealerScore: dealerFull.score, payout: Math.floor(bet * 2.5) }
  }

  // Player turn
  let currentBet = bet
  let firstAction = true
  while (true) {
    const playerState = calculateFullScore(playerHand)
    if (playerState.isBust || playerState.score === 21) break

    const action = getAiAction(
      difficulty,
      playerHand,
      dealerHand,
      deckRef.dealtCards,
      deckRef.deck.length,
      chips,
      currentBet
    )

    if (action === 'stand') break

    if (action === 'double' && firstAction) {
      draw = drawCard(deckRef.deck, true)
      playerHand.push(draw.card)
      deckRef.deck = [...draw.remainingDeck]
      deckRef.dealtCards.push(draw.card)
      currentBet = bet * 2
      break
    }

    // Hit
    draw = drawCard(deckRef.deck, true)
    playerHand.push(draw.card)
    deckRef.deck = [...draw.remainingDeck]
    deckRef.dealtCards.push(draw.card)
    firstAction = false
  }

  const playerFinal = calculateFullScore(playerHand)

  if (playerFinal.isBust) {
    deckRef.dealtCards.push({ ...dealerHand[1], faceUp: true })
    return { result: 'lose', isBlackjack: false, playerScore: playerFinal.score, dealerScore: 0, payout: 0 }
  }

  // Dealer turn
  deckRef.dealtCards.push({ ...dealerHand[1], faceUp: true })
  const revealedDealer = dealerHand.map(c => ({ ...c, faceUp: true }))
  const currentDealer = [...revealedDealer]

  while (shouldDealerHit(currentDealer)) {
    draw = drawCard(deckRef.deck, true)
    currentDealer.push(draw.card)
    deckRef.deck = [...draw.remainingDeck]
    deckRef.dealtCards.push(draw.card)
  }

  const dealerFinal = calculateFullScore(currentDealer)
  const gameResult = determineResult(playerHand, currentDealer)
  const payout = calculatePayout(gameResult, currentBet)

  const resultCategory = (gameResult === 'playerWin' || gameResult === 'playerBlackjack' || gameResult === 'dealerBust')
    ? 'win' as const
    : gameResult === 'push'
      ? 'push' as const
      : 'lose' as const

  return {
    result: resultCategory,
    isBlackjack: false,
    playerScore: playerFinal.score,
    dealerScore: dealerFinal.score,
    payout,
  }
}

export interface LabStats {
  readonly difficulty: AiDifficulty
  readonly label: string
  readonly handsPlayed: number
  readonly wins: number
  readonly losses: number
  readonly pushes: number
  readonly blackjacks: number
  readonly totalBet: number
  readonly totalPayout: number
  readonly winRate: number
  readonly ev: number
  readonly peakChips: number
  readonly finalChips: number
}

export function runBatchSimulation(
  difficulty: AiDifficulty,
  totalHands: number,
  baseBet: number = 100,
  startingChips: number = 10000
): LabStats {
  const deckRef = { deck: [...createShuffledDeck()], dealtCards: [] as Card[] }
  let chips = startingChips
  let peakChips = startingChips
  let wins = 0, losses = 0, pushes = 0, blackjacks = 0
  let totalBet = 0, totalPayout = 0

  const labels: Record<AiDifficulty, string> = {
    easy: 'Random',
    pro: 'Basic Strategy',
    casino: 'Card Counting',
  }

  for (let i = 0; i < totalHands; i++) {
    const bet = Math.min(baseBet, chips)
    if (bet <= 0) break

    chips -= bet
    totalBet += bet

    const result = simulateOneHand(difficulty, deckRef, bet, chips)

    chips += result.payout
    totalPayout += result.payout
    peakChips = Math.max(peakChips, chips)

    if (result.isBlackjack && result.result === 'win') blackjacks++
    if (result.result === 'win') wins++
    else if (result.result === 'lose') losses++
    else pushes++
  }

  const handsPlayed = wins + losses + pushes
  return {
    difficulty,
    label: labels[difficulty],
    handsPlayed,
    wins,
    losses,
    pushes,
    blackjacks,
    totalBet,
    totalPayout,
    winRate: handsPlayed > 0 ? wins / handsPlayed : 0,
    ev: totalBet > 0 ? ((totalPayout - totalBet) / totalBet) * 100 : 0,
    peakChips,
    finalChips: chips,
  }
}
