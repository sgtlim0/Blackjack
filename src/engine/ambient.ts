let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let isPlaying = false
const oscillators: OscillatorNode[] = []
const gains: GainNode[] = []

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.035
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  return ctx
}

function getMaster(): GainNode {
  getCtx()
  return masterGain!
}

/** Soft pad chord (jazz voicing) */
function createPad(frequency: number, volume: number): { osc: OscillatorNode; gain: GainNode } {
  const audioCtx = getCtx()
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  const filter = audioCtx.createBiquadFilter()

  osc.type = 'sine'
  osc.frequency.value = frequency
  filter.type = 'lowpass'
  filter.frequency.value = 800
  filter.Q.value = 0.5

  gain.gain.value = volume

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(getMaster())

  return { osc, gain }
}

/** Subtle low-frequency hum for warmth */
function createHum(): { osc: OscillatorNode; gain: GainNode } {
  const audioCtx = getCtx()
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc.type = 'sine'
  osc.frequency.value = 55 // Low A

  gain.gain.value = 0.15

  osc.connect(gain)
  gain.connect(getMaster())

  return { osc, gain }
}

// Jazz chord progression: Am7 → Dm7 → G7 → Cmaj7
const CHORDS = [
  [220, 261.63, 329.63, 392],     // Am7
  [293.66, 349.23, 440, 523.25],  // Dm7
  [196, 246.94, 293.66, 349.23],  // G7
  [261.63, 329.63, 392, 493.88],  // Cmaj7
]

let chordIndex = 0
let chordTimer: number | null = null

function cycleChords() {
  if (!isPlaying || gains.length === 0) return

  chordIndex = (chordIndex + 1) % CHORDS.length
  const chord = CHORDS[chordIndex]

  // Smoothly crossfade to next chord (skip hum osc at index 0)
  const padOscs = oscillators.slice(1)
  const audioCtx = getCtx()
  const now = audioCtx.currentTime

  chord.forEach((freq, i) => {
    if (padOscs[i]) {
      padOscs[i].frequency.setValueAtTime(padOscs[i].frequency.value, now)
      padOscs[i].frequency.linearRampToValueAtTime(freq, now + 2)
    }
  })

  chordTimer = window.setTimeout(cycleChords, 8000)
}

export function startAmbient(): void {
  if (isPlaying) return
  isPlaying = true

  const chord = CHORDS[0]

  // Bass hum
  const hum = createHum()
  oscillators.push(hum.osc)
  gains.push(hum.gain)
  hum.osc.start()

  // 4 pad voices
  chord.forEach(freq => {
    const pad = createPad(freq, 0.08)
    oscillators.push(pad.osc)
    gains.push(pad.gain)
    pad.osc.start()
  })

  // Fade in
  const master = getMaster()
  master.gain.setValueAtTime(0, getCtx().currentTime)
  master.gain.linearRampToValueAtTime(0.035, getCtx().currentTime + 2)

  // Start chord cycling
  chordTimer = window.setTimeout(cycleChords, 8000)
}

export function stopAmbient(): void {
  if (!isPlaying) return
  isPlaying = false

  if (chordTimer !== null) {
    clearTimeout(chordTimer)
    chordTimer = null
  }

  const master = getMaster()
  const audioCtx = getCtx()
  const now = audioCtx.currentTime

  // Fade out
  master.gain.setValueAtTime(master.gain.value, now)
  master.gain.linearRampToValueAtTime(0, now + 1)

  // Stop after fade
  setTimeout(() => {
    oscillators.forEach(osc => {
      try { osc.stop() } catch { /* already stopped */ }
    })
    oscillators.length = 0
    gains.length = 0
  }, 1200)
}

export function isAmbientPlaying(): boolean {
  return isPlaying
}
