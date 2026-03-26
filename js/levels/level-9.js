import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createProjectileSpawner } from '../entities/projectile.js'
import { createGravityZone } from '../traps/gravity-flip.js'
import { createControlZone } from '../traps/control-reverse.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

export function createLevel() {
  return {
    name: 'Production Inference',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // Start
      createPlatform(0, G, T * 3, T, 'solid'),

      // === Zone A: Fake platforms (callback to Level 2) ===
      createPlatform(T * 4, G - T * 1, T * 2.5, T, 'fake'),
      createPlatform(T * 4, G, T * 2.5, T, 'solid'),      // real is below
      createPlatform(T * 7, G, T * 3, T, 'solid'),

      // === Zone B: Crumble + one fireball (Levels 2+3) ===
      createPlatform(T * 10.5, G - T * 1.5, T * 3, T, 'crumble', { shakeTime: 25 }),
      createPlatform(T * 14, G, T * 3, T, 'solid'),

      // === Zone C: Gravity flip (Level 4) ===
      createPlatform(T * 14, 0, T * 5, T, 'solid'),  // ceiling
      createPlatform(T * 17, G, T * 3, T, 'solid'),

      // === Zone D: Reversed controls (Level 5) ===
      createPlatform(T * 20.5, G - T * 1.5, T * 2.5, T, 'solid'),
      createPlatform(T * 23, G, T * 2.5, T, 'solid'),
    ],

    spikes: [
      // Zone A: spike to punish trusting the fake
      createSpike(T * 5, G - T * 2, T, T, { type: 'hidden', revealDistance: 40 }),

      // Zone C: ceiling spike (watch out when flipped)
      createSpike(T * 16, T, T, T, { direction: 'down' }),
    ],

    projectileSpawners: [
      // Zone B: one fireball from the right during crumble crossing
      createProjectileSpawner({
        x: GAME_WIDTH + 10, y: G - T * 2,
        vx: -3, vy: 0,
        triggerX: T * 11, interval: 999, oneShot: true
      }),
    ],

    gravityZones: [
      // Zone C: flip up (tall enough to reach player on floor)
      createGravityZone(T * 15, G - T * 4, T * 1.5, T * 4, { flipTo: -1, visible: true }),
      // Zone C: flip back down (starts at ceiling where upside-down player walks)
      createGravityZone(T * 17.5, T, T * 1.5, T * 4, { flipTo: 1, visible: true }),
    ],

    controlZones: [
      // Zone D: reversed controls for the last two platforms
      createControlZone(T * 20, 0, T * 4, GAME_HEIGHT, { reverseOnEnter: true }),
    ],

    signs: [
      { x: T * 1, y: G - 36, text: 'Inference!' },
      { x: T * 4.2, y: G - T - 36, text: 'Predict!' },
    ],

    goals: [
      createGoal(T * 23.5, G - 32, false),
    ],
  }
}
