#!/usr/bin/env bun
/**
 * One command to run Coreling v2.
 * Use /model to switch Spark · Chat · Pro (local) or free cloud models.
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  findLaunchPreset,
  getDefaultLaunchPreset,
} from '../src/constants/corelingModels.ts'
import { getLocalModelDef } from '../src/constants/corelingLocalModels.ts'
import {
  ensureLocalModel,
  findFirstInstalledLocalTier,
  getLocalModelPath,
  isLocalTierInstalled,
} from '../src/services/localModelManager.ts'
import { ensureLlamaServer } from '../src/services/llamaEngine.ts'
import { promptAndSaveCloudApiKeyIfNeeded } from '../src/services/cloudKeySetup.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const BIN = join(ROOT, 'bin', 'coreling')
const DIST = join(ROOT, 'dist', 'cli.mjs')

const G = '\x1b[92m'
const D = '\x1b[2m'
const R = '\x1b[0m'

function run(cmd: string, args: string[]): Promise<number> {
  return new Promise(resolve => {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      stdio: 'inherit',
      env: process.env,
    })
    child.on('close', code => resolve(code ?? 1))
    child.on('error', () => resolve(1))
  })
}

async function prepareLocalEngine(preset: ReturnType<typeof getDefaultLaunchPreset>): Promise<void> {
  if (!preset.localTier) return

  const tier =
    findFirstInstalledLocalTier() ??
    (isLocalTierInstalled(preset.localTier) ? preset.localTier : preset.localTier)

  const def = getLocalModelDef(tier)

  if (!isLocalTierInstalled(tier)) {
    console.log(
      `${G}▸${R} First run — downloading ${def.label} (${def.sizeLabel})\n`,
    )
    const path = await ensureLocalModel(tier, progress => {
      const pct =
        progress.percent != null
          ? `${progress.percent}%`
          : `${Math.round(progress.downloadedBytes / (1024 * 1024))} MB`
      process.stdout.write(`\r${D}Downloading… ${pct}${R}   `)
    })
    process.stdout.write('\n')
    await ensureLlamaServer(path)
    return
  }

  await ensureLlamaServer(getLocalModelPath(def))
}

async function main(): Promise<void> {
  const passthrough = process.argv.slice(2)

  if (!existsSync(DIST)) {
    console.log(`${D}Building Coreling v2…${R}`)
    const code = await run('bun', ['run', 'build'])
    if (code !== 0) process.exit(code)
  }

  let preset = getDefaultLaunchPreset()
  const installedTier = findFirstInstalledLocalTier()
  if (installedTier) {
    preset = findLaunchPreset(installedTier) ?? preset
  }

  if (preset.localTier) {
    await prepareLocalEngine(preset)
  }

  await promptAndSaveCloudApiKeyIfNeeded()

  console.log(
    `${G}▸${R} Coreling v2 · ${preset.label} ${D}(change with /model)${R}\n`,
  )

  const args = [
    BIN,
    '--provider',
    preset.provider,
    '--model',
    preset.model,
    ...passthrough,
  ]

  const code = await run(process.execPath, args)
  process.exit(code)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
