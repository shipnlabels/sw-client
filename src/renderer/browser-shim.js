/**
 * Browser compatibility shim.
 *
 * The renderer normally runs inside Electron, where the preload script injects
 * window.storage / window.app / window.api / window.rpc through contextBridge.
 * In a plain browser those are all undefined, and the very first thing the app
 * does - authStore.initialize() awaiting window.storage.getItem('AUTH_STATE') -
 * throws a TypeError. main.js mounts the app *inside* that promise chain, so
 * the rejection meant .mount('#app') never ran and playsmallworlds.com served
 * a completely blank page to every browser visitor.
 *
 * These shims let one build serve both: real preload APIs win when present,
 * and a browser gets localStorage plus no-op window controls.
 */

const hasWindow = typeof window !== 'undefined';

/** True when the real Electron preload bridge is present. */
export const isElectron = hasWindow && typeof window.__swElectron === 'boolean'
  ? window.__swElectron
  : hasWindow && !!window.storage && !!window.app;

if (hasWindow) {
  // Record this before we install anything, so callers can still tell the
  // difference between "real client" and "website".
  if (typeof window.__swElectron !== 'boolean') {
    window.__swElectron = !!window.storage && !!window.app;
  }

  if (!window.storage) {
    // localStorage throws outright in some privacy modes, so every access is
    // guarded and falls back to an in-memory map for the session.
    const memory = Object.create(null);
    const read = (k) => {
      try { return window.localStorage.getItem(k); }
      catch (e) { return k in memory ? memory[k] : null; }
    };
    const write = (k, v) => {
      try { window.localStorage.setItem(k, String(v)); }
      catch (e) { memory[k] = String(v); }
    };
    const drop = (k) => {
      try { window.localStorage.removeItem(k); }
      catch (e) { delete memory[k]; }
    };

    // The preload version is ipcRenderer.invoke, which is async - callers
    // await these, so the shim must return promises too.
    window.storage = {
      getItem: (key) => Promise.resolve(read(key)),
      setItem: (key, value) => Promise.resolve(write(key, value)),
      removeItem: (key) => Promise.resolve(drop(key)),
    };
  }

  const noop = () => Promise.resolve();

  if (!window.app) {
    // Frame controls and shell integration have no meaning in a browser tab.
    window.app = {
      appPath: noop, smi: noop, custom: noop, forget: noop,
      close: noop, minimize: noop, maximize: noop,
    };
  }

  if (!window.api) {
    window.api = { close: noop, minimize: noop, maximize: noop };
  }

  if (!window.rpc) {
    // Discord rich presence is desktop-only.
    window.rpc = { setRPC: () => {} };
  }

  if (!window.updater) {
    window.updater = {
      getVersion: () => Promise.resolve(null),
      getBuild: () => Promise.resolve(null),
      getPlatform: () => 'browser',
      getArch: () => 'browser',
    };
  }
}

/**
 * Where to send someone once they have signed in or registered.
 *
 * Inside the client that's their profile. In a browser the game itself cannot
 * run - the world is a Flash SWF that only the Electron build can host - so a
 * web visitor who just made an account is sent to the installer instead.
 */
export function postAuthDestination() {
  return isElectron ? '/profile' : '/download/';
}
