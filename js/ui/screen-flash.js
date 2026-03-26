import { getCtx, GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'

let flashAlpha = 0
let flashColor = '#ff0000'
let screenShake = 0

export function triggerFlash(color = '#ff0000', intensity = 0.6) {
  flashAlpha = intensity
  flashColor = color
}

export function triggerScreenShake(intensity = 6) {
  screenShake = intensity
}

export function getScreenShake() {
  return screenShake
}

export function updateScreenEffects() {
  if (flashAlpha > 0) {
    flashAlpha = Math.max(0, flashAlpha - 0.04)
  }
  if (screenShake > 0) {
    screenShake = Math.max(0, screenShake - 0.3)
  }
}

export function applyScreenShake(ctx) {
  if (screenShake > 0) {
    const sx = (Math.random() - 0.5) * screenShake * 2
    const sy = (Math.random() - 0.5) * screenShake * 2
    ctx.translate(sx, sy)
    return true
  }
  return false
}

export function renderFlash() {
  if (flashAlpha <= 0) return

  const ctx = getCtx()
  ctx.fillStyle = flashColor
  ctx.globalAlpha = flashAlpha
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  ctx.globalAlpha = 1
}
