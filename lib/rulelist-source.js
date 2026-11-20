/**
 * Download a rule list from a URL.
 *
 * Zero Omega stores a rule list's source in `profile.sourceUrl` and its cached
 * text in `profile.ruleList`. This module performs that download through the
 * process-wide dispatcher, so a subscription URL obeys the same proxy rules as
 * any other request (a GitHub-hosted list can go through the proxy while a
 * local mirror stays direct).
 *
 * @module dsh-omega/rulelist-source
 */

/** Upper bound on a downloaded list; larger bodies are rejected instead of read. */
export const MAX_RULE_LIST_BYTES = 16 * 1024 * 1024

/** Default request timeout. */
export const DEFAULT_TIMEOUT_MS = 30_000

/**
 * Validate a subscription URL.
 * @param raw - user-supplied URL.
 * @returns the parsed URL.
 * @throws when the value is not an absolute http(s) URL.
 */
export function ruleListUrl(raw) {
  let url
  try {
    url = new URL(String(raw ?? '').trim())
  } catch {
    throw Object.assign(new Error('规则列表网址不是有效的绝对 URL'), { status: 400 })
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw Object.assign(new Error('规则列表网址只支持 http/https'), { status: 400 })
  }
  return url
}

async function readLimited(response, limit) {
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > limit) {
    throw Object.assign(new Error(`规则列表超过 ${limit} 字节`), { status: 400 })
  }
  if (response.body === null) return ''
  const reader = response.body.getReader()
  const chunks = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > limit) {
      await reader.cancel()
      throw Object.assign(new Error(`规则列表超过 ${limit} 字节`), { status: 400 })
    }
    chunks.push(Buffer.from(value))
  }
  return Buffer.concat(chunks).toString('utf8')
}

/**
 * Fetch a rule list.
 * @param raw - subscription URL.
 * @param options - timeout and size overrides.
 * @returns `{ url, content, bytes, lastUpdate }`.
 */
export async function fetchRuleList(raw, options = {}) {
  const url = ruleListUrl(raw)
  const timeoutMs = Number(options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  const limit = Number(options.maxBytes ?? MAX_RULE_LIST_BYTES)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        accept: 'text/plain, text/*;q=0.9, */*;q=0.5',
        'user-agent': 'dsh-omega/0.1',
      },
    })
    if (!response.ok) {
      throw Object.assign(new Error(`规则列表下载失败：HTTP ${response.status}`), { status: 400 })
    }
    const content = await readLimited(response, limit)
    return {
      url: response.url === '' ? url.href : response.url,
      content,
      bytes: Buffer.byteLength(content),
      lastUpdate: new Date().toISOString(),
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw Object.assign(new Error(`规则列表下载超时（${timeoutMs}ms）`), { status: 400 })
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
