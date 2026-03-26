import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createControlZone } from '../traps/control-reverse.js'
import { GAME_WIDTH, GAME_HEIGHT, getCtx } from '../engine/canvas.js'
import { underworldVignette } from './underworld-shared.js'

const G = GAME_HEIGHT - 32
const T = 32

export function createLevel() {
  return {
    name: 'Backpropagation',

    // Start on the RIGHT, go LEFT
    playerStart: { x: T * 23, y: G - 24 },

    platforms: [
      // Right ground (start)
      createPlatform(T * 20, G, T * 5, T, 'solid'),

      // Stepping stones going left — generous sizes
      createPlatform(T * 17, G - T * 1, T * 2.5, T, 'solid'),
      createPlatform(T * 14, G - T * 0.5, T * 2.5, T, 'solid'),
      createPlatform(T * 11, G - T * 1.5, T * 3, T, 'solid'),
      createPlatform(T * 8, G - T * 1, T * 2.5, T, 'solid'),
      createPlatform(T * 5, G - T * 0.5, T * 2.5, T, 'solid'),

      // Left ground (goal)
      createPlatform(0, G, T * 4, T, 'solid'),
    ],

    spikes: [
      // A few spikes below gaps — not too many
      createSpike(T * 19, G + T, T, T, { direction: 'up' }),
      createSpike(T * 13, G + T, T, T, { direction: 'up' }),
      createSpike(T * 7, G + T, T, T, { direction: 'up' }),
    ],

    projectileSpawners: [],
    gravityZones: [],

    // Reversed controls the entire level — the core gimmick
    controlZones: [
      createControlZone(0, 0, GAME_WIDTH, GAME_HEIGHT, {
        reverseOnEnter: true,
        permanent: true,
        visible: false
      }),
    ],

    signs: [
      { x: T * 21, y: G - 36, text: '<-- Backward Pass' },
      { x: T * 11, y: G - T * 2 - 36, text: 'Links ist Rechts...' },
      { x: T * 1, y: G - 36, text: 'Ziel!' },
    ],

    goals: [
      createGoal(T * 1.5, G - 32, false),
    ],

    enemies: [],
    pickups: [],

    customRender(level, ctx) {
      // Draw direction arrows as visual hints (pointing left)
      ctx.save()
      ctx.globalAlpha = 0.15
      ctx.fillStyle = '#aa3333'
      for (let i = 0; i < 5; i++) {
        const ax = T * 6 + i * T * 4
        const ay = G - T * 4
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(ax + 20, ay - 12)
        ctx.lineTo(ax + 20, ay + 12)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
    },

    customPostRender(_level, ctx) {
      underworldVignette(ctx)
    },
  }
}
