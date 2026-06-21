import { defineGateway } from '../define.js'
import { CORELING_LOCAL_MODELS } from '../../constants/corelingLocalModels.js'

/** llama.cpp llama-server — Coreling v2 local Spark · Chat · Pro. */
export default defineGateway({
  id: 'llama-cpp',
  label: 'Coreling Local',
  category: 'local',
  defaultBaseUrl: 'http://127.0.0.1:8080/v1',
  defaultModel: 'chat',
  supportsModelRouting: true,
  setup: {
    requiresAuth: false,
    authMode: 'none',
  },
  startup: {
    autoDetectable: true,
    probeReadiness: 'openai-compatible-models',
  },
  transportConfig: {
    kind: 'local',
    openaiShim: {
      supportsAuthHeaders: true,
      maxTokensField: 'max_tokens',
    },
  },
  preset: {
    id: 'llama-cpp',
    label: 'Coreling Local',
    description:
      'Spark · Chat · Pro — 100% local & private (Qwen 2.5 via llama.cpp).',
    badge: { text: '★ Private', color: 'success' },
    modelEnvVars: ['OPENAI_MODEL'],
    vendorId: 'openai',
  },
  catalog: {
    source: 'static',
    models: CORELING_LOCAL_MODELS.map(def => ({
      id: `coreling-${def.id}`,
      apiName: def.id,
      label: `${def.label} (${def.tagline})`,
      modelDescriptorId: def.id,
      contextWindow: 32768,
    })),
  },
  usage: { supported: false },
})
