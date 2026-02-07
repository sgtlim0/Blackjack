import type { Card, PlayerAction, StrategyAdvice, DealerComment, GameResult } from '../types/index.ts'
import { calculateFullScore, calculateHandState } from './scoring.ts'
import { canDoubleDown } from './rules.ts'
import { simulateHit, simulateStand, simulateDouble } from './simulator.ts'

// Hi-Lo card counting values
function hiLoValue(rank: Card['rank']): number {
  if (['2', '3', '4', '5', '6'].includes(rank)) return 1
  if (['10', 'J', 'Q', 'K', 'A'].includes(rank)) return -1
  return 0
}

export function calculateRunningCount(
  dealtCards: readonly Card[]
): number {
  return dealtCards.reduce((count, card) => count + hiLoValue(card.rank), 0)
}

export function calculateTrueCount(
  runningCount: number,
  remainingDecks: number
): number {
  if (remainingDecks <= 0) return 0
  return Math.round((runningCount / remainingDecks) * 10) / 10
}

export function getDeckAdvantage(
  trueCount: number
): 'player' | 'neutral' | 'dealer' {
  if (trueCount >= 2) return 'player'
  if (trueCount <= -2) return 'dealer'
  return 'neutral'
}

// Basic Strategy lookup (simplified)
function getBasicStrategy(
  playerScore: number,
  isSoft: boolean,
  dealerUpcard: number,
  canDouble: boolean
): PlayerAction {
  if (isSoft) {
    if (playerScore >= 19) return 'stand'
    if (playerScore === 18) {
      if (dealerUpcard >= 9) return 'hit'
      if (dealerUpcard >= 3 && dealerUpcard <= 6 && canDouble) return 'double'
      return 'stand'
    }
    if (playerScore === 17) {
      if (dealerUpcard >= 3 && dealerUpcard <= 6 && canDouble) return 'double'
      return 'hit'
    }
    if (playerScore >= 15 && playerScore <= 16) {
      if (dealerUpcard >= 4 && dealerUpcard <= 6 && canDouble) return 'double'
      return 'hit'
    }
    if (playerScore >= 13 && playerScore <= 14) {
      if (dealerUpcard >= 5 && dealerUpcard <= 6 && canDouble) return 'double'
      return 'hit'
    }
    return 'hit'
  }

  // Hard hands
  if (playerScore >= 17) return 'stand'
  if (playerScore >= 13 && playerScore <= 16) {
    return dealerUpcard >= 7 ? 'hit' : 'stand'
  }
  if (playerScore === 12) {
    return (dealerUpcard >= 4 && dealerUpcard <= 6) ? 'stand' : 'hit'
  }
  if (playerScore === 11) {
    return canDouble ? 'double' : 'hit'
  }
  if (playerScore === 10) {
    if (dealerUpcard <= 9 && canDouble) return 'double'
    return 'hit'
  }
  if (playerScore === 9) {
    if (dealerUpcard >= 3 && dealerUpcard <= 6 && canDouble) return 'double'
    return 'hit'
  }
  return 'hit'
}

export function getStrategyAdvice(
  playerHand: readonly Card[],
  dealerHand: readonly Card[],
  deck: readonly Card[],
  playerChips: number,
  currentBet: number
): StrategyAdvice {
  const allDealtCards = [
    ...playerHand,
    ...dealerHand.filter(c => c.faceUp),
  ]

  const remainingDecks = Math.max(deck.length / 52, 0.5)
  const runningCount = calculateRunningCount(allDealtCards)
  const trueCount = calculateTrueCount(runningCount, remainingDecks)
  const deckAdvantage = getDeckAdvantage(trueCount)

  const playerState = calculateFullScore(playerHand)
  const dealerVisible = calculateHandState(dealerHand)
  const canDbl = canDoubleDown(playerHand, playerChips, currentBet)

  // Run Monte Carlo simulations
  const hitResult = simulateHit(playerHand, dealerHand, deck)
  const standResult = simulateStand(playerHand, dealerHand, deck)
  const doubleResult = canDbl ? simulateDouble(playerHand, dealerHand, deck) : null

  // Determine recommendation from Basic Strategy first, then validate with simulation
  const basicRec = getBasicStrategy(
    playerState.score,
    playerState.isSoft,
    dealerVisible.score,
    canDbl
  )

  // Pick action with highest expected value from simulation
  let recommended: PlayerAction = basicRec
  const hitEV = hitResult.winRate - hitResult.loseRate
  const standEV = standResult.winRate - standResult.loseRate
  const doubleEV = doubleResult ? (doubleResult.winRate - doubleResult.loseRate) * 2 : -Infinity

  const maxEV = Math.max(hitEV, standEV, doubleEV)
  if (maxEV === doubleEV && canDbl) {
    recommended = 'double'
  } else if (maxEV === hitEV) {
    recommended = 'hit'
  } else {
    recommended = 'stand'
  }

  return {
    recommended,
    hitResult,
    standResult,
    doubleResult,
    trueCount,
    deckAdvantage,
  }
}

// Dealer persona comments
const DEAL_COMMENTS: DealerComment[] = [
  { text: 'Cards are out. Make your move.', mood: 'neutral' },
  { text: 'The table is set. Choose wisely.', mood: 'neutral' },
  { text: 'Let\'s see what you\'ve got.', mood: 'neutral' },
]

const BLACKJACK_COMMENTS: DealerComment[] = [
  { text: 'Perfect hand. Well played.', mood: 'impressed' },
  { text: 'Blackjack! Lady luck smiles.', mood: 'impressed' },
]

const BUST_COMMENTS: DealerComment[] = [
  { text: 'Too greedy. House wins.', mood: 'taunt' },
  { text: 'That was one card too many.', mood: 'taunt' },
]

const PLAYER_WIN_COMMENTS: DealerComment[] = [
  { text: 'Nice play. Take your chips.', mood: 'impressed' },
  { text: 'Smart decision. You read that well.', mood: 'impressed' },
]

const DEALER_WIN_COMMENTS: DealerComment[] = [
  { text: 'The house always has an edge.', mood: 'taunt' },
  { text: 'Better luck next hand.', mood: 'neutral' },
]

const PUSH_COMMENTS: DealerComment[] = [
  { text: 'Even match. Push.', mood: 'neutral' },
  { text: 'No winner this round.', mood: 'neutral' },
]

const RISKY_HIT_COMMENTS: DealerComment[] = [
  { text: 'That was a risky call.', mood: 'warning' },
  { text: 'Bold move. Let\'s see if it pays.', mood: 'warning' },
]

const GOOD_STAND_COMMENTS: DealerComment[] = [
  { text: 'Solid decision to hold.', mood: 'neutral' },
  { text: 'Standing firm. Interesting.', mood: 'neutral' },
]

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getDealerComment(
  event: 'deal' | 'hit' | 'stand' | 'result',
  result?: GameResult,
  playerScore?: number
): DealerComment {
  if (event === 'deal') return pickRandom(DEAL_COMMENTS)

  if (event === 'hit' && playerScore && playerScore >= 16) {
    return pickRandom(RISKY_HIT_COMMENTS)
  }

  if (event === 'stand' && playerScore && playerScore >= 17) {
    return pickRandom(GOOD_STAND_COMMENTS)
  }

  if (event === 'result' && result) {
    switch (result) {
      case 'playerBlackjack':
        return pickRandom(BLACKJACK_COMMENTS)
      case 'playerBust':
        return pickRandom(BUST_COMMENTS)
      case 'playerWin':
      case 'dealerBust':
        return pickRandom(PLAYER_WIN_COMMENTS)
      case 'dealerWin':
      case 'dealerBlackjack':
        return pickRandom(DEALER_WIN_COMMENTS)
      case 'push':
        return pickRandom(PUSH_COMMENTS)
    }
  }

  return { text: 'Your move.', mood: 'neutral' }
}
