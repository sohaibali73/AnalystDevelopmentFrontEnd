'use client';

/**
 * StudioChatPane — chat surface bound to the project's conversation_id.
 *
 *   - Reuses the same /api/chat → /chat/agent stream as the main chat.
 *   - Renders text via streamdown (MessageResponse), tools via tool-registry.
 *   - Supports file uploads via /api/upload?conversationId=...
 *   - YANG branding: "YANG" name + indigo ring avatar.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Wand2, Mic2, Paperclip, X, Loader2, FileText, ImageIcon, ArrowDown } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { toast } from 'sonner';
import { studioTheme as T } from './theme';
import { studioApi, emitStudioRefresh, type StudioProject } from '@/lib/studioApi';
import { Spinner, StudioBadge } from './StudioPrimitives';
import { MessageResponse } from '@/components/ai-elements/message';
import { renderToolPart, isToolPart } from '@/components/chat/tool-registry';
import { ChatFilePreviewModal } from '@/components/chat/ChatFilePreviewModal';
import { API_BASE_URL_CHAT, type ChatPreviewFile } from '@/components/chat/chat-utils';

interface Props {
  project: StudioProject;
  onChatFinished: () => void;
}

interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  type: string;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

export function StudioChatPane({ project, onChatFinished }: Props) {
  const [input, setInput] = useState('');
  const [autoApply, setAutoApply] = useState<boolean>(!!project.humanize_settings?.auto_apply);
  const [humanizing, setHumanizing] = useState(false);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [filenameToId, setFilenameToId] = useState<Record<string, string>>({});
  const [previewFile, setPreviewFile] = useState<ChatPreviewFile | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string>(project.conversation_id);

  // ── Load conversation file map (filename → file_id) ──────────────────
  const loadConversationFiles = useCallback(async () => {
    try {
      const t = getAuthToken();
      const res = await fetch(
        `${API_BASE_URL_CHAT}/upload/conversations/${project.conversation_id}/files`,
        { headers: t ? { Authorization: `Bearer ${t}` } : {} },
      );
      if (!res.ok) return;
      const data = await res.json();
      const arr: any[] = Array.isArray(data) ? data : data?.files ?? [];
      const map: Record<string, string> = {};
      for (const f of arr) {
        const fn = f.filename || f.name;
        const id = f.id || f.file_id;
        if (fn && id) map[fn] = id;
      }
      setFilenameToId((prev) => ({ ...prev, ...map }));
    } catch {
      /* swallow */
    }
  }, [project.conversation_id]);

  useEffect(() => {
    loadConversationFiles();
  }, [loadConversationFiles]);

  const { messages, sendMessage, status, setMessages, error, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      headers: (): Record<string, string> => {
        const t = getAuthToken();
        return t ? { Authorization: `Bearer ${t}` } : {};
      },
      body: () => ({
        conversationId: conversationIdRef.current,
      }),
    }),
    onFinish: () => {
      emitStudioRefresh('project', project.id);
      onChatFinished();
      loadConversationFiles();
    },
  });

  // ── Load existing conversation messages ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiBase = (await import('@/lib/env')).getApiUrl();
        const t = getAuthToken();
        const res = await fetch(
          `${apiBase}/chat/conversations/${project.conversation_id}/messages`,
          { headers: t ? { Authorization: `Bearer ${t}` } : {} },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const arr: any[] = Array.isArray(data) ? data : data?.messages ?? [];
        if (arr.length === 0) return;
        const mapped = arr.map((m: any, i: number) => ({
          id: m.id || `m-${i}`,
          role: m.role,
          parts: [{ type: 'text', text: typeof m.content === 'string' ? m.content : '' }],
        }));
        setMessages(mapped as any);
      } catch {
        /* swallow */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project.conversation_id, setMessages]);

  // ── Auto-scroll on new messages ──────────────────────────────────────
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 240;
    if (nearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length, status]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > 280);
  }

  // ── Send message ─────────────────────────────────────────────────────
  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if ((!input.trim() && attachments.length === 0) || status === 'streaming') return;

    let text = input.trim();
    if (attachments.length > 0) {
      const refs = attachments
        .map((a) => `[Attached: ${a.filename}]`)
        .join('\n');
      text = text ? `${refs}\n\n${text}` : refs;
    }

    setInput('');
    setAttachments([]);
    sendMessage({ role: 'user', parts: [{ type: 'text', text }] } as any);
  }

  // ── File upload ──────────────────────────────────────────────────────
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const t = getAuthToken();
        const res = await fetch(
          `/api/upload?conversationId=${project.conversation_id}`,
          {
            method: 'POST',
            headers: t ? { Authorization: `Bearer ${t}` } : {},
            body: fd,
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Upload failed: ${res.status}`);
        }
        const j = await res.json();
        const fname = j.filename || file.name;
        const fid = j.id || j.file_id || `f-${Date.now()}`;
        setAttachments((prev) => [
          ...prev,
          {
            id: fid,
            filename: fname,
            size: j.size || file.size,
            type: j.content_type || file.type || 'application/octet-stream',
          },
        ]);
        if (j.id || j.file_id) {
          setFilenameToId((prev) => ({ ...prev, [fname]: j.id || j.file_id }));
        }
      }
      toast.success(`Uploaded ${files.length} file${files.length > 1 ? 's' : ''}`);
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  // ── Humanize last reply ──────────────────────────────────────────────
  async function handleHumanizeLast() {
    const last = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!last) {
      toast.error('No reply from YANG to humanize yet.');
      return;
    }
    const text =
      (last.parts as any[])
        ?.filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join('') || '';
    if (!text.trim()) {
      toast.error('Last reply has no text content.');
      return;
    }
    setHumanizing(true);
    try {
      const r = await studioApi.humanize({
        text,
        intensity: project.humanize_settings?.intensity ?? 'standard',
        seo_target: project.humanize_settings?.seo_target ?? null,
        style_profile_id: project.style_profile_id,
        project_id: project.id,
        preserve_facts: project.humanize_settings?.preserve_facts ?? true,
      });
      setMessages([
        ...messages,
        {
          id: `hum-${Date.now()}`,
          role: 'assistant',
          parts: [{ type: 'text', text: `**Humanized:**\n\n${r.output}` }],
        } as any,
      ]);
      toast.success(`Humanized · AI score ${Math.round((r.scores?.ai_detection ?? 0) * 100)}%`);
    } catch (e: any) {
      toast.error(e?.message || 'Humanize failed');
    } finally {
      setHumanizing(false);
    }
  }

  async function handleToggleAutoApply() {
    const next = !autoApply;
    setAutoApply(next);
    try {
      await studioApi.patchProject(project.id, {
        humanize_settings: {
          ...project.humanize_settings,
          enabled: next || project.humanize_settings?.enabled,
          auto_apply: next,
        } as any,
      });
    } catch {
      toast.error('Failed to update settings');
      setAutoApply(!next);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: T.bgChat,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient backdrop */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -160,
          left: -80,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(99,102,241,0.12), rgba(99,102,241,0) 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: -160,
          right: -80,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(245,158,11,0.10), rgba(245,158,11,0) 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Banner */}
      {(project.style_profile_id || autoApply) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderBottom: `1px solid ${T.border}`,
            background: T.bgRaised,
            flexWrap: 'wrap',
          }}
        >
          {project.style_profile_id && (
            <StudioBadge color="indigo">
              <Mic2 size={9} /> Voice attached
            </StudioBadge>
          )}
          {autoApply && (
            <StudioBadge color="gold">
              <Wand2 size={9} /> Auto-humanize
            </StudioBadge>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="studio-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {messages.length === 0 && status !== 'streaming' && (
          <EmptyState kind={project.kind} />
        )}
        {messages.map((m) => (
          <ChatMessage
            key={m.id}
            message={m}
            conversationId={conversationIdRef.current}
            isStreaming={status === 'streaming' && m === messages[messages.length - 1]}
            filenameToId={filenameToId}
            onPreview={(f) => setPreviewFile(f)}
          />
        ))}
        {status === 'streaming' &&
          (messages.length === 0 || messages[messages.length - 1].role !== 'assistant') && (
            <YangThinking />
          )}
        {error && (
          <div
            style={{
              padding: 14,
              background: T.errorDim,
              border: `1px solid ${T.errorBorder}`,
              borderRadius: 12,
              fontSize: 13,
              color: T.error,
              fontFamily: T.font,
            }}
          >
            {String((error as any)?.message ?? error)}
          </div>
        )}
      </div>

      {showJump && (
        <button
          onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
          style={{
            position: 'absolute',
            bottom: 180,
            right: 22,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: T.bgRaised,
            border: `1px solid ${T.borderHover}`,
            color: T.text,
            cursor: 'pointer',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: T.shadowDeep,
            animation: 'studio-fadein 0.15s ease-out',
          }}
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={16} />
        </button>
      )}

      {/* Footer toolbar */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          padding: '10px 18px',
          borderTop: `1px solid ${T.border}`,
          background: T.bg,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <ToolBtn onClick={handleHumanizeLast} disabled={humanizing || status === 'streaming'}>
          {humanizing ? <Spinner size={11} /> : <Wand2 size={11} />}
          <span>Humanize last reply</span>
        </ToolBtn>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            cursor: 'pointer',
            color: T.textMuted,
            fontSize: 11,
            fontFamily: T.fontMono,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            borderRadius: 6,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.textMuted)}
        >
          <input
            type="checkbox"
            checked={autoApply}
            onChange={handleToggleAutoApply}
            style={{ accentColor: T.accent }}
          />
          Auto-apply
        </label>
      </div>

      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '8px 18px',
            borderTop: `1px solid ${T.border}`,
            background: T.bg,
            flexWrap: 'wrap',
          }}
        >
          {attachments.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px 4px 10px',
                background: T.bgRaised,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                fontSize: 12,
                color: T.text,
                fontFamily: T.font,
              }}
            >
              <FileText size={12} color={T.accent} />
              <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.filename}
              </span>
              <button
                onClick={() => removeAttachment(a.id)}
                style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', padding: 2 }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: 14,
          borderTop: `1px solid ${T.border}`,
          background: T.bg,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
            background: T.bgInput,
            border: `1px solid ${input.trim() || attachments.length ? T.accentBorder : T.inputBorder}`,
            borderRadius: 16,
            padding: 10,
            transition: 'all 0.15s ease',
            boxShadow:
              input.trim() || attachments.length
                ? `0 0 0 3px ${T.accentDim}, 0 8px 24px rgba(0,0,0,0.3)`
                : '0 4px 16px rgba(0,0,0,0.25)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept=".pdf,.docx,.txt,.md,.csv,.xlsx,.png,.jpg,.jpeg"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Attach files"
            style={{
              width: 34,
              height: 34,
              flexShrink: 0,
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              color: T.textMuted,
              cursor: uploading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.bgCardHover;
              e.currentTarget.style.color = T.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = T.textMuted;
            }}
          >
            {uploading ? <Loader2 size={16} className="studio-spin" /> : <Paperclip size={16} />}
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={
              project.kind === 'pptx'
                ? 'Ask YANG to build slides…'
                : project.kind === 'docx'
                ? 'Ask YANG to draft a document…'
                : 'Ask YANG anything…'
            }
            rows={1}
            disabled={status === 'streaming'}
            style={{
              flex: 1,
              minHeight: 36,
              maxHeight: 200,
              resize: 'none',
              padding: '7px 4px',
              background: 'transparent',
              color: T.text,
              border: 'none',
              fontFamily: T.font,
              fontSize: 14,
              lineHeight: 1.5,
              letterSpacing: '-0.01em',
              outline: 'none',
            }}
          />
          {status === 'streaming' ? (
            <button
              type="button"
              onClick={() => stop()}
              style={{
                padding: '8px 14px',
                background: T.errorDim,
                color: T.error,
                border: `1px solid ${T.errorBorder}`,
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: T.font,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() && attachments.length === 0}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: input.trim() || attachments.length ? T.accent : T.bgRaised,
                color: input.trim() || attachments.length ? '#0A0A0B' : T.textMuted,
                border: 'none',
                cursor: input.trim() || attachments.length ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                boxShadow: input.trim() || attachments.length ? `0 4px 16px ${T.accentGlow}` : 'none',
              }}
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          )}
        </div>
      </form>

      {previewFile && (
        <ChatFilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          isDark
        />
      )}
    </div>
  );
}

// ─── Message rendering ────────────────────────────────────────────────

function ChatMessage({
  message,
  conversationId,
  isStreaming,
  filenameToId,
  onPreview,
}: {
  message: any;
  conversationId: string;
  isStreaming: boolean;
  filenameToId: Record<string, string>;
  onPreview: (f: ChatPreviewFile) => void;
}) {
  const isUser = message.role === 'user';
  const parts: any[] = Array.isArray(message.parts) ? message.parts : [];

  // Deduplicate tool parts by toolCallId
  const seen = new Map<string, number>();
  parts.forEach((p, i) => {
    if (isToolPart(p?.type) && p?.toolCallId) {
      seen.set(p.toolCallId, i);
    }
  });

  if (isUser) {
    const rawText = parts.filter((p) => p.type === 'text').map((p) => p.text).join('');
    // Extract attachments and strip system blocks for clean display
    const attachments: string[] = [];
    let cleaned = rawText.replace(/\[Attached:\s*([^\]]+)\]/g, (_m, fn) => {
      attachments.push(String(fn).trim());
      return '';
    });
    // Strip [FORMATTING: ...] blocks (single or multi-line, even unterminated)
    cleaned = cleaned
      .replace(/\[FORMATTING:[\s\S]*?\]/g, '')
      .replace(/\[FORMATTING:[\s\S]*$/g, '')
      // Strip other system-style bracket directives at the very start of a line
      .replace(/^\s*\[(?:SYSTEM|INSTRUCTIONS?|CONTEXT):[\s\S]*?\]\s*/gim, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div
          style={{
            maxWidth: '85%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 8,
          }}
        >
          {attachments.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
              }}
            >
              {attachments.map((fn, i) => {
                const fileId = filenameToId[fn];
                return (
                  <AttachmentChip
                    key={i}
                    filename={fn}
                    onClick={
                      fileId
                        ? () => onPreview({ fileId, filename: fn })
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )}
          {cleaned && (
            <div
              style={{
                background: T.accentDim,
                border: `1px solid ${T.accentBorder}`,
                borderRadius: 14,
                padding: '12px 16px',
                fontSize: 14,
                lineHeight: 1.55,
                color: T.text,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: T.font,
                letterSpacing: '-0.01em',
                boxShadow: `0 1px 0 rgba(255,255,255,0.04)`,
              }}
            >
              {cleaned}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant — YANG
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <YangAvatar streaming={isStreaming} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <YangBrand streaming={isStreaming} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {parts.map((p, i) => {
            if (p.type === 'text') {
              return p.text ? (
                <div
                  key={i}
                  style={{
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: T.text,
                    fontFamily: T.font,
                    letterSpacing: '-0.01em',
                    background: T.bgCard,
                    border: `1px solid ${T.border}`,
                    borderRadius: 14,
                    padding: '14px 18px',
                    boxShadow: T.shadowCard,
                  }}
                  className="studio-prose"
                >
                  <MessageResponse>{p.text}</MessageResponse>
                </div>
              ) : null;
            }
            if (isToolPart(p.type) && p.toolCallId) {
              // Skip earlier duplicates
              if (seen.get(p.toolCallId) !== i) return null;
              try {
                return renderToolPart(p, i, message.id, conversationId);
              } catch {
                return null;
              }
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Attachment chip (in-message) ─────────────────────────────────────

function AttachmentChip({ filename, onClick }: { filename: string; onClick?: () => void }) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
  const isPdf = ext === 'pdf';
  const isDoc = ['doc', 'docx', 'rtf', 'txt', 'md'].includes(ext);
  const isSheet = ['csv', 'xls', 'xlsx'].includes(ext);
  const isSlide = ['ppt', 'pptx', 'key'].includes(ext);

  const meta = isImage
    ? { color: '#34D399', label: 'Image' }
    : isPdf
    ? { color: '#F87171', label: 'PDF' }
    : isSheet
    ? { color: '#60A5FA', label: 'Sheet' }
    : isSlide
    ? { color: '#FB923C', label: 'Slides' }
    : isDoc
    ? { color: '#A78BFA', label: 'Doc' }
    : { color: T.accent, label: 'File' };

  const Icon = isImage ? ImageIcon : FileText;

  const clickable = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      title={clickable ? `Preview ${filename}` : filename}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px 8px 8px',
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        boxShadow: T.shadowCard,
        maxWidth: 260,
        cursor: clickable ? 'pointer' : 'default',
        textAlign: 'left',
        fontFamily: T.font,
        color: T.text,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!clickable) return;
        e.currentTarget.style.borderColor = `${meta.color}55`;
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${meta.color}22, 0 0 0 1px ${meta.color}30`;
      }}
      onMouseLeave={(e) => {
        if (!clickable) return;
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = T.shadowCard;
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${meta.color}18`,
          border: `1px solid ${meta.color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 0 12px ${meta.color}25, inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        <Icon size={15} color={meta.color} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.2 }}>
        <span
          style={{
            fontFamily: T.font,
            fontSize: 12.5,
            fontWeight: 600,
            color: T.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 200,
            letterSpacing: '-0.01em',
          }}
        >
          {filename}
        </span>
        <span
          style={{
            fontFamily: T.fontMono,
            fontSize: 9,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: meta.color,
            marginTop: 2,
            fontWeight: 600,
          }}
        >
          {clickable ? `${meta.label} · Click to preview` : meta.label}
        </span>
      </div>
    </button>
  );
}

function YangAvatar({ streaming = false }: { streaming?: boolean }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 36,
        height: 36,
        flexShrink: 0,
      }}
    >
      {/* Orbiting ring */}
      {streaming && (
        <div
          style={{
            position: 'absolute',
            inset: -3,
            borderRadius: '50%',
            background: `conic-gradient(from 0deg, transparent 0deg, ${T.accent2} 90deg, transparent 180deg, ${T.accent} 270deg, transparent 360deg)`,
            animation: 'studio-orbit 1.6s linear infinite',
            filter: 'blur(0.5px)',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: T.bg,
          border: `1.5px solid ${T.accent2}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: streaming
            ? `0 0 18px ${T.accent2}, 0 0 0 1px ${T.bg}`
            : `0 0 12px ${T.accent2Glow}`,
          overflow: 'hidden',
          padding: 5,
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <img
          src="/potomac-icon.png"
          alt="YANG"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 4px rgba(99,102,241,0.45))',
          }}
        />
      </div>
    </div>
  );
}

function YangBrand({ streaming = false }: { streaming?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: T.text,
            lineHeight: 1,
          }}
        >
          YANG
        </span>
        <span
          style={{
            fontFamily: T.fontMono,
            fontSize: 8.5,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: T.accent2,
            lineHeight: 1,
            opacity: 0.85,
            transform: 'translateY(-1px)',
          }}
        >
          DESIGN
        </span>
      </div>
      {streaming && <StreamingBars />}
    </div>
  );
}

function StreamingBars() {
  // Larger, more visible flagship streaming bars — sits below "YANG DESIGN"
  const delays = [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.32, 0.24, 0.16, 0.08];
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        height: 24,
        padding: '4px 10px',
        background: 'rgba(245,158,11,0.06)',
        border: '1px solid rgba(245,158,11,0.18)',
        borderRadius: 999,
        width: 'fit-content',
        boxShadow: `0 0 16px rgba(245,158,11,0.12)`,
      }}
    >
      {delays.map((d, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: 3,
            height: 16,
            borderRadius: 2,
            background: `linear-gradient(180deg, ${T.accent} 0%, ${T.accent2} 100%)`,
            transformOrigin: 'center',
            animation: `studio-wave 1.1s ${d}s ease-in-out infinite`,
          }}
        />
      ))}
      <span
        style={{
          fontFamily: T.fontMono,
          fontSize: 9.5,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: T.accent,
          marginLeft: 6,
          fontWeight: 600,
        }}
      >
        Designing
      </span>
    </div>
  );
}

function YangThinking() {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <YangAvatar streaming />
      <div style={{ flex: 1, paddingTop: 4 }}>
        <YangBrand streaming />
        <span
          className="studio-shimmer-text"
          style={{
            fontFamily: T.font,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}
        >
          Thinking…
        </span>
      </div>
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        background: 'transparent',
        color: T.textMuted,
        border: `1px solid transparent`,
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontSize: 11,
        fontFamily: T.fontMono,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = T.bgCardHover;
        e.currentTarget.style.borderColor = T.borderHover;
        e.currentTarget.style.color = T.text;
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
        e.currentTarget.style.color = T.textMuted;
      }}
    >
      {children}
    </button>
  );
}

function EmptyState({ kind }: { kind: 'pptx' | 'docx' | 'chat' }) {
  const examples =
    kind === 'pptx'
      ? [
          'Build a 10-slide pitch deck for an AI healthcare startup',
          'Generate a Q1 outlook with market sizing and 3-year P&L',
          'Make a fund deck with track record and case studies',
        ]
      : kind === 'docx'
      ? [
          'Draft a 2-page investment memo for Acme Corp',
          'Write a quarterly newsletter for our limited partners',
          'Generate a research report on the AI infrastructure market',
        ]
      : [
          'Help me brainstorm ideas',
          'Summarize this document',
          'Research a company',
        ];

  return (
    <div
      style={{
        padding: '40px 24px',
        textAlign: 'center',
        animation: 'studio-fadein 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <YangAvatar />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14, marginBottom: 4 }}>
        <YangBrand />
      </div>
      <h3
        style={{
          fontFamily: T.fontDisplay,
          fontSize: 24,
          fontWeight: 700,
          color: T.text,
          letterSpacing: '-0.02em',
          margin: '8px 0 6px',
        }}
      >
        How can YANG help?
      </h3>
      <p style={{ fontSize: 13, color: T.textSoft, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.55 }}>
        Tell YANG what you want to build. New versions appear in the preview pane automatically.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 460, margin: '0 auto' }}>
        {examples.map((ex) => (
          <div
            key={ex}
            style={{
              padding: '10px 14px',
              background: T.bgCard,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              fontSize: 13,
              color: T.text,
              fontFamily: T.font,
              textAlign: 'left',
              cursor: 'default',
            }}
          >
            "{ex}"
          </div>
        ))}
      </div>
    </div>
  );
}
