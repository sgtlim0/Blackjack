import type { Card, HandState } from '../types/index.ts'

function cardValue(rank: Card['rank']): number {
  if (rank === 'A') return 11
  if (rank === 'K' || rank === 'Q' || rank === 'J') return 10
  return parseInt(rank, 10)
}

function computeScore(cards: readonly Card[]): { score: number; isSoft: boolean } {
  let total = 0
  let aces = 0

  for (const card of cards) {
    const val = cardValue(card.rank)
    total += val
    if (card.rank === 'A') aces++
  }

  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }

  return { score: total, isSoft: aces > 0 }
}

export function calculateHandState(cards: readonly Card[]): HandState {
  const visibleCards = cards.filter(c => c.faceUp)
  const { score, isSoft } = computeScore(visibleCards)

  return {
    score,
    softScore: score,
    isSoft,
    isBust: score > 21,
    isBlackjack: visibleCards.length === 2 && score === 21,
    cardCount: visibleCards.length,
  }
}

export function calculateFullScore(cards: readonly Card[]): HandState {
  const allCards = cards.map(c => ({ ...c, faceUp: true }))
  const { score, isSoft } = computeScore(allCards)

  return {
    score,
    softScore: score,
    isSoft,
    isBust: score > 21,
    isBlackjack: allCards.length === 2 && score === 21,
    cardCount: allCards.length,
  }
}
