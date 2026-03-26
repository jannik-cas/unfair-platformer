import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

export function createLevel() {
  return {
    name: 'Dirty Data',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // === Section 1: Platform row with fakes ===
      createPlatform(0, G, T * 4, T, 'solid'),

      // Row of stepping platforms (small gaps, jumpable)
      createPlatform(T * 5, G - T, T * 2.5, T, 'solid'),
      createPlatform(T * 8, G - T, T * 2.5, T, 'solid'),
      createPlatform(T * 11, G - T, T * 2.5, T, 'fake'),     // FAKE — fall to your death!
      createPlatform(T * 14, G - T, T * 2.5, T, 'solid'),

      // === Section 2: Crumble run ===
      createPlatform(T * 16, G, T * 2.5, T, 'crumble', { shakeTime: 30 }),
      createPlatform(T * 19, G, T * 2.5, T, 'crumble', { shakeTime: 30 }),

      // Safe landing
      createPlatform(T * 22, G, T * 3, T, 'solid'),

      // === Section 3: Staircase to goal ===
      createPlatform(T * 23, G - T * 2, T * 2.5, T, 'solid'),
      createPlatform(T * 21, G - T * 4, T * 2.5, T, 'solid'),
      createPlatform(T * 23, G - T * 6, T * 2.5, T, 'solid'),
    ],

    spikes: [
      // Spikes below the fake platform — fall through = death. Learn to skip it!
      createSpike(T * 11, G, T, T),
      createSpike(T * 12, G, T, T),
      createSpike(T * 13, G, T, T),

      // Hidden spike at the top of the staircase
      createSpike(T * 24.5, G - T * 7, T, T, { type: 'hidden', revealDistance: 50 }),
    ],

    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 1, y: G - 36, text: 'Clean data!' },
      { x: T * 11.2, y: G - T - 36, text: 'Parsed!' },
    ],

    goals: [
      createGoal(T * 23.5, G - T * 6 - 32, false),
    ],
  }
}
