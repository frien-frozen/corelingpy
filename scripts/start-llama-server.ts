#!/usr/bin/env bun
/**
 * Start Coreling's llama.cpp server with a local Spark/Chat/Pro model.
 */

import { join } from 'node:path'
import { findFirstInstalledLocalTier, getArtifactsDir, getLocalModelPath } from '../src/services/localModelManager.ts'
import { getLocalModelDef } from '../src/constants/corelingLocalModels.ts'
import { ensureLlamaServer } from '../src/services/llamaEngine.ts'

async function main() {
  const tierArg = process.argv[2]?.trim().toLowerCase()
  const tier =
    tierArg === 'spark' || tierArg === 'chat' || tierArg === 'pro'
      ? tierArg
      : findFirstInstalledLocalTier() ?? 'chat'

  const def = getLocalModelDef(tier)
  const modelPath = getLocalModelPath(def)

  if (!(await import('node:fs')).existsSync(modelPath)) {
    console.error(`Model not installed: ${def.label} (${def.filename})`)
    console.error('Run Coreling and use /model to download Spark, Chat, or Pro.')
    process.exit(1)
  }

  console.log(`Starting llama-server with ${def.label} (${def.filename})...`)
  await ensureLlamaServer(modelPath)
  const port = process.env.CORELING_LLAMA_PORT ?? '8080'
  console.log(`llama-server ready at http://127.0.0.1:${port}/v1`)
  console.log(`  model: ${join(getArtifactsDir(), def.filename)}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
