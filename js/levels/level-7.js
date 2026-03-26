import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { GAME_HEIGHT, GAME_WIDTH, getCtx } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

// Underworld entrance state
let uwDeaths = 0
let prevDead = false
let crackRevealFrame = -1
let particles = []
let whisperAlpha = 0
let screenShake = 0
const CRACK_X = T * 3  // Crack location in starting ground (away from spawn)
const CRACK_W = T       // One tile wide

export function createLevel() {
  uwDeaths = 0
  prevDead = false
  crackRevealFrame = -1
  particles = []
  whisperAlpha = 0
  screenShake = 0

  return {
    name: 'Sprint Review',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // === Section 1: Mover carries you toward spikes — jump off! ===
      // Split ground — crack platform at T*3 becomes non-solid after 3 deaths
      createPlatform(0, G, T * 3, T, 'solid'),     // Index 0: ground left of crack
      createPlatform(T * 3, G, T, T, 'solid'),     // Index 1: crack platform (disabled after 3 deaths)

      // Slow mover — plenty of time to react
      createPlatform(T * 5, G - T * 1.5, T * 3, T, 'moving', {
        endX: T * 12, endY: G - T * 1.5,
        speed: 0.7
      }),

      // Safe landing — jump here before the spikes
      createPlatform(T * 9, G - T * 3.5, T * 3, T, 'solid'),

      // === Section 2: Ride across a spike pit ===
      createPlatform(T * 12, G - T * 3.5, T * 3, T, 'moving', {
        endX: T * 18, endY: G - T * 3.5,
        speed: 0.8
      }),

      // Landing — wide and forgiving
      createPlatform(T * 17, G - T * 2, T * 4, T, 'solid'),

      // === Section 3: Elevator up to goal ===
      createPlatform(T * 21, G - T * 1, T * 2.5, T, 'moving', {
        endX: T * 21, endY: G - T * 7,
        speed: 1
      }),

      // Goal platform — wide
      createPlatform(T * 23, G - T * 6, T * 2.5, T, 'solid'),
    ],

    spikes: [
      // Wall the first mover heads toward
      createSpike(T * 13, G - T * 2.5, T, T, { direction: 'left' }),
      createSpike(T * 13, G - T * 1.5, T, T, { direction: 'left' }),

      // Spike pit under section 2 mover
      createSpike(T * 13, G, T, T),
      createSpike(T * 14, G, T, T),
      createSpike(T * 15, G, T, T),
      createSpike(T * 16, G, T, T),
    ],

    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 1, y: G - 36, text: 'Training...' },
      { x: T * 9.5, y: G - T * 3.5 - 36, text: 'Overfit!' },
    ],

    goals: [
      createGoal(T * 23.5, G - T * 6 - 32, false),
    ],

    customUpdate(level, player, frame) {
      // Track deaths for crack visibility
      if (player.dead && !prevDead) {
        uwDeaths += 1
        // Screen shake on death 3 — the crack opens
        if (uwDeaths === 3) {
          crackRevealFrame = frame
          screenShake = 20
        }
      }
      prevDead = player.dead

      // Decay screen shake
      if (screenShake > 0) {
        screenShake -= 1
      }

      // Spawn eerie particles rising from crack area
      // After 1 death: very rare. After 2: more frequent. After 3: constant
      const spawnChance = uwDeaths === 0 ? 0 : uwDeaths === 1 ? 0.01 : uwDeaths === 2 ? 0.04 : 0.12
      if (Math.random() < spawnChance) {
        const px = CRACK_X + Math.random() * CRACK_W
        const py = G + T
        particles = [...particles, {
          x: px, y: py,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(0.3 + Math.random() * 0.5),
          life: 60 + Math.floor(Math.random() * 60),
          maxLife: 60 + Math.floor(Math.random() * 60),
          size: 1 + Math.random() * 2,
        }]
      }

      // Update particles immutably
      particles = particles
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vx: p.vx + (Math.random() - 0.5) * 0.05,
          life: p.life - 1,
        }))
        .filter(p => p.life > 0)

      // Whisper text fade — pulses after 2+ deaths near the crack
      if (uwDeaths >= 2 && !player.dead) {
        const distToCrack = Math.abs(player.x - (CRACK_X + CRACK_W / 2))
        const targetAlpha = distToCrack < T * 4 ? 0.4 : 0
        whisperAlpha += (targetAlpha - whisperAlpha) * 0.03
      } else {
        whisperAlpha *= 0.95
      }

      // After 3 deaths, disable the crack platform (index 1) and enable warp
      if (uwDeaths >= 3) {
        level._disablePlatformIndex = 1
        level._warpToUnderworld = true
      }
    },

    customRender(level, ctx) {
      const fc = level.frameCount || 0
      const cx = CRACK_X + CRACK_W / 2
      const cy = G

      ctx.save()

      // Screen shake offset
      if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake * 0.5
        const shakeY = (Math.random() - 0.5) * screenShake * 0.5
        ctx.translate(shakeX, shakeY)
      }

      // === Phase 1: After 1 death — subtle flicker on ground near crack ===
      if (uwDeaths >= 1 && uwDeaths < 3) {
        const flicker = Math.sin(fc * 0.08) * 0.5 + 0.5
        ctx.globalAlpha = 0.03 + flicker * 0.04
        ctx.fillStyle = '#660000'
        ctx.fillRect(CRACK_X - 2, G, CRACK_W + 4, T)

        // Hairline crack — barely visible
        if (uwDeaths >= 2) {
          ctx.globalAlpha = 0.15 + Math.sin(fc * 0.1) * 0.1
          ctx.strokeStyle = '#551111'
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(cx, cy + 2)
          ctx.lineTo(cx + 1, cy + 10)
          ctx.lineTo(cx - 1, cy + 20)
          ctx.lineTo(cx + 2, cy + 30)
          ctx.stroke()
        }
      }

      // === Phase 2: After 3 deaths — full crack with void effect ===
      if (uwDeaths >= 3) {
        // Pulsing void beneath the crack
        const pulse = Math.sin(fc * 0.04) * 0.5 + 0.5
        const voidGrad = ctx.createRadialGradient(cx, cy + T / 2, 0, cx, cy + T / 2, T * 1.5)
        voidGrad.addColorStop(0, `rgba(80, 0, 0, ${0.3 + pulse * 0.15})`)
        voidGrad.addColorStop(0.6, `rgba(40, 0, 0, ${0.1 + pulse * 0.05})`)
        voidGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = voidGrad
        ctx.fillRect(CRACK_X - T * 1.5, G - T * 0.5, CRACK_W + T * 3, T * 2)

        // Jagged crack lines — thicker, more dramatic
        ctx.globalAlpha = 0.6 + Math.sin(fc * 0.05) * 0.2
        ctx.strokeStyle = '#aa2222'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(cx - 3, cy - 6)
        ctx.lineTo(cx + 4, cy + 2)
        ctx.lineTo(cx - 2, cy + 8)
        ctx.lineTo(cx + 5, cy + 16)
        ctx.lineTo(cx - 1, cy + 22)
        ctx.lineTo(cx + 3, cy + 28)
        ctx.lineTo(cx - 2, cy + T)
        ctx.stroke()

        // Second crack line for depth
        ctx.globalAlpha = 0.3
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(cx + 6, cy - 2)
        ctx.lineTo(cx + 2, cy + 6)
        ctx.lineTo(cx + 7, cy + 14)
        ctx.lineTo(cx + 3, cy + 24)
        ctx.stroke()

        // Inner red glow
        ctx.fillStyle = `rgba(170, 30, 30, ${0.12 + pulse * 0.08})`
        ctx.fillRect(CRACK_X, G, CRACK_W, T)

        // Faint light beam upward from crack
        ctx.globalAlpha = 0.04 + pulse * 0.03
        const beamGrad = ctx.createLinearGradient(cx, G, cx, G - T * 3)
        beamGrad.addColorStop(0, 'rgba(170, 40, 40, 0.6)')
        beamGrad.addColorStop(1, 'rgba(170, 40, 40, 0)')
        ctx.fillStyle = beamGrad
        ctx.fillRect(cx - 3, G - T * 3, 6, T * 3)
      }

      // === Particles — eerie red motes rising from below ===
      for (const p of particles) {
        const alphaRatio = p.life / p.maxLife
        ctx.globalAlpha = alphaRatio * 0.6
        ctx.fillStyle = `rgb(${150 + Math.floor(Math.random() * 50)}, ${20 + Math.floor(Math.random() * 20)}, ${20 + Math.floor(Math.random() * 20)})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * alphaRatio, 0, Math.PI * 2)
        ctx.fill()
      }

      // === Whisper text — fades in when player is near crack ===
      if (whisperAlpha > 0.01) {
        ctx.globalAlpha = whisperAlpha * (0.7 + Math.sin(fc * 0.06) * 0.3)
        ctx.fillStyle = '#882222'
        ctx.font = 'italic 9px monospace'
        ctx.textAlign = 'center'

        const whispers = ['...tiefer...', 'loss: -Inf', '...darunter...', 'epoch: -1']
        const idx = Math.floor(fc / 180) % whispers.length
        const yOff = Math.sin(fc * 0.02) * 3
        ctx.fillText(whispers[idx], cx, G - 8 + yOff)
      }

      ctx.restore()
    },
  }
}
