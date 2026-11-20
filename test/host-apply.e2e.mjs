// Host-half smoke test: mount the plugin against a fake context, verify the
// config file and HTTP route registration, then tear it down.
//   ELECTRON_RUN_AS_NODE=1 "$DSH_NODE_EXECUTABLE" test/host-apply.e2e.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-omega-home-'))
process.env.DSH_HOME = home

const { apply } = await import('../index.js')

const cleanups = []
let route
const ctx = {
  logger: { info() {}, warn() {}, error() {} },
  get() { return undefined },
  on() { return () => {} },
  effect(fn) {
    const dispose = fn()
    if (typeof dispose === 'function') cleanups.push(dispose)
  },
  inject(names, callback) {
    if (names.includes('webServer')) {
      callback({
        effect(fn) {
          const dispose = fn()
          if (typeof dispose === 'function') cleanups.push(dispose)
        },
        logger: { warn() {} },
        webServer: {
          register(candidate) {
            route = candidate
            return () => { route = undefined }
          },
        },
      })
    }
    if (names.includes('llm')) callback()
  },
}

apply(ctx)

const configFile = path.join(home, 'dsh-omega', 'config.json')
assert.ok(fs.existsSync(configFile), 'config file was created')
const doc = JSON.parse(fs.readFileSync(configFile, 'utf8'))
assert.equal(doc.schemaVersion, 2)
assert.ok(doc['+proxy'], 'default proxy profile exists')
assert.equal(route?.path, '/dsh-omega/api')
assert.equal(route?.kind, 'prefix')

// The default document routes a Copilot host through the configured proxy and
// leaves a DeepSeek host direct.
const { buildRoutingTable } = await import('../lib/profiles.js')
const table = buildRoutingTable(doc, [])
assert.equal(table.resolve(new URL('https://github.com/x')).kind, 'proxy')
assert.equal(table.resolve(new URL('https://api.deepseek.com/x')).kind, 'direct')

await Promise.all(cleanups.map(cleanup => cleanup()))
fs.rmSync(home, { recursive: true, force: true })
console.log(JSON.stringify({ ok: true, file: configFile, current: doc['-dshOmega'].currentProfileName }))
