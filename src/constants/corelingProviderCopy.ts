import { BRAND_NAME, isCorelingBuild } from './brand.js'

/** User-facing transport error prefix (no OpenAI branding on Coreling builds). */
export function providerTransportErrorLabel(): string {
  return isCorelingBuild()
    ? `${BRAND_NAME} connection error`
    : 'OpenAI API transport error'
}

/** User-facing HTTP error prefix. */
export function providerHttpErrorLabel(status: number): string {
  return isCorelingBuild()
    ? `${BRAND_NAME} error ${status}`
    : `OpenAI API error ${status}`
}

export function localizeProviderErrorMessage(message: string): string {
  if (!isCorelingBuild()) {
    return message
  }

  return message
    .replace(/OpenAI API transport error/g, providerTransportErrorLabel())
    .replace(/OpenAI API error (\d+):/g, `${BRAND_NAME} error $1:`)
    .replace(/\s*\[openai_category=[^\]]+\]/g, '')
    .replace(/OpenAI-compatible provider/g, 'Coreling local engine')
    .replace(/local OpenAI-compatible provider/g, 'Coreling local engine')
    .replace(/OPENAI_BASE_URL=http:\/\/127\.0\.0\.1:11434\/v1 for Ollama\.?/g, '')
    .replace(/for Ollama: http:\/\/127\.0\.0\.1:11434\/v1/g, 'on port 8080 (corelingd)')
    .replace(/Ollama: ollama list/g, '/model to pick Spark · Chat · Pro')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function localEngineConnectionHint(): string {
  return (
    'Coreling engine is not running. Use /model to pick Chat, Spark, or Pro — ' +
    'the model will download and start automatically.'
  )
}

export function localEngineConnectionRefusedHint(): string {
  return (
    'Could not connect to corelingd on port 8080. Use /model to pick a local model — ' +
    'Coreling will download the engine and model automatically.'
  )
}
