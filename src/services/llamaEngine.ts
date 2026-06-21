import { existsSync, readFileSync, writeFileSync, openSync } from 'node:fs'
import { join } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { getCorelingDir } from './localModelManager.js'
import {
  ensureCorelingEngine,
  getDaemonPath,
  getEngineSpawnCwd,
} from './corelingEngineInstaller.js'

const PORT = Number(process.env.CORELING_LLAMA_PORT ?? '8080')
const CTX_SIZE = String(process.env.CORELING_CTX_SIZE ?? '32768')
const ACTIVE_MODEL_FILE = 'active-model.json'

export { getDaemonPath }

export async function healthOk(): Promise<boolean> {
  const urls = [
    `http://127.0.0.1:${PORT}/health`,
    `http://127.0.0.1:${PORT}/v1/models`,
    `http://127.0.0.1:${PORT}/`,
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2500) })
      if (!res.ok) continue
      if (url.endsWith('/health')) {
        try {
          const data = (await res.json()) as { status?: string }
          if (data.status === 'ok') return true
        } catch {
          return true
        }
      }
      return true
    } catch {
      // try next
    }
  }
  return false
}

function readActiveModelFilename(): string | null {
  try {
    const path = join(getCorelingDir(), ACTIVE_MODEL_FILE)
    if (!existsSync(path)) return null
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as {
      filename?: string
    }
    return parsed.filename?.trim() || null
  } catch {
    return null
  }
}

function writeActiveModelFilename(filename: string): void {
  const path = join(getCorelingDir(), ACTIVE_MODEL_FILE)
  writeFileSync(
    path,
    JSON.stringify({ filename, updatedAt: new Date().toISOString() }, null, 2),
    'utf8',
  )
}

export function stopLlamaServer(): void {
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/F', '/IM', 'corelingd.exe'], { stdio: 'ignore' })
    spawnSync('taskkill', ['/F', '/IM', 'llama-server.exe'], { stdio: 'ignore' })
  } else {
    spawnSync('pkill', ['-f', 'corelingd'], { stdio: 'ignore' })
    spawnSync('pkill', ['-f', 'llama-server'], { stdio: 'ignore' })
  }
}

async function waitForReady(maxSec = 120): Promise<boolean> {
  for (let i = 0; i < maxSec * 2; i++) {
    if (await healthOk()) return true
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

/** Start or restart llama-server with the given GGUF file path. */
export async function ensureLlamaServer(modelPath: string): Promise<void> {
  const filename = modelPath.split(/[/\\]/).pop() ?? modelPath
  const active = readActiveModelFilename()

  if (active === filename && (await healthOk())) {
    return
  }

  if (!existsSync(modelPath)) {
    throw new Error(`Model file not found: ${modelPath}`)
  }

  if (!existsSync(getDaemonPath())) {
    await ensureCorelingEngine()
  }

  const daemon = getDaemonPath()
  if (!existsSync(daemon)) {
    throw new Error(
      'Coreling engine failed to install. Check network and disk space in ~/.coreling/engine',
    )
  }

  stopLlamaServer()
  await new Promise(r => setTimeout(r, 600))

  const args = [
    '-m',
    modelPath,
    '--host',
    '127.0.0.1',
    '--port',
    String(PORT),
    '--ctx-size',
    CTX_SIZE,
    '-n',
    '-1',
  ]

  const logPath = join(getCorelingDir(), 'corelingd.log')
  const logFd = openSync(logPath, 'a')

  const child = spawn(daemon, args, {
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: process.env,
    cwd: getEngineSpawnCwd(),
  })
  child.unref()

  if (!(await waitForReady())) {
    throw new Error(
      `llama-server did not start (see ${logPath}). On Windows install MSVC Redistributable 2022.`,
    )
  }

  writeActiveModelFilename(filename)
}

export async function ensureLlamaServerForModelFile(
  filename: string,
  artifactsDir: string,
): Promise<void> {
  await ensureLlamaServer(join(artifactsDir, filename))
}
