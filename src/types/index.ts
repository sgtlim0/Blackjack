export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  readonly suit: Suit
  readonly rank: Rank
  readonly faceUp: boolean
}

export interface HandState {
  readonly score: number
  readonly softScore: number
  readonly isSoft: boolean
  readonly isBust: boolean
  readonly isBlackjack: boolean
  readonly cardCount: number
}

export type GamePhase =
  | 'betting'
  | 'dealing'
  | 'playerTurn'
  | 'dealerTurn'
  | 'result'

export type GameResult =
  | 'playerBlackjack'
  | 'dealerBlackjack'
  | 'playerWin'
  | 'dealerWin'
  | 'push'
  | 'playerBust'
  | 'dealerBust'

export type PlayerAction = 'hit' | 'stand' | 'double'

export interface SimulationResult {
  readonly action: PlayerAction
  readonly winRate: number
  readonly loseRate: number
  readonly pushRate: number
  readonly bustRate: number
  readonly trials: number
}

export interface StrategyAdvice {
  readonly recommended: PlayerAction
  readonly hitResult: SimulationResult
  readonly standResult: SimulationResult
  readonly doubleResult: SimulationResult | null
  readonly trueCount: number
  readonly deckAdvantage: 'player' | 'neutral' | 'dealer'
}

export type AiDifficulty = 'easy' | 'pro' | 'casino'

export interface DealerComment {
  readonly text: string
  readonly mood: 'neutral' | 'impressed' | 'warning' | 'taunt'
}

export interface GameStats {
  readonly wins: number
  readonly losses: number
  readonly pushes: number
  readonly blackjacks: number
  readonly handsPlayed: number
}

export interface GameState {
  readonly phase: GamePhase
  readonly deck: readonly Card[]
  readonly playerHand: readonly Card[]
  readonly dealerHand: readonly Card[]
  readonly playerChips: number
  readonly currentBet: number
  readonly result: GameResult | null
  readonly stats: GameStats
  readonly showAdvisor: boolean
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
}

export const SUIT_COLORS: Record<Suit, string> = {
  hearts: '#E74C3C',
  diamonds: '#E74C3C',
  clubs: '#1A1A2E',
  spades: '#1A1A2E',
}

export const ALL_RANKS: readonly Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
export const ALL_SUITS: readonly Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']

export const INITIAL_CHIPS = 10000
export const MIN_BET = 100
export const MAX_BET_RATIO = 0.5
export const BET_STEP = 100
export const DEALER_DELAY_MS = 600
export const SIMULATION_TRIALS = 3000
