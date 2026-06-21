import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_ORCHESTRATOR_ROLES,
  type OrchestratorRole,
  defaultModelOptions,
} from '../constants/orchestratorRoles.js'
import { getCorelingDir } from './localModelManager.js'

const CONFIG_FILE = 'orchestrator-config.json'

export type OrchestratorConfig = {
  roles: OrchestratorRole[]
}

export function getOrchestratorConfigPath(): string {
  return join(getCorelingDir(), CONFIG_FILE)
}

export function loadOrchestratorConfig(): OrchestratorConfig {
  const path = getOrchestratorConfigPath()
  if (!existsSync(path)) {
    return { roles: DEFAULT_ORCHESTRATOR_ROLES.map(r => ({ ...r, keywords: [...r.keywords] })) }
  }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as OrchestratorConfig
    if (Array.isArray(parsed.roles) && parsed.roles.length > 0) {
      return parsed
    }
  } catch {
    // fall through
  }
  return { roles: DEFAULT_ORCHESTRATOR_ROLES.map(r => ({ ...r, keywords: [...r.keywords] })) }
}

export function saveOrchestratorConfig(config: OrchestratorConfig): void {
  mkdirSync(getCorelingDir(), { recursive: true })
  writeFileSync(getOrchestratorConfigPath(), JSON.stringify(config, null, 2), 'utf8')
}

export function getGuiFeedDir(): string {
  const dir = join(getCorelingDir(), 'gui-feed')
  mkdirSync(dir, { recursive: true })
  return dir
}

export { defaultModelOptions }
