import { initCanvas, clear, getCtx, GAME_WIDTH, GAME_HEIGHT } from './engine/canvas.js'
import { initInput, setReversed, clearJustPressed } from './engine/input.js'
import { createPlayer, updatePlayer, renderPlayer, killPlayer } from './entities/player.js'
import { updatePlatform, renderPlatform } from './entities/platform.js'
import { updateSpike, getSpikeHitbox, renderSpike } from './entities/spike.js'
import {
  updateProjectileSpawner, updateProjectile, renderProjectile
} from './entities/projectile.js'
import { checkGoal, renderGoal } from './entities/goal.js'
import { checkGravityZones, updateGravityZones, renderGravityZones } from './traps/gravity-flip.js'
import { checkControlZones, renderControlZones } from './traps/control-reverse.js'
import { updateFakeUI, renderFakeUI } from './traps/fake-ui.js'
import { registerLevel, loadLevel, getCurrentLevel, setCurrentLevel, getCurrentLevelNum, getTotalLevels } from './levels/level-manager.js'
import { renderHUD, triggerDeathShake } from './ui/hud.js'
import { updateMenu, renderMenu } from './ui/menu.js'
import {
  triggerFlash, triggerScreenShake, updateScreenEffects,
  applyScreenShake, renderFlash
} from './ui/screen-flash.js'
import { drawBackground, drawSign, drawPlayerGhost } from './sprites/pixel-art.js'
import {
  unlock, updateToast, renderToast, recordLevelComplete,
  getStarsForDeaths, getDeathlessCount
} from './ui/achievements.js'
import {
  showLevelComplete, updateLevelComplete, isLevelCompleteActive,
  dismissLevelComplete, renderLevelComplete
} from './ui/level-complete.js'
import { isJustPressed } from './engine/input.js'

// Game state
let state = 'menu'
let player = null
let deaths = 0
let totalDeaths = parseInt(localStorage.getItem('unfair-deaths') || '0', 10)
let prevPlayerDead = false
let levelTransitionTimer = 0

// EE4: NaN corruption at 42 deaths
let nanCorruptionTimer = 0

// EE6: Ghost recording/playback
let ghostRecording = []
let levelDeathsThisLevel = 0

// Gamification state
let levelTimeFrames = 0
let deathFreeStreak = 0

// Init
const { ctx } = initCanvas()
initInput()

// === Easter Egg 1: Console Secret API ===
console.log('%c=== DDS Runtime v0.1 === %cType DDS.status() for diagnostics',
  'color: #00d4aa; font-weight: bold; font-size: 14px',
  'color: #888; font-size: 12px')

window.DDS = {
  status() {
    const lvl = getCurrentLevelNum()
    const health = Math.max(0, 100 - deaths * 2)
    const rating = deaths < 20 ? 'Senior Data Scientist'
      : deaths < 50 ? 'Mid-Level (noch Probezeit)'
      : deaths < 100 ? 'Werkstudent'
      : 'billRADAR hat dich ersetzt'
    console.log(
      `%c\u2588\u2588 Model Diagnostic Report \u2588\u2588\n` +
      `%cState:        ${state}\n` +
      `Level:        ${lvl || 'N/A'} / ${getTotalLevels()}\n` +
      `Incidents:    ${deaths}\n` +
      `Model Health: ${health}%\n` +
      `Rating:       ${rating}\n` +
      `Diagnosis:    ${health > 60 ? 'Modell konvergiert.' : health > 20 ? 'Gradient instabil. Bitte neu trainieren.' : 'Totalverlust. F5 empfohlen.'}`,
      'color: #00d4aa; font-weight: bold; font-size: 13px',
      'color: #ccc; font-size: 12px; font-family: monospace'
    )
  },
  cheat(code) {
    const responses = {
      'rm -rf /prod': 'ERROR: Cannot delete production. Production deletes you.',
      'coffee': 'Kaffee wird aufgebr\u00FCht... +0 to accuracy.',
      'sudo': 'Nice try. Du bist kein Admin.',
      'help': 'Es gibt keine Hilfe. Nur Deployment.',
    }
    const msg = responses[code] || `Attempting ${code}... REJECTED. Nice try, Werkstudent.`
    console.log(`%c\u274C ${msg}`, 'color: #ff6b35; font-size: 12px')
  },
  secret() {
    console.log(
      '%c\u2728 The real deployment was the bugs we shipped along the way.\n\n' +
      '%cHint: Die 42 ist mehr als nur eine Zahl.\n' +
      'Hint: Der Konami Code funktioniert auch im Titelbildschirm.\n' +
      'Hint: Versuch mal was zu tippen im Men\u00FC...',
      'color: #f1c40f; font-weight: bold; font-size: 14px',
      'color: #888; font-size: 11px'
    )
  }
}

// Register all levels (lazy loaded)
registerLevel(1, () => import('./levels/level-1.js'), 'Onboarding Day')
registerLevel(2, () => import('./levels/level-2.js'), 'Dirty Data')
registerLevel(3, () => import('./levels/level-3.js'), 'Backprop Barrage')
registerLevel(4, () => import('./levels/level-4.js'), 'Legacy Code Gravity')
registerLevel(5, () => import('./levels/level-5.js'), 'Inverted Labels')
registerLevel(6, () => import('./levels/level-6.js'), 'Vanishing Gradients')
registerLevel(7, () => import('./levels/level-7.js'), 'Sprint Review')
registerLevel(8, () => import('./levels/level-8.js'), 'Hallucinating Metrics')
registerLevel(9, () => import('./levels/level-9.js'), 'Production Inference')
registerLevel(10, () => import('./levels/level-10.js'), 'Release Day?')
registerLevel(11, () => import('./levels/level-11.js'), 'Hyperparameter Tuning')
registerLevel(12, () => import('./levels/level-12.js'), 'Frozen Layers')
registerLevel(13, () => import('./levels/level-13.js'), 'Exploding Gradients')
registerLevel(14, () => import('./levels/level-14.js'), 'Data Drift')
registerLevel(15, () => import('./levels/level-15.js'), 'The Final Epoch')
registerLevel(16, () => import('./levels/level-16.js'), 'Rollback Strategy')
registerLevel(17, () => import('./levels/level-17.js'), 'Lights Out')
registerLevel(18, () => import('./levels/level-18.js'), 'Overfitting Trap')
registerLevel(19, () => import('./levels/level-19.js'), 'Shadow Deploy')
registerLevel(20, () => import('./levels/level-20.js'), 'Der Letzte Push')

async function startGame(startFrom = 1) {
  deaths = 0
  await startLevel(startFrom)
  state = 'playing'
}

async function startLevel(num) {
  const level = await loadLevel(num)
  if (!level) return

  player = createPlayer(level.playerStart.x, level.playerStart.y)
  prevPlayerDead = false
  setReversed(false)

  // EE6: Reset ghost recording for this level
  ghostRecording = []
  levelDeathsThisLevel = 0

  // Reset level timer
  levelTimeFrames = 0
}

async function nextLevel() {
  // Save progress
  const completed = getCurrentLevelNum()
  const prev = parseInt(localStorage.getItem('unfair-progress') || '0', 10)
  if (completed > prev) {
    localStorage.setItem('unfair-progress', completed.toString())
  }

  const next = completed + 1
  if (next > getTotalLevels()) {
    state = 'victory'
    totalDeaths += deaths
    localStorage.setItem('unfair-deaths', totalDeaths.toString())
    return
  }
  await startLevel(next)
}

function update() {
  if (state === 'menu') {
    const result = updateMenu()
    if (result?.action === 'start') {
      startGame(result.level || 1)
    }
    return
  }

  if (state === 'levelComplete') {
    updateLevelComplete()
    updateToast()
    if (isJustPressed('Space') || isJustPressed('Enter')) {
      dismissLevelComplete()
      state = 'levelTransition'
      levelTransitionTimer = 30
    }
    return
  }

  if (state === 'levelTransition') {
    levelTransitionTimer -= 1
    if (levelTransitionTimer <= 0) {
      nextLevel()
      if (state !== 'victory') {
        state = 'playing'
      }
    }
    return
  }

  if (state === 'victory') return
  if (state !== 'playing') return

  const level = getCurrentLevel()
  if (!level) return

  level.frameCount += 1

  // Update platforms
  const updatedPlatforms = level.platforms.map(p =>
    updatePlatform(p, player)
  )

  // Update spikes
  const updatedSpikes = level.spikes.map(s =>
    updateSpike(s, player)
  )

  // Get active hazards
  const hazards = updatedSpikes
    .map(s => getSpikeHitbox(s))
    .filter(Boolean)

  // Add projectile hitboxes to hazards
  const projHazards = (level.projectiles || [])
    .filter(p => p.alive)
    .map(p => ({ x: p.x, y: p.y, w: p.w, h: p.h }))

  // Gravity zones
  let gravityDir = level.gravityDir
  if (level.gravityZones.length > 0) {
    gravityDir = checkGravityZones(level.gravityZones, player, gravityDir)
    const updatedZones = updateGravityZones(level.gravityZones, player)
    level.gravityZones = updatedZones
  }

  // Control zones
  if (level.controlZones.length > 0) {
    checkControlZones(level.controlZones, player, level.frameCount)
  }

  // Get solid platforms for collision
  const solidPlatforms = updatedPlatforms.filter(p => p.solid && p.visible !== false)

  // Update player
  const newPlayer = updatePlayer(player, solidPlatforms, [...hazards, ...projHazards], gravityDir)

  // Death detection
  if (newPlayer.dead && !prevPlayerDead) {
    deaths += 1
    levelDeathsThisLevel += 1
    deathFreeStreak = 0
    triggerFlash('#ff0000', 0.4)
    triggerScreenShake(5)
    triggerDeathShake()

    // Achievements
    unlock('first_death')
    if (deaths + totalDeaths >= 100) unlock('deaths_100')
    if (levelDeathsThisLevel >= 10) unlock('explosion')

    // EE4: NaN corruption at 42 deaths
    if (deaths === 42) {
      nanCorruptionTimer = 180
      triggerScreenShake(8)
      unlock('nan_42')
    }
  }

  // Reset gravity, controls, and projectiles when player respawns
  if (prevPlayerDead && !newPlayer.dead) {
    gravityDir = 1
    level.gravityDir = 1
    setReversed(false)
    // Reset gravity zone cooldowns
    level.gravityZones = level.gravityZones.map(z => ({ ...z, cooldown: 0, triggered: false }))
    // Clear all projectiles and reset spawners
    level.projectiles = []
    level.projectileSpawners = level.projectileSpawners.map(s => ({
      ...s,
      active: s.triggerX == null && s.triggerY == null,
      triggered: false,
      fired: false,
      timer: 0
    }))
  }

  prevPlayerDead = newPlayer.dead

  // Update projectile spawners
  let allProjectiles = [...(level.projectiles || [])]
  const updatedSpawners = level.projectileSpawners.map(spawner => {
    const { spawner: updated, newProjectiles } = updateProjectileSpawner(spawner, player, allProjectiles)
    allProjectiles = [...allProjectiles, ...newProjectiles]
    return updated
  })

  // Update existing projectiles
  allProjectiles = allProjectiles.map(p => updateProjectile(p)).filter(p => p.alive)

  // Check goals
  let levelComplete = false
  const updatedGoals = level.goals.map(goal => {
    if (newPlayer.dead) return goal
    const result = checkGoal(goal, newPlayer)
    if (result.event === 'complete') {
      levelComplete = true
    }
    if (result.event === 'kill') {
      player = killPlayer(newPlayer)
      deaths += 1
      triggerFlash('#ff0000', 0.4)
      triggerScreenShake(5)
      triggerDeathShake()
      return result
    }
    return result
  })

  // Custom level update
  if (level.customUpdate) {
    level.customUpdate(level, newPlayer, level.frameCount)
  }

  // Update fake UI
  if (level.fakeUI) {
    level.fakeUI = updateFakeUI(level.fakeUI)
  }

  // Apply updates
  player = levelComplete ? player : newPlayer
  // EE6: Advance ghost playback frame
  const ghostFrame = (level.ghostData && level.ghostFrame != null)
    ? level.ghostFrame + 1
    : level.ghostFrame

  setCurrentLevel({
    ...level,
    platforms: updatedPlatforms,
    spikes: updatedSpikes,
    goals: updatedGoals,
    projectileSpawners: updatedSpawners,
    projectiles: allProjectiles,
    gravityDir,
    ghostFrame
  })

  // EE4: Decrement NaN corruption timer
  if (nanCorruptionTimer > 0) {
    nanCorruptionTimer -= 1
  }

  // EE6: Record ghost data while player is alive
  if (!newPlayer.dead && !levelComplete) {
    ghostRecording.push({
      x: newPlayer.x, y: newPlayer.y,
      frame: newPlayer.frame, facingRight: newPlayer.facingRight
    })
    // Cap at 3000 frames (~50 seconds)
    if (ghostRecording.length > 3000) {
      ghostRecording.shift()
    }
  }

  // Level timer (only count while player is alive)
  if (!newPlayer.dead) {
    levelTimeFrames += 1
  }

  // Achievement + toast updates
  updateToast()

  updateScreenEffects()

  // Level complete transition
  if (levelComplete) {
    triggerFlash('#ffffff', 0.3)

    // Record stats + check for new bests
    const { isNewBestDeaths, isNewBestTime } = recordLevelComplete(
      getCurrentLevelNum(), levelDeathsThisLevel, levelTimeFrames
    )

    // Show level complete screen
    showLevelComplete(levelDeathsThisLevel, levelTimeFrames, isNewBestDeaths, isNewBestTime)
    state = 'levelComplete'

    // Track streak
    if (levelDeathsThisLevel === 0) {
      deathFreeStreak += 1
    }

    // Achievements
    if (levelDeathsThisLevel === 0) unlock('deathless')
    if (getDeathlessCount() >= 5) unlock('deathless_5')
    if (levelTimeFrames < 600) unlock('speedrun') // 10 seconds at 60fps
    if (getCurrentLevelNum() === 16) unlock('rollback')
    if (getCurrentLevelNum() >= getTotalLevels()) {
      unlock('beat_game')
      if (deaths < 50) unlock('senior')
    }

    // EE6: Save ghost if 0 deaths on this level
    if (levelDeathsThisLevel === 0 && ghostRecording.length > 0) {
      try {
        localStorage.setItem(
          'unfair-ghost-' + getCurrentLevelNum(),
          JSON.stringify(ghostRecording)
        )
      } catch (_e) { /* localStorage full, skip */ }
    }
  }
}

function render() {
  const ctx = getCtx()
  ctx.save()

  applyScreenShake(ctx)

  if (state === 'menu') {
    renderMenu(totalDeaths)
    ctx.restore()
    return
  }

  if (state === 'victory') {
    renderVictoryScreen()
    renderToast()
    ctx.restore()
    return
  }

  const level = getCurrentLevel()
  if (!level) {
    ctx.restore()
    return
  }

  const corrupted = nanCorruptionTimer > 0

  // Background
  drawBackground(0, corrupted)

  // Signs
  for (const sign of level.signs) {
    drawSign(sign.x, sign.y, sign.text)
  }

  // Gravity zones
  renderGravityZones(level.gravityZones)

  // Control zones
  renderControlZones(level.controlZones)

  // Platforms
  for (const plat of level.platforms) {
    renderPlatform(plat)
  }

  // Spikes
  for (const spike of level.spikes) {
    renderSpike(spike)
  }

  // Projectiles
  for (const proj of level.projectiles || []) {
    renderProjectile(proj)
  }

  // Goals
  for (const goal of level.goals) {
    renderGoal(goal)
  }

  // Custom level render
  if (level.customRender) {
    level.customRender(level, ctx)
  }

  // EE6: Ghost replay (render before real player, min 60 frames to avoid stale ghosts)
  if (level.ghostData && level.ghostData.length > 60 && level.ghostFrame != null && level.ghostFrame < level.ghostData.length) {
    const g = level.ghostData[level.ghostFrame]
    drawPlayerGhost(g.x, g.y, g.frame, g.facingRight)
  }

  // Player (with corruption jitter for EE4)
  if (player) {
    if (corrupted && !player.dead) {
      const jx = Math.floor(Math.random() * 3) - 1
      const jy = Math.floor(Math.random() * 3) - 1
      const jitteredPlayer = { ...player, x: player.x + jx, y: player.y + jy }
      renderPlayer(jitteredPlayer)
    } else {
      renderPlayer(player)
    }
  }

  // Fake UI overlay
  renderFakeUI(level.fakeUI)

  // HUD
  renderHUD(deaths, getCurrentLevelNum(), getTotalLevels(), corrupted, levelDeathsThisLevel, levelTimeFrames, deathFreeStreak)

  // Custom post-render (after player + HUD, for overlays like darkness)
  if (level.customPostRender) {
    level.customPostRender(level, ctx)
  }

  // Level complete overlay
  if (state === 'levelComplete') {
    renderLevelComplete()
  }

  // Achievement toast
  renderToast()

  // Flash overlay
  renderFlash()

  // Level transition
  if (state === 'levelTransition') {
    ctx.fillStyle = '#fff'
    ctx.globalAlpha = (30 - levelTransitionTimer) / 30
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    ctx.globalAlpha = 1
  }

  ctx.restore()
}

function renderVictoryScreen() {
  const ctx = getCtx()

  ctx.fillStyle = '#0a192f'
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  ctx.textAlign = 'center'
  ctx.font = 'bold 36px monospace'
  ctx.fillStyle = '#00d4aa'
  ctx.fillText('DU HAST PROD \u00dcBERLEBT!', GAME_WIDTH / 2, 150)

  ctx.font = '24px monospace'
  ctx.fillStyle = '#fff'
  ctx.fillText(`Incidents: ${deaths}`, GAME_WIDTH / 2, 220)

  ctx.font = '16px monospace'
  ctx.fillStyle = '#888'

  const rating = deaths < 20 ? 'Senior Data Scientist'
    : deaths < 50 ? 'Mid-Level (noch Probezeit)'
    : deaths < 100 ? 'Werkstudent'
    : deaths < 200 ? 'Das Modell hat gewonnen'
    : 'billRADAR hat dich ersetzt'

  ctx.fillText(`Rating: ${rating}`, GAME_WIDTH / 2, 270)
  ctx.fillText('War es das wert? ...Die Kasse sagt nein.', GAME_WIDTH / 2, 320)

  ctx.font = '14px monospace'
  ctx.fillStyle = '#555'
  ctx.fillText('F5 f\u00FCr erneutes Leiden.', GAME_WIDTH / 2, 400)
}

// Game loop with fixed timestep (target 60fps)
const TARGET_FPS = 60
const FRAME_TIME = 1000 / TARGET_FPS
let lastTime = performance.now()
let accumulator = 0

function gameLoop(now) {
  const delta = Math.min(now - lastTime, FRAME_TIME * 4) // cap to prevent spiral
  lastTime = now
  accumulator += delta

  while (accumulator >= FRAME_TIME) {
    update()
    clearJustPressed()
    accumulator -= FRAME_TIME
  }

  clear()
  render()
  requestAnimationFrame(gameLoop)
}

requestAnimationFrame(gameLoop)
