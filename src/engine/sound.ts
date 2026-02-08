let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.12,
  attack: number = 0.01,
  decay: number = 0.08,
) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.value = frequency
  osc.connect(gain)
  gain.connect(ctx.destination)

  const now = ctx.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(volume, now + attack)
  gain.gain.linearRampToValueAtTime(volume * 0.7, now + attack + decay)
  gain.gain.linearRampToValueAtTime(0, now + duration)

  osc.start(now)
  osc.stop(now + duration)
}

/** Filtered tone with bandpass for richer timbre */
function playFilteredTone(
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  filterFreq: number,
  filterQ: number = 1,
) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.value = frequency
  filter.type = 'bandpass'
  filter.frequency.value = filterFreq
  filter.Q.value = filterQ

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  const now = ctx.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(volume, now + 0.003)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

  osc.start(now)
  osc.stop(now + duration)
}

function playNoise(
  duration: number,
  volume: number = 0.06,
  filterType: BiquadFilterType = 'highpass',
  filterFreq: number = 4000,
) {
  const ctx = getCtx()
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * volume
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = filterType
  filter.frequency.value = filterFreq

  const gain = ctx.createGain()
  const now = ctx.currentTime
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  source.start(now)
  source.stop(now + duration)
}

/** Low thud for table impact */
function playThud(volume: number = 0.08) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.value = 80
  osc.connect(gain)
  gain.connect(ctx.destination)

  const now = ctx.currentTime
  osc.frequency.setValueAtTime(80, now)
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.08)
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

  osc.start(now)
  osc.stop(now + 0.1)
}

/** Metallic ping for chip sounds */
function playMetallicPing(frequency: number, volume: number = 0.04) {
  const ctx = getCtx()
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()

  osc1.type = 'sine'
  osc1.frequency.value = frequency
  osc2.type = 'sine'
  osc2.frequency.value = frequency * 2.76  // inharmonic partial for metallic quality

  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ctx.destination)

  const now = ctx.currentTime
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

  osc1.start(now)
  osc2.start(now)
  osc1.stop(now + 0.15)
  osc2.stop(now + 0.15)
}

/** Frequency sweep for swoosh effects */
function playSweep(startFreq: number, endFreq: number, duration: number, volume: number = 0.03) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()

  osc.type = 'sawtooth'
  filter.type = 'bandpass'
  filter.Q.value = 2

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  const now = ctx.currentTime
  osc.frequency.setValueAtTime(startFreq, now)
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration)
  filter.frequency.setValueAtTime(startFreq * 2, now)
  filter.frequency.exponentialRampToValueAtTime(endFreq * 2, now + duration)
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

  osc.start(now)
  osc.stop(now + duration)
}

// ─── Card Sounds ─────────────────────────────────────────

export function playCardDeal() {
  // Slide noise (card leaving shoe)
  playNoise(0.06, 0.07, 'bandpass', 6000)
  // Table impact thud
  setTimeout(() => playThud(0.06), 40)
  // Snap tone
  playTone(900, 0.04, 'triangle', 0.03, 0.002, 0.015)
}

export function playCardFlip() {
  // Swoosh
  playSweep(3000, 800, 0.08, 0.04)
  // Paper noise
  playNoise(0.05, 0.06, 'bandpass', 5000)
  // Snap accent
  setTimeout(() => playTone(1400, 0.04, 'sine', 0.025, 0.002, 0.015), 30)
}

// ─── Chip Sounds ─────────────────────────────────────────

export function playChipClick() {
  playMetallicPing(3200, 0.05)
  playNoise(0.03, 0.04, 'highpass', 6000)
}

export function playChipStack() {
  // 3-chip cascade with rising pitch
  playMetallicPing(2000, 0.045)
  setTimeout(() => playMetallicPing(2600, 0.04), 35)
  setTimeout(() => playMetallicPing(3400, 0.035), 65)
  setTimeout(() => playNoise(0.02, 0.025, 'highpass', 5000), 80)
}

/** Continuous chip slide for bet slider */
export function playChipTick() {
  playMetallicPing(4000, 0.02)
}

// ─── Button Sounds ───────────────────────────────────────

export function playButtonPress() {
  // Down click
  playTone(800, 0.03, 'square', 0.04, 0.002, 0.01)
  playFilteredTone(400, 0.05, 'sine', 0.03, 600, 2)
}

/** Button release for two-phase click feel */
export function playButtonRelease() {
  playTone(1000, 0.02, 'square', 0.025, 0.002, 0.008)
}

// ─── Action Sounds ───────────────────────────────────────

export function playHit() {
  playCardDeal()
  // Tonal accent — resolving upward
  setTimeout(() => {
    playTone(440, 0.06, 'triangle', 0.04, 0.003, 0.02)
    playTone(660, 0.05, 'sine', 0.02, 0.01, 0.02)
  }, 50)
}

export function playStand() {
  // Firm, decisive low chord
  playFilteredTone(220, 0.18, 'triangle', 0.06, 440, 1.5)
  playTone(330, 0.14, 'sine', 0.04, 0.01, 0.05)
  playTone(440, 0.12, 'sine', 0.025, 0.02, 0.04)
}

export function playDouble() {
  // Dramatic chip push
  playChipStack()
  // Power chord accent
  setTimeout(() => {
    playTone(330, 0.08, 'triangle', 0.05, 0.005, 0.03)
    playTone(495, 0.07, 'sine', 0.03, 0.01, 0.025)
  }, 50)
  // Card deal follows
  setTimeout(() => playCardDeal(), 100)
}

// ─── Result Sounds ───────────────────────────────────────

export function playWin() {
  // Major arpeggio C-E-G-C with harmonic richness
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    setTimeout(() => {
      playTone(freq, 0.2, 'sine', 0.09, 0.008, 0.06)
      playTone(freq * 2, 0.15, 'sine', 0.03, 0.015, 0.04)  // octave shimmer
    }, i * 75)
  })
  // Chip cascade celebration
  setTimeout(() => playChipStack(), 250)
  setTimeout(() => playChipStack(), 420)
}

export function playBlackjack() {
  // Dramatic fanfare: C-E-G-C-E ascending with shimmer
  const notes = [523, 659, 784, 1047, 1319]
  notes.forEach((freq, i) => {
    setTimeout(() => {
      playTone(freq, 0.28, 'sine', 0.11, 0.005, 0.08)
      playTone(freq * 2, 0.2, 'sine', 0.04, 0.01, 0.06)
      playFilteredTone(freq * 3, 0.15, 'sine', 0.015, freq * 4, 3)  // bell harmonic
    }, i * 65)
  })
  // Triple chip cascade
  setTimeout(() => playChipStack(), 280)
  setTimeout(() => playChipStack(), 440)
  setTimeout(() => playChipStack(), 580)
  // Final shimmer
  setTimeout(() => playSweep(2000, 6000, 0.3, 0.02), 350)
}

export function playLose() {
  // Minor descending: E-C
  playFilteredTone(330, 0.3, 'sawtooth', 0.05, 600, 1)
  setTimeout(() => playFilteredTone(262, 0.35, 'sawtooth', 0.04, 500, 1), 130)
  // Muted thud
  setTimeout(() => playThud(0.04), 200)
}

export function playBust() {
  // Dramatic descending tritone with grind
  playFilteredTone(294, 0.18, 'sawtooth', 0.07, 500, 1.5)
  setTimeout(() => playFilteredTone(220, 0.22, 'sawtooth', 0.06, 400, 1.5), 100)
  setTimeout(() => playFilteredTone(147, 0.3, 'sawtooth', 0.05, 300, 1), 200)
  // Impact thud
  setTimeout(() => playThud(0.07), 280)
  // Noise crash
  setTimeout(() => playNoise(0.12, 0.04, 'lowpass', 800), 300)
}

export function playPush() {
  // Neutral two-note ping
  playTone(440, 0.12, 'triangle', 0.05, 0.01, 0.04)
  playTone(440, 0.12, 'sine', 0.025, 0.01, 0.04)
  setTimeout(() => {
    playTone(440, 0.12, 'triangle', 0.035, 0.01, 0.04)
    playTone(440, 0.12, 'sine', 0.018, 0.01, 0.04)
  }, 160)
}

// ─── Progression Sounds ──────────────────────────────────

export function playLevelUp() {
  // Ascending major scale fanfare
  const notes = [523, 587, 659, 784, 1047]
  notes.forEach((freq, i) => {
    setTimeout(() => {
      playTone(freq, 0.25, 'sine', 0.1, 0.005, 0.08)
      playTone(freq * 1.5, 0.2, 'sine', 0.04, 0.01, 0.06)
    }, i * 80)
  })
  setTimeout(() => playSweep(1000, 4000, 0.4, 0.025), 300)
}

export function playStreakUp() {
  // Quick ascending ping
  playMetallicPing(1500, 0.04)
  setTimeout(() => playMetallicPing(2000, 0.035), 60)
  setTimeout(() => playTone(2500, 0.06, 'sine', 0.03, 0.005, 0.02), 110)
}

// ─── Sequences ───────────────────────────────────────────

export function playDealSequence() {
  // 4 cards with slight pitch variation for realism
  const pitchOffsets = [0, 20, -15, 10]
  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      playNoise(0.06, 0.07, 'bandpass', 6000 + pitchOffsets[i] * 10)
      setTimeout(() => playThud(0.04 + i * 0.005), 40)
      playTone(900 + pitchOffsets[i], 0.04, 'triangle', 0.03, 0.002, 0.015)
    }, i * 160)
  }
}

export function haptic(pattern: number | number[] = 10) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export function hapticLight() {
  haptic(8)
}

export function hapticMedium() {
  haptic(15)
}

export function hapticHeavy() {
  haptic([20, 30, 20])
}

export function hapticSuccess() {
  haptic([10, 50, 10, 50, 15])
}

export function hapticError() {
  haptic([30, 50, 30])
}
