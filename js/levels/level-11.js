import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

// Level 11 — Hyperparameter Tuning
//
// First level with bouncy platforms. The trap is in over-correction:
// bouncing sends the player high — past safe landing zones or into spikes.
//
// Section 1: Warm-up — two bouncy hops over a ground spike. Fair intro.
// Section 2: Bouncy platform with menacing ceiling spike. Bounce barely clears it.
//             Sign misleads with "lr=0.1?" (over-tuning).
// Section 3: Bouncy launch to fake goal on high platform (hidden spike guard).
//             Real goal on low solid platform past the fake.
//
// Geometry (T=32, G=448, screen=800px=T*25):
//   Max safe gap     ≤ 2.5*T = 80 px
//   Min platform     ≥ 2.5*T = 80 px

export function createLevel() {
  return {
    name: 'Hyperparameter Tuning',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // === Section 1: Solid start + two bouncy warm-up platforms ===
      // Solid start: 0..T*3 (96px)
      createPlatform(0, G, T * 3, T, 'solid'),

      // Bouncy #1: T*4..T*6.5 (80px). Gap=32px from solid end.
      createPlatform(T * 4, G - T, T * 2.5, T, 'bouncy'),

      // Bouncy #2: T*7.5..T*10 (80px). Spike at T*6.5..T*7.5 on ground between them.
      createPlatform(T * 7.5, G - T, T * 2.5, T, 'bouncy'),

      // === Section 2: Solid checkpoint, then bouncy under ceiling spike ===
      // Solid checkpoint: T*10..T*13 (96px). Gap=0 from bouncy #2 end.
      createPlatform(T * 10, G, T * 3, T, 'solid'),

      // Bouncy trap: T*13.5..T*16 (80px) at G-T*2. Gap=16px from solid.
      // Ceiling spike at y=T*5 looms above — bounce peak clears it by ~17px.
      createPlatform(T * 13.5, G - T * 2, T * 2.5, T, 'bouncy'),

      // Solid landing: T*16..T*18.5 (80px). Gap=0 from bouncy end.
      createPlatform(T * 16, G, T * 2.5, T, 'solid'),

      // === Section 3: Bouncy launch + fake/real goal ===
      // Bouncy launch pad: T*18.5..T*21 (80px) at G-T. Gap=0 from solid.
      createPlatform(T * 18.5, G - T, T * 2.5, T, 'bouncy'),

      // High fake-goal platform: T*19.5..T*22 (80px) at G-T*4.
      // Reachable via full bounce from launch pad. Hidden spike on top.
      createPlatform(T * 19.5, G - T * 4, T * 2.5, T, 'solid'),

      // Real goal platform: T*22..T*25 (96px) at G.
      createPlatform(T * 22, G, T * 3, T, 'solid'),
    ],

    spikes: [
      // Section 1: ground spike between the two bouncy platforms
      createSpike(T * 6.5, G - T, T, T, { direction: 'up' }),

      // Section 2: ceiling spike above bouncy trap — menacing but bounce clears it
      createSpike(T * 13.5, T * 5, T * 2.5, T, { direction: 'down' }),

      // Section 3: hidden spike on top of fake-goal high platform
      createSpike(T * 19.5, G - T * 5, T * 2.5, T, { type: 'hidden', revealDistance: 50 }),
    ],

    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 1, y: G - 36, text: 'ReLU!' },
      { x: T * 11, y: G - 36, text: 'lr=0.1?' },
    ],

    goals: [
      // Fake goal on the high platform (guarded by hidden spike)
      createGoal(T * 20.5, G - T * 4 - 32, true, { killOnTouch: false }),

      // Real goal on the low solid platform — easy to miss
      createGoal(T * 23, G - 32, false),
    ],
  }
}
