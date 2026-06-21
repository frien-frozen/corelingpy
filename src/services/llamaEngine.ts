import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { getCorelingDir } from './localModelManager.js'
import { ensureCorelingEngine } from './corelingEngineInstaller.js'

const PORT = Number(process.env.CORELING_LLAMA_PORT ?? '8080')
const CTX_SIZE = String(process.env.CORELING_CTX_SIZE ?? '32768')
const ACTIVE_MODEL_FILE = 'active-model.json'

export function getDaemonPath(): string {
  const cdir = getCorelingDir()
  return join(cdir, process.platform === 'win32' ? 'corelingd.exe' : 'corelingd')
}

export async function healthOk(): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/health`, {
      signal: AbortSignal.timeout(2000),
    })
    if (!res.ok) return false
    const data = (await res.json()) as { status?: string }
    return data.status === 'ok'
  } catch {
    return false
  }
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
  const daemon = process.platform === 'win32' ? 'corelingd.exe' : 'corelingd'
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/F', '/IM', daemon], { stdio: 'ignore' })
  } else {
    spawnSync('pkill', ['-f', daemon], { stdio: 'ignore' })
  }
}

async function waitForReady(maxSec = 90): Promise<boolean> {
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

  const daemon = getDaemonPath()
  if (!existsSync(daemon)) {
    await ensureCorelingEngine()
  }

  if (!existsSync(daemon)) {
    throw new Error(
      `Coreling engine not found at ${daemon}. Download failed — check your network connection.`,
    )
  }

  stopLlamaServer()
  await new Promise(r => setTimeout(r, 400))

  const child = spawn(
    daemon,
    ['-m', modelPath, '--port', String(PORT), '--ctx-size', CTX_SIZE, '-n', '-1'],
    {
      detached: true,
      stdio: 'ignore',
      env: process.env,
    },
  )
  child.unref()

  if (!(await waitForReady())) {
    throw new Error('llama-server did not become ready in time.')
  }

  writeActiveModelFilename(filename)
}

export async function ensureLlamaServerForModelFile(
  filename: string,
  artifactsDir: string,
): Promise<void> {
  await ensureLlamaServer(join(artifactsDir, filename))
}
