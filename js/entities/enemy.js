import { overlaps } from '../engine/collision.js'
import { GAME_HEIGHT, GAME_WIDTH, getCtx } from '../engine/canvas.js'
import { JUMP_VELOCITY } from '../engine/physics.js'

// ---------------------------------------------------------------------------
// Crawler — "Bias Bot"
// ---------------------------------------------------------------------------

export function createCrawler(x, y, leftBound, rightBound, speed = 1) {
  return {
    x,
    y,
    w: 20,
    h: 16,
    type: 'crawler',
    vx: speed,
    leftBound,
    rightBound,
    alive: true,
    squishTimer: 0,
    frame: 0,
    frameTimer: 0
  }
}

export function updateCrawler(crawler) {
  if (!crawler.alive) {
    const newSquishTimer = crawler.squishTimer - 1
    if (newSquishTimer <= 0) {
      return { ...crawler, squishTimer: 0, visible: false }
    }
    return { ...crawler, squishTimer: newSquishTimer }
  }

  let { x, vx, frame, frameTimer } = crawler

  x += vx
  if (x <= crawler.leftBound || x + crawler.w >= crawler.rightBound) {
    vx = -vx
    x = x <= crawler.leftBound ? crawler.leftBound : crawler.rightBound - crawler.w
  }

  frameTimer += 1
  if (frameTimer >= 12) {
    frame = (frame + 1) % 2
    frameTimer = 0
  }

  return { ...crawler, x, vx, frame, frameTimer }
}

export function renderCrawler(crawler) {
  if (!crawler.alive && crawler.squishTimer <= 0) return

  const ctx = getCtx()

  if (!crawler.alive && crawler.squishTimer > 0) {
    // Squished: half height, wider
    const squishW = crawler.w + 6
    const squishH = Math.ceil(crawler.h / 2)
    const squishX = crawler.x - 3
    const squishY = crawler.y + squishH

    ctx.fillStyle = '#cc3300'
    ctx.fillRect(squishX, squishY, squishW, squishH)
    return
  }

  // Body
  ctx.fillStyle = '#e04010'
  ctx.fillRect(crawler.x, crawler.y, crawler.w, crawler.h)

  // Highlight stripe
  ctx.fillStyle = '#ff6b35'
  ctx.fillRect(crawler.x + 2, crawler.y + 2, crawler.w - 4, 3)

  // Legs (two small darker rectangles below, alternating per frame)
  const legY = crawler.y + crawler.h
  ctx.fillStyle = '#8b1a00'
  if (crawler.frame === 0) {
    ctx.fillRect(crawler.x + 3, legY, 3, 4)
    ctx.fillRect(crawler.x + 13, legY, 3, 4)
  } else {
    ctx.fillRect(crawler.x + 7, legY, 3, 4)
    ctx.fillRect(crawler.x + 17, legY, 3, 4)
  }

  // Eyes (two small white pixel dots)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(crawler.x + 3, crawler.y + 4, 3, 3)
  ctx.fillRect(crawler.x + 13, crawler.y + 4, 3, 3)
  ctx.fillStyle = '#000000'
  ctx.fillRect(crawler.x + 4, crawler.y + 5, 1, 1)
  ctx.fillRect(crawler.x + 14, crawler.y + 5, 1, 1)

  // "bias" label above
  ctx.font = '8px monospace'
  ctx.fillStyle = '#ff6b35'
  ctx.textAlign = 'center'
  ctx.fillText('bias', crawler.x + crawler.w / 2, crawler.y - 3)
  ctx.textAlign = 'left'
}

// ---------------------------------------------------------------------------
// Floater — "Hallucination"
// ---------------------------------------------------------------------------

export function createFloater(x, y, amplitude = 40, frequency = 0.03, phase = 0) {
  return {
    x,
    y,
    w: 24,
    h: 24,
    type: 'floater',
    baseX: x,
    baseY: y,
    amplitude,
    frequency,
    phase,
    timer: 0
  }
}

export function updateFloater(floater) {
  const timer = floater.timer + 1
  const x = floater.baseX + Math.sin(timer * floater.frequency + floater.phase) * floater.amplitude

  return { ...floater, timer, x }
}

export function renderFloater(floater) {
  const ctx = getCtx()
  const cx = floater.x + floater.w / 2
  const cy = floater.y + floater.h / 2
  const radius = floater.w / 2

  // Glow behind
  ctx.globalAlpha = 0.15
  ctx.fillStyle = '#9b59b6'
  ctx.beginPath()
  ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2)
  ctx.fill()

  // Body (semi-transparent purple circle)
  ctx.globalAlpha = 0.7
  ctx.fillStyle = '#8e44ad'
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()

  // Eye — white sclera
  ctx.globalAlpha = 1
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2)
  ctx.fill()

  // Eye — dark pupil
  ctx.fillStyle = '#1a0030'
  ctx.beginPath()
  ctx.arc(cx + 1, cy + 1, radius * 0.25, 0, Math.PI * 2)
  ctx.fill()

  // Flickering probability label
  const prob = Math.random().toFixed(2)
  ctx.font = '8px monospace'
  ctx.fillStyle = '#d7bde2'
  ctx.textAlign = 'center'
  ctx.fillText(`p=${prob}`, cx, floater.y + floater.h + 10)
  ctx.textAlign = 'left'

  ctx.globalAlpha = 1
}

// ---------------------------------------------------------------------------
// Turret — "Overfitting Turret"
// ---------------------------------------------------------------------------

export function createTurret(x, y, fireInterval = 90, projectileSpeed = 2.5, range = 300) {
  return {
    x,
    y,
    w: 24,
    h: 24,
    type: 'turret',
    fireInterval,
    projectileSpeed,
    range,
    timer: 0,
    angle: 0,
    active: true
  }
}

export function updateTurret(turret, playerRect, createProjectileFn) {
  const cx = turret.x + turret.w / 2
  const cy = turret.y + turret.h / 2
  const pcx = playerRect.x + playerRect.w / 2
  const pcy = playerRect.y + playerRect.h / 2

  const dx = pcx - cx
  const dy = pcy - cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  const inRange = dist <= turret.range

  const angle = inRange ? Math.atan2(dy, dx) : turret.angle
  const timer = turret.timer + 1

  if (inRange && timer >= turret.fireInterval) {
    const vx = Math.cos(angle) * turret.projectileSpeed
    const vy = Math.sin(angle) * turret.projectileSpeed
    const newProjectiles = [createProjectileFn(cx, cy, vx, vy)]

    return {
      turret: { ...turret, timer: 0, angle },
      newProjectiles
    }
  }

  return {
    turret: { ...turret, timer, angle },
    newProjectiles: []
  }
}

export function renderTurret(turret) {
  const ctx = getCtx()
  const cx = turret.x + turret.w / 2
  const cy = turret.y + turret.h / 2

  // Base — dark gray square with border
  ctx.fillStyle = '#2c3e50'
  ctx.fillRect(turret.x, turret.y, turret.w, turret.h)
  ctx.strokeStyle = '#566573'
  ctx.lineWidth = 1.5
  ctx.strokeRect(turret.x + 0.5, turret.y + 0.5, turret.w - 1, turret.h - 1)

  // Barrel line in direction of angle (length ~16px)
  ctx.strokeStyle = '#95a5a6'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + Math.cos(turret.angle) * 16, cy + Math.sin(turret.angle) * 16)
  ctx.stroke()

  // Red LED dot in top-right corner
  ctx.fillStyle = '#e74c3c'
  ctx.beginPath()
  ctx.arc(turret.x + turret.w - 4, turret.y + 4, 2, 0, Math.PI * 2)
  ctx.fill()

  // "overfit" label below
  ctx.font = '8px monospace'
  ctx.fillStyle = '#aab7b8'
  ctx.textAlign = 'center'
  ctx.fillText('overfit', cx, turret.y + turret.h + 10)
  ctx.textAlign = 'left'
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export function getEnemyHitbox(enemy) {
  if (enemy.type === 'crawler' && !enemy.alive) return null

  const shrink = 2
  return {
    x: enemy.x + shrink,
    y: enemy.y + shrink,
    w: enemy.w - shrink * 2,
    h: enemy.h - shrink * 2
  }
}

export function checkEnemyStomp(player, enemy) {
  if (enemy.type === 'floater') return 'kill'
  if (enemy.type === 'turret') return null
  if (enemy.type === 'crawler' && !enemy.alive) return null

  if (player.vy > 0 && (player.y + player.h) < (enemy.y + enemy.h * 0.6)) {
    return 'stomp'
  }

  return 'kill'
}

export function stompEnemy(enemy) {
  return { ...enemy, alive: false, squishTimer: 20, vx: 0 }
}

export function getStompBounceVelocity() {
  return JUMP_VELOCITY * 0.6
}
