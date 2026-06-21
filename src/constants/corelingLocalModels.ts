/** Local Spark / Chat / Pro tiers — same weights as corelingios. */
export type CorelingLocalTierId = 'spark' | 'chat' | 'pro'

export type CorelingLocalModelDef = {
  id: CorelingLocalTierId
  label: string
  tagline: string
  sizeLabel: string
  filename: string
  downloadUrl: string
}

export const CORELING_LOCAL_MODELS: readonly CorelingLocalModelDef[] = [
  {
    id: 'spark',
    label: 'Spark',
    tagline: 'Fastest',
    sizeLabel: '~1.0 GB',
    filename: 'coreling_spark.gguf',
    downloadUrl:
      'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
  },
  {
    id: 'chat',
    label: 'Chat',
    tagline: 'Balanced',
    sizeLabel: '~2.0 GB',
    filename: 'coreling_chat.gguf',
    downloadUrl:
      'https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf',
  },
  {
    id: 'pro',
    label: 'Pro',
    tagline: 'Most capable',
    sizeLabel: '~4.7 GB',
    filename: 'coreling_pro.gguf',
    downloadUrl:
      'https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF/resolve/main/qwen2.5-7b-instruct-q4_k_m.gguf',
  },
] as const

export function getLocalModelDef(
  id: CorelingLocalTierId,
): CorelingLocalModelDef {
  const def = CORELING_LOCAL_MODELS.find(m => m.id === id)
  if (!def) {
    throw new Error(`Unknown local tier: ${id}`)
  }
  return def
}

export function findLocalModelDef(
  idOrModel: string,
): CorelingLocalModelDef | undefined {
  const key = idOrModel.trim().toLowerCase()
  return CORELING_LOCAL_MODELS.find(
    m => m.id === key || m.filename.toLowerCase() === key,
  )
}
