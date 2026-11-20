import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  defaultDocument, exportDocument, importDocument, normalizeDocument, EXTENSION_KEY,
} from '../lib/config.js'
import { buildRoutingTable } from '../lib/profiles.js'

const fixtureText = readFileSync(new URL('./fixtures/omega-backup.json', import.meta.url), 'utf8')

test('the default document normalises and exposes the current profile', () => {
  const { doc, warnings } = normalizeDocument(defaultDocument())
  assert.equal(warnings.length, 0)
  assert.equal(doc[EXTENSION_KEY].currentProfileName, 'auto switch')
  assert.equal(doc['-startupProfileName'], 'auto switch')
  assert.equal(doc['+proxy'].profileType, 'FixedProfile')
})

test('a browser backup imports with its profiles and current profile', () => {
  const result = importDocument(fixtureText, defaultDocument(), 'replace')
  assert.equal(result.mode, 'replace')
  assert.equal(result.doc[EXTENSION_KEY].currentProfileName, 'auto switch')
  assert.equal(result.doc['+proxy'].fallbackProxy.port, 7890)
  assert.equal(result.summary.proxies, 2)
  assert.equal(result.summary.ruleLists, 1)
})

test('export keeps the Zero Omega flat shape and DSH extension', () => {
  const { doc } = importDocument(fixtureText, defaultDocument(), 'replace')
  const exported = exportDocument(doc)
  assert.equal(exported.schemaVersion, 2)
  assert.equal(exported['-startupProfileName'], 'auto switch')
  assert.equal(exported['+proxy'].name, 'proxy')
  assert.ok(exported[EXTENSION_KEY] !== undefined)
  assert.equal(exported['+direct'], undefined)
})

test('exported documents import again without loss', () => {
  const first = importDocument(fixtureText, defaultDocument(), 'replace')
  const second = importDocument(JSON.stringify(exportDocument(first.doc)), defaultDocument(), 'replace')
  assert.deepEqual(second.doc, first.doc)
})

test('merge keeps profiles the backup does not mention', () => {
  const base = normalizeDocument(defaultDocument()).doc
  base['+mine'] = {
    name: 'mine',
    profileType: 'FixedProfile',
    fallbackProxy: { scheme: 'http', host: '10.0.0.2', port: 3128 },
  }
  const merged = importDocument(fixtureText, base, 'merge')
  assert.ok(merged.doc['+mine'] !== undefined)
  assert.ok(merged.doc['+proxy'] !== undefined)
  assert.equal(merged.doc[EXTENSION_KEY].currentProfileName, 'auto switch')
})

test('the wrapped profiles/settings form is accepted', () => {
  const wrapped = {
    profiles: {
      proxy: { name: 'proxy', profileType: 'FixedProfile', fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 8080 } },
    },
    settings: { currentProfileName: 'proxy' },
  }
  const { doc } = normalizeDocument(wrapped)
  assert.equal(doc['+proxy'].fallbackProxy.port, 8080)
})

test('imported provider bindings survive an export', () => {
  const withBinding = JSON.parse(fixtureText)
  withBinding[EXTENSION_KEY].providerBindings = { 'github-copilot': 'proxy' }
  const { doc } = normalizeDocument(withBinding)
  assert.equal(doc[EXTENSION_KEY].providerBindings['github-copilot'], 'proxy')
  assert.equal(exportDocument(doc)[EXTENSION_KEY].providerBindings['github-copilot'], 'proxy')
})

test('a missing current profile falls back to an automatic profile', () => {
  const raw = JSON.parse(fixtureText)
  raw['-startupProfileName'] = 'gone'
  raw[EXTENSION_KEY].currentProfileName = 'gone'
  const { doc, warnings } = normalizeDocument(raw)
  assert.equal(doc[EXTENSION_KEY].currentProfileName, 'auto switch')
  assert.ok(warnings.some(warning => warning.code === 'current.missing'))
})

test('invalid JSON throws a typed failure', () => {
  assert.throws(() => normalizeDocument('{nope'), error => error.code === 'invalid-json')
})

test('rule-list subscription metadata survives import and export', () => {
  const raw = JSON.parse(fixtureText)
  raw['+list'].sourceUrl = 'https://example.com/rules.txt'
  raw['+list'].lastUpdate = '2026-01-01T00:00:00.000Z'
  raw['-downloadInterval'] = 1440
  const { doc } = normalizeDocument(raw)
  assert.equal(doc['+list'].sourceUrl, 'https://example.com/rules.txt')
  assert.equal(doc['+list'].lastUpdate, '2026-01-01T00:00:00.000Z')
  const exported = exportDocument(doc)
  assert.equal(exported['+list'].sourceUrl, 'https://example.com/rules.txt')
  assert.equal(exported['-downloadInterval'], 1440)
})

test('a normalised fixture routes github through its proxy', () => {
  const { doc } = normalizeDocument(fixtureText)
  const table = buildRoutingTable(doc, [])
  assert.equal(table.resolve(new URL('https://www.google.com/x')).kind, 'proxy')
})
