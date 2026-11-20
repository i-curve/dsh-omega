/**
 * Parse the rule-list text a Zero Omega `RuleListProfile` stores.
 *
 * DSH cannot subscribe to a browser's proxy API, so a rule list is evaluated
 * locally. The two shipped formats are supported:
 * - `AutoProxy`, the GFWList format (`||host`, `|url`, `/regex/`, `@@` exceptions).
 * - `Switchy`, both the legacy `#BEGIN/#END` sections and the Omega
 *   `[SwitchyOmega Conditions]` format with explicit condition types.
 *
 * @module dsh-omega/rule-list
 */

/**
 * @typedef {object} ParsedRule
 * @property {object} condition Zero Omega condition object.
 * @property {string} profileName Target profile name.
 * @property {string} [source] Original line, for diagnostics.
 */

/**
 * Parse a rule list.
 * @param {string} text - rule-list body.
 * @param {string} matchProfileName - profile for normal rules.
 * @param {string} defaultProfileName - profile for `@@`/`!` exceptions.
 * @param {string} [format] - `AutoProxy` or `Switchy`; detected from the text when absent.
 * @returns {ParsedRule[]} rules in evaluation order.
 */
export function parseRuleList(text, matchProfileName, defaultProfileName, format) {
  const body = String(text ?? '')
  if (body.length === 0) return []
  const chosen = format ?? (looksAutoProxy(body) ? 'AutoProxy' : 'Switchy')
  if (chosen === 'AutoProxy') return parseAutoProxy(body, matchProfileName, defaultProfileName)
  return parseSwitchy(body, matchProfileName, defaultProfileName)
}

function looksAutoProxy(text) {
  const head = text.trimStart()
  return head.startsWith('[AutoProxy') || head.startsWith('W0F1dG9Qcm94')
}

function parseAutoProxy(raw, matchProfileName, defaultProfileName) {
  let text = raw
  if (text.startsWith('W0F1dG9Qcm94')) {
    try {
      text = Buffer.from(text, 'base64').toString('utf8')
    } catch {
      return []
    }
  }
  const normal = []
  const exclusive = []
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line.length === 0 || line[0] === '!' || line[0] === '[') continue
    let body = line
    let profile = matchProfileName
    let list = normal
    if (body.startsWith('@@')) {
      profile = defaultProfileName
      list = exclusive
      body = body.slice(2)
    }
    let condition
    if (body.startsWith('/') && body.endsWith('/')) {
      condition = { conditionType: 'UrlRegexCondition', pattern: body.slice(1, -1) }
    } else if (body.startsWith('||')) {
      condition = { conditionType: 'HostWildcardCondition', pattern: `*.${body.slice(2)}` }
    } else if (body.startsWith('|')) {
      condition = { conditionType: 'UrlWildcardCondition', pattern: `${body.slice(1)}*` }
    } else if (!body.includes('*')) {
      condition = { conditionType: 'KeywordCondition', pattern: body }
    } else {
      condition = { conditionType: 'UrlWildcardCondition', pattern: `http://*${body}*` }
    }
    list.push({ condition, profileName: profile, source: line })
  }
  return exclusive.concat(normal)
}

const TYPE_ALIASES = new Map(Object.entries({
  '': 'HostWildcardCondition',
  H: 'HostWildcardCondition',
  HW: 'HostWildcardCondition',
  HOST: 'HostWildcardCondition',
  W: 'HostWildcardCondition',
  WILD: 'HostWildcardCondition',
  WILDCARD: 'HostWildcardCondition',
  HOSTWILDCARD: 'HostWildcardCondition',
  R: 'HostRegexCondition',
  HR: 'HostRegexCondition',
  REGEX: 'HostRegexCondition',
  HOSTREGEX: 'HostRegexCondition',
  U: 'UrlWildcardCondition',
  UW: 'UrlWildcardCondition',
  URL: 'UrlWildcardCondition',
  URLWILDCARD: 'UrlWildcardCondition',
  UR: 'UrlRegexCondition',
  URLREGEX: 'UrlRegexCondition',
  K: 'KeywordCondition',
  KEYWORD: 'KeywordCondition',
  IP: 'IpCondition',
  TRUE: 'TrueCondition',
  FALSE: 'FalseCondition',
  DISABLED: 'FalseCondition',
  B: 'BypassCondition',
  BYPASS: 'BypassCondition',
}).map(([key, value]) => [key.toUpperCase(), value]))

/**
 * Parse one SwitchyOmega condition line into a condition object.
 * @param line - line without comments or result suffixes.
 * @returns the condition, or `undefined` for an empty line.
 */
export function conditionFromLine(line) {
  const text = String(line ?? '').trim()
  if (text.length === 0) return undefined
  let type = ''
  let body = text
  const colon = text.indexOf(':')
  if (colon > 0 && text[colon - 1] !== '/') {
    const candidate = text.slice(0, colon).trim().toUpperCase()
    if (TYPE_ALIASES.has(candidate)) {
      type = TYPE_ALIASES.get(candidate)
      body = text.slice(colon + 1).trim()
    }
  } else if (TYPE_ALIASES.has(candidateOrEmpty(text))) {
    type = TYPE_ALIASES.get(candidateOrEmpty(text))
    body = ''
  }
  if (type === 'TrueCondition' || type === 'FalseCondition') {
    return { conditionType: type }
  }
  if (type === 'IpCondition') {
    const match = body.match(/^(\[[^\]]+\]|[^/\s]+)\s*(?:\/\s*(\d+))?$/)
    if (match === null) return undefined
    return { conditionType: type, ip: match[1], prefixLength: Number(match[2] ?? (match[1].includes(':') ? 128 : 32)) }
  }
  if (type === '') {
    // A bare line is a host wildcard, matching Zero Omega's own default.
    return { conditionType: 'HostWildcardCondition', pattern: text }
  }
  return { conditionType: type, pattern: body }
}

function candidateOrEmpty(text) {
  const colon = text.indexOf(':')
  return (colon < 0 ? text : text.slice(0, colon)).trim().toUpperCase()
}

function parseSwitchy(text, matchProfileName, defaultProfileName) {
  if (text.trimStart().startsWith('[SwitchyOmega Conditions')) {
    return parseOmega(text, matchProfileName, defaultProfileName)
  }
  return parseLegacy(text, matchProfileName, defaultProfileName)
}

function parseOmega(text, matchProfileName, defaultProfileName) {
  const rules = []
  let withResult = false
  let defaultResult = defaultProfileName
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line.length === 0 || line[0] === '[' || line[0] === ';') continue
    if (line.startsWith('@with')) {
      withResult = /result/i.test(line)
      continue
    }
    if (line.startsWith('@note')) continue
    let body = line
    let profile = matchProfileName
    let exclusive = false
    if (body[0] === '!') {
      profile = defaultProfileName
      exclusive = true
      body = body.slice(1).trim()
    }
    if (body.startsWith('* +')) {
      defaultResult = body.slice(3).trim()
      continue
    }
    let explicit = false
    if (withResult) {
      const split = body.lastIndexOf(' +')
      if (split >= 0) {
        profile = body.slice(split + 2).trim()
        body = body.slice(0, split).trim()
        explicit = true
      }
    }
    if (body.startsWith(': ')) body = body.slice(2).trim()
    const condition = conditionFromLine(body)
    if (condition !== undefined) rules.push({ condition, profileName: profile, source: line, explicit, exclusive })
  }
  return rules.map(({ explicit, exclusive, ...rule }) => ({
    ...rule,
    profileName: explicit ? rule.profileName : (exclusive ? defaultProfileName : defaultResult),
  }))
}

function parseLegacy(text, matchProfileName, defaultProfileName) {
  const normal = []
  const exclusive = []
  let begin = false
  let section = 'WILDCARD'
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line.length === 0 || line[0] === ';') continue
    if (!begin) {
      if (line.toUpperCase() === '#BEGIN') begin = true
      continue
    }
    if (line.toUpperCase() === '#END') break
    if (line.startsWith('[') && line.endsWith(']')) {
      section = line.slice(1, -1).toUpperCase()
      continue
    }
    let body = line
    let profile = matchProfileName
    let list = normal
    if (body[0] === '!') {
      profile = defaultProfileName
      list = exclusive
      body = body.slice(1).trim()
    }
    let condition
    if (section === 'REGEXP') {
      condition = { conditionType: 'UrlRegexCondition', pattern: body }
    } else {
      let pattern = body
      if (!pattern.startsWith('*') && !pattern.includes('://')) pattern = `*${pattern}`
      if (!pattern.endsWith('*')) pattern = `${pattern}*`
      const hostOnly = pattern.match(/^\*:\/\/([A-Za-z0-9?*._\-]+)\/\*$/)
      condition = hostOnly === null
        ? { conditionType: 'UrlWildcardCondition', pattern }
        : { conditionType: 'HostWildcardCondition', pattern: hostOnly[1] }
    }
    list.push({ condition, profileName: profile, source: line })
  }
  return exclusive.concat(normal)
}

/**
 * Count the rule lines a rule-list body declares, without compiling them.
 * @param text - rule-list body.
 * @returns a rough line count for UI summaries.
 */
export function countRuleLines(text) {
  return String(text ?? '').split(/\r?\n/).filter((line) => {
    const trimmed = line.trim()
    return trimmed.length > 0 && trimmed[0] !== ';' && trimmed[0] !== '!' && trimmed[0] !== '[' && !trimmed.startsWith('@note')
  }).length
}
