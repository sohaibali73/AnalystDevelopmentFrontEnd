'use client';

/**
 * First-run consent modal for the desktop agent.
 *
 * Shown only when:
 *   - running in Electron
 *   - `consented` is false in the settings store
 *
 * Collects:
 *   - Workspace root (defaults to ~/PotomacWorkspace)
 *   - Capability toggles (fs, shell, computer)
 *   - Auto-approve preferences
 *   - Kill-switch passcode (required, ≥ 4 chars)
 */
import { useEffect, useState } from 'react';
import { isDesktop, getSettings } from '@/lib/desktop/bridge';

interface State {
  loaded: boolean;
  visible: boolean;
  workspaceRoot: string;
  capabilities: { fs: boolean; shell: boolean; computer: boolean };
  autoApprove: { insideWorkspace: boolean; outsideWorkspace: boolean; shell: boolean; computerUse: boolean };
  passcode: string;
  passcode2: string;
  error: string | null;
  saving: boolean;
}

export default function DesktopOnboarding() {
  const [state, setState] = useState<State>({
    loaded: false,
    visible: false,
    workspaceRoot: '',
    capabilities: { fs: true, shell: true, computer: false },
    autoApprove: { insideWorkspace: true, outsideWorkspace: false, shell: false, computerUse: false },
    passcode: '',
    passcode2: '',
    error: null,
    saving: false,
  });

  useEffect(() => {
    if (!isDesktop()) {
      setState((s) => ({ ...s, loaded: true, visible: false }));
      return;
    }
    const settings = getSettings();
    if (!settings) return;
    settings.get().then((s) => {
      setState((cur) => ({
        ...cur,
        loaded: true,
        visible: !s.consented,
        workspaceRoot: s.workspaceRoot,
        capabilities: s.capabilities,
        autoApprove: s.autoApprove,
      }));
    });
  }, []);

  async function submit() {
    setState((s) => ({ ...s, error: null }));
    if (state.passcode.length < 4) {
      setState((s) => ({ ...s, error: 'Passcode must be at least 4 characters.' }));
      return;
    }
    if (state.passcode !== state.passcode2) {
      setState((s) => ({ ...s, error: 'Passcodes do not match.' }));
      return;
    }
    setState((s) => ({ ...s, saving: true }));
    try {
      await getSettings()!.completeOnboarding({
        workspaceRoot: state.workspaceRoot || undefined,
        capabilities: state.capabilities,
        autoApprove: state.autoApprove,
        passcode: state.passcode,
      });
      setState((s) => ({ ...s, visible: false, saving: false }));
    } catch (err) {
      setState((s) => ({ ...s, saving: false, error: err instanceof Error ? err.message : String(err) }));
    }
  }

  if (!state.loaded || !state.visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <div className="w-full max-w-xl rounded-xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-100">Enable desktop agent</h2>
          <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed">
            Grant the AI access to your filesystem, shell, and (optionally) your mouse/keyboard.
            You can revoke any of these later in Settings.
          </p>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Workspace */}
          <section>
            <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-2">Workspace folder</div>
            <div className="flex items-center gap-2">
              <input
                value={state.workspaceRoot}
                onChange={(e) => setState((s) => ({ ...s, workspaceRoot: e.target.value }))}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-700"
              />
              <button
                type="button"
                onClick={async () => {
                  const r = await window.potomacTools?.fs_pick_folder();
                  if (r?.ok && r.result?.path) setState((s) => ({ ...s, workspaceRoot: r.result!.path! }));
                }}
                className="px-3 py-2 text-xs text-neutral-200 bg-neutral-900 border border-neutral-800 rounded-md hover:bg-neutral-800"
              >
                Browse…
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-1.5">
              Files inside this folder can be read/written without per-call prompts.
            </p>
          </section>

          {/* Capabilities */}
          <section>
            <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-2">Capabilities</div>
            <Toggle
              label="Filesystem (read & write files)"
              value={state.capabilities.fs}
              onChange={(v) => setState((s) => ({ ...s, capabilities: { ...s.capabilities, fs: v } }))}
            />
            <Toggle
              label="Shell (run any command)"
              value={state.capabilities.shell}
              onChange={(v) => setState((s) => ({ ...s, capabilities: { ...s.capabilities, shell: v } }))}
            />
            <Toggle
              label="Computer use (mouse, keyboard, screen)"
              value={state.capabilities.computer}
              onChange={(v) => setState((s) => ({ ...s, capabilities: { ...s.capabilities, computer: v } }))}
              warning={state.capabilities.computer ? 'On macOS, grant Accessibility & Screen Recording permissions when prompted by the OS.' : undefined}
            />
          </section>

          {/* Auto-approve */}
          <section>
            <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-2">Auto-approve</div>
            <Toggle
              label="Inside workspace folder"
              value={state.autoApprove.insideWorkspace}
              onChange={(v) => setState((s) => ({ ...s, autoApprove: { ...s.autoApprove, insideWorkspace: v } }))}
            />
            <Toggle
              label="Outside workspace folder"
              value={state.autoApprove.outsideWorkspace}
              onChange={(v) => setState((s) => ({ ...s, autoApprove: { ...s.autoApprove, outsideWorkspace: v } }))}
              warning={state.autoApprove.outsideWorkspace ? 'AI can read/write anywhere on your machine without asking.' : undefined}
            />
            <Toggle
              label="Shell commands"
              value={state.autoApprove.shell}
              onChange={(v) => setState((s) => ({ ...s, autoApprove: { ...s.autoApprove, shell: v } }))}
              warning={state.autoApprove.shell ? 'AI can run any shell command without asking.' : undefined}
            />
            <Toggle
              label="Computer use"
              value={state.autoApprove.computerUse}
              onChange={(v) => setState((s) => ({ ...s, autoApprove: { ...s.autoApprove, computerUse: v } }))}
            />
          </section>

          {/* Passcode */}
          <section>
            <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-2">Kill-switch passcode</div>
            <p className="text-xs text-neutral-500 mb-2">
              Required. Press <kbd className="px-1.5 py-0.5 text-[10px] bg-neutral-900 border border-neutral-800 rounded">Ctrl+Shift+Esc</kbd> any time to disable all tools.
              Re-enabling requires this passcode (protects against prompt-injection).
            </p>
            <input
              type="password"
              placeholder="New passcode (min 4 chars)"
              value={state.passcode}
              onChange={(e) => setState((s) => ({ ...s, passcode: e.target.value }))}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-700 mb-2"
            />
            <input
              type="password"
              placeholder="Confirm passcode"
              value={state.passcode2}
              onChange={(e) => setState((s) => ({ ...s, passcode2: e.target.value }))}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-700"
            />
          </section>

          {state.error && (
            <div className="px-3 py-2 bg-red-950/40 border border-red-900 rounded-md text-sm text-red-300">{state.error}</div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-800 flex justify-end gap-2 bg-neutral-950">
          <button
            type="button"
            onClick={submit}
            disabled={state.saving}
            className="px-4 py-2 bg-neutral-100 text-neutral-900 rounded-md text-sm font-medium hover:bg-white disabled:opacity-50"
          >
            {state.saving ? 'Saving…' : 'Save & enable'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle(props: { label: string; value: boolean; onChange: (v: boolean) => void; warning?: string }) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer">
      <input
        type="checkbox"
        checked={props.value}
        onChange={(e) => props.onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-neutral-100 focus:ring-0 focus:ring-offset-0"
      />
      <div className="flex-1">
        <div className="text-sm text-neutral-100">{props.label}</div>
        {props.warning && <div className="text-xs text-amber-400/80 mt-0.5">{props.warning}</div>}
      </div>
    </label>
  );
}
