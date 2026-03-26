import { drawSpike } from '../sprites/pixel-art.js'

export function createSpike(x, y, w, h, options = {}) {
  return {
    x, y, w, h,
    direction: options.direction || 'up',
    type: options.type || 'visible',
    active: true,
    revealed: false,
    revealDistance: options.revealDistance || 80,
    timerOffset: options.timerOffset || 0,
    timer: options.timerOffset || 0,
    onTime: options.onTime || 40,
    offTime: options.offTime || 60,
    phase: 'on'
  }
}

export function updateSpike(spike, playerRect) {
  switch (spike.type) {
    case 'hidden':
      return updateHiddenSpike(spike, playerRect)
    case 'timed':
      return updateTimedSpike(spike)
    default:
      return spike
  }
}

function updateHiddenSpike(spike, playerRect) {
  if (spike.revealed) return spike

  if (!playerRect) return spike

  const dx = Math.abs((playerRect.x + playerRect.w / 2) - (spike.x + spike.w / 2))
  const dy = Math.abs((playerRect.y + playerRect.h / 2) - (spike.y + spike.h / 2))
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist < spike.revealDistance) {
    return { ...spike, revealed: true }
  }

  return spike
}

function updateTimedSpike(spike) {
  const newTimer = spike.timer + 1
  const cycleLength = spike.onTime + spike.offTime
  const cyclePos = newTimer % cycleLength
  const isOn = cyclePos < spike.onTime

  return {
    ...spike,
    timer: newTimer,
    phase: isOn ? 'on' : 'off',
    active: isOn
  }
}

export function getSpikeHitbox(spike) {
  if (!spike.active) return null
  if (spike.type === 'hidden' && !spike.revealed) return null

  // Slightly smaller hitbox than visual for fairness (lol)
  const shrink = 4
  return {
    x: spike.x + shrink,
    y: spike.y + shrink,
    w: spike.w - shrink * 2,
    h: spike.h - shrink * 2
  }
}

export function renderSpike(spike) {
  if (spike.type === 'hidden' && !spike.revealed) return
  if (spike.type === 'timed' && spike.phase === 'off') return

  const ctx = document.getElementById('game').getContext('2d')

  // Fade-in for hidden spikes
  if (spike.type === 'hidden' && spike.revealed) {
    ctx.globalAlpha = 0.9
  }

  // Timed spike warning (blink before disappearing)
  if (spike.type === 'timed') {
    const cyclePos = spike.timer % (spike.onTime + spike.offTime)
    if (cyclePos > spike.onTime - 15) {
      ctx.globalAlpha = 0.5 + Math.sin(cyclePos * 0.5) * 0.5
    }
  }

  drawSpike(spike.x, spike.y, spike.w, spike.h, spike.direction)
  ctx.globalAlpha = 1
}
