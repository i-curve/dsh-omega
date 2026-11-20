# Security policy

## What this plugin can do

`dsh-omega` owns the process-wide undici dispatcher of the running DSH host. A
configuration change can send model, web, and MCP traffic to any HTTP/HTTPS
proxy the user configures. Treat access to the DSH Web GUI and to
`$DSH_HOME/dsh-omega/config.json` as equivalent to that capability.

The settings page talks to the host through same-origin JSON endpoints under
`/dsh-omega/api`. Writes reject cross-origin `Origin` headers and non-JSON
content types, every request must come from a loopback peer, and the page state
never returns proxy passwords. On a Web deployment bound to a LAN, use the
host machine (or a tunnel) for configuration.

A rule-list subscription is a user-supplied `http(s)` URL that the host
downloads with the current routing. Treat a URL you do not control as untrusted
input: it can be used to make the host request an internal address (SSRF), and
the fetched text becomes routing rules. The download is capped at 16 MiB and
times out after 30 seconds, but it is not sandboxed beyond that.

Proxy credentials entered in the UI are stored in plain text in
`$DSH_HOME/dsh-omega/config.json` with mode `0600`. For shared machines prefer a
credentialless loopback listener; use OS-level file permissions for anything
stronger.

## Supported versions

Only the latest release receives security fixes.

## Reporting a vulnerability

Please do not open a public issue for a vulnerability that can redirect or
expose traffic. Report it privately through GitHub Security Advisories on this
repository, or by opening a minimal issue asking for a private channel. Include
the version, the affected profile/rule, and reproduction steps.
