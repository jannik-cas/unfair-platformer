import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createProjectileSpawner } from '../entities/projectile.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'

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
  }
}
