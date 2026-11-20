/**
 * dsh-omega — Zero Omega style proxy routing for DeepSeek Harness.
 *
 * Host half: own the process-wide undici dispatcher, evaluate a Zero Omega
 * options document per request, expose a small HTTP control surface for the
 * settings page, and keep the document in `$DSH_HOME/dsh-omega/config.json`.
 *
 * @module dsh-omega
 */
import fs from 'node:fs'
import { ConfigStore, exportDocument, extensionOf, importDocument, configPath, normalizeDocument } from './lib/config.js'
import { buildRoutingTable, summariseDocument } from './lib/profiles.js'
import { discoverProviders, joinProviderRows, providersForRouting } from './lib/providers.js'
import { installRouter } from './lib/router.js'
import { installHttpApi } from './lib/http-api.js'
import { fetchRuleList as fetchRemoteRuleList } from './lib/rulelist-source.js'

function readVersion() {
  try {
    return JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

const VERSION = readVersion()

function providerSignature(providers) {
  return JSON.stringify(providers.map(provider => [provider.id, provider.hosts]))
}

/**
 * Mount the plugin.
 * @param ctx - plugin context.
 */
export function apply(ctx) {
  const store = new ConfigStore(ctx)
  if (!fs.existsSync(configPath())) {
    try {
      store.save(store.doc)
    } catch (error) {
      ctx.logger?.warn?.('dsh-omega: cannot write the initial configuration: %s', error.message)
    }
  }

  let discovered = discoverProviders(ctx)
  let signature = providerSignature(discovered)
  let table = buildRoutingTable(store.doc, providersForRouting(discovered, extensionOf(store.doc)))
  const handle = installRouter(table)

  const rebuild = (doc = store.doc) => {
    table = buildRoutingTable(doc, providersForRouting(discovered, extensionOf(doc)))
    handle.setTable(table)
    return table
  }

  const refreshProviders = () => {
    discovered = discoverProviders(ctx)
    const next = providerSignature(discovered)
    if (next !== signature) {
      signature = next
      rebuild()
    }
    return joinProviderRows(discovered, extensionOf(store.doc))
  }

  const documentState = () => ({
    doc: store.doc,
    currentProfileName: table.currentProfileName,
    providers: joinProviderRows(discovered, extensionOf(store.doc)),
    warnings: [...(store.warnings ?? []), ...table.warnings],
    summary: summariseDocument(store.doc),
    version: VERSION,
    file: configPath(),
  })

  const refreshRuleLists = async (force = false) => {
    const intervalMinutes = Number(store.doc['-downloadInterval'] ?? 0)
    if (!force && (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0)) {
      return { updated: 0, failed: 0, skipped: true }
    }
    const entries = Object.entries(store.doc).filter(([key, value]) => key.startsWith('+')
      && value !== null && typeof value === 'object'
      && value.profileType === 'RuleListProfile'
      && typeof value.sourceUrl === 'string' && value.sourceUrl.trim() !== '')
    if (entries.length === 0) return { updated: 0, failed: 0, skipped: true }
    const candidate = { ...store.doc }
    let updated = 0
    const errors = []
    for (const [key, profile] of entries) {
      const last = Date.parse(profile.lastUpdate ?? '')
      if (!force && Number.isFinite(last) && Date.now() - last < intervalMinutes * 60_000) continue
      try {
        const result = await fetchRemoteRuleList(profile.sourceUrl)
        candidate[key] = {
          ...profile,
          sourceUrl: result.url,
          ruleList: result.content,
          lastUpdate: result.lastUpdate,
        }
        updated += 1
      } catch (error) {
        errors.push({ profile: profile.name ?? key.slice(1), message: error.message })
        ctx.logger?.warn?.('dsh-omega: rule list %s failed: %s', profile.name ?? key.slice(1), error.message)
      }
    }
    if (updated > 0) {
      store.save(candidate)
      rebuild()
    }
    return { updated, failed: errors.length, errors }
  }

  const handlers = {
    getState: documentState,
    fetchRuleList: rawUrl => fetchRemoteRuleList(rawUrl),
    refreshRuleLists: () => refreshRuleLists(true),
    save(doc) {
      if (doc === null || typeof doc !== 'object') {
        throw Object.assign(new Error('doc must be an object'), { status: 400 })
      }
      const result = store.save(doc)
      rebuild(result.doc)
      return {
        ...documentState(),
        warnings: [...result.warnings, ...table.warnings],
      }
    },
    importBackup({ content, mode }) {
      if (typeof content !== 'string') {
        throw Object.assign(new Error('content must be a JSON string'), { status: 400 })
      }
      const result = importDocument(content, store.doc, mode === 'merge' ? 'merge' : 'replace')
      store.save(result.doc)
      rebuild(result.doc)
      return {
        ...documentState(),
        imported: true,
        mode: result.mode,
        summary: result.summary,
        warnings: [...result.warnings, ...table.warnings],
      }
    },
    exportBackup() {
      return JSON.stringify(exportDocument(store.doc), null, 2)
    },
    resolve(rawUrl, candidate) {
      let url
      try {
        url = new URL(rawUrl)
      } catch {
        throw Object.assign(new Error('url is not a valid absolute URL'), { status: 400 })
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw Object.assign(new Error('url must use http or https'), { status: 400 })
      }
      let active = table
      let draft = false
      if (candidate !== null && typeof candidate === 'object') {
        let normalized
        try {
          normalized = normalizeDocument(candidate).doc
        } catch (error) {
          throw Object.assign(error, { status: 400 })
        }
        draft = JSON.stringify(normalized) !== JSON.stringify(store.doc)
        active = buildRoutingTable(normalized, providersForRouting(discovered, extensionOf(normalized)))
      }
      return {
        url: url.href,
        currentProfileName: active.currentProfileName,
        draft,
        ...active.resolve(url),
      }
    },
    refreshProviders,
  }

  installHttpApi(ctx, handlers)

  let pending
  const refreshSoon = () => {
    if (pending !== undefined) return
    pending = setTimeout(() => {
      pending = undefined
      try {
        refreshProviders()
      } catch (error) {
        ctx.logger?.warn?.('dsh-omega: refreshing providers failed: %s', error.message)
      }
    }, 250)
  }
  ctx.effect(() => {
    const off = ctx.on?.('llm/adapters-updated', refreshSoon)
    return () => {
      off?.()
      if (pending !== undefined) clearTimeout(pending)
    }
  })
  ctx.inject(['llm'], () => {
    refreshSoon()
  })

  let refreshingRuleLists = false
  const autoRefreshRuleLists = async () => {
    if (refreshingRuleLists) return
    refreshingRuleLists = true
    try {
      const result = await refreshRuleLists()
      if (result.updated > 0) {
        ctx.logger?.info?.('dsh-omega: refreshed %d rule list(s)', result.updated)
      }
    } catch (error) {
      ctx.logger?.warn?.('dsh-omega: rule list refresh failed: %s', error.message)
    } finally {
      refreshingRuleLists = false
    }
  }
  ctx.effect(() => {
    const first = setTimeout(autoRefreshRuleLists, 10_000)
    const timer = setInterval(autoRefreshRuleLists, 5 * 60_000)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  })

  ctx.effect(() => () => handle.dispose())

  ctx.logger?.info?.(
    'dsh-omega %s: %d profiles, current "%s"',
    VERSION,
    Object.keys(store.doc).filter(key => key.startsWith('+')).length,
    table.currentProfileName,
  )
}
