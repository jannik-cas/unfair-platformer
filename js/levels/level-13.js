import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createProjectileSpawner } from '../entities/projectile.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'

// BSOD easter egg state
let bsodDeaths = 0
let bsodActive = false
let bsodTimer = 0
let prevDead = false
let postBsodGravityFlip = false

const G = GAME_HEIGHT - 32
const T = 32

export function createLevel() {
  return {
    name: 'Exploding Gradients',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // === Section 1: Solid start, then bouncy launch ===
      createPlatform(0, G, T * 3, T, 'solid'),
      createPlatform(T * 3, G - T, T * 3, T, 'bouncy'),

      // 1-tile gap, then solid landing
      createPlatform(T * 7, G, T * 3, T, 'solid'),

      // === Section 2: Moving platform followed by bouncy platform ===
      createPlatform(T * 10, G - T * 2, T * 3, T, 'moving', {
        endX: T * 10 + T * 2,
        endY: G - T * 2,
        speed: 1
      }),
      createPlatform(T * 14, G - T, T * 3, T, 'bouncy'),

      // === Section 3: High bouncy platform ===
      createPlatform(T * 18, G - T * 3, T * 3, T, 'bouncy'),

      // Wide solid landing with goals
      createPlatform(T * 21, G, T * 4, T, 'solid'),
    ],

    spikes: [
      // Punish landing on the wrong side of section 1 gap
      createSpike(T * 6, G - T, T, T, {}),
    ],

    projectileSpawners: [
      // Section 1: one-shot slow fireball from the right when player reaches bouncy
      createProjectileSpawner({
        x: GAME_WIDTH + 10, y: G - T * 2,
        vx: -2, vy: 0,
        triggerX: T * 4, interval: 999, oneShot: true, offset: 0
      }),

      // Section 2: rain from above, triggered when player passes T*9
      createProjectileSpawner({
        x: T * 11, y: -10,
        vx: 0, vy: 2,
        triggerX: T * 9, interval: 50, offset: 0
      }),
      createProjectileSpawner({
        x: T * 13, y: -10,
        vx: 0, vy: 2,
        triggerX: T * 9, interval: 50, offset: 25
      }),

      // Section 3: cross-fire around the high bouncy platform
      createProjectileSpawner({
        x: GAME_WIDTH + 10, y: G - T * 4,
        vx: -2.5, vy: 0,
        triggerX: T * 17, interval: 60, offset: 0
      }),
      createProjectileSpawner({
        x: T * 16, y: G - T * 5,
        vx: 2.5, vy: 0,
        triggerX: T * 17, interval: 60, offset: 30
      }),
    ],

    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 1, y: G - 36, text: 'grad=1e38' },
      { x: T * 11, y: G - T * 2 - 36, text: 'Clip it!' },
    ],

    goals: [
      createGoal(T * 22, G - 32, true),
      createGoal(T * 24, G - 32, false),
    ],

    customUpdate(level, player) {
      // Reset BSOD state when level first loads
      if (level.frameCount === 1) {
        bsodDeaths = 0
        bsodActive = false
        bsodTimer = 0
        prevDead = false
        postBsodGravityFlip = false
      }

      // Detect death transitions
      if (player.dead && !prevDead) {
        bsodDeaths += 1
        if (bsodDeaths === 5) {
          bsodActive = true
          bsodTimer = 240
        }
      }

      // Apply post-BSOD gravity flip on respawn
      if (prevDead && !player.dead && postBsodGravityFlip) {
        level.gravityDir = -1
        postBsodGravityFlip = false
      }

      prevDead = player.dead

      if (bsodActive) {
        bsodTimer -= 1
        if (bsodTimer <= 0) {
          bsodActive = false
          postBsodGravityFlip = true
        }
      }
    },

    customRender(level, ctx) {
      if (!bsodActive) return

      const alpha = bsodTimer > 220 ? (240 - bsodTimer) / 20 : bsodTimer < 30 ? bsodTimer / 30 : 1

      ctx.save()
      ctx.globalAlpha = alpha

      // Blue screen
      ctx.fillStyle = '#0000AA'
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

      ctx.font = 'bold 16px monospace'
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'left'
      const x = 60
      let y = 80

      const lines = [
        '*** STOP: 0x000000NaN',
        '',
        'GRADIENT_OVERFLOW_EXCEPTION',
        '',
        'Tensor dimensions: [batch, \u221E, \u221E, pain]',
        'lr=0.1  momentum=too_much  epoch=NaN',
        '',
        'Stack: backprop.js \u2192 loss.js \u2192 hope.js \u2192 /dev/null',
        '',
        'Physical memory dump:',
        '  0x00: 3.402823e+38  0x04: NaN        0x08: -Infinity',
        '  0x0C: 0.000000e+00  0x10: undefined  0x14: NaN',
        '',
      ]

      for (const line of lines) {
        ctx.fillText(line, x, y)
        y += 22
      }

      // Blinking "press F5" line
      ctx.font = '14px monospace'
      ctx.fillStyle = '#aaa'
      if (Math.floor(bsodTimer / 20) % 2 === 0) {
        ctx.fillText('Dr\u00FCcke F5 zum Neustart... _', x, y + 10)
      } else {
        ctx.fillText('Dr\u00FCcke F5 zum Neustart...', x, y + 10)
      }

      ctx.globalAlpha = 1
      ctx.restore()
    },
  }
}
