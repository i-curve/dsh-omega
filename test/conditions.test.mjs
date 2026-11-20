import test from 'node:test'
import assert from 'node:assert/strict'
import {
  bypassMatcher, conditionProblem, hostRegexMatcher, hostWildcardMatcher, ipMatcher,
  matchCondition, shExp2RegExp, urlWildcardMatcher,
} from '../lib/conditions.js'

const request = (url) => {
  const parsed = new URL(url)
  return {
    url: parsed.href,
    host: parsed.hostname.toLowerCase(),
    scheme: parsed.protocol.slice(0, -1),
    port: Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80)),
  }
}

test('shExp2RegExp trims edge asterisks without anchoring that side', () => {
  assert.equal(shExp2RegExp('*.example.com'), '^.*\\.example\\.com$')
  assert.equal(shExp2RegExp('*.example.com', { trimAsterisk: true }), '\\.example\\.com$')
  assert.equal(shExp2RegExp('*', { trimAsterisk: true }), '$')
})

test('host wildcard rules follow Zero Omega semantics', () => {
  const match = hostWildcardMatcher('*.example.com')
  assert.equal(match('example.com'), true)
  assert.equal(match('api.example.com'), true)
  assert.equal(match('badexample.com'), false)
  assert.equal(hostWildcardMatcher('github.com')('api.github.com'), false)
  assert.equal(hostWildcardMatcher('github.com|*.githubcopilot.com')('api.individual.githubcopilot.com'), true)
  assert.equal(hostWildcardMatcher('**.corp.example')('corp.example'), true)
  assert.equal(hostWildcardMatcher('**.corp.example')('x.corp.example'), true)
})

test('host regex accepts slashes and rejects invalid expressions', () => {
  assert.equal(hostRegexMatcher('/^api\\./')('api.github.com'), true)
  assert.equal(hostRegexMatcher('('), undefined)
})

test('URL wildcard matches the whole serialized URL', () => {
  const match = urlWildcardMatcher('https://*.example.com/*')
  assert.equal(match('https://a.example.com/x'), true)
  assert.equal(match('http://a.example.com/x'), false)
})

test('keyword conditions only apply to plain HTTP, as in Zero Omega', () => {
  assert.equal(matchCondition({ conditionType: 'KeywordCondition', pattern: 'token' }, request('http://x.test/token')), true)
  assert.equal(matchCondition({ conditionType: 'KeywordCondition', pattern: 'token' }, request('https://x.test/token')), false)
})

test('IP conditions match literals and never resolve names', () => {
  assert.equal(ipMatcher('10.0.0.0', 8)('10.1.2.3'), true)
  assert.equal(ipMatcher('10.0.0.0', 8)('11.1.2.3'), false)
  assert.equal(ipMatcher('10.0.0.0', 8)('example.com'), false)
  assert.equal(ipMatcher('::1', 128)('::1'), true)
  assert.equal(ipMatcher('::1', 128)('localhost'), false)
})

test('bypass list covers local names, host wildcards, ports and CIDR', () => {
  const req = (host, port = 443, scheme = 'https') => ({ host, port, scheme, url: `${scheme}://${host}:${port}/` })
  assert.equal(bypassMatcher('<local>')(req('printer')), true)
  assert.equal(bypassMatcher('<local>')(req('example.com')), false)
  assert.equal(bypassMatcher('*.corp.example')(req('git.corp.example')), true)
  assert.equal(bypassMatcher('example.com:8080')(req('example.com', 8080)), true)
  assert.equal(bypassMatcher('example.com:8080')(req('example.com', 443)), false)
  assert.equal(bypassMatcher('10.0.0.0/8')(req('10.2.3.4')), true)
  assert.equal(bypassMatcher('http://plain.test')(req('plain.test', 80, 'http')), true)
})

test('condition problems are reported before routing', () => {
  assert.equal(conditionProblem({ conditionType: 'HostWildcardCondition', pattern: '*.x' }), undefined)
  assert.notEqual(conditionProblem({ conditionType: 'NopeCondition' }), undefined)
  assert.notEqual(conditionProblem({ conditionType: 'HostRegexCondition', pattern: '(' }), undefined)
})
