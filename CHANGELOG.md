# Changelog

## 0.1.0 — 2026-11-20

- First public version.
- Zero Omega flat options document as the single source of truth.
- Profiles: direct, system (direct in DSH), fixed HTTP/HTTPS proxy, automatic
  switch, virtual profiles, and rule lists (`AutoProxy` / `Switchy`).
- Conditions: host wildcard, host regex, URL wildcard, URL regex, keyword,
  IP/CIDR, always/never, and fixed-profile bypass lists.
- Per-model-provider bindings with detected hosts and manual overrides.
- Live routing-table replacement through the process-wide undici dispatcher.
- Zero Omega `.bak` import (replace or merge) and export.
- Rule-list URL subscriptions: `sourceUrl` + `lastUpdate`, manual **Update now**,
  and host-side auto-refresh controlled by `-downloadInterval`.
- **Download list** / **Copy list** actions for publishing a rule list at any
  URL and subscribing to it elsewhere.
- Default automatic switching also covers `raw.githubusercontent.com` and
  `gist.githubusercontent.com` so GitHub-hosted lists work through the proxy.
- Settings → Proxy page with profile editor, rule editor, provider bindings,
  rule tester, and import/export.
- English and Simplified Chinese copy.
