import { getCtx, GAME_WIDTH, GAME_HEIGHT, getCanvasMousePos, getScale } from '../engine/canvas.js'
import { onCanvasClick, removeCanvasClick } from '../engine/input.js'

export function createFakeGameOver(options = {}) {
  return {
    type: 'fake-gameover',
    active: false,
    timer: 0,
    fadeIn: 0,
    message: options.message || 'PIPELINE FAILED',
    subMessage: options.subMessage || 'Click to redeploy',
    killOnClick: options.killOnClick ?? true
  }
}

export function createFakeVictory(options = {}) {
  return {
    type: 'fake-victory',
    active: false,
    timer: 0,
    fadeIn: 0,
    message: options.message || 'RELEASE COMPLETE!',
    subMessage: options.subMessage || 'Deployment erfolgreich!',
    confettiParticles: []
  }
}

export function createFakeLoading(options = {}) {
  return {
    type: 'fake-loading',
    active: false,
    timer: 0,
    progress: 0,
    message: options.message || 'Deploying to Prod...',
    barX: GAME_WIDTH / 2 - 150,
    barY: GAME_HEIGHT / 2,
    barW: 300,
    barH: 20
  }
}

export function activateFakeUI(fakeUI) {
  return { ...fakeUI, active: true, timer: 0, fadeIn: 0 }
}

export function updateFakeUI(fakeUI) {
  if (!fakeUI || !fakeUI.active) return fakeUI

  const newTimer = fakeUI.timer + 1
  const newFadeIn = Math.min(1, fakeUI.fadeIn + 0.03)

  switch (fakeUI.type) {
    case 'fake-loading': {
      const newProgress = Math.min(1, fakeUI.progress + 0.005)
      return { ...fakeUI, timer: newTimer, fadeIn: newFadeIn, progress: newProgress }
    }
    case 'fake-victory': {
      let particles = fakeUI.confettiParticles
      // Spawn confetti
      if (newTimer % 3 === 0 && newTimer < 120) {
        const newParticle = {
          x: Math.random() * GAME_WIDTH,
          y: -10,
          vx: (Math.random() - 0.5) * 3,
          vy: Math.random() * 2 + 1,
          color: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0'][Math.floor(Math.random() * 5)],
          size: 4 + Math.random() * 4
        }
        particles = [...particles, newParticle]
      }
      // Update particles
      particles = particles
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.05 }))
        .filter(p => p.y < GAME_HEIGHT + 20)

      return { ...fakeUI, timer: newTimer, fadeIn: newFadeIn, confettiParticles: particles }
    }
    default:
      return { ...fakeUI, timer: newTimer, fadeIn: newFadeIn }
  }
}

export function renderFakeUI(fakeUI) {
  if (!fakeUI || !fakeUI.active) return
  const ctx = getCtx()

  ctx.save()
  ctx.globalAlpha = fakeUI.fadeIn

  switch (fakeUI.type) {
    case 'fake-gameover':
      renderFakeGameOver(ctx, fakeUI)
      break
    case 'fake-victory':
      renderFakeVictory(ctx, fakeUI)
      break
    case 'fake-loading':
      renderFakeLoading(ctx, fakeUI)
      break
  }

  ctx.restore()
}

function renderFakeGameOver(ctx, fakeUI) {
  // Dark overlay
  ctx.fillStyle = '#000'
  ctx.globalAlpha = fakeUI.fadeIn * 0.8
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  ctx.globalAlpha = fakeUI.fadeIn

  // Game over text
  ctx.font = 'bold 48px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ff0000'
  ctx.fillText(fakeUI.message, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20)

  // Restart button
  ctx.font = '20px monospace'
  ctx.fillStyle = '#fff'
  ctx.fillText(fakeUI.subMessage, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30)

  // Fake button
  const btnW = 200
  const btnH = 40
  const btnX = GAME_WIDTH / 2 - btnW / 2
  const btnY = GAME_HEIGHT / 2 + 50
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.strokeRect(btnX, btnY, btnW, btnH)
  ctx.font = '16px monospace'
  ctx.fillText('REDEPLOY', GAME_WIDTH / 2, btnY + 26)
}

function renderFakeVictory(ctx, fakeUI) {
  // Bright overlay
  ctx.fillStyle = '#000'
  ctx.globalAlpha = fakeUI.fadeIn * 0.6
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  ctx.globalAlpha = fakeUI.fadeIn

  // Confetti
  for (const p of fakeUI.confettiParticles) {
    ctx.fillStyle = p.color
    ctx.fillRect(p.x, p.y, p.size, p.size)
  }

  // Victory text
  ctx.font = 'bold 52px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffd700'
  ctx.fillText(fakeUI.message, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20)

  ctx.font = '22px monospace'
  ctx.fillStyle = '#fff'
  ctx.fillText(fakeUI.subMessage, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30)
}

function renderFakeLoading(ctx, fakeUI) {
  // Full black
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  ctx.globalAlpha = 1

  // Loading text
  ctx.font = '20px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#aaa'
  ctx.fillText(fakeUI.message, GAME_WIDTH / 2, fakeUI.barY - 20)

  // Progress bar background
  ctx.fillStyle = '#333'
  ctx.fillRect(fakeUI.barX, fakeUI.barY, fakeUI.barW, fakeUI.barH)

  // Progress bar fill
  ctx.fillStyle = '#4a90d9'
  ctx.fillRect(fakeUI.barX, fakeUI.barY, fakeUI.barW * fakeUI.progress, fakeUI.barH)

  // Percentage
  ctx.font = '14px monospace'
  ctx.fillStyle = '#fff'
  ctx.fillText(`${Math.floor(fakeUI.progress * 100)}%`, GAME_WIDTH / 2, fakeUI.barY + 50)
}
