import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createGravityZone } from '../traps/gravity-flip.js'
import { GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

export function createLevel() {
  return {
    name: 'Legacy Code Gravity',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // === Section 1: Floor start ===
      createPlatform(0, G, T * 6, T, 'solid'),
      createPlatform(0, 0, T * 6, T, 'solid'),

      // === Section 2: Walk on ceiling — dodge floor spikes below ===
      createPlatform(T * 6, 0, T * 5, T, 'solid'),

      // === Section 3: Flip back, narrow floor with ceiling spikes above ===
      createPlatform(T * 11, G, T * 4, T, 'solid'),
      createPlatform(T * 11, 0, T * 4, T, 'solid'),

      // === Section 4: Back to ceiling — gap in ceiling you must jump over ===
      createPlatform(T * 15, 0, T * 3, T, 'solid'),
      // gap!
      createPlatform(T * 19.5, 0, T * 3, T, 'solid'),

      // === Section 5: Final flip to floor for goal ===
      createPlatform(T * 22.5, G, T * 2.5, T, 'solid'),
    ],

    spikes: [
      // Floor spikes in section 2 (you're on the ceiling, these are below — fall = death)
      createSpike(T * 7, G, T, T),
      createSpike(T * 8, G, T, T),
      createSpike(T * 9, G, T, T),

      // Ceiling spikes in section 3 (you're on the floor — hidden surprise above)
      createSpike(T * 13, T, T, T, { direction: 'down', type: 'hidden', revealDistance: 60 }),

      // Floor spikes in section 4 gap area (don't fall off the ceiling!)
      createSpike(T * 17, G, T, T),
      createSpike(T * 18, G, T, T),
      createSpike(T * 19, G, T, T),
    ],

    projectileSpawners: [],

    gravityZones: [
      // Flip 1: Floor → Ceiling
      createGravityZone(T * 4, G - T * 4, T * 2, T * 4, { flipTo: -1, visible: true }),

      // Flip 2: Ceiling → Floor
      createGravityZone(T * 10, T, T * 1.5, T * 4, { flipTo: 1, visible: true }),

      // Flip 3: Floor → Ceiling (for the gap section)
      createGravityZone(T * 13.5, G - T * 4, T * 1.5, T * 4, { flipTo: -1, visible: true }),

      // Flip 4: Ceiling → Floor (for goal)
      createGravityZone(T * 21.5, T, T * 1.5, T * 4, { flipTo: 1, visible: true }),
    ],

    controlZones: [],

    signs: [
      { x: T * 2, y: G - 36, text: 'Weights OK' },
    ],

    goals: [
      createGoal(T * 23, G - 32, false),
    ],
  }
}
