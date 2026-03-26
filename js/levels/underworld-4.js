import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createCrawler, createFloater, createTurret } from '../entities/enemy.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'
import { underworldVignette } from './underworld-shared.js'

const G = GAME_HEIGHT - 32
const T = 32

// ---------------------------------------------------------------------------
// Module-level wave state (reset in customUpdate on frameCount === 1)
// ---------------------------------------------------------------------------

let wave = 0
let waveTimer = 0
let waveActive = false
let enemiesRemaining = 0
let arenaPhase = 'waiting' // 'waiting' | 'fighting' | 'training' | 'complete'
let trainingTimer = 0
let prevDead = false

// ---------------------------------------------------------------------------
// Arena layout helpers
// ---------------------------------------------------------------------------

function buildBasePlatforms() {
  return [
    // Floor
    createPlatform(T * 2, G, T * 20, T, 'solid'),
    // Left wall (full height)
    createPlatform(0, 0, T * 2, GAME_HEIGHT, 'solid'),
    // Right wall (full height)
    createPlatform(T * 22, 0, T * 3, GAME_HEIGHT, 'solid'),
    // Central platforms — positions shift between waves
    createPlatform(T * 6, G - T * 3, T * 3, T, 'solid'),
    createPlatform(T * 14, G - T * 3, T * 3, T, 'solid'),
    createPlatform(T * 10, G - T * 5, T * 4, T, 'solid'),
  ]
}

function buildBaseSpikes() {
  return [
    // Death pit below the floor — fall off = instant death
    createSpike(T * 2, G + T, T * 20, T, { direction: 'up' }),
  ]
}

// ---------------------------------------------------------------------------
// Wave spawners
// ---------------------------------------------------------------------------

function spawnWave1() {
  return [
    createCrawler(T * 4, G - 16, T * 2, T * 8, 1.2),
    createCrawler(T * 10, G - 16, T * 6, T * 16, 1.5),
    createCrawler(T * 16, G - 16, T * 12, T * 22, 1.0),
  ]
}

function spawnWave2() {
  return [
    createFloater(T * 4, G - T * 7, 50, 0.025, 0),
    createFloater(T * 10, G - T * 10, 40, 0.03, Math.PI / 2),
    createFloater(T * 16, G - T * 6, 55, 0.02, Math.PI),
  ]
}

function spawnWave3() {
  return [
    createCrawler(T * 4, G - 16, T * 2, T * 10, 1.8),
    createCrawler(T * 14, G - 16, T * 10, T * 22, 1.8),
    createTurret(T * 10 + 8, G - T * 5 - 24, 100, 2.5, 320),
  ]
}

// ---------------------------------------------------------------------------
// Platform shift helpers — slightly lower central platforms per wave
// ---------------------------------------------------------------------------

function shiftedPlatforms(waveNum) {
  const shift = waveNum * T
  return [
    createPlatform(T * 2, G, T * 20, T, 'solid'),
    createPlatform(0, 0, T * 2, GAME_HEIGHT, 'solid'),
    createPlatform(T * 22, 0, T * 3, GAME_HEIGHT, 'solid'),
    createPlatform(T * 5, G - T * 3 - shift, T * 3, T, 'solid'),
    createPlatform(T * 15, G - T * 3 - shift, T * 3, T, 'solid'),
    createPlatform(T * 10, G - T * 5 - shift, T * 4, T, 'solid'),
  ]
}

function spikesForWave(waveNum) {
  const base = buildBaseSpikes()
  if (waveNum >= 3) {
    return [
      ...base,
      createSpike(T * 7, G - T, T, T, { direction: 'up' }),
      createSpike(T * 15, G - T, T, T, { direction: 'up' }),
      createSpike(T * 11, G - T, T * 2, T, { direction: 'up' }),
      createSpike(T * 5, G - T, T, T, { direction: 'up' }),
    ]
  }
  if (waveNum >= 2) {
    return [
      ...base,
      createSpike(T * 7, G - T, T, T, { direction: 'up' }),
      createSpike(T * 15, G - T, T, T, { direction: 'up' }),
    ]
  }
  return base
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function createLevel() {
  const level = {
    name: 'Adversarial Training',

    playerStart: { x: T * 11, y: G - 24 },

    platforms: buildBasePlatforms(),
    spikes: buildBaseSpikes(),
    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 9, y: G - 36, text: 'Adversarial Training: Epoch 0/3' },
    ],

    // Fake goal — becomes real after wave 3
    goals: [
      createGoal(T * 11, G - T * 6 - 32, true, { killOnTouch: false }),
    ],

    enemies: [],
    pickups: [],

    customUpdate(lvl, player, frame) {
      // ---------------------------------------------------------------
      // Reset all module state on first frame (handles level restarts)
      // ---------------------------------------------------------------
      if (lvl.frameCount === 1) {
        wave = 0
        waveTimer = 0
        waveActive = false
        enemiesRemaining = 0
        arenaPhase = 'waiting'
        trainingTimer = 0
        prevDead = false

        lvl.platforms = buildBasePlatforms()
        lvl.spikes = buildBaseSpikes()
        lvl.enemies = []
        lvl.goals = [createGoal(T * 11, G - T * 6 - 32, true, { killOnTouch: false })]
        lvl.signs = [{ x: T * 9, y: G - 36, text: 'Adversarial Training: Epoch 0/3' }]
      }

      // ---------------------------------------------------------------
      // On player death, reset wave state so the arena resets
      // ---------------------------------------------------------------
      const justDied = player.dead && !prevDead
      prevDead = player.dead

      if (justDied && arenaPhase !== 'complete') {
        wave = 0
        waveTimer = 0
        waveActive = false
        enemiesRemaining = 0
        arenaPhase = 'waiting'
        trainingTimer = 0
        lvl.platforms = buildBasePlatforms()
        lvl.spikes = buildBaseSpikes()
        lvl.enemies = []
        lvl.goals = [createGoal(T * 11, G - T * 6 - 32, true, { killOnTouch: false })]
        lvl.signs = [{ x: T * 9, y: G - 36, text: 'Adversarial Training: Epoch 0/3' }]
        return
      }

      if (player.dead) return

      // ---------------------------------------------------------------
      // Phase: waiting — countdown before wave 1 starts
      // ---------------------------------------------------------------
      if (arenaPhase === 'waiting') {
        waveTimer += 1
        if (waveTimer >= 120) {
          wave = 1
          waveTimer = 0
          waveActive = true
          arenaPhase = 'fighting'
          lvl.enemies = spawnWave1()
          enemiesRemaining = 3
          lvl.signs = [{ x: T * 9, y: G - 36, text: 'Adversarial Training: Epoch 1/3' }]
        }
        return
      }

      // ---------------------------------------------------------------
      // Phase: fighting
      // ---------------------------------------------------------------
      if (arenaPhase === 'fighting') {
        waveTimer += 1

        if (wave === 1) {
          const aliveCount = lvl.enemies.filter(e => e.type === 'crawler' && e.alive).length
          if (aliveCount === 0) {
            arenaPhase = 'training'
            trainingTimer = 0
            waveActive = false
          }
        }

        if (wave === 2) {
          // Survive 600 frames of floaters
          if (waveTimer >= 600) {
            arenaPhase = 'training'
            trainingTimer = 0
            waveActive = false
            lvl.enemies = []
          }
        }

        if (wave === 3) {
          const crawlersAlive = lvl.enemies.filter(e => e.type === 'crawler' && e.alive).length
          if (crawlersAlive === 0 && waveTimer >= 300) {
            arenaPhase = 'complete'
            lvl.goals = [createGoal(T * 11, G - T * 6 - 32, false)]
            lvl.signs = [{ x: T * 9, y: G - 36, text: 'Epoch 3/3: Training Complete' }]
          }
        }

        return
      }

      // ---------------------------------------------------------------
      // Phase: training — brief interlude between waves
      // ---------------------------------------------------------------
      if (arenaPhase === 'training') {
        trainingTimer += 1

        if (trainingTimer >= 180) {
          wave += 1
          waveTimer = 0
          waveActive = true
          arenaPhase = 'fighting'

          lvl.platforms = shiftedPlatforms(wave - 1)
          lvl.spikes = spikesForWave(wave)

          if (wave === 2) {
            lvl.enemies = spawnWave2()
            lvl.signs = [{ x: T * 9, y: G - 36, text: 'Adversarial Training: Epoch 2/3' }]
          } else if (wave === 3) {
            lvl.enemies = spawnWave3()
            lvl.signs = [{ x: T * 9, y: G - 36, text: 'Adversarial Training: Epoch 3/3' }]
          }
        }
      }
    },

    customRender(lvl, ctx) {
      const centerX = GAME_WIDTH / 2

      // ---------------------------------------------------------------
      // Epoch indicator — top-center
      // ---------------------------------------------------------------
      ctx.save()
      ctx.font = 'bold 16px monospace'
      ctx.textAlign = 'center'

      ctx.shadowColor = '#cc0000'
      ctx.shadowBlur = 10
      ctx.fillStyle = '#ff3333'
      ctx.fillText(`Epoch: ${wave}/3`, centerX, 28)

      ctx.shadowBlur = 0
      ctx.restore()

      // ---------------------------------------------------------------
      // Wave 2 survival countdown
      // ---------------------------------------------------------------
      if (arenaPhase === 'fighting' && wave === 2) {
        const remaining = Math.max(0, Math.ceil((600 - waveTimer) / 60))
        ctx.save()
        ctx.font = '13px monospace'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#e8a030'
        ctx.fillText(`Survive: ${remaining}s`, centerX, 50)
        ctx.restore()
      }

      // ---------------------------------------------------------------
      // Wave 3 turret-survival countdown
      // ---------------------------------------------------------------
      if (arenaPhase === 'fighting' && wave === 3) {
        const crawlersAlive = lvl.enemies.filter(e => e.type === 'crawler' && e.alive).length
        if (crawlersAlive === 0) {
          const remaining = Math.max(0, Math.ceil((300 - waveTimer) / 60))
          ctx.save()
          ctx.font = '13px monospace'
          ctx.textAlign = 'center'
          ctx.fillStyle = '#e8a030'
          ctx.fillText(`Turret endurance: ${remaining}s`, centerX, 50)
          ctx.restore()
        }
      }

      // ---------------------------------------------------------------
      // Training phase loading bar
      // ---------------------------------------------------------------
      if (arenaPhase === 'training') {
        const progress = Math.min(1, trainingTimer / 180)
        const barW = 200
        const barX = centerX - barW / 2
        const barY = 44

        ctx.save()

        ctx.font = '12px monospace'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#888'
        ctx.fillText('Training...', centerX, barY - 6)

        ctx.fillStyle = '#333'
        ctx.fillRect(barX, barY, barW, 10)

        ctx.fillStyle = '#aa0000'
        ctx.fillRect(barX, barY, barW * progress, 10)

        ctx.strokeStyle = '#555'
        ctx.lineWidth = 1
        ctx.strokeRect(barX, barY, barW, 10)

        ctx.restore()
      }

      // ---------------------------------------------------------------
      // Complete message
      // ---------------------------------------------------------------
      if (arenaPhase === 'complete') {
        ctx.save()
        ctx.font = 'bold 14px monospace'
        ctx.textAlign = 'center'
        ctx.shadowColor = '#00ff88'
        ctx.shadowBlur = 8
        ctx.fillStyle = '#00ff88'
        ctx.fillText('Training Complete — Reach the Flag', centerX, 50)
        ctx.shadowBlur = 0
        ctx.restore()
      }
    },

    customPostRender(_lvl, ctx) {
      underworldVignette(ctx)
    },
  }

  return level
}
