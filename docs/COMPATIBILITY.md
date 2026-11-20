# Zero Omega compatibility

`dsh-omega` stores a browser extension's **flat options document**. The table
below is the supported subset; anything outside it is preserved on export but
may be reported and routed direct.

## Profile types

| `profileType` | Support | Behavior in DSH |
|---|---|---|
| `DirectProfile` | Full | Always direct. The built-in `direct` profile is implicit and cannot be edited. |
| `SystemProfile` | Reported | DSH does not read the operating system proxy, so the built-in `system` profile is treated as direct. |
| `FixedProfile` | Full (HTTP/HTTPS) | Uses `proxyForHttps` / `proxyForHttp` when present, otherwise `fallbackProxy`. `bypassList` is evaluated first. `auth.all` and per-scheme auth become `Proxy-Authorization: Basic`. |
| `SwitchProfile` | Full | Rules are evaluated top to bottom; the first match selects another profile; otherwise `defaultProfileName`. |
| `VirtualProfile` | Full | Treated as a switch profile (rules + default). |
| `RuleListProfile` / `SwitchyRuleListProfile` / `AutoProxyRuleListProfile` | Text formats | `AutoProxy` and `Switchy` rule-list text are parsed once and cached. `matchProfileName` applies to normal rules, `defaultProfileName` to `@@` / `!` exceptions and to the fallback. |
| `PacProfile` | Reported | No PAC evaluator. Requests are direct and a warning names the profile. |

SOCKS is not a profile type but a proxy scheme: `socks4` / `socks5` fixed
profiles are reported and routed direct, because the bundled `undici`
`ProxyAgent` speaks HTTP CONNECT only.

## Condition types

| `conditionType` | Fields | Behavior |
|---|---|---|
| `HostWildcardCondition` | `pattern` | `\|`-separated alternatives. `*.example.com` and `**.example.com` cover the domain and its subdomains; a leading dot is shorthand. Plain `example.com` is exact. |
| `HostRegexCondition` | `pattern` | JavaScript regex over the hostname; surrounding slashes accepted. |
| `UrlWildcardCondition` | `pattern` | Shell wildcard over the full serialized URL; `\|` alternatives. |
| `UrlRegexCondition` | `pattern` | JavaScript regex over the full URL; surrounding slashes accepted. |
| `KeywordCondition` | `pattern` | Case-sensitive substring of the URL, and only for `http:` URLs, matching Zero Omega. |
| `IpCondition` | `ip`, `prefixLength` | Literal IPv4/IPv6 CIDR. Hostnames are never resolved. |
| `TrueCondition` / `FalseCondition` | — | Always / never. |

Bypass entries use `BypassCondition` patterns: `<local>`, host wildcards,
`host:port`, `scheme://host`, IP literals and CIDR. Loopback is always bypassed
regardless of the list.

## Document shape

```json
{
  "schemaVersion": 2,
  "-startupProfileName": "auto switch",
  "-someBrowserSetting": true,
  "+proxy": { "name": "proxy", "profileType": "FixedProfile", "color": "#99ccee", "fallbackProxy": { "scheme": "http", "host": "127.0.0.1", "port": 1080 }, "bypassList": [] },
  "+auto switch": { "name": "auto switch", "profileType": "SwitchProfile", "color": "#99dd99", "defaultProfileName": "direct", "rules": [] },
  "-dshOmega": {
    "version": 1,
    "currentProfileName": "auto switch",
    "providerBindings": { "github-copilot": "proxy" },
    "providerHosts": { "github-copilot": ["api.individual.githubcopilot.com", "github.com"] }
  }
}
```

- `+name` keys are profiles; `-name` keys are browser settings. Both are
  preserved verbatim through import/export.
- `-dshOmega` is the only DSH addition. A browser ignores it. Delete it for a
  byte-for-byte browser backup.
- `currentProfileName` is DSH's active profile. `-startupProfileName` is kept in
  sync so a browser import starts on the same profile.
- `providerBindings` maps a DSH route id to a profile name. `providerHosts`
  overrides the auto-detected hosts for that route.
- Import also accepts a convenience wrapper `{ "profiles": {...}, "settings": {...} }`.

## Deliberate differences

| Zero Omega | dsh-omega |
|---|---|
| Browser proxy API per tab | One process-wide dispatcher; the unit is a request URL. |
| Current profile is extension state | Stored in the document as `-dshOmega.currentProfileName` and mirrored to `-startupProfileName`. |
| Remote rule-list refresh (`-downloadInterval`) | Not performed; imported text is evaluated as-is. Refresh the list in the browser and re-import. |
| PAC scripts | Reported, routed direct. |
| SOCKS proxies, proxy auth prompts | HTTP/HTTPS only; Basic credentials can be stored in the profile. |
| Browser quick switch, inspect menu, badges | Browser-only settings are preserved but have no effect. |
| `system` profile | Direct, because DSH does not read OS proxy settings. |

## Provider bindings

Bindings are evaluated before the current profile. Hosts come from the live
provider directory (`defaultBaseURL` plus the resolved settings `baseURL`) and a
small table of well-known authentication hosts — for `github-copilot`, that adds
`github.com` and `api.github.com` so the OAuth device flow is proxied too. If
two providers share a host with different bindings, the most specific host entry
wins; tie-breaking follows the provider directory order. The UI shows the hosts
in use and lets you replace them per provider.
