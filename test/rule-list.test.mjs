import test from 'node:test'
import assert from 'node:assert/strict'
import { parseRuleList } from '../lib/rule-list.js'

test('AutoProxy regex lines keep a leading-slash regex without eating the tail', () => {
  const rules = parseRuleList('@@/^https?:\\/\\/(?=.*x)[a-z]+\\.example$', 'proxy', 'direct', 'AutoProxy')
  assert.equal(rules.length, 1)
  assert.equal(rules[0].condition.conditionType, 'UrlRegexCondition')
  assert.equal(rules[0].condition.pattern, '^https?:\\/\\/(?=.*x)[a-z]+\\.example$')
  assert.equal(rules[0].profileName, 'direct')
})

test('AutoProxy host and exception rules are ordered with exceptions first', () => {
  const rules = parseRuleList('||blocked.example\n@@||direct.example\nkeyword\n', 'proxy', 'direct', 'AutoProxy')
  assert.equal(rules[0].profileName, 'direct')
  assert.equal(rules[0].condition.conditionType, 'HostWildcardCondition')
  assert.equal(rules[1].condition.pattern, '*.blocked.example')
  assert.equal(rules[1].profileName, 'proxy')
  assert.equal(rules[2].condition.conditionType, 'KeywordCondition')
})

test('a base64 AutoProxy payload is decoded', () => {
  const payload = Buffer.from('[AutoProxy 0.2.9]\n||encoded.example\n', 'utf8').toString('base64')
  const rules = parseRuleList(payload, 'proxy', 'direct', 'AutoProxy')
  assert.equal(rules.length, 1)
  assert.equal(rules[0].condition.pattern, '*.encoded.example')
})

test('Switchy Omega @with result carries per-rule profiles', () => {
  const text = [
    '[SwitchyOmega Conditions]',
    '@with result',
    '*.one.example +proxy',
    '*.two.example +direct',
    '* +proxy',
  ].join('\n')
  const rules = parseRuleList(text, 'proxy', 'direct', 'Switchy')
  assert.equal(rules.length, 2)
  assert.equal(rules[0].profileName, 'proxy')
  assert.equal(rules[1].profileName, 'direct')
})

test('Switchy legacy sections map regex and wildcard rules', () => {
  const text = [
    '#BEGIN',
    '[wildcard]',
    '*.legacy.example',
    '!direct.example',
    '[regexp]',
    '^https?://regex\\.example/',
    '#END',
  ].join('\n')
  const rules = parseRuleList(text, 'proxy', 'direct', 'Switchy')
  assert.equal(rules[0].profileName, 'direct')
  assert.equal(rules[1].profileName, 'proxy')
  assert.ok(rules.some(rule => rule.condition.conditionType === 'UrlRegexCondition'))
})
