import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildRoutingTable, summariseDocument } from '../lib/profiles.js'
import { defaultDocument, normalizeDocument } from '../lib/config.js'

const fixture = JSON.parse(readFileSync(new URL('./fixtures/omega-backup.json', import.meta.url), 'utf8'))
const { doc } = normalizeDocument(fixture)

function tableFor(providers = [], changes = {}) {
  return buildRoutingTable({ ...doc, ...changes }, providers)
}

const resolve = (table, url) => table.resolve(new URL(url))

test('the default document sends GitHub Copilot hosts through the proxy', () => {
  const table = buildRoutingTable(normalizeDocument(defaultDocument()).doc, [])
  assert.equal(resolve(table, 'https://api.individual.githubcopilot.com/v1').kind, 'proxy')
  assert.equal(resolve(table, 'https://github.com/login/device').kind, 'proxy')
  assert.equal(resolve(table, 'https://api.github.com/copilot_internal/v2/token').kind, 'proxy')
  assert.equal(resolve(table, 'https://api.deepseek.com/chat').kind, 'direct')
  assert.equal(resolve(table, 'http://127.0.0.1:58993/').kind, 'direct')
})

test('switch rules pick the target profile and default to direct', () => {
  const table = tableFor()
  const google = resolve(table, 'https://www.google.com/search')
  assert.equal(google.kind, 'proxy')
  assert.equal(google.proxy.uri, 'http://127.0.0.1:7890')
  assert.equal(resolve(table, 'https://example.com/').kind, 'direct')
})

test('a fixed profile bypass list wins before its proxy', () => {
  const table = tableFor()
  assert.equal(resolve(table, 'https://intranet.example/').kind, 'direct')
  assert.equal(resolve(table, 'https://foo.intranet.example/').kind, 'direct')
})

test('SOCKS profiles are reported and routed direct', () => {
  const table = tableFor()
  const decision = resolve(table, 'https://a.socks.test/')
  assert.equal(decision.kind, 'direct')
  assert.ok(table.warnings.some(warning => warning.code === 'profile.socks'))
})

test('rule-list profiles evaluate AutoProxy rules with exceptions first', () => {
  const table = buildRoutingTable({ ...doc, '-dshOmega': { currentProfileName: 'list' } }, [])
  assert.equal(resolve(table, 'https://github.com/x').kind, 'proxy')
  assert.equal(resolve(table, 'https://direct.example.com/x').kind, 'direct')
  assert.equal(resolve(table, 'https://other.example.org/x').kind, 'proxy')
})

test('provider bindings take precedence over the current profile', () => {
  const providers = [{ id: 'deepseek-account', name: 'DeepSeek', hosts: ['api.deepseek.com'] }]
  const table = tableFor(providers, {
    '-dshOmega': {
      version: 1,
      currentProfileName: 'auto switch',
      providerBindings: { 'deepseek-account': 'proxy' },
      providerHosts: {},
    },
  })
  const decision = resolve(table, 'https://api.deepseek.com/chat')
  assert.equal(decision.kind, 'proxy')
  assert.equal(decision.via, 'provider')
  assert.equal(decision.provider, 'deepseek-account')
})

test('provider host overrides replace discovered hosts', () => {
  const providers = [{ id: 'custom', name: 'Custom', hosts: ['ignored.example'] }]
  const table = tableFor(providers, {
    '-dshOmega': {
      currentProfileName: 'auto switch',
      providerBindings: { custom: 'proxy' },
      providerHosts: { custom: ['gateway.example'] },
    },
  })
  assert.equal(resolve(table, 'https://gateway.example/v1').kind, 'proxy')
  assert.equal(resolve(table, 'https://ignored.example/v1').kind, 'direct')
})

test('profile reference cycles stop at direct', () => {
  const table = tableFor()
  const decision = resolve(table, 'https://x.loopa.test/')
  assert.equal(decision.kind, 'direct')
  assert.ok(decision.trace.some(step => step.code === 'cycle'))
})

test('summaries count profiles, rules and unsupported entries', () => {
  const summary = summariseDocument(doc)
  assert.equal(summary.proxies, 2)
  assert.equal(summary.switches, 3)
  assert.equal(summary.ruleLists, 1)
  assert.ok(summary.rules >= 4)
})
