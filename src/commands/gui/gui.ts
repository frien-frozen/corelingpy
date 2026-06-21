import { t } from '../../i18n/corelingUiStrings.js'
import type { LocalCommandCall } from '../../types/command.js'
import { openCorelingGui } from '../../services/corelingGuiServer.js'

export const call: LocalCommandCall = async () => {
  try {
    const url = await openCorelingGui()
    return {
      type: 'text',
      value: `${t('guiOpened')}\n${url}\nOrchestrator tab: assign models to roles, feed files, run Orchestrated chat.`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      type: 'text',
      value: `Could not start GUI: ${message}`,
    }
  }
}
