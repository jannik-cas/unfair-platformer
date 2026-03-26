export function overlaps(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  )
}

export function resolveCollision(entity, platform) {
  const overlapLeft = (entity.x + entity.w) - platform.x
  const overlapRight = (platform.x + platform.w) - entity.x
  const overlapTop = (entity.y + entity.h) - platform.y
  const overlapBottom = (platform.y + platform.h) - entity.y

  const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)

  if (minOverlap === overlapTop && entity.vy >= 0) {
    return {
      ...entity,
      y: platform.y - entity.h,
      vy: 0,
      onGround: true,
      direction: 'top'
    }
  }
  if (minOverlap === overlapBottom && entity.vy <= 0) {
    return {
      ...entity,
      y: platform.y + platform.h,
      vy: 0,
      direction: 'bottom'
    }
  }
  if (minOverlap === overlapLeft) {
    return {
      ...entity,
      x: platform.x - entity.w,
      vx: 0,
      direction: 'left'
    }
  }
  if (minOverlap === overlapRight) {
    return {
      ...entity,
      x: platform.x + platform.w,
      vx: 0,
      direction: 'right'
    }
  }

  return entity
}
