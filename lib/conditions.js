/**
 * Zero Omega condition matching, reduced to the request facts DSH has.
 *
 * A condition is the serialized object Zero Omega stores:
 * `{ conditionType, pattern }` for host/URL/keyword conditions,
 * `{ conditionType: 'IpCondition', ip, prefixLength }` for CIDR rules.
 * The matcher takes a `{ url, host, scheme, port }` request, where `url` is
 * the full serialized URL and `host` a lower-cased hostname.
 *
 * @module dsh-omega/conditions
 */
import net from 'node:net'

const REGEX_META = new Set('\\^$.|?*+(){}/'.split(''))

/** Cache of compiled regexes keyed by their source pattern. */
const regexCache = new Map()
/** Cache of parsed bypass/IP matchers keyed by their pattern. */
const bypassCache = new Map()

/**
 * Convert a shell wildcard to a regular-expression source.
 * Mirrors SwitchyOmega's `shExp2RegExp`, including its unanchored sides when a
 * leading or trailing `*` was trimmed.
 * @param pattern - wildcard pattern.
 * @param options - `trimAsterisk` drops edge `*` and the matching anchor.
 * @returns the regex source, or an empty string for a bare `*`.
 */
export function shExp2RegExp(pattern, { trimAsterisk = false } = {}) {
  let start = 0
  let end = pattern.length
  if (trimAsterisk) {
    while (start < end && pattern[start] === '*') start += 1
    while (start < end && pattern[end - 1] === '*') end -= 1
    if (end - start === 1 && pattern[start] === '*') return ''
  }
  let regex = ''
  if (start === 0) regex += '^'
  for (let index = start; index < end; index += 1) {
    const char = pattern[index]
    if (char === '*') regex += '.*'
    else if (char === '?') regex += '.'
    else {
      if (REGEX_META.has(char)) regex += '\\'
      regex += char
    }
  }
  if (end === pattern.length) regex += '$'
  return regex
}

function compile(source, flags = 'i') {
  const key = `${flags}\u0000${source}`
  const hit = regexCache.get(key)
  if (hit !== undefined) return hit
  let value
  try {
    value = new RegExp(source, flags)
  } catch {
    value = null
  }
  regexCache.set(key, value)
  return value
}

/**
 * Build the matcher for a Zero Omega host-wildcard condition.
 * A `|` separates alternatives; `*.example.com` covers the domain and its
 * subdomains, `**.example.com` is treated the same way, and a leading dot is
 * shorthand for `*.`.
 * @param pattern - wildcard host pattern.
 * @returns a host predicate, or `undefined` when the pattern is empty.
 */
export function hostWildcardMatcher(pattern) {
  const parts = String(pattern ?? '')
    .split('|')
    .map(part => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith('.')) part = `*${part}`
      if (part.startsWith('**.')) return `(?:^|\\.)${escapeLiteral(part.slice(3))}$`
      if (part.startsWith('*.')) return `(?:^|\\.)${escapeLiteral(part.slice(2))}$`
      return shExp2RegExp(part, { trimAsterisk: true })
    })
    .filter(Boolean)
  if (parts.length === 0) return undefined
  const regex = compile(parts.join('|'))
  if (regex === null) return undefined
  return (host) => regex.test(host)
}

function escapeLiteral(text) {
  let result = ''
  for (const char of text) {
    if (REGEX_META.has(char)) result += '\\'
    result += char
  }
  return result
}

/**
 * Normalise a regular-expression pattern as Zero Omega stores it.
 * Surrounding slashes are accepted and removed, as users often paste `/foo/`.
 * @param pattern - raw expression.
 * @returns the compiled regex, or `undefined` when invalid.
 */
export function hostRegexMatcher(pattern) {
  let source = String(pattern ?? '').trim()
  if (source.length > 1 && source.startsWith('/') && source.endsWith('/')) {
    source = source.slice(1, -1)
  }
  if (source.length === 0) return undefined
  const regex = compile(source)
  if (regex === null) return undefined
  return (host) => regex.test(host)
}

/**
 * Build a URL wildcard matcher (`*` and `?` over the whole URL).
 * @param pattern - wildcard URL pattern, `|` separated.
 * @returns a URL predicate.
 */
export function urlWildcardMatcher(pattern) {
  const parts = String(pattern ?? '')
    .split('|')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => shExp2RegExp(part, { trimAsterisk: true }))
    .filter(Boolean)
  if (parts.length === 0) return undefined
  const regex = compile(parts.join('|'))
  if (regex === null) return undefined
  return (url) => regex.test(url)
}

/** Build a URL regular-expression matcher. */
export function urlRegexMatcher(pattern) {
  let source = String(pattern ?? '').trim()
  if (source.length > 1 && source.startsWith('/') && source.endsWith('/')) {
    source = source.slice(1, -1)
  }
  if (source.length === 0) return undefined
  const regex = compile(source)
  if (regex === null) return undefined
  return (url) => regex.test(url)
}

/**
 * IP/CIDR matcher for literal addresses.
 * Hostnames are never resolved: a rule for `1.2.3.0/24` must not trigger DNS
 * traffic for every request, so a name simply does not match.
 * @param ip - address or bracketed IPv6.
 * @param prefixLength - CIDR prefix.
 * @returns a host predicate.
 */
export function ipMatcher(ip, prefixLength) {
  let address = String(ip ?? '').trim()
  if (address.startsWith('[') && address.endsWith(']')) address = address.slice(1, -1)
  const family = net.isIP(address)
  if (family === 0) return undefined
  const prefix = Number.isInteger(Number(prefixLength)) ? Number(prefixLength) : (family === 4 ? 32 : 128)
  if (prefix < 0 || prefix > (family === 4 ? 32 : 128)) return undefined
  const list = new net.BlockList()
  try {
    if (prefix === 0) return (host) => net.isIP(stripBrackets(host)) === family
    list.addSubnet(address, prefix, family === 4 ? 'ipv4' : 'ipv6')
  } catch {
    return undefined
  }
  return (host) => {
    const candidate = stripBrackets(host)
    if (net.isIP(candidate) !== family) return false
    return list.check(candidate, family === 4 ? 'ipv4' : 'ipv6')
  }
}

function stripBrackets(host) {
  return host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host
}

function isPrivateIPv4(address) {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return false
  return parts[0] === 10
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
    || parts[0] === 127
    || (parts[0] === 169 && parts[1] === 254)
}

function isLoopbackOrLocal(host) {
  const bare = stripBrackets(host).toLowerCase()
  if (bare === 'localhost' || bare === '::1') return true
  if (bare.endsWith('.localhost') || bare.endsWith('.local')) return true
  if (net.isIP(bare) === 4) return isPrivateIPv4(bare)
  return false
}

/**
 * Parse one Chrome bypass-list entry (`BypassCondition.pattern`).
 * Supports `<local>`, optional scheme prefixes, host:port, wildcards and CIDR.
 * @param pattern - raw bypass pattern.
 * @returns a request predicate.
 */
export function bypassMatcher(pattern) {
  const raw = String(pattern ?? '').trim()
  const cached = bypassCache.get(raw)
  if (cached !== undefined) return cached
  const matcher = buildBypassMatcher(raw)
  bypassCache.set(raw, matcher)
  return matcher
}

function buildBypassMatcher(raw) {
  if (raw === '') return undefined
  if (raw === '<local>') {
    return (request) => !request.host.includes('.') || isLoopbackOrLocal(request.host)
  }

  let text = raw
  let scheme
  const schemeMatch = text.match(/^([a-z][a-z0-9+.-]*):\/\//i)
  if (schemeMatch) {
    scheme = schemeMatch[1].toLowerCase()
    text = text.slice(schemeMatch[0].length)
  }

  let port
  const cidr = text.match(/^(.+)\/(\d{1,3})$/)
  if (cidr && net.isIP(stripBrackets(cidr[1]))) {
    const match = ipMatcher(cidr[1], Number(cidr[2]))
    if (match === undefined) return undefined
    return (request) => (scheme === undefined || request.scheme === scheme) && match(request.host)
  }

  const bracket = text.match(/^\[([^\]]+)\](?::(\d+))?$/)
  if (bracket) {
    port = bracket[2] === undefined ? undefined : Number(bracket[2])
    text = `[${bracket[1]}]`
  } else {
    const lastColon = text.lastIndexOf(':')
    if (lastColon > 0 && /^\d+$/.test(text.slice(lastColon + 1))) {
      port = Number(text.slice(lastColon + 1))
      text = text.slice(0, lastColon)
    }
  }

  if (net.isIP(stripBrackets(text))) {
    return (request) => (scheme === undefined || request.scheme === scheme)
      && (port === undefined || request.port === port)
      && stripBrackets(request.host) === stripBrackets(text)
  }

  const hostMatch = hostWildcardMatcher(text.startsWith('.') ? `*${text}` : text)
  if (hostMatch === undefined) return undefined
  return (request) => (scheme === undefined || request.scheme === scheme)
    && (port === undefined || request.port === port)
    && hostMatch(request.host)
}

/**
 * Whether one serialized condition matches a request.
 * @param condition - Zero Omega condition object.
 * @param request - `{ url, host, scheme, port }`.
 * @returns whether the condition matches.
 */
export function matchCondition(condition, request) {
  const type = condition?.conditionType
  switch (type) {
    case 'TrueCondition':
      return true
    case 'FalseCondition':
      return false
    case 'HostWildcardCondition':
      return hostWildcardMatcher(condition.pattern)?.(request.host) === true
    case 'HostRegexCondition':
      return hostRegexMatcher(condition.pattern)?.(request.host) === true
    case 'UrlWildcardCondition':
      return urlWildcardMatcher(condition.pattern)?.(request.url) === true
    case 'UrlRegexCondition':
      return urlRegexMatcher(condition.pattern)?.(request.url) === true
    case 'KeywordCondition':
      // Zero Omega only applies keyword rules to plain HTTP URLs.
      return request.scheme === 'http' && String(condition.pattern ?? '') !== ''
        && request.url.includes(String(condition.pattern))
    case 'IpCondition':
      return ipMatcher(condition.ip, condition.prefixLength)?.(request.host) === true
    case 'BypassCondition':
      return bypassMatcher(condition.pattern)?.(request) === true
    default:
      return false
  }
}

/**
 * Whether a serialized condition can be compiled at all.
 * @param condition - Zero Omega condition object.
 * @returns a problem description, or `undefined` when usable.
 */
export function conditionProblem(condition) {
  const type = condition?.conditionType
  if (typeof type !== 'string') return '缺少 conditionType'
  if (['TrueCondition', 'FalseCondition'].includes(type)) return undefined
  if (type === 'IpCondition') {
    return ipMatcher(condition.ip, condition.prefixLength) === undefined ? '无效的 IP/CIDR' : undefined
  }
  if (type === 'BypassCondition') {
    return bypassMatcher(condition.pattern) === undefined ? '无效的绕过规则' : undefined
  }
  if (type === 'HostRegexCondition') {
    return hostRegexMatcher(condition.pattern) === undefined ? '无效的正则表达式' : undefined
  }
  if (type === 'UrlRegexCondition') {
    return urlRegexMatcher(condition.pattern) === undefined ? '无效的正则表达式' : undefined
  }
  if (['HostWildcardCondition', 'UrlWildcardCondition', 'KeywordCondition'].includes(type)) {
    if (String(condition.pattern ?? '').length === 0 && type !== 'KeywordCondition') return '条件为空'
    return undefined
  }
  return `不支持的条件类型 ${type}`
}

export const CONDITION_TYPES = [
  'HostWildcardCondition',
  'HostRegexCondition',
  'UrlWildcardCondition',
  'UrlRegexCondition',
  'KeywordCondition',
  'IpCondition',
  'TrueCondition',
  'FalseCondition',
]
