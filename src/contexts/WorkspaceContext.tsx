'use client';

/**
 * WorkspaceContext
 * ----------------
 * Provides the IDE-panel state for the currently active chat conversation:
 *   - file list (from GET /workspace/{conversationId}/files)
 *   - active filename + its loaded content
 *   - dirty flag + debounced auto-save
 *   - per-file execution state (idle | running | done | error) and console output
 *
 * Why a context instead of Zustand: the rest of the app uses React Context
 * (useAuth, useTheme, useResponsive) and never imports Zustand. One conversation
 * is active at a time so a per-conversation keyed store would be overkill —
 * the provider re-keys itself whenever `conversationId` changes and the state
 * naturally scopes.
 *
 * Public API (via useWorkspace):
 *   files, activeFilename, activeFile, dirty[filename],
 *   output[filename], openFile, setContent, saveActive (manual),
 *   runActive, deleteFile, closeFile, refresh, ingestToolResult.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import workspaceApi, {
  EXECUTABLE_LANGUAGES,
  inferLanguageFromFilename,
  type WorkspaceFile,
  type WorkspaceFileSummary,
  type WorkspaceLanguage,
  type WorkspaceWriteRequest,
} from '@/lib/workspaceApi';

// ─── Console-output state per file ───────────────────────────────────────────

export interface WorkspaceOutputState {
  stdout: string;
  stderr: string;
  status: 'idle' | 'running' | 'done' | 'error' | 'timed_out';
  exitCode: number | null;
  durationMs: number | null;
}

const emptyOutput: WorkspaceOutputState = {
  stdout: '',
  stderr: '',
  status: 'idle',
  exitCode: null,
  durationMs: null,
};

// ─── Loaded file (mirror of WorkspaceFile, locally mutated by the editor) ────

interface LoadedFile {
  filename: string;
  content:  string;
  // Last server-known version of `content`. dirty = content !== serverContent.
  serverContent: string;
  meta: WorkspaceFile;
}

// ─── Context shape ───────────────────────────────────────────────────────────

interface WorkspaceContextValue {
  conversationId: string | null;

  files:       WorkspaceFileSummary[];
  loading:     boolean;
  error:       string | null;

  activeFilename: string | null;
  activeFile:     LoadedFile | null;

  output: Record<string, WorkspaceOutputState>;
  dirty:  Record<string, boolean>;
  /** Save state for the most recent auto-save attempt per file. */
  saving: Record<string, 'idle' | 'pending' | 'saved' | 'error'>;

  openFile:     (filename: string) => Promise<void>;
  closeFile:    () => void;
  setContent:   (content: string) => void;
  saveActive:   () => Promise<void>;
  resetActive:  () => void;
  runActive:    () => Promise<void>;
  stopActive:   () => void;
  deleteFile:   (filename: string) => Promise<void>;
  downloadActive: () => void;
  clearOutput:  (filename: string) => void;

  refresh:      () => Promise<void>;
  /** Called by the chat hook whenever a `workspace_*` tool-result lands.
   *  Apply optimistic update from the payload, then refresh the file list. */
  ingestToolResult: (toolName: string, output: unknown) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 600;

export function WorkspaceProvider({
  conversationId,
  children,
}: {
  conversationId: string | null;
  children: React.ReactNode;
}) {
  const [files, setFiles] = useState<WorkspaceFileSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeFilename, setActiveFilename] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<LoadedFile | null>(null);

  const [output, setOutput] = useState<Record<string, WorkspaceOutputState>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, 'idle' | 'pending' | 'saved' | 'error'>>({});

  // Debounce timer per filename.
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Reset everything whenever the conversation changes.
  useEffect(() => {
    setFiles([]);
    setActiveFilename(null);
    setActiveFile(null);
    setOutput({});
    setDirty({});
    setSaving({});
    setError(null);
    saveTimers.current.forEach((t) => clearTimeout(t));
    saveTimers.current.clear();
  }, [conversationId]);

  // ─── List refresh ─────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await workspaceApi.listFiles(conversationId);
      setFiles(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Initial fetch when a conversation is opened.
  useEffect(() => { refresh(); }, [refresh]);

  // ─── Open / close a file ──────────────────────────────────────────────────
  const openFile = useCallback(async (filename: string) => {
    if (!conversationId) return;
    setActiveFilename(filename);
    setError(null);
    try {
      const file = await workspaceApi.readFile(conversationId, filename);
      if (!file) {
        setError(`File ${filename} not found`);
        setActiveFile(null);
        return;
      }
      setActiveFile({
        filename: file.filename,
        content: file.content ?? '',
        serverContent: file.content ?? '',
        meta: file,
      });
      setDirty((d) => ({ ...d, [filename]: false }));
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to open ${filename}`);
    }
  }, [conversationId]);

  // When the file list changes, auto-open the first file if nothing is open.
  useEffect(() => {
    if (!activeFilename && files.length > 0) {
      void openFile(files[0].filename);
    }
    // If the active file was deleted server-side, drop the selection.
    if (activeFilename && !files.some((f) => f.filename === activeFilename)) {
      setActiveFilename(null);
      setActiveFile(null);
    }
  }, [files, activeFilename, openFile]);

  const closeFile = useCallback(() => {
    setActiveFilename(null);
    setActiveFile(null);
  }, []);

  // ─── Editor changes + debounced save ──────────────────────────────────────
  const flushSave = useCallback(async (filename: string, content: string) => {
    if (!conversationId) return;
    setSaving((s) => ({ ...s, [filename]: 'pending' }));
    try {
      const lang =
        activeFile?.meta.language ??
        inferLanguageFromFilename(filename);
      const body: WorkspaceWriteRequest = { content, language: lang, author: 'user' };
      const saved = await workspaceApi.writeFile(conversationId, filename, body);
      // Reconcile local state against server response.
      setActiveFile((prev) => {
        if (!prev || prev.filename !== filename) return prev;
        return {
          ...prev,
          serverContent: saved.content,
          meta: saved,
          // If the user kept typing during the in-flight save, the local
          // `content` is the source of truth; otherwise it equals saved.content.
        };
      });
      setFiles((list) => {
        const idx = list.findIndex((f) => f.filename === filename);
        const summary: WorkspaceFileSummary = {
          id: saved.id, filename: saved.filename, language: saved.language,
          version: saved.version, last_author: saved.last_author,
          created_at: saved.created_at, updated_at: saved.updated_at,
          size_bytes: saved.size_bytes,
        };
        if (idx === -1) return [...list, summary];
        const next = list.slice();
        next[idx] = summary;
        return next;
      });
      setDirty((d) => {
        // Recompute against the latest in-editor content; stay dirty if the
        // user typed more while the save was in flight.
        const editorContent = activeFile?.filename === filename ? activeFile.content : content;
        return { ...d, [filename]: editorContent !== saved.content };
      });
      setSaving((s) => ({ ...s, [filename]: 'saved' }));
    } catch (e) {
      setSaving((s) => ({ ...s, [filename]: 'error' }));
      setError(e instanceof Error ? e.message : 'Auto-save failed');
    }
  }, [conversationId, activeFile]);

  const scheduleSave = useCallback((filename: string, content: string) => {
    const existing = saveTimers.current.get(filename);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      saveTimers.current.delete(filename);
      void flushSave(filename, content);
    }, DEBOUNCE_MS);
    saveTimers.current.set(filename, t);
  }, [flushSave]);

  const setContent = useCallback((content: string) => {
    if (!activeFile) return;
    const filename = activeFile.filename;
    setActiveFile({ ...activeFile, content });
    setDirty((d) => ({ ...d, [filename]: content !== activeFile.serverContent }));
    scheduleSave(filename, content);
  }, [activeFile, scheduleSave]);

  const saveActive = useCallback(async () => {
    if (!activeFile) return;
    const t = saveTimers.current.get(activeFile.filename);
    if (t) { clearTimeout(t); saveTimers.current.delete(activeFile.filename); }
    await flushSave(activeFile.filename, activeFile.content);
  }, [activeFile, flushSave]);

  const resetActive = useCallback(() => {
    if (!activeFile) return;
    setActiveFile({ ...activeFile, content: activeFile.serverContent });
    setDirty((d) => ({ ...d, [activeFile.filename]: false }));
  }, [activeFile]);

  // ─── Run (streaming via SSE) ──────────────────────────────────────────────
  // For executable languages (python / javascript) we open the SSE endpoint
  // so the console fills in real-time. Backend line-buffers stdout/stderr
  // with a 50 ms idle flush, so prints from long scripts feel live.
  //
  // For everything else we fall back to the synchronous POST endpoint, which
  // also routes through the main sandbox that captures matplotlib / plotly
  // artifacts. SSE is intentionally leaner and does NOT surface artifacts.
  const streamCancelRef = useRef<Map<string, () => void>>(new Map());

  const runActive = useCallback(async () => {
    if (!conversationId || !activeFile) return;
    const filename = activeFile.filename;
    const lang = activeFile.meta.language;

    // Save first so the backend executes the latest content.
    if (activeFile.content !== activeFile.serverContent) {
      await saveActive();
    }

    // Reset console + flip to running.
    setOutput((o) => ({
      ...o,
      [filename]: { ...emptyOutput, status: 'running' },
    }));

    const useStream = EXECUTABLE_LANGUAGES.includes(lang as WorkspaceLanguage);
    if (!useStream) {
      // No streaming for non-executable languages; this branch will only ever
      // be hit if the UI's run-guard is bypassed.
      try {
        const result = await workspaceApi.executeFile(conversationId, filename);
        setOutput((o) => ({
          ...o,
          [filename]: {
            stdout: result.output ?? '',
            stderr: result.error ?? '',
            status: result.success ? 'done' : 'error',
            exitCode: result.exit_code ?? null,
            durationMs: result.execution_time_ms ?? null,
          },
        }));
      } catch (e) {
        setOutput((o) => ({
          ...o,
          [filename]: {
            ...emptyOutput,
            stderr: e instanceof Error ? e.message : 'Execution failed',
            status: 'error',
          },
        }));
      }
      return;
    }

    // ── SSE path ────────────────────────────────────────────────────────────
    // Cancel any prior run on the same file before starting a new one.
    const prevCancel = streamCancelRef.current.get(filename);
    if (prevCancel) { try { prevCancel(); } catch { /* */ } }

    const cancel = workspaceApi.streamExecuteFile(conversationId, filename, {
      onStdout: ({ text }) => {
        setOutput((o) => {
          const cur = o[filename] ?? { ...emptyOutput, status: 'running' as const };
          return { ...o, [filename]: { ...cur, stdout: cur.stdout + text } };
        });
      },
      onStderr: ({ text }) => {
        setOutput((o) => {
          const cur = o[filename] ?? { ...emptyOutput, status: 'running' as const };
          return { ...o, [filename]: { ...cur, stderr: cur.stderr + text } };
        });
      },
      onEnd: ({ success, exit_code, execution_time_ms, timed_out }) => {
        streamCancelRef.current.delete(filename);
        setOutput((o) => {
          const cur = o[filename] ?? { ...emptyOutput };
          return {
            ...o,
            [filename]: {
              ...cur,
              status: timed_out ? 'timed_out' : success ? 'done' : 'error',
              exitCode: exit_code,
              durationMs: execution_time_ms,
            },
          };
        });
      },
      onError: ({ message }) => {
        streamCancelRef.current.delete(filename);
        setOutput((o) => {
          const cur = o[filename] ?? { ...emptyOutput };
          return {
            ...o,
            [filename]: {
              ...cur,
              status: 'error',
              stderr: cur.stderr + (cur.stderr && !cur.stderr.endsWith('\n') ? '\n' : '') + message,
            },
          };
        });
      },
    });

    streamCancelRef.current.set(filename, cancel);
  }, [conversationId, activeFile, saveActive]);

  // Close any active stream when the conversation changes or component unmounts.
  useEffect(() => () => {
    streamCancelRef.current.forEach((cancel) => { try { cancel(); } catch { /* */ } });
    streamCancelRef.current.clear();
  }, [conversationId]);

  const stopActive = useCallback(() => {
    if (!activeFilename) return;
    const cancel = streamCancelRef.current.get(activeFilename);
    if (cancel) {
      try { cancel(); } catch { /* */ }
      streamCancelRef.current.delete(activeFilename);
    }
    setOutput((o) => {
      const cur = o[activeFilename];
      if (!cur || cur.status !== 'running') return o;
      return {
        ...o,
        [activeFilename]: {
          ...cur,
          status: 'error',
          stderr: cur.stderr + (cur.stderr && !cur.stderr.endsWith('\n') ? '\n' : '') + '[stopped by user]',
        },
      };
    });
  }, [activeFilename]);

  // ─── Delete ───────────────────────────────────────────────────────────────
  const deleteFile = useCallback(async (filename: string) => {
    if (!conversationId) return;
    try {
      await workspaceApi.deleteFile(conversationId, filename);
      setFiles((list) => list.filter((f) => f.filename !== filename));
      if (activeFilename === filename) {
        setActiveFilename(null);
        setActiveFile(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to delete ${filename}`);
    }
  }, [conversationId, activeFilename]);

  // ─── Download ─────────────────────────────────────────────────────────────
  const downloadActive = useCallback(() => {
    if (!activeFile) return;
    try {
      const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeFile.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* swallow */ }
  }, [activeFile]);

  const clearOutput = useCallback((filename: string) => {
    setOutput((o) => ({ ...o, [filename]: { ...emptyOutput } }));
  }, []);

  // ─── Tool-result ingestion ────────────────────────────────────────────────
  // Called by the chat hook whenever an assistant message yields a tool part
  // whose name starts with `workspace_`. Apply best-effort optimistic updates
  // (so the editor pops in instantly), then trigger a refresh to canonicalise.
  const ingestToolResult = useCallback((toolName: string, payload: unknown) => {
    if (!conversationId) return;
    const data = (payload ?? {}) as {
      file?: WorkspaceFile;
      files?: WorkspaceFileSummary[];
      filename?: string;
      output?: string;
      error?: string;
      exit_code?: number | null;
      execution_time_ms?: number | null;
      success?: boolean;
      // Auto-save mirror surfaced on execute_python results when the
      // executed source was substantive enough for the backend to keep.
      workspace_file?: {
        filename:    string;
        version:     number;
        language:    WorkspaceLanguage;
        size_bytes:  number;
        last_author: 'agent' | 'user' | 'system';
        auto_saved:  boolean;
      };
    };

    if (toolName === 'workspace_write_file' && data.file) {
      const file = data.file;
      setFiles((list) => {
        const idx = list.findIndex((f) => f.filename === file.filename);
        const summary: WorkspaceFileSummary = {
          id: file.id, filename: file.filename, language: file.language,
          version: file.version, last_author: file.last_author,
          created_at: file.created_at, updated_at: file.updated_at,
          size_bytes: file.size_bytes,
        };
        if (idx === -1) return [...list, summary];
        const next = list.slice();
        next[idx] = summary;
        return next;
      });
      // If this file is currently open and the user hasn't edited locally,
      // reflect the agent's new content immediately.
      setActiveFile((prev) => {
        if (!prev || prev.filename !== file.filename) return prev;
        if (prev.content !== prev.serverContent) return prev; // user dirty — don't clobber
        return { ...prev, content: file.content, serverContent: file.content, meta: file };
      });
      // If nothing is open, auto-select this file so the panel pops in.
      setActiveFilename((cur) => cur ?? file.filename);
    } else if (toolName === 'workspace_list_files' && Array.isArray(data.files)) {
      setFiles(data.files);
    } else if (toolName === 'workspace_execute_file' && data.filename) {
      setOutput((o) => ({
        ...o,
        [data.filename!]: {
          stdout: data.output ?? '',
          stderr: data.error ?? '',
          status: data.success ? 'done' : 'error',
          exitCode: data.exit_code ?? null,
          durationMs: data.execution_time_ms ?? null,
        },
      }));
    } else if (toolName === 'execute_python' && data.workspace_file) {
      // Backend silently mirrored the executed source into the workspace.
      // We don't have the full file content here (refresh() will fetch it),
      // but we can optimistically add the row to the list and auto-select it
      // so the IDE panel pops in immediately.
      const wf = data.workspace_file;
      setFiles((list) => {
        const idx = list.findIndex((f) => f.filename === wf.filename);
        const summary: WorkspaceFileSummary = {
          id: null,
          filename:    wf.filename,
          language:    wf.language,
          version:     wf.version,
          last_author: wf.last_author,
          created_at:  null,
          updated_at:  null,
          size_bytes:  wf.size_bytes,
        };
        if (idx === -1) return [...list, summary];
        const next = list.slice();
        // Preserve known timestamps from the existing summary; only the
        // mutable fields (version, size, author) change on a re-run.
        next[idx] = { ...next[idx], ...summary, created_at: next[idx].created_at };
        return next;
      });
      setActiveFilename((cur) => cur ?? wf.filename);
    }

    // Always reconcile against the server.
    void refresh();
  }, [conversationId, refresh]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    conversationId,
    files,
    loading,
    error,
    activeFilename,
    activeFile,
    output,
    dirty,
    saving,
    openFile,
    closeFile,
    setContent,
    saveActive,
    resetActive,
    runActive,
    stopActive,
    deleteFile,
    downloadActive,
    clearOutput,
    refresh,
    ingestToolResult,
  }), [
    conversationId, files, loading, error, activeFilename, activeFile, output,
    dirty, saving, openFile, closeFile, setContent, saveActive, resetActive,
    runActive, stopActive, deleteFile, downloadActive, clearOutput, refresh,
    ingestToolResult,
  ]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used inside <WorkspaceProvider>');
  }
  return ctx;
}

/** Like useWorkspace, but returns null instead of throwing — handy for
 *  components that may render with or without a provider above them. */
export function useWorkspaceOptional(): WorkspaceContextValue | null {
  return useContext(WorkspaceContext);
}
