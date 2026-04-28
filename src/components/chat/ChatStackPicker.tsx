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
import { Layers, X, ChevronDown, Loader2, Search, FileText } from 'lucide-react';
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

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
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
