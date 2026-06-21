/**
 * Coreling brand identity — single source of truth for the product name,
 * tagline, accent color, and wordmark art used across the TUI.
 *
 * Theme entries derived from the accent MUST stay in `rgb(r,g,b)` form
 * (never hex): the spinner's shimmer/stall interpolation parses theme values
 * with `parseRGB`, which only matches `rgb(...)` strings.
 */

export const BRAND_NAME = 'Coreling v2'

export const BRAND_TAGLINE = '100% local · 100% private · Spark · Chat · Pro'

/** Short name for messages (no version suffix). */
export const PRODUCT_NAME = 'Coreling'

/** Default terminal tab title before session rename / topic extraction. */
export function defaultTerminalTitle(): string {
  return isCorelingBuild() ? PRODUCT_NAME : 'OpenClaude'
}

/** Prefix glyph shown in the terminal tab while Coreling is idle/working. */
export function terminalTitlePrefix(): string {
  return isCorelingBuild() ? '◆' : '✳'
}

/** CLI binary / command name. */
export const CLI_COMMAND = 'coreling'

/** Env var for Git Bash on Windows (legacy CLAUDE_CODE_GIT_BASH_PATH still honored). */
export const GIT_BASH_PATH_ENV = 'CORELING_GIT_BASH_PATH'

/** Env var override for Coreling config home (~/.coreling). */
export const CONFIG_DIR_ENV = 'CORELING_CONFIG_DIR'

/** Hidden config directory name in $HOME and in projects. */
export function getConfigDirName(): string {
  return isCorelingBuild() ? '.coreling' : '.openclaude'
}

/** Provider profile filename in the config home. */
export function getProfileFileName(): string {
  return isCorelingBuild() ? '.coreling-profile.json' : '.openclaude-profile.json'
}

export function isCorelingBuild(): boolean {
  return BRAND_NAME.startsWith('Coreling')
}

export function welcomeMessage(): string {
  return `Welcome to ${BRAND_NAME}`
}

/** Coreling v1 bright green (GN) — rgb() form required by theme consumers. */
export const BRAND_ACCENT_RGB = 'rgb(80,250,123)'

/** Compact wordmark lines shown in the startup banner. */
export const WORDMARK_LINES = [
  ' Coreling ',
  ' 100% Private Execution ',
] as const

/** @deprecated Legacy split wordmark — kept for import compatibility. */
export const WORDMARK_OPEN = WORDMARK_LINES

/** @deprecated Legacy split wordmark — kept for import compatibility. */
export const WORDMARK_CLAUDE = ['', ''] as const

/** Rendered width of the primary wordmark line. */
export const WORDMARK_WIDTH = WORDMARK_LINES[0].length
