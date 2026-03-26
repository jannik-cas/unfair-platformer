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
    customUpdate: levelData.customUpdate || null,
    customRender: levelData.customRender || null,
    fakeUI: levelData.fakeUI || null
  }

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
  return Object.keys(levelModules).length
}

export function getLevelNames() {
  return { ...levelNames }
}
