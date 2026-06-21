import { detectLocale } from '../i18n/locale.js'

/** English — calm + quirky mix. */
export const CORELING_SPINNER_VERBS_EN = [
  'Putting things back in order',
  'Calming the chaos',
  'Restoring balance',
  'Everything falling into place',
  'Universe consulted',
  'Quiet progress',
  'Process in motion',
  'Fine-tuning reality',
  'Inner mechanics spinning',
  'Cosmic calibration',
  'Chaos optimized',
  'Reality syncing',
  'Delicate adjustments',
  'Inner engineering',
  'Situation simmering',
  'Small miracles underway',
  'All under control',
  'Recalibrating gently',
  'Slow but precise',
  'Recombobulating',
  'Just arranging things',
  'Noiseless result incoming',
  'Patience at work',
  'A little magic',
  'One moment',
] as const

/** Uzbek — user-provided calm + quirky quotes. */
export const CORELING_SPINNER_VERBS_UZ = [
  "Vaziyatni joyiga qo'yapman.",
  'Xaosni tinchlantiryapman.',
  'Tartib qayta tiklanmoqda.',
  'Hammasi iziga tushmoqda.',
  'Koinot bilan kelishildi.',
  'Sokin progress.',
  'Jarayon ketmoqda.',
  'Muvozanat tiklanmoqda.',
  "Shunchaki sozlayapman.",
  'Vaziyat pishmoqda.',
  'Ozgina sehr.',
  'Sabr ishlayapti.',
  'Shovqinsiz natija.',
  "Mayda mo'jizalar.",
  "Yig'ishtirib qo'yapman.",
  "O'zi joyiga tushadi.",
  'Hammasi nazoratda.',
  'Qayta moslanyapman.',
  'Bir maromda.',
  'Sekin, lekin aniq.',
  'Rekombobulyatsiya davom etmoqda.',
  'Ichki mexanizmlar ishlayapti.',
  'Kosmik kalibrovka.',
  'Xaos optimallashtirildi.',
  'Voqelik sinxronlanmoqda.',
  'Kayfiyat kalibrovkada.',
  'Olam bilan sinxron.',
  'Nozik sozlash.',
  'Ichki muhandislik.',
  'Vaziyat jilolanmoqda.',
] as const

export function getCorelingSpinnerVerbs(): readonly string[] {
  return detectLocale() === 'uz'
    ? CORELING_SPINNER_VERBS_UZ
    : CORELING_SPINNER_VERBS_EN
}
