export type Locale = 'en' | 'vi' | 'uz'

export type LocalizationKey = string

export type I18nDictionary = Record<LocalizationKey, string>

export type InterpolationValues = Record<string, string | number>
