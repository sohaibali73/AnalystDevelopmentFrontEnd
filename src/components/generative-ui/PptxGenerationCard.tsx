'use client';

/**
 * PptxGenerationCard — Generative UI card for PPTX generation tools.
 * Handles: generate_pptx, generate_pptx_template, generate_pptx_freestyle, potomac_pptx
 *
 * Features:
 *  - Animated progress ring with PPTX-specific phases
 *  - Slide thumbnail strip preview
 *  - Full PptxViewer inline preview (collapsible)
 *  - Download button + open-in-tab
 *  - localStorage state persistence across page refreshes
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PptxViewer } from '@/components/pptx-viewer';
import { useDocGen, type DocGenState } from './hooks/useDocGen';

const COLOR    = '#D24726';
const GRADIENT = 'linear-gradient(135deg, #D24726 0%, #FF6B47 100%)';
const BG_DARK  = 'rgba(210,71,38,0.15)';
const BG_LIGHT = 'rgba(210,71,38,0.08)';

const PHASES = [
  'Analysing presentation topic',
  'Designing slide structure',
  'Creating slide content',
  'Applying Potomac theme',
  'Generating visual elements',
  'Building PPTX file',
];

interface SlidePreview {
  number: number;
  title: string;
  bullet_count: number;
  layout: string;
  has_notes: boolean;
  preview_text: string;
}

export interface PptxGenerationCardProps {
  toolCallId: string;
  toolName: string;
  input?: any;
  output?: any;
  externalOutput?: any;
  state: DocGenState;
  errorText?: string;
  conversationId?: string;
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function ProgressRing({ progress, elapsedTime, color, trackCol, textColor, mutedCol, formatTime }: {
  progress: number; elapsedTime: number; color: string; trackCol: string;
  textColor: string; mutedCol: string; formatTime: (s: number) => string;
}) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ flexShrink: 0, position: 'relative', width: 80, height: 80 }}>
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke={trackCol} strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${circ * (1 - progress / 100)}`}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 15, color: textColor, lineHeight: 1 }}>{Math.round(progress)}%</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: mutedCol, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{formatTime(elapsedTime)}</span>
      </div>
    </div>
  );
}

function PhaseChecklist({ phases, currentPhase, color, textColor, mutedCol, animKey }: {
  phases: string[]; currentPhase: number; color: string; textColor: string; mutedCol: string; animKey: string;
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 4 }}>
      {phases.map((phase, idx) => {
        const done = idx < currentPhase, active = idx === currentPhase;
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: idx > currentPhase ? 0.38 : 1, transition: 'opacity 0.3s' }}>
            {done ? (
              <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
            ) : active ? (
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, animation: `${animKey}Pulse 1.4s ease-in-out infinite` }} />
              </div>
            ) : (
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${mutedCol}`, flexShrink: 0, opacity: 0.4 }} />
            )}
            <span style={{ fontSize: 11.5, fontWeight: active ? 700 : done ? 600 : 400, color: active ? color : done ? textColor : mutedCol, lineHeight: 1.3, transition: 'color 0.3s, font-weight 0.2s' }}>{phase}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PptxGenerationCard({
  toolCallId, toolName, input, output, externalOutput, state, errorText,
}: PptxGenerationCardProps) {

  const [previewOpen, setPreviewOpen]       = useState(false);
  const [pptxBlob, setPptxBlob]             = useState<Blob | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [slidesExpanded, setSlidesExpanded] = useState(false);
  const [scriptExpanded, setScriptExpanded] = useState(false);
  const [scriptCopied, setScriptCopied]     = useState(false);

  const {
    progress, currentPhase, elapsedTime, isComplete, isError, safetyTimeout,
    downloadUrl, outputData, handleDownload, formatTime, formatSize, resolveUrl, isDark,
  } = useDocGen({ toolCallId, state, output, externalOutput, phases: PHASES, fileExtension: 'pptx' });

  // ── Derived data ───────────────────────────────────────────────────────────
  const title = input?.title || input?.topic || input?.subject || input?.prompt?.slice(0, 60)
    || outputData?.title || 'Presentation';
  const slides: SlidePreview[] = outputData?.slides || [];
  const slideCount  = outputData?.slide_count ?? slides.length;
  const templateUsed = outputData?.template_used || outputData?.template_id || null;

  // ── Theme ──────────────────────────────────────────────────────────────────
  const cardBg    = isDark ? 'rgba(17,17,20,0.88)'     : 'rgba(250,250,250,0.88)';
  const borderCol = isDark ? `${COLOR}28`              : `${COLOR}1A`;
  const textColor = isDark ? '#F0F0F0'                 : '#111111';
  const mutedCol  = isDark ? '#7A7A88'                 : '#6B7280';
  const trackCol  = isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.06)';
  const metaBg    = isDark ? 'rgba(255,255,255,0.03)'  : 'rgba(0,0,0,0.025)';
  const metaBdr   = isDark ? 'rgba(255,255,255,0.05)'  : 'rgba(0,0,0,0.05)';

  // ── PptxViewer blob loader ─────────────────────────────────────────────────
  const loadPptxPreview = useCallback(async () => {
    if (!downloadUrl || !isComplete) return;
    setPreviewLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const resp = await fetch(resolveUrl(downloadUrl), {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!resp.ok) throw new Error('Failed');
      setPptxBlob(await resp.blob());
    } catch (err) {
      console.error('PPTX preview failed:', err);
    } finally {
      setPreviewLoading(false);
    }
  }, [downloadUrl, isComplete, resolveUrl]);

  useEffect(() => {
    if (previewOpen && isComplete && downloadUrl && !pptxBlob) loadPptxPreview();
  }, [previewOpen, isComplete, downloadUrl, pptxBlob, loadPptxPreview]);

  useEffect(() => {
    if (isComplete) setTimeout(() => setPreviewOpen(true), 800);
  }, [isComplete]);

  // ── Status pill ────────────────────────────────────────────────────────────
  const statusPill = isError
    ? { bg: isDark ? 'rgba(239,68,68,0.14)' : 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', label: '⚠ ERROR' }
    : isComplete
    ? { bg: isDark ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', label: '✓ COMPLETE' }
    : { bg: `${COLOR}12`, color: COLOR, border: `1px solid ${COLOR}20`, label: null };

  // ── Download helper ────────────────────────────────────────────────────────
  const DownloadBtn = ({ full = false }: { full?: boolean }) => (
    <button
      onClick={handleDownload}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: full ? '12px 24px' : '10px 20px',
        borderRadius: 9, border: 'none', background: GRADIENT, color: '#fff',
        fontWeight: 700, fontSize: full ? 14 : 12, cursor: 'pointer',
        fontFamily: "'Syne', sans-serif", letterSpacing: 0.5,
        whiteSpace: 'nowrap', flexShrink: 0,
        boxShadow: `0 4px 14px ${COLOR}35`, transition: 'all 0.18s ease',
        ...(full ? { width: '100%', justifyContent: 'center' } : {}),
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${COLOR}50`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 14px ${COLOR}35`; }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
      {full ? 'Download PPTX' : 'Download PPTX'}
    </button>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      marginTop: 12, borderRadius: 16, overflow: 'hidden',
      border: `1px solid ${borderCol}`, backgroundColor: cardBg,
      fontFamily: "'Instrument Sans', sans-serif",
      boxShadow: isDark ? `0 8px 32px ${COLOR}20` : `0 8px 32px ${COLOR}12`,
      backdropFilter: 'blur(20px) saturate(180%)',
      animation: 'pptxSlideIn 0.4s cubic-bezier(0.16,1,0.3,1)',
    }}>
      {/* Accent bar */}
      <div style={{ height: 3, background: isError ? 'linear-gradient(90deg,#EF4444,#F97316)' : isComplete ? `linear-gradient(90deg,${COLOR},#10B981)` : GRADIENT, transition: 'background 0.5s' }} />

      <div style={{ padding: '16px 18px' }}>
        {/* ── Header row ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            {/* Icon badge */}
            <div style={{ width: 42, height: 42, borderRadius: 11, background: isDark ? BG_DARK : BG_LIGHT, border: `1px solid ${borderCol}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: isComplete ? `0 4px 12px ${COLOR}20` : 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="14" rx="2" fill={COLOR} opacity="0.12" stroke={COLOR} strokeWidth="1.5" />
                <path d="M8 10h3a1.5 1.5 0 0 1 0 3H8V7h3a1.5 1.5 0 0 1 0 3" stroke={COLOR} strokeWidth="1.4" strokeLinecap="round" />
                <path d="M7 20h10M12 17v3" stroke={COLOR} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            {/* Title + label */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13.5, color: textColor, letterSpacing: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
              <div style={{ fontSize: 11.5, color: mutedCol, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>PowerPoint Presentation</span>
                {slideCount > 0 && <><span style={{ opacity: 0.35 }}>·</span><span>{slideCount} slides</span></>}
                <span style={{ opacity: 0.35 }}>·</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4, backgroundColor: `${COLOR}14`, color: COLOR, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>PPTX</span>
              </div>
            </div>
          </div>
          {/* Status pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, fontFamily: "'DM Mono', monospace", flexShrink: 0, backgroundColor: statusPill.bg, color: statusPill.color, border: statusPill.border }}>
            {statusPill.label ?? (
              <><span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: COLOR, animation: 'pptxPulse 1.5s ease-in-out infinite', display: 'inline-block' }} /> GENERATING</>
            )}
          </div>
        </div>

        {/* ── Progress section ────────────────────────────────────────────── */}
        {!isComplete && !isError && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '16px 4px 12px' }}>
              <ProgressRing progress={progress} elapsedTime={elapsedTime} color={COLOR} trackCol={trackCol} textColor={textColor} mutedCol={mutedCol} formatTime={formatTime} />
              <PhaseChecklist phases={PHASES} currentPhase={currentPhase} color={COLOR} textColor={textColor} mutedCol={mutedCol} animKey="pptx" />
            </div>
            {/* Progress bar warning */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 12px', borderRadius: 8, backgroundColor: `${COLOR}06`, border: `1px solid ${COLOR}12`, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: COLOR, fontWeight: 600, fontFamily: "'DM Mono', monospace", letterSpacing: '0.02em' }}>ⓘ Do not refresh or leave this page</span>
              <div style={{ position: 'relative', width: 90, height: 4, borderRadius: 2, backgroundColor: trackCol, flexShrink: 0, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress}%`, borderRadius: 2, backgroundColor: COLOR, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, width: 40, background: `linear-gradient(90deg, transparent, ${COLOR}80, transparent)`, animation: 'pptxShimmer 1.6s linear infinite' }} />
              </div>
            </div>
            {/* Step dots */}
            <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
              {PHASES.map((_, idx) => (
                <div key={idx} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: idx < currentPhase ? COLOR : idx === currentPhase ? `${COLOR}70` : trackCol, transition: 'background-color 0.4s' }} />
              ))}
            </div>
            {progress > 5 && (
              <div style={{ fontSize: 10.5, color: mutedCol, textAlign: 'center', marginTop: 6, opacity: 0.65, fontFamily: "'DM Mono', monospace" }}>
                {progress < 50 ? '30–60 seconds remaining' : progress < 80 ? 'Almost there' : 'Wrapping up'}
              </div>
            )}
          </div>
        )}

        {/* ── Error section ───────────────────────────────────────────────── */}
        {isError && (
          <div style={{ padding: '11px 13px', borderRadius: 9, backgroundColor: isDark ? 'rgba(239,68,68,0.09)' : '#FEF2F2', border: '1px solid rgba(239,68,68,0.18)', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 15 }}>⚠</span>
            <span style={{ fontSize: 12.5, color: isDark ? '#FCA5A5' : '#DC2626', lineHeight: 1.5 }}>{errorText || 'Presentation generation failed — please try again.'}</span>
          </div>
        )}

        {/* ── Complete state ──────────────────────────────────────────────── */}
        {isComplete && outputData && (
          <div>
            {/* Slide strip */}
            {slides.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
                {/* Title thumbnail */}
                <div style={{ minWidth: 80, height: 52, borderRadius: 6, background: '#121212', border: `1.5px solid ${COLOR}44`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 4, flexShrink: 0 }}>
                  <div style={{ width: 40, height: 1, background: COLOR, marginBottom: 3 }} />
                  <div style={{ fontSize: 6, fontWeight: 700, color: COLOR, textAlign: 'center', lineHeight: 1.1 }}>{title.slice(0, 18)}</div>
                </div>
                {slides.slice(0, 7).map((s, i) => (
                  <div key={i} style={{ minWidth: 80, height: 52, borderRadius: 6, background: '#121212', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px', flexShrink: 0, overflow: 'hidden' }}>
                    <div style={{ fontSize: 6, fontWeight: 600, color: COLOR, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                    {s.preview_text && <div style={{ fontSize: 5, color: '#fff', opacity: 0.45, lineHeight: 1.2, overflow: 'hidden', maxHeight: 24 }}>• {s.preview_text.slice(0, 50)}</div>}
                  </div>
                ))}
                {slides.length > 7 && (
                  <div style={{ minWidth: 40, height: 52, borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>+{slides.length - 7}</div>
                )}
              </div>
            )}

            {/* Download banner */}
            {downloadUrl && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', borderRadius: 11, marginBottom: 12, background: isDark ? `linear-gradient(135deg, ${COLOR}1A 0%, ${COLOR}0D 100%)` : `linear-gradient(135deg, ${COLOR}0F 0%, ${COLOR}06 100%)`, border: `1.5px solid ${COLOR}30` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 9, background: isDark ? BG_DARK : BG_LIGHT, border: `1px solid ${COLOR}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px ${COLOR}20` }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="14" rx="2" fill={COLOR} opacity="0.12" stroke={COLOR} strokeWidth="1.5" /><path d="M8 10h3a1.5 1.5 0 0 1 0 3H8V7h3a1.5 1.5 0 0 1 0 3" stroke={COLOR} strokeWidth="1.4" strokeLinecap="round" /></svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: textColor, fontFamily: "'Syne', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {outputData.filename || `${title}.pptx`}
                    </div>
                    <div style={{ fontSize: 11, color: mutedCol, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Mono', monospace" }}>
                      {templateUsed && <span style={{ padding: '1px 5px', borderRadius: 4, backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase' }}>{templateUsed}</span>}
                      {formatSize() && <span>{formatSize()}</span>}
                      {slideCount > 0 && <><span style={{ opacity: 0.35 }}>·</span><span>{slideCount} slides</span></>}
                    </div>
                  </div>
                </div>
                <DownloadBtn />
              </div>
            )}

            {/* Expandable slide list */}
            {slides.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <button onClick={() => setSlidesExpanded(!slidesExpanded)} style={{ background: 'none', border: 'none', color: mutedCol, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0', fontFamily: "'DM Mono', monospace" }}>
                  {slidesExpanded ? '▲' : '▼'} {slidesExpanded ? 'Hide' : 'Show'} slide details ({slideCount} slides)
                </button>
                {slidesExpanded && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {slides.map((s, i) => (
                      <div key={i} style={{ padding: '7px 10px', borderRadius: 8, background: metaBg, border: `1px solid ${metaBdr}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: COLOR, minWidth: 20, textAlign: 'center' }}>{s.number}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: textColor }}>{s.title}</div>
                          {s.preview_text && <div style={{ fontSize: 10, color: mutedCol, marginTop: 1 }}>• {s.preview_text}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 10, color: mutedCol }}>
                          {s.bullet_count > 0 && <span>{s.bullet_count}pt</span>}
                          {s.has_notes && <span title="Has speaker notes">📝</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Inline PptxViewer */}
            {downloadUrl && (
              <div style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden', border: `1px solid ${metaBdr}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: metaBg, borderBottom: previewOpen ? `1px solid ${metaBdr}` : 'none' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: textColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="14" rx="2" stroke={COLOR} strokeWidth="1.5" /></svg>
                    Preview
                  </span>
                  <button onClick={() => setPreviewOpen(!previewOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedCol, fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = textColor; }}
                    onMouseLeave={e => { e.currentTarget.style.color = mutedCol; }}>
                    {previewOpen ? '▲ Hide Preview' : '▼ Show Preview'}
                  </button>
                </div>
                {previewOpen && (
                  <div style={{ height: 480, position: 'relative', backgroundColor: isDark ? '#0D0D10' : '#FFFFFF' }}>
                    {previewLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: mutedCol, fontSize: 12 }}>
                        <span style={{ width: 14, height: 14, border: `2px solid ${COLOR}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'pptxSpin 0.8s linear infinite', display: 'inline-block' }} />
                        Loading presentation...
                      </div>
                    ) : pptxBlob ? (
                      <PptxViewer
                        file={pptxBlob}
                        filename={outputData?.filename || `${title}.pptx`}
                        showHeader={true}
                        showThumbnails={true}
                        height="100%"
                        darkMode={isDark}
                        onDownload={handleDownload}
                        onClose={() => setPreviewOpen(false)}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: mutedCol, fontSize: 12 }}>
                        Click "Show Preview" to load
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
              {downloadUrl && <DownloadBtn />}
              {downloadUrl && (
                <button onClick={() => window.open(resolveUrl(downloadUrl), '_blank')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 9, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, background: 'transparent', color: mutedCol, fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = COLOR; e.currentTarget.style.color = COLOR; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = mutedCol; }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                  Open in new tab
                </button>
              )}
            </div>

            {/* ── Debug Script panel ────────────────────────────────────────── */}
            {outputData?.script && (
              <div style={{ marginTop: 10, borderRadius: 9, border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`, overflow: 'hidden' }}>
                {/* header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', backgroundColor: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)', borderBottom: scriptExpanded ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` : 'none' }}>
                  <button
                    onClick={() => setScriptExpanded(!scriptExpanded)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedCol, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, padding: 0, fontFamily: "'DM Mono', monospace", letterSpacing: '0.03em' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    {scriptExpanded ? '▲ Hide' : '▼ Show'} pptxgenjs debug script
                  </button>
                  {scriptExpanded && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {/* Copy button */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(outputData.script).then(() => {
                            setScriptCopied(true);
                            setTimeout(() => setScriptCopied(false), 2000);
                          });
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 5, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: scriptCopied ? 'rgba(16,185,129,0.1)' : 'transparent', color: scriptCopied ? '#10B981' : mutedCol, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Mono', monospace", transition: 'all 0.15s' }}
                      >
                        {scriptCopied
                          ? <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
                          : <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</>
                        }
                      </button>
                      {/* Download as .js */}
                      <button
                        onClick={() => {
                          const blob = new Blob([outputData.script], { type: 'text/javascript' });
                          const url  = URL.createObjectURL(blob);
                          const a    = document.createElement('a');
                          a.href     = url;
                          a.download = 'debug_script.js';
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 5, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: 'transparent', color: mutedCol, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Mono', monospace", transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = COLOR; e.currentTarget.style.color = COLOR; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = mutedCol; }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        .js
                      </button>
                    </div>
                  )}
                </div>
                {/* code block */}
                {scriptExpanded && (
                  <pre style={{
                    margin: 0, padding: '12px 14px',
                    overflowX: 'auto', overflowY: 'auto',
                    maxHeight: 360,
                    fontSize: 10.5, lineHeight: 1.6,
                    fontFamily: "'DM Mono', 'Fira Code', 'Cascadia Code', monospace",
                    color: isDark ? '#C9D1D9' : '#24292F',
                    backgroundColor: isDark ? '#0D1117' : '#F6F8FA',
                    whiteSpace: 'pre',
                    tabSize: 2,
                  }}>
                    {outputData.script}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Safety timeout ──────────────────────────────────────────────── */}
        {safetyTimeout && !isComplete && !isError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, backgroundColor: isDark ? 'rgba(251,191,36,0.08)' : '#FFFBEB', border: '1px solid rgba(251,191,36,0.2)', marginTop: 8 }}>
            <span>⚠</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B' }}>Taking longer than expected</div>
              <div style={{ fontSize: 10.5, color: mutedCol }}>The backend may still be processing. You can wait or refresh.</div>
            </div>
            <button onClick={() => window.location.reload()} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.1)', color: '#F59E0B', fontSize: 10.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Mono', monospace" }}>Refresh</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pptxPulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.45;transform:scale(0.82)} }
        @keyframes pptxSpin    { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes pptxShimmer { 0%{left:-60px} 100%{left:calc(100% + 60px)} }
        @keyframes pptxSlideIn { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

export default PptxGenerationCard;
