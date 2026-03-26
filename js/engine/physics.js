export const GRAVITY = 0.6
export const TERMINAL_VELOCITY = 12
export const PLAYER_SPEED = 3.2
export const JUMP_VELOCITY = -10.5
export const GROUND_FRICTION = 0.82
export const AIR_FRICTION = 0.96
export const ICE_FRICTION = 0.97
export const BOUNCE_FACTOR = 1.3
export const COYOTE_FRAMES = 6
export const JUMP_BUFFER_FRAMES = 6

export function applyGravity(entity, gravityDir = 1) {
  const newVy = entity.vy + GRAVITY * gravityDir
  const clampedVy = gravityDir > 0
    ? Math.min(newVy, TERMINAL_VELOCITY)
    : Math.max(newVy, -TERMINAL_VELOCITY)

  return { ...entity, vy: clampedVy }
}

export function applyFriction(entity, friction) {
  return { ...entity, vx: entity.vx * friction }
}

export function applyVelocity(entity) {
  return {
    ...entity,
    x: entity.x + entity.vx,
    y: entity.y + entity.vy
  }
}
