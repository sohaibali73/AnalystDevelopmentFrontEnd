'use client';

/**
 * Settings panel for the desktop agent — workspace, allowlist, auto-approve
 * toggles, audit log, kill switch (passcode-gated).
 *
 * Renders nothing in non-Electron browsers.
 */
import { useEffect, useState } from 'react';
import { isDesktop, getSettings } from '@/lib/desktop/bridge';

interface Settings {
  consented: boolean;
  workspaceRoot: string;
  extraRoots: string[];
  capabilities: { fs: boolean; shell: boolean; computer: boolean };
  autoApprove: { insideWorkspace: boolean; outsideWorkspace: boolean; shell: boolean; computerUse: boolean };
  killSwitch: boolean;
}

interface AuditEntry { ts: number; tool: string; status: string; args?: unknown; error?: string; durationMs?: number; }

export default function DesktopSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [auditPath, setAuditPath] = useState<string>('');

  useEffect(() => {
    if (!isDesktop()) return;
    refresh();
    const off = getSettings()?.onKillSwitchChanged?.(() => refresh());
    return () => { off?.(); };
  }, []);

  async function refresh() {
    const api = getSettings();
    if (!api) return;
    const s = await api.get();
    setSettings(s);
    const a = await api.auditTail(200);
    setAudit(a.reverse());
    setAuditPath(await api.auditPath());
  }

  if (!isDesktop()) {
    return <div className="p-6 text-sm text-neutral-500">Desktop settings only available in the Potomac desktop app.</div>;
  }
  if (!settings) return <div className="p-6 text-sm text-neutral-500">Loading…</div>;

  async function patchAuto(key: keyof Settings['autoApprove'], v: boolean) {
    const api = getSettings()!;
    await api.patch({ autoApprove: { ...settings!.autoApprove, [key]: v } });
    refresh();
  }
  async function patchCap(key: keyof Settings['capabilities'], v: boolean) {
    const api = getSettings()!;
    await api.patch({ capabilities: { ...settings!.capabilities, [key]: v } });
    refresh();
  }

  async function engageKillSwitch() {
    await getSettings()!.engageKillSwitch();
    refresh();
  }
  async function disengageKillSwitch() {
    setError(null);
    const r = await getSettings()!.disengageKillSwitch(passcode);
    if (!r.ok) setError(r.error || 'Incorrect passcode.');
    else {
      setPasscode('');
      refresh();
    }
  }
  async function addRoot() {
    const r = await window.potomacTools?.fs_pick_folder();
    if (r?.ok && r.result?.path) refresh();
  }
  async function removeRoot(p: string) {
    await getSettings()!.removeExtraRoot(p);
    refresh();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 text-neutral-200">
      <header>
        <h1 className="text-xl font-semibold">Desktop Agent</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Control which actions the AI can take on your computer.
        </p>
      </header>

      {/* Kill switch */}
      <Card title="Kill switch" intent={settings.killSwitch ? 'danger' : 'normal'}>
        {settings.killSwitch ? (
          <>
            <p className="text-sm text-red-300 mb-3">
              Kill switch engaged. All tool calls are refused.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Enter passcode to unlock"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:outline-none"
              />
              <button onClick={disengageKillSwitch} className="px-4 py-2 bg-neutral-100 text-neutral-900 rounded-md text-sm font-medium hover:bg-white">Unlock</button>
            </div>
            {error && <div className="text-xs text-red-400 mt-2">{error}</div>}
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-400 mb-3">
              Disables all desktop tools immediately. Re-enabling requires your passcode.
              Hot-key: <kbd className="px-1.5 py-0.5 text-[10px] bg-neutral-900 border border-neutral-800 rounded">Ctrl+Shift+Esc</kbd>
            </p>
            <button onClick={engageKillSwitch} className="px-4 py-2 bg-red-900 hover:bg-red-800 text-red-100 rounded-md text-sm font-medium">Engage kill switch</button>
          </>
        )}
      </Card>

      {/* Workspace */}
      <Card title="Workspace">
        <div className="text-xs text-neutral-500 mb-2">Primary root</div>
        <div className="font-mono text-sm text-neutral-200 mb-4">{settings.workspaceRoot}</div>
        <div className="text-xs text-neutral-500 mb-2">Extra allow-listed folders</div>
        {settings.extraRoots.length === 0 && <div className="text-xs text-neutral-500 italic">None</div>}
        <ul className="space-y-1 mb-3">
          {settings.extraRoots.map((r) => (
            <li key={r} className="flex justify-between items-center text-xs font-mono bg-neutral-900 px-2 py-1.5 rounded-md">
              <span className="truncate">{r}</span>
              <button onClick={() => removeRoot(r)} className="text-neutral-400 hover:text-red-400 ml-2">Remove</button>
            </li>
          ))}
        </ul>
        <button onClick={addRoot} className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-md hover:bg-neutral-800">Add folder…</button>
      </Card>

      {/* Capabilities */}
      <Card title="Capabilities">
        <Toggle label="Filesystem" value={settings.capabilities.fs} onChange={(v) => patchCap('fs', v)} />
        <Toggle label="Shell" value={settings.capabilities.shell} onChange={(v) => patchCap('shell', v)} />
        <Toggle label="Computer use (mouse / keyboard)" value={settings.capabilities.computer} onChange={(v) => patchCap('computer', v)} />
      </Card>

      {/* Auto-approve */}
      <Card title="Auto-approve">
        <Toggle label="Inside workspace folder" value={settings.autoApprove.insideWorkspace} onChange={(v) => patchAuto('insideWorkspace', v)} />
        <Toggle label="Outside workspace folder" value={settings.autoApprove.outsideWorkspace} onChange={(v) => patchAuto('outsideWorkspace', v)} warning={settings.autoApprove.outsideWorkspace ? 'AI can touch any file on your machine without asking.' : undefined} />
        <Toggle label="Shell commands" value={settings.autoApprove.shell} onChange={(v) => patchAuto('shell', v)} warning={settings.autoApprove.shell ? 'AI can run any shell command without asking.' : undefined} />
        <Toggle label="Computer use" value={settings.autoApprove.computerUse} onChange={(v) => patchAuto('computerUse', v)} />
      </Card>

      {/* Audit */}
      <Card title="Audit log">
        <div className="text-xs text-neutral-500 mb-2 font-mono truncate">{auditPath}</div>
        <div className="max-h-72 overflow-y-auto border border-neutral-800 rounded-md">
          {audit.length === 0 && <div className="px-3 py-4 text-xs text-neutral-500 text-center">No entries yet.</div>}
          {audit.map((e, i) => (
            <div key={i} className="px-3 py-1.5 border-b border-neutral-900 last:border-b-0 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <StatusBadge status={e.status} />
                <span className="text-xs font-mono text-neutral-200 truncate">{e.tool}</span>
              </div>
              <span className="text-[10px] text-neutral-500 shrink-0">{new Date(e.ts).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Card({ title, intent, children }: { title: string; intent?: 'normal' | 'danger'; children: React.ReactNode }) {
  return (
    <section className={`rounded-lg border ${intent === 'danger' ? 'border-red-900 bg-red-950/20' : 'border-neutral-800 bg-neutral-950'} p-5`}>
      <h2 className="text-sm font-medium text-neutral-100 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Toggle({ label, value, onChange, warning }: { label: string; value: boolean; onChange: (v: boolean) => void; warning?: string }) {
  return (
    <label className="flex items-start gap-3 py-1.5 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-neutral-700 bg-neutral-900"
      />
      <div className="flex-1">
        <div className="text-sm text-neutral-100">{label}</div>
        {warning && <div className="text-xs text-amber-400/80 mt-0.5">{warning}</div>}
      </div>
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'success' ? 'bg-emerald-400'
    : status === 'error' ? 'bg-red-500'
    : status === 'denied' ? 'bg-amber-500'
    : 'bg-neutral-500';
  return <span className={`w-1.5 h-1.5 rounded-full ${color}`} />;
}
