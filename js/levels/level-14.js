import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createControlZone } from '../traps/control-reverse.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

// Level 14 — Data Drift
//
// Icy platforms + a single control reversal zone. The trick:
// Section 1 builds confidence on ice. Section 2 reverses controls
// mid-slide on ice — the player drifts into spikes. Section 3 has
// NO reversal, but after learning section 2 the player over-corrects,
// expecting reversed controls that aren't there.
//
// Geometry (T=32, G=448, screen=800px=T*25):
//   Max gap ≤ 2.5T, min platform ≥ 2.5T

export function createLevel() {
  return {
    name: 'Data Drift',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // === Section 1: Confidence builder — solid + long icy ===
      // Solid start: 0..T*3 (96px)
      createPlatform(0, G, T * 3, T, 'solid'),

      // Icy runway: T*3.5..T*7 (112px) — learn ice physics, no danger
      createPlatform(T * 3.5, G, T * 3.5, T, 'icy'),

      // === Section 2: The reversal trap ===
      // Solid checkpoint: T*7.5..T*10 (80px) — breathing room
      createPlatform(T * 7.5, G, T * 2.5, T, 'solid'),

      // Icy runway with hidden reversal: T*10.5..T*14.5 (128px)
      // Reversal zone covers T*12..T*15 — player is sliding when it kicks in
      // Spike wall at the end punishes the drift
      createPlatform(T * 10.5, G, T * 4, T, 'icy'),

      // === Section 3: The bluff — NO reversal, but player expects one ===
      // Solid platform: T*15.5..T*18.5 (96px) — safe landing after spike
      createPlatform(T * 15.5, G, T * 3, T, 'solid'),

      // Icy platform: T*19..T*22 (96px) — looks like section 2 but controls
      // are NORMAL. Players who adapted to reversed controls over-correct.
      createPlatform(T * 19, G, T * 3, T, 'icy'),

      // Goal platform: T*22.5..T*25 (80px)
      createPlatform(T * 22.5, G, T * 2.5, T, 'solid'),
    ],

    spikes: [
      // Section 2: spike wall at the end of the reversed icy runway
      // Player slides into this when controls reverse — too late to stop on ice
      createSpike(T * 14.5, G - T, T, T, { direction: 'up' }),

      // Section 3: spike at the end of the bluff icy platform
      // Over-correcting players slide into this
      createSpike(T * 22, G - T, T, T, { direction: 'up' }),
    ],

    projectileSpawners: [],
    gravityZones: [],

    controlZones: [
      // Single reversal zone — covers latter half of the icy runway in section 2
      // Player is already sliding when they enter, can't stop on ice
      createControlZone(T * 11.5, 0, T * 2, GAME_HEIGHT, { reverseOnEnter: true, visible: false }),
    ],

    signs: [
      { x: T * 1, y: G - 36, text: 'Drift: 0%' },
      { x: T * 11, y: G - 36, text: 'Drift: 87%' },
    ],

    goals: [
      // Fake goal — prominent, kills on touch
      createGoal(T * 19.5, G - 32, true, { killOnTouch: true }),

      // Real goal — further right on the solid platform
      createGoal(T * 23.5, G - 32, false),
    ],
  }
}
