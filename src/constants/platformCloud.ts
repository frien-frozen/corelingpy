/**
 * Coreling Cloud — platform OpenRouter key (never commit the key to git).
 *
 * Resolution order:
 * 1. CORELING_OPENROUTER_KEY env
 * 2. OPENROUTER_API_KEY env
 * 3. ~/.coreling/cloud.env  (operator file — created at deploy/install time)
 */

import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Default cloud model included with Coreling Cloud. */
export const PLATFORM_OPENROUTER_DEFAULT_MODEL = 'openai/gpt-oss-120b:free'

const CLOUD_ENV_FILE =
  process.env.CORELING_CLOUD_ENV_FILE ??
  join(process.env.CORELING_DIR ?? join(homedir(), '.coreling'), 'cloud.env')

function readCloudEnvFile(): Record<string, string> {
  if (!existsSync(CLOUD_ENV_FILE)) {
    return {}
  }
  const out: Record<string, string> = {}
  for (const line of readFileSync(CLOUD_ENV_FILE, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

export function resolveBundledOpenRouterApiKey(
  processEnv: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const fromFile = readCloudEnvFile()
  return (
    processEnv.CORELING_OPENROUTER_KEY?.trim() ||
    processEnv.OPENROUTER_API_KEY?.trim() ||
    fromFile.CORELING_OPENROUTER_KEY?.trim() ||
    fromFile.OPENROUTER_API_KEY?.trim() ||
    undefined
  )
}

export function hasBundledOpenRouterAccess(
  processEnv: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(resolveBundledOpenRouterApiKey(processEnv))
}

export function getCloudEnvFilePath(): string {
  return CLOUD_ENV_FILE
}
