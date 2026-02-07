import type { Card, GameResult } from '../types/index.ts'
import { calculateFullScore } from './scoring.ts'

export function shouldDealerHit(dealerHand: readonly Card[]): boolean {
  const { score } = calculateFullScore(dealerHand)
  return score < 17
}

export function canDoubleDown(playerHand: readonly Card[], playerChips: number, currentBet: number): boolean {
  return playerHand.length === 2 && playerChips >= currentBet
}

export function determineResult(
  playerHand: readonly Card[],
  dealerHand: readonly Card[]
): GameResult {
  const player = calculateFullScore(playerHand)
  const dealer = calculateFullScore(dealerHand)

  if (player.isBlackjack && dealer.isBlackjack) return 'push'
  if (player.isBlackjack) return 'playerBlackjack'
  if (dealer.isBlackjack) return 'dealerBlackjack'
  if (player.isBust) return 'playerBust'
  if (dealer.isBust) return 'dealerBust'
  if (player.score > dealer.score) return 'playerWin'
  if (dealer.score > player.score) return 'dealerWin'
  return 'push'
}

export function calculatePayout(result: GameResult, bet: number): number {
  switch (result) {
    case 'playerBlackjack':
      return Math.floor(bet * 2.5)
    case 'playerWin':
    case 'dealerBust':
      return bet * 2
    case 'push':
      return bet
    case 'dealerWin':
    case 'dealerBlackjack':
    case 'playerBust':
      return 0
  }
}
