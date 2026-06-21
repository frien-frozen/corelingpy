import type { Command } from '../../commands.js'

const gui = {
  type: 'local',
  name: 'gui',
  description: 'Open Coreling GUI chat in your browser (orchestrator mode)',
  supportsNonInteractive: true,
  load: () => import('./gui.js'),
} satisfies Command

export default gui
