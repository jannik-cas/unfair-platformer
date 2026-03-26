import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createProjectileSpawner } from '../entities/projectile.js'
import { createFakeVictory, activateFakeUI } from '../traps/fake-ui.js'
import { GAME_WIDTH, GAME_HEIGHT, getCtx } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

export function createLevel() {
  const level = {
    name: 'Release Day?',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // Suspiciously easy flat ground
      createPlatform(0, G, T * 25, T, 'solid'),

      // One tiny step — that's it?
      createPlatform(T * 6, G - T * 1.5, T * 2.5, T, 'solid'),

      // "Goal" platform
      createPlatform(T * 9, G - T * 1, T * 3, T, 'solid'),

      // === After fake victory: survival run ===
      createPlatform(T * 14, G - T * 2, T * 3, T, 'solid'),
      createPlatform(T * 18, G - T * 1, T * 3, T, 'solid'),
      createPlatform(T * 22, G - T * 2, T * 3, T, 'solid'),
    ],

    spikes: [
      // Hidden spikes that appear during the "victory" celebration
      createSpike(T * 12, G - T, T, T, { type: 'hidden', revealDistance: 80 }),
      createSpike(T * 16, G - T, T, T, { type: 'hidden', revealDistance: 80 }),
    ],

    projectileSpawners: [
      // "Fireworks" after touching fake goal — slow and dodgeable
      createProjectileSpawner({
        x: T * 8, y: -10,
        vx: 0.3, vy: 2,
        triggerX: T * 9, interval: 40, offset: 0
      }),
      createProjectileSpawner({
        x: T * 15, y: -10,
        vx: -0.3, vy: 2,
        triggerX: T * 9, interval: 40, offset: 20
      }),
      createProjectileSpawner({
        x: T * 22, y: -10,
        vx: -0.5, vy: 2.5,
        triggerX: T * 14, interval: 50, offset: 0
      }),
    ],

    gravityZones: [],
    controlZones: [],
    signs: [],

    goals: [
      // Fake goal — triggers celebration
      createGoal(T * 10, G - T * 1 - 32, true, { killOnTouch: false }),

      // REAL goal — survive to the end
      createGoal(T * 23, G - T * 2 - 32, false),
    ],

    fakeUI: null,
    _victoryTriggered: false,
    _creditsStarted: false,
    _creditsOffset: 0,
    _creditLines: [
      'DDS: DEPLOY, DEBUG, SUFFER',
      '',
      'Developed by',
      'Data Driven Services',
      '',
      'QA Testing',
      'Die Krankenkassen (unfreiwillig)',
      '',
      'MOMENT MAL...',
      'Weiter nach rechts!',
    ],

    customUpdate(level, player, frame) {
      // Trigger fake victory on reaching the fake goal area
      for (const goal of level.goals) {
        if (goal.fake && goal.reached && !level._victoryTriggered) {
          level.fakeUI = activateFakeUI(createFakeVictory({
            message: 'RELEASE COMPLETE!',
            subMessage: 'Herzlichen Glückwunsch! ...oder doch nicht?'
          }))
          level._victoryTriggered = true
        }
      }

      // Dismiss after 3s, start credits
      if (level._victoryTriggered && level.fakeUI?.active && level.fakeUI.timer > 180) {
        level.fakeUI = { ...level.fakeUI, active: false }
        level._creditsStarted = true
      }

      if (level._creditsStarted) {
        level._creditsOffset += 0.4
      }
    },

    customRender(level, ctx) {
      if (!level._creditsStarted) return

      ctx.save()
      ctx.font = '16px monospace'
      ctx.textAlign = 'center'
      ctx.globalAlpha = 0.25
      ctx.fillStyle = '#fff'

      const lines = level._creditLines
      const lineHeight = 36
      const startY = GAME_HEIGHT - level._creditsOffset

      for (let i = 0; i < lines.length; i++) {
        const y = startY + i * lineHeight
        if (y < -20 || y > GAME_HEIGHT + 20) continue
        if (lines[i]) {
          ctx.fillText(lines[i], GAME_WIDTH / 2, y)
        }
      }

      ctx.restore()
    },
  }

  return level
}
