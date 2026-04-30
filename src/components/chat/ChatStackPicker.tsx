'use client';

/**
 * ChatStackPicker — Dropdown + chip for attaching a Knowledge Stack to chat.
 *
 * Behaviour (per Section 4.2 of KNOWLEDGE_STACKS_GUIDE.md):
 *  - Lists user's stacks via GET /stacks
 *  - When a stack is selected, parent stores the selection
 *  - Two retrieval modes: RAG (default) or Full Content
 *  - The actual context fetch happens at send time via the helper exported here.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Layers, X, ChevronDown, ChevronRight, Loader2, Search, FileText, Database } from 'lucide-react';
import stacksApi from '@/lib/stacksApi';
import type {
  KnowledgeStack,
  StackContextRagResponse,
  StackContextFullResponse,
} from '@/types/stacks';

export type StackMode = 'rag' | 'full_content';

export interface AttachedStack {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  document_count: number;
  total_chunks: number;
  mode: StackMode;
}

// ─── Picker dropdown ─────────────────────────────────────────────────────────

export function ChatStackPickerButton({
  attachedStack,
  onAttach,
  onDetach,
  onChangeMode,
  isDark,
}: {
  attachedStack: AttachedStack | null;
  onAttach: (s: AttachedStack) => void;
  onDetach: () => void;
  onChangeMode: (mode: StackMode) => void;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [stacks, setStacks] = useState<KnowledgeStack[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number; openUp: boolean }>({
    top: 0,
    left: 0,
    openUp: true,
  });

  // Compute anchor position whenever opened (and on resize/scroll)
  useEffect(() => {
    if (!open) return;
    const compute = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const PANEL_W = 320;
      const PANEL_H = 380;
      const margin = 8;
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceAbove >= PANEL_H + margin || spaceAbove > spaceBelow;
      let left = rect.left;
      // Keep panel within viewport horizontally
      if (left + PANEL_W > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - PANEL_W - margin);
      }
      const top = openUp
        ? Math.max(margin, rect.top - PANEL_H - margin)
        : Math.min(window.innerHeight - PANEL_H - margin, rect.bottom + margin);
      setAnchor({ top, left, openUp });
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [open]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await stacksApi.list();
      setStacks(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // Close on outside click — also accounts for the portal panel which lives outside `ref`
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inWrapper = ref.current && ref.current.contains(target);
      const panelEl = (ref as any).__panelEl as HTMLElement | undefined;
      const inPanel = panelEl && panelEl.contains(target);
      if (!inWrapper && !inPanel) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = filter
    ? stacks.filter(
        (s) =>
          s.name.toLowerCase().includes(filter.toLowerCase()) ||
          (s.description || '').toLowerCase().includes(filter.toLowerCase()),
      )
    : stacks;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Attach a Knowledge Stack"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 9px',
          height: 28,
          borderRadius: 7,
          border: 'none',
          background: attachedStack ? 'rgba(254,192,15,0.14)' : 'transparent',
          color: attachedStack ? '#FEC00F' : isDark ? '#9E9E9E' : '#666',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 500,
          fontFamily: 'inherit',
          position: 'relative',
        }}
      >
        <Layers size={15} />
        {attachedStack && (
          <span style={{ fontSize: 11, fontWeight: 600 }}>Stack</span>
        )}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={(el) => {
            // Make outside-click handler aware of the portal panel
            if (el && ref.current) {
              // attach panel as a sibling node ref via dataset; outside-click checks ref.current.contains
              // Since portal escapes the wrapper, augment the handler by also testing this element.
              (ref as any).__panelEl = el;
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: anchor.top,
            left: anchor.left,
            width: 320,
            maxHeight: 380,
            background: isDark ? '#1E1E1E' : '#FFFFFF',
            border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`,
            borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: `1px solid ${isDark ? '#2E2E2E' : '#E5E5E5'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Layers size={14} color="#FEC00F" />
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: isDark ? '#FFF' : '#212121',
              }}
            >
              ATTACH STACK
            </span>
          </div>

          {/* search */}
          <div
            style={{
              padding: 8,
              borderBottom: `1px solid ${isDark ? '#2E2E2E' : '#E5E5E5'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Search size={12} color={isDark ? '#666' : '#999'} />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter stacks…"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: isDark ? '#E8E8E8' : '#1A1A1A',
                fontSize: 12.5,
              }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: 24,
                  color: isDark ? '#9E9E9E' : '#666',
                  fontSize: 12,
                }}
              >
                <Loader2 size={14} className="animate-spin" />
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div
                style={{
                  padding: 22,
                  textAlign: 'center',
                  fontSize: 12,
                  color: isDark ? '#9E9E9E' : '#666',
                }}
              >
                {stacks.length === 0
                  ? 'No stacks yet. Create one in the Stacks page.'
                  : 'No stacks match your filter.'}
              </div>
            ) : (
              filtered.map((s) => {
                const isAttached = attachedStack?.id === s.id;
                const accent = s.color || '#FEC00F';
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (isAttached) {
                        onDetach();
                      } else {
                        onAttach({
                          id: s.id,
                          name: s.name,
                          icon: s.icon,
                          color: s.color,
                          document_count: s.document_count,
                          total_chunks: s.total_chunks,
                          mode: 'rag',
                        });
                      }
                      setOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      background: isAttached ? 'rgba(254,192,15,0.08)' : 'transparent',
                      border: 'none',
                      borderLeft: `3px solid ${isAttached ? '#FEC00F' : 'transparent'}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: isDark ? '#E8E8E8' : '#1A1A1A',
                    }}
                    onMouseEnter={(e) => {
                      if (!isAttached)
                        e.currentTarget.style.background = isDark
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(0,0,0,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isAttached) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: `${accent}22`,
                        border: `1px solid ${accent}55`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {s.icon || '📊'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 12.5,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {s.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10.5,
                          color: isDark ? '#888' : '#888',
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        {s.document_count} docs · {s.total_chunks} chunks
                      </div>
                    </div>
                    {isAttached && (
                      <span
                        style={{
                          fontSize: 9,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: '#FEC00F',
                          color: '#000',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                        }}
                      >
                        ATTACHED
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

// ─── In-message badge: shows attached stack + dropdown chain of sources used ──

export interface StackMessageMeta {
  stack: { id: string; name: string; icon?: string | null; color?: string | null; mode: StackMode };
  sources: Array<{ document_title?: string; document_filename?: string; chunk_index?: number }>;
  chunkCount: number;
}

export function MessageStackBadge({
  meta,
  isDark,
}: {
  meta: StackMessageMeta;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const accent = meta.stack.color || '#FEC00F';
  const count = meta.chunkCount || meta.sources.length;
  const modeLabel = meta.stack.mode === 'full_content' ? 'Full content' : 'RAG';

  // Group sources by document for a tidier chain
  const grouped = React.useMemo(() => {
    const m = new Map<string, Array<number | undefined>>();
    for (const s of meta.sources) {
      const key = s.document_filename || s.document_title || 'document';
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(s.chunk_index);
    }
    return Array.from(m.entries());
  }, [meta.sources]);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px 4px 6px',
          borderRadius: 999,
          background: `${accent}14`,
          border: `1px solid ${accent}55`,
          color: isDark ? '#E8E8E8' : '#1A1A1A',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
        title={`Knowledge stack used: ${meta.stack.name} (${modeLabel})`}
      >
        <Layers size={11} color={accent} />
        <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {meta.stack.name}
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, color: isDark ? '#9aa0a6' : '#666', fontWeight: 500 }}>
          · {count} {meta.stack.mode === 'full_content' ? 'docs' : 'chunks'}
        </span>
        <ChevronRight
          size={11}
          style={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
            opacity: 0.7,
          }}
        />
      </button>
      {open && (
        <div
          style={{
            background: isDark ? '#161618' : '#FFFFFF',
            border: `1px solid ${isDark ? '#2A2A2E' : '#E5E5E7'}`,
            borderRadius: 10,
            padding: '8px 10px',
            maxWidth: 360,
            boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: isDark ? '#9aa0a6' : '#666',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Database size={11} color={accent} />
            Retrieved via {modeLabel}
          </div>
          {grouped.length === 0 ? (
            <div style={{ fontSize: 11, color: isDark ? '#888' : '#777' }}>No sources returned.</div>
          ) : (
            <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {grouped.map(([doc, chunks], i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 11.5,
                    color: isDark ? '#D8D8D8' : '#1A1A1A',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{doc}</span>
                  {meta.stack.mode !== 'full_content' && chunks.some((c) => c !== undefined) && (
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10,
                        color: isDark ? '#888' : '#888',
                        marginLeft: 6,
                      }}
                    >
                      chunks: {chunks.filter((c) => c !== undefined).join(', ')}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Chip rendered above the composer ────────────────────────────────────────

export function AttachedStackChip({
  stack,
  onDetach,
  onChangeMode,
  isDark,
}: {
  stack: AttachedStack;
  onDetach: () => void;
  onChangeMode: (mode: StackMode) => void;
  isDark: boolean;
}) {
  const accent = stack.color || '#FEC00F';
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 5px 5px 10px',
        borderRadius: 999,
        background: `${accent}14`,
        border: `1px solid ${accent}55`,
        fontSize: 12,
        color: isDark ? '#E8E8E8' : '#1A1A1A',
        maxWidth: '100%',
      }}
    >
      <span style={{ fontSize: 14 }}>{stack.icon || '📊'}</span>
      <span
        style={{
          fontWeight: 600,
          maxWidth: 180,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {stack.name}
      </span>
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          color: isDark ? '#888' : '#888',
        }}
      >
        {stack.document_count} docs
      </span>
      {/* Mode toggle */}
      <div
        style={{
          display: 'inline-flex',
          background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.6)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          borderRadius: 999,
          padding: 2,
          gap: 0,
        }}
      >
        {(['rag', 'full_content'] as StackMode[]).map((m) => {
          const active = stack.mode === m;
          return (
            <button
              key={m}
              onClick={() => onChangeMode(m)}
              type="button"
              style={{
                background: active ? accent : 'transparent',
                color: active ? '#000' : isDark ? '#bbb' : '#555',
                border: 'none',
                borderRadius: 999,
                padding: '2px 9px',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
              title={
                m === 'rag'
                  ? 'RAG: top-K relevant chunks per question'
                  : 'Full content: prepend every doc'
              }
            >
              {m === 'rag' ? 'RAG' : 'Full'}
            </button>
          );
        })}
      </div>
      <button
        onClick={onDetach}
        type="button"
        title="Detach stack"
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: isDark ? '#888' : '#888',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ─── Helper: fetch context and produce a system-style preamble ───────────────

/**
 * Build a system-style context preamble from a stack for a given user message.
 * Returns the preamble text (or empty string on failure / empty stack).
 */
export async function buildStackContextPreamble(
  stack: AttachedStack,
  userMessage: string,
  defaultLimit = 20,
): Promise<{ preamble: string; sources: Array<{ document_title?: string; document_filename?: string; chunk_index?: number }> }> {
  try {
    if (stack.mode === 'full_content') {
      const ctx = (await stacksApi.getContext(stack.id, {
        full_content: true,
      })) as StackContextFullResponse;
      if (!ctx.documents || ctx.documents.length === 0) {
        return { preamble: '', sources: [] };
      }
      const body = ctx.documents
        .map(
          (d, i) =>
            `[${i + 1}] ${d.filename}${d.title && d.title !== d.filename ? ` — ${d.title}` : ''}:\n${d.content}`,
        )
        .join('\n\n');
      const preamble =
        `You have access to the following full document contents from the user's "${ctx.stack_name}" knowledge stack:\n\n` +
        body +
        `\n\nCite documents inline (e.g. [1], [2]) when you use them.\n`;
      return {
        preamble,
        sources: ctx.documents.map((d) => ({
          document_title: d.title,
          document_filename: d.filename,
        })),
      };
    }

    // RAG mode
    const ctx = (await stacksApi.getContext(stack.id, {
      query: userMessage,
      limit: defaultLimit,
    })) as StackContextRagResponse;
    if (!ctx.chunks || ctx.chunks.length === 0) {
      return { preamble: '', sources: [] };
    }
    const body = ctx.chunks
      .map(
        (c, i) =>
          `[${i + 1}] ${c.document_filename || c.document_title || 'document'} (chunk ${c.chunk_index}):\n${c.content}`,
      )
      .join('\n\n');
    const preamble =
      `You have access to the following relevant context retrieved from the user's "${ctx.stack_name}" knowledge stack:\n\n` +
      body +
      `\n\nCite documents inline (e.g. [1], [2]) when you use them.\n`;
    return {
      preamble,
      sources: ctx.chunks.map((c) => ({
        document_title: c.document_title,
        document_filename: c.document_filename,
        chunk_index: c.chunk_index,
      })),
    };
  } catch {
    return { preamble: '', sources: [] };
  }
}
