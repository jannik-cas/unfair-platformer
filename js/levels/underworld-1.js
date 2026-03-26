import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { GAME_WIDTH, GAME_HEIGHT, getCtx } from '../engine/canvas.js'
import { underworldVignette } from './underworld-shared.js'

const G = GAME_HEIGHT - 32
const T = 32

// Module-level state
let toggleTimer = 0
let toggledIndex = -1
let glitchFramesLeft = 0

export function createLevel() {
  toggleTimer = 0
  toggledIndex = -1
  glitchFramesLeft = 0

  return {
    name: 'Unterfitting',

    // Spawn on safe solid ground at the left
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // Section 1: Solid start (same look as Level 1 but shorter)
      createPlatform(0, G, T * 3, T, 'solid'),              // 0 - safe ground

      // What looks like continued ground is FAKE — fall through!
      createPlatform(T * 3, G, T * 3, T, 'fake'),           // 1 - fake ground trap

      // Stepping stone — must jump across the fake ground
      createPlatform(T * 3, G - T * 2.5, T * 2, T, 'solid'), // 2 - above fake ground

      // Section 2: Inverted zone
      createPlatform(T * 6, G - T * 1, T * 3, T, 'solid'),  // 3 - landing after jump

      createPlatform(T * 10, G - T * 2, T * 2, T, 'solid'),  // 4 - step up

      // Fake platform bait — looks like shortcut
      createPlatform(T * 12.5, G - T * 1, T * 2, T, 'fake'), // 5 - trap

      // Real path goes higher
      createPlatform(T * 13, G - T * 3, T * 2.5, T, 'solid'), // 6 - real path

      // Section 3: Final stretch
      createPlatform(T * 16, G - T * 2, T * 3, T, 'solid'),  // 7

      createPlatform(T * 20, G - T * 1, T * 5, T, 'solid'),  // 8 - goal platform
    ],

    spikes: [
      // Below the fake ground — punishes trusting the floor
      createSpike(T * 3.5, G + T, T, T, { direction: 'up' }),
      createSpike(T * 5, G + T, T, T, { direction: 'up' }),

      // Hidden spike on the bait platform area
      createSpike(T * 12.5, G - T * 2, T, T, { type: 'hidden', revealDistance: 50 }),
    ],

    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 1, y: G - 36, text: 'Du kennst dieses Level. Oder?' },
      { x: T * 12, y: G - T * 3 - 36, text: 'Nicht da unten...' },
    ],

    goals: [
      // Fake goal at obvious spot — kills
      createGoal(T * 20.5, G - T * 1 - 32, true, { killOnTouch: true }),
      // Real goal further right
      createGoal(T * 23, G - T * 1 - 32, false),
    ],

    enemies: [],
    pickups: [],

    customUpdate(level, _player, _frame) {
      toggleTimer += 1

      if (glitchFramesLeft > 0) {
        glitchFramesLeft -= 1
      }

      // Every 300 frames pick a random platform and flip its solidity
      if (toggleTimer >= 300) {
        toggleTimer = 0
        const idx = Math.floor(Math.random() * level.platforms.length)
        const p = level.platforms[idx]
        level.platforms[idx] = { ...p, solid: !p.solid }
        toggledIndex = idx
        glitchFramesLeft = 10
      }
    },

    customRender(level, ctx) {
      if (glitchFramesLeft <= 0 || toggledIndex < 0) return

      const p = level.platforms[toggledIndex]
      if (!p) return

      ctx.save()
      const lineCount = 5
      for (let i = 0; i < lineCount; i++) {
        const r = Math.floor(Math.random() * 255)
        const g = Math.floor(Math.random() * 255)
        const b = Math.floor(Math.random() * 255)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`
        const lineY = p.y + Math.random() * p.h
        const lineH = 2 + Math.random() * 4
        ctx.fillRect(p.x, lineY, p.w, lineH)
      }
      ctx.restore()
    },

    customPostRender(_level, ctx) {
      underworldVignette(ctx)
    },
  }
}
