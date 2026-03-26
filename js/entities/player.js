import {
  applyGravity, applyVelocity,
  PLAYER_SPEED, JUMP_VELOCITY,
  ICE_FRICTION, BOUNCE_FACTOR,
  COYOTE_FRAMES
} from '../engine/physics.js'
import { getInput } from '../engine/input.js'
import { overlaps, resolveCollision } from '../engine/collision.js'
import { drawPlayer, drawPlayerDead } from '../sprites/pixel-art.js'
import { GAME_HEIGHT } from '../engine/canvas.js'

export function createPlayer(x, y) {
  return {
    x, y,
    w: 14, h: 20,
    vx: 0, vy: 0,
    onGround: false,
    facingRight: true,
    frame: 0,
    frameTimer: 0,
    coyoteTimer: 0,
    dead: false,
    deathTimer: 0,
    gravityDir: 1,
    spawnX: x,
    spawnY: y,
    onIce: false,
    jumpHeld: false
  }
}

export function updatePlayer(player, platforms, hazards, gravityDir = 1) {
  if (player.dead) {
    const newTimer = player.deathTimer + 1
    if (newTimer > 18) {
      return respawnPlayer(player)
    }
    return { ...player, deathTimer: newTimer }
  }

  const input = getInput()
  let p = { ...player, gravityDir }

  // --- Horizontal movement: direct speed, not acceleration ---
  let targetVx = 0
  if (input.left) {
    targetVx = -PLAYER_SPEED
    p = { ...p, facingRight: false }
  }
  if (input.right) {
    targetVx = PLAYER_SPEED
    p = { ...p, facingRight: true }
  }

  // Lerp toward target speed (snappy on ground, slightly floaty in air)
  const lerpRate = p.onGround ? (p.onIce ? 0.05 : 0.35) : 0.2
  const newVx = p.vx + (targetVx - p.vx) * lerpRate

  // Stop dead if very slow and not pressing anything
  p = { ...p, vx: Math.abs(newVx) < 0.1 && targetVx === 0 ? 0 : newVx }

  // --- Coyote time ---
  if (p.onGround) {
    p = { ...p, coyoteTimer: COYOTE_FRAMES }
  } else {
    p = { ...p, coyoteTimer: Math.max(0, p.coyoteTimer - 1) }
  }

  // --- Jump: only on fresh press, not while held ---
  const canJump = p.coyoteTimer > 0
  const jumpTriggered = input.jumpPressed && !p.jumpHeld && canJump

  if (jumpTriggered) {
    p = {
      ...p,
      vy: JUMP_VELOCITY * gravityDir,
      onGround: false,
      coyoteTimer: 0,
      jumpHeld: true
    }
  }

  // Variable jump height: release early = lower jump
  if (!input.jump) {
    p = { ...p, jumpHeld: false }
    // Cut jump short if still rising
    if ((gravityDir > 0 && p.vy < JUMP_VELOCITY * 0.4) ||
        (gravityDir < 0 && p.vy > JUMP_VELOCITY * 0.4 * gravityDir)) {
      p = { ...p, vy: p.vy * 0.6 }
    }
  }

  // Gravity
  p = applyGravity(p, gravityDir)

  // Apply velocity
  p = applyVelocity(p)

  // Reset ground state before collision
  p = { ...p, onGround: false, onIce: false }

  // Platform collisions
  for (const plat of platforms) {
    if (!plat.solid) continue
    if (!overlaps(p, plat)) continue

    const resolved = resolveCollision(p, plat)
    p = resolved

    if (resolved.direction === 'top' && gravityDir > 0) {
      p = { ...p, onGround: true, onIce: plat.type === 'icy' }
      if (plat.type === 'bouncy') {
        p = { ...p, vy: JUMP_VELOCITY * BOUNCE_FACTOR * gravityDir, onGround: false }
      }
    }
    if (resolved.direction === 'bottom' && gravityDir < 0) {
      p = { ...p, onGround: true, onIce: plat.type === 'icy' }
      if (plat.type === 'bouncy') {
        p = { ...p, vy: JUMP_VELOCITY * BOUNCE_FACTOR * gravityDir, onGround: false }
      }
    }
  }

  // Hazard collisions
  for (const hazard of hazards) {
    if (overlaps(p, hazard)) {
      return killPlayer(p)
    }
  }

  // Fall off screen
  if (p.y > GAME_HEIGHT + 50 || p.y < -100) {
    return killPlayer(p)
  }

  // Animation
  let { frame, frameTimer } = p
  if (p.onGround && Math.abs(p.vx) > 0.3) {
    frameTimer += 1
    if (frameTimer > 8) {
      frame = (frame + 1) % 3
      frameTimer = 0
    }
  } else if (!p.onGround) {
    frame = 1
    frameTimer = 0
  } else {
    frame = 0
    frameTimer = 0
  }

  return { ...p, frame, frameTimer }
}

export function killPlayer(player) {
  return { ...player, dead: true, deathTimer: 0, vx: 0, vy: 0 }
}

function respawnPlayer(player) {
  return createPlayer(player.spawnX, player.spawnY)
}

export function renderPlayer(player) {
  if (player.dead) {
    if (player.deathTimer < 15) {
      drawPlayerDead(player.x, player.y)
    }
    return
  }

  drawPlayer(
    Math.round(player.x),
    Math.round(player.y),
    player.frame,
    player.facingRight
  )
}
