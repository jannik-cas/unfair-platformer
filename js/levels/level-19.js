import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

// Shadow offset constants
const SHADOW_DX = T * 2
const SHADOW_DY = -T

export function createLevel() {
  return {
    name: 'Shadow Deploy',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // Start (both shadow and production match here)
      createPlatform(0, G, T * 3, T, 'solid'),

      // PRODUCTION PATH (visible but FAKE)
      createPlatform(T * 4, G - T, T * 3, T, 'fake'),
      createPlatform(T * 8, G - T * 2, T * 3, T, 'fake'),
      createPlatform(T * 12, G - T, T * 3, T, 'fake'),
      createPlatform(T * 16, G, T * 3, T, 'fake'),

      // REAL PATH (solid — shadows show these at offset positions)
      createPlatform(T * 4, G, T * 3, T, 'solid'),
      createPlatform(T * 7.5, G - T * 1.5, T * 3, T, 'solid'),
      createPlatform(T * 11, G, T * 3, T, 'solid'),
      createPlatform(T * 14.5, G - T, T * 3, T, 'solid'),

      // Goal platform (both match)
      createPlatform(T * 18, G, T * 3, T, 'solid'),
    ],

    spikes: [
      // Under the fake elevated platforms (fall through and die)
      createSpike(T * 5, G + T - 16, T, 16, {}),
      createSpike(T * 9, G + T - 16, T * 2, 16, {}),
      createSpike(T * 13, G + T - 16, T, 16, {}),
    ],

    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 0.5, y: G - 56, text: 'Shadow Deploy' },
      { x: T * 0.5, y: G - 36, text: 'A/B-Test aktiv' },
    ],

    goals: [
      createGoal(T * 19, G - 32, false),
    ],

    customRender(level, ctx) {
      // Draw shadow outlines of REAL (solid) platforms at offset position
      ctx.save()
      ctx.globalAlpha = 0.18
      ctx.strokeStyle = '#00ff88'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])

      for (const plat of level.platforms) {
        if (plat.type === 'fake') continue
        const sx = plat.x + SHADOW_DX
        const sy = plat.y + SHADOW_DY
        ctx.strokeRect(sx, sy, plat.w, plat.h)

        ctx.fillStyle = 'rgba(0, 255, 136, 0.06)'
        ctx.fillRect(sx, sy, plat.w, plat.h)
      }

      // Shadow label
      ctx.globalAlpha = 0.25
      ctx.setLineDash([])
      ctx.font = '8px monospace'
      ctx.fillStyle = '#00ff88'
      ctx.textAlign = 'left'
      ctx.fillText('shadow:canary', 10, 470)

      ctx.restore()
    },
  }
}
