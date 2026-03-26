import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createControlZone } from '../traps/control-reverse.js'
import { GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

export function createLevel() {
  return {
    name: 'Inverted Labels',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // === Section 1: Normal controls — build confidence ===
      createPlatform(0, G, T * 6, T, 'solid'),
      createPlatform(T * 7, G - T * 1.5, T * 3, T, 'solid'),
      createPlatform(T * 11, G, T * 3, T, 'solid'),

      // === Section 2: Reversal! Big flat run to discover it ===
      createPlatform(T * 14, G, T * 5, T, 'solid'),

      // === Section 3: Simple forward hops, but reversed ===
      // Wide platforms, small gaps — the reversal is the whole challenge
      createPlatform(T * 20, G - T * 1, T * 3, T, 'solid'),
      createPlatform(T * 24, G - T * 1, T * 3, T, 'solid'),
    ],

    spikes: [
      // Spike between the two reversed platforms — gap fall is punished
      createSpike(T * 23, G, T, T),
    ],

    projectileSpawners: [],
    gravityZones: [],

    controlZones: [
      // Silent reversal — covers the second half of the level
      createControlZone(T * 14, 0, T * 14, GAME_HEIGHT, { reverseOnEnter: true, visible: false }),
    ],

    signs: [
      { x: T * 2, y: G - 36, text: 'Labels OK!' },
      { x: T * 14.5, y: G - 36, text: '0 is now 1' },
    ],

    goals: [
      createGoal(T * 25.5, G - T - 32, false),
    ],
  }
}
