import { drawGoalFlag } from '../sprites/pixel-art.js'
import { overlaps } from '../engine/collision.js'

export function createGoal(x, y, fake = false, options = {}) {
  return {
    x, y,
    w: 20, h: 32,
    fake,
    reached: false,
    killOnTouch: fake && (options.killOnTouch !== false),
    message: options.message || null
  }
}

export function checkGoal(goal, playerRect) {
  if (goal.reached) return { ...goal, event: null }

  if (overlaps(playerRect, goal)) {
    if (goal.fake && goal.killOnTouch) {
      return { ...goal, reached: true, event: 'kill' }
    }
    if (goal.fake && !goal.killOnTouch) {
      return { ...goal, reached: true, event: 'fake' }
    }
    return { ...goal, reached: true, event: 'complete' }
  }

  return { ...goal, event: null }
}

export function renderGoal(goal) {
  if (goal.reached && goal.fake) return
  drawGoalFlag(goal.x, goal.y, goal.fake)
}
