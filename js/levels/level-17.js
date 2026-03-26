import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'

const G = GAME_HEIGHT - 32
const T = 32

export function createLevel() {
  return {
    name: 'Lights Out',
    playerStart: { x: 50, y: G - 24 },

    platforms: [
      // Section 1: Well-lit, build trust
      createPlatform(0, G, T * 6, T, 'solid'),

      // Section 2: DARK ZONE — two paths
      // LOW PATH (safe, boring-looking)
      createPlatform(T * 7, G, T * 4, T, 'solid'),
      createPlatform(T * 11.5, G, T * 4, T, 'solid'),
      createPlatform(T * 16, G, T * 3, T, 'solid'),

      // HIGH PATH (tempting, lethal)
      createPlatform(T * 7, G - T * 3, T * 3, T, 'solid'),
      createPlatform(T * 11, G - T * 4, T * 3, T, 'solid'),
      createPlatform(T * 15, G - T * 3, T * 3, T, 'solid'),

      // Section 3: Goal platform (lights restore)
      createPlatform(T * 19.5, G, T * 3, T, 'solid'),
    ],

    spikes: [
      // High path death traps (invisible in darkness)
      createSpike(T * 10, G - T * 4, T, T, {}),
      createSpike(T * 14, G - T * 4, T, T, {}),
      createSpike(T * 16, G - T * 4, T, T, {}),

      // One timed spike on low path to keep tension
      createSpike(T * 14, G - T, T, T, { type: 'timed', onTime: 50, offTime: 50, timerOffset: 0 }),
    ],

    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 1, y: G - 36, text: 'Speicher den Zustand!' },
      { x: T * 4, y: G - 36, text: 'Licht aus in 3...' },
    ],

    goals: [
      createGoal(T * 20.5, G - 32, false),
    ],

    customUpdate(level, player) {
      // Store player position for post-render
      level._playerPos = { x: player.x + 7, y: player.y + 10 }

      // Track deaths for lightning flash help
      if (!level._darkDeaths) level._darkDeaths = 0
      if (!level._prevDead) level._prevDead = false
      if (player.dead && !level._prevDead) {
        level._darkDeaths += 1
        // Lightning flash on every 3rd death (brief glimpse of the full level)
        if (level._darkDeaths >= 3 && level._darkDeaths % 2 === 1) {
          level._flashTimer = 12
        }
      }
      level._prevDead = player.dead

      if (level._flashTimer > 0) level._flashTimer -= 1

      if (!level._darknessActive && player.x > T * 6) {
        level._darknessActive = true
        level._darkFrame = 0
      }
      if (level._darknessActive) {
        level._darkFrame = (level._darkFrame || 0) + 1
      }
      // Restore lights near the goal
      if (player.x > T * 19) {
        level._darknessActive = false
      }
    },

    customPostRender(level, ctx) {
      if (!level._darknessActive || !level._playerPos) return

      // Lightning flash — skip the darkness overlay briefly
      if (level._flashTimer > 0) {
        ctx.save()
        ctx.globalAlpha = level._flashTimer / 12 * 0.35
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
        ctx.restore()
        return
      }

      const fadeIn = Math.min(1, (level._darkFrame || 0) / 60)
      const px = level._playerPos.x
      const py = level._playerPos.y
      // Spotlight grows slightly with each death (min 50, +8 per death, max 90)
      const baseRadius = 50
      const radius = Math.min(90, baseRadius + (level._darkDeaths || 0) * 8)

      ctx.save()

      // Draw opaque black overlay
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeIn * 0.94})`
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

      // Punch a spotlight hole around the player
      ctx.globalCompositeOperation = 'destination-out'
      const lightGrad = ctx.createRadialGradient(px, py, 0, px, py, radius)
      lightGrad.addColorStop(0, 'rgba(0,0,0,1)')
      lightGrad.addColorStop(0.5, 'rgba(0,0,0,0.8)')
      lightGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = lightGrad
      ctx.beginPath()
      ctx.arc(px, py, radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalCompositeOperation = 'source-over'
      ctx.restore()
    },
  }
}
