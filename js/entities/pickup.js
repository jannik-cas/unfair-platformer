import { overlaps } from '../engine/collision.js'
import { getCtx } from '../engine/canvas.js'

// --- Factory ---

export function createPickup(x, y, type, options = {}) {
  return {
    x,
    y,
    w: 16,
    h: 16,
    type,
    collected: false,
    bobTimer: 0,
    sparkleTimer: 0,
    keyId: options.keyId || null,
    duration: options.duration || 180
  }
}

// --- Update ---

export function updatePickup(pickup) {
  if (pickup.collected) return pickup

  return {
    ...pickup,
    bobTimer: pickup.bobTimer + 1,
    sparkleTimer: pickup.sparkleTimer + 1
  }
}

// --- Collision ---

export function checkPickupCollision(pickup, playerRect) {
  if (pickup.collected) return false

  const bobY = pickup.y + Math.sin(pickup.bobTimer * 0.08) * 4
  const rect = { x: pickup.x, y: bobY, w: pickup.w, h: pickup.h }

  return overlaps(rect, playerRect)
}

export function collectPickup(pickup) {
  return { ...pickup, collected: true }
}

// --- Render helpers ---

function drawShadow(ctx, cx, baseY) {
  ctx.save()
  ctx.globalAlpha = 0.3
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.ellipse(cx, baseY + 10, 6, 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawLabel(ctx, text, cx, baseY, color) {
  ctx.save()
  ctx.font = '7px monospace'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.fillText(text, cx, baseY + 20)
  ctx.restore()
}

function renderKey(ctx, pickup, cx, bobY) {
  const t = pickup.sparkleTimer

  // Golden diamond (rotated square)
  ctx.save()
  ctx.translate(cx, bobY + 8)
  ctx.rotate(Math.PI / 4)
  ctx.fillStyle = '#f1c40f'
  ctx.strokeStyle = '#e6ac00'
  ctx.lineWidth = 1
  ctx.fillRect(-5, -5, 10, 10)
  ctx.strokeRect(-5, -5, 10, 10)
  ctx.restore()

  // Sparkle particles: 3 dots orbiting at varying distances
  ctx.save()
  ctx.fillStyle = '#ffe97a'
  const sparkleCount = 3
  for (let i = 0; i < sparkleCount; i++) {
    const angle = (t * 0.06) + (i * (Math.PI * 2) / sparkleCount)
    const dist = 9 + Math.sin(t * 0.1 + i) * 2
    const px = cx + Math.cos(angle) * dist
    const py = (bobY + 8) + Math.sin(angle) * dist * 0.5
    ctx.beginPath()
    ctx.arc(px, py, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  drawLabel(ctx, 'API_KEY', cx, bobY, '#f1c40f')
}

function renderShield(ctx, pickup, cx, bobY) {
  const t = pickup.sparkleTimer
  const sides = 6
  const radius = 8

  // Blue glow pulse
  ctx.save()
  ctx.globalAlpha = 0.15 + Math.sin(t * 0.07) * 0.1
  ctx.strokeStyle = '#3498db'
  ctx.lineWidth = 4
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI / 6) + (i * Math.PI * 2) / sides
    const px = cx + Math.cos(angle) * (radius + 3)
    const py = (bobY + 8) + Math.sin(angle) * (radius + 3)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.restore()

  // Hexagon outline
  ctx.save()
  ctx.strokeStyle = '#3498db'
  ctx.lineWidth = 1.5
  ctx.fillStyle = 'rgba(52, 152, 219, 0.2)'
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI / 6) + (i * Math.PI * 2) / sides
    const px = cx + Math.cos(angle) * radius
    const py = (bobY + 8) + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  drawLabel(ctx, 'docker', cx, bobY, '#3498db')
}

function renderDash(ctx, pickup, cx, bobY) {
  const t = pickup.sparkleTimer
  const cy = bobY + 8

  // Orange circle
  ctx.save()
  ctx.fillStyle = '#e67e22'
  ctx.strokeStyle = '#d35400'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, cy, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  // Right-pointing arrow
  ctx.save()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.moveTo(cx - 3, cy - 3)
  ctx.lineTo(cx + 4, cy)
  ctx.lineTo(cx - 3, cy + 3)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Trailing orange particles behind the circle
  ctx.save()
  const trailCount = 3
  for (let i = 0; i < trailCount; i++) {
    const phase = ((t * 0.15) + i * 0.7) % (Math.PI * 2)
    const alpha = 0.7 - i * 0.2
    const offsetX = -(5 + i * 3) + Math.sin(phase) * 1.5
    const offsetY = Math.sin(phase + i) * 2
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#e67e22'
    ctx.beginPath()
    ctx.arc(cx + offsetX, cy + offsetY, 2 - i * 0.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  drawLabel(ctx, 'boost', cx, bobY, '#e67e22')
}

// --- Render ---

export function renderPickup(pickup) {
  if (pickup.collected) return

  const ctx = getCtx()
  const cx = pickup.x + pickup.w / 2
  const bobY = pickup.y + Math.sin(pickup.bobTimer * 0.08) * 4

  drawShadow(ctx, cx, pickup.y)

  switch (pickup.type) {
    case 'key':
      renderKey(ctx, pickup, cx, bobY)
      break
    case 'shield':
      renderShield(ctx, pickup, cx, bobY)
      break
    case 'dash':
      renderDash(ctx, pickup, cx, bobY)
      break
  }
}
