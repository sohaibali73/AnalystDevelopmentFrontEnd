'use client';

/**
 * StyleWizard — /studio/styles/new
 * 4 steps: name → samples → analyze → vibe-check
 */

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  Plus,
  X,
  Trash2,
  Sparkles,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { studioApi, emitStudioRefresh, type StudioStyle, type StudioStyleSample } from '@/lib/studioApi';
import { studioTheme as T } from '@/components/studio/theme';
import {
  StudioButton,
  StudioInput,
  Spinner,
  StudioBadge,
  StudioModal,
} from '@/components/studio/StudioPrimitives';

const ICONS = ['🎙️', '✍️', '📝', '🎨', '⚡', '🔥', '💎', '🌟'];
const COLORS = ['#A78BFA', '#60A5FA', '#34D399', '#FBBF24', '#F472B6', '#FB923C', '#22D3EE', '#F59E0B'];

export default function StyleWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [styleId, setStyleId] = useState<string>('');
  const [style, setStyle] = useState<StudioStyle | null>(null);

  // Step 1
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);

  // Step 2
  const [samples, setSamples] = useState<StudioStyleSample[]>([]);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3 polling
  useEffect(() => {
    if (step !== 3 || !styleId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await studioApi.getStyle(styleId);
        if (cancelled) return;
        setStyle(r.style);
        if (r.style.status === 'ready') {
          emitStudioRefresh('styles');
          setStep(4);
        } else if (r.style.status === 'failed') {
          toast.error('Analysis failed. Please retry.');
        }
      } catch {
        /* ignore */
      }
    };
    tick();
    const id = setInterval(tick, 2500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [step, styleId]);

  // Step 4 preview
  const [previewPrompt, setPreviewPrompt] = useState(
    'Write a short LinkedIn hook about discipline.',
  );
  const [previewOut, setPreviewOut] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  async function handleStep1Next() {
    if (!name.trim()) {
      toast.error('Pick a name for the voice');
      return;
    }
    setBusy(true);
    try {
      const r = await studioApi.createStyle({
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
      });
      setStyleId(r.style.id);
      setStyle(r.style);
      setStep(2);
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function loadSamples() {
    if (!styleId) return;
    try {
      const r = await studioApi.listSamples(styleId);
      setSamples(r.samples);
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    if (step === 2) loadSamples();
  }, [step, styleId]);

  async function handlePasteSubmit() {
    if (!styleId || !pasteText.trim()) return;
    setBusy(true);
    try {
      await studioApi.addSampleText(styleId, {
        text: pasteText.trim(),
        title: pasteTitle.trim() || undefined,
      });
      setPasteText('');
      setPasteTitle('');
      setPasteOpen(false);
      await loadSamples();
      toast.success('Sample added');
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!styleId || !e.target.files?.length) return;
    const file = e.target.files[0];
    setBusy(true);
    try {
      await studioApi.uploadSample(styleId, file, file.name);
      await loadSamples();
      toast.success('Uploaded');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeleteSample(sid: string) {
    if (!styleId) return;
    try {
      await studioApi.deleteSample(styleId, sid);
      await loadSamples();
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    }
  }

  async function handleAnalyze() {
    if (!styleId) return;
    setStep(3);
    try {
      await studioApi.analyzeStyle(styleId, true);
    } catch (e: any) {
      toast.error(e?.message || 'Analyze failed');
    }
  }

  async function handlePreview() {
    if (!styleId) return;
    setPreviewLoading(true);
    try {
      const r = await studioApi.previewStyle(styleId, previewPrompt, 400);
      setPreviewOut(r.output);
    } catch (e: any) {
      toast.error(e?.message || 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  }

  const totalWords = samples.reduce((sum, s) => sum + s.word_count, 0);
  const canAnalyze = samples.length >= 1 && totalWords >= 500;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.text,
        padding: '40px 24px',
        fontFamily: T.font,
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
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
            marginBottom: 24,
            fontFamily: T.font,
            fontSize: 13,
          }}
        >
          <ArrowLeft size={14} /> Back to Styles
        </button>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background:
                  step >= n
                    ? 'linear-gradient(90deg, #F59E0B, #B58F35)'
                    : 'rgba(255,255,255,0.06)',
                transition: 'background 0.4s ease',
              }}
            />
          ))}
        </div>

        {step === 1 && (
          <Step title="Name your voice" subtitle="What should we call this voice clone?">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Field label="Name">
                <StudioInput value={name} onChange={setName} placeholder="My CEO voice, Newsletter style…" autoFocus />
              </Field>
              <Field label="Description (optional)">
                <StudioInput
                  value={description}
                  onChange={setDescription}
                  placeholder="Short note about when to use this voice"
                />
              </Field>
              <Field label="Icon">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ICONS.map((i) => (
                    <button
                      key={i}
                      onClick={() => setIcon(i)}
                      style={{
                        width: 44,
                        height: 44,
                        fontSize: 20,
                        background: icon === i ? 'rgba(255,255,255,0.06)' : 'rgba(12,12,14,0.7)',
                        border: `1px solid ${icon === i ? T.accent : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: 10,
                        cursor: 'pointer',
                      }}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Color">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      style={{
                        width: 32,
                        height: 32,
                        background: c,
                        border: color === c ? '3px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        boxShadow: color === c ? `0 0 0 3px ${c}55` : 'none',
                      }}
                    />
                  ))}
                </div>
              </Field>
            </div>

            <Footer>
              <StudioButton variant="ghost" onClick={() => router.push('/studio?tab=styles')}>
                Cancel
              </StudioButton>
              <StudioButton onClick={handleStep1Next} disabled={busy} iconLeft={<ArrowRight size={14} />}>
                {busy ? <Spinner size={12} color="#0a0a0a" /> : null} Next
              </StudioButton>
            </Footer>
          </Step>
        )}

        {step === 2 && (
          <Step
            title="Add samples"
            subtitle="The more samples, the more accurate the clone. Aim for 3+ samples and 1,500+ words."
          >
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
              <StudioButton iconLeft={<Plus size={14} />} onClick={() => setPasteOpen(true)}>
                Paste text
              </StudioButton>
              <StudioButton
                variant="outline"
                iconLeft={<Upload size={14} />}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload file
              </StudioButton>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFile}
                accept=".txt,.md,.docx,.pdf"
                style={{ display: 'none' }}
              />
            </div>

            {/* Samples list */}
            {samples.length === 0 ? (
              <div
                style={{
                  padding: 28,
                  border: '1px dashed rgba(245,158,11,0.15)',
                  borderRadius: 12,
                  textAlign: 'center',
                  color: T.textDim,
                  fontSize: 13,
                }}
              >
                No samples yet. Paste some text or upload a file to begin.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {samples.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      background: 'rgba(12,12,14,0.7)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 10,
                    }}
                  >
                    <FileText size={16} color={T.accent} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: T.fontDisplay, fontWeight: 600, color: T.text }}>
                        {s.title || 'Untitled sample'}
                      </div>
                      <div style={{ fontSize: 12, color: T.textDim }}>
                        {s.word_count.toLocaleString()} words · {s.source}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSample(s.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: T.textDim,
                        cursor: 'pointer',
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: canAnalyze ? 'rgba(52,211,153,0.05)' : 'rgba(245,158,11,0.05)',
                border: `1px solid ${canAnalyze ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 10,
                fontSize: 13,
                color: canAnalyze ? '#34D399' : T.textDim,
              }}
            >
              {samples.length} sample{samples.length === 1 ? '' : 's'} · {totalWords.toLocaleString()} words ·{' '}
              {canAnalyze ? 'ready to analyze' : 'need at least 500 words to analyze'}
            </div>

            <Footer>
              <StudioButton variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft size={14} /> Back
              </StudioButton>
              <StudioButton
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                iconLeft={<Sparkles size={14} />}
              >
                Analyze
              </StudioButton>
            </Footer>

            <StudioModal
              open={pasteOpen}
              onClose={() => setPasteOpen(false)}
              title="Paste a sample"
              width={600}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <StudioInput value={pasteTitle} onChange={setPasteTitle} placeholder="Title (optional)" />
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste a substantial sample of this person's writing…"
                  rows={10}
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
                <div style={{ fontSize: 12, color: T.textDim }}>
                  {pasteText.split(/\s+/).filter(Boolean).length} words
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <StudioButton variant="ghost" onClick={() => setPasteOpen(false)}>
                    Cancel
                  </StudioButton>
                  <StudioButton
                    onClick={handlePasteSubmit}
                    disabled={busy || !pasteText.trim()}
                  >
                    {busy ? <Spinner size={12} color="#0a0a0a" /> : null} Add sample
                  </StudioButton>
                </div>
              </div>
            </StudioModal>
          </Step>
        )}

        {step === 3 && (
          <Step
            title="Analyzing the voice…"
            subtitle="This typically takes 30 to 90 seconds. We're learning the rhythm, vocabulary, and idiosyncrasies."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 0' }}>
              {[
                'Extracting linguistic fingerprints',
                'Building voice card with Claude',
                'Picking exemplars',
                'Self-test fidelity check',
              ].map((label, i) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    background: 'rgba(12,12,14,0.7)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(245,158,11,0.10)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Spinner size={10} />
                  </div>
                  <span style={{ color: T.text, fontSize: 14 }}>{label}…</span>
                </div>
              ))}
            </div>
            {style?.status === 'failed' && (
              <Footer>
                <StudioButton variant="ghost" onClick={() => setStep(2)}>
                  Back
                </StudioButton>
                <StudioButton onClick={handleAnalyze}>Retry analyze</StudioButton>
              </Footer>
            )}
          </Step>
        )}

        {step === 4 && style && (
          <Step
            title={
              <span>
                Voice cloned <Check size={20} style={{ color: '#34D399', display: 'inline-block', verticalAlign: 'middle' }} />
              </span>
            }
            subtitle={
              style.fidelity_score != null
                ? `Fidelity: ${(style.fidelity_score * 100).toFixed(0)}%`
                : 'Voice is ready to use.'
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Try it out">
                <textarea
                  value={previewPrompt}
                  onChange={(e) => setPreviewPrompt(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
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
              </Field>
              <StudioButton onClick={handlePreview} disabled={previewLoading}>
                {previewLoading ? <Spinner size={12} color="#0a0a0a" /> : <Sparkles size={14} />}
                Generate
              </StudioButton>
              {previewOut && (
                <div
                  style={{
                    padding: 14,
                    background: 'rgba(12,12,14,0.9)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    whiteSpace: 'pre-wrap',
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {previewOut}
                </div>
              )}
            </div>

            <Footer>
              <StudioButton variant="ghost" onClick={() => router.push(`/studio/styles/${styleId}`)}>
                View details
              </StudioButton>
              <StudioButton onClick={() => router.push(`/studio?tab=projects`)}>
                Done
              </StudioButton>
            </Footer>
          </Step>
        )}
      </div>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1
        style={{
          fontFamily: T.fontDisplay,
          fontSize: 32,
          fontWeight: 700,
          margin: '0 0 6px',
          color: T.text,
        }}
      >
        {title}
      </h1>
      {subtitle && <p style={{ color: T.textDim, marginBottom: 28 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: T.textDim,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 32 }}>
      {children}
    </div>
  );
}
