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
