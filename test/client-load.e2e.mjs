// Loads the browser half with a fake module loader and React, then runs apply
// against a fake client context. Catches module-scope and registration errors
// without a browser.
//   node test/client-load.e2e.mjs
let loaded
globalThis.window = {
  __ModuleLoader__: {
    load(entry) {
      loaded = entry
    },
  },
}

const React = {
  createElement: () => null,
  Fragment: Symbol('Fragment'),
  useState: () => [undefined, () => {}],
  useEffect: () => {},
  useMemo: factory => factory(),
  useRef: () => ({ current: undefined }),
}

await import('../client.js')
if (loaded?.id !== 'dsh-omega') throw new Error(`unexpected module id: ${loaded?.id}`)

const plugin = loaded.factory(name => {
  if (name === 'react') return React
  throw new Error(`unexpected require: ${name}`)
})
if (typeof plugin?.apply !== 'function') throw new Error('plugin has no apply')

const sections = []
const icons = []
const ctx = {
  effect(fn) {
    fn()
  },
  on() {
    return () => {}
  },
  locale: {
    register() {
      return () => {}
    },
    bind() {
      return (key) => key
    },
  },
  slots: {
    inject(_name, register) {
      register()
    },
    register(options) {
      if (options.name === 'settings.section') sections.push(options)
      if (options.name === 'settings.section.icon') icons.push(options)
      return () => {}
    },
  },
}
plugin.apply(ctx)
if (sections.length !== 1) throw new Error(`expected one settings section, got ${sections.length}`)
if (sections[0].id !== 'dsh-omega') throw new Error('wrong section id')
if (icons.length !== 1) throw new Error('missing section icon')
console.log(JSON.stringify({ ok: true, id: loaded.id, section: sections[0] }))
