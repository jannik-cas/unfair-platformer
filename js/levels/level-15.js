import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createProjectileSpawner } from '../entities/projectile.js'
import { createGravityZone } from '../traps/gravity-flip.js'
import { createControlZone } from '../traps/control-reverse.js'
import { createFakeVictory, activateFakeUI } from '../traps/fake-ui.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

export function createLevel() {
  const level = {
    name: 'The Final Epoch',
    playerStart: { x: 40, y: G - 24 },

    platforms: [
      // === Section 1: Icy + Bouncy ===
      // Solid start — build trust
      createPlatform(0, G, T * 2.5, T, 'solid'),

      // Icy platform — player slides right (gap 0.5T = 16px)
      createPlatform(T * 3, G, T * 2.5, T, 'icy'),

      // Bouncy platform — launches player over spike pit (gap 0.5T)
      createPlatform(T * 6, G, T * 2.5, T, 'bouncy'),

      // Solid landing after spike pit (gap 2T = 64px from bouncy end at T*8.5)
      createPlatform(T * 10.5, G, T * 2.5, T, 'solid'),

      // === Section 2: Gravity Flip + Disappearing on ceiling ===
      // Ceiling platforms for flipped gravity (y=0 = ceiling edge)
      createPlatform(T * 12.5, 0, T * 2.5, T, 'disappearing', { onTime: 80, offTime: 35, offset: 0 }),
      createPlatform(T * 15.5, 0, T * 2.5, T, 'disappearing', { onTime: 80, offTime: 35, offset: 45 }),

      // Solid landing back on floor after gravity restores
      createPlatform(T * 17.5, G, T * 2.5, T, 'solid'),

      // === Section 3: Control Reversal + Icy + Fake-Out ===
      // High platform with fake (kill) goal — looks like the finish
      createPlatform(T * 18, G - T * 3, T * 2.5, T, 'solid'),

      // Icy platform — controls are reversed here (invisible zone)
      createPlatform(T * 20, G, T * 2.5, T, 'icy'),

      // === Section 4: The Real Goal ===
      // Low solid platform with the REAL goal — past the fake
      createPlatform(T * 22.5, G, T * 2.5, T, 'solid'),
    ],

    spikes: [
      // Spike pit under bouncy launch (T*8.5 to T*10.5)
      createSpike(T * 8.5, G, T, T),
      createSpike(T * 9.5, G, T, T),

      // Hidden spike beneath fake goal platform — punishes hesitation
      createSpike(T * 18.5, G - T * 4, T, T, { type: 'hidden', revealDistance: 50, direction: 'down' }),
    ],

    projectileSpawners: [
      // Slow projectile from the right, triggered when player enters icy+reversed zone
      createProjectileSpawner({
        x: GAME_WIDTH + 10, y: G - T * 1.5,
        vx: -1.5, vy: 0,
        triggerX: T * 20, interval: 90, offset: 0
      }),
      createProjectileSpawner({
        x: GAME_WIDTH + 10, y: G - T * 2.5,
        vx: -1.5, vy: 0,
        triggerX: T * 20, interval: 90, offset: 45
      }),
    ],

    gravityZones: [
      // Flip up — tall zone (T*4) anchored at floor, player walks into it from platform 4
      createGravityZone(T * 12.5, G - T * 4, T * 1.5, T * 4, { flipTo: -1, visible: true }),
      // Flip back to floor — zone at ceiling where upside-down player walks off platform 6
      createGravityZone(T * 17.5, T, T * 1.5, T * 4, { flipTo: 1, visible: true }),
    ],

    controlZones: [
      // Invisible reversal covering the icy platform + approach to real goal
      createControlZone(T * 19.5, 0, T * 3.5, GAME_HEIGHT, { reverseOnEnter: true, visible: false }),
    ],

    signs: [
      { x: T * 0.5, y: G - 36, text: 'Final epoch' },
      { x: T * 14, y: GAME_HEIGHT - 36, text: 'Converge!' },
    ],

    goals: [
      // Fake goal — killOnTouch on the elevated platform
      createGoal(T * 18.5, G - T * 3 - 32, true, { killOnTouch: true }),

      // Real goal — low platform at the end
      createGoal(T * 23.5, G - 32, false),
    ],

    fakeUI: null,
    _fakeTriggered: false,

    customUpdate(levelObj, player, frame) {
      // Trigger TRAINING COMPLETE fake victory when player reaches the ceiling section
      if (!levelObj._fakeTriggered && player.x > T * 14 && !player.dead) {
        levelObj.fakeUI = activateFakeUI(createFakeVictory({
          message: 'TRAINING COMPLETE',
          subMessage: 'Convergence reached! ...wirklich?'
        }))
        levelObj._fakeTriggered = true
      }

      // Auto-dismiss after 2s (120 frames)
      if (levelObj.fakeUI?.active && levelObj.fakeUI.timer > 120) {
        levelObj.fakeUI = { ...levelObj.fakeUI, active: false }
      }
    },

    customRender: null,
  }

  return level
}
