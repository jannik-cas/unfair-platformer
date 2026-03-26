import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createFloater, createCrawler } from '../entities/enemy.js'
import { createPickup } from '../entities/pickup.js'
import { setReversed } from '../engine/input.js'
import { GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

// Per-level mutable state (reset on level load)
let fakeKey1Collected = false
let fakeKey2Collected = false
let hubFloaterSpawned = false
let controlsReversedPermanent = false

export function createLevel() {
  // Reset state whenever level is (re)created
  fakeKey1Collected = false
  fakeKey2Collected = false
  hubFloaterSpawned = false
  controlsReversedPermanent = false

  return {
    name: 'Feature Engineering',

    playerStart: { x: T * 12 + 8, y: G - 24 },

    platforms: [
      // --- Hub ground ---
      createPlatform(0, G, T * 25, T, 'solid'),

      // --- Locked door: only opens with real_key ---
      createPlatform(T * 12, G - T * 4, T * 3, T, 'locked', { keyId: 'real_key' }),

      // ----------------------------------------------------------------
      // Branch Left (T*2 – T*5): staircase upward
      // ----------------------------------------------------------------
      createPlatform(T * 2, G - T * 2, T * 2, T, 'solid'),
      createPlatform(T * 3, G - T * 4, T * 2, T, 'solid'),
      createPlatform(T * 2, G - T * 6, T * 2, T, 'solid'),

      // ----------------------------------------------------------------
      // Branch Center (T*10 – T*14): spiked staircase
      // ----------------------------------------------------------------
      createPlatform(T * 10, G - T * 2, T * 2, T, 'solid'),
      createPlatform(T * 11, G - T * 4, T * 2, T, 'solid'),

      // ----------------------------------------------------------------
      // Branch Right (T*19 – T*23): deprecated path
      // Visible platform is fake — hidden platform below holds real key
      // ----------------------------------------------------------------
      createPlatform(T * 19, G - T * 2, T * 2, T, 'solid'),
      createPlatform(T * 20, G - T * 4, T * 2, T, 'solid'),
      // "Dead end" fake platform
      createPlatform(T * 21, G - T * 6, T * 2, T, 'fake'),
      // Hidden platform just below the fake one — leads to real key
      createPlatform(T * 21, G - T * 4, T * 2, T, 'hidden'),
    ],

    spikes: [
      // Center branch: spikes on the second step make timing awkward
      createSpike(T * 11, G - T * 2 - T, T, T, { direction: 'up' }),
    ],

    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      // Hub
      { x: T * 12.5, y: G - 36, text: 'Welcher Key passt?' },

      // Branch left
      { x: T * 2, y: G - T * 2 - 36, text: 'Feature A: Validated' },

      // Branch center
      { x: T * 10, y: G - 36, text: 'Feature B: Correlated' },

      // Branch right entrance
      { x: T * 19, y: G - 36, text: 'Dieser Branch ist deprecated' },
      { x: T * 19, y: G - T * 2 - 36, text: 'Feature C: Deprecated' },
    ],

    goals: [
      // Fake goal — visible past locked door, kills on touch
      createGoal(T * 15.5, G - T * 4 - 32, true, { killOnTouch: true }),
      // Real goal — above/behind the locked door
      createGoal(T * 13, G - T * 6 - 32, false),
    ],

    enemies: [],

    pickups: [
      // Branch Left top: fake key 1
      createPickup(T * 2 + 8, G - T * 6 - 16, 'key', { keyId: 'fake_key_1' }),

      // Branch Center step: fake key 2
      createPickup(T * 11 + 8, G - T * 4 - 16, 'key', { keyId: 'fake_key_2' }),

      // Branch Right hidden platform: real key
      createPickup(T * 21 + 8, G - T * 4 - 16, 'key', { keyId: 'real_key' }),
    ],

    customUpdate(level, player) {
      // Re-apply permanent reversal every frame if it was triggered
      if (controlsReversedPermanent) {
        setReversed(true)
      }

      for (const pickup of level.pickups) {
        if (!pickup.collected) continue

        if (pickup.keyId === 'fake_key_1' && !fakeKey1Collected) {
          fakeKey1Collected = true

          // Punish: spawn a floater near the hub to harass the player
          if (!hubFloaterSpawned) {
            hubFloaterSpawned = true
            level.enemies = [
              ...level.enemies,
              createFloater(T * 13, G - T * 5, 60, 0.05, 0),
            ]
          }
        }

        if (pickup.keyId === 'fake_key_2' && !fakeKey2Collected) {
          fakeKey2Collected = true
          controlsReversedPermanent = true
          setReversed(true)
        }
      }
    },

    customRender: null,
    customPostRender: null,
  }
}
