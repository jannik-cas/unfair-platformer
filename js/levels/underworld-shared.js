import { GAME_WIDTH, GAME_HEIGHT, getCtx } from '../engine/canvas.js'

/**
 * Draw a dark radial vignette over the entire canvas.
 * Intended to be called from customPostRender in every underworld level.
 * @param {CanvasRenderingContext2D} ctx
 */
export function underworldVignette(ctx) {
  const cx = GAME_WIDTH / 2
  const cy = GAME_HEIGHT / 2

  const gradient = ctx.createRadialGradient(cx, cy, 100, cx, cy, 500)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)')

  ctx.save()
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  ctx.restore()
}

/**
 * Draw centered text with a red glow effect.
 * Useful for underworld-specific narrative messages.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} y  - vertical position in canvas coordinates
 */
export function underworldText(ctx, text, y) {
  ctx.save()

  ctx.font = 'bold 14px monospace'
  ctx.textAlign = 'center'

  // Glow layers
  ctx.shadowColor = '#aa0000'
  ctx.shadowBlur = 12
  ctx.fillStyle = '#aa3333'
  ctx.fillText(text, GAME_WIDTH / 2, y)

  // Second pass — sharper text on top
  ctx.shadowBlur = 4
  ctx.fillText(text, GAME_WIDTH / 2, y)

  ctx.restore()
}
