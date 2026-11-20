/**
 * Browser-side control surface for dsh-omega.
 *
 * The settings page is a Client plugin, so it reaches the Host through the
 * same loopback Web server the rest of the GUI uses. Five small endpoints carry
 * the whole feature: read state, save a document, import a backup, export a
 * backup, and resolve a URL for the rule tester.
 *
 * Writes require JSON content type and a same-origin request, so a plain
 * cross-site form cannot change proxy settings.
 *
 * @module dsh-omega/http-api
 */
import { configPath } from './config.js'

const BASE = '/dsh-omega/api'
const MAX_BODY_BYTES = 16 * 1024 * 1024

function send(res, status, body, contentType = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'content-type': contentType,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(body)
}

function sendJson(res, status, body) {
  send(res, status, JSON.stringify(body))
}

function isLoopback(address) {
  if (typeof address !== 'string' || address === '') return true
  const value = address.toLowerCase()
  return value === '::1'
    || value === '::ffff:127.0.0.1'
    || value.startsWith('127.')
    || value === 'localhost'
}

function sameOrigin(req) {
  const origin = req.headers.origin
  if (typeof origin !== 'string' || origin === '') return true
  try {
    return new URL(origin).host === req.headers.host
  } catch {
    return false
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('请求体过大'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function readJson(req) {
  const body = await readBody(req)
  if (body.trim() === '') return {}
  try {
    return JSON.parse(body)
  } catch {
    throw Object.assign(new Error('请求体不是有效的 JSON'), { status: 400 })
  }
}

/**
 * Register the control endpoints once a Web server is available.
 * @param ctx - plugin context.
 * @param handlers - `{ getState, save, importBackup, exportBackup, resolve, refreshProviders }`.
 * @returns a disposer; `ctx.effect` can own it.
 */
export function installHttpApi(ctx, handlers) {
  return ctx.inject(['webServer'], (webCtx) => webCtx.effect(() => webCtx.webServer.register({
    kind: 'prefix',
    path: BASE,
    handler: async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost')
      const route = url.pathname.slice(BASE.length) || '/'
      try {
        if (!isLoopback(req.socket?.remoteAddress)) {
          sendJson(res, 403, { ok: false, error: 'the dsh-omega settings API is loopback-only' })
          return
        }
        if (req.method === 'GET' && (route === '/' || route === '/state')) {
          sendJson(res, 200, { ok: true, ...handlers.getState(), file: configPath() })
          return
        }
        if (req.method === 'GET' && route === '/export') {
          const content = handlers.exportBackup()
          send(res, 200, content, 'text/plain; charset=utf-8')
          return
        }
        if (req.method === 'GET' && route === '/providers') {
          sendJson(res, 200, { ok: true, providers: handlers.refreshProviders() })
          return
        }
        if (req.method !== 'POST') {
          sendJson(res, 405, { ok: false, error: 'method-not-allowed' })
          return
        }
        if (!sameOrigin(req)) {
          sendJson(res, 403, { ok: false, error: 'cross-origin request rejected' })
          return
        }
        if (!String(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
          sendJson(res, 415, { ok: false, error: 'content-type must be application/json' })
          return
        }
        const body = await readJson(req)
        if (route === '/config') {
          const result = await handlers.save(body.doc)
          sendJson(res, 200, { ok: true, ...result })
          return
        }
        if (route === '/import') {
          const result = await handlers.importBackup(body)
          sendJson(res, 200, { ok: true, ...result })
          return
        }
        if (route === '/rulelist/refresh') {
          const result = await handlers.refreshRuleLists()
          sendJson(res, 200, { ok: true, ...handlers.getState(), refreshed: result })
          return
        }
        if (route === '/rulelist/fetch') {
          if (typeof body.url !== 'string' || body.url.trim() === '') {
            sendJson(res, 400, { ok: false, error: 'url is required' })
            return
          }
          sendJson(res, 200, { ok: true, ...await handlers.fetchRuleList(body.url) })
          return
        }
        if (route === '/resolve') {
          if (typeof body.url !== 'string' || body.url.trim() === '') {
            sendJson(res, 400, { ok: false, error: 'url is required' })
            return
          }
          sendJson(res, 200, { ok: true, ...handlers.resolve(body.url, body.doc) })
          return
        }
        if (route === '/providers/refresh') {
          sendJson(res, 200, { ok: true, providers: handlers.refreshProviders() })
          return
        }
        sendJson(res, 404, { ok: false, error: 'not-found' })
      } catch (error) {
        webCtx.logger?.warn?.('dsh-omega: HTTP API failed: %s', error?.stack ?? error)
        sendJson(res, error?.status ?? 500, { ok: false, error: error?.message ?? String(error) })
      }
    },
  })))
}

export { BASE }
