import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

export function createLevel() {
  return {
    name: 'Sprint Review',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // === Section 1: Mover carries you toward spikes — jump off! ===
      createPlatform(0, G, T * 4, T, 'solid'),

      // Slow mover — plenty of time to react
      createPlatform(T * 5, G - T * 1.5, T * 3, T, 'moving', {
        endX: T * 12, endY: G - T * 1.5,
        speed: 0.7
      }),

      // Safe landing — jump here before the spikes
      createPlatform(T * 9, G - T * 3.5, T * 3, T, 'solid'),

      // === Section 2: Ride across a spike pit ===
      createPlatform(T * 12, G - T * 3.5, T * 3, T, 'moving', {
        endX: T * 18, endY: G - T * 3.5,
        speed: 0.8
      }),

      // Landing — wide and forgiving
      createPlatform(T * 17, G - T * 2, T * 4, T, 'solid'),

      // === Section 3: Elevator up to goal ===
      createPlatform(T * 21, G - T * 1, T * 2.5, T, 'moving', {
        endX: T * 21, endY: G - T * 7,
        speed: 1
      }),

      // Goal platform — wide
      createPlatform(T * 23, G - T * 6, T * 2.5, T, 'solid'),
    ],

    spikes: [
      // Wall the first mover heads toward
      createSpike(T * 13, G - T * 2.5, T, T, { direction: 'left' }),
      createSpike(T * 13, G - T * 1.5, T, T, { direction: 'left' }),

      // Spike pit under section 2 mover
      createSpike(T * 13, G, T, T),
      createSpike(T * 14, G, T, T),
      createSpike(T * 15, G, T, T),
      createSpike(T * 16, G, T, T),
    ],

    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 1, y: G - 36, text: 'Training...' },
      { x: T * 9.5, y: G - T * 3.5 - 36, text: 'Overfit!' },
    ],

    goals: [
      createGoal(T * 23.5, G - T * 6 - 32, false),
    ],
  }
}
