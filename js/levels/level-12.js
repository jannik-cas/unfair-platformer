import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createGravityZone } from '../traps/gravity-flip.js'
import { GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

// Level 12 — Frozen Layers
//
// First level with icy platforms. Ice kills through subtlety:
// the player's stopping distance is much longer than expected,
// so they slide into spikes or off platform edges.
//
// Screen: 800px wide (T*25), GAME_HEIGHT=480, G=448, T=32
//
// Section 1 (x: 0..T*9):
//   Solid start → long icy platform ending at a spike wall.
//   Player must learn to brake early. Sign warns "Frozen!".
//
// Section 2 (x: T*9..T*19):
//   Solid checkpoint → two narrow icy platforms over a spike pit.
//   Must feather movement to avoid sliding off either edge.
//
// Section 3 (x: T*19..T*25):
//   Solid approach → gravity flip zone lifts player to icy ceiling →
//   slides along ceiling → gravity restore drops to goal platform.
//   Sign "No grad!" hints at frozen/no-gradient learning.
//
// Geometry constraints:
//   Max safe gap     ≤ 2.5*T = 80 px  ✓
//   Min platform     ≥ 2.5*T = 80 px  ✓
//   All x + width    ≤ 800 px (T*25)  ✓
//   Gravity zone flipTo:-1 inverts gravity (player falls upward).
//   Gravity zone flipTo:1 restores gravity (player falls downward).

export function createLevel() {
  return {
    name: 'Frozen Layers',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // === Section 1: Solid start + long icy platform ===

      // Solid start: x=0..T*3 (96px ≥ 80px ✓)
      createPlatform(0, G, T * 3, T, 'solid'),

      // Gap: T*3..T*4 = 32px ≤ 80px ✓
      // Icy platform: x=T*4..T*8 (128px ≥ 80px ✓)
      // Player must brake before the spike wall at T*8.
      createPlatform(T * 4, G, T * 4, T, 'icy'),

      // === Section 2: Solid checkpoint + two narrow icy platforms ===

      // Solid checkpoint: x=T*9..T*12 (96px ≥ 80px ✓)
      // Gap from spike wall: T*8..T*9 = 32px (jumpable) ✓
      createPlatform(T * 9, G, T * 3, T, 'solid'),

      // Gap: T*12..T*13 = 32px ≤ 80px ✓
      // Narrow icy platform #1: x=T*13..T*16 (96px ≥ 80px ✓), elevated 1T
      createPlatform(T * 13, G - T, T * 3, T, 'icy'),

      // Gap: T*16..T*17 = 32px ≤ 80px ✓ (spike pit below)
      // Narrow icy platform #2: x=T*17..T*19 (64px) — widen to 80px:
      // x=T*17..T*19.5 (80px ≥ 80px ✓), elevated 1T
      createPlatform(T * 17, G - T, T * 2.5, T, 'icy'),

      // === Section 3: Gravity flip section ===

      // Solid approach: x=T*19.5..T*22 (80px ≥ 80px ✓)
      // Gap from icy #2: T*19.5..T*19.5 = 0px (adjacent) ✓
      createPlatform(T * 19.5, G, T * 2.5, T, 'solid'),

      // Gravity zone (flip up) sits at T*21.5..T*23.5 (see gravityZones).
      // Player walks into zone, gravity inverts, player rises to ceiling.

      // Icy ceiling platform: x=T*21..T*24 (96px ≥ 80px ✓), y=0 (top).
      // Player lands upside-down and slides along the ceiling.
      createPlatform(T * 21, 0, T * 3, T, 'icy'),

      // Gravity restore zone sits at T*23..T*25 (see gravityZones).
      // Player drops back to the floor for the real goal.

      // Solid goal platform: x=T*22..T*25 (96px ≥ 80px ✓), x+w=800 ✓
      createPlatform(T * 22, G, T * 3, T, 'solid'),
    ],

    spikes: [
      // Section 1: spike wall at the end of the icy platform.
      // Two tiles tall so the player can't jump over at the last moment.
      createSpike(T * 8, G - T, T, T, { direction: 'up' }),
      createSpike(T * 8, G - T * 2, T, T, { direction: 'up' }),

      // Section 2: spike pit in the gap between the two narrow icy platforms.
      // Punishes sliding off either edge.
      createSpike(T * 16, G - T, T, T, { direction: 'up' }),

      // Section 3: hidden spike at the far end of the icy ceiling platform.
      // When upside-down the player slides into this; reveals only when close.
      createSpike(T * 23, T, T, T, { direction: 'down', type: 'hidden', revealDistance: 40 }),
    ],

    projectileSpawners: [],

    gravityZones: [
      // Section 3: flip gravity up. Tall zone catches the walking player.
      // x=T*21.5..T*23.5 (2T wide), y from G-T*4 to G (4T tall).
      createGravityZone(T * 21.5, G - T * 4, T * 2, T * 4, { flipTo: -1, visible: true }),

      // Flip gravity back down. Zone at ceiling where the upside-down player walks.
      // x=T*23..T*25 (2T wide), y from 0 to T*4 (4T tall). x+w=800 ✓
      createGravityZone(T * 23, 0, T * 2, T * 4, { flipTo: 1, visible: true }),
    ],

    controlZones: [],

    signs: [
      { x: T * 1, y: G - 36, text: 'Frozen!' },
      { x: T * 15, y: G - T - 36, text: 'No grad!' },
    ],

    goals: [
      // Real goal on the solid landing platform at the end.
      // x=T*23=736, y=G-32=416. x+32=768 ≤ 800 ✓
      createGoal(T * 23, G - 32, false),
    ],
  }
}
