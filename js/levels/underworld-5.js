import { createPlatform } from '../entities/platform.js'
import { createSpike } from '../entities/spike.js'
import { createGoal } from '../entities/goal.js'
import { createTurret } from '../entities/enemy.js'
import { setReversed } from '../engine/input.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'
import { underworldVignette } from './underworld-shared.js'

const G = GAME_HEIGHT - 32
const T = 32

// ---------------------------------------------------------------------------
// Module-level disaster state (reset in customUpdate on frameCount === 1)
// ---------------------------------------------------------------------------

let disasterTimer = 0
let activeDisaster = null        // current disaster name or null
let disasterDuration = 0         // frames remaining for current disaster
let disasterIndex = -1           // index into DISASTER_CYCLE
let disasterHistory = []

let blackSwanActive = false
let blackSwanFrame = 0   // animation frame counter, increments each frame during black swan

// Parallel state tracking for overlapping disasters during black swan
let gravityFlipped = false        // managed by this level, not a gravity zone
let controlsReversed = false      // managed directly via setReversed

let prevDead = false

// ---------------------------------------------------------------------------
// Disaster configuration
// ---------------------------------------------------------------------------

// Cycle: gravity(360) → ice(300) → controls(300) → turrets(300) → screen(300)
// After one full cycle (5 disasters) a BLACK SWAN EVENT fires (both gravity +
// controls simultaneously for 300 frames). The black swan itself is disaster
// index 5, then the cycle restarts at index 0.
const DISASTER_CYCLE = ['gravity', 'ice', 'controls', 'turrets', 'screen', '_blackSwan']

const DISASTER_DURATIONS = {
  gravity: 360,
  ice: 300,
  controls: 300,
  turrets: 300,
  screen: 300,
  _blackSwan: 300,
}

const DISASTER_INTERVAL = 600   // frames between disaster starts

// ---------------------------------------------------------------------------
// Layout builders
// ---------------------------------------------------------------------------

function buildBasePlatforms() {
  return [
    // Floor
    createPlatform(T * 2, G, T * 20, T, 'solid'),
    // Ceiling (for gravity-flip path)
    createPlatform(T * 2, 0, T * 20, T, 'solid'),

    // Navigation platforms — spread at mid-heights for normal and flipped play
    createPlatform(T * 4, G - T * 4, T * 3, T, 'solid'),
    createPlatform(T * 9, G - T * 6, T * 3, T, 'solid'),
    createPlatform(T * 13, G - T * 3, T * 3, T, 'solid'),

    // Barrier wall blocking the goal area (right side)
    // Gap at ceiling level: T*18, y=T to y=T*3 is open
    // Gap at floor level:   T*18, y=G-T*2 to y=G is open (but spikes there normally)
    createPlatform(T * 18, T * 3, T, G - T * 3 - T * 2, 'solid'),   // upper section of barrier
    createPlatform(T * 18, G - T * 2, T, T * 2, 'solid'),            // lower section of barrier
  ]
}

// Spikes blocking the floor gap in the barrier — deactivated during black swan
function buildBarrierSpikes() {
  return [
    createSpike(T * 18, G - T * 2, T, T * 2, { direction: 'up' }),
  ]
}

function buildAllSpikes() {
  return buildBarrierSpikes()
}

// Temporary turrets spawned during 'turrets' disaster
function buildDisasterTurrets() {
  return [
    createTurret(T * 5, G - T * 5 - 24, 80, 2.8, 350),
    createTurret(T * 16, G - T * 4 - 24, 80, 2.8, 350),
  ]
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function createLevel() {
  const level = {
    name: 'Der Schwarze Schwan',

    playerStart: { x: T * 3, y: G - 24 },

    platforms: buildBasePlatforms(),
    spikes: buildAllSpikes(),
    projectileSpawners: [],
    gravityZones: [],
    controlZones: [],

    signs: [
      { x: T * 3, y: G - 36, text: 'Was nicht im Training war, kommt in Produktion.' },
      { x: T * 17, y: G - 36, text: 'Nur ein Schwarzer Schwan \u00F6ffnet den Weg.' },
    ],

    goals: [
      createGoal(T * 22, G - 32, false),
    ],

    enemies: [],
    pickups: [],

    customUpdate(lvl, player, frame) {
      // ---------------------------------------------------------------
      // Reset all module state on first frame
      // ---------------------------------------------------------------
      if (lvl.frameCount === 1) {
        disasterTimer = 0
        activeDisaster = null
        disasterDuration = 0
        disasterIndex = -1
        disasterHistory = []
        blackSwanActive = false
        blackSwanFrame = 0
        gravityFlipped = false
        controlsReversed = false
        prevDead = false

        lvl.platforms = buildBasePlatforms()
        lvl.spikes = buildAllSpikes()
        lvl.enemies = []
        lvl.gravityDir = 1
        setReversed(false)
      }

      // ---------------------------------------------------------------
      // On player death — reset disasters but keep layout
      // ---------------------------------------------------------------
      const justDied = player.dead && !prevDead
      prevDead = player.dead

      if (justDied) {
        activeDisaster = null
        disasterDuration = 0
        blackSwanActive = false
        blackSwanFrame = 0
        gravityFlipped = false
        controlsReversed = false
        lvl.gravityDir = 1
        setReversed(false)
        lvl.enemies = []
        lvl.platforms = buildBasePlatforms()
        lvl.spikes = buildAllSpikes()
        return
      }

      if (player.dead) return

      // ---------------------------------------------------------------
      // Disaster timer tick
      // ---------------------------------------------------------------
      disasterTimer += 1
      if (blackSwanActive) blackSwanFrame += 1

      // ---------------------------------------------------------------
      // Advance current disaster countdown
      // ---------------------------------------------------------------
      if (activeDisaster !== null) {
        disasterDuration -= 1

        if (disasterDuration <= 0) {
          _endDisaster(lvl)
          activeDisaster = null
          disasterDuration = 0
        }
      }

      // ---------------------------------------------------------------
      // Start next disaster every DISASTER_INTERVAL frames
      // ---------------------------------------------------------------
      if (disasterTimer % DISASTER_INTERVAL === 0) {
        disasterIndex = (disasterIndex + 1) % DISASTER_CYCLE.length
        _startDisaster(lvl, DISASTER_CYCLE[disasterIndex])
      }
    },

    customRender(_lvl, ctx) {
      const centerX = GAME_WIDTH / 2

      // ---------------------------------------------------------------
      // Disaster label — top-left
      // ---------------------------------------------------------------
      ctx.save()
      ctx.font = '12px monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#cc8800'

      if (activeDisaster && activeDisaster !== '_blackSwan') {
        const label = _disasterLabel(activeDisaster)
        ctx.fillText(`DISASTER: ${label}`, 16, 28)

        // Duration bar
        const maxDur = DISASTER_DURATIONS[activeDisaster]
        const progress = disasterDuration / maxDur
        const barW = 140
        ctx.fillStyle = '#332200'
        ctx.fillRect(16, 34, barW, 6)
        ctx.fillStyle = '#ff9900'
        ctx.fillRect(16, 34, barW * progress, 6)
        ctx.strokeStyle = '#554400'
        ctx.lineWidth = 1
        ctx.strokeRect(16, 34, barW, 6)
      } else if (!activeDisaster) {
        const nextIn = Math.max(0, Math.ceil((DISASTER_INTERVAL - (disasterTimer % DISASTER_INTERVAL)) / 60))
        ctx.fillStyle = '#556655'
        ctx.fillText(`Ruhig... n\u00E4chstes Ereignis in ${nextIn}s`, 16, 28)
      }

      ctx.restore()

      // ---------------------------------------------------------------
      // BLACK SWAN — flashing overlay text
      // ---------------------------------------------------------------
      if (blackSwanActive) {
        ctx.save()

        const blink = Math.floor(blackSwanFrame / 12) % 2 === 0
        if (blink) {
          ctx.font = 'bold 22px monospace'
          ctx.textAlign = 'center'
          ctx.shadowColor = '#ffd700'
          ctx.shadowBlur = 20
          ctx.fillStyle = '#ffd700'
          ctx.fillText('SCHWARZER SCHWAN ERKANNT!', centerX, GAME_HEIGHT / 2 - 20)
          ctx.shadowBlur = 0

          ctx.font = 'bold 28px monospace'
          ctx.shadowColor = '#ffd700'
          ctx.shadowBlur = 16
          ctx.fillStyle = '#ffe066'
          ctx.fillText('JETZT!', centerX, GAME_HEIGHT / 2 + 14)
          ctx.shadowBlur = 0
        }

        // Countdown — uses disasterDuration which counts down during the black swan
        const remaining = Math.max(0, Math.ceil(disasterDuration / 60))
        ctx.font = '12px monospace'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#ccaa00'
        ctx.fillText(`Fenster schlie\u00DFt in ${remaining}s`, centerX, GAME_HEIGHT / 2 + 40)

        ctx.restore()
      }
    },

    customPostRender(_lvl, ctx) {
      underworldVignette(ctx)

      // ---------------------------------------------------------------
      // 'screen' disaster — scanline noise overlay
      // ---------------------------------------------------------------
      if (activeDisaster === 'screen') {
        ctx.save()
        const intensity = Math.min(1, disasterDuration / DISASTER_DURATIONS.screen)

        // Static noise via randomised thin horizontal bands
        for (let y = 0; y < GAME_HEIGHT; y += 3) {
          if (Math.random() < 0.15 * intensity) {
            ctx.fillStyle = `rgba(255,255,255,${(Math.random() * 0.06 * intensity).toFixed(3)})`
            ctx.fillRect(0, y, GAME_WIDTH, 2)
          }
        }

        // Scanlines
        ctx.globalAlpha = 0.08 * intensity
        ctx.fillStyle = '#000'
        for (let y = 0; y < GAME_HEIGHT; y += 4) {
          ctx.fillRect(0, y, GAME_WIDTH, 2)
        }

        // Occasional horizontal glitch band
        if (Math.random() < 0.04 * intensity) {
          const bandY = Math.floor(Math.random() * GAME_HEIGHT)
          const bandH = Math.floor(Math.random() * 8 + 2)
          ctx.globalAlpha = 0.18 * intensity
          ctx.fillStyle = '#ff2200'
          ctx.fillRect(0, bandY, GAME_WIDTH, bandH)
        }

        ctx.globalAlpha = 1
        ctx.restore()
      }

      // ---------------------------------------------------------------
      // BLACK SWAN — golden border glow
      // ---------------------------------------------------------------
      if (blackSwanActive) {
        ctx.save()
        const pulse = 0.4 + Math.sin(blackSwanFrame * 0.12) * 0.25

        const borderW = 8
        ctx.globalAlpha = pulse
        ctx.strokeStyle = '#ffd700'
        ctx.lineWidth = borderW * 2
        ctx.strokeRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

        ctx.globalAlpha = 1
        ctx.restore()
      }
    },
  }

  return level
}

// ---------------------------------------------------------------------------
// Internal helpers — disaster lifecycle
// ---------------------------------------------------------------------------

function _startDisaster(lvl, name) {
  activeDisaster = name
  disasterDuration = DISASTER_DURATIONS[name]
  disasterHistory = [...disasterHistory, name]

  switch (name) {
    case 'gravity':
      gravityFlipped = true
      lvl.gravityDir = -1
      break

    case 'ice':
      lvl.platforms = lvl.platforms.map(p =>
        p.type === 'solid' ? { ...p, type: 'icy' } : p
      )
      break

    case 'controls':
      controlsReversed = true
      setReversed(true)
      break

    case 'turrets':
      lvl.enemies = [...lvl.enemies, ...buildDisasterTurrets()]
      break

    case 'screen':
      // Visual only — handled in customPostRender
      break

    case '_blackSwan':
      _activateBlackSwan(lvl)
      break
  }
}

function _endDisaster(lvl) {
  switch (activeDisaster) {
    case 'gravity':
      if (!blackSwanActive) {
        gravityFlipped = false
        lvl.gravityDir = 1
      }
      break

    case 'ice':
      lvl.platforms = lvl.platforms.map(p =>
        p.type === 'icy' ? { ...p, type: 'solid' } : p
      )
      break

    case 'controls':
      if (!blackSwanActive) {
        controlsReversed = false
        setReversed(false)
      }
      break

    case 'turrets':
      lvl.enemies = lvl.enemies.filter(e => e.type !== 'turret')
      break

    case 'screen':
      // Nothing to undo
      break

    case '_blackSwan':
      _deactivateBlackSwan(lvl)
      break
  }
}

function _activateBlackSwan(lvl) {
  blackSwanActive = true
  blackSwanFrame = 0
  gravityFlipped = true
  controlsReversed = true
  lvl.gravityDir = -1
  setReversed(true)
  // Remove barrier spikes — expose the floor gap
  lvl.spikes = lvl.spikes.filter(s => !(s.x === T * 18 && s.y === G - T * 2))
}

function _deactivateBlackSwan(lvl) {
  blackSwanActive = false
  blackSwanFrame = 0
  gravityFlipped = false
  controlsReversed = false
  lvl.gravityDir = 1
  setReversed(false)
  // Restore barrier spikes
  lvl.spikes = [...lvl.spikes, ...buildBarrierSpikes()]
}

function _disasterLabel(name) {
  const labels = {
    gravity: 'SCHWERKRAFT UMGEKEHRT',
    ice: 'GLATTEISALARM',
    controls: 'STEUERUNG INVERTIERT',
    turrets: 'TURMGESCHUETZE AKTIV',
    screen: 'VISUELLE STOERUNG',
  }
  return labels[name] || name.toUpperCase()
}
