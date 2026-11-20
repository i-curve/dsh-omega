/**
 * Turn a Zero Omega options document into a routing table DSH can evaluate.
 *
 * The browser delegates proxy choice to `chrome.proxy`; DSH owns one global
 * undici dispatcher, so this module answers, per request URL, which profile
 * wins and which proxy URL that profile stands for. It implements the profile
 * types that describe an HTTP(S) proxy: `FixedProfile`, `SwitchProfile`,
 * `VirtualProfile`, `RuleListProfile`, `DirectProfile` and `SystemProfile`.
 * PAC profiles have no evaluator here and are reported, not guessed.
 *
 * @module dsh-omega/profiles
 */
import {
  bypassMatcher, conditionProblem, hostRegexMatcher, hostWildcardMatcher, ipMatcher, matchCondition,
  urlRegexMatcher, urlWildcardMatcher,
} from './conditions.js'
import { countRuleLines, parseRuleList } from './rule-list.js'

/** Profile types DSH can route. */
export const ROUTABLE_TYPES = new Set([
  'DirectProfile',
  'SystemProfile',
  'FixedProfile',
  'SwitchProfile',
  'VirtualProfile',
  'RuleListProfile',
])

/** Loopback hostnames are never sent to a proxy. */
export function isLoopbackHost(host) {
  const value = String(host ?? '').toLowerCase()
  return value === 'localhost'
    || value.endsWith('.localhost')
    || value === '127.0.0.1'
    || value === '::1'
    || value === '[::1]'
    || /^127\./.test(value)
}

/**
 * Normalise a legacy rule-list profile type to `RuleListProfile`.
 * @param profile - stored profile.
 * @returns a profile with a modern `profileType` and `format`.
 */
export function normalizeProfile(profile) {
  const copy = { ...profile }
  if (copy.profileType === 'SwitchyRuleListProfile') {
    copy.profileType = 'RuleListProfile'
    copy.format ??= 'Switchy'
  } else if (copy.profileType === 'AutoProxyRuleListProfile') {
    copy.profileType = 'RuleListProfile'
    copy.format ??= 'AutoProxy'
  }
  if (copy.profileType === 'RuleListProfile' && copy.format === undefined) copy.format = 'AutoProxy'
  return copy
}

const compiledConditionCache = new WeakMap()

function compileCondition(condition) {
  const cached = compiledConditionCache.get(condition)
  if (cached !== undefined) return cached
  const predicate = buildConditionPredicate(condition)
  compiledConditionCache.set(condition, predicate)
  return predicate
}

function buildConditionPredicate(condition) {
  const type = condition?.conditionType
  switch (type) {
    case 'TrueCondition':
      return () => true
    case 'FalseCondition':
      return () => false
    case 'HostWildcardCondition': {
      const matcher = hostWildcardMatcher(condition.pattern)
      return matcher === undefined ? () => false : request => matcher(request.host)
    }
    case 'HostRegexCondition': {
      const matcher = hostRegexMatcher(condition.pattern)
      return matcher === undefined ? () => false : request => matcher(request.host)
    }
    case 'UrlWildcardCondition': {
      const matcher = urlWildcardMatcher(condition.pattern)
      return matcher === undefined ? () => false : request => matcher(request.url)
    }
    case 'UrlRegexCondition': {
      const matcher = urlRegexMatcher(condition.pattern)
      return matcher === undefined ? () => false : request => matcher(request.url)
    }
    case 'KeywordCondition': {
      const needle = String(condition.pattern ?? '')
      return request => request.scheme === 'http' && needle !== '' && request.url.includes(needle)
    }
    case 'IpCondition': {
      const matcher = ipMatcher(condition.ip, condition.prefixLength)
      return matcher === undefined ? () => false : request => matcher(request.host)
    }
    case 'BypassCondition': {
      const matcher = bypassMatcher(condition.pattern)
      return matcher === undefined ? () => false : request => matcher(request)
    }
    default:
      return () => false
  }
}

const compiledRulesCache = new WeakMap()

function compileRules(profile) {
  const cached = compiledRulesCache.get(profile)
  if (cached !== undefined) return cached
  let rules = []
  if (profile.profileType === 'RuleListProfile') {
    rules = parseRuleList(profile.ruleList ?? '', profile.matchProfileName ?? 'direct', profile.defaultProfileName ?? 'direct', profile.format)
      .map(rule => ({
        matches: compileCondition(rule.condition),
        profileName: rule.profileName,
      }))
  } else if (Array.isArray(profile.rules)) {
    rules = profile.rules
      .filter(rule => rule !== null && typeof rule === 'object' && rule.condition !== null && typeof rule.condition === 'object')
      .map(rule => ({
        matches: compileCondition(rule.condition),
        profileName: typeof rule.profileName === 'string' ? rule.profileName : '',
      }))
  }
  compiledRulesCache.set(profile, rules)
  return rules
}

function requestFromUrl(url) {
  const scheme = url.protocol.replace(/:$/, '').toLowerCase()
  return {
    url: url.href,
    host: url.hostname.toLowerCase(),
    scheme,
    port: Number(url.port === '' ? (scheme === 'https' ? 443 : 80) : url.port),
  }
}

function proxyUri(proxy) {
  const host = String(proxy.host ?? '')
  const bracketed = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host
  return `${proxy.scheme}://${bracketed}:${Number(proxy.port)}`
}

function profileForScheme(profile, scheme) {
  const prop = scheme === 'https' ? 'proxyForHttps' : scheme === 'http' ? 'proxyForHttp' : 'proxyForFtp'
  const proxy = profile[prop] ?? profile.fallbackProxy
  const auth = profile.auth?.[prop] ?? profile.auth?.all
  return { proxy, auth }
}

function bypassed(profile, request) {
  if (!Array.isArray(profile.bypassList)) return false
  for (const condition of profile.bypassList) {
    if (condition === null || typeof condition !== 'object') continue
    if (matchCondition({ conditionType: 'BypassCondition', ...condition }, request)) return true
  }
  return false
}

function proxyDecision(profile, proxy, auth, request, trace) {
  if (proxy === null || typeof proxy !== 'object') {
    trace.push({ step: 'direct', profile: profile.name, code: 'no-proxy' })
    return { kind: 'direct', profileName: profile.name, trace }
  }
  const scheme = String(proxy.scheme ?? '').toLowerCase()
  if (scheme !== 'http' && scheme !== 'https') {
    trace.push({ step: 'unsupported', code: 'scheme', profile: profile.name, scheme: scheme || 'unknown' })
    return { kind: 'direct', profileName: profile.name, unsupported: scheme || 'unknown', trace }
  }
  const host = String(proxy.host ?? '')
  const port = Number(proxy.port)
  if (host === '' || !Number.isInteger(port) || port <= 0 || port > 65535) {
    trace.push({ step: 'direct', profile: profile.name, code: 'invalid-proxy' })
    return { kind: 'direct', profileName: profile.name, trace }
  }
  const authorization = auth !== null && typeof auth === 'object' && typeof auth.username === 'string' && auth.username !== ''
    ? `Basic ${Buffer.from(`${auth.username}:${String(auth.password ?? '')}`).toString('base64')}`
    : undefined
  trace.push({
    step: 'proxy',
    profile: profile.name,
    proxy: proxyUri({ ...proxy, scheme, host, port }),
  })
  return {
    kind: 'proxy',
    profileName: profile.name,
    proxy: {
      uri: proxyUri({ ...proxy, scheme, host, port }),
      scheme,
      host,
      port,
      ...authorization === undefined ? {} : { authorization },
    },
    trace,
  }
}

function resolveProfile(profiles, name, request, trace, depth) {
  if (depth > 16) {
    trace.push({ step: 'direct', code: 'cycle' })
    return { kind: 'direct', trace }
  }
  if (name === '' || name === undefined || name === null) {
    trace.push({ step: 'direct', code: 'no-profile' })
    return { kind: 'direct', trace }
  }
  if (name === 'direct') {
    trace.push({ step: 'direct', profile: 'direct' })
    return { kind: 'direct', profileName: 'direct', trace }
  }
  if (name === 'system') {
    trace.push({ step: 'direct', profile: 'system', code: 'system' })
    return { kind: 'direct', profileName: 'system', trace }
  }
  const stored = profiles.get(name)
  if (stored === undefined) {
    trace.push({ step: 'direct', code: 'missing-profile', profile: name })
    return { kind: 'direct', trace }
  }
  const profile = normalizeProfile(stored)
  switch (profile.profileType) {
    case 'DirectProfile':
      trace.push({ step: 'direct', profile: profile.name })
      return { kind: 'direct', profileName: profile.name, trace }
    case 'SystemProfile':
      trace.push({ step: 'direct', profile: profile.name, code: 'system' })
      return { kind: 'direct', profileName: profile.name, trace }
    case 'FixedProfile': {
      if (bypassed(profile, request)) {
        trace.push({ step: 'direct', profile: profile.name, code: 'bypass' })
        return { kind: 'direct', profileName: profile.name, trace }
      }
      const { proxy, auth } = profileForScheme(profile, request.scheme)
      if (proxy !== undefined) return proxyDecision(profile, proxy, auth, request, trace)
      trace.push({ step: 'direct', profile: profile.name, code: 'no-proxy' })
      return { kind: 'direct', profileName: profile.name, trace }
    }
    case 'SwitchProfile':
    case 'VirtualProfile': {
      const rules = compileRules(profile)
      for (const rule of rules) {
        let matched = false
        try {
          matched = rule.matches(request)
        } catch {
          matched = false
        }
        if (!matched) continue
        trace.push({ step: 'rule', profile: profile.name, target: rule.profileName })
        return resolveProfile(profiles, rule.profileName, request, trace, depth + 1)
      }
      const fallback = typeof profile.defaultProfileName === 'string' ? profile.defaultProfileName : 'direct'
      trace.push({ step: 'default', profile: profile.name, target: fallback })
      return resolveProfile(profiles, fallback, request, trace, depth + 1)
    }
    case 'RuleListProfile': {
      const rules = compileRules(profile)
      for (const rule of rules) {
        let matched = false
        try {
          matched = rule.matches(request)
        } catch {
          matched = false
        }
        if (!matched) continue
        trace.push({ step: 'list-rule', profile: profile.name, target: rule.profileName })
        return resolveProfile(profiles, rule.profileName, request, trace, depth + 1)
      }
      const fallback = typeof profile.defaultProfileName === 'string' ? profile.defaultProfileName : 'direct'
      trace.push({ step: 'default', profile: profile.name, target: fallback })
      return resolveProfile(profiles, fallback, request, trace, depth + 1)
    }
    case 'PacProfile':
      trace.push({ step: 'unsupported', code: 'pac', profile: profile.name })
      return { kind: 'direct', profileName: profile.name, trace }
    default:
      trace.push({ step: 'unsupported', code: 'type', profile: profile.name, type: profile.profileType ?? 'unknown' })
      return { kind: 'direct', profileName: profile.name, trace }
  }
}

function hostMatches(host, entry) {
  const value = String(entry ?? '').toLowerCase().trim()
  if (value === '' || value === '*') return value === '*'
  return host === value || host.endsWith(`.${value}`)
}

/**
 * Build the immutable routing table for one configuration snapshot.
 * @param doc - Zero Omega options document plus the `-dshOmega` extension.
 * @param providers - discovered provider rows, each with `id` and `hosts`.
 * @returns the table used by the dispatcher and the UI.
 */
export function buildRoutingTable(doc, providers = []) {
  const profiles = new Map()
  for (const [key, value] of Object.entries(doc)) {
    if (!key.startsWith('+') || value === null || typeof value !== 'object') continue
    const name = key.slice(1)
    const profile = normalizeProfile({ name, ...value })
    profiles.set(name, profile)
  }

  const extension = doc['-dshOmega'] !== null && typeof doc['-dshOmega'] === 'object' ? doc['-dshOmega'] : {}
  const currentProfileName = typeof extension.currentProfileName === 'string'
    ? extension.currentProfileName
    : typeof doc['-startupProfileName'] === 'string' && doc['-startupProfileName'] !== ''
      ? doc['-startupProfileName']
      : guessCurrentProfile(profiles)

  const warnings = []
  if (!profiles.has(currentProfileName) && currentProfileName !== 'direct' && currentProfileName !== 'system') {
    warnings.push({ code: 'current.missing', params: { name: currentProfileName } })
  }
  for (const profile of profiles.values()) {
    warnings.push(...profileWarnings(profile))
  }

  const providerEntries = []
  const bindings = extension.providerBindings !== null && typeof extension.providerBindings === 'object'
    ? extension.providerBindings
    : {}
  const overrides = extension.providerHosts !== null && typeof extension.providerHosts === 'object'
    ? extension.providerHosts
    : {}
  for (const provider of providers) {
    const binding = bindings[provider.id]
    if (typeof binding !== 'string' || binding === '' || binding === 'auto') continue
    if (!profiles.has(binding) && binding !== 'direct' && binding !== 'system') {
      warnings.push({ code: 'provider.binding-missing', params: { provider: provider.name ?? provider.id, binding } })
      continue
    }
    const hosts = Array.isArray(overrides[provider.id]) && overrides[provider.id].length > 0
      ? overrides[provider.id]
      : provider.hosts
    for (const host of Array.isArray(hosts) ? hosts : []) {
      providerEntries.push({
        providerId: provider.id,
        providerName: provider.name ?? provider.id,
        binding,
        host: String(host).toLowerCase().trim(),
      })
    }
  }
  providerEntries.sort((left, right) => right.host.length - left.host.length)

  const resolutionCache = new Map()
  const table = {
    doc,
    profiles,
    currentProfileName,
    providerEntries,
    warnings: [...new Set(warnings)],
  }
  table.resolve = (url) => {
    const key = url.href
    const cached = resolutionCache.get(key)
    if (cached !== undefined) return cached
    const request = requestFromUrl(url)
    const trace = []
    let result
    if (isLoopbackHost(request.host)) {
      trace.push({ step: 'direct', profile: 'direct', code: 'loopback' })
      result = { kind: 'direct', profileName: 'direct', via: 'loopback', trace }
    } else {
      const provider = providerEntries.find(entry => hostMatches(request.host, entry.host))
      if (provider !== undefined) {
        trace.push({ step: 'provider', provider: provider.providerId, profile: provider.binding })
        result = {
          ...resolveProfile(profiles, provider.binding, request, trace, 0),
          via: 'provider',
          provider: provider.providerId,
        }
      } else {
        trace.push({ step: 'current', profile: currentProfileName })
        result = { ...resolveProfile(profiles, currentProfileName, request, trace, 0), via: 'current' }
      }
    }
    if (resolutionCache.size >= 256) resolutionCache.delete(resolutionCache.keys().next().value)
    resolutionCache.set(key, result)
    return result
  }
  return table
}

function guessCurrentProfile(profiles) {
  const names = [...profiles.keys()]
  const switchLike = names.find(name => {
    const profile = normalizeProfile(profiles.get(name))
    return profile.profileType === 'SwitchProfile'
  })
  return switchLike ?? 'direct'
}

function profileWarnings(profile) {
  const warnings = []
  const type = profile.profileType
  if (!ROUTABLE_TYPES.has(type) && type !== 'PacProfile') {
    warnings.push({ code: 'profile.unsupported-type', params: { name: profile.name, type: type ?? 'unknown' } })
  }
  if (type === 'PacProfile') {
    warnings.push({ code: 'profile.pac', params: { name: profile.name } })
  }
  if (type === 'FixedProfile') {
    for (const prop of ['proxyForHttp', 'proxyForHttps', 'fallbackProxy']) {
      const proxy = profile[prop]
      if (proxy === null || typeof proxy !== 'object') continue
      const scheme = String(proxy.scheme ?? '').toLowerCase()
      if (scheme !== 'http' && scheme !== 'https') {
        warnings.push({ code: 'profile.socks', params: { name: profile.name, prop, scheme: scheme || 'unknown' } })
      } else if (typeof proxy.host !== 'string' || proxy.host.trim() === ''
        || !Number.isInteger(Number(proxy.port)) || Number(proxy.port) <= 0 || Number(proxy.port) > 65535) {
        warnings.push({ code: 'profile.proxy-invalid', params: { name: profile.name, prop } })
      }
    }
  }
  if (type === 'SwitchProfile' || type === 'VirtualProfile') {
    if (!Array.isArray(profile.rules)) return warnings
    for (const [index, rule] of profile.rules.entries()) {
      if (rule === null || typeof rule !== 'object') continue
      const problem = conditionProblem(rule.condition)
      if (problem !== undefined) warnings.push({ code: 'profile.rule-invalid', params: { name: profile.name, index: index + 1, detail: problem } })
      if (typeof rule.profileName !== 'string' || rule.profileName === '') {
        warnings.push({ code: 'profile.rule-no-target', params: { name: profile.name, index: index + 1 } })
      }
    }
  }
  if (type === 'RuleListProfile') {
    const lines = countRuleLines(profile.ruleList)
    if (lines === 0) warnings.push({ code: 'profile.rule-list-empty', params: { name: profile.name } })
  }
  return warnings
}

/**
 * Summarise a document for the UI's header and import confirmation.
 * @param doc - options document.
 * @returns counts by profile kind.
 */
export function summariseDocument(doc) {
  let proxies = 0
  let switches = 0
  let ruleLists = 0
  let unsupported = 0
  let rules = 0
  for (const [key, value] of Object.entries(doc)) {
    if (!key.startsWith('+') || value === null || typeof value !== 'object') continue
    const profile = normalizeProfile(value)
    if (profile.profileType === 'FixedProfile') proxies += 1
    else if (profile.profileType === 'SwitchProfile' || profile.profileType === 'VirtualProfile') {
      switches += 1
      rules += Array.isArray(profile.rules) ? profile.rules.length : 0
    } else if (profile.profileType === 'RuleListProfile') {
      ruleLists += 1
      rules += countRuleLines(profile.ruleList)
    } else if (!ROUTABLE_TYPES.has(profile.profileType)) unsupported += 1
  }
  return { profiles: proxies + switches + ruleLists + unsupported, proxies, switches, ruleLists, rules, unsupported }
}
