import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createGravityZone } from '../traps/gravity-flip.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

// Level state
let loadingPhase = true
let loadingProgress = 0
let bsodPhase = false
let bsodTimer = 0
let overlayDone = false
let footprints = []

export function createLevel() {
  return {
    name: 'Der Letzte Push',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // Ground path
      createPlatform(0, G, T * 4, T, 'solid'),
      createPlatform(T * 4.5, G, T * 3, T, 'solid'),
      createPlatform(T * 8, G - T, T * 3, T, 'solid'),
      createPlatform(T * 11.5, G, T * 3, T, 'solid'),

      // Crumble platforms (floor falls away)
      createPlatform(T * 15, G, T * 3, T, 'crumble', { shakeTime: 15 }),
      createPlatform(T * 18.5, G, T * 3, T, 'crumble', { shakeTime: 15 }),

      // Fake goal platform
      createPlatform(T * 22, G, T * 3, T, 'solid'),

      // CEILING: hidden platforms for gravity-flipped path
      createPlatform(T * 11, 0, T * 4, T, 'solid'),
      createPlatform(T * 15.5, 0, T * 3, T, 'solid'),
      createPlatform(T * 19, 0, T * 3, T, 'solid'),
    ],

    spikes: [
      createSpike(T * 21.5, G - T, T, T, { type: 'hidden', revealDistance: 50 }),
      createSpike(T * 14.5, T, T, T, { direction: 'down' }),
    ],

    projectileSpawners: [],

    gravityZones: [
      createGravityZone(T * 12, G - T * 8, T * 1.5, T * 8, { flipTo: -1, visible: false }),
    ],

    controlZones: [],

    signs: [
      { x: T * 1, y: G - 36, text: 'Final push...' },
      { x: T * 9, y: G - T - 36, text: 'Achtung: Absturz' },
    ],

    goals: [
      createGoal(T * 23, G - 32, true, { killOnTouch: true }),
      createGoal(T * 20, 2, false),
    ],

    customUpdate(level, player, frame) {
      // Reset state on first frame
      if (level.frameCount === 1) {
        loadingPhase = true
        loadingProgress = 0
        bsodPhase = false
        bsodTimer = 0
        overlayDone = false
        footprints = []
      }

      // Phase 1: Fake loading bar
      if (loadingPhase) {
        loadingProgress = Math.min(1, loadingProgress + 0.005)
        if (loadingProgress >= 1) {
          loadingPhase = false
          bsodPhase = true
          bsodTimer = 240
        }
      }

      // Phase 2: BSOD
      if (bsodPhase) {
        bsodTimer -= 1

        // Track footprints if player moves during BSOD
        if (!player.dead && (Math.abs(player.vx || 0) > 0.5) && frame % 15 === 0) {
          footprints = [...footprints, { x: player.x, y: player.y + 18, alpha: 1 }]
        }

        if (bsodTimer <= 0) {
          bsodPhase = false
          overlayDone = true
        }
      }

      // Fade footprints
      footprints = footprints
        .map(f => ({ ...f, alpha: f.alpha - 0.008 }))
        .filter(f => f.alpha > 0)
    },

    customPostRender(level, ctx) {
      // Phase 1: Loading screen overlay
      if (loadingPhase) {
        ctx.save()
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

        ctx.font = '18px monospace'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#aaa'
        ctx.fillText('Deploying final model...', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30)

        // Progress bar
        ctx.fillStyle = '#333'
        ctx.fillRect(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2, 300, 20)
        ctx.fillStyle = '#4a90d9'
        ctx.fillRect(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2, 300 * loadingProgress, 20)

        ctx.font = '14px monospace'
        ctx.fillStyle = '#666'
        ctx.fillText(`${Math.floor(loadingProgress * 100)}%`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50)

        ctx.restore()
        return
      }

      // Phase 2: BSOD with footprint hints
      if (bsodPhase) {
        const alpha = bsodTimer > 220 ? (240 - bsodTimer) / 20
          : bsodTimer < 30 ? bsodTimer / 30
          : 1

        ctx.save()
        ctx.globalAlpha = alpha

        ctx.fillStyle = '#0000AA'
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

        ctx.font = 'bold 16px monospace'
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'left'

        const lines = [
          '*** STOP: 0xDEPLOYMENT_FATAL',
          '',
          'MODEL_CORRUPTION_IN_PRODUCTION',
          '',
          'Der finale Push hat das Modell zerst\u00F6rt.',
          'Pipeline: train \u2192 validate \u2192 deploy \u2192 ABSTURZ',
          '',
          'Die Realit\u00E4t l\u00E4uft noch. Kannst du sie sehen?',
          '',
          'Physical memory: model_weights.pkl CORRUPTED',
        ]

        let y = 80
        for (const line of lines) {
          ctx.fillText(line, 60, y)
          y += 22
        }

        // Blinking cursor
        if (Math.floor(bsodTimer / 20) % 2 === 0) {
          ctx.fillText('Warte auf Neustart... _', 60, y + 10)
        }

        // Draw footprints through the BSOD (the hint!)
        ctx.globalAlpha = 0.15
        for (const fp of footprints) {
          ctx.fillStyle = `rgba(255, 255, 255, ${fp.alpha * 0.3})`
          ctx.fillRect(fp.x, fp.y, 8, 4)
        }

        ctx.globalAlpha = 1
        ctx.restore()
      }
    },
  }
}
