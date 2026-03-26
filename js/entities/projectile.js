import { drawProjectile } from '../sprites/pixel-art.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/canvas.js'

export function createProjectileSpawner(options) {
  return {
    x: options.x,
    y: options.y,
    triggerX: options.triggerX ?? null,
    triggerY: options.triggerY ?? null,
    vx: options.vx || 0,
    vy: options.vy || 0,
    interval: options.interval || 60,
    timer: options.offset || 0,
    active: options.triggerX == null && options.triggerY == null,
    triggered: false,
    oneShot: options.oneShot || false,
    fired: false
  }
}

export function createProjectile(x, y, vx, vy) {
  return {
    x, y,
    w: 10, h: 10,
    vx, vy,
    alive: true
  }
}

export function updateProjectileSpawner(spawner, playerRect, projectiles) {
  if (spawner.oneShot && spawner.fired) return { spawner, newProjectiles: [] }

  let active = spawner.active

  // Check trigger
  if (!active && playerRect) {
    if (spawner.triggerX != null && playerRect.x + playerRect.w > spawner.triggerX) {
      active = true
    }
    if (spawner.triggerY != null && playerRect.y < spawner.triggerY) {
      active = true
    }
  }

  if (!active) return { spawner: { ...spawner, active }, newProjectiles: [] }

  const newTimer = spawner.timer + 1
  const newProjectiles = []

  if (newTimer >= spawner.interval) {
    newProjectiles.push(createProjectile(spawner.x, spawner.y, spawner.vx, spawner.vy))
    return {
      spawner: {
        ...spawner,
        active,
        timer: 0,
        triggered: true,
        fired: spawner.oneShot ? true : spawner.fired
      },
      newProjectiles
    }
  }

  return { spawner: { ...spawner, active, timer: newTimer }, newProjectiles }
}

export function updateProjectile(proj) {
  if (!proj.alive) return proj

  const x = proj.x + proj.vx
  const y = proj.y + proj.vy

  // Kill if out of bounds (with generous margin)
  const margin = 50
  if (x < -margin || x > GAME_WIDTH + margin || y < -margin || y > GAME_HEIGHT + margin) {
    return { ...proj, alive: false }
  }

  return { ...proj, x, y }
}

export function renderProjectile(proj) {
  if (!proj.alive) return
  drawProjectile(proj.x, proj.y, proj.w, proj.h)
}
