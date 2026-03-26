import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

export function createLevel() {
  return {
    name: 'Vanishing Gradients',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // === Section 1: Disappearing platform intro ===
      createPlatform(0, G, T * 4, T, 'solid'),

      // Generous timing — clearly alternating rhythm
      createPlatform(T * 5, G - T, T * 3, T, 'disappearing', { onTime: 100, offTime: 40, offset: 0 }),
      createPlatform(T * 9, G - T, T * 3, T, 'disappearing', { onTime: 100, offTime: 40, offset: 70 }),

      // Safe checkpoint
      createPlatform(T * 13, G, T * 3, T, 'solid'),

      // === Section 2: Tighter but clearly staggered ===
      createPlatform(T * 16.5, G - T, T * 3, T, 'disappearing', { onTime: 80, offTime: 40, offset: 0 }),
      createPlatform(T * 19.5, G - T, T * 3, T, 'disappearing', { onTime: 80, offTime: 40, offset: 60 }),

      // === Section 3: Fake path vs real path ===
      // Visible platform — FAKE! Sign says "Almost there!"
      createPlatform(T * 22.5, G - T * 2, T * 2.5, T, 'fake'),

      // Real path: ground level, walk right
      createPlatform(T * 22, G, T * 3.5, T, 'solid'),
    ],

    spikes: [
      // Pit between disappearing platforms
      createSpike(T * 8, G, T, T),
      createSpike(T * 12, G, T, T),

      // Under the tighter section
      createSpike(T * 19, G, T, T),

      // Spike above the real path — punishes jumping to the fake platform
      createSpike(T * 23, G - T * 3, T, T, { type: 'hidden', revealDistance: 40 }),
    ],

    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 1, y: G - 36, text: 'Loss: 0.01' },
      { x: T * 22.8, y: G - T * 2 - 36, text: 'Overfitting!' },
    ],

    goals: [
      createGoal(T * 24, G - 32, false),
    ],
  }
}
