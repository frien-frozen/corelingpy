import { isCorelingBuild } from '../constants/brand.js'
import { getDefaultLaunchPreset } from '../constants/corelingModels.js'
import { getLocalModelDef } from '../constants/corelingLocalModels.js'
import {
  findFirstInstalledLocalTier,
  getLocalModelPath,
  isLocalTierInstalled,
} from './localModelManager.js'
import { ensureLlamaServer } from './llamaEngine.js'
import { getActiveProviderProfile } from '../utils/providerProfiles.js'
import { logForDebugging } from '../utils/debug.js'

/**
 * Start corelingd when the user launches `coreling` with a local model profile.
 * Release installs skip start-coreling.ts, so this mirrors that bootstrap path.
 */
export async function ensureCorelingLocalEngineAtStartup(): Promise<void> {
  if (!isCorelingBuild()) {
    return
  }

  const profile = getActiveProviderProfile()
  if (profile !== 'llama-cpp') {
    return
  }

  const tier =
    findFirstInstalledLocalTier() ??
    (() => {
      const preset = getDefaultLaunchPreset()
      return preset.localTier && isLocalTierInstalled(preset.localTier)
        ? preset.localTier
        : null
    })()

  if (!tier) {
    logForDebugging(
      '[coreling] No local model installed yet — use /model to download Chat, Spark, or Pro.',
    )
    return
  }

  try {
    const def = getLocalModelDef(tier)
    await ensureLlamaServer(getLocalModelPath(def))
    logForDebugging(`[coreling] Local engine ready (${def.label}).`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logForDebugging(`[coreling] Local engine startup skipped: ${message}`, {
      level: 'warn',
    })
  }
}
