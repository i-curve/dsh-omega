/**
 * Per-request transport router for dsh-omega.
 *
 * One global undici dispatcher serves every outbound `fetch`. This router
 * resolves each request against the active routing table and sends a matched
 * request through the proxy's `ProxyAgent`; everything else keeps the
 * dispatcher that was installed before this plugin, so loopback, the DSH web
 * UI and any environment-level proxy policy behave as they did.
 *
 * @module dsh-omega/router
 */
import { loadUndici } from './undici.js'

const undici = await loadUndici()

function requestUrl(options) {
  const origin = String(options.origin ?? '')
  const path = String(options.path ?? '')
  if (origin === '') return undefined
  try {
    return new URL(`${origin}${path}`)
  } catch {
    return undefined
  }
}

/** Router dispatcher that delegates by URL. */
export class OmegaRouter extends undici.Dispatcher {
  /**
   * @param fallback - dispatcher used for direct requests and unmatched URLs.
   */
  constructor(fallback) {
    super()
    this.fallback = fallback
    this.table = undefined
    this.agents = new Map()
  }

  /**
   * Replace the routing table and drop proxy pools the previous table owned.
   * @param table - routing table from `buildRoutingTable`.
   */
  setTable(table) {
    const previous = this.agents
    this.table = table
    this.agents = new Map()
    for (const agent of previous.values()) {
      agent.close().catch(() => {})
    }
  }

  agentFor(proxy) {
    const key = `${proxy.uri}\u0000${proxy.authorization ?? ''}`
    const existing = this.agents.get(key)
    if (existing !== undefined) return existing
    const agent = new undici.ProxyAgent({
      uri: proxy.uri,
      allowH2: false,
      ...(proxy.authorization === undefined ? {} : { token: proxy.authorization }),
    })
    this.agents.set(key, agent)
    return agent
  }

  /** Route one request; both `fetch` and SDK call sites reach this. */
  dispatch(options, handler) {
    const url = requestUrl(options)
    if (url === undefined || this.table === undefined) return this.fallback.dispatch(options, handler)
    let decision
    try {
      decision = this.table.resolve(url)
    } catch {
      return this.fallback.dispatch(options, handler)
    }
    if (decision.kind !== 'proxy') return this.fallback.dispatch(options, handler)
    try {
      return this.agentFor(decision.proxy).dispatch(options, handler)
    } catch {
      return this.fallback.dispatch(options, handler)
    }
  }

  /** Close the proxy pools this router owns. */
  async close() {
    const agents = [...this.agents.values()]
    this.agents = new Map()
    await Promise.all(agents.map(agent => agent.close().catch(() => {})))
  }

  /** Destroy the proxy pools this router owns. */
  async destroy(error) {
    const agents = [...this.agents.values()]
    this.agents = new Map()
    await Promise.all(agents.map(agent => agent.destroy(error).catch(() => {})))
  }
}

/**
 * Install a router into the process-wide dispatcher slot.
 * @param table - initial routing table.
 * @returns a handle that swaps tables and restores the previous dispatcher.
 */
export function installRouter(table) {
  const previous = undici.getGlobalDispatcher()
  const router = new OmegaRouter(previous)
  router.setTable(table)
  undici.setGlobalDispatcher(router)
  return {
    router,
    setTable(next) {
      router.setTable(next)
    },
    async dispose() {
      if (undici.getGlobalDispatcher() === router) undici.setGlobalDispatcher(previous)
      await router.close()
    },
  }
}
