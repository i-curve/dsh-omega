// End-to-end transport check for the routing dispatcher.
// Needs the Desktop runtime so `undici` resolves from the harness:
//   NODE_TLS_REJECT_UNAUTHORIZED=0 ELECTRON_RUN_AS_NODE=1 "$DSH_NODE_EXECUTABLE" test/router.e2e.mjs
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { installRouter } from '../lib/router.js'
import { normalizeDocument } from '../lib/config.js'
import { buildRoutingTable } from '../lib/profiles.js'

const certDir = mkdtempSync(path.join(os.tmpdir(), 'dsh-omega-tls-'))
const keyFile = path.join(certDir, 'key.pem')
const certFile = path.join(certDir, 'cert.pem')
execFileSync('openssl', [
  'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
  '-keyout', keyFile, '-out', certFile, '-days', '1', '-subj', '/CN=localhost',
], { stdio: 'ignore' })

const hits = { direct: 0, proxy: 0, connect: 0 }

const direct = http.createServer((req, res) => {
  hits.direct += 1
  res.end('direct')
})
await new Promise(resolve => direct.listen(0, '127.0.0.1', resolve))
const directPort = direct.address().port

const tls = https.createServer({
  key: readFileSync(keyFile),
  cert: readFileSync(certFile),
}, (req, res) => {
  res.end('secure')
})
await new Promise(resolve => tls.listen(0, '127.0.0.1', resolve))
const tlsPort = tls.address().port

const proxy = http.createServer((req, res) => {
  hits.proxy += 1
  res.end('proxied')
})
proxy.on('connect', (req, socket, head) => {
  hits.connect += 1
  const target = req.url.startsWith('https.test:') ? tlsPort : Number(req.url.split(':').pop())
  const upstream = net.connect(target, '127.0.0.1', () => {
    socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
    upstream.write(head)
    upstream.pipe(socket)
    socket.pipe(upstream)
  })
  upstream.on('error', () => socket.destroy())
})
await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve))
const proxyPort = proxy.address().port

const doc = normalizeDocument({
  schemaVersion: 2,
  '+proxy': {
    name: 'proxy',
    profileType: 'FixedProfile',
    fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: proxyPort },
  },
  '+auto': {
    name: 'auto',
    profileType: 'SwitchProfile',
    defaultProfileName: 'direct',
    rules: [
      { condition: { conditionType: 'HostWildcardCondition', pattern: 'copilot.test' }, profileName: 'proxy' },
      { condition: { conditionType: 'HostWildcardCondition', pattern: 'https.test' }, profileName: 'proxy' },
    ],
  },
  '-dshOmega': { currentProfileName: 'auto' },
}).doc

const handle = installRouter(buildRoutingTable(doc, []))

const directResponse = await fetch(`http://127.0.0.1:${directPort}/x`)
assert.equal(await directResponse.text(), 'direct')
assert.equal(hits.proxy, 0)

const proxied = await fetch('http://copilot.test/v1')
assert.equal(await proxied.text(), 'proxied')
assert.equal(hits.proxy, 1)

const secure = await fetch('https://https.test/')
assert.equal(await secure.text(), 'secure')
assert.equal(hits.connect, 1)

await handle.dispose()
direct.close()
tls.close()
proxy.close()
rmSync(certDir, { recursive: true, force: true })
console.log(JSON.stringify({ ok: true, hits }))
