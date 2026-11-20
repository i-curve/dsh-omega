# Contributing

Thanks for taking a look. This plugin is a DSH bundle with a Host half
(`index.js`, `lib/`) and a browser half (`client.js`).

## Development

```sh
npm test
npm run check
```

There is no build step and no runtime dependency: the host loads the `undici`
copy that ships with DSH, and the browser half is a lazy-CJS factory.

Transport tests need the DSH Desktop runtime (they import the harness's own
`undici`):

```sh
NODE_TLS_REJECT_UNAUTHORIZED=0 ELECTRON_RUN_AS_NODE=1 \
  "/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness" \
  test/router.e2e.mjs
ELECTRON_RUN_AS_NODE=1 \
  "/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness" \
  test/host-apply.e2e.mjs
```

## Compatibility rule

The configuration document is a Zero Omega options object. Keep it that way:
add DSH-only state under the `-dshOmega` settings key, never rename or wrap the
`+profile` / `-setting` keys, and make sure a browser export can still be
imported after your change. Add a fixture under `test/fixtures/` when you touch
import/export or profile evaluation.

## UI rule

The page is a `settings.section` contribution. Use `--dsw-alias-*` tokens for
every color, keep controls at the host's settings density, and do not import
another DSH Client package at runtime.

## Pull requests

- One change per pull request; include tests for routing or import/export
  changes.
- Update `README.md`, `README.zh.md`, and `docs/COMPATIBILITY.md` when behavior
  changes.
- Mention what you could not verify without a browser.
