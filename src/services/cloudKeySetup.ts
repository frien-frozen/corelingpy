import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { createInterface } from 'node:readline'
import {
  getCloudEnvFilePath,
  resolveBundledOpenRouterApiKey,
} from '../constants/platformCloud.js'

export function writeCloudEnvKey(apiKey: string): void {
  const path = getCloudEnvFilePath()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `CORELING_OPENROUTER_KEY=${apiKey.trim()}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  })
  try {
    chmodSync(path, 0o600)
  } catch {
    // Windows may not support chmod the same way
  }
}

export async function promptAndSaveCloudApiKeyIfNeeded(): Promise<boolean> {
  if (resolveBundledOpenRouterApiKey()) {
    return false
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return false
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const answer = await new Promise<string>(resolve => {
    console.log('')
    console.log('Coreling Cloud — free OpenRouter models (optional)')
    console.log('Get a key at https://openrouter.ai/keys')
    rl.question('OpenRouter API key (Enter to skip): ', resolve)
  })
  rl.close()

  const key = answer.trim()
  if (!key) {
    console.log('Skipped — add later in ~/.coreling/cloud.env or run /provider')
    return false
  }

  writeCloudEnvKey(key)
  process.env.CORELING_OPENROUTER_KEY = key
  console.log(`Saved to ${getCloudEnvFilePath()}`)
  return true
}

export function cloudEnvExists(): boolean {
  return existsSync(getCloudEnvFilePath())
}

/** Skip prompt for headless / subcommand / non-interactive invocations. */
export function shouldPromptCorelingCloudKey(args: string[]): boolean {
  if (process.env.CORELING_SKIP_CLOUD_KEY_PROMPT === '1') {
    return false
  }
  if (args.includes('--print') || args.includes('-p')) {
    return false
  }
  if (args.includes('--help') || args.includes('-h')) {
    return false
  }
  if (args.includes('--bare')) {
    return false
  }
  if (args.includes('--bg') || args.includes('--background')) {
    return false
  }
  const subcommands = new Set([
    'ps',
    'logs',
    'attach',
    'kill',
    'update',
    'mcp',
    'doctor',
  ])
  if (subcommands.has(args[0] ?? '')) {
    return false
  }
  return true
}
