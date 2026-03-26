import { showLevelName } from '../ui/hud.js'
import { setReversed } from '../engine/input.js'

const levelModules = {}
const levelNames = {}
let currentLevel = null
let currentLevelNum = 0

export function registerLevel(num, loader, name = '') {
  levelModules[num] = loader
  if (name) levelNames[num] = name
}

export async function loadLevel(num) {
  const loader = levelModules[num]
  if (!loader) return null

  const module = await loader()
  const levelData = module.default || module.createLevel()

  // Spread all level data (including custom properties like _fakeGameOverTriggered)
  // then set standard defaults
  currentLevel = {
    ...levelData,
    num,
    projectiles: [],
    gravityDir: 1,
    frameCount: 0,
    platforms: levelData.platforms || [],
    spikes: levelData.spikes || [],
    projectileSpawners: levelData.projectileSpawners || [],
    goals: levelData.goals || [],
    gravityZones: levelData.gravityZones || [],
    controlZones: levelData.controlZones || [],
    signs: levelData.signs || [],
    enemies: levelData.enemies || [],
    pickups: levelData.pickups || [],
    customUpdate: levelData.customUpdate || null,
    customRender: levelData.customRender || null,
    customPostRender: levelData.customPostRender || null,
    fakeUI: levelData.fakeUI || null
  }

  // EE6: Load ghost data if available
  try {
    const ghostRaw = localStorage.getItem('unfair-ghost-' + num)
    if (ghostRaw) {
      currentLevel.ghostData = JSON.parse(ghostRaw)
      currentLevel.ghostFrame = 0
    }
  } catch (_e) { /* corrupt ghost data, ignore */ }

  currentLevelNum = num
  setReversed(false)
  showLevelName(levelData.name)

  return currentLevel
}

export function getCurrentLevel() {
  return currentLevel
}

export function setCurrentLevel(level) {
  currentLevel = level
}

export function getCurrentLevelNum() {
  return currentLevelNum
}

export function getTotalLevels() {
  return Object.keys(levelModules).filter(k => parseInt(k, 10) < 100).length
}

export function isUnderworldLevel(num) {
  return num >= 100
}

export function getUnderworldLevels() {
  return Object.keys(levelModules).filter(k => parseInt(k, 10) >= 100).map(Number).sort((a, b) => a - b)
}

export function isUnderworldDiscovered() {
  try {
    return localStorage.getItem('unfair-underworld-discovered') === 'true'
  } catch (_e) {
    return false
  }
}

export function discoverUnderworld() {
  try {
    localStorage.setItem('unfair-underworld-discovered', 'true')
  } catch (_e) { /* full */ }
}

export function getLevelNames() {
  return { ...levelNames }
}
