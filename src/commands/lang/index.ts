import type { Command } from '../../commands.js'

const lang = {
  type: 'local',
  name: 'lang',
  description: 'Switch interface language (en · uz)',
  argumentHint: 'en|uz',
  supportsNonInteractive: true,
  load: () => import('./lang.js'),
} satisfies Command

export default lang
