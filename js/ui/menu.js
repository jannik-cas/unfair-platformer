import { getCtx, GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'
import { isJustPressed } from '../engine/input.js'
import { getTotalLevels, getLevelNames } from '../levels/level-manager.js'

let titleBounce = 0
let blinkTimer = 0
let menuState = 'title' // 'title' or 'levelSelect'
let selectedLevel = 1
let highestCompleted = parseInt(localStorage.getItem('unfair-progress') || '0', 10)

export function updateMenu() {
  titleBounce += 0.03
  blinkTimer += 1

  if (menuState === 'title') {
    if (isJustPressed('Space') || isJustPressed('Enter')) {
      return { action: 'start', level: 1 }
    }
    if (isJustPressed('KeyL') || isJustPressed('Tab')) {
      menuState = 'levelSelect'
      selectedLevel = 1
      highestCompleted = parseInt(localStorage.getItem('unfair-progress') || '0', 10)
      return null
    }
    return null
  }

  if (menuState === 'levelSelect') {
    const total = getTotalLevels()
    const cols = 5

    if (isJustPressed('Escape') || isJustPressed('Backspace')) {
      menuState = 'title'
      return null
    }
    if (isJustPressed('ArrowRight') || isJustPressed('KeyD')) {
      selectedLevel = Math.min(total, selectedLevel + 1)
    }
    if (isJustPressed('ArrowLeft') || isJustPressed('KeyA')) {
      selectedLevel = Math.max(1, selectedLevel - 1)
    }
    if (isJustPressed('ArrowDown') || isJustPressed('KeyS')) {
      selectedLevel = Math.min(total, selectedLevel + cols)
    }
    if (isJustPressed('ArrowUp') || isJustPressed('KeyW')) {
      selectedLevel = Math.max(1, selectedLevel - cols)
    }
    if (isJustPressed('Space') || isJustPressed('Enter')) {
      menuState = 'title'
      return { action: 'start', level: selectedLevel }
    }
    return null
  }

  return null
}

export function renderMenu(totalDeaths) {
  const ctx = getCtx()

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
  gradient.addColorStop(0, '#0a192f')
  gradient.addColorStop(1, '#172a45')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  // Floating data particles
  ctx.fillStyle = '#00d4aa'
  for (let i = 0; i < 30; i++) {
    const px = (Math.sin(titleBounce + i * 0.5) * 0.5 + 0.5) * GAME_WIDTH
    const py = (Math.cos(titleBounce * 0.7 + i * 0.8) * 0.5 + 0.5) * GAME_HEIGHT
    ctx.globalAlpha = 0.1 + Math.sin(titleBounce + i) * 0.1
    ctx.fillRect(px, py, 2, 2)
  }
  ctx.globalAlpha = 1

  if (menuState === 'levelSelect') {
    renderLevelSelect(ctx)
    return
  }

  renderTitle(ctx, totalDeaths)
}

function renderTitle(ctx, totalDeaths) {
  const titleY = 150 + Math.sin(titleBounce) * 8

  ctx.save()
  ctx.font = 'bold 44px monospace'
  ctx.textAlign = 'center'

  // Title shadow
  ctx.fillStyle = '#00d4aa44'
  ctx.fillText('DDS', GAME_WIDTH / 2 + 3, titleY + 3)

  // Title main
  ctx.fillStyle = '#00d4aa'
  ctx.fillText('DDS', GAME_WIDTH / 2, titleY)

  // Full title below
  ctx.font = 'bold 20px monospace'
  ctx.fillStyle = '#55efc4'
  ctx.fillText('Deploy, Debug, Suffer', GAME_WIDTH / 2, titleY + 35)

  // Subtitle
  ctx.font = '13px monospace'
  ctx.fillStyle = '#888'
  ctx.fillText('Dein Modell scheitert. Dein Deployment scheitert.', GAME_WIDTH / 2, titleY + 58)
  ctx.fillText('Du scheiterst.', GAME_WIDTH / 2, titleY + 74)

  // Start prompt (blinking)
  if (Math.floor(blinkTimer / 30) % 2 === 0) {
    ctx.font = 'bold 20px monospace'
    ctx.fillStyle = '#fff'
    ctx.fillText('Press SPACE to deploy', GAME_WIDTH / 2, 330)
  }

  // Level select hint
  ctx.font = '14px monospace'
  ctx.fillStyle = '#00d4aa'
  ctx.fillText('Press L for level select', GAME_WIDTH / 2, 360)

  // Controls
  ctx.font = '13px monospace'
  ctx.fillStyle = '#666'
  ctx.fillText('WASD / Arrow Keys to move   |   SPACE to jump', GAME_WIDTH / 2, 400)

  // Death counter from previous sessions
  if (totalDeaths > 0) {
    ctx.font = '14px monospace'
    ctx.fillStyle = '#ff6666'
    ctx.fillText(`Vorherige Incidents: ${totalDeaths} Abst\u00FCrze`, GAME_WIDTH / 2, 435)
  }

  // Warning
  ctx.font = '11px monospace'
  ctx.fillStyle = '#444'
  ctx.fillText('Trust no pipeline. Question every metric. Viel Gl\u00FCck.', GAME_WIDTH / 2, 460)

  ctx.restore()
}

function renderLevelSelect(ctx) {
  const names = getLevelNames()
  const total = getTotalLevels()
  const cols = 5
  const rows = Math.ceil(total / cols)

  const cardW = 130
  const cardH = 60
  const gapX = 14
  const gapY = 12
  const gridW = cols * cardW + (cols - 1) * gapX
  const startX = (GAME_WIDTH - gridW) / 2
  const startY = 100

  ctx.save()

  // Header
  ctx.font = 'bold 28px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#00d4aa'
  ctx.fillText('Model Checkpoints', GAME_WIDTH / 2, 60)

  ctx.font = '12px monospace'
  ctx.fillStyle = '#666'
  ctx.fillText('Select a checkpoint  |  ESC to go back', GAME_WIDTH / 2, 82)

  // Level cards
  for (let i = 1; i <= total; i++) {
    const col = (i - 1) % cols
    const row = Math.floor((i - 1) / cols)
    const cx = startX + col * (cardW + gapX)
    const cy = startY + row * (cardH + gapY)
    const isSelected = i === selectedLevel
    const isCompleted = i <= highestCompleted

    // Card background
    ctx.fillStyle = isSelected ? '#1a3a5c' : '#0d1f33'
    ctx.fillRect(cx, cy, cardW, cardH)

    // Border
    ctx.strokeStyle = isSelected ? '#00d4aa' : '#1b3350'
    ctx.lineWidth = isSelected ? 2 : 1
    ctx.strokeRect(cx, cy, cardW, cardH)

    // Level number
    ctx.font = 'bold 18px monospace'
    ctx.textAlign = 'left'
    ctx.fillStyle = isSelected ? '#00d4aa' : '#4a6fa5'
    ctx.fillText(`${i}`, cx + 8, cy + 22)

    // Level name
    ctx.font = '9px monospace'
    ctx.fillStyle = isSelected ? '#fff' : '#888'
    const name = names[i] || `Level ${i}`
    ctx.fillText(name, cx + 8, cy + 42)

    // Completed checkmark
    if (isCompleted) {
      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'right'
      ctx.fillStyle = '#55efc4'
      ctx.fillText('\u2713', cx + cardW - 8, cy + 22)
    }
  }

  // Footer
  ctx.font = '13px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#666'
  const footerY = startY + rows * (cardH + gapY) + 20
  ctx.fillText('Arrows to navigate  |  SPACE to start  |  ESC to go back', GAME_WIDTH / 2, footerY)

  ctx.restore()
}
