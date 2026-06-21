import { existsSync } from 'node:fs'
import {
  CORELING_LOCAL_MODELS,
  findLocalModelDef,
  getLocalModelDef,
  type CorelingLocalTierId,
} from './corelingLocalModels.js'
import {
  getLocalModelPath,
  isLocalModelInstalled,
} from '../services/localModelManager.js'

/** Coreling v2 model presets — /model picker and startup. */
export type CorelingModelCategory = 'local' | 'cloud'

export type CorelingLaunchPreset = {
  id: string
  category: CorelingModelCategory
  label: string
  description: string
  provider: 'llama-cpp' | 'openrouter'
  /** API model id sent to llama.cpp or OpenRouter. */
  model: string
  needsEngine: boolean
  localTier?: CorelingLocalTierId
  default?: boolean
}

export const CORELING_CLOUD_FREE_MODELS = [
  {
    id: 'cloud-nex-n2',
    label: 'Nex N2 Pro',
    model: 'nex-agi/nex-n2-pro:free',
    description: 'Free · Nex AGI',
  },
  {
    id: 'cloud-gpt-oss',
    label: 'GPT-OSS 120B',
    model: 'openai/gpt-oss-120b:free',
    description: 'Free · OpenAI OSS',
  },
  {
    id: 'cloud-gemma',
    label: 'Gemma 4 31B',
    model: 'google/gemma-4-31b-it:free',
    description: 'Free · Google',
  },
  {
    id: 'cloud-qwen3',
    label: 'Qwen3 Next 80B',
    model: 'qwen/qwen3-next-80b-a3b-instruct:free',
    description: 'Free · Qwen',
  },
] as const

function buildLocalPresets(): CorelingLaunchPreset[] {
  return CORELING_LOCAL_MODELS.map(def => ({
    id: def.id,
    category: 'local' as const,
    label: def.label,
    description: localPresetDescription(def.id),
    provider: 'llama-cpp' as const,
    model: def.id,
    needsEngine: true,
    localTier: def.id,
    default: def.id === 'chat',
  }))
}

function buildCloudPresets(): CorelingLaunchPreset[] {
  return CORELING_CLOUD_FREE_MODELS.map((entry, index) => ({
    id: entry.id,
    category: 'cloud' as const,
    label: entry.label,
    description: entry.description,
    provider: 'openrouter' as const,
    model: entry.model,
    needsEngine: false,
    default: index === 0,
  }))
}

export const CORELING_LAUNCH_PRESETS: readonly CorelingLaunchPreset[] = [
  ...buildLocalPresets(),
  ...buildCloudPresets(),
]

export function localPresetDescription(tierId: CorelingLocalTierId): string {
  const def = getLocalModelDef(tierId)
  const installed = isLocalModelInstalled(def)
  const status = installed ? 'installed' : `download · ${def.sizeLabel}`
  return `${def.tagline} · ${status} · 100% private`
}

export function findLaunchPreset(idOrAlias: string): CorelingLaunchPreset | undefined {
  const key = idOrAlias.trim().toLowerCase()
  return CORELING_LAUNCH_PRESETS.find(
    p =>
      p.id === key ||
      p.model.toLowerCase() === key ||
      (key === 'private' && p.category === 'local') ||
      (key === 'cloud' && p.category === 'cloud'),
  )
}

export function findPresetByModel(model: string): CorelingLaunchPreset | undefined {
  const key = model.trim().toLowerCase()
  return CORELING_LAUNCH_PRESETS.find(
    p =>
      p.model.toLowerCase() === key ||
      p.id.toLowerCase() === key ||
      (p.localTier && p.localTier === key),
  )
}

export function getDefaultLaunchPreset(): CorelingLaunchPreset {
  const installed = CORELING_LOCAL_MODELS.find(def =>
    isLocalModelInstalled(def),
  )
  if (installed) {
    return (
      CORELING_LAUNCH_PRESETS.find(p => p.localTier === installed.id) ??
      CORELING_LAUNCH_PRESETS[0]
    )
  }
  return (
    CORELING_LAUNCH_PRESETS.find(p => p.default && p.category === 'local') ??
    CORELING_LAUNCH_PRESETS[0]
  )
}

export type CorelingModelPickerOption = {
  value: string
  label: string
  description: string
  disabled?: boolean
}

const SECTION_LOCAL = '__coreling_section_local__'
const SECTION_CLOUD = '__coreling_section_cloud__'

export function buildCorelingModelOptions(): CorelingModelPickerOption[] {
  const options: CorelingModelPickerOption[] = [
    {
      value: SECTION_LOCAL,
      label: 'Local — Spark · Chat · Pro',
      description: 'Qwen 2.5 on your machine',
      disabled: true,
    },
  ]

  for (const preset of CORELING_LAUNCH_PRESETS.filter(p => p.category === 'local')) {
    options.push({
      value: preset.model,
      label: preset.label,
      description: preset.description,
    })
  }

  options.push({
    value: SECTION_CLOUD,
    label: 'Cloud — free models (OpenRouter)',
    description: 'Included with Coreling v2',
    disabled: true,
  })

  for (const preset of CORELING_LAUNCH_PRESETS.filter(p => p.category === 'cloud')) {
    options.push({
      value: preset.model,
      label: preset.label,
      description: preset.description,
    })
  }

  return options
}

export function isCorelingSectionHeader(value: string | null): boolean {
  return value === SECTION_LOCAL || value === SECTION_CLOUD
}

export function getLocalModelPathForTier(tierId: CorelingLocalTierId): string {
  return getLocalModelPath(getLocalModelDef(tierId))
}

export function localModelExistsOnDisk(modelOrTier: string): boolean {
  const def = findLocalModelDef(modelOrTier)
  return def ? existsSync(getLocalModelPath(def)) : false
}
