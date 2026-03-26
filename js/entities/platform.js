import { drawPlatform } from '../sprites/pixel-art.js'

export function createPlatform(x, y, w, h, type = 'solid', options = {}) {
  const base = {
    x, y, w, h, type,
    solid: type !== 'fake',
    visible: type !== 'hidden',
    active: true
  }

  switch (type) {
    case 'crumble':
      return {
        ...base,
        shaking: false,
        shakeTimer: 0,
        collapsed: false,
        resetTimer: 0,
        shakeTime: options.shakeTime || 18,
        resetTime: options.resetTime || 120
      }

    case 'moving':
      return {
        ...base,
        startX: x, startY: y,
        endX: options.endX ?? x,
        endY: options.endY ?? y,
        speed: options.speed || 1,
        progress: 0,
        direction: 1,
        speedMultiplier: options.speedMultiplier || 1,
        accelerates: options.accelerates || false
      }

    case 'disappearing':
      return {
        ...base,
        timer: options.offset || 0,
        onTime: options.onTime || 60,
        offTime: options.offTime || 60,
        phase: 'on'
      }

    case 'hidden':
      return {
        ...base,
        solid: true,
        revealed: false
      }

    case 'fake':
      return { ...base, solid: false, visible: true }

    case 'bouncy':
      return { ...base, bounceAnim: 0 }

    case 'locked':
      return {
        ...base,
        solid: false,
        keyId: options.keyId || 'key1',
        unlocked: false
      }

    case 'icy':
      return base

    default:
      return base
  }
}

export function updatePlatform(platform, playerRect) {
  switch (platform.type) {
    case 'crumble':
      return updateCrumble(platform, playerRect)
    case 'moving':
      return updateMoving(platform)
    case 'disappearing':
      return updateDisappearing(platform)
    case 'hidden':
      return updateHidden(platform, playerRect)
    case 'bouncy':
      return updateBouncy(platform)
    case 'locked':
      return platform
    default:
      return platform
  }
}

function updateCrumble(platform, playerRect) {
  if (platform.collapsed) {
    const newResetTimer = platform.resetTimer + 1
    if (newResetTimer >= platform.resetTime) {
      return {
        ...platform,
        collapsed: false,
        shaking: false,
        shakeTimer: 0,
        resetTimer: 0,
        solid: true,
        visible: true
      }
    }
    return { ...platform, resetTimer: newResetTimer }
  }

  if (platform.shaking) {
    const newShakeTimer = platform.shakeTimer + 1
    if (newShakeTimer >= platform.shakeTime) {
      return { ...platform, collapsed: true, solid: false, visible: false, shakeTimer: 0, resetTimer: 0 }
    }
    return { ...platform, shakeTimer: newShakeTimer }
  }

  // Check if player is standing on top
  if (playerRect && isStandingOn(playerRect, platform)) {
    return { ...platform, shaking: true, shakeTimer: 0 }
  }

  return platform
}

function updateMoving(platform) {
  let speed = platform.speed
  if (platform.accelerates) {
    speed = speed * (1 + platform.progress * (platform.speedMultiplier - 1))
  }

  let newProgress = platform.progress + (speed / 100) * platform.direction
  let newDirection = platform.direction

  if (newProgress >= 1) {
    newProgress = 1
    newDirection = -1
  } else if (newProgress <= 0) {
    newProgress = 0
    newDirection = 1
  }

  const x = platform.startX + (platform.endX - platform.startX) * newProgress
  const y = platform.startY + (platform.endY - platform.startY) * newProgress

  return { ...platform, x, y, progress: newProgress, direction: newDirection }
}

function updateDisappearing(platform) {
  const newTimer = platform.timer + 1
  const cycleLength = platform.onTime + platform.offTime

  const cyclePos = newTimer % cycleLength
  const isOn = cyclePos < platform.onTime

  return {
    ...platform,
    timer: newTimer,
    phase: isOn ? 'on' : 'off',
    solid: isOn,
    visible: isOn || (cyclePos > platform.onTime - 15 && cyclePos < platform.onTime)
      ? true
      : cyclePos >= platform.onTime && cyclePos < platform.onTime + 15
  }
}

function updateHidden(platform, playerRect) {
  if (platform.revealed) return platform
  if (playerRect && isStandingOn(playerRect, platform)) {
    return { ...platform, revealed: true, visible: true }
  }
  return platform
}

function updateBouncy(platform) {
  const newAnim = Math.max(0, platform.bounceAnim - 1)
  return { ...platform, bounceAnim: newAnim }
}

function isStandingOn(playerRect, platform) {
  return (
    playerRect.x + playerRect.w > platform.x + 2 &&
    playerRect.x < platform.x + platform.w - 2 &&
    playerRect.y + playerRect.h >= platform.y - 2 &&
    playerRect.y + playerRect.h <= platform.y + 6 &&
    playerRect.vy >= 0
  )
}

export function renderPlatform(platform) {
  if (!platform.visible || platform.collapsed) return
  if (platform.type === 'hidden' && !platform.revealed) return
  if (platform.type === 'locked' && !platform.unlocked) {
    const ctx = document.getElementById('game').getContext('2d')
    ctx.globalAlpha = 0.35
    drawPlatform(platform.x, platform.y, platform.w, platform.h, 'solid')
    // Draw keyhole icon
    ctx.fillStyle = '#f1c40f'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('\u{1F512}', platform.x + platform.w / 2, platform.y + platform.h / 2 + 4)
    ctx.textAlign = 'left'
    ctx.globalAlpha = 1
    return
  }

  const ctx = document.getElementById('game').getContext('2d')

  let drawX = platform.x
  let drawY = platform.y

  // Shake effect for crumbling
  if (platform.shaking) {
    drawX += (Math.random() - 0.5) * 4
    drawY += (Math.random() - 0.5) * 2
  }

  // Blink effect for disappearing
  if (platform.type === 'disappearing' && !platform.solid) {
    ctx.globalAlpha = 0.3
  }

  drawPlatform(drawX, drawY, platform.w, platform.h, platform.type)

  ctx.globalAlpha = 1
}
