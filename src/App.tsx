import { useState, useCallback } from 'react'
import { useBlackjack } from './hooks/useBlackjack.ts'
import { useSoundEffects } from './hooks/useSoundEffects.ts'
import { useSimulationLab } from './hooks/useSimulationLab.ts'
import Table from './components/Table/Table.tsx'
import Hand from './components/Hand/Hand.tsx'
import Controls from './components/Controls/Controls.tsx'
import BettingPanel from './components/BettingPanel/BettingPanel.tsx'
import ChipDisplay from './components/ChipDisplay/ChipDisplay.tsx'
import GameResultBanner from './components/GameResult/GameResult.tsx'
import StrategyAdvisor from './components/StrategyAdvisor/StrategyAdvisor.tsx'
import DealerPersona from './components/DealerPersona/DealerPersona.tsx'
import SimulationLab from './components/SimulationLab/SimulationLab.tsx'
import styles from './App.module.css'

type AppMode = 'play' | 'lab'

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('play')

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

  const {
    labState,
    setHandCount,
    toggleDifficulty,
    runSimulation,
    cancel: cancelLab,
    reset: resetLab,
  } = useSimulationLab()

  const { muted, toggleMute, playChipClick, playChipTick, playButtonPress, playButtonRelease, playStand: playSfxStand, playDouble: playSfxDouble, hapticLight } = useSoundEffects({
    phase: state.phase,
    result: state.result,
    playerCardCount: state.playerHand.length,
    dealerCardCount: state.dealerHand.length,
  })

  const isBetting = state.phase === 'betting'
  const isPlayerTurn = state.phase === 'playerTurn'
  const isResult = state.phase === 'result'

  const handleHit = useCallback(() => {
    playButtonPress()
    hapticLight()
    hit()
    setTimeout(playButtonRelease, 80)
  }, [hit, playButtonPress, playButtonRelease, hapticLight])

  const handleStand = useCallback(() => {
    playSfxStand()
    hapticLight()
    stand()
  }, [stand, playSfxStand, hapticLight])

  const handleDouble = useCallback(() => {
    playSfxDouble()
    hapticLight()
    doubleDown()
  }, [doubleDown, playSfxDouble, hapticLight])

  const handleDeal = useCallback(() => {
    playButtonPress()
    hapticLight()
    deal()
    setTimeout(playButtonRelease, 80)
  }, [deal, playButtonPress, playButtonRelease, hapticLight])

  const handleNextHand = useCallback(() => {
    playButtonPress()
    hapticLight()
    nextHand()
    setTimeout(playButtonRelease, 80)
  }, [nextHand, playButtonPress, playButtonRelease, hapticLight])

  const handleBetChange = useCallback((bet: number) => {
    playChipTick()
    setBet(bet)
  }, [setBet, playChipTick])

  const handleQuickBet = useCallback((bet: number) => {
    playChipClick()
    hapticLight()
    setBet(bet)
  }, [setBet, playChipClick, hapticLight])

  if (appMode === 'lab') {
    return (
      <SimulationLab
        labState={labState}
        onSetHandCount={setHandCount}
        onToggleDifficulty={toggleDifficulty}
        onRun={runSimulation}
        onCancel={cancelLab}
        onReset={resetLab}
        onBack={() => setAppMode('play')}
      />
    )
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.title}>Neon Blackjack</span>
        <div className={styles.headerRight}>
          <button
            className={styles.labButton}
            onClick={() => setAppMode('lab')}
          >
            AI Lab
          </button>
          <button className={styles.muteButton} onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
          </button>
          <ChipDisplay amount={state.playerChips} />
        </div>
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
            onHit={handleHit}
            onStand={handleStand}
            onDouble={handleDouble}
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
          onBetChange={handleBetChange}
          onQuickBet={handleQuickBet}
          onDeal={handleDeal}
          stats={state.stats}
          isResult={isResult}
          onNextHand={handleNextHand}
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
