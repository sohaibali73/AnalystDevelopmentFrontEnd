'use client';

import React, { useEffect, useState } from 'react';
import { Wand2, Gauge, FileCheck2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  studioApi,
  type Intensity,
  type SeoTarget,
  type HumanizeRun,
  type StudioStyle,
  type StudioProject,
} from '@/lib/studioApi';
import { studioTheme as T } from '@/components/studio/theme';
import { StudioButton, StudioSelect, Spinner, StudioBadge } from '@/components/studio/StudioPrimitives';

const PHASES = [
  'Removing AI fingerprints…',
  'Varying sentence rhythm…',
  'Injecting unexpected word choices…',
  'Running detector ensemble…',
  'Verifying facts…',
  'Scoring style fidelity…',
];

export function HumanizePlayground() {
  const [input, setInput] = useState('');
  const [intensity, setIntensity] = useState<Intensity>('standard');
  const [seo, setSeo] = useState<'' | 'linkedin'>('');
  const [preserveFacts, setPreserveFacts] = useState(true);
  const [styleId, setStyleId] = useState('');
  const [projectId, setProjectId] = useState('');

  const [styles, setStyles] = useState<StudioStyle[]>([]);
  const [projects, setProjects] = useState<StudioProject[]>([]);

  const [loading, setLoading] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [run, setRun] = useState<HumanizeRun | null>(null);
  const [scoreOnly, setScoreOnly] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    studioApi.listStyles().then((r) => setStyles(r.styles.filter((s) => s.status === 'ready'))).catch(() => {});
    studioApi.listProjects({ limit: 200 }).then((r) => setProjects(r.projects)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading) return;
    setPhaseIdx(0);
    const t = setInterval(() => setPhaseIdx((i) => Math.min(i + 1, PHASES.length - 1)), 3500);
    return () => clearInterval(t);
  }, [loading]);

  async function handleHumanize() {
    if (!input.trim()) {
      toast.error('Paste some text first');
      return;
    }
    setLoading(true);
    setRun(null);
    setScoreOnly(null);
    try {
      const r = await studioApi.humanize({
        text: input,
        intensity,
        seo_target: (seo || null) as SeoTarget,
        style_profile_id: styleId || null,
        project_id: projectId || null,
        preserve_facts: preserveFacts,
      });
      setRun(r);
    } catch (e: any) {
      toast.error(e?.message || 'Humanize failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleScore() {
    if (!input.trim()) {
      toast.error('Paste some text first');
      return;
    }
    setLoading(true);
    setRun(null);
    setScoreOnly(null);
    try {
      const r = await studioApi.scoreText(input);
      setScoreOnly(r);
    } catch (e: any) {
      toast.error(e?.message || 'Score failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!run?.output) return;
    await navigator.clipboard.writeText(run.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: 14,
          background: 'rgba(12,12,14,0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <Field label="Project">
          <StudioSelect
            value={projectId}
            onChange={setProjectId}
            options={[
              { value: '', label: 'None' },
              ...projects.map((p) => ({ value: p.id, label: p.title || 'Untitled' })),
            ]}
          />
        </Field>
        <Field label="Voice">
          <StudioSelect
            value={styleId}
            onChange={setStyleId}
            options={[
              { value: '', label: 'None' },
              ...styles.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        </Field>
        <Field label="Intensity">
          <StudioSelect
            value={intensity}
            onChange={(v) => setIntensity(v as Intensity)}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'standard', label: 'Standard' },
              { value: 'max', label: 'Max' },
            ]}
          />
        </Field>
        <Field label="SEO">
          <StudioSelect
            value={seo}
            onChange={(v) => setSeo(v as any)}
            options={[
              { value: '', label: 'None' },
              { value: 'linkedin', label: 'LinkedIn' },
            ]}
          />
        </Field>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: T.textDim,
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          <input
            type="checkbox"
            checked={preserveFacts}
            onChange={(e) => setPreserveFacts(e.target.checked)}
            style={{ accentColor: T.accent }}
          />
          Preserve facts
        </label>
      </div>

      {/* Two-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div
          style={{
            background: '#0D0D10',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 360,
          }}
        >
          <PaneHeader>Input</PaneHeader>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste any AI-generated text. We'll rewrite it to sound human."
            style={{
              flex: 1,
              minHeight: 260,
              padding: 14,
              background: 'rgba(12,12,14,0.9)',
              color: T.text,
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              fontFamily: T.font,
              fontSize: 14,
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: T.textDim }}>
              {input.split(/\s+/).filter(Boolean).length} words · {input.length} chars
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <StudioButton variant="outline" iconLeft={<Gauge size={14} />} onClick={handleScore} disabled={loading}>
                Score only
              </StudioButton>
              <StudioButton iconLeft={<Wand2 size={14} />} onClick={handleHumanize} disabled={loading}>
                Humanize →
              </StudioButton>
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#0D0D10',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 360,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <PaneHeader>Output</PaneHeader>
            {run?.output && (
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  background: 'transparent',
                  color: copied ? '#34D399' : T.textDim,
                  border: '1px solid rgba(245,158,11,0.15)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontFamily: T.font,
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          {loading ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                color: T.textDim,
              }}
            >
              <Spinner size={28} />
              <div style={{ fontFamily: T.fontMono, fontSize: 13, color: T.accent }}>
                {PHASES[phaseIdx]}
              </div>
            </div>
          ) : run?.output ? (
            <div
              style={{
                flex: 1,
                padding: 14,
                background: 'rgba(12,12,14,0.9)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                fontSize: 14,
                lineHeight: 1.7,
                color: T.text,
                whiteSpace: 'pre-wrap',
                overflowY: 'auto',
                maxHeight: 480,
              }}
            >
              {run.output}
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: T.textDim,
                fontSize: 13,
                fontStyle: 'italic',
              }}
            >
              Humanized output will appear here.
            </div>
          )}
        </div>
      </div>

      {/* Score panel */}
      {(run?.scores || scoreOnly) && (
        <ScorePanel scores={run?.scores ?? scoreOnly} run={run} />
      )}
    </div>
  );
}

function PaneHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: T.fontDisplay,
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: T.accent,
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          fontFamily: T.fontMono,
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: T.textDim,
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function ScorePanel({ scores, run }: { scores: any; run?: HumanizeRun | null }) {
  const aiDetect = scores?.ai_detection ?? scores?.ai_detection_in;
  const before = scores?.ai_detection_in;
  const styleFid = scores?.style_fidelity;
  const components = scores?.components || {};

  const pct = (v: any) => (typeof v === 'number' ? Math.round(v * 100) : null);
  const aiPct = pct(aiDetect);
  const beforePct = pct(before);

  return (
    <div
      style={{
        background: '#0D0D10',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <FileCheck2 size={16} color={T.accent} />
        <span style={{ fontFamily: T.fontDisplay, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Detection scores
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
        {aiPct !== null && (
          <Metric
            label="AI detection"
            value={`${aiPct}%`}
            sub={beforePct !== null && beforePct !== aiPct ? `was ${beforePct}%` : undefined}
            barPct={aiPct}
            color={aiPct < 30 ? '#34D399' : aiPct < 60 ? '#FBBF24' : '#EF4444'}
          />
        )}
        {styleFid != null && (
          <Metric
            label="Style fidelity"
            value={styleFid.toFixed(2)}
            barPct={Math.round(styleFid * 100)}
            color="#A78BFA"
          />
        )}
        {Object.entries(components).slice(0, 4).map(([k, v]: any) => (
          <Metric
            key={k}
            label={k}
            value={typeof v === 'number' ? v.toFixed(2) : String(v)}
            barPct={typeof v === 'number' ? Math.round(v * 100) : 0}
            color="#60A5FA"
          />
        ))}
      </div>

      {run?.lost_facts && (
        <div style={{ marginTop: 16, display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12 }}>
          <FactPill label="Numbers" lost={run.lost_facts.numbers} />
          <FactPill label="Quotes" lost={run.lost_facts.quotes} />
          <FactPill label="Names" lost={run.lost_facts.names} />
        </div>
      )}

      {run?.passes_summary && run.passes_summary.length > 0 && (
        <details style={{ marginTop: 18 }}>
          <summary style={{ cursor: 'pointer', color: T.accent, fontSize: 12, fontFamily: T.fontDisplay, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Pass timeline
          </summary>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {run.passes_summary.map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  fontFamily: T.fontMono,
                  padding: '6px 10px',
                  background: 'rgba(12,12,14,0.7)',
                  borderRadius: 6,
                  color: T.textDim,
                }}
              >
                <span style={{ color: p.changed ? T.accent : T.textDim }}>{p.pass}</span>
                <span>
                  {p.ms}ms · {p.len_in} → {p.len_out}
                  {p.ai_detection_after != null && (
                    <span style={{ marginLeft: 8 }}>
                      AI: {Math.round(p.ai_detection_after * 100)}%
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function Metric({ label, value, sub, barPct, color }: { label: string; value: string; sub?: string; barPct: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span
          style={{
            fontFamily: T.fontMono,
            fontSize: 10,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: T.textDim,
          }}
        >
          {label}
        </span>
        <span style={{ fontFamily: T.fontDisplay, fontSize: 18, color, fontWeight: 700 }}>
          {value}
        </span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.min(100, Math.max(0, barPct))}%`,
            height: '100%',
            background: color,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      {sub && <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function FactPill({ label, lost }: { label: string; lost: string[] }) {
  const ok = lost.length === 0;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <StudioBadge color={ok ? 'green' : 'red'}>
        {ok ? '✓' : '⚠'} {label} {ok ? 0 : lost.length}
      </StudioBadge>
    </span>
  );
}
