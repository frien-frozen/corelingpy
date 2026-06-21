import {
  findPresetByModel,
  type CorelingLaunchPreset,
} from '../../constants/corelingModels.js'
import { getRouteDefaultBaseUrl } from '../../integrations/routeMetadata.js'
import {
  ensureLocalModel,
  isLocalTierInstalled,
  type DownloadProgress,
} from '../../services/localModelManager.js'
import {
  ensureCorelingEngine,
  type EngineDownloadProgress,
} from '../../services/corelingEngineInstaller.js'
import { ensureLlamaServer } from '../../services/llamaEngine.js'
import { applyProviderFlag } from '../providerFlag.js'
import {
  buildOpenRouterProfileEnv,
  createProfileFile,
  saveProfileFile,
  type ProfileEnv,
} from '../providerProfile.js'

export type CorelingModelSwitchResult = {
  error?: string
  preset?: CorelingLaunchPreset
  downloaded?: boolean
}

function saveProfileForPreset(
  preset: CorelingLaunchPreset,
  envExtra?: ProfileEnv,
): void {
  let env: ProfileEnv | null = null
  if (preset.provider === 'openrouter') {
    env = buildOpenRouterProfileEnv({ model: preset.model })
  } else if (preset.provider === 'llama-cpp') {
    env = {
      OPENAI_BASE_URL:
        getRouteDefaultBaseUrl('llama-cpp') ?? 'http://127.0.0.1:8080/v1',
      OPENAI_MODEL: preset.model,
      ...envExtra,
    }
  }
  if (env) {
    saveProfileFile(createProfileFile(preset.provider, env))
  }
}

export async function applyCorelingModelSelectionAsync(
  preset: CorelingLaunchPreset,
  options?: {
    onDownloadProgress?: (progress: DownloadProgress | EngineDownloadProgress) => void
  },
): Promise<CorelingModelSwitchResult> {
  if (preset.localTier) {
    const wasInstalled = isLocalTierInstalled(preset.localTier)

    try {
      await ensureCorelingEngine(progress =>
        options?.onDownloadProgress?.(progress),
      )
      const modelPath = await ensureLocalModel(
        preset.localTier,
        progress => options?.onDownloadProgress?.(progress),
      )
      await ensureLlamaServer(modelPath)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { error: message, preset }
    }

    const flagResult = applyProviderFlag(preset.provider, [
      '--model',
      preset.model,
    ])
    if (flagResult.error) {
      return { error: flagResult.error, preset }
    }

    saveProfileForPreset(preset)

    return {
      preset,
      downloaded: !wasInstalled,
    }
  }

  const flagResult = applyProviderFlag(preset.provider, [
    '--model',
    preset.model,
  ])
  if (flagResult.error) {
    return { error: flagResult.error, preset }
  }

  saveProfileForPreset(preset)
  return { preset }
}

export function applyCorelingModelSelection(
  preset: CorelingLaunchPreset,
): { error?: string } {
  const flagResult = applyProviderFlag(preset.provider, [
    '--model',
    preset.model,
  ])
  if (flagResult.error) {
    return flagResult
  }
  saveProfileForPreset(preset)
  return {}
}

export async function applyCorelingModelByName(
  model: string,
  options?: {
    onDownloadProgress?: (progress: DownloadProgress) => void
  },
): Promise<CorelingModelSwitchResult> {
  const preset = findPresetByModel(model)
  if (!preset) {
    return {
      error: `Unknown Coreling model "${model}". Run /model to see Spark, Chat, Pro, and cloud options.`,
    }
  }
  const result = await applyCorelingModelSelectionAsync(preset, options)
  if (result.error) {
    return result
  }
  return result
}

export function corelingModelSwitchHint(
  preset: CorelingLaunchPreset,
  downloaded?: boolean,
): string {
  if (preset.category === 'local') {
    const parts = [' · Local · 100% private']
    if (downloaded) {
      parts.push(' · downloaded')
    }
    return parts.join('')
  }
  return ' · Cloud · free via OpenRouter'
}
