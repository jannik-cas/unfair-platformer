import { getCtx, GAME_WIDTH, GAME_HEIGHT, getCanvasMousePos } from '../engine/canvas.js'
import { isJustPressed, getLastTypedChar } from '../engine/input.js'
import { getTotalLevels, getLevelNames, isUnderworldDiscovered, getUnderworldLevels } from '../levels/level-manager.js'
import { setGoldenHoodie, drawPlayer } from '../sprites/pixel-art.js'
import { triggerFlash } from './screen-flash.js'
import {
  getTotalStars, getMaxStars, getUnlockedCount, getTotalAchievements,
  getLevelStats, getStarsForDeaths, renderAchievementScreen, unlock
} from './achievements.js'

let titleBounce = 0
let blinkTimer = 0
let menuState = 'title' // 'title', 'levelSelect', or 'achievements'
let selectedLevel = 1
let highestCompleted = parseInt(localStorage.getItem('unfair-progress') || '0', 10)

// === Konami Code Easter Egg ===
const KONAMI_SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA']
let konamiBuffer = []
let konamiActivated = localStorage.getItem('unfair-golden-hoodie') === 'true'
let konamiTerminalTimer = 0
const KONAMI_TERMINAL_TEXT = '$ sudo deploy --force'

// === Pip Install Easter Egg ===
let typingBuffer = ''
let terminalVisible = false
let pipTriggered = false
let pipAnimTimer = 0
let pipSubtitleChanged = false
const PIP_TARGETS = ['pip install success', 'npm install hope']

// === DDS Title Click Easter Egg ===
const DDS_MEANINGS = [
  'Deploy, Debug, Suffer',
  'Data Doesn\'t Scale',
  'Deployment Destroys Sanity',
  'Debugging During Sleep',
  'Desperately Deploying Stuff',
  'Docker Docker Sadness',
  'Deadlines, Drift, Spaghetti',
  'Dein Deployment Scheitert',
]
let ddsClickIndex = 0
let ddsClickTimer = 0
let titleClickHandler = null

// === Title Screen Character ===
let titleCharX = 120
let titleCharFrame = 0
let titleCharTimer = 0
let titleCharFacing = true
let titleCharFalling = false
let titleCharY = GAME_HEIGHT - 52

function setupTitleClick() {
  if (titleClickHandler) return
  const canvas = document.getElementById('game')
  titleClickHandler = (e) => {
    const pos = getCanvasMousePos(e.clientX, e.clientY)
    const titleY = 150 + Math.sin(titleBounce) * 8
    // Check if click is on the "DDS" title area
    if (pos.x > GAME_WIDTH / 2 - 60 && pos.x < GAME_WIDTH / 2 + 60 &&
        pos.y > titleY - 35 && pos.y < titleY + 10) {
      ddsClickIndex = (ddsClickIndex + 1) % DDS_MEANINGS.length
      ddsClickTimer = 120
    }
  }
  canvas.addEventListener('click', titleClickHandler)
}

function removeTitleClick() {
  if (!titleClickHandler) return
  const canvas = document.getElementById('game')
  canvas.removeEventListener('click', titleClickHandler)
  titleClickHandler = null
}

export function updateMenu() {
  titleBounce += 0.03
  blinkTimer += 1

  if (menuState === 'title') {
    setupTitleClick()

    // DDS click timer
    if (ddsClickTimer > 0) ddsClickTimer -= 1

    // Title screen character animation
    titleCharTimer += 1
    if (titleCharTimer % 12 === 0) {
      titleCharFrame = (titleCharFrame + 1) % 3
    }
    // Wander back and forth
    if (titleCharFacing) {
      titleCharX += 0.5
      if (titleCharX > GAME_WIDTH - 40) titleCharFacing = false
    } else {
      titleCharX -= 0.5
      if (titleCharX < 20) titleCharFacing = true
    }

    // Konami code detection
    if (!konamiActivated && konamiTerminalTimer <= 0) {
      for (const code of KONAMI_SEQ) {
        if (isJustPressed(code)) {
          konamiBuffer.push(code)
          if (konamiBuffer.length > KONAMI_SEQ.length) {
            konamiBuffer.shift()
          }
          break
        }
      }
      if (konamiBuffer.length === KONAMI_SEQ.length &&
          konamiBuffer.every((k, i) => k === KONAMI_SEQ[i])) {
        konamiActivated = true
        konamiTerminalTimer = 150
        setGoldenHoodie(true)
        konamiBuffer = []
        unlock('konami')
      }
    }

    // Konami terminal animation timer
    if (konamiTerminalTimer > 0) {
      konamiTerminalTimer -= 1
      if (konamiTerminalTimer === 30) {
        triggerFlash('#00ff00', 0.5)
      }
      return null
    }

    // Pip animation timer (blocks all input while playing)
    if (pipTriggered && pipAnimTimer < 300) {
      pipAnimTimer += 1
      if (pipAnimTimer >= 240) {
        pipSubtitleChanged = true
      }
      return null
    }

    // Menu shortcuts take priority over terminal typing
    if (!terminalVisible) {
      if (isJustPressed('Space') || isJustPressed('Enter')) {
        getLastTypedChar() // consume to prevent terminal activation
        return { action: 'start', level: 1 }
      }
      if (isJustPressed('KeyL') || isJustPressed('Tab')) {
        getLastTypedChar() // consume
        removeTitleClick()
        menuState = 'levelSelect'
        selectedLevel = 1
        highestCompleted = parseInt(localStorage.getItem('unfair-progress') || '0', 10)
        return null
      }
      if (isJustPressed('KeyA')) {
        getLastTypedChar() // consume
        removeTitleClick()
        menuState = 'achievements'
        return null
      }
    }

    // Pip install typing detection
    if (!pipTriggered) {
      const ch = getLastTypedChar()
      if (ch && !terminalVisible && ch !== ' ') {
        terminalVisible = true
        typingBuffer = ch
      } else if (ch && terminalVisible) {
        typingBuffer += ch
      }

      if (terminalVisible && isJustPressed('Enter')) {
        const trimmed = typingBuffer.trim().toLowerCase()
        if (PIP_TARGETS.includes(trimmed)) {
          pipTriggered = true
          pipAnimTimer = 0
          unlock('pip')
        } else {
          typingBuffer = ''
          terminalVisible = false
        }
      }

      if (terminalVisible && isJustPressed('Escape')) {
        typingBuffer = ''
        terminalVisible = false
      }
    }

    return null
  }

  if (menuState === 'achievements') {
    if (isJustPressed('Escape') || isJustPressed('Backspace')) {
      menuState = 'title'
    }
    return null
  }

  if (menuState === 'levelSelect') {
    const total = getTotalLevels()
    const cols = 5
    const uwDiscovered = isUnderworldDiscovered()
    const uwLevels = uwDiscovered ? getUnderworldLevels() : []

    // Build navigable level list: [1..total, 101..105]
    const allLevels = []
    for (let i = 1; i <= total; i++) allLevels.push(i)
    for (const uw of uwLevels) allLevels.push(uw)

    const curIdx = allLevels.indexOf(selectedLevel)

    if (isJustPressed('Escape') || isJustPressed('Backspace')) {
      menuState = 'title'
      return null
    }
    if (isJustPressed('ArrowRight') || isJustPressed('KeyD')) {
      if (curIdx >= 0 && curIdx < allLevels.length - 1) {
        selectedLevel = allLevels[curIdx + 1]
      }
    }
    if (isJustPressed('ArrowLeft') || isJustPressed('KeyA')) {
      if (curIdx > 0) {
        selectedLevel = allLevels[curIdx - 1]
      }
    }
    if (isJustPressed('ArrowDown') || isJustPressed('KeyS')) {
      if (selectedLevel <= total) {
        const next = Math.min(total, selectedLevel + cols)
        // If at bottom row of main grid and UW exists, jump to UW
        if (next === selectedLevel && uwLevels.length > 0) {
          selectedLevel = uwLevels[0]
        } else {
          selectedLevel = next
        }
      }
    }
    if (isJustPressed('ArrowUp') || isJustPressed('KeyW')) {
      if (selectedLevel >= 100) {
        // Jump from underworld back to last row of main grid
        selectedLevel = Math.max(1, total - (total % cols || cols) + 1)
      } else {
        selectedLevel = Math.max(1, selectedLevel - cols)
      }
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

  if (menuState === 'achievements') {
    renderAchievementScreen(ctx)
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

  // Full title below — shows alternate meanings when DDS is clicked
  ctx.font = 'bold 20px monospace'
  ctx.fillStyle = '#55efc4'
  let subtitle
  if (pipSubtitleChanged) {
    subtitle = 'Deploy, Debug, Suffer, Repeat'
  } else if (ddsClickTimer > 0) {
    subtitle = DDS_MEANINGS[ddsClickIndex]
  } else {
    subtitle = DDS_MEANINGS[0]
  }
  ctx.fillText(subtitle, GAME_WIDTH / 2, titleY + 35)

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

  // Level select + achievements hints
  ctx.font = '14px monospace'
  ctx.fillStyle = '#00d4aa'
  ctx.fillText('L level select  |  A achievements', GAME_WIDTH / 2, 360)

  // Stars + achievements summary
  const stars = getTotalStars()
  const maxStars = getMaxStars(getTotalLevels())
  const achCount = getUnlockedCount()
  const achTotal = getTotalAchievements()
  if (stars > 0 || achCount > 0) {
    ctx.font = '12px monospace'
    ctx.fillStyle = '#f1c40f'
    ctx.fillText(`\u2605 ${stars}/${maxStars}  |  Achievements: ${achCount}/${achTotal}`, GAME_WIDTH / 2, 380)
  }

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

  // Title screen character wandering at the bottom
  ctx.save()
  ctx.globalAlpha = 0.6
  drawPlayer(titleCharX, titleCharY, titleCharFrame, titleCharFacing)
  ctx.restore()

  // Konami terminal overlay
  if (konamiTerminalTimer > 0) {
    renderKonamiTerminal(ctx)
  }

  // Pip install terminal
  if (terminalVisible || (pipTriggered && pipAnimTimer < 300)) {
    renderPipTerminal(ctx)
  }

  ctx.restore()
}

function renderKonamiTerminal(ctx) {
  const progress = 1 - (konamiTerminalTimer / 150)
  const charsToShow = Math.min(KONAMI_TERMINAL_TEXT.length, Math.floor(progress * 80))

  ctx.save()
  // Dark overlay
  ctx.fillStyle = '#000'
  ctx.globalAlpha = 0.85
  ctx.fillRect(GAME_WIDTH / 2 - 200, 180, 400, 120)
  ctx.globalAlpha = 1

  // Terminal border
  ctx.strokeStyle = '#00ff00'
  ctx.lineWidth = 1
  ctx.strokeRect(GAME_WIDTH / 2 - 200, 180, 400, 120)

  ctx.font = '16px monospace'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#00ff00'

  const text = KONAMI_TERMINAL_TEXT.slice(0, charsToShow)
  ctx.fillText(text + (charsToShow < KONAMI_TERMINAL_TEXT.length ? '_' : ''), GAME_WIDTH / 2 - 180, 220)

  if (konamiTerminalTimer < 30) {
    ctx.font = 'bold 18px monospace'
    ctx.fillStyle = '#00ff00'
    ctx.textAlign = 'center'
    ctx.fillText('ACCESS GRANTED', GAME_WIDTH / 2, 260)

    ctx.font = '12px monospace'
    ctx.fillStyle = '#888'
    ctx.fillText('Hoodie upgraded to Senior Engineer gold', GAME_WIDTH / 2, 282)
  }

  ctx.restore()
}

function renderPipTerminal(ctx) {
  const termX = GAME_WIDTH / 2 - 220
  const termY = 380
  const termW = 440
  const termH = 80

  ctx.save()
  ctx.fillStyle = '#000'
  ctx.globalAlpha = 0.9
  ctx.fillRect(termX, termY, termW, termH)
  ctx.globalAlpha = 1

  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  ctx.strokeRect(termX, termY, termW, termH)

  ctx.font = '13px monospace'
  ctx.textAlign = 'left'

  if (!pipTriggered) {
    // Show typing buffer
    ctx.fillStyle = '#00ff00'
    const cursor = Math.floor(blinkTimer / 20) % 2 === 0 ? '_' : ''
    ctx.fillText('> ' + typingBuffer + cursor, termX + 10, termY + 25)

    ctx.fillStyle = '#555'
    ctx.font = '10px monospace'
    ctx.fillText('Enter to submit  |  ESC to close', termX + 10, termY + 65)
  } else {
    // Pip animation sequence
    ctx.fillStyle = '#00ff00'
    ctx.fillText('> ' + typingBuffer, termX + 10, termY + 20)

    ctx.fillStyle = '#ccc'
    if (pipAnimTimer < 40) {
      ctx.fillText('Collecting success...', termX + 10, termY + 38)
    } else if (pipAnimTimer < 90) {
      ctx.fillText('Resolving dependencies (hope>=1.0, patience>=999)...', termX + 10, termY + 38)
    } else if (pipAnimTimer < 180) {
      const barLen = 30
      const filled = Math.floor(((pipAnimTimer - 90) / 90) * barLen)
      const empty = barLen - filled
      const pct = Math.floor(((pipAnimTimer - 90) / 90) * 100)
      const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty)
      ctx.fillText(`[${bar}] ${pct}%`, termX + 10, termY + 38)
    } else if (pipAnimTimer < 240) {
      ctx.fillStyle = '#ff4444'
      ctx.fillText("ERROR: No matching distribution found for 'success'", termX + 10, termY + 38)
      ctx.fillStyle = '#888'
      ctx.font = '11px monospace'
      ctx.fillText("Hint: try 'pip install resilience' instead", termX + 10, termY + 58)
    } else {
      ctx.fillStyle = '#ff4444'
      ctx.fillText("ERROR: No matching distribution found for 'success'", termX + 10, termY + 38)
      ctx.fillStyle = '#55efc4'
      ctx.font = '11px monospace'
      ctx.fillText('Subtitle patched. Deploying anyway...', termX + 10, termY + 58)
    }
  }

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

    // Stars + stats
    const lvlStats = getLevelStats(i)
    if (lvlStats) {
      const stars = getStarsForDeaths(lvlStats.bestDeaths)
      ctx.font = '10px monospace'
      ctx.textAlign = 'right'

      // Stars
      let starStr = ''
      for (let s = 0; s < 3; s++) {
        starStr += s < stars ? '\u2605' : '\u2606'
      }
      ctx.fillStyle = stars > 0 ? '#f1c40f' : '#333'
      ctx.fillText(starStr, cx + cardW - 6, cy + 20)

      // Best deaths + time
      const timeSec = (lvlStats.bestTime / 60).toFixed(1)
      ctx.font = '8px monospace'
      ctx.fillStyle = '#666'
      ctx.fillText(`${lvlStats.bestDeaths}d  ${timeSec}s`, cx + cardW - 6, cy + 34)
    } else if (isCompleted) {
      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'right'
      ctx.fillStyle = '#55efc4'
      ctx.fillText('\u2713', cx + cardW - 8, cy + 22)
    }
  }

  // Underworld section
  if (isUnderworldDiscovered()) {
    const uwLevels = getUnderworldLevels()
    const uwY = startY + rows * (cardH + gapY) + 10

    ctx.font = 'bold 14px monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#aa3333'
    ctx.fillText('\u2620 UNDERWORLD \u2620', GAME_WIDTH / 2, uwY)

    const uwCardW = 130
    const uwStartX = (GAME_WIDTH - uwLevels.length * (uwCardW + gapX) + gapX) / 2
    for (let j = 0; j < uwLevels.length; j++) {
      const uwNum = uwLevels[j]
      const ux = uwStartX + j * (uwCardW + gapX)
      const uy = uwY + 10
      const isSelected = uwNum === selectedLevel

      ctx.fillStyle = isSelected ? '#2a1020' : '#150810'
      ctx.fillRect(ux, uy, uwCardW, cardH)
      ctx.strokeStyle = isSelected ? '#aa3333' : '#331122'
      ctx.lineWidth = isSelected ? 2 : 1
      ctx.strokeRect(ux, uy, uwCardW, cardH)

      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = isSelected ? '#aa3333' : '#663333'
      ctx.fillText(`${uwNum - 100}`, ux + 8, uy + 22)

      ctx.font = '9px monospace'
      ctx.fillStyle = isSelected ? '#ccc' : '#666'
      ctx.fillText(names[uwNum] || `UW-${uwNum - 100}`, ux + 8, uy + 42)

      const uwStats = getLevelStats(uwNum)
      if (uwStats) {
        const stars = getStarsForDeaths(uwStats.bestDeaths)
        ctx.font = '10px monospace'
        ctx.textAlign = 'right'
        let starStr = ''
        for (let s = 0; s < 3; s++) {
          starStr += s < stars ? '\u2605' : '\u2606'
        }
        ctx.fillStyle = stars > 0 ? '#f1c40f' : '#333'
        ctx.fillText(starStr, ux + uwCardW - 6, uy + 20)
      }
    }
  }

  // Footer
  ctx.font = '13px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#666'
  const footerY = startY + rows * (cardH + gapY) + (isUnderworldDiscovered() ? 100 : 20)
  ctx.fillText('Arrows to navigate  |  SPACE to start  |  ESC to go back', GAME_WIDTH / 2, footerY)

  ctx.restore()
}
