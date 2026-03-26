import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createProjectileSpawner } from '../entities/projectile.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

// Hint state
let hintDeaths = 0
let hintPrevDead = false
let hintAlpha = 0

const HINTS = [
  null,
  null,
  null,
  'Vielleicht ist rechts nicht die Antwort...',
  'git revert HEAD — was bedeutet das?',
  'Geh zur\u00FCck. Wirklich zur\u00FCck.',
  '\u2190 \u2190 \u2190',
]

export function createLevel() {
  return {
    name: 'Rollback Strategy',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // Ground extends LEFT offscreen — the secret path
      createPlatform(-T * 4, G, T * 8, T, 'solid'),

      // === RIGHT PATH (THE TRAP) ===
      createPlatform(T * 5, G, T * 3, T, 'solid'),
      createPlatform(T * 8.5, G - T, T * 3, T, 'fake'),
      createPlatform(T * 8.5, G, T * 3, T, 'solid'),
      createPlatform(T * 12, G, T * 3, T, 'crumble', { shakeTime: 12 }),
      createPlatform(T * 15.5, G - T * 1.5, T * 3, T, 'solid'),
      createPlatform(T * 19, G, T * 3, T, 'solid'),
      createPlatform(T * 22, G - T * 1.5, T * 3, T, 'solid'),
    ],

    spikes: [
      createSpike(T * 11.5, G - T, T, T, {}),
      createSpike(T * 18, G - T, T, T, { type: 'hidden', revealDistance: 50 }),
      createSpike(T * 21, G - T, T, T, {}),
    ],

    projectileSpawners: [
      createProjectileSpawner({
        x: GAME_WIDTH + 10, y: G - T * 2,
        vx: -2, vy: 0,
        triggerX: T * 10, interval: 45, offset: 0
      }),
    ],

    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 0.5, y: G - 36, text: 'git revert HEAD' },
      { x: T * 9, y: G - T - 36, text: 'Deploy ->' },
      { x: T * 16, y: G - T * 1.5 - 36, text: 'Prod ready!' },
    ],

    goals: [
      createGoal(T * 23, G - T * 1.5 - 32, true, { killOnTouch: true }),
      createGoal(-T * 2, G - 32, false),
    ],

    customUpdate(level, player) {
      if (level.frameCount === 1) {
        hintDeaths = 0
        hintPrevDead = false
        hintAlpha = 0
      }

      if (player.dead && !hintPrevDead) {
        hintDeaths += 1
      }
      hintPrevDead = player.dead

      // Fade hint in/out
      const hintIndex = Math.min(hintDeaths, HINTS.length - 1)
      if (HINTS[hintIndex] && !player.dead) {
        hintAlpha = Math.min(1, hintAlpha + 0.015)
      } else {
        hintAlpha = Math.max(0, hintAlpha - 0.03)
      }
    },

    customRender(level, ctx) {
      const hintIndex = Math.min(hintDeaths, HINTS.length - 1)
      const text = HINTS[hintIndex]
      if (!text || hintAlpha <= 0) return

      ctx.save()
      ctx.globalAlpha = hintAlpha * 0.7
      ctx.font = '13px monospace'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#f1c40f'
      ctx.fillText(text, GAME_WIDTH / 2, 60)
      ctx.restore()
    },
  }
}
