import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createProjectileSpawner } from '../entities/projectile.js'
import { GAME_WIDTH, GAME_HEIGHT, getCtx } from '../engine/canvas.js'
import { underworldVignette } from './underworld-shared.js'

const G = GAME_HEIGHT - 32
const T = 32

let standStillTimer = 0
let lastPlayerX = 0
let trapped = false

export function createLevel() {
  standStillTimer = 0
  lastPlayerX = 0
  trapped = false

  return {
    name: 'The Loss Landscape',

    playerStart: { x: T * 1.5, y: G - T * 3 - 24 },

    platforms: [
      // Loss curve shape — high start, valley, saddle, valley, fake end

      // Left peak (start)
      createPlatform(T * 1, G - T * 3, T * 2, T, 'solid'),

      // Descend into first valley — moving platform (oscillates down)
      createPlatform(T * 4, G - T * 2, T * 2, T, 'moving', {
        endX: T * 4, endY: G - T * 0.5, speed: 0.6
      }),

      // First local minimum — TRAP (fake goal here)
      createPlatform(T * 7, G, T * 2.5, T, 'solid'),

      // Climb out — bouncy platform
      createPlatform(T * 10, G - T * 1, T * 2, T, 'bouncy'),

      // SADDLE POINT — real goal (mid-height, the sweet spot)
      createPlatform(T * 13, G - T * 3.5, T * 2.5, T, 'solid'),

      // Descend into second valley — disappearing platform
      createPlatform(T * 16, G - T * 2, T * 2, T, 'disappearing', {
        onTime: 90, offTime: 45, offset: 0
      }),

      // Second local minimum — also a trap
      createPlatform(T * 19, G, T * 2.5, T, 'solid'),

      // Far right rise — fake goal bait
      createPlatform(T * 22, G - T * 2, T * 3, T, 'solid'),
    ],

    spikes: [
      // Valley floors are dangerous
      createSpike(T * 5, G + T, T, T, { direction: 'up' }),
      createSpike(T * 10.5, G + T, T, T, { direction: 'up' }),
      createSpike(T * 16.5, G + T, T, T, { direction: 'up' }),
      // Hidden spike on the right bait platform
      createSpike(T * 23, G - T * 3, T, T, { type: 'hidden', revealDistance: 40 }),
    ],

    projectileSpawners: [
      // Projectile from above the saddle — adds pressure to not linger
      createProjectileSpawner({
        x: T * 14, y: -10,
        vx: 0, vy: 2,
        triggerX: T * 12, interval: 120, offset: 60
      }),
    ],

    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 7.5, y: G - 36, text: 'Lokales Minimum!' },
      { x: T * 13.5, y: G - T * 3.5 - 36, text: 'Sattelpunkt!' },
      { x: T * 19.5, y: G - 36, text: 'Noch ein Minimum...' },
    ],

    goals: [
      // Fake goal in first valley — kills
      createGoal(T * 7.5, G - 32, true, { killOnTouch: true }),
      // Fake goal at far right — kills
      createGoal(T * 23, G - T * 2 - 32, true, { killOnTouch: true }),
      // REAL goal at the saddle point
      createGoal(T * 14, G - T * 3.5 - 32, false),
    ],

    enemies: [],
    pickups: [],

    customUpdate(level, player, _frame) {
      // Stand-still trap in valleys
      if (!player.dead && Math.abs(player.x - lastPlayerX) < 1) {
        standStillTimer += 1
      } else {
        standStillTimer = 0
        if (trapped) {
          trapped = false
          level.platforms = level.platforms.slice(0, 8)
        }
      }
      lastPlayerX = player.x

      if (standStillTimer === 90 && !player.dead && !trapped) {
        trapped = true
        const wallLeft = createPlatform(player.x - T, player.y - T * 3, T * 0.5, T * 4, 'solid')
        const wallRight = createPlatform(player.x + T, player.y - T * 3, T * 0.5, T * 4, 'solid')
        level.platforms = [...level.platforms, wallLeft, wallRight]
      }
    },

    customRender(_level, ctx) {
      // Draw the loss curve
      ctx.save()
      ctx.strokeStyle = '#aa3333'
      ctx.globalAlpha = 0.2
      ctx.lineWidth = 2
      ctx.beginPath()
      const pts = [
        [0, G - T * 4], [T * 2, G - T * 3], [T * 5, G - T * 1.5],
        [T * 8.5, G], [T * 11, G - T * 1], [T * 14, G - T * 3.5],
        [T * 17, G - T * 1.5], [T * 20.5, G], [T * 23, G - T * 2], [GAME_WIDTH, G - T * 3],
      ]
      for (let i = 0; i < pts.length; i++) {
        if (i === 0) ctx.moveTo(pts[i][0], pts[i][1])
        else ctx.lineTo(pts[i][0], pts[i][1])
      }
      ctx.stroke()

      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#aa3333'
      ctx.globalAlpha = 0.4
      ctx.fillText('Loss Landscape', GAME_WIDTH / 2, 20)

      if (standStillTimer > 50 && standStillTimer < 90) {
        ctx.fillStyle = '#ff4444'
        ctx.globalAlpha = 0.5 + Math.sin(standStillTimer * 0.3) * 0.3
        ctx.font = 'bold 14px monospace'
        ctx.fillText('BEWEG DICH!', GAME_WIDTH / 2, 45)
      }

      ctx.restore()
    },

    customPostRender(_level, ctx) {
      underworldVignette(ctx)
    },
  }
}
