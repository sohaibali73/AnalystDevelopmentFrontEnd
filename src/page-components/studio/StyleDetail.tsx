'use client';

/**
 * StyleDetail — /studio/styles/:id
 * Tabs: Samples · Voice Card · System Prompt · Preview
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Plus,
  Upload,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  studioApi,
  emitStudioRefresh,
  type StudioStyle,
  type StudioStyleSample,
} from '@/lib/studioApi';
import { studioTheme as T, relativeTime } from '@/components/studio/theme';
import {
  StudioButton,
  StudioBadge,
  StudioInput,
  Spinner,
  StudioModal,
} from '@/components/studio/StudioPrimitives';

type Tab = 'samples' | 'card' | 'prompt' | 'preview';

export default function StyleDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [style, setStyle] = useState<StudioStyle | null>(null);
  const [samples, setSamples] = useState<StudioStyleSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('samples');

  const load = useCallback(async () => {
    try {
      const r = await studioApi.getStyle(id);
      setStyle(r.style);
      setSamples(r.samples);
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll while analyzing
  useEffect(() => {
    if (style?.status !== 'analyzing') return;
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [style?.status, load]);

  if (loading) {
    return (
      <div style={fullCenter}>
        <Spinner size={28} />
      </div>
    );
  }
  if (!style) {
    return <div style={fullCenter}>Not found</div>;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '32px 24px',
        background: T.bg,
        color: T.text,
        fontFamily: T.font,
      }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <button
          onClick={() => router.push('/studio?tab=styles')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: 'transparent',
            color: T.textDim,
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
            cursor: 'pointer',
            marginBottom: 18,
            fontSize: 13,
            fontFamily: T.font,
          }}
        >
          <ArrowLeft size={14} /> Back to Styles
        </button>

        <Header style={style} onReload={load} />

        <div style={{ display: 'flex', gap: 4, marginTop: 26, marginBottom: 22 }}>
          {(
            [
              { id: 'samples', label: `Samples (${samples.length})` },
              { id: 'card', label: 'Voice Card' },
              { id: 'prompt', label: 'System Prompt' },
              { id: 'preview', label: 'Preview' },
            ] as { id: Tab; label: string }[]
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '10px 18px',
                  background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: active ? T.accent : T.textDim,
                  border: `1px solid ${active ? 'rgba(245,158,11,0.30)' : 'transparent'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontFamily: T.fontDisplay,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'samples' && (
          <SamplesTab styleId={id} samples={samples} onChange={load} />
        )}
        {tab === 'card' && <VoiceCardTab style={style} />}
        {tab === 'prompt' && <PromptTab style={style} />}
        {tab === 'preview' && <PreviewTab styleId={id} />}
      </div>
    </div>
  );
}

const fullCenter: React.CSSProperties = {
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

function Header({ style, onReload }: { style: StudioStyle; onReload: () => void }) {
  const [reanalyzing, setReanalyzing] = useState(false);
  const router = useRouter();
  const fid = style.fidelity_score != null ? Math.round(style.fidelity_score * 100) : null;
  const statusColor =
    style.status === 'ready' ? 'green' : style.status === 'analyzing' ? 'gold' : style.status === 'failed' ? 'red' : 'gray';

  async function handleReanalyze() {
    setReanalyzing(true);
    try {
      await studioApi.analyzeStyle(style.id, true);
      onReload();
      toast.success('Analysis started');
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    } finally {
      setReanalyzing(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete voice "${style.name}"?`)) return;
    try {
      await studioApi.deleteStyle(style.id);
      emitStudioRefresh('styles');
      router.push('/studio?tab=styles');
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    }
  }

  return (
    <div
      style={{
        padding: 24,
        background: T.bgCard,
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: `${style.color}22`,
          border: `1px solid ${style.color}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
        }}
      >
        {style.icon || '🎙️'}
      </div>
      <div style={{ flex: 1, minWidth: 240 }}>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 700, margin: 0 }}>
          {style.name}
        </h1>
        <p style={{ color: T.textDim, margin: '4px 0 0', fontSize: 13 }}>
          {style.description || 'No description'} · Updated {relativeTime(style.updated_at)}
        </p>
      </div>
      <StudioBadge color={statusColor as any}>{style.status}</StudioBadge>
      {fid != null && (
        <div style={{ minWidth: 140 }}>
          <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4 }}>Fidelity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${fid}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${style.color}, ${T.accent})`,
                }}
              />
            </div>
            <span style={{ color: T.accent, fontWeight: 700, fontFamily: T.fontDisplay }}>{fid}%</span>
          </div>
        </div>
      )}
      <StudioButton variant="outline" iconLeft={<RefreshCw size={14} />} onClick={handleReanalyze} disabled={reanalyzing}>
        {reanalyzing ? 'Re-analyzing…' : 'Re-analyze'}
      </StudioButton>
      <StudioButton variant="danger" iconLeft={<Trash2 size={14} />} onClick={handleDelete}>
        Delete
      </StudioButton>
    </div>
  );
}

// ─── Samples tab ────────────────────────────────────────────────────────

function SamplesTab({
  styleId,
  samples,
  onChange,
}: {
  styleId: string;
  samples: StudioStyleSample[];
  onChange: () => void;
}) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function handlePaste() {
    if (!pasteText.trim()) return;
    setBusy(true);
    try {
      await studioApi.addSampleText(styleId, { text: pasteText.trim(), title: pasteTitle.trim() || undefined });
      setPasteText('');
      setPasteTitle('');
      setPasteOpen(false);
      onChange();
      toast.success('Added');
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      await studioApi.uploadSample(styleId, f, f.name);
      onChange();
    } catch (err: any) {
      toast.error(err?.message || 'Failed');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(sid: string) {
    try {
      await studioApi.deleteSample(styleId, sid);
      onChange();
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <StudioButton iconLeft={<Plus size={14} />} onClick={() => setPasteOpen(true)}>
          Add sample
        </StudioButton>
        <StudioButton variant="outline" iconLeft={<Upload size={14} />} onClick={() => fileRef.current?.click()}>
          Upload file
        </StudioButton>
        <input
          ref={fileRef}
          type="file"
          onChange={handleFile}
          accept=".txt,.md,.docx,.pdf"
          style={{ display: 'none' }}
        />
      </div>

      {samples.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            color: T.textDim,
            border: '1px dashed rgba(245,158,11,0.15)',
            borderRadius: 12,
          }}
        >
          No samples yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Title', 'Source', 'Words', 'Added', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      fontFamily: T.fontMono,
                      fontSize: 10,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: T.textDim,
                      borderBottom: '1px solid rgba(245,158,11,0.10)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {samples.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(245,158,11,0.05)' }}>
                  <td style={{ padding: '10px 14px', color: T.text }}>{s.title || 'Untitled'}</td>
                  <td style={{ padding: '10px 14px', color: T.textDim }}>{s.source}</td>
                  <td style={{ padding: '10px 14px', color: T.textDim }}>{s.word_count.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', color: T.textDim }}>{relativeTime(s.created_at)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(s.id)}
                      style={{
                        background: 'transparent',
                        color: '#EF4444',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <StudioModal open={pasteOpen} onClose={() => setPasteOpen(false)} title="Paste sample" width={620}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <StudioInput value={pasteTitle} onChange={setPasteTitle} placeholder="Title (optional)" />
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={10}
            placeholder="Paste sample text…"
            style={{
              padding: 12,
              background: 'rgba(12,12,14,0.9)',
              color: T.text,
              border: '1px solid rgba(245,158,11,0.15)',
              borderRadius: 8,
              fontFamily: T.font,
              fontSize: 14,
              resize: 'vertical',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <StudioButton variant="ghost" onClick={() => setPasteOpen(false)}>
              Cancel
            </StudioButton>
            <StudioButton onClick={handlePaste} disabled={busy || !pasteText.trim()}>
              {busy ? <Spinner size={12} color="#0a0a0a" /> : null} Add
            </StudioButton>
          </div>
        </div>
      </StudioModal>
    </div>
  );
}

// ─── Voice Card tab ────────────────────────────────────────────────────

function VoiceCardTab({ style }: { style: StudioStyle }) {
  const card = style.voice_card;
  if (!card) {
    return (
      <Empty>
        Voice card will appear once analysis completes.
      </Empty>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
      {Object.entries(card).map(([section, val]: any) => (
        <Section key={section} title={section.replace(/_/g, ' ')}>
          {renderJson(val)}
        </Section>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 18,
        background: T.bgCard,
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
      }}
    >
      <h3
        style={{
          fontFamily: T.fontDisplay,
          fontSize: 13,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: T.accent,
          margin: '0 0 12px',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function renderJson(v: any): React.ReactNode {
  if (v == null) return <span style={{ color: T.textDim, fontSize: 13 }}>—</span>;
  if (Array.isArray(v)) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {v.map((it, i) => (
          <span
            key={i}
            style={{
              padding: '4px 10px',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.15)',
              borderRadius: 999,
              fontSize: 12,
              color: T.text,
            }}
          >
            {typeof it === 'string' ? it : JSON.stringify(it)}
          </span>
        ))}
      </div>
    );
  }
  if (typeof v === 'object') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(v).map(([k, vv]: any) => (
          <div key={k}>
            <div
              style={{
                fontFamily: T.fontMono,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: T.textDim,
                marginBottom: 4,
              }}
            >
              {k}
            </div>
            <div style={{ fontSize: 13, color: T.text }}>{renderJson(vv)}</div>
          </div>
        ))}
      </div>
    );
  }
  return <span style={{ fontSize: 13, color: T.text }}>{String(v)}</span>;
}

// ─── System prompt tab ─────────────────────────────────────────────────

function PromptTab({ style }: { style: StudioStyle }) {
  const [copied, setCopied] = useState(false);
  const [prompt, setPrompt] = useState<string>(style.system_prompt || '');
  useEffect(() => {
    if (!style.system_prompt) {
      studioApi.getSystemPrompt(style.id).then((r) => {
        if (r.system_prompt) setPrompt(r.system_prompt);
      }).catch(() => {});
    }
  }, [style.id, style.system_prompt]);

  if (!prompt) {
    return <Empty>System prompt not generated yet.</Empty>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            padding: '6px 12px',
            background: 'rgba(245,158,11,0.10)',
            color: T.accent,
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: T.font,
            fontSize: 12,
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <textarea
        readOnly
        value={prompt}
        rows={20}
        style={{
          width: '100%',
          padding: 16,
          background: 'rgba(12,12,14,0.9)',
          color: T.text,
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          fontFamily: T.fontMono,
          fontSize: 13,
          lineHeight: 1.6,
          resize: 'vertical',
          outline: 'none',
        }}
      />
    </div>
  );
}

// ─── Preview tab ───────────────────────────────────────────────────────

function PreviewTab({ styleId }: { styleId: string }) {
  const [prompt, setPrompt] = useState('Write a short LinkedIn hook about discipline.');
  const [out, setOut] = useState('');
  const [loading, setLoading] = useState(false);
  async function go() {
    setLoading(true);
    try {
      const r = await studioApi.previewStyle(styleId, prompt);
      setOut(r.output);
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        style={{
          padding: 12,
          background: 'rgba(12,12,14,0.9)',
          color: T.text,
          border: '1px solid rgba(245,158,11,0.15)',
          borderRadius: 10,
          fontFamily: T.font,
          fontSize: 14,
          resize: 'vertical',
          outline: 'none',
        }}
      />
      <StudioButton onClick={go} disabled={loading} iconLeft={<Sparkles size={14} />} style={{ alignSelf: 'flex-start' }}>
        {loading ? <Spinner size={12} color="#0a0a0a" /> : null} Generate
      </StudioButton>
      {out && (
        <div
          style={{
            padding: 16,
            background: 'rgba(12,12,14,0.9)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            whiteSpace: 'pre-wrap',
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {out}
        </div>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 36,
        textAlign: 'center',
        color: T.textDim,
        background: T.bgCard,
        border: '1px dashed rgba(245,158,11,0.15)',
        borderRadius: 12,
      }}
    >
      {children}
    </div>
  );
}
