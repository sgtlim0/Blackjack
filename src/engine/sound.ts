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

function playNoise(duration: number, volume: number = 0.06) {
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
  filter.type = 'highpass'
  filter.frequency.value = 4000

  const gain = ctx.createGain()
  const now = ctx.currentTime
  gain.gain.setValueAtTime(volume, now)
  gain.gain.linearRampToValueAtTime(0, now + duration)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  source.start(now)
  source.stop(now + duration)
}

export function playCardDeal() {
  playNoise(0.08, 0.1)
  playTone(800, 0.06, 'triangle', 0.04, 0.005, 0.02)
}

export function playCardFlip() {
  playNoise(0.06, 0.08)
  playTone(1200, 0.05, 'sine', 0.03, 0.005, 0.02)
}

export function playChipClick() {
  playTone(2400, 0.04, 'square', 0.06, 0.003, 0.01)
  playTone(3200, 0.03, 'sine', 0.03, 0.005, 0.01)
}

export function playChipStack() {
  playTone(1800, 0.05, 'square', 0.05, 0.003, 0.015)
  setTimeout(() => playTone(2200, 0.04, 'square', 0.04, 0.003, 0.01), 30)
  setTimeout(() => playTone(2600, 0.03, 'square', 0.03, 0.003, 0.01), 55)
}

export function playButtonPress() {
  playTone(600, 0.05, 'sine', 0.06, 0.005, 0.02)
}

export function playHit() {
  playCardDeal()
  playTone(440, 0.08, 'triangle', 0.05, 0.005, 0.03)
}

export function playStand() {
  playTone(330, 0.12, 'sine', 0.06, 0.01, 0.04)
  playTone(440, 0.1, 'sine', 0.04, 0.03, 0.04)
}

export function playDouble() {
  playChipStack()
  setTimeout(() => playCardDeal(), 80)
}

export function playWin() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.1, 0.01, 0.05), i * 80)
  })
}

export function playBlackjack() {
  const notes = [523, 659, 784, 1047, 1319]
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.12, 0.01, 0.06), i * 70)
  })
  setTimeout(() => playChipStack(), 300)
}

export function playLose() {
  playTone(330, 0.2, 'sawtooth', 0.06, 0.01, 0.08)
  setTimeout(() => playTone(262, 0.25, 'sawtooth', 0.05, 0.01, 0.1), 120)
}

export function playBust() {
  playTone(220, 0.15, 'sawtooth', 0.08, 0.005, 0.05)
  setTimeout(() => playTone(185, 0.2, 'sawtooth', 0.06, 0.005, 0.08), 100)
  setTimeout(() => playTone(147, 0.25, 'sawtooth', 0.04, 0.005, 0.1), 200)
}

export function playPush() {
  playTone(440, 0.15, 'triangle', 0.06, 0.01, 0.05)
  setTimeout(() => playTone(440, 0.15, 'triangle', 0.04, 0.01, 0.05), 150)
}

export function playDealSequence() {
  for (let i = 0; i < 4; i++) {
    setTimeout(() => playCardDeal(), i * 150)
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
