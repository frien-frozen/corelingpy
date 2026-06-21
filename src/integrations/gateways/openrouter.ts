import { defineGateway } from '../define.js'
import { CORELING_CLOUD_FREE_MODELS } from '../../constants/corelingModels.js'
import { PLATFORM_OPENROUTER_DEFAULT_MODEL } from '../../constants/platformCloud.js'

export default defineGateway({
  id: 'openrouter',
  label: 'OpenRouter',
  category: 'aggregating',
  defaultBaseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: PLATFORM_OPENROUTER_DEFAULT_MODEL,
  supportsModelRouting: true,
  setup: {
    requiresAuth: true,
    authMode: 'api-key',
    credentialEnvVars: ['OPENROUTER_API_KEY'],
  },
  startup: {
    probeReadiness: 'openai-compatible-models',
  },
  transportConfig: {
    kind: 'openai-compatible',
    openaiShim: {
      supportsAuthHeaders: true,
    },
  },
  preset: {
    id: 'openrouter',
    label: 'Coreling Cloud',
    description:
      'Free cloud models included with Coreling v2 — no API key needed (prompts leave your machine).',
    badge: { text: 'Included', color: 'success' },
    apiKeyEnvVars: ['OPENROUTER_API_KEY'],
    vendorId: 'openai',
  },
  catalog: {
    source: 'hybrid',
    discovery: { kind: 'openai-compatible' },
    discoveryCacheTtl: '1d',
    discoveryRefreshMode: 'background-if-stale',
    allowManualRefresh: true,
    models: CORELING_CLOUD_FREE_MODELS.map(entry => ({
      id: entry.id,
      apiName: entry.model,
      label: `${entry.label} (free)`,
      modelDescriptorId: entry.id,
    })),
  },
  usage: { supported: false },
})
