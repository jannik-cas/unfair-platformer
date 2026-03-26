import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

// Easter egg state
let deathCount = 0
let epochMsg = 0
let prevDead = false

export function createLevel() {
  return {
    name: 'Overfitting Trap',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // Starting ground
      createPlatform(0, G, T * 3, T, 'solid'),

      // CYCLE 1-4: identical segments (2.5T wide, 1T gap)
      createPlatform(T * 4, G, T * 2.5, T, 'solid'),
      createPlatform(T * 7.5, G, T * 2.5, T, 'solid'),
      createPlatform(T * 11, G, T * 2.5, T, 'solid'),
      createPlatform(T * 14.5, G, T * 2.5, T, 'solid'),

      // CYCLE 5: THE BREAK — gap is 2T instead of 1T
      // Hidden bouncy platform is the only way across
      createPlatform(T * 19.5, G, T * 2.5, T, 'solid'),

      // Hidden bouncy in the wider gap
      createPlatform(T * 17.5, G - T * 0.5, T * 1.5, T, 'bouncy'),

      // Goal platform
      createPlatform(T * 22.5, G, T * 2.5, T, 'solid'),
    ],

    spikes: [
      // Cycles 1-4: spike always at right edge of each segment
      createSpike(T * 6, G - T, T, T, {}),
      createSpike(T * 9.5, G - T, T, T, {}),
      createSpike(T * 13, G - T, T, T, {}),
      createSpike(T * 16.5, G - T, T, T, {}),

      // CYCLE 5: spike shifted 1T left from expected position
      createSpike(T * 20.5, G - T, T, T, {}),
    ],

    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 1, y: G - 36, text: 'R\u00B2=0.99' },
      { x: T * 15, y: G - 36, text: 'Testdaten...' },
    ],

    goals: [
      createGoal(T * 18, G - 32, true, { killOnTouch: true }),
      createGoal(T * 23.5, G - 32, false),
    ],

    customUpdate(level, player) {
      // Reset on first frame
      if (level.frameCount === 1) {
        deathCount = 0
        epochMsg = 0
        prevDead = false
      }

      if (player.dead && !prevDead) {
        deathCount += 1
        if (deathCount === 4) {
          epochMsg = 180
        }
      }
      prevDead = player.dead

      if (epochMsg > 0) epochMsg -= 1
    },

    customRender(level, ctx) {
      if (epochMsg <= 0) return

      ctx.save()
      ctx.globalAlpha = Math.min(1, epochMsg / 30)
      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#f1c40f'
      ctx.fillText(
        'Epoche 4 abgeschlossen. Generalisierung: mangelhaft.',
        GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60
      )
      ctx.restore()
    },
  }
}
