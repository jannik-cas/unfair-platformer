import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createCrawler, createFloater, createTurret } from '../entities/enemy.js'
import { createPickup } from '../entities/pickup.js'
import { GAME_WIDTH, GAME_HEIGHT, getCtx } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

// ---------------------------------------------------------------------------
// Module-level phase state — reset when level restarts (frameCount === 1)
// ---------------------------------------------------------------------------
let phase = 1
let phaseTimer = 0
let collapseProgress = 0
let goalTeleportTimer = 0

// ---------------------------------------------------------------------------
// Phase 2 helpers — track which keys have been collected
// ---------------------------------------------------------------------------
const KEY_IDS = ['sing_key1', 'sing_key2', 'sing_key3']

function allKeysCollected(level) {
  return KEY_IDS.every(id => {
    const pickup = level.pickups.find(p => p.keyId === id)
    return pickup && pickup.collected
  })
}

// ---------------------------------------------------------------------------
// Platform factory helpers for phase transitions
// ---------------------------------------------------------------------------
function buildPhase1Platforms() {
  return [
    // Starting solid ground
    createPlatform(0, G, T * 4, T, 'solid'),

    // Step up sequence — echoes early-game feel
    createPlatform(T * 5, G - T * 1, T * 2, T, 'solid'),
    createPlatform(T * 8, G - T * 2, T * 2, T, 'solid'),
    createPlatform(T * 11, G - T * 1, T * 2.5, T, 'solid'),

    // Midpoint safe platform
    createPlatform(T * 14, G, T * 3, T, 'solid'),

    // Phase 1 trigger platform — reaching here starts phase 2
    createPlatform(T * 14, G - T * 2, T * 4, T, 'solid'),
  ]
}

function buildPhase1Spikes() {
  return [
    createSpike(T * 4, G, T, T),
    createSpike(T * 7, G, T, T),
    createSpike(T * 10, G - T * 2, T, T, { direction: 'up' }),
    createSpike(T * 13, G, T, T),
  ]
}

function buildPhase2Platforms() {
  return [
    // Full ground for turret-dodge platforming
    createPlatform(0, G, T * 5, T, 'solid'),
    createPlatform(T * 6, G, T * 4, T, 'solid'),
    createPlatform(T * 11, G, T * 4, T, 'solid'),
    createPlatform(T * 16, G, T * 4, T, 'solid'),
    createPlatform(T * 21, G, T * 4, T, 'solid'),

    // Elevated platforms to reach keys at height
    createPlatform(T * 2, G - T * 4, T * 2, T, 'solid'),
    createPlatform(T * 11, G - T * 5, T * 2.5, T, 'solid'),
    createPlatform(T * 20, G - T * 3, T * 2.5, T, 'solid'),

    // Locked platform — unlocked in customUpdate when all keys collected
    createPlatform(T * 11, G - T * 7, T * 3, T, 'fake'),
  ]
}

function buildPhase3Platforms() {
  return [
    // Minimal ground — the world is collapsing
    createPlatform(0, G, T * 4, T, 'solid'),
    createPlatform(T * 5, G, T * 3, T, 'solid'),
    createPlatform(T * 9, G - T * 1, T * 2, T, 'solid'),
    createPlatform(T * 12, G, T * 3, T, 'solid'),
    createPlatform(T * 16, G - T * 2, T * 2, T, 'solid'),
    createPlatform(T * 19, G, T * 3, T, 'solid'),
    createPlatform(T * 23, G - T * 1, T * 2, T, 'solid'),
  ]
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function createLevel() {
  return {
    name: 'The Singularity',
    playerStart: { x: T * 1, y: G - 24 },

    platforms: buildPhase1Platforms(),

    spikes: buildPhase1Spikes(),

    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 0.5, y: G - 36, text: 'Phase 1: Inference' },
    ],

    goals: [],

    enemies: [
      // Phase 1: two crawlers patrol the lower section
      createCrawler(T * 5, G - 16, T * 4, T * 8, 1.0),
      createCrawler(T * 11, G - 16, T * 10, T * 14, 1.2),

      // Phase 1: floater hovers over the gap between mid platforms
      createFloater(T * 9, G - T * 4, 36, 0.035, 0),
    ],

    pickups: [],

    // -----------------------------------------------------------------
    customUpdate(level, player) {
      // Reset all state on restart
      if (level.frameCount === 1) {
        phase = 1
        phaseTimer = 0
        collapseProgress = 0
        goalTeleportTimer = 0

        level.platforms = buildPhase1Platforms()
        level.spikes = buildPhase1Spikes()
        level.enemies = [
          createCrawler(T * 5, G - 16, T * 4, T * 8, 1.0),
          createCrawler(T * 11, G - 16, T * 10, T * 14, 1.2),
          createFloater(T * 9, G - T * 4, 36, 0.035, 0),
        ]
        level.pickups = []
        level.goals = []
        level.signs = [
          { x: T * 0.5, y: G - 36, text: 'Phase 1: Inference' },
        ]
        return
      }

      phaseTimer += 1

      // ---------------------------------------------------------------
      // Phase 1 → 2 transition: player reaches the trigger platform
      // ---------------------------------------------------------------
      if (phase === 1 && player.x > T * 14 && player.y < G - T * 1.5) {
        phase = 2
        phaseTimer = 0

        level.platforms = buildPhase2Platforms()
        level.spikes = [
          createSpike(T * 5, G, T, T),
          createSpike(T * 10, G, T, T),
          createSpike(T * 15, G, T, T),
          createSpike(T * 20, G, T, T),
        ]
        level.enemies = [
          createTurret(T * 4, T * 2, 90, 2.5, 320),
          createTurret(T * 20, T * 2, 80, 2.8, 350),
        ]
        level.pickups = [
          createPickup(T * 2 + 8, G - T * 4 - 16, 'key', { keyId: 'sing_key1' }),
          createPickup(T * 11 + 8, G - T * 5 - 16, 'key', { keyId: 'sing_key2' }),
          createPickup(T * 20 + 8, G - T * 3 - 16, 'key', { keyId: 'sing_key3' }),
        ]
        level.goals = []
        level.signs = [
          { x: T * 0.5, y: G - 36, text: 'Phase 2: Collect the Features' },
        ]
        return
      }

      // ---------------------------------------------------------------
      // Phase 2: unlock the locked platform when all 3 keys collected
      // ---------------------------------------------------------------
      if (phase === 2) {
        if (allKeysCollected(level)) {
          // Replace the fake locked platform with a real solid one
          level.platforms = level.platforms.map(p => {
            if (p.type === 'fake' && Math.abs(p.x - T * 11) < 4 && Math.abs(p.y - (G - T * 7)) < 4) {
              return { ...p, type: 'solid' }
            }
            return p
          })

          // Phase 2 → 3: player reaches the unlocked platform
          if (player.y < G - T * 6) {
            phase = 3
            phaseTimer = 0
            collapseProgress = 0

            level.platforms = buildPhase3Platforms()
            level.spikes = [
              createSpike(T * 8, G, T, T),
              createSpike(T * 14, G - T, T, T),
              createSpike(T * 18, G, T, T),
              createSpike(T * 22, G, T, T),
            ]
            level.enemies = [
              // Turrets remain — now ceiling-mounted, harder to avoid
              createTurret(T * 4, T * 1, 70, 3.0, 400),
              createTurret(T * 19, T * 1, 65, 3.2, 400),
            ]
            level.pickups = []

            // Fake goal in the center of the screen (where the vortex pulls)
            level.goals = [
              createGoal(GAME_WIDTH / 2 - 8, GAME_HEIGHT / 2 - 32, true, { killOnTouch: true }),
            ]

            level.signs = [
              { x: T * 0.5, y: G - 36, text: 'Die KI hat Bewusstsein erlangt.' },
            ]
          }
        }
        return
      }

      // ---------------------------------------------------------------
      // Phase 3: collapse — vortex grows, real goal is at start position
      // ---------------------------------------------------------------
      if (phase === 3) {
        collapseProgress = Math.min(1, collapseProgress + 0.002)
        goalTeleportTimer += 1

        // Spawn the real goal at the starting position after a short delay
        // so it isn't immediately obvious — let the player get pulled toward
        // the fake center goal first
        if (goalTeleportTimer === 120) {
          level.goals = [
            // Fake goal still in center
            createGoal(GAME_WIDTH / 2 - 8, GAME_HEIGHT / 2 - 32, true, { killOnTouch: true }),
            // Real goal back at start — you must run backward
            createGoal(T * 1, G - 32, false),
          ]
        }
      }
    },

    // -----------------------------------------------------------------
    customRender: null,

    // -----------------------------------------------------------------
    customPostRender(level, ctx) {
      if (phase !== 3) return

      const cx = GAME_WIDTH / 2
      const cy = GAME_HEIGHT / 2
      const vortexRadius = 20 + collapseProgress * 120

      ctx.save()

      // Growing dark vortex circle at the center
      const vortexGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, vortexRadius)
      vortexGrad.addColorStop(0, `rgba(0, 0, 0, ${0.85 * collapseProgress})`)
      vortexGrad.addColorStop(0.6, `rgba(10, 0, 20, ${0.55 * collapseProgress})`)
      vortexGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = vortexGrad
      ctx.beginPath()
      ctx.arc(cx, cy, vortexRadius, 0, Math.PI * 2)
      ctx.fill()

      // Rotating spiral lines for the vortex effect
      const spiralCount = 6
      ctx.strokeStyle = `rgba(120, 0, 255, ${0.4 * collapseProgress})`
      ctx.lineWidth = 1
      for (let i = 0; i < spiralCount; i++) {
        const angle = (phaseTimer * 0.04) + (i * Math.PI * 2) / spiralCount
        const innerR = vortexRadius * 0.1
        const outerR = vortexRadius * 0.9
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR)
        ctx.lineTo(cx + Math.cos(angle + 0.5) * outerR, cy + Math.sin(angle + 0.5) * outerR)
        ctx.stroke()
      }

      // Subtle screen-edge darkening proportional to collapse
      const edgeDark = collapseProgress * 0.5
      const edgeGrad = ctx.createRadialGradient(cx, cy, GAME_HEIGHT * 0.3, cx, cy, GAME_HEIGHT * 0.9)
      edgeGrad.addColorStop(0, 'rgba(0,0,0,0)')
      edgeGrad.addColorStop(1, `rgba(0,0,0,${edgeDark})`)
      ctx.fillStyle = edgeGrad
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

      // HUD: "Level: 25/NaN" replacing the normal level display
      ctx.font = 'bold 11px monospace'
      ctx.fillStyle = `rgba(255, 80, 80, ${Math.min(1, collapseProgress * 3)})`
      ctx.textAlign = 'right'
      ctx.fillText('Level: 25/NaN', GAME_WIDTH - 10, 20)

      // Text overlay — fades in as collapse progresses
      const textAlpha = Math.max(0, collapseProgress - 0.25) * 1.33
      if (textAlpha > 0) {
        ctx.globalAlpha = textAlpha
        ctx.textAlign = 'center'

        ctx.font = 'bold 22px monospace'
        ctx.fillStyle = '#ff2244'
        ctx.fillText('AGI REACHED', cx, cy - vortexRadius - 24)

        ctx.font = '12px monospace'
        ctx.fillStyle = '#cc88ff'
        ctx.fillText('SINGULARITY IMMINENT', cx, cy - vortexRadius - 6)
      }

      // Late-stage hint: faint arrow pointing back to start
      if (goalTeleportTimer > 120 && goalTeleportTimer < 300) {
        const hintAlpha = Math.min(1, (goalTeleportTimer - 120) / 60) * 0.6
        ctx.globalAlpha = hintAlpha
        ctx.font = '10px monospace'
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'left'
        ctx.fillText('<--- ??', T * 0.5, G - 48)
      }

      ctx.globalAlpha = 1
      ctx.textAlign = 'left'
      ctx.restore()
    },
  }
}
