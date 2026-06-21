import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { CorelingLocalModelDef } from '../constants/corelingLocalModels.js'
import {
  findLocalModelDef,
  getLocalModelDef,
  type CorelingLocalTierId,
} from '../constants/corelingLocalModels.js'

export type DownloadProgress = {
  downloadedBytes: number
  totalBytes: number | null
  percent: number | null
}

export function getCorelingDir(): string {
  return process.env.CORELING_DIR ?? join(homedir(), '.coreling')
}

export function getArtifactsDir(): string {
  return join(getCorelingDir(), 'artifacts')
}

export function getLocalModelPath(def: CorelingLocalModelDef): string {
  return join(getArtifactsDir(), def.filename)
}

export function isLocalModelInstalled(def: CorelingLocalModelDef): boolean {
  const path = getLocalModelPath(def)
  if (!existsSync(path)) {
    return false
  }
  try {
    const header = readFileSync(path).subarray(0, 4).toString('utf8')
    return header === 'GGUF'
  } catch {
    return false
  }
}

export function isLocalTierInstalled(tierId: CorelingLocalTierId): boolean {
  return isLocalModelInstalled(getLocalModelDef(tierId))
}

export function findFirstInstalledLocalTier(): CorelingLocalTierId | null {
  for (const def of ['chat', 'spark', 'pro'] as const) {
    if (isLocalTierInstalled(def)) {
      return def
    }
  }
  return null
}

export async function downloadLocalModel(
  def: CorelingLocalModelDef,
  onProgress?: (progress: DownloadProgress) => void,
): Promise<string> {
  mkdirSync(getArtifactsDir(), { recursive: true })
  const dest = getLocalModelPath(def)
  const part = `${dest}.part`

  const response = await fetch(def.downloadUrl, {
    redirect: 'follow',
    signal: AbortSignal.timeout(60 * 60 * 1000),
    headers: { 'User-Agent': 'Coreling/2.0' },
  })

  if (!response.ok || !response.body) {
    throw new Error(
      `Download failed (${response.status}): ${def.label} from Hugging Face`,
    )
  }

  const totalBytes = Number(response.headers.get('content-length') ?? 0) || null
  let downloadedBytes = 0

  const reader = response.body.getReader()
  const writer = createWriteStream(part)

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
      })
    }
  } finally {
    writer.end()
    await new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
  }

  const header = readFileSync(part).subarray(0, 4).toString('utf8')
  if (header !== 'GGUF') {
    throw new Error(`Downloaded file is not a valid GGUF model (${def.label})`)
  }

  const { renameSync } = await import('node:fs')
  renameSync(part, dest)
  return dest
}

export async function ensureLocalModel(
  tierId: CorelingLocalTierId,
  onProgress?: (progress: DownloadProgress) => void,
): Promise<string> {
  const def = getLocalModelDef(tierId)
  if (isLocalModelInstalled(def)) {
    return getLocalModelPath(def)
  }
  return downloadLocalModel(def, onProgress)
}

export function resolveLocalTierFromModel(model: string): CorelingLocalTierId | null {
  const def = findLocalModelDef(model)
  return def?.id ?? null
}
