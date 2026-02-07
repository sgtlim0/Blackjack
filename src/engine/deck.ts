import type { Card, Suit, Rank } from '../types/index.ts'
import { ALL_RANKS, ALL_SUITS } from '../types/index.ts'

function createDeck(): readonly Card[] {
  const cards: Card[] = []
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      cards.push({ suit: suit as Suit, rank: rank as Rank, faceUp: true })
    }
  }
  return cards
}

export function createShuffledDeck(): readonly Card[] {
  const cards = [...createDeck()]
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

export function drawCard(
  deck: readonly Card[],
  faceUp: boolean = true
): { readonly card: Card; readonly remainingDeck: readonly Card[] } {
  if (deck.length === 0) {
    const newDeck = createShuffledDeck()
    return {
      card: { ...newDeck[0], faceUp },
      remainingDeck: newDeck.slice(1),
    }
  }
  return {
    card: { ...deck[0], faceUp },
    remainingDeck: deck.slice(1),
  }
}
