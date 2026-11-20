import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { fetchRuleList, ruleListUrl } from '../lib/rulelist-source.js'

const server = http.createServer((req, res) => {
  if (req.url === '/list') {
    res.writeHead(200, { 'content-type': 'text/plain' })
    res.end('||example.com\n*.example.net\n')
    return
  }
  if (req.url === '/redirect') {
    res.writeHead(302, { location: '/list' })
    res.end()
    return
  }
  if (req.url === '/large') {
    res.writeHead(200, { 'content-type': 'text/plain' })
    res.end('x'.repeat(2048))
    return
  }
  res.writeHead(404)
  res.end('missing')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`

test('downloads a plain-text rule list', async () => {
  const result = await fetchRuleList(`${origin}/list`)
  assert.equal(result.content, '||example.com\n*.example.net\n')
  assert.equal(result.bytes, Buffer.byteLength(result.content))
  assert.equal(result.url, `${origin}/list`)
  assert.ok(Number.isFinite(Date.parse(result.lastUpdate)))
})

test('follows redirects and reports the final URL', async () => {
  const result = await fetchRuleList(`${origin}/redirect`)
  assert.equal(result.url, `${origin}/list`)
  assert.match(result.content, /example\.com/)
})

test('rejects non-2xx responses', async () => {
  await assert.rejects(fetchRuleList(`${origin}/missing`), error => error.status === 400)
})

test('enforces the size limit', async () => {
  await assert.rejects(
    fetchRuleList(`${origin}/large`, { maxBytes: 100 }),
    error => error.status === 400 && /字节|bytes/.test(error.message),
  )
})

test('only accepts absolute http(s) URLs', () => {
  assert.equal(ruleListUrl('https://example.com/rules.txt').protocol, 'https:')
  assert.throws(() => ruleListUrl('file:///etc/passwd'), error => error.status === 400)
  assert.throws(() => ruleListUrl('not a url'), error => error.status === 400)
})

test('cleans up the server', async () => {
  await new Promise(resolve => server.close(resolve))
})
