import {
  chmodSync,
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { getCorelingDir } from './localModelManager.js'

/** Pinned llama.cpp release — CPU builds for broad compatibility. */
const LLAMA_CPP_TAG = 'b7335'

export function getEngineDir(): string {
  return join(getCorelingDir(), 'engine')
}

export function getDaemonPath(): string {
  const name = process.platform === 'win32' ? 'corelingd.exe' : 'corelingd'
  return join(getEngineDir(), name)
}

function engineVersionPath(): string {
  return join(getCorelingDir(), 'engine-version.txt')
}

export type EngineDownloadProgress = {
  downloadedBytes: number
  totalBytes: number | null
  percent: number | null
  phase: 'engine'
}

function engineArchiveUrl(): string {
  const base = `https://github.com/ggml-org/llama.cpp/releases/download/${LLAMA_CPP_TAG}`
  if (process.platform === 'win32') {
    return process.arch === 'arm64'
      ? `${base}/llama-${LLAMA_CPP_TAG}-bin-win-cpu-arm64.zip`
      : `${base}/llama-${LLAMA_CPP_TAG}-bin-win-cpu-x64.zip`
  }
  if (process.platform === 'darwin') {
    return process.arch === 'arm64'
      ? `${base}/llama-${LLAMA_CPP_TAG}-bin-macos-arm64.tar.gz`
      : `${base}/llama-${LLAMA_CPP_TAG}-bin-macos-x64.tar.gz`
  }
  return `${base}/llama-${LLAMA_CPP_TAG}-bin-ubuntu-x64.tar.gz`
}

function serverBinaryName(): string {
  return process.platform === 'win32' ? 'llama-server.exe' : 'llama-server'
}

function findFileRecursive(dir: string, filename: string, depth = 0): string | null {
  if (depth > 5) return null
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    let st
    try {
      st = statSync(path)
    } catch {
      continue
    }
    if (st.isFile() && entry.toLowerCase() === filename.toLowerCase()) {
      return path
    }
    if (st.isDirectory()) {
      const found = findFileRecursive(path, filename, depth + 1)
      if (found) return found
    }
  }
  return null
}

function extractArchive(archivePath: string, destDir: string): void {
  mkdirSync(destDir, { recursive: true })
  if (archivePath.endsWith('.zip')) {
    const tarResult = spawnSync('tar', ['-xf', archivePath, '-C', destDir], {
      stdio: 'pipe',
    })
    if (tarResult.status === 0) return

    if (process.platform === 'win32') {
      const ps = spawnSync(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          `Expand-Archive -Path '${archivePath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`,
        ],
        { stdio: 'pipe' },
      )
      if (ps.status === 0) return
      throw new Error(
        `Failed to extract engine zip: ${ps.stderr?.toString() || tarResult.stderr?.toString() || 'unknown error'}`,
      )
    }
    throw new Error(
      `Failed to extract engine zip: ${tarResult.stderr?.toString() || 'tar error'}`,
    )
  }

  const result = spawnSync('tar', ['-xzf', archivePath, '-C', destDir], {
    stdio: 'pipe',
  })
  if (result.status !== 0) {
    throw new Error(
      `Failed to extract engine archive: ${result.stderr?.toString() || 'tar error'}`,
    )
  }
}

/** Copy llama-server + sibling DLLs/so/dylib into ~/.coreling/engine */
function installEngineBundle(extractDir: string, engineDir: string): void {
  const serverPath = findFileRecursive(extractDir, serverBinaryName())
  if (!serverPath) {
    throw new Error(
      `Could not find ${serverBinaryName()} in llama.cpp release. Install [MSVC Redistributable 2022](https://learn.microsoft.com/cpp/windows/latest-supported-vc-redist) on Windows.`,
    )
  }

  const binDir = dirname(serverPath)
  mkdirSync(engineDir, { recursive: true })

  for (const entry of readdirSync(binDir)) {
    const src = join(binDir, entry)
    try {
      if (!statSync(src).isFile()) continue
    } catch {
      continue
    }
    copyFileSync(src, join(engineDir, entry))
  }

  const daemonName = process.platform === 'win32' ? 'corelingd.exe' : 'corelingd'
  copyFileSync(join(engineDir, serverBinaryName()), join(engineDir, daemonName))
  if (process.platform !== 'win32') {
    chmodSync(join(engineDir, daemonName), 0o755)
  }
}

async function downloadFile(
  url: string,
  dest: string,
  onProgress?: (progress: EngineDownloadProgress) => void,
): Promise<void> {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(60 * 60 * 1000),
    headers: { 'User-Agent': 'Coreling/2.0' },
  })
  if (!response.ok || !response.body) {
    throw new Error(`Engine download failed (${response.status}) from ${url}`)
  }

  const totalBytes = Number(response.headers.get('content-length') ?? 0) || null
  let downloadedBytes = 0
  const reader = response.body.getReader()
  const writer = createWriteStream(dest)

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      downloadedBytes += value.byteLength
      writer.write(value)
      onProgress?.({
        downloadedBytes,
        totalBytes,
        percent:
          totalBytes && totalBytes > 0
            ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100))
            : null,
        phase: 'engine',
      })
    }
  } finally {
    writer.end()
    await new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
  }
}

export function isCorelingEngineInstalled(): boolean {
  const daemon = getDaemonPath()
  if (!existsSync(daemon)) return false
  try {
    if (readFileSync(daemon).length <= 1024) return false
    if (!existsSync(engineVersionPath())) return false
    return readFileSync(engineVersionPath(), 'utf8').trim() === LLAMA_CPP_TAG
  } catch {
    return false
  }
}

/** Download llama-server from llama.cpp releases into ~/.coreling/engine */
export async function ensureCorelingEngine(
  onProgress?: (progress: EngineDownloadProgress) => void,
): Promise<string> {
  const daemonPath = getDaemonPath()
  if (isCorelingEngineInstalled()) {
    return daemonPath
  }

  const url = engineArchiveUrl()
  const ext = url.endsWith('.zip') ? '.zip' : '.tar.gz'
  const tmpDir = join(getCorelingDir(), '.engine-install')
  const archivePath = join(tmpDir, `llama-server${ext}`)
  const extractDir = join(tmpDir, 'extract')
  const engineDir = getEngineDir()

  mkdirSync(tmpDir, { recursive: true })
  mkdirSync(getCorelingDir(), { recursive: true })

  await downloadFile(url, archivePath, onProgress)
  extractArchive(archivePath, extractDir)
  installEngineBundle(extractDir, engineDir)
  writeFileSync(engineVersionPath(), `${LLAMA_CPP_TAG}\n`, 'utf8')

  return getDaemonPath()
}

export function getEngineSpawnCwd(): string {
  return getEngineDir()
}
