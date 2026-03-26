import { getCtx } from '../engine/canvas.js'

// Player colors — hoodie-wearing data scientist
const HAIR = '#2c2c2c'
const SKIN = '#f5c6a5'
const GLASSES = '#ffffff'
const HOODIE = '#00b894'
const HOODIE_GOLD = '#f1c40f'
const HOODIE_GOLD_HIGHLIGHT = '#f9e547'
const PANTS = '#2d3436'
const SHOES = '#636e72'
const EYES = '#000'

let goldenHoodie = localStorage.getItem('unfair-golden-hoodie') === 'true'

export function setGoldenHoodie(val) {
  goldenHoodie = val
  localStorage.setItem('unfair-golden-hoodie', val.toString())
}

export function isGoldenHoodie() {
  return goldenHoodie
}

export function drawPlayer(x, y, frame = 0, facingRight = true) {
  const ctx = getCtx()
  ctx.save()

  if (!facingRight) {
    ctx.translate(x + 16, y)
    ctx.scale(-1, 1)
    x = 0
    y = 0
  }

  // Hair (messy)
  ctx.fillStyle = HAIR
  ctx.fillRect(x + 3, y + 0, 10, 4)
  ctx.fillRect(x + 2, y + 1, 2, 2)

  // Head
  ctx.fillStyle = SKIN
  ctx.fillRect(x + 4, y + 3, 8, 6)

  // Glasses frame
  ctx.fillStyle = GLASSES
  ctx.fillRect(x + 7, y + 4, 5, 3)
  ctx.fillStyle = '#dfe6e9'
  ctx.fillRect(x + 8, y + 5, 3, 1)

  // Eyes
  ctx.fillStyle = EYES
  ctx.fillRect(x + 9, y + 5, 1, 1)

  // Hoodie body
  ctx.fillStyle = goldenHoodie ? HOODIE_GOLD : HOODIE
  ctx.fillRect(x + 4, y + 9, 8, 5)
  ctx.fillStyle = goldenHoodie ? HOODIE_GOLD_HIGHLIGHT : '#55efc4'
  ctx.fillRect(x + 7, y + 9, 1, 3)
  ctx.fillRect(x + 8, y + 9, 1, 2)
  // Golden star badge
  if (goldenHoodie) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(x + 5, y + 11, 1, 1)
  }

  // Legs
  ctx.fillStyle = PANTS
  const legOffset = frame === 1 ? 1 : frame === 2 ? -1 : 0
  ctx.fillRect(x + 4, y + 14, 3, 4)
  ctx.fillRect(x + 9, y + 14, 3, 4)

  if (legOffset !== 0) {
    ctx.fillRect(x + 4, y + 14 + legOffset, 3, 4)
    ctx.fillRect(x + 9, y + 14 - legOffset, 3, 4)
  }

  // Shoes
  ctx.fillStyle = SHOES
  ctx.fillRect(x + 4, y + 18 + (frame === 1 ? 1 : 0), 3, 2)
  ctx.fillRect(x + 9, y + 18 + (frame === 2 ? 1 : 0), 3, 2)

  ctx.restore()
}

export function drawPlayerDead(x, y) {
  const ctx = getCtx()
  ctx.save()
  ctx.translate(x + 8, y + 10)
  ctx.rotate(Math.PI / 2)
  ctx.translate(-8, -10)
  drawPlayer(0, 0, 0, true)
  ctx.restore()

  // X eyes
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(x + 8, y + 4, 2, 2)
  ctx.fillRect(x + 11, y + 4, 2, 2)

  // loss: inf label
  ctx.fillStyle = '#e74c3c'
  ctx.font = '5px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('loss:\u221E', x + 8, y - 2)
}

export function drawPlatform(x, y, w, h, type = 'solid') {
  const ctx = getCtx()

  const colors = {
    solid:        { main: '#2d4a6f', light: '#3d6a9f', dark: '#1b3350', line: '#0f1f33', node: '#5aa0d4' },
    fake:         { main: '#2d4a6f', light: '#3d6a9f', dark: '#1b3350', line: '#0f1f33', node: '#5aa0d4' },
    crumble:      { main: '#2d4a6f', light: '#3d6a9f', dark: '#1b3350', line: '#0f1f33', node: '#5aa0d4' },
    moving:       { main: '#2d4a6f', light: '#3d6a9f', dark: '#1b3350', line: '#0f1f33', node: '#5aa0d4' },
    disappearing: { main: '#2d4a6f', light: '#3d6a9f', dark: '#1b3350', line: '#0f1f33', node: '#5aa0d4' },
    bouncy:       { main: '#00896b', light: '#00b894', dark: '#006d56', line: '#004d3d', node: '#55efc4' },
    icy:          { main: '#0984e3', light: '#74b9ff', dark: '#0768b5', line: '#054a82', node: '#a8d8ea' },
    hidden:       { main: '#2d4a6f', light: '#3d6a9f', dark: '#1b3350', line: '#0f1f33', node: '#5aa0d4' }
  }

  const c = colors[type] || colors.solid

  // Main tensor block
  ctx.fillStyle = c.main
  ctx.fillRect(x, y, w, h)

  // Edges
  ctx.fillStyle = c.light
  ctx.fillRect(x, y, w, 1)
  ctx.fillRect(x, y, 1, h)
  ctx.fillStyle = c.line
  ctx.fillRect(x, y + h - 1, w, 1)
  ctx.fillRect(x + w - 1, y, 1, h)

  // Type-specific internal patterns
  if (type === 'bouncy') {
    // ReLU activation arrows — upward arrows showing bounce direction
    ctx.fillStyle = c.node
    ctx.globalAlpha = 0.4
    for (let ax = 8; ax < w - 8; ax += 18) {
      // Upward arrow
      ctx.fillRect(x + ax, y + 3, 2, h - 6)          // shaft
      ctx.fillRect(x + ax - 2, y + 5, 6, 1)           // arrowhead
      ctx.fillRect(x + ax - 1, y + 4, 4, 1)
    }
    // "f(x)" label
    ctx.font = '6px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('f(x)', x + w / 2, y + h - 3)
    ctx.globalAlpha = 1
  } else if (type === 'icy') {
    // Frozen crystal pattern — asterisk shapes
    ctx.fillStyle = c.node
    ctx.globalAlpha = 0.3
    for (let cx2 = 10; cx2 < w - 6; cx2 += 20) {
      for (let cy2 = 6; cy2 < h - 2; cy2 += 12) {
        // Crystal cross
        ctx.fillRect(x + cx2 - 3, y + cy2, 6, 1)  // horizontal
        ctx.fillRect(x + cx2, y + cy2 - 3, 1, 6)  // vertical
        // Diagonal dots
        ctx.fillRect(x + cx2 - 2, y + cy2 - 2, 1, 1)
        ctx.fillRect(x + cx2 + 2, y + cy2 - 2, 1, 1)
        ctx.fillRect(x + cx2 - 2, y + cy2 + 2, 1, 1)
        ctx.fillRect(x + cx2 + 2, y + cy2 + 2, 1, 1)
      }
    }
    ctx.globalAlpha = 1
  } else {
    // Default: Neural network nodes pattern
    ctx.fillStyle = c.node
    ctx.globalAlpha = 0.3
    const nodeSpacing = 16
    for (let nx = 6; nx < w - 4; nx += nodeSpacing) {
      for (let ny = 4; ny < h - 2; ny += 10) {
        ctx.fillRect(x + nx, y + ny, 3, 3)
        if (nx + nodeSpacing < w - 4) {
          ctx.fillStyle = c.dark
          ctx.globalAlpha = 0.2
          ctx.fillRect(x + nx + 3, y + ny + 1, nodeSpacing - 3, 1)
          ctx.fillStyle = c.node
          ctx.globalAlpha = 0.3
        }
      }
    }
    ctx.globalAlpha = 1
  }
}

export function drawSpike(x, y, w, h, direction = 'up') {
  const ctx = getCtx()

  // Loss spike — red gradient triangle
  ctx.fillStyle = '#e74c3c'
  ctx.strokeStyle = '#c0392b'
  ctx.lineWidth = 1

  ctx.beginPath()
  if (direction === 'up') {
    ctx.moveTo(x, y + h)
    ctx.lineTo(x + w / 2, y)
    ctx.lineTo(x + w, y + h)
  } else if (direction === 'down') {
    ctx.moveTo(x, y)
    ctx.lineTo(x + w / 2, y + h)
    ctx.lineTo(x + w, y)
  } else if (direction === 'left') {
    ctx.moveTo(x + w, y)
    ctx.lineTo(x, y + h / 2)
    ctx.lineTo(x + w, y + h)
  } else {
    ctx.moveTo(x, y)
    ctx.lineTo(x + w, y + h / 2)
    ctx.lineTo(x, y + h)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // "NaN" label inside (the ML error)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 7px monospace'
  ctx.textAlign = 'center'
  if (direction === 'up') {
    ctx.fillText('NaN', x + w / 2, y + h - 3)
  } else if (direction === 'down') {
    ctx.fillText('NaN', x + w / 2, y + h - 5)
  } else {
    ctx.fillText('NaN', x + w / 2, y + h / 2 + 3)
  }
}

export function drawProjectile(x, y, w, h) {
  const ctx = getCtx()
  const cx = x + w / 2
  const cy = y + h / 2
  const r = w / 2

  // Gradient descent arrow — orange pulsing orb
  ctx.fillStyle = '#ff6b35'
  ctx.globalAlpha = 0.35
  ctx.beginPath()
  ctx.arc(cx, cy, r + 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // Core gradient ball
  ctx.fillStyle = '#ff9f43'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  // Hot center
  ctx.fillStyle = '#ffeaa7'
  ctx.beginPath()
  ctx.arc(cx - 1, cy - 1, r * 0.4, 0, Math.PI * 2)
  ctx.fill()

  // Down arrow (gradient descent)
  ctx.fillStyle = '#d63031'
  ctx.fillRect(cx - 1, cy - 2, 2, 4)
  ctx.fillRect(cx - 2, cy + 1, 4, 1)
}

export function drawGoalFlag(x, y, fake = false) {
  const ctx = getCtx()

  // Pole
  ctx.fillStyle = '#636e72'
  ctx.fillRect(x + 2, y, 3, 32)

  // Accuracy target flag
  ctx.fillStyle = fake ? '#27ae60' : '#00b894'
  ctx.fillRect(x + 5, y + 2, 14, 10)

  // "1.0" accuracy label
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 7px monospace'
  ctx.textAlign = 'left'
  ctx.fillText('1.0', x + 6, y + 10)

  // Base
  ctx.fillStyle = '#636e72'
  ctx.fillRect(x, y + 30, 7, 2)
}

export function drawSign(x, y, text) {
  const ctx = getCtx()

  ctx.font = '7px monospace'
  const textW = ctx.measureText(text).width
  const boardW = Math.max(28, textW + 10)
  const cx = boardW / 2

  // Post
  ctx.fillStyle = '#636e72'
  ctx.fillRect(x + cx - 2, y + 20, 4, 12)

  // Whiteboard
  ctx.fillStyle = '#dfe6e9'
  ctx.fillRect(x, y, boardW, 20)
  ctx.strokeStyle = '#636e72'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, boardW, 20)

  // Text
  ctx.fillStyle = '#2d3436'
  ctx.textAlign = 'center'
  ctx.fillText(text, x + cx, y + 13)
}

export function drawBackground(scrollX = 0, corrupted = false) {
  const ctx = getCtx()

  // Deep neural network gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 480)
  gradient.addColorStop(0, corrupted ? '#1a0a0a' : '#0a0f1a')
  gradient.addColorStop(0.4, corrupted ? '#2a0d0d' : '#0d1b2a')
  gradient.addColorStop(1, corrupted ? '#2e1b1b' : '#1b1a2e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 800, 480)

  // Floating neural network — subtle background nodes and connections
  drawNeuralNetBg(ctx, scrollX, corrupted)

  // Loss curve silhouettes (distant — like a training chart)
  ctx.fillStyle = '#0d1926'
  drawLossCurve(ctx, scrollX * 0.1, 420, 60, 0.006)

  // Closer layer — taller loss spikes
  ctx.fillStyle = '#111f33'
  drawLossCurve(ctx, scrollX * 0.2, 440, 45, 0.01)
}

function drawNeuralNetBg(ctx, scrollX, corrupted = false) {
  // Network layers — columns of nodes with connections
  const layers = [80, 220, 380, 540, 700]
  const nodesPerLayer = [3, 5, 5, 4, 3]

  ctx.globalAlpha = 0.06

  for (let l = 0; l < layers.length; l++) {
    const lx = (layers[l] + scrollX * 0.03) % 850 - 50
    const nodes = nodesPerLayer[l]
    const startY = 60
    const spacing = 60

    for (let n = 0; n < nodes; n++) {
      const ny = startY + n * spacing

      // Node circle
      const jx = corrupted ? (Math.random() * 4 - 2) : 0
      const jy = corrupted ? (Math.random() * 4 - 2) : 0
      ctx.fillStyle = corrupted ? '#ff4444' : '#00d4aa'
      ctx.beginPath()
      ctx.arc(lx + jx, ny + jy, 5, 0, Math.PI * 2)
      ctx.fill()

      // Connections to next layer
      if (l < layers.length - 1) {
        const nextLx = (layers[l + 1] + scrollX * 0.03) % 850 - 50
        const nextNodes = nodesPerLayer[l + 1]
        const nextStartY = 60

        ctx.strokeStyle = '#00d4aa'
        ctx.lineWidth = 0.5
        for (let nn = 0; nn < nextNodes; nn++) {
          const nny = nextStartY + nn * spacing
          ctx.beginPath()
          ctx.moveTo(lx, ny)
          ctx.lineTo(nextLx, nny)
          ctx.stroke()
        }
      }
    }
  }

  // Floating ML terms (mixed loss values + hyperparams)
  ctx.font = '7px monospace'
  ctx.textAlign = 'left'
  ctx.globalAlpha = corrupted ? 0.2 : 0.07
  const seeds = [40, 155, 290, 430, 580, 710, 95, 350, 500, 650, 120, 480, 320, 760]
  const labels = corrupted
    ? ['NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN']
    : ['0.847', 'NaN', 'lr=0.001', '1e-5', 'batch=32', 'inf', 'epoch 47', '0.69', 'loss\u2193', 'nan', 'dim=768', 'acc=0.91', 'F1=0.83', 'grad\u2207']
  for (let i = 0; i < seeds.length; i++) {
    const fx = (seeds[i] + scrollX * 0.04) % 820
    const fy = 30 + (seeds[(i + 2) % seeds.length] * 0.7) % 320
    ctx.fillStyle = corrupted ? '#ff2222' : (i % 3 === 0 ? '#ff6b35' : '#00d4aa')
    ctx.fillText(labels[i % labels.length], fx, fy)
  }

  // Epoch progress bar (very subtle, near top)
  ctx.globalAlpha = 0.04
  ctx.fillStyle = '#00d4aa'
  ctx.fillRect(30, 12, 740, 2)
  // Fill portion (animated with scroll)
  ctx.globalAlpha = 0.08
  const progress = ((scrollX * 0.01) % 1 + 1) % 1
  ctx.fillRect(30, 12, 740 * progress, 2)

  ctx.globalAlpha = 1
}

function drawLossCurve(ctx, scrollX, baseY, maxH, freq) {
  // Draw a jagged loss-curve silhouette across the bottom
  ctx.beginPath()
  ctx.moveTo(0, 480)

  for (let px = 0; px <= 800; px += 4) {
    const t = (px + scrollX) * freq
    // Noisy loss curve with occasional spikes
    const base = Math.sin(t) * 0.3 + Math.sin(t * 2.7) * 0.2 + Math.sin(t * 0.3) * 0.5
    const spike = Math.abs(Math.sin(t * 5.1)) > 0.92 ? 0.4 : 0
    const h = (base + spike + 1) * 0.5 * maxH
    ctx.lineTo(px, baseY - h)
  }

  ctx.lineTo(800, 480)
  ctx.closePath()
  ctx.fill()
}

export function drawPlayerGhost(x, y, frame = 0, facingRight = true) {
  const ctx = getCtx()
  ctx.save()
  ctx.globalAlpha = 0.25

  if (!facingRight) {
    ctx.translate(x + 16, y)
    ctx.scale(-1, 1)
    x = 0
    y = 0
  }

  // Ghost uses green tint
  const G_HAIR = '#1a3a2a'
  const G_SKIN = '#88ddaa'
  const G_HOODIE = '#00ff88'
  const G_PANTS = '#1a4a2a'
  const G_SHOES = '#336644'

  ctx.fillStyle = G_HAIR
  ctx.fillRect(x + 3, y + 0, 10, 4)
  ctx.fillRect(x + 2, y + 1, 2, 2)

  ctx.fillStyle = G_SKIN
  ctx.fillRect(x + 4, y + 3, 8, 6)

  ctx.fillStyle = G_HOODIE
  ctx.fillRect(x + 4, y + 9, 8, 5)

  ctx.fillStyle = G_PANTS
  const legOffset = frame === 1 ? 1 : frame === 2 ? -1 : 0
  ctx.fillRect(x + 4, y + 14, 3, 4)
  ctx.fillRect(x + 9, y + 14, 3, 4)
  if (legOffset !== 0) {
    ctx.fillRect(x + 4, y + 14 + legOffset, 3, 4)
    ctx.fillRect(x + 9, y + 14 - legOffset, 3, 4)
  }

  ctx.fillStyle = G_SHOES
  ctx.fillRect(x + 4, y + 18 + (frame === 1 ? 1 : 0), 3, 2)
  ctx.fillRect(x + 9, y + 18 + (frame === 2 ? 1 : 0), 3, 2)

  ctx.restore()

  // "training data" label
  ctx.save()
  ctx.globalAlpha = 0.2
  ctx.font = '6px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#00ff88'
  ctx.fillText('training data', x + 8, y - 4)
  ctx.restore()
}
