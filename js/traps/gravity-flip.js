import { overlaps } from '../engine/collision.js'
import { getCtx } from '../engine/canvas.js'

export function createGravityZone(x, y, w, h, options = {}) {
  return {
    x, y, w, h,
    flipTo: options.flipTo ?? -1,
    toggle: options.toggle ?? false,
    visible: options.visible ?? false,
    triggered: false,
    cooldown: 0
  }
}

export function checkGravityZones(zones, playerRect, currentGravity) {
  let newGravity = currentGravity

  for (const zone of zones) {
    if (zone.cooldown > 0) continue
    if (!overlaps(playerRect, zone)) continue

    if (zone.toggle) {
      newGravity = currentGravity * -1
    } else {
      newGravity = zone.flipTo
    }
  }

  return newGravity
}

export function updateGravityZones(zones, playerRect) {
  return zones.map(zone => {
    if (zone.cooldown > 0) {
      return { ...zone, cooldown: zone.cooldown - 1 }
    }

    if (overlaps(playerRect, zone)) {
      if (!zone.triggered) {
        return { ...zone, triggered: true, cooldown: 30 }
      }
    } else {
      return { ...zone, triggered: false }
    }

    return zone
  })
}

export function renderGravityZones(zones) {
  const ctx = getCtx()

  for (const zone of zones) {
    if (!zone.visible) continue

    ctx.save()
    ctx.fillStyle = '#9b59b6'
    ctx.globalAlpha = 0.15 + Math.sin(Date.now() * 0.003) * 0.05
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h)

    // Arrow indicators
    ctx.globalAlpha = 0.4
    ctx.fillStyle = '#9b59b6'
    const arrowDir = zone.flipTo === -1 ? 'up' : 'down'
    const arrowCount = Math.floor(zone.w / 32)
    for (let i = 0; i < arrowCount; i++) {
      const ax = zone.x + i * 32 + 16
      const ay = zone.y + zone.h / 2
      drawArrow(ctx, ax, ay, arrowDir)
    }

    ctx.restore()
  }
}

function drawArrow(ctx, x, y, dir) {
  const sign = dir === 'up' ? -1 : 1
  ctx.beginPath()
  ctx.moveTo(x - 6, y + 4 * sign)
  ctx.lineTo(x, y - 4 * sign)
  ctx.lineTo(x + 6, y + 4 * sign)
  ctx.closePath()
  ctx.fill()
}
