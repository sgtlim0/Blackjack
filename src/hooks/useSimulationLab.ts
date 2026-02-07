import { useState, useCallback, useRef } from 'react'
import type { AiDifficulty } from '../types/index.ts'
import { runBatchSimulation } from '../engine/aiPlayer.ts'
import type { LabStats } from '../engine/aiPlayer.ts'

export type LabPhase = 'config' | 'running' | 'done'

export interface LabState {
  readonly phase: LabPhase
  readonly selectedDifficulties: readonly AiDifficulty[]
  readonly handCount: number
  readonly results: readonly LabStats[]
  readonly progress: number
}

const INITIAL_LAB: LabState = {
  phase: 'config',
  selectedDifficulties: ['easy', 'pro', 'casino'],
  handCount: 1000,
  results: [],
  progress: 0,
}

export function useSimulationLab() {
  const [state, setState] = useState<LabState>(INITIAL_LAB)
  const cancelRef = useRef(false)

  const setHandCount = useCallback((count: number) => {
    setState(prev => prev.phase === 'config' ? { ...prev, handCount: count } : prev)
  }, [])

  const toggleDifficulty = useCallback((d: AiDifficulty) => {
    setState(prev => {
      if (prev.phase !== 'config') return prev
      const has = prev.selectedDifficulties.includes(d)
      if (has && prev.selectedDifficulties.length <= 1) return prev
      return {
        ...prev,
        selectedDifficulties: has
          ? prev.selectedDifficulties.filter(x => x !== d)
          : [...prev.selectedDifficulties, d],
      }
    })
  }, [])

  const runSimulation = useCallback(() => {
    cancelRef.current = false
    setState(prev => ({ ...prev, phase: 'running', results: [], progress: 0 }))

    // Run in batches to keep UI responsive
    const difficulties = [...state.selectedDifficulties]
    const total = state.handCount
    const allResults: LabStats[] = []

    let diffIdx = 0

    function runNextBatch() {
      if (cancelRef.current) {
        setState(prev => ({ ...prev, phase: 'config', progress: 0 }))
        return
      }

      if (diffIdx >= difficulties.length) {
        setState(prev => ({ ...prev, phase: 'done', results: allResults, progress: 100 }))
        return
      }

      const difficulty = difficulties[diffIdx]
      const result = runBatchSimulation(difficulty, total)
      allResults.push(result)
      diffIdx++

      const progress = Math.round((diffIdx / difficulties.length) * 100)
      setState(prev => ({ ...prev, results: [...allResults], progress }))

      // Give UI a frame to breathe
      setTimeout(runNextBatch, 16)
    }

    // Small delay to let the "running" state render
    setTimeout(runNextBatch, 50)
  }, [state.selectedDifficulties, state.handCount])

  const cancel = useCallback(() => {
    cancelRef.current = true
  }, [])

  const reset = useCallback(() => {
    cancelRef.current = true
    setState(INITIAL_LAB)
  }, [])

  return {
    labState: state,
    setHandCount,
    toggleDifficulty,
    runSimulation,
    cancel,
    reset,
  }
}

// Re-export for convenience
export type { LabStats }
