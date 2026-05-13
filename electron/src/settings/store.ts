/**
 * Persistent settings for the Electron desktop agent.
 *
 * Stored at `userData/settings.json` via electron-store. Includes user consent
 * state, workspace configuration, auto-approve flags, and a bcrypt hash of
 * the kill-switch passcode (set during first-run onboarding).
 *
 * The store is the single source of truth for the sandbox layer.
 */
import { app } from 'electron';
import * as path from 'path';
// electron-store v10 is ESM-only; main process imports its CJS interop.
// We type our own minimal schema and lazy-load the module.

export interface DesktopSettings {
  consented: boolean;
  workspaceRoot: string;       // absolute path
  extraRoots: string[];        // additional allowlisted absolute paths (session + persisted)
  capabilities: {
    fs: boolean;
    shell: boolean;
    computer: boolean;
  };
  autoApprove: {
    insideWorkspace: boolean;  // writes/deletes inside workspace
    outsideWorkspace: boolean; // any path outside workspace
    shell: boolean;            // shell_run / shell_spawn_stream
    computerUse: boolean;      // mouse/keyboard
  };
  passcodeHash: string | null; // bcrypt; null = not set
  killSwitch: boolean;         // true = panic, all tools refuse
  appVersion: string;          // last-seen version (for migrations)
}

export const defaultSettings = (): DesktopSettings => ({
  consented: false,
  workspaceRoot: path.join(app.getPath('home'), 'PotomacWorkspace'),
  extraRoots: [],
  capabilities: { fs: true, shell: true, computer: false }, // computer is opt-in
  autoApprove: {
    insideWorkspace: true,
    outsideWorkspace: false,
    shell: false,
    computerUse: false,
  },
  passcodeHash: null,
  killSwitch: false,
  appVersion: app.getVersion(),
});

// ── Tiny synchronous JSON store (avoids ESM-only `electron-store` headache) ──
import * as fs from 'fs';

class JsonStore {
  private filePath: string;
  private cache: DesktopSettings;

  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'settings.json');
    this.cache = this.load();
  }

  private load(): DesktopSettings {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...defaultSettings(), ...parsed };
    } catch {
      return defaultSettings();
    }
  }

  private save(): void {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.cache, null, 2), 'utf-8');
    } catch {
      /* ignore */
    }
  }

  get(): DesktopSettings {
    return { ...this.cache };
  }

  patch(partial: Partial<DesktopSettings>): DesktopSettings {
    this.cache = { ...this.cache, ...partial };
    // deep-merge nested objects we care about
    if (partial.capabilities) this.cache.capabilities = { ...this.get().capabilities, ...partial.capabilities };
    if (partial.autoApprove) this.cache.autoApprove = { ...this.get().autoApprove, ...partial.autoApprove };
    this.save();
    return this.get();
  }

  reset(): DesktopSettings {
    this.cache = defaultSettings();
    this.save();
    return this.get();
  }
}

let _store: JsonStore | null = null;
export function getStore(): JsonStore {
  if (!_store) _store = new JsonStore();
  return _store;
}
