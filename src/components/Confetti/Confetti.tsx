import { useEffect, useRef } from 'react'
import styles from './Confetti.module.css'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotSpeed: number
  gravity: number
  life: number
}

const COLORS = ['#c9a84c', '#e8d48b', '#f39c12', '#e74c3c', '#27ae60', '#3498db', '#fff']

interface ConfettiProps {
  readonly active: boolean
  readonly intensity?: 'normal' | 'blackjack'
}

export default function Confetti({ active, intensity = 'normal' }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active) {
      particlesRef.current = []
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    const count = intensity === 'blackjack' ? 120 : 60

    // Spawn particles
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: w * 0.3 + Math.random() * w * 0.4,
        y: h * 0.3 + Math.random() * h * 0.2,
        vx: (Math.random() - 0.5) * 8,
        vy: -(Math.random() * 6 + 3),
        size: Math.random() * 6 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.12 + Math.random() * 0.06,
        life: 1,
      })
    }

    let lastTime = performance.now()

    function animate(now: number) {
      const dt = Math.min((now - lastTime) / 16.67, 3)
      lastTime = now

      ctx!.clearRect(0, 0, w, h)

      const particles = particlesRef.current

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]

        p.x += p.vx * dt
        p.vy += p.gravity * dt
        p.y += p.vy * dt
        p.rotation += p.rotSpeed * dt
        p.life -= 0.008 * dt

        if (p.life <= 0 || p.y > h + 20) {
          particles.splice(i, 1)
          continue
        }

        ctx!.save()
        ctx!.translate(p.x, p.y)
        ctx!.rotate((p.rotation * Math.PI) / 180)
        ctx!.globalAlpha = Math.min(p.life, 1)
        ctx!.fillStyle = p.color

        // Rectangular confetti piece
        ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)

        ctx!.restore()
      }

      if (particles.length > 0) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [active, intensity])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
    />
  )
}
