const keys = {}
const justPressed = {}
let reversed = false
let clickHandler = null

export function initInput() {
  window.addEventListener('keydown', (e) => {
    if (!keys[e.code]) {
      justPressed[e.code] = true
    }
    keys[e.code] = true
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault()
    }
  })
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false
  })
}

export function clearJustPressed() {
  for (const key in justPressed) {
    justPressed[key] = false
  }
}

export function getInput() {
  const raw = {
    left: keys['ArrowLeft'] || keys['KeyA'] || false,
    right: keys['ArrowRight'] || keys['KeyD'] || false,
    jump: keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || false,
    jumpPressed: justPressed['Space'] || justPressed['ArrowUp'] || justPressed['KeyW'] || false
  }

  if (reversed) {
    return { left: raw.right, right: raw.left, jump: raw.jump, jumpPressed: raw.jumpPressed }
  }

  return raw
}

export function isKeyDown(code) {
  return keys[code] || false
}

export function isJustPressed(code) {
  return justPressed[code] || false
}

export function setReversed(value) {
  reversed = value
}

export function isReversed() {
  return reversed
}

export function onCanvasClick(handler) {
  clickHandler = handler
  const canvas = document.getElementById('game')
  canvas.addEventListener('click', handler)
}

export function removeCanvasClick() {
  if (clickHandler) {
    const canvas = document.getElementById('game')
    canvas.removeEventListener('click', clickHandler)
    clickHandler = null
  }
}
