# Publishing dsh-omega

This is a **DSH plugin**, not a standalone desktop/mobile application. Its
"app stores" are the DSH Plugin Manager catalog, npm, and GitHub Releases.

## 1. Put the repository online

```sh
cd dsh-omega
git init
git add .
git commit -m "feat: initial dsh-omega plugin"
git branch -M main
git remote add origin git@github.com:allcloud/dsh-omega.git
git push -u origin main
```

If the GitHub owner is not `allcloud`, update `repository`, `homepage`, and
`bugs` in `package.json` and the clone URLs in both READMEs.

## 2. Check the package

```sh
npm run check
npm test
node test/client-load.e2e.mjs
npm_config_cache=/tmp/npm-cache npm pack --dry-run
```

The tarball must contain `index.js`, `client.js`, `lib/`, `locale/`,
`cordis.patch.yml`, `icon.svg`, and the docs. It must **not** contain tests,
`node_modules`, or local configuration.

## 3. Publish to npm

The package name `dsh-omega` was unclaimed at the time of writing; verify with
`npm view dsh-omega version` before the first release.

Manual first release:

```sh
npm login
npm publish --access public
```

Subsequent releases use the tag workflow:

```sh
npm version patch   # or minor / major
git push --follow-tags
```

`.github/workflows/publish.yml` runs on `v*` tags and publishes with provenance.
Configure either:

- an `NPM_TOKEN` repository secret (automation token with publish rights), or
- npm trusted publishing (OIDC) for `allcloud/dsh-omega` and workflow
  `publish.yml`, then remove `NODE_AUTH_TOKEN` from the workflow.

## 4. GitHub release

```sh
git tag -a v0.1.0 -m "dsh-omega 0.1.0"
git push origin v0.1.0
```

Create a release from the tag and paste the matching `CHANGELOG.md` section.
Attach the `npm pack` tarball if you want an offline-installable artifact.

## 5. DSH Plugin Manager / market

- **Install by package name**: DSH's Add-plugin dialog accepts `dsh-omega`
  after the npm publish; this is the primary "store" listing.
- **Install by Git URL**: the repository URL works without npm, for users who
  want `main`.
- **Market index**: if the DSH plugin market in use reads a curated index, open
  a pull request there adding `dsh-omega` with its title, one-line description,
  repository, icon, and latest version. Keep the package's `dsh.bundle.patch`
  and `dsh.client` metadata intact — the market reads them.

## 6. Release checklist

- [ ] `package.json` version matches `CHANGELOG.md` and the tag.
- [ ] `npm test` and `npm run check` pass on Node 22 and 24.
- [ ] Client bundle still loads (`node test/client-load.e2e.mjs`).
- [ ] A real Zero Omega `.bak` still imports and routes (see
      `docs/COMPATIBILITY.md`).
- [ ] README screenshots/description match the shipped UI.
- [ ] `SECURITY.md` still describes the actual credential storage.
- [ ] Installed copy in DSH refreshed and the Settings → Proxy page opens.
- [ ] Release notes mention unsupported SOCKS/PAC behavior if relevant.

## Versioning

Semantic versioning. A change to the stored document shape or the meaning of an
existing profile field is a **minor** bump plus a migration note; removing or
renaming a key is a **major** bump. Adding a condition or profile type is minor.
