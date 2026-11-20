# dsh-omega

[![ci](https://github.com/allcloud/dsh-omega/actions/workflows/ci.yml/badge.svg)](https://github.com/allcloud/dsh-omega/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dsh-omega.svg)](https://www.npmjs.com/package/dsh-omega)
[![license](https://img.shields.io/npm/l/dsh-omega.svg)](LICENSE)

Zero Omega style proxy routing for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness):
proxy profiles, host rules, and **per-model-provider** proxy/direct bindings, with
browser-backup import/export.

> Only the traffic you choose goes through a proxy. The default model can stay
> direct while a Copilot model uses `127.0.0.1:1080` — no global `HTTPS_PROXY`
> that drags every other request along.

[中文说明](README.zh.md)

## Why

DSH resolves one outbound transport per process from `HTTP_PROXY` /
`HTTPS_PROXY` / `NO_PROXY`. That is fine until one model provider needs a proxy
and the rest must not use one: a global variable changes every request, and
`NO_PROXY` can only list exceptions, not the other way round.

`dsh-omega` replaces the global dispatcher with a router that decides **per
request**, using the same profile and rule vocabulary as the Zero Omega /
SwitchyOmega browser extension. It also adds a DSH-specific binding layer so a
model provider such as `github-copilot` can be pinned to a proxy while
`deepseek-account` stays direct.

## Features

- **Profiles like Zero Omega** — direct, proxy server, automatic switch, and
  rule lists. Create, rename, duplicate rules, and pick the current profile.
- **Automatic switching** — default profile plus ordered host/URL/regex/IP
  rules; first match wins.
- **Per-provider bindings** — each detected DSH model provider has a profile
  selector that takes precedence over the current profile for that provider's
  hosts. Bindings show the hosts DSH will use; edit them when a gateway uses a
  custom domain.
- **Import / export in the Zero Omega format** — a backup from the browser
  extension imports directly (flat `+profile` / `-setting` document, including
  AutoProxy and SwitchyOmega rule lists). Export produces the same shape, so
  the file can go back to the browser.
- **Rule tester** — resolve any URL against the current draft and see every
  decision step.
- **Live apply** — saving swaps the routing table without restarting DSH.
- **Bilingual UI** — English and Simplified Chinese.

## Install

### From the plugin manager (recommended)

1. Open **Plugins** in DSH and choose **Add plugin**.
2. Install by package name `dsh-omega`, or by this repository's Git URL.
3. Open **Settings → Proxy**.

The plugin writes its state to `$DSH_HOME/dsh-omega/config.json` (usually
`~/.dsh/dsh-omega/config.json`) and serves the page through the local DSH Web
server. No API key or external service is required.

### From a checkout

```sh
git clone https://github.com/allcloud/dsh-omega.git
cd dsh-omega
npm test
```

Then install the directory from **Plugins → Add plugin** (local directory), or
with the DSH plugin manager tool.

## Quick start

Out of the box the plugin creates:

| Profile | Type | Meaning |
|---|---|---|
| `proxy` | Proxy server | `http://127.0.0.1:1080` |
| `auto switch` | Automatic switch | default `direct`; `*.githubcopilot.com`, `github.com`, `api.github.com` → `proxy` |

Change the port in **Proxy → proxy**, then use **Proxy → Rule tester** to check
`https://api.individual.githubcopilot.com/v1/models`. To pin a provider
independently of the switch rules, open **Proxy → Providers**, set
`github-copilot` to `proxy` and leave the default model on *Follow current
profile* (or pin it to `direct`).

## How a request is routed

1. **Loopback** (`localhost`, `127.0.0.0/8`, `::1`) is always direct.
2. **Provider binding** — if the request host matches a bound provider's hosts,
   that profile decides. The most specific host entry wins.
3. **Current profile** — a switch profile evaluates its rules top to bottom and
   falls back to its default; a fixed profile proxies (respecting its bypass
   list); direct stays direct.
4. Unsupported profile types (PAC, SOCKS proxies) are reported and fall back to
   direct rather than silently borrowing another route.

## Zero Omega compatibility

The configuration document is the browser extension's flat options object:

```json
{
  "schemaVersion": 2,
  "-startupProfileName": "auto switch",
  "+proxy": { "name": "proxy", "profileType": "FixedProfile", "fallbackProxy": { "scheme": "http", "host": "127.0.0.1", "port": 1080 }, "bypassList": [] },
  "+auto switch": { "name": "auto switch", "profileType": "SwitchProfile", "defaultProfileName": "direct", "rules": [] },
  "-dshOmega": { "version": 1, "currentProfileName": "auto switch", "providerBindings": {}, "providerHosts": {} }
}
```

`-dshOmega` is the only DSH-specific key. A browser extension ignores unknown
settings keys; remove it if you want a byte-for-byte browser backup.

Supported: `DirectProfile`, `SystemProfile` (direct in DSH), `FixedProfile`
(HTTP/HTTPS), `SwitchProfile`, `VirtualProfile`, `RuleListProfile`
(`AutoProxy` and `Switchy` text), host/URL wildcard and regex, keyword, IP/CIDR,
and bypass lists.

Not supported: SOCKS proxies (`socks4://`, `socks5://`), PAC scripts, remote
rule-list refresh, and browser-only settings. See
[docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) for the full matrix.

## Configuration and security

- State file: `$DSH_HOME/dsh-omega/config.json`, mode `0600`.
- Proxy credentials, if you enter them, are stored in that file in plain text.
  Prefer a loopback proxy without authentication, or a credentialless listener.
- The page talks to the host through same-origin JSON endpoints under
  `/dsh-omega/api`; writes reject cross-origin requests and non-JSON content
  types, and every call is restricted to a loopback peer. A remote-access Web
  deployment configures this plugin on the host (or through a tunnel), not from
  another machine.
- Removing the plugin restores the dispatcher that was installed before it;
  the configuration file stays until you delete it.

## Development

```sh
npm test          # unit tests (conditions, routing, Zero Omega import/export)
npm run check     # syntax check for host and client entries
```

Transport tests need the DSH Desktop runtime because they import the same
`undici` copy the harness uses:

```sh
NODE_TLS_REJECT_UNAUTHORIZED=0 ELECTRON_RUN_AS_NODE=1 \
  "/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness" \
  test/router.e2e.mjs
```

The browser half is a single lazy-CJS factory (`client.js`) and needs no build
step.

## License

MIT © allcloud
