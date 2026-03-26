import { overlaps } from '../engine/collision.js'
import { setReversed } from '../engine/input.js'
import { getCtx } from '../engine/canvas.js'

export function createControlZone(x, y, w, h, options = {}) {
  return {
    x, y, w, h,
    reverseOnEnter: options.reverseOnEnter ?? true,
    permanent: options.permanent ?? false,
    visible: options.visible ?? false,
    flicker: options.flicker ?? false,
    flickerSpeed: options.flickerSpeed || 10
  }
}

export function checkControlZones(zones, playerRect, frameCount) {
  let shouldReverse = false

  for (const zone of zones) {
    if (!overlaps(playerRect, zone)) continue

    if (zone.flicker) {
      shouldReverse = Math.floor(frameCount / zone.flickerSpeed) % 2 === 0
    } else {
      shouldReverse = zone.reverseOnEnter
    }

    if (zone.permanent) {
      setReversed(shouldReverse)
      return
    }
  }

  setReversed(shouldReverse)
}

export function renderControlZones(zones) {
  const ctx = getCtx()

  for (const zone of zones) {
    if (!zone.visible) continue

    ctx.save()
    ctx.fillStyle = '#e74c3c'
    ctx.globalAlpha = 0.1 + Math.sin(Date.now() * 0.004) * 0.05
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h)

    // Mirror symbol
    ctx.globalAlpha = 0.3
    ctx.font = '16px monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#e74c3c'
    const cx = zone.x + zone.w / 2
    const cy = zone.y + zone.h / 2
    ctx.fillText('<>', cx, cy + 5)

    ctx.restore()
  }
}
