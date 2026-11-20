/**
 * Discover the model providers DSH can route, and the hosts each one uses.
 *
 * A provider route is a route id such as `deepseek-account` or
 * `github-copilot`. Configuration surfaces already publish the route's
 * settings namespace and settings path, so this module reads the resolved
 * `baseURL` from the settings document and adds the well-known authentication
 * hosts a gateway-based route also touches (Copilot's GitHub login is the
 * important one). Discovered hosts are advisory: a user can override them per
 * provider in the UI.
 *
 * @module dsh-omega/providers
 */

/**
 * Hosts a route uses beyond its inference endpoint.
 * Keys are route ids; values are lower-cased hostnames.
 */
export const KNOWN_PROVIDER_HOSTS = {
  'deepseek-account': ['api.deepseek.com', 'harness.deepseek.com', 'platform.deepseek.com'],
  'deepseek-official': ['api.deepseek.com', 'harness.deepseek.com', 'platform.deepseek.com'],
  deepseek: ['api.deepseek.com'],
  'github-copilot': [
    'api.individual.githubcopilot.com',
    'api.business.githubcopilot.com',
    'github.com',
    'api.github.com',
  ],
  anthropic: ['api.anthropic.com'],
  openai: ['api.openai.com'],
  'openai-codex': ['chatgpt.com', 'api.openai.com'],
  google: ['generativelanguage.googleapis.com'],
  'google-vertex': ['aiplatform.googleapis.com'],
  moonshotai: ['api.moonshot.cn'],
  zai: ['open.bigmodel.cn'],
  xai: ['api.x.ai'],
  openrouter: ['openrouter.ai'],
  mistral: ['api.mistral.ai'],
  groq: ['api.groq.com'],
}

function walk(value, path) {
  let current = value
  for (const key of path) {
    if (current === null || typeof current !== 'object') return undefined
    current = current[key]
  }
  return current
}

function hostsFromBaseURL(baseURL) {
  if (typeof baseURL !== 'string' || baseURL.trim() === '') return []
  try {
    const url = new URL(baseURL)
    if (url.hostname === '' || url.hostname === 'localhost' || url.hostname === '127.0.0.1') return []
    return [url.hostname.toLowerCase()]
  } catch {
    return []
  }
}

/**
 * Read the live provider directory and its endpoint hosts.
 * @param ctx - plugin context; `llm` and `settings` are optional.
 * @returns provider rows without user overrides.
 */
export function discoverProviders(ctx) {
  const llm = ctx.get('llm')
  if (llm === undefined) return []
  let registered = []
  let directory = []
  try {
    registered = llm.listProviders()
  } catch {
    registered = []
  }
  try {
    directory = llm.listConfigurableProviders()
  } catch {
    directory = []
  }
  const active = new Set(registered.map(provider => provider.id))
  const sections = new Map()
  const settings = ctx.get('settings')
  if (settings !== undefined) {
    try {
      for (const form of settings.describe()) sections.set(form.ns, form.value)
    } catch {
      // A partially mounted settings service is not fatal: known hosts still apply.
    }
  }

  const rows = []
  const seen = new Set()
  for (const entry of directory) {
    if (typeof entry?.provider !== 'string' || entry.provider === '') continue
    seen.add(entry.provider)
    const section = sections.get(entry.settingsNs)
    const profile = walk(section, entry.settingsPath ?? [])
    const configuredBaseURL = profile !== null && typeof profile === 'object' ? profile.baseURL : undefined
    const effectiveBaseURL = typeof configuredBaseURL === 'string' && configuredBaseURL !== ''
      ? configuredBaseURL
      : entry.defaultBaseURL
    const hosts = unique([
      ...hostsFromBaseURL(effectiveBaseURL),
      ...(KNOWN_PROVIDER_HOSTS[entry.provider] ?? []),
    ])
    rows.push({
      id: entry.provider,
      name: entry.displayName ?? entry.provider,
      hosts,
      baseURL: effectiveBaseURL ?? '',
      active: active.has(entry.provider),
      configured: true,
    })
  }
  for (const provider of registered) {
    if (seen.has(provider.id)) continue
    const hosts = unique(KNOWN_PROVIDER_HOSTS[provider.id] ?? [])
    rows.push({
      id: provider.id,
      name: provider.name ?? provider.id,
      hosts,
      baseURL: '',
      active: true,
      configured: false,
    })
  }
  return rows
}

/**
 * Merge discovered hosts with a document's per-provider overrides.
 * @param providers - rows from {@link discoverProviders}.
 * @param extension - `-dshOmega` extension.
 * @returns rows for the UI, each with `detectedHosts`, `hosts` and `binding`.
 */
export function joinProviderRows(providers, extension) {
  const overrides = extension?.providerHosts ?? {}
  const bindings = extension?.providerBindings ?? {}
  return providers.map((provider) => {
    const override = Array.isArray(overrides[provider.id]) && overrides[provider.id].length > 0
      ? overrides[provider.id]
      : undefined
    return {
      ...provider,
      detectedHosts: provider.hosts,
      hosts: override ?? provider.hosts,
      overridden: override !== undefined,
      binding: typeof bindings[provider.id] === 'string' ? bindings[provider.id] : '',
    }
  })
}

/**
 * Provider rows for the routing table: overrides win, detected hosts fill in.
 * @param providers - discovered rows.
 * @param extension - `-dshOmega` extension.
 * @returns rows consumed by `buildRoutingTable`.
 */
export function providersForRouting(providers, extension) {
  return joinProviderRows(providers, extension)
}

function unique(values) {
  return [...new Set(values.map(value => String(value).toLowerCase().trim()).filter(Boolean))]
}
