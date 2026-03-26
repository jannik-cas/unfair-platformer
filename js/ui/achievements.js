import { getCtx, GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'

const ACHIEVEMENTS = [
  { id: 'first_death', name: 'Erste Fehlermeldung', desc: 'Stirb zum ersten Mal' },
  { id: 'deaths_100', name: 'Robustes Modell', desc: '100 Incidents insgesamt' },
  { id: 'deathless', name: 'Perfekte Epoche', desc: 'Schaffe ein Level ohne Tod' },
  { id: 'deathless_5', name: 'Overfitting-Verdacht', desc: '5 Levels ohne Tod' },
  { id: 'konami', name: 'sudo deploy --force', desc: 'Finde den Konami Code' },
  { id: 'nan_42', name: 'Die Antwort', desc: 'Stirb genau 42 Mal' },
  { id: 'beat_game', name: 'Production Ready', desc: 'Schlie\u00DFe alle Levels ab' },
  { id: 'senior', name: 'Senior Data Scientist', desc: 'Weniger als 50 Incidents' },
  { id: 'speedrun', name: 'Early Stopping', desc: 'Level in unter 10 Sekunden' },
  { id: 'explosion', name: 'Gradient Explosion', desc: '10 Tode in einem Level' },
  { id: 'rollback', name: 'git revert HEAD', desc: 'Finde das versteckte Ziel in Level 16' },
  { id: 'pip', name: 'pip install resilience', desc: 'Benutze das Terminal im Men\u00FC' },
  { id: 'first_stomp', name: 'Bug Squasher', desc: 'Besiege deinen ersten Feind' },
  { id: 'underworld', name: '/dev/null', desc: 'Entdecke die Unterwelt' },
  { id: 'black_swan', name: 'Der Schwarze Schwan', desc: 'Schlie\u00DFe alle Unterwelt-Levels ab' },
  { id: 'all_keys', name: 'Full Access', desc: 'Sammle alle Keys in Level 22' },
  { id: 'shield_save', name: 'Containerized', desc: 'Shield absorbiert einen t\u00F6dlichen Treffer' },
  { id: 'dash_master', name: 'Gradient Descent', desc: 'Benutze den Dash um eine L\u00FCcke zu \u00FCberwinden' },
]

let unlocked = {}
let toastQueue = []
let currentToast = null
let toastTimer = 0

// Load from localStorage
try {
  unlocked = JSON.parse(localStorage.getItem('unfair-achievements') || '{}')
} catch (_e) {
  unlocked = {}
}

function save() {
  try {
    localStorage.setItem('unfair-achievements', JSON.stringify(unlocked))
  } catch (_e) { /* full */ }
}

export function unlock(id) {
  if (unlocked[id]) return false
  unlocked[id] = true
  save()

  const ach = ACHIEVEMENTS.find(a => a.id === id)
  if (ach) {
    toastQueue.push(ach)
  }
  return true
}

export function isUnlocked(id) {
  return !!unlocked[id]
}

export function getUnlockedCount() {
  return Object.keys(unlocked).length
}

export function getTotalAchievements() {
  return ACHIEVEMENTS.length
}

export function getDeathlessCount() {
  const stats = getStats()
  let count = 0
  for (const key of Object.keys(stats)) {
    if (stats[key].bestDeaths === 0) count += 1
  }
  return count
}

// === Per-Level Stats ===
let stats = {}

try {
  stats = JSON.parse(localStorage.getItem('unfair-stats') || '{}')
} catch (_e) {
  stats = {}
}

function saveStats() {
  try {
    localStorage.setItem('unfair-stats', JSON.stringify(stats))
  } catch (_e) { /* full */ }
}

export function getStats() {
  return stats
}

export function getLevelStats(levelNum) {
  return stats[levelNum] || null
}

export function recordLevelComplete(levelNum, deaths, timeFrames) {
  const existing = stats[levelNum] || { bestDeaths: Infinity, bestTime: Infinity, attempts: 0 }
  const isNewBestDeaths = deaths < existing.bestDeaths
  const isNewBestTime = timeFrames < existing.bestTime

  stats[levelNum] = {
    bestDeaths: Math.min(deaths, existing.bestDeaths),
    bestTime: Math.min(timeFrames, existing.bestTime),
    attempts: existing.attempts + 1,
  }
  saveStats()

  return { isNewBestDeaths, isNewBestTime }
}

export function getStarsForDeaths(deaths) {
  if (deaths === 0) return 3
  if (deaths <= 3) return 2
  if (deaths <= 9) return 1
  return 0
}

export function getTotalStars() {
  let total = 0
  for (const key of Object.keys(stats)) {
    total += getStarsForDeaths(stats[key].bestDeaths)
  }
  return total
}

export function getMaxStars(totalLevels) {
  return totalLevels * 3
}

// === Toast Rendering ===
export function updateToast() {
  if (currentToast) {
    toastTimer -= 1
    if (toastTimer <= 0) {
      currentToast = null
    }
  } else if (toastQueue.length > 0) {
    currentToast = toastQueue.shift()
    toastTimer = 180 // 3 seconds
  }
}

export function renderToast() {
  if (!currentToast) return

  const ctx = getCtx()
  const slideIn = toastTimer > 160 ? (180 - toastTimer) / 20 : toastTimer < 20 ? toastTimer / 20 : 1
  const y = -50 + slideIn * 55

  ctx.save()
  ctx.globalAlpha = slideIn

  // Banner background
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(GAME_WIDTH / 2 - 180, y, 360, 44)
  ctx.strokeStyle = '#f1c40f'
  ctx.lineWidth = 2
  ctx.strokeRect(GAME_WIDTH / 2 - 180, y, 360, 44)

  // Trophy icon
  ctx.font = 'bold 18px monospace'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#f1c40f'
  ctx.fillText('\u2605', GAME_WIDTH / 2 - 165, y + 28)

  // Achievement name
  ctx.font = 'bold 14px monospace'
  ctx.fillStyle = '#f1c40f'
  ctx.fillText(currentToast.name, GAME_WIDTH / 2 - 140, y + 20)

  // Description
  ctx.font = '10px monospace'
  ctx.fillStyle = '#888'
  ctx.fillText(currentToast.desc, GAME_WIDTH / 2 - 140, y + 36)

  ctx.restore()
}

// === Achievement Screen (called from menu) ===
export function renderAchievementScreen(ctx) {
  ctx.save()

  ctx.font = 'bold 28px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#f1c40f'
  ctx.fillText('Achievements', GAME_WIDTH / 2, 55)

  ctx.font = '12px monospace'
  ctx.fillStyle = '#666'
  ctx.fillText(`${getUnlockedCount()} / ${ACHIEVEMENTS.length} unlocked  |  ESC to go back`, GAME_WIDTH / 2, 78)

  const cols = 3
  const cardW = 230
  const cardH = 50
  const gapX = 16
  const gapY = 10
  const gridW = cols * cardW + (cols - 1) * gapX
  const startX = (GAME_WIDTH - gridW) / 2
  const startY = 100

  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    const ach = ACHIEVEMENTS[i]
    const col = i % cols
    const row = Math.floor(i / cols)
    const cx = startX + col * (cardW + gapX)
    const cy = startY + row * (cardH + gapY)
    const isLocked = !unlocked[ach.id]

    // Card background
    ctx.fillStyle = isLocked ? '#0d1520' : '#1a2a3c'
    ctx.fillRect(cx, cy, cardW, cardH)

    ctx.strokeStyle = isLocked ? '#1b2535' : '#f1c40f44'
    ctx.lineWidth = 1
    ctx.strokeRect(cx, cy, cardW, cardH)

    if (isLocked) {
      ctx.font = 'bold 18px monospace'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#333'
      ctx.fillText('?', cx + cardW / 2, cy + 32)
    } else {
      // Star icon
      ctx.font = '14px monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#f1c40f'
      ctx.fillText('\u2605', cx + 8, cy + 22)

      // Name
      ctx.font = 'bold 11px monospace'
      ctx.fillStyle = '#fff'
      ctx.fillText(ach.name, cx + 26, cy + 20)

      // Description
      ctx.font = '9px monospace'
      ctx.fillStyle = '#888'
      ctx.fillText(ach.desc, cx + 26, cy + 38)
    }
  }

  ctx.restore()
}
