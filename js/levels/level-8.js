import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createFakeGameOver, activateFakeUI } from '../traps/fake-ui.js'
import { GAME_WIDTH, GAME_HEIGHT, getCtx } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

export function createLevel() {
  const level = {
    name: 'Hallucinating Metrics',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // === Section 1: Normal platforming to build trust ===
      createPlatform(0, G, T * 6, T, 'solid'),
      createPlatform(T * 7, G - T * 1.5, T * 3, T, 'solid'),
      createPlatform(T * 11, G, T * 3, T, 'solid'),

      // === Section 2: Fake game over zone — game "crashes" but keep playing! ===
      createPlatform(T * 11, G, T * 6, T, 'solid'),
      createPlatform(T * 15, G - T * 2, T * 3, T, 'solid'),

      // === Section 3: After the "crash" — continue right ===
      createPlatform(T * 18, G, T * 3, T, 'solid'),
      createPlatform(T * 21.5, G - T * 1.5, T * 3, T, 'solid'),
    ],

    spikes: [
      // Spike that looks like part of the "broken" game
      createSpike(T * 17, G - T, T, T, { type: 'hidden', revealDistance: 50 }),
    ],

    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 2, y: G - 36, text: 'Acc: 99.9%' },
    ],

    goals: [
      // Fake goal — triggers fake game over
      createGoal(T * 13, G - 32, true, { killOnTouch: false }),

      // Real goal at the end
      createGoal(T * 22.5, G - T * 1.5 - 32, false),
    ],

    fakeUI: null,
    _fakeTriggered: false,

    customUpdate(level, player, frame) {
      // Trigger fake game over when player reaches middle
      if (!level._fakeTriggered && player.x > T * 13 && !player.dead) {
        level.fakeUI = activateFakeUI(createFakeGameOver({
          message: 'PIPELINE FAILED',
          subMessage: 'Dein MLflow Experiment ist korrupt!',
          killOnClick: false
        }))
        level._fakeTriggered = true
      }

      // Auto-dismiss after 3 seconds — the player realizes the game still works
      if (level.fakeUI?.type === 'fake-gameover' && level.fakeUI.timer > 180) {
        level.fakeUI = { ...level.fakeUI, active: false }
      }
    },

    customRender(level, ctx) {
      // Fake "error popup" that floats across the screen — dodge it!
      if (level._fakeTriggered && level.frameCount > 200) {
        const popupAge = level.frameCount - 200
        if (popupAge < 300) {
          const px = T * 14 + Math.sin(popupAge * 0.02) * T * 3
          const py = G - T * 6 + Math.cos(popupAge * 0.03) * T * 2

          ctx.save()
          ctx.globalAlpha = 0.85

          ctx.fillStyle = '#f0f0f0'
          ctx.fillRect(px, py, 140, 60)
          ctx.strokeStyle = '#999'
          ctx.lineWidth = 2
          ctx.strokeRect(px, py, 140, 60)

          ctx.fillStyle = '#e44'
          ctx.fillRect(px, py, 140, 16)
          ctx.fillStyle = '#fff'
          ctx.font = '9px monospace'
          ctx.fillText('Error', px + 6, py + 12)

          ctx.fillStyle = '#333'
          ctx.font = '8px monospace'
          ctx.fillText('model.pkl not found', px + 8, py + 35)
          ctx.fillText('lol jk weiter deployen', px + 8, py + 48)

          ctx.restore()
        }
      }
    },
  }

  return level
}
