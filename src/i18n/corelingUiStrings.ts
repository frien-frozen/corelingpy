import { detectLocale } from './locale.js'

type UiKey =
  | 'ctx'
  | 'tip'
  | 'interrupt'
  | 'shortcuts'
  | 'switchingModel'
  | 'downloadingModel'
  | 'engineStarting'
  | 'guiOpened'
  | 'permissionEsc'
  | 'modeAuto'
  | 'modePlan'
  | 'welcome'

const EN: Record<UiKey, string> = {
  ctx: 'ctx',
  tip: 'Tip',
  interrupt: 'interrupt',
  shortcuts: '? for shortcuts',
  switchingModel: 'Switching model…',
  downloadingModel: 'Downloading model…',
  engineStarting: 'Starting local engine…',
  guiOpened: 'Coreling GUI opened in your browser',
  permissionEsc: 'Esc to cancel',
  modeAuto: 'auto-apply on',
  modePlan: 'plan on',
  welcome: 'Welcome to Coreling v2',
}

const UZ: Record<UiKey, string> = {
  ctx: 'kontekst',
  tip: 'Maslahat',
  interrupt: 'to\'xtatish',
  shortcuts: 'Yorliqnoma: ?',
  switchingModel: 'Model almashtirilmoqda…',
  downloadingModel: 'Model yuklanmoqda…',
  engineStarting: 'Mahalliy dvigatel ishga tushmoqda…',
  guiOpened: 'Coreling GUI brauzerda ochildi',
  permissionEsc: 'Bekor qilish: Esc',
  modeAuto: 'avto-qo\'llash yoqilgan',
  modePlan: 'reja rejimi yoqilgan',
  welcome: 'Coreling v2 ga xush kelibsiz',
}

export function t(key: UiKey): string {
  return detectLocale() === 'uz' ? UZ[key] : EN[key]
}

export function corelingContextLabel(percent: number): string {
  return detectLocale() === 'uz'
    ? `kontekst ${percent}%`
    : `ctx ${percent}%`
}

export function corelingSpinnerTipPrefix(): string {
  return detectLocale() === 'uz' ? '↳ Maslahat' : '↳'
}
