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
import { drawBackground, drawSign } from './sprites/pixel-art.js'

// Game state
let state = 'menu'
let player = null
let deaths = 0
let totalDeaths = parseInt(localStorage.getItem('unfair-deaths') || '0', 10)
let prevPlayerDead = false
let levelTransitionTimer = 0

// Init
const { ctx } = initCanvas()
initInput()

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
    triggerFlash('#ff0000', 0.4)
    triggerScreenShake(5)
    triggerDeathShake()
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
  setCurrentLevel({
    ...level,
    platforms: updatedPlatforms,
    spikes: updatedSpikes,
    goals: updatedGoals,
    projectileSpawners: updatedSpawners,
    projectiles: allProjectiles,
    gravityDir
  })

  updateScreenEffects()

  // Level complete transition
  if (levelComplete) {
    triggerFlash('#ffffff', 0.3)
    state = 'levelTransition'
    levelTransitionTimer = 30
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
    ctx.restore()
    return
  }

  const level = getCurrentLevel()
  if (!level) {
    ctx.restore()
    return
  }

  // Background
  drawBackground(0)

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

  // Player
  if (player) {
    renderPlayer(player)
  }

  // Fake UI overlay
  renderFakeUI(level.fakeUI)

  // HUD
  renderHUD(deaths, getCurrentLevelNum(), getTotalLevels())

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

// Game loop
function gameLoop() {
  clear()
  update()
  render()
  clearJustPressed()
  requestAnimationFrame(gameLoop)
}

gameLoop()
