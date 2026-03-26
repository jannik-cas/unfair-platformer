import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

export function createLevel() {
  return {
    name: 'Onboarding Day',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // === Section 1: The Betrayal ===
      // Long starting ground
      createPlatform(0, G, T * 6, T, 'solid'),

      // Tiny gap (1 tile) — fake platform over it says "Safe!"
      createPlatform(T * 6.5, G, T * 2, T, 'fake'),

      // Ground continues right after — easy jump even without the fake
      createPlatform(T * 7, G, T * 5, T, 'solid'),

      // === Section 2: Stepping Up ===
      // Wide, close platforms — easy jumps
      createPlatform(T * 13, G - T * 1.5, T * 3, T, 'solid'),
      createPlatform(T * 16.5, G - T * 3, T * 3, T, 'solid'),

      // FAKE platform that looks like the obvious next step
      createPlatform(T * 20, G - T * 4.5, T * 2, T, 'fake'),

      // Real path: keep going right at the same height
      createPlatform(T * 20, G - T * 3, T * 3, T, 'solid'),

      // === Section 3: The Ending ===
      // Wide final platform
      createPlatform(T * 22, G - T * 1, T * 3, T, 'solid'),
    ],

    spikes: [
      // One spike below the fake platform — punishes falling through
      createSpike(T * 7, G + T, T, T, { direction: 'up' }),

      // Hidden spike near the fake goal — gotcha!
      createSpike(T * 23.5, G - T * 2, T, T, { type: 'hidden', revealDistance: 50 }),
    ],

    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 2, y: G - 36, text: 'LGTM! ->' },
      { x: T * 6.8, y: G - 36, text: 'model.fit()' },
      { x: T * 13.5, y: G - T * 1.5 - 36, text: 'Epoch 1!' },
    ],

    goals: [
      // Fake goal on high ground — kills you
      createGoal(T * 20.5, G - T * 4.5 - 32, true, { killOnTouch: true }),
      // Real goal on the low path
      createGoal(T * 23.5, G - T * 1 - 32, false),
    ],
  }
}
