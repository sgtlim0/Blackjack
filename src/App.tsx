import { useState, useCallback, useEffect, useRef } from 'react'
import { useBlackjack } from './hooks/useBlackjack.ts'
import { useSoundEffects } from './hooks/useSoundEffects.ts'
import { useSimulationLab } from './hooks/useSimulationLab.ts'
import { useProgression } from './hooks/useProgression.ts'
import { startAmbient, stopAmbient, isAmbientPlaying } from './engine/ambient.ts'
import { playLevelUp, playStreakUp } from './engine/sound.ts'
import Table from './components/Table/Table.tsx'
import Hand from './components/Hand/Hand.tsx'
import Controls from './components/Controls/Controls.tsx'
import BettingPanel from './components/BettingPanel/BettingPanel.tsx'
import ChipDisplay from './components/ChipDisplay/ChipDisplay.tsx'
import GameResultBanner from './components/GameResult/GameResult.tsx'
import StrategyAdvisor from './components/StrategyAdvisor/StrategyAdvisor.tsx'
import DealerPersona from './components/DealerPersona/DealerPersona.tsx'
import SimulationLab from './components/SimulationLab/SimulationLab.tsx'
import StreakBadge from './components/StreakBadge/StreakBadge.tsx'
import VipBadge from './components/VipBadge/VipBadge.tsx'
import Confetti from './components/Confetti/Confetti.tsx'
import Leaderboard from './components/Leaderboard/Leaderboard.tsx'
import styles from './App.module.css'

type AppMode = 'play' | 'lab'

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('play')
  const [musicOn, setMusicOn] = useState(false)

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

  const {
    streak,
    streakMultiplier,
    vip,
    leaderboard,
    justLeveledUp,
    showLeaderboard,
    recordResult,
    saveToLeaderboard,
    toggleLeaderboard,
  } = useProgression(state.stats.handsPlayed, state.playerChips)

  const { muted, toggleMute, playChipClick, playChipTick, playButtonPress, playButtonRelease, playStand: playSfxStand, playDouble: playSfxDouble, hapticLight } = useSoundEffects({
    phase: state.phase,
    result: state.result,
    playerCardCount: state.playerHand.length,
    dealerCardCount: state.dealerHand.length,
  })

  // Record game results for streak/progression
  const prevResultRef = useRef(state.result)
  useEffect(() => {
    if (state.result && state.result !== prevResultRef.current) {
      recordResult(state.result, state.stats.handsPlayed)

      // Save to leaderboard on every result
      saveToLeaderboard()
    }
    prevResultRef.current = state.result
  }, [state.result, state.stats.handsPlayed, recordResult, saveToLeaderboard])

  // Play streak sound
  const prevStreakRef = useRef(streak)
  useEffect(() => {
    if (streak > prevStreakRef.current && streak >= 2 && !muted) {
      playStreakUp()
    }
    prevStreakRef.current = streak
  }, [streak, muted])

  // Play level-up sound
  useEffect(() => {
    if (justLeveledUp && !muted) {
      playLevelUp()
    }
  }, [justLeveledUp, muted])

  // Music toggle
  const handleMusicToggle = useCallback(() => {
    if (isAmbientPlaying()) {
      stopAmbient()
      setMusicOn(false)
    } else {
      startAmbient()
      setMusicOn(true)
    }
  }, [])

  // Mute also stops music
  const handleMuteToggle = useCallback(() => {
    toggleMute()
    if (!muted && isAmbientPlaying()) {
      stopAmbient()
      setMusicOn(false)
    }
  }, [toggleMute, muted])

  const isBetting = state.phase === 'betting'
  const isPlayerTurn = state.phase === 'playerTurn'
  const isResult = state.phase === 'result'

  // Confetti on win/blackjack
  const showConfetti = isResult && (
    state.result === 'playerWin' ||
    state.result === 'dealerBust' ||
    state.result === 'playerBlackjack'
  )
  const confettiIntensity = state.result === 'playerBlackjack' ? 'blackjack' as const : 'normal' as const

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
        <div className={styles.headerLeft}>
          <span className={styles.title}>Neon Blackjack</span>
          <VipBadge vip={vip} handsPlayed={state.stats.handsPlayed} justLeveledUp={justLeveledUp} />
          <StreakBadge streak={streak} multiplier={streakMultiplier} />
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.labButton}
            onClick={() => setAppMode('lab')}
          >
            AI Lab
          </button>
          <button
            className={styles.iconButton}
            onClick={toggleLeaderboard}
            aria-label="Leaderboard"
            title="Leaderboard"
          >
            {'\uD83C\uDFC6'}
          </button>
          <button
            className={`${styles.iconButton} ${musicOn ? styles.iconActive : ''}`}
            onClick={handleMusicToggle}
            aria-label={musicOn ? 'Stop music' : 'Play music'}
            title="Casino ambience"
          >
            {'\uD83C\uDFB5'}
          </button>
          <button className={styles.iconButton} onClick={handleMuteToggle} aria-label={muted ? 'Unmute' : 'Mute'}>
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
          <Confetti active={showConfetti} intensity={confettiIntensity} />
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

      <Leaderboard
        entries={leaderboard}
        visible={showLeaderboard}
        onClose={toggleLeaderboard}
        currentChips={state.playerChips}
      />
    </div>
  )
}
