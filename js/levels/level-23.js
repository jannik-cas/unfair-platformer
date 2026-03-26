import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createTurret } from '../entities/enemy.js'
import { createPickup } from '../entities/pickup.js'
import { GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

// Per-level mutable state — reset on level (re)creation
let reinforcementsSpawned = false
let brokenTurretActivated = false
// Reference to the "broken" turret so we can mutate its interval
let brokenTurretIndex = -1

export function createLevel() {
  reinforcementsSpawned = false
  brokenTurretActivated = false
  brokenTurretIndex = -1

  return {
    name: 'Ensemble Methods',

    playerStart: { x: 32, y: G - 24 },

    platforms: [
      // Start platform
      createPlatform(0, G, T * 4, T, 'solid'),

      // Stepping stones across the spike pit
      createPlatform(T * 5, G - T, T * 2, T, 'solid'),
      createPlatform(T * 8, G - T * 2, T * 2, T, 'solid'),
      createPlatform(T * 11, G - T, T * 2, T, 'crumble', { shakeTime: 12, resetTime: 150 }),
      createPlatform(T * 14, G - T * 2, T * 2, T, 'solid'),

      // Final platform
      createPlatform(T * 20, G - T, T * 4, T, 'solid'),

      // Ceiling — invisible wall for top turrets to sit against
      createPlatform(0, 0, T * 25, T, 'solid'),
    ],

    spikes: [
      // Entire pit floor is spiked
      createSpike(T * 4, G - T, T, T, { direction: 'up' }),
      createSpike(T * 7, G - T, T, T, { direction: 'up' }),
      createSpike(T * 9, G - T * 2 - T, T, T, { direction: 'up' }),
      createSpike(T * 10, G - T, T, T, { direction: 'up' }),
      createSpike(T * 13, G - T, T, T, { direction: 'up' }),
      createSpike(T * 15, G - T * 2 - T, T, T, { direction: 'up' }),
      createSpike(T * 16, G - T, T, T, { direction: 'up' }),
      createSpike(T * 17, G - T, T * 3, T, { direction: 'up' }),
    ],

    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 0.5, y: G - 36, text: 'Schild nehmen!' },
      { x: T * 10, y: G - T * 2 - 48, text: 'Mehr Modelle = besseres Ergebnis' },
      { x: T * 20, y: G - T - 48, text: 'Random Forest of PAIN.' },
    ],

    goals: [
      createGoal(T * 23, G - T - 32, false),
    ],

    enemies: [
      // Turret 0 — left wall, fires down into the pit
      createTurret(T * 6, G - T * 6, 90, 2, 250),

      // Turret 1 — mid ceiling mount, fires down
      createTurret(T * 10, G - T * 7, 75, 2.5, 300),

      // Turret 2 — ceiling mount, aggressive timing
      createTurret(T * 13, T, 60, 2, 250),

      // Turret 3 — "broken" turret: very long initial interval, then rages
      // brokenTurretIndex = 3 (0-indexed in the array above + this one)
      createTurret(T * 16, G - T * 5, 300, 3, 350),
    ],

    pickups: [
      // Shield at start — encourages picking it up before the gauntlet
      createPickup(T * 2, G - T * 2, 'shield', { duration: 240 }),

      // Second shield mid-gauntlet — player must backtrack from final platform
      createPickup(T * 16, G - T - 16, 'shield', { duration: 180 }),
    ],

    customUpdate(level, _player, frame) {
      // Identify the broken turret index on first frame
      if (frame === 1) {
        brokenTurretIndex = level.enemies.findIndex(
          e => e.type === 'turret' && e.fireInterval === 300
        )
      }

      // At frame 300: activate the broken turret and spawn reinforcements
      if (frame === 300 && !reinforcementsSpawned) {
        reinforcementsSpawned = true

        // Make the broken turret rage — change its fire interval to 20
        if (brokenTurretIndex !== -1) {
          const turret = level.enemies[brokenTurretIndex]
          level.enemies = level.enemies.map((e, i) =>
            i === brokenTurretIndex ? { ...turret, fireInterval: 20 } : e
          )
          brokenTurretActivated = true
        }

        // Reinforcement turrets enter the field
        level.enemies = [
          ...level.enemies,
          createTurret(T * 18, G - T * 6, 80, 2.5, 300),
          createTurret(T * 8, T, 65, 2, 280),
        ]
      }
    },

    customRender: null,
    customPostRender: null,
  }
}
