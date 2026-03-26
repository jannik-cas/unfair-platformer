import { getCtx, GAME_WIDTH } from '../engine/canvas.js'

let deathShake = 0
let levelNameAlpha = 0
let levelNameText = ''
let levelNameTimer = 0

export function showLevelName(name) {
  levelNameText = name
  levelNameAlpha = 1
  levelNameTimer = 0
}

export function triggerDeathShake() {
  deathShake = 8
}

export function renderHUD(deaths, levelNum, totalLevels = 15) {
  const ctx = getCtx()

  // Death counter
  const shakeX = deathShake > 0 ? (Math.random() - 0.5) * deathShake : 0
  const shakeY = deathShake > 0 ? (Math.random() - 0.5) * deathShake : 0
  if (deathShake > 0) deathShake -= 0.5

  ctx.save()
  ctx.font = 'bold 20px monospace'
  ctx.textAlign = 'right'

  // Shadow
  ctx.fillStyle = '#000'
  ctx.fillText(`Incidents: ${deaths}`, GAME_WIDTH - 14 + shakeX, 30 + shakeY + 1)

  // Main text
  ctx.fillStyle = deaths > 50 ? '#ff2222' : deaths > 20 ? '#ff8844' : '#ffffff'
  ctx.fillText(`Incidents: ${deaths}`, GAME_WIDTH - 15 + shakeX, 30 + shakeY)

  // Level indicator
  ctx.textAlign = 'left'
  ctx.font = '14px monospace'
  ctx.fillStyle = '#888'
  ctx.fillText(`Level ${levelNum}/${totalLevels}`, 15, 25)

  // Level name (fading)
  if (levelNameAlpha > 0) {
    levelNameTimer += 1
    if (levelNameTimer > 90) {
      levelNameAlpha = Math.max(0, levelNameAlpha - 0.02)
    }

    ctx.globalAlpha = levelNameAlpha
    ctx.textAlign = 'center'
    ctx.font = 'bold 28px monospace'

    // Shadow
    ctx.fillStyle = '#000'
    ctx.fillText(levelNameText, GAME_WIDTH / 2 + 2, 80 + 2)

    // Main
    ctx.fillStyle = '#fff'
    ctx.fillText(levelNameText, GAME_WIDTH / 2, 80)

    ctx.globalAlpha = 1
  }

  ctx.restore()
}
