import { useBlackjack } from './hooks/useBlackjack.ts'
import Table from './components/Table/Table.tsx'
import Hand from './components/Hand/Hand.tsx'
import Controls from './components/Controls/Controls.tsx'
import BettingPanel from './components/BettingPanel/BettingPanel.tsx'
import ChipDisplay from './components/ChipDisplay/ChipDisplay.tsx'
import GameResultBanner from './components/GameResult/GameResult.tsx'
import StrategyAdvisor from './components/StrategyAdvisor/StrategyAdvisor.tsx'
import DealerPersona from './components/DealerPersona/DealerPersona.tsx'
import styles from './App.module.css'

export default function App() {
  const {
    state,
    playerHandState,
    dealerHandState,
    payout,
    canDouble,
    strategyAdvice,
    dealerComment,
    setBet,
    deal,
    hit,
    stand,
    doubleDown,
    nextHand,
    toggleAdvisor,
  } = useBlackjack()

  const isBetting = state.phase === 'betting'
  const isPlayerTurn = state.phase === 'playerTurn'
  const isResult = state.phase === 'result'

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.title}>Neon Blackjack</span>
        <ChipDisplay amount={state.playerChips} />
      </header>

      <div className={styles.tableWrapper}>
        <Table
          betDisplay={isBetting ? 0 : state.currentBet}
          dealerArea={
            <div className={styles.dealerSection}>
              <Hand
                cards={state.dealerHand}
                handState={dealerHandState}
                label="Dealer"
                isActive={state.phase === 'dealerTurn'}
                hideScore={state.dealerHand.length === 0}
              />
              {dealerComment && (
                <div className={styles.commentWrapper}>
                  <DealerPersona comment={dealerComment} />
                </div>
              )}
            </div>
          }
          playerArea={
            <Hand
              cards={state.playerHand}
              handState={playerHandState}
              label="Player"
              isActive={isPlayerTurn}
              hideScore={state.playerHand.length === 0}
            />
          }
        >
          {isResult && state.result && (
            <GameResultBanner result={state.result} payout={payout} bet={state.currentBet} />
          )}
        </Table>
      </div>

      {isPlayerTurn && (
        <>
          <Controls
            onHit={hit}
            onStand={stand}
            onDouble={doubleDown}
            canDouble={canDouble}
            disabled={false}
          />
          <StrategyAdvisor
            advice={strategyAdvice}
            visible={state.showAdvisor}
            onToggle={toggleAdvisor}
          />
        </>
      )}

      {(isBetting || isResult) && (
        <BettingPanel
          chips={state.playerChips}
          currentBet={state.currentBet}
          onBetChange={setBet}
          onDeal={deal}
          stats={state.stats}
          isResult={isResult}
          onNextHand={nextHand}
        />
      )}

      {state.phase === 'dealerTurn' && (
        <div className={styles.dealerTurnBar}>
          Dealer's turn...
        </div>
      )}
    </div>
  )
}
