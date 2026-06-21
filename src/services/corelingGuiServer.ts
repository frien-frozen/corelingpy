import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { openBrowser } from '../utils/browser.js'
import { getCorelingSpinnerVerbs } from '../constants/corelingSpinnerVerbs.js'
import {
  pickOrchestratorRole,
  type OrchestratorRole,
} from '../constants/orchestratorRoles.js'
import {
  defaultModelOptions,
  getGuiFeedDir,
  loadOrchestratorConfig,
  saveOrchestratorConfig,
  type OrchestratorConfig,
} from './orchestratorConfig.js'
import { getGuiHtml } from '../gui/corelingGuiHtml.js'
import { resolveBundledOpenRouterApiKey } from '../constants/platformCloud.js'

const DEFAULT_PORT = Number(process.env.CORELING_GUI_PORT ?? '9473')

let activeServer: ReturnType<typeof createServer> | null = null
let activePort = DEFAULT_PORT

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  })
  res.end(data)
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

function resolveChatEndpoint(): {
  baseUrl: string
  apiKey: string
  defaultModel: string
} {
  const baseUrl =
    process.env.OPENAI_BASE_URL?.replace(/\/$/, '') ??
    'https://openrouter.ai/api/v1'
  const apiKey =
    process.env.OPENAI_API_KEY ??
    resolveBundledOpenRouterApiKey() ??
    process.env.OPENROUTER_API_KEY ??
    ''
  const defaultModel = process.env.OPENAI_MODEL ?? 'nex-agi/nex-n2-pro:free'
  return { baseUrl, apiKey, defaultModel }
}

async function chatCompletion(
  model: string,
  system: string,
  user: string,
): Promise<string> {
  const { baseUrl, apiKey, defaultModel } = resolveChatEndpoint()
  if (!apiKey && baseUrl.includes('openrouter')) {
    throw new Error(
      'Set CORELING_OPENROUTER_KEY in ~/.coreling/cloud.env or pick a cloud model with /model',
    )
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      'HTTP-Referer': 'https://coreling.org',
      'X-Title': 'Coreling GUI',
    },
    body: JSON.stringify({
      model: model || defaultModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(120_000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Chat API ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return data.choices?.[0]?.message?.content?.trim() ?? '(empty response)'
}

async function handleOrchestrate(body: {
  message?: string
  files?: Array<{ name: string; content: string }>
}): Promise<{
  quote: string
  role: OrchestratorRole
  response: string
  fedFiles: string[]
}> {
  const config = loadOrchestratorConfig()
  const message = body.message?.trim() ?? ''
  const files = body.files ?? []
  const feedDir = getGuiFeedDir()
  const fedNames: string[] = []

  for (const file of files) {
    const safe = file.name.replace(/[^\w.\-()+ ]/g, '_')
    writeFileSync(join(feedDir, `${Date.now()}-${safe}`), file.content, 'utf8')
    fedNames.push(safe)
  }

  const role = pickOrchestratorRole(config.roles, message, fedNames)
  const verbs = [...getCorelingSpinnerVerbs()]
  const quote = verbs[Math.floor(Math.random() * verbs.length)] ?? 'Working…'

  const fileSummary =
    fedNames.length > 0
      ? `\n\nAttached files (${fedNames.length}): ${fedNames.join(', ')}`
      : ''
  const system = `You are ${role.name}, a specialist agent in Coreling Orchestrator. Be concise and helpful.`
  const response = await chatCompletion(
    role.model,
    system,
    `${message}${fileSummary}`,
  )
  return { quote, role, response, fedFiles: fedNames }
}

async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${activePort}`)
  const path = url.pathname

  if (req.method === 'GET' && path === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(getGuiHtml())
    return
  }

  if (req.method === 'GET' && path === '/api/config') {
    sendJson(res, 200, {
      ...loadOrchestratorConfig(),
      models: defaultModelOptions(),
      quotes: getCorelingSpinnerVerbs(),
    })
    return
  }

  if (req.method === 'POST' && path === '/api/config') {
    const parsed = JSON.parse(await readBody(req)) as OrchestratorConfig
    if (!Array.isArray(parsed.roles)) {
      sendJson(res, 400, { error: 'roles array required' })
      return
    }
    saveOrchestratorConfig(parsed)
    sendJson(res, 200, { ok: true })
    return
  }

  if (req.method === 'POST' && path === '/api/orchestrate') {
    try {
      const body = JSON.parse(await readBody(req)) as {
        message?: string
        files?: Array<{ name: string; content: string }>
      }
      sendJson(res, 200, await handleOrchestrate(body))
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : String(error),
      })
    }
    return
  }

  sendJson(res, 404, { error: 'not found' })
}

export function getGuiUrl(port = activePort): string {
  return `http://127.0.0.1:${port}`
}

export async function startCorelingGuiServer(
  port = DEFAULT_PORT,
): Promise<{ url: string; port: number }> {
  if (activeServer) {
    return { url: getGuiUrl(activePort), port: activePort }
  }

  activePort = port
  getGuiFeedDir()

  await new Promise<void>((resolve, reject) => {
    const server = createServer((req, res) => {
      void route(req, res).catch(err => {
        sendJson(res, 500, { error: String(err) })
      })
    })
    server.on('error', reject)
    server.listen(port, '127.0.0.1', () => {
      activeServer = server
      resolve()
    })
  })

  return { url: getGuiUrl(activePort), port: activePort }
}

export async function openCorelingGui(): Promise<string> {
  let port = DEFAULT_PORT
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const started = await startCorelingGuiServer(port)
      await openBrowser(started.url)
      return started.url
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'EADDRINUSE'
      ) {
        port += 1
        continue
      }
      throw error
    }
  }
  throw new Error('Could not bind GUI server port')
}
