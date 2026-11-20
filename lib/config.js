/**
 * Configuration document for dsh-omega.
 *
 * The persisted document is exactly the object Zero Omega exports: a flat map
 * whose `+name` keys are profiles, `-name` keys are browser settings, and
 * `schemaVersion` is 2. DSH-only state lives in the `-dshOmega` settings key
 * (current profile, per-provider bindings, host overrides); a browser ignores
 * an unknown settings key, so the same document still imports there.
 *
 * @module dsh-omega/config
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { normalizeProfile, summariseDocument } from './profiles.js'

/** Extension key inside the options document. */
export const EXTENSION_KEY = '-dshOmega'

const PROFILE_COLORS = ['#99ccee', '#99dd99', '#eebb66', '#ee9999', '#99dddd', '#ccaaff', '#cccccc']

/**
 * Directory that holds this plugin's own state.
 * @returns the state directory path.
 */
export function stateDirectory() {
  const home = process.env.DSH_HOME ?? path.join(os.homedir(), '.dsh')
  return path.join(home, 'dsh-omega')
}

/** @returns the configuration file path. */
export function configPath() {
  return path.join(stateDirectory(), 'config.json')
}

/**
 * First-run document: a proxy profile pointing at the common local HTTP port,
 * an automatic switch that sends GitHub Copilot hosts through it, and every
 * other request direct.
 * @returns a fresh options document.
 */
export function defaultDocument() {
  return {
    schemaVersion: 2,
    '-startupProfileName': 'auto switch',
    '-enableQuickSwitch': false,
    '-confirmDeletion': true,
    '-downloadInterval': 1440,
    '+proxy': {
      name: 'proxy',
      profileType: 'FixedProfile',
      color: '#99ccee',
      fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 1080 },
      bypassList: [
        { conditionType: 'BypassCondition', pattern: 'localhost' },
        { conditionType: 'BypassCondition', pattern: '127.0.0.1' },
        { conditionType: 'BypassCondition', pattern: '[::1]' },
      ],
    },
    '+auto switch': {
      name: 'auto switch',
      profileType: 'SwitchProfile',
      color: '#99dd99',
      defaultProfileName: 'direct',
      rules: [
        { condition: { conditionType: 'HostWildcardCondition', pattern: '*.githubcopilot.com' }, profileName: 'proxy' },
        { condition: { conditionType: 'HostWildcardCondition', pattern: 'github.com' }, profileName: 'proxy' },
        { condition: { conditionType: 'HostWildcardCondition', pattern: 'api.github.com' }, profileName: 'proxy' },
        { condition: { conditionType: 'HostWildcardCondition', pattern: 'raw.githubusercontent.com' }, profileName: 'proxy' },
        { condition: { conditionType: 'HostWildcardCondition', pattern: 'gist.githubusercontent.com' }, profileName: 'proxy' },
      ],
    },
    [EXTENSION_KEY]: {
      version: 1,
      currentProfileName: 'auto switch',
      providerBindings: {
        'github-copilot': 'proxy',
        'deepseek-account': 'direct',
        'deepseek-official': 'direct',
        deepseek: 'direct',
      },
      providerHosts: {},
    },
  }
}

/**
 * Whether a key names a profile.
 * @param key - document key.
 * @returns true for `+name` keys.
 */
export function isProfileKey(key) {
  return key.startsWith('+') && key.length > 1
}

/**
 * Read the DSH extension with defaults filled in.
 * @param doc - options document.
 * @returns the extension object.
 */
export function extensionOf(doc) {
  const raw = doc?.[EXTENSION_KEY]
  const extension = raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  return {
    version: 1,
    currentProfileName: typeof extension.currentProfileName === 'string' ? extension.currentProfileName : '',
    providerBindings: plainObject(extension.providerBindings),
    providerHosts: plainObject(extension.providerHosts),
  }
}

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {}
}

/**
 * Guess the profile a browser backup was last using.
 * @param profiles - map of stored profiles.
 * @returns a profile name, defaulting to `direct`.
 */
export function guessCurrentProfile(profiles) {
  for (const name of ['auto switch', 'auto', 'Auto switch']) {
    if (profiles.has(name)) return name
  }
  for (const [name, profile] of profiles) {
    if (normalizeProfile(profile).profileType === 'SwitchProfile') return name
  }
  return 'direct'
}

function coerceWrapped(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return raw
  if (raw.profiles !== null && typeof raw.profiles === 'object' && !Array.isArray(raw.profiles)) {
    const flat = { schemaVersion: Number(raw.schemaVersion) || 2 }
    for (const [name, profile] of Object.entries(raw.profiles)) {
      if (profile !== null && typeof profile === 'object') flat[`+${name}`] = profile
    }
    const settings = raw.settings !== null && typeof raw.settings === 'object' ? raw.settings : {}
    for (const [key, value] of Object.entries(settings)) flat[key.startsWith('-') ? key : `-${key}`] = value
    if (typeof raw.currentProfileName === 'string') flat['-startupProfileName'] = raw.currentProfileName
    if (raw[EXTENSION_KEY] !== undefined) flat[EXTENSION_KEY] = raw[EXTENSION_KEY]
    return flat
  }
  return raw
}

/**
 * Validate and normalise a document without losing data it does not understand.
 * Unknown profile types and settings keys are preserved so a later export
 * keeps what a browser wrote.
 * @param input - flat options document or the `{profiles, settings}` wrapper.
 * @returns `{ doc, warnings }`.
 */
export function normalizeDocument(input) {
  const warnings = []
  let raw
  try {
    raw = typeof input === 'string' ? JSON.parse(input) : structuredClone(input)
  } catch (error) {
    const failure = new Error(`不是有效的 JSON：${error.message}`)
    failure.code = 'invalid-json'
    failure.status = 400
    throw failure
  }
  raw = coerceWrapped(raw)
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    const failure = new Error('配置必须是 JSON 对象')
    failure.code = 'invalid-document'
    failure.status = 400
    throw failure
  }

  const doc = {}
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith('+') && key.length > 1) {
      const name = key.slice(1)
      if (name === 'direct' || name === 'system') {
        warnings.push({ code: 'profile.builtin-dropped', params: { name } })
        continue
      }
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        warnings.push({ code: 'profile.invalid', params: { name } })
        continue
      }
      const profile = normalizeProfile({ ...value, name })
      if (typeof profile.profileType !== 'string' || profile.profileType === '') {
        profile.profileType = 'FixedProfile'
        warnings.push({ code: 'profile.type-defaulted', params: { name } })
      }
      if (typeof profile.color !== 'string' || profile.color === '') {
        profile.color = PROFILE_COLORS[Object.keys(doc).length % PROFILE_COLORS.length]
      }
      if (profile.profileType === 'FixedProfile' && profile.fallbackProxy === undefined) {
        if (profile.proxyForHttp !== undefined || profile.proxyForHttps !== undefined) {
          profile.fallbackProxy = profile.proxyForHttps ?? profile.proxyForHttp
        } else {
          profile.fallbackProxy = { scheme: 'http', host: '127.0.0.1', port: 1080 }
          warnings.push({ code: 'profile.proxy-defaulted', params: { name } })
        }
      }
      doc[key] = profile
    } else if (key.startsWith('-') && key.length > 1) {
      doc[key] = value
    } else if (key === 'schemaVersion') {
      doc.schemaVersion = 2
    }
  }
  doc.schemaVersion = 2

  const profiles = new Map()
  for (const [key, value] of Object.entries(doc)) {
    if (isProfileKey(key)) profiles.set(key.slice(1), value)
  }

  const extension = extensionOf(doc)
  let current = extension.currentProfileName
  if (typeof doc['-startupProfileName'] === 'string' && doc['-startupProfileName'] !== '') {
    if (current === '') current = doc['-startupProfileName']
  }
  if (current === '' || current === undefined) current = guessCurrentProfile(profiles)
  if (current !== 'direct' && current !== 'system' && !profiles.has(current)) {
    warnings.push({ code: 'current.missing', params: { name: current } })
    current = guessCurrentProfile(profiles)
  }

  const providerBindings = {}
  for (const [provider, binding] of Object.entries(extension.providerBindings)) {
    if (typeof binding !== 'string') continue
    if (binding === '' || binding === 'auto' || binding === 'direct' || binding === 'system' || profiles.has(binding)) {
      providerBindings[provider] = binding
    } else {
      warnings.push({ code: 'provider.binding-missing', params: { provider, binding } })
    }
  }
  const providerHosts = {}
  for (const [provider, hosts] of Object.entries(extension.providerHosts)) {
    if (!Array.isArray(hosts)) continue
    const clean = hosts
      .filter(host => typeof host === 'string' && host.trim() !== '')
      .map(host => host.trim().toLowerCase())
    if (clean.length > 0) providerHosts[provider] = [...new Set(clean)]
  }

  doc[EXTENSION_KEY] = {
    version: 1,
    currentProfileName: current,
    providerBindings,
    providerHosts,
  }
  doc['-startupProfileName'] = current
  return { doc, warnings }
}

/**
 * Import a Zero Omega backup.
 * @param text - backup JSON.
 * @param current - document to merge into, for `mode: 'merge'`.
 * @param mode - `replace` or `merge`.
 * @returns `{ doc, warnings, summary, source }`.
 */
export function importDocument(text, current, mode = 'replace') {
  const incoming = normalizeDocument(text)
  const sourceSummary = summariseDocument(incoming.doc)
  if (mode !== 'merge') {
    return { doc: incoming.doc, warnings: incoming.warnings, summary: sourceSummary, mode: 'replace' }
  }

  const base = normalizeDocument(current).doc
  const merged = { ...base }
  for (const [key, value] of Object.entries(incoming.doc)) {
    if (key === EXTENSION_KEY || key === 'schemaVersion' || key === '-startupProfileName') continue
    if (key.startsWith('+') || key.startsWith('-')) merged[key] = value
  }
  const baseExtension = extensionOf(base)
  const incomingExtension = extensionOf(incoming.doc)
  merged[EXTENSION_KEY] = {
    version: 1,
    currentProfileName: baseExtension.currentProfileName,
    providerBindings: { ...baseExtension.providerBindings, ...incomingExtension.providerBindings },
    providerHosts: { ...baseExtension.providerHosts, ...incomingExtension.providerHosts },
  }
  const normalized = normalizeDocument(merged)
  return {
    doc: normalized.doc,
    warnings: [...incoming.warnings, ...normalized.warnings],
    summary: sourceSummary,
    mode: 'merge',
  }
}

/**
 * Render a document as a Zero Omega backup object.
 * Builtin profiles are implicit there, so they are never written.
 * @param doc - normalised options document.
 * @returns a plain options object ready for `JSON.stringify`.
 */
export function exportDocument(doc) {
  const normalized = normalizeDocument(doc).doc
  const output = {}
  output.schemaVersion = 2
  output['-startupProfileName'] = extensionOf(normalized).currentProfileName
  for (const [key, value] of Object.entries(normalized)) {
    if (key === 'schemaVersion' || key === '-startupProfileName') continue
    if (key === '+direct' || key === '+system') continue
    output[key] = value
  }
  return output
}

/**
 * File-backed document store with atomic writes.
 */
export class ConfigStore {
  /**
   * @param ctx - plugin context, used for diagnostics only.
   */
  constructor(ctx) {
    this.ctx = ctx
    this.file = configPath()
    this.warnings = []
    this.doc = this.read()
  }

  /** @returns the normalized document, loading defaults when the file is absent. */
  read() {
    try {
      const text = fs.readFileSync(this.file, 'utf8')
      const { doc, warnings } = normalizeDocument(text)
      this.warnings = [...warnings]
      for (const warning of warnings) this.warn(warning)
      return doc
    } catch (error) {
      if (error.code !== 'ENOENT') {
        const warning = { code: 'config.unreadable', params: { message: error.message } }
        this.warnings = [warning]
        this.warn(warning)
      }
      return normalizeDocument(defaultDocument()).doc
    }
  }

  /**
   * Replace the document and persist it.
   * @param input - candidate document.
   * @returns `{ doc, warnings }`.
   */
  save(input) {
    const { doc, warnings } = normalizeDocument(input)
    this.warnings = [...warnings]
    fs.mkdirSync(path.dirname(this.file), { recursive: true, mode: 0o700 })
    const temp = `${this.file}.${process.pid}.tmp`
    fs.writeFileSync(temp, `${JSON.stringify(doc, null, 2)}\n`, { mode: 0o600 })
    fs.renameSync(temp, this.file)
    this.doc = doc
    return { doc, warnings }
  }

  warn(warning) {
    this.ctx?.logger?.warn?.('dsh-omega: %s %o', warning.code, warning.params ?? {})
  }
}
