import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createGravityZone } from '../traps/gravity-flip.js'
import { createCrawler, createFloater } from '../entities/enemy.js'
import { createPickup } from '../entities/pickup.js'
import { GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

export function createLevel() {
  return {
    name: 'Transfer Learning',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // === Section 1: Familiar ground (echoes level 1) ===
      createPlatform(0, G, T * 4, T, 'solid'),

      // === Section 2: Level-1-style stepping up ===
      createPlatform(T * 5, G - T * 1, T * 2, T, 'solid'),
      createPlatform(T * 7.5, G - T * 2, T * 2, T, 'solid'),

      // === Section 3: The "impossible" gap (T*8 to T*12) ===
      // Looks like a 4-tile gap — but there's a hidden platform at T*10
      createPlatform(T * 10, G - T * 1, T * 1.5, T, 'solid'),

      // Land zone after the gap
      createPlatform(T * 12, G - T * 0, T * 3, T, 'solid'),

      // === Section 4: Disappearing platforms (echoes level 6) ===
      createPlatform(T * 15, G - T * 1, T * 2.5, T, 'disappearing', { onTime: 90, offTime: 40, offset: 0 }),
      createPlatform(T * 18, G - T * 1, T * 2.5, T, 'disappearing', { onTime: 90, offTime: 40, offset: 60 }),

      // Safe ledge before dash pickup
      createPlatform(T * 15, G, T * 5, T, 'solid'),

      // === Section 5: Dash required gap ===
      // Solid ground after pickup, before the true gap
      createPlatform(T * 20, G, T * 2, T, 'solid'),

      // Gap: T*22 to T*26 — truly impossible at 128px without dash
      createPlatform(T * 26, G, T * 3, T, 'solid'),

      // === Section 6: Gravity zone — ceiling walk (echoes level 4) ===
      // Ceiling platform for the flipped section
      createPlatform(T * 26, 0, T * 4, T, 'solid'),
      createPlatform(T * 30, 0, T * 3, T, 'solid'),

      // === Section 7: Flip back to floor for goal ===
      createPlatform(T * 33, G, T * 3, T, 'solid'),
    ],

    spikes: [
      // Pit under the hidden-platform gap — punishes distrust
      createSpike(T * 8, G, T * 2, T),
      createSpike(T * 11, G, T, T),

      // Pits under disappearing platform section
      createSpike(T * 17, G, T, T),

      // Spike at the base of the true dash gap
      createSpike(T * 22, G, T * 4, T),

      // Ceiling spikes in the flipped section to discourage drifting
      createSpike(T * 28, T, T, T, { direction: 'down' }),
    ],

    projectileSpawners: [],

    gravityZones: [
      // Flip 1: Floor → Ceiling (after the dash gap)
      createGravityZone(T * 25.5, G - T * 6, T * 1.5, T * 6, { flipTo: -1, visible: true }),

      // Flip 2: Ceiling → Floor (back to normal for goal)
      createGravityZone(T * 31.5, T, T * 1.5, T * 5, { flipTo: 1, visible: true }),
    ],

    controlZones: [],

    signs: [
      { x: T * 0.5, y: G - 36, text: 'Vortrainierte Gewichte laden...' },
      { x: T * 8.5, y: G - T - 36, text: 'Ummöglich?' },
      { x: T * 20.5, y: G - 36, text: 'Jetzt brauchst du es!' },
      { x: T * 26.5, y: G - 36, text: 'Fine-tuning erfolgreich!' },
    ],

    goals: [
      // Fake goal on elevated platform before the gravity zone — kills on touch
      createGoal(T * 22, G - T * 4 - 32, true, { killOnTouch: true }),
      // Real goal at the end after gravity flip back
      createGoal(T * 34, G - 32, false),
    ],

    enemies: [
      // Crawler patrols starting ground
      createCrawler(T * 1, G - 16, T * 0, T * 3, 1.2),

      // Floater hovers near the gravity zone entrance to harass the player
      createFloater(T * 27, G - T * 3, 30, 0.04, 0),
    ],

    pickups: [
      // Dash orb on the safe ledge — clearly reachable, obviously needed
      createPickup(T * 16 + 8, G - T * 3, 'dash'),
    ],

    customUpdate: null,
    customRender: null,
    customPostRender: null,
  }
}
