import { detectLocale } from '../i18n/locale.js'
import { isCorelingBuild } from './brand.js'

/** Slash commands available in Coreling — minimal set for now. */
const CORELING_COMMAND_NAMES = new Set(['model', 'lang', 'exit', 'gui'])

export function isCorelingCommandAllowed(name: string): boolean {
  return CORELING_COMMAND_NAMES.has(name)
}

export function filterCommandsForCoreling<
  T extends { name: string; aliases?: string[] },
>(commands: T[]): T[] {
  if (!isCorelingBuild()) {
    return commands
  }
  return commands.filter(cmd => {
    if (isCorelingCommandAllowed(cmd.name)) {
      return true
    }
    return cmd.aliases?.some(alias => isCorelingCommandAllowed(alias)) ?? false
  })
}

/** Coreling-only spinner tips — no OpenClaude / Anthropic upsells. */
export function getCorelingSpinnerTips(): Array<{
  id: string
  content: string
}> {
  if (detectLocale() === 'uz') {
    return [
      {
        id: 'coreling-model-uz',
        content: '/model — Spark · Chat · Pro (mahalliy) yoki bulut modellari',
      },
      {
        id: 'coreling-gui-uz',
        content: '/gui — brauzerda orkestrator rejimi (rollar, feed, chat)',
      },
      {
        id: 'coreling-lang-uz',
        content: "/lang en — ingliz tiliga qaytish",
      },
    ]
  }

  return [
    {
      id: 'coreling-model',
      content: 'Use /model to switch Spark · Chat · Pro (local) or free cloud models',
    },
    {
      id: 'coreling-gui',
      content: 'Use /gui for browser orchestrator — assign models to roles, feed files',
    },
    {
      id: 'coreling-lang',
      content: "Use /lang uz to switch the interface to O'zbek",
    },
  ]
}

/** Spinner tip prefix — distinct from Claude Code "Tip:". */
export { corelingSpinnerTipPrefix, corelingContextLabel } from '../i18n/corelingUiStrings.js'

/**
 * Apply Coreling runtime defaults — focused coding agent, not a Claude Code fork.
 * Call as early as possible during CLI startup.
 */
export function applyCorelingRuntimeDefaults(): void {
  if (!isCorelingBuild()) {
    return
  }

  process.env.CLAUDE_CODE_SIMPLE ??= '1'
  process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY ??= '1'
  process.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS ??= '1'
  process.env.CLAUDE_CODE_DISABLE_ATTRIBUTION_HEADER ??= '1'
  process.env.CLAUDE_CODE_DISABLE_TERMINAL_TITLE ??= '0'

  // Windows: use PowerShell for shell commands when Git Bash is missing
  if (process.platform === 'win32') {
    process.env.CLAUDE_CODE_USE_POWERSHELL_TOOL ??= '1'
  }
}
