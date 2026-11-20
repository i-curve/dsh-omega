/**
 * Load the undici copy the running harness uses.
 *
 * A locally installed bundle is linked into the profile, so a bare `undici`
 * specifier would resolve from the checkout rather than the profile. The
 * harness always ships one, and matching its copy keeps the dispatcher
 * protocol aligned with the runtime that calls it.
 * @returns the undici module namespace.
 */
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export async function loadUndici() {
  try {
    return await import('undici')
  } catch (cause) {
    const candidates = []
    if (process.env.DSH_INSTALL_DIR) {
      candidates.push(path.resolve(process.env.DSH_INSTALL_DIR, '..', '..', 'undici', 'index.js'))
    }
    if (process.resourcesPath) {
      candidates.push(path.join(process.resourcesPath, 'app.asar', 'dsh', 'node_modules', 'undici', 'index.js'))
      candidates.push(path.join(process.resourcesPath, 'app', 'dsh', 'node_modules', 'undici', 'index.js'))
    }
    if (process.env.DSH_INSTALL_DIR) {
      candidates.push(path.join(process.env.DSH_INSTALL_DIR, 'node_modules', 'undici', 'index.js'))
    }
    for (const file of candidates) {
      try {
        return await import(pathToFileURL(file).href)
      } catch {
        // Try the next anchor.
      }
    }
    throw new Error(
      'dsh-omega: cannot load undici from this profile or the harness installation;'
      + ' reinstall the bundle so its dependency is linked, or run DSH from a source checkout',
      { cause },
    )
  }
}
