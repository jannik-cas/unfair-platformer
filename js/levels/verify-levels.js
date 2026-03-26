/**
 * Level Solvability Verification Script
 *
 * Simulates player physics to verify each level's intended path is completable.
 * Run: node js/levels/verify-levels.js
 */

// Physics constants (mirrored from physics.js)
const GRAVITY = 0.6
const JUMP_VELOCITY = -10.5
const PLAYER_SPEED = 3.2
const PLAYER_W = 14
const PLAYER_H = 20
const COYOTE_FRAMES = 6
const BOUNCE_FACTOR = 1.3

// Simulate a jump arc and return { maxHeight, maxDistance, airTime }
function simulateJump(startVy = JUMP_VELOCITY, airSpeed = 2.8) {
  let x = 0
  let y = 0
  let vy = startVy
  let maxHeight = 0
  let frame = 0

  while (y <= 0 || frame < 5) {
    vy += GRAVITY
    y += vy
    x += airSpeed
    maxHeight = Math.min(maxHeight, y) // y is negative when going up
    frame++
    if (frame > 200) break // safety
  }

  return {
    maxHeight: Math.abs(maxHeight),
    maxDistance: x,
    airTime: frame
  }
}

// Simulate a jump with coyote time bonus
function simulateJumpWithCoyote() {
  const coyoteDistance = COYOTE_FRAMES * PLAYER_SPEED
  const jump = simulateJump()
  return {
    ...jump,
    maxDistance: jump.maxDistance + coyoteDistance,
    coyoteBonus: coyoteDistance
  }
}

// Check if player can cross a gap
function canCrossGap(gapWidth, heightDiff = 0, bouncy = false) {
  const startVy = bouncy ? JUMP_VELOCITY * BOUNCE_FACTOR : JUMP_VELOCITY
  const jump = simulateJump(startVy)
  const jumpWithCoyote = simulateJumpWithCoyote()

  const canJump = jump.maxDistance >= gapWidth + PLAYER_W
  const canJumpCoyote = jumpWithCoyote.maxDistance >= gapWidth + PLAYER_W
  const canReachHeight = jump.maxHeight >= Math.abs(heightDiff)

  return { canJump, canJumpCoyote, canReachHeight, jump, jumpWithCoyote }
}

// Verify function
function verify(levelName, checks) {
  console.log(`\n=== Level: ${levelName} ===`)
  let allPass = true

  for (const check of checks) {
    const result = canCrossGap(check.gap, check.heightDiff || 0, check.bouncy || false)
    const pass = check.noJump || result.canJumpCoyote && result.canReachHeight
    const status = pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'
    console.log(`  [${status}] ${check.desc}`)
    if (!pass) {
      console.log(`    Gap: ${check.gap}px, Height: ${check.heightDiff || 0}px`)
      console.log(`    Max distance: ${result.jumpWithCoyote.maxDistance.toFixed(1)}px, Max height: ${result.jump.maxHeight.toFixed(1)}px`)
      allPass = false
    }
  }

  return allPass
}

// Run verifications
console.log('Player Physics:')
const normalJump = simulateJump()
const coyoteJump = simulateJumpWithCoyote()
const bouncyJump = simulateJump(JUMP_VELOCITY * BOUNCE_FACTOR)
console.log(`  Normal jump: height=${normalJump.maxHeight.toFixed(1)}px, dist=${normalJump.maxDistance.toFixed(1)}px, air=${normalJump.airTime}f`)
console.log(`  With coyote: dist=${coyoteJump.maxDistance.toFixed(1)}px (+${coyoteJump.coyoteBonus.toFixed(1)}px)`)
console.log(`  Bouncy jump: height=${bouncyJump.maxHeight.toFixed(1)}px, dist=${bouncyJump.maxDistance.toFixed(1)}px`)

const T = 32
let allPassed = true

allPassed &= verify('16 - Rollback Strategy', [
  { desc: 'Walk left on continuous ground (no jump needed)', gap: 0, noJump: true },
  { desc: 'Trap path: start to T*5 gap', gap: T * 1, heightDiff: 0 },
])

allPassed &= verify('17 - Lights Out', [
  { desc: 'Low path: T*6 to T*7', gap: T * 1, heightDiff: 0 },
  { desc: 'Low path: T*11 to T*11.5', gap: T * 0.5, heightDiff: 0 },
  { desc: 'Low path: T*15.5 to T*16', gap: T * 0.5, heightDiff: 0 },
  { desc: 'Low path: T*19 to T*19.5', gap: T * 0.5, heightDiff: 0 },
])

allPassed &= verify('18 - Overfitting Trap', [
  { desc: 'Start to cycle 1', gap: T * 1, heightDiff: 0 },
  { desc: 'Cycle gaps (1T each)', gap: T * 1, heightDiff: 0 },
  { desc: 'Cycle 5 break: fall to bouncy', gap: T * 0.5, heightDiff: 0 },
  { desc: 'Bouncy to T*19.5', gap: T * 2, heightDiff: T * 0.5, bouncy: true },
  { desc: 'T*19.5 to goal at T*22.5', gap: T * 0.5, heightDiff: 0 },
])

allPassed &= verify('19 - Shadow Deploy', [
  { desc: 'Start to T*4 (real ground)', gap: T * 1, heightDiff: 0 },
  { desc: 'T*7 to T*7.5 (height 1.5T)', gap: T * 0.5, heightDiff: T * 1.5 },
  { desc: 'T*10.5 to T*11 (descend)', gap: T * 0.5, heightDiff: 0 },
  { desc: 'T*14 to T*14.5 (height 1T)', gap: T * 0.5, heightDiff: T * 1 },
  { desc: 'T*17.5 to T*18 (ground)', gap: T * 0.5, heightDiff: 0 },
])

allPassed &= verify('20 - Der Letzte Push', [
  { desc: 'Ground gaps (0.5T)', gap: T * 0.5, heightDiff: 0 },
  { desc: 'Gravity flip: land on ceiling at T*11', gap: 0, noJump: true },
  { desc: 'Ceiling: T*15 to T*15.5', gap: T * 0.5, heightDiff: 0 },
  { desc: 'Ceiling: T*18.5 to T*19', gap: T * 0.5, heightDiff: 0 },
])

console.log(`\n${'='.repeat(40)}`)
console.log(allPassed ? '\x1b[32mALL LEVELS VERIFIED\x1b[0m' : '\x1b[31mSOME LEVELS FAILED\x1b[0m')
