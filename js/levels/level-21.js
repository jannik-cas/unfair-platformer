import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createCrawler, createFloater } from '../entities/enemy.js'
import { GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

// Phase offset so the floater's sine wave puts it ABOVE the platform path
// when the player arrives at normal walking pace (~3.2 px/frame) from x=T*14.
// Player reaches x=T*14 at roughly frame 130 from level start.
// We want sin(130 * 0.04 + PHASE) ≈ 1 (floater at maximum positive X offset,
// i.e. fully to the right — out of the narrow corridor).
// sin(θ) = 1 → θ = π/2 → PHASE = π/2 − 130*0.04 ≈ 1.571 − 5.2 ≈ -3.63
// Use -3.63 so at arrival the floater is swinging away rightward.
const FLOATER_PHASE = -3.63

export function createLevel() {
  return {
    name: 'Adversarial Inputs',

    playerStart: { x: 32, y: G - 24 },

    platforms: [
      // Start ground
      createPlatform(0, G, T * 4, T, 'solid'),

      // Lower crawler platform — one tile above ground so gap below is spiked
      createPlatform(T * 5, G - T, T * 4, T, 'solid'),

      // Higher platform — ONLY reachable by stomping the lower crawler for bounce
      createPlatform(T * 10, G - T * 3, T * 3, T, 'solid'),

      // Gap with spikes below (no platform here — player must clear the gap)

      // Floater corridor platform — one tile raised, narrow landing
      createPlatform(T * 14, G - T, T * 2, T, 'solid'),

      // Final stretch
      createPlatform(T * 18, G, T * 6, T, 'solid'),
    ],

    spikes: [
      // Spike pit between the lower crawler platform and the higher platform
      createSpike(T * 9, G - T, T * 1, T, { direction: 'up' }),
      createSpike(T * 13, G - T, T * 1, T, { direction: 'up' }),

      // Spikes on the ground under the floater corridor (punishes falling)
      createSpike(T * 15, G - T, T * 2, T, { direction: 'up' }),
      createSpike(T * 16, G - T, T * 2, T, { direction: 'up' }),
    ],

    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 0.5, y: G - 48, text: 'Vermeide alle Feinde!' },
      { x: T * 14, y: G - T - 48, text: 'Vertrau dem Modell!' },
      { x: T * 20, y: G - 36, text: 'Adversarial Attack erkannt!' },
    ],

    goals: [
      // Fake goal — kills on touch, placed just before the real one as a decoy
      createGoal(T * 20, G - 32, true, { killOnTouch: true }),
      // Real goal at far end
      createGoal(T * 23, G - 32, false),
    ],

    enemies: [
      // Crawler 1 — patrols the lower platform, must be stomped for bounce
      createCrawler(T * 5.5, G - T - 16, T * 5, T * 8.5, 1),

      // Crawler 2 — patrols the higher platform
      createCrawler(T * 10.5, G - T * 3 - 16, T * 10, T * 13, 1.2),

      // Floater — oscillates horizontally across the narrow corridor.
      // At normal walking pace the player arrives when the floater swings clear.
      createFloater(T * 15, G - T * 3, 50, 0.04, FLOATER_PHASE),
    ],

    pickups: [],

    customUpdate: null,
    customRender: null,
    customPostRender: null,
  }
}
