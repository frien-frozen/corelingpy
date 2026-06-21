import { detectLocale } from '../../i18n/locale.js'
import type { Locale } from '../../i18n/types.js'
import type { LocalCommandCall } from '../../types/command.js'
import { settingsChangeDetector } from '../../utils/settings/changeDetector.js'
import {
  getInitialSettings,
  updateSettingsForSource,
} from '../../utils/settings/settings.js'

const LOCALE_TO_SETTING: Record<Locale, string> = {
  en: 'english',
  uz: 'uzbek',
}

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  uz: "O'zbek",
}

function parseLangArg(raw: string): Locale | null {
  const key = raw.trim().toLowerCase()
  if (key === 'en' || key === 'english') return 'en'
  if (key === 'uz' || key === 'uzbek' || key === "o'zbek") return 'uz'
  return null
}

export const call: LocalCommandCall = async args => {
  const current = detectLocale()
  const requested = parseLangArg(args)

  if (!requested) {
    const label = LOCALE_LABELS[current]
    return {
      type: 'text',
      value: [
        `Current language: ${label} (${current})`,
        '',
        'Usage:',
        '  /lang en   — English',
        "  /lang uz   — O'zbek",
      ].join('\n'),
    }
  }

  if (requested === current) {
    return {
      type: 'text',
      value: `Language is already ${LOCALE_LABELS[requested]}.`,
    }
  }

  const { error } = updateSettingsForSource('userSettings', {
    language: LOCALE_TO_SETTING[requested],
  })

  if (error) {
    return {
      type: 'text',
      value:
        'Could not save language setting. Check your settings file for syntax errors.',
    }
  }

  settingsChangeDetector.notifyChange('userSettings')

  const refreshed = getInitialSettings().language ?? LOCALE_TO_SETTING[requested]
  const ok =
    requested === 'uz'
      ? `Til O'zbekcha ga o'zgartirildi. Spinner va maslahatlar endi o'zbek tilida.`
      : `Language switched to English. Spinner and tips will use English.`

  return {
    type: 'text',
    value: `${ok}\n(saved as "${refreshed}")`,
  }
}
