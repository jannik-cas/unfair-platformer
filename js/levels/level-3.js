import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createProjectileSpawner } from '../entities/projectile.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

export function createLevel() {
  return {
    name: 'Backprop Barrage',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // === Section 1: Peaceful walk, then ONE surprise fireball ===
      createPlatform(0, G, T * 8, T, 'solid'),

      // === Section 2: Platforming with triggered one-shot fireballs ===
      createPlatform(T * 9, G - T * 1.5, T * 3, T, 'solid'),
      createPlatform(T * 13, G - T * 1.5, T * 3, T, 'solid'),
      createPlatform(T * 17, G - T * 1.5, T * 3, T, 'solid'),

      // === Section 3: "Rest here" spot with rain ===
      createPlatform(T * 20, G - T * 3, T * 3, T, 'solid'),
      // Shelter platform above (safety from rain once you find it)
      createPlatform(T * 20, G - T * 7, T * 3, T, 'solid'),

      // === Final run to goal ===
      createPlatform(T * 23, G - T * 5, T * 2.5, T, 'solid'),
    ],

    spikes: [],

    projectileSpawners: [
      // Section 1: ONE fireball from the right when you reach the middle — "what was that?!"
      createProjectileSpawner({
        x: GAME_WIDTH + 10, y: G - T * 1.5,
        vx: -4, vy: 0,
        triggerX: T * 4, interval: 999, oneShot: true
      }),

      // Section 2: Each platform triggers a slow fireball from below — jump to dodge
      createProjectileSpawner({
        x: T * 10, y: G + 20,
        vx: 0, vy: -3,
        triggerX: T * 9.5, interval: 999, oneShot: true
      }),
      createProjectileSpawner({
        x: T * 14, y: G + 20,
        vx: 0, vy: -3,
        triggerX: T * 13.5, interval: 999, oneShot: true
      }),
      createProjectileSpawner({
        x: T * 18, y: G + 20,
        vx: 0, vy: -3,
        triggerX: T * 17.5, interval: 999, oneShot: true
      }),

      // Section 3: "Rest here" — gentle rain (slow, wide gaps between)
      createProjectileSpawner({
        x: T * 20.5, y: -10,
        vx: 0, vy: 2.5,
        triggerX: T * 20, interval: 50, offset: 0
      }),
      createProjectileSpawner({
        x: T * 22, y: -10,
        vx: 0, vy: 2.5,
        triggerX: T * 20, interval: 50, offset: 25
      }),
    ],

    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 2, y: G - 36, text: 'Forward!' },
      { x: T * 20.5, y: G - T * 3 - 36, text: 'Backward!' },
    ],

    goals: [
      createGoal(T * 23.5, G - T * 5 - 32, false),
    ],
  }
}
