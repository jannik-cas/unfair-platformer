import { getCtx, GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'
import { getStarsForDeaths } from './achievements.js'

let active = false
let timer = 0
let data = null

export function showLevelComplete(levelDeaths, timeFrames, isNewBestDeaths, isNewBestTime) {
  active = true
  timer = 0
  data = {
    deaths: levelDeaths,
    timeFrames,
    stars: getStarsForDeaths(levelDeaths),
    isNewBestDeaths,
    isNewBestTime,
  }
}

export function updateLevelComplete() {
  if (!active) return false
  timer += 1
  return true
}

export function isLevelCompleteActive() {
  return active
}

export function dismissLevelComplete() {
  active = false
  data = null
}

export function renderLevelComplete() {
  if (!active || !data) return

  const ctx = getCtx()
  const fadeIn = Math.min(1, timer / 20)

  ctx.save()
  ctx.globalAlpha = fadeIn

  // Overlay
  ctx.fillStyle = 'rgba(10, 25, 47, 0.85)'
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  const centerX = GAME_WIDTH / 2
  const baseY = 140

  // Title
  ctx.font = 'bold 28px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#00d4aa'
  ctx.fillText('LEVEL COMPLETE', centerX, baseY)

  // Stars
  const starY = baseY + 50
  for (let i = 0; i < 3; i++) {
    const filled = i < data.stars
    const starDelay = i * 15
    const starScale = timer > starDelay + 20 ? 1 : timer > starDelay ? (timer - starDelay) / 20 : 0

    ctx.save()
    ctx.translate(centerX - 50 + i * 50, starY)
    ctx.scale(starScale, starScale)

    ctx.font = 'bold 32px monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = filled ? '#f1c40f' : '#333'
    ctx.fillText('\u2605', 0, 0)

    ctx.restore()
  }

  // Stats
  const statsY = starY + 50

  // Time
  const totalSec = data.timeFrames / 60
  const mins = Math.floor(totalSec / 60)
  const secs = (totalSec % 60).toFixed(1)
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`

  ctx.font = '16px monospace'
  ctx.textAlign = 'center'

  ctx.fillStyle = '#888'
  ctx.fillText(`Zeit: ${timeStr}`, centerX, statsY)
  ctx.fillText(`Tode: ${data.deaths}`, centerX, statsY + 28)

  // New best indicators
  if (timer > 40) {
    ctx.font = 'bold 14px monospace'
    if (data.isNewBestTime) {
      ctx.fillStyle = '#f1c40f'
      ctx.fillText('NEW BEST TIME!', centerX + 120, statsY)
    }
    if (data.isNewBestDeaths) {
      ctx.fillStyle = '#f1c40f'
      ctx.fillText('NEW BEST!', centerX + 100, statsY + 28)
    }
  }

  // Continue prompt
  if (timer > 60 && Math.floor(timer / 20) % 2 === 0) {
    ctx.font = '14px monospace'
    ctx.fillStyle = '#fff'
    ctx.fillText('SPACE to continue', centerX, statsY + 80)
  }

  ctx.restore()
}
