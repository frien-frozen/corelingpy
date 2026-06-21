import { CORELING_LAUNCH_PRESETS } from './corelingModels.js'

export type OrchestratorRole = {
  id: string
  name: string
  /** Model id — preset.model or tier id (spark/chat/pro) or cloud model id */
  model: string
  keywords: string[]
}

export const DEFAULT_ORCHESTRATOR_ROLES: OrchestratorRole[] = [
  {
    id: 'frontend',
    name: 'Frontend Developer',
    model: 'chat',
    keywords: ['react', 'vue', 'css', 'ui', 'component', 'frontend', 'tsx', 'jsx'],
  },
  {
    id: 'backend',
    name: 'Backend Engineer',
    model: 'pro',
    keywords: ['api', 'database', 'server', 'backend', 'sql', 'postgres', 'python'],
  },
  {
    id: 'devops',
    name: 'DevOps Agent',
    model: 'spark',
    keywords: ['docker', 'deploy', 'ci', 'kubernetes', 'terraform', 'pipeline'],
  },
  {
    id: 'research',
    name: 'Research Analyst',
    model: 'nex-agi/nex-n2-pro:free',
    keywords: ['research', 'analyze', 'summary', 'report', 'docs', 'pdf'],
  },
  {
    id: 'writer',
    name: 'Technical Writer',
    model: 'chat',
    keywords: ['write', 'readme', 'documentation', 'copy', 'blog', 'markdown'],
  },
]

export function defaultModelOptions(): Array<{ id: string; label: string }> {
  return CORELING_LAUNCH_PRESETS.map(p => ({
    id: p.model,
    label: p.label,
  }))
}

export function pickOrchestratorRole(
  roles: OrchestratorRole[],
  message: string,
  fileNames: string[],
): OrchestratorRole {
  const haystack = `${message} ${fileNames.join(' ')}`.toLowerCase()
  let best = roles[0] ?? DEFAULT_ORCHESTRATOR_ROLES[0]!
  let bestScore = 0
  for (const role of roles) {
    const score = role.keywords.reduce(
      (n, kw) => n + (haystack.includes(kw.toLowerCase()) ? 1 : 0),
      0,
    )
    if (score > bestScore) {
      bestScore = score
      best = role
    }
  }
  if (bestScore === 0 && roles.length > 0) {
    return roles[Math.floor(Math.random() * roles.length)]!
  }
  return best
}
