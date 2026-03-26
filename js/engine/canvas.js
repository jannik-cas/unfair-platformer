const GAME_WIDTH = 800
const GAME_HEIGHT = 480
const TILE_SIZE = 32

let canvas = null
let ctx = null
let scale = 1

export function initCanvas() {
  canvas = document.getElementById('game')
  ctx = canvas.getContext('2d')
  resize()
  window.addEventListener('resize', resize)
  return { canvas, ctx }
}

function resize() {
  const dpr = window.devicePixelRatio || 1
  const scaleX = window.innerWidth / GAME_WIDTH
  const scaleY = window.innerHeight / GAME_HEIGHT
  scale = Math.min(scaleX, scaleY)

  // Set canvas buffer to display size * devicePixelRatio for crisp rendering
  const displayW = Math.floor(GAME_WIDTH * scale)
  const displayH = Math.floor(GAME_HEIGHT * scale)
  canvas.width = displayW * dpr
  canvas.height = displayH * dpr
  canvas.style.width = `${displayW}px`
  canvas.style.height = `${displayH}px`

  // Scale context so we can keep drawing in game coordinates
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0)
  ctx.imageSmoothingEnabled = false
}

export function clear() {
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
}

export function getCtx() {
  return ctx
}

export function getCanvas() {
  return canvas
}

export function getScale() {
  return scale
}

export function getCanvasMousePos(clientX, clientY) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: (clientX - rect.left) / scale,
    y: (clientY - rect.top) / scale
  }
}

export { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE }
