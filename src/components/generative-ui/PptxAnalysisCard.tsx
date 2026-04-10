'use client';

/**
 * PptxAnalysisCard — Generative UI card for the analyze_pptx tool.
 * Shows brand compliance score, violations list, and per-slide detail.
 * Read-only analysis — no download/progress needed (server runs fast).
 */

import React, { useState } from 'react';

const COLOR = '#D24726';

interface Violation {
  slide?: number;
  type?: string;
  description?: string;
  severity?: 'high' | 'medium' | 'low';
}

interface SlideDetail {
  number: number;
  title: string;
  layout?: string;
  compliance?: string;
  issues?: string[];
}

interface PptxAnalysisData {
  success?: boolean;
  filename?: string;
  title?: string;
  slide_count?: number;
  brand_compliance_score?: number;
  brand_score?: number;
  violations?: Violation[];
  slides?: SlideDetail[];
  template_detected?: string;
  theme?: string;
  text?: string;
  error?: string;
}

export interface PptxAnalysisCardProps {
  toolCallId: string;
  toolName: string;
  input?: any;
  output?: any;
  externalOutput?: any;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  errorText?: string;
  conversationId?: string;
}

export function PptxAnalysisCard({
  state, output, externalOutput, errorText,
}: PptxAnalysisCardProps) {
  const [slidesOpen, setSlidesOpen]   = useState(false);
  const [violationsOpen, setViolationsOpen] = useState(true);

  const isDark =
    typeof window !== 'undefined' &&
    (document.documentElement.getAttribute('data-theme') === 'dark' ||
      window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const cardBg    = isDark ? 'rgba(17,17,20,0.88)'    : 'rgba(250,250,250,0.88)';
  const textColor = isDark ? '#F0F0F0'                : '#111111';
  const mutedCol  = isDark ? '#7A7A88'                : '#6B7280';
  const metaBg    = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
  const metaBdr   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  // Loading state
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div style={{ marginTop: 12, borderRadius: 12, padding: '20px', border: `1px solid ${COLOR}28`, backgroundColor: cardBg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 16, height: 16, border: `2px solid ${COLOR}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'pptxAnalSpin 0.8s linear infinite', display: 'inline-block' }} />
          <span style={{ fontSize: 13, color: mutedCol }}>Analysing PowerPoint presentation…</span>
        </div>
        <style>{`@keyframes pptxAnalSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const data: PptxAnalysisData = output || externalOutput || {};
  const score      = data.brand_compliance_score ?? data.brand_score ?? null;
  const violations = data.violations || [];
  const slides     = data.slides || [];

  // Hard error (no data at all)
  if ((state === 'output-error') && !data.slide_count && !data.text) {
    return (
      <div style={{ marginTop: 12, borderRadius: 12, padding: '14px 16px', backgroundColor: isDark ? 'rgba(239,68,68,0.09)' : '#FEF2F2', border: '1px solid rgba(239,68,68,0.18)', color: isDark ? '#FCA5A5' : '#DC2626', fontSize: 13 }}>
        ⚠ {errorText || 'Analysis failed — please try again.'}
      </div>
    );
  }

  const scoreColor = score === null ? mutedCol
    : score >= 80 ? '#10B981'
    : score >= 60 ? '#F59E0B'
    : '#EF4444';

  const severityColor = (s?: string) =>
    s === 'high' ? '#EF4444' : s === 'medium' ? '#F59E0B' : '#6B7280';

  return (
    <div style={{ marginTop: 12, borderRadius: 16, overflow: 'hidden', border: `1px solid ${COLOR}28`, backgroundColor: cardBg, fontFamily: "'Instrument Sans', sans-serif", boxShadow: isDark ? `0 8px 32px ${COLOR}20` : `0 8px 32px ${COLOR}12`, animation: 'pptxAnalSlideIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
      {/* Accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${COLOR},#10B981)` }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {/* Icon */}
          <div style={{ width: 42, height: 42, borderRadius: 11, background: isDark ? 'rgba(210,71,38,0.15)' : 'rgba(210,71,38,0.08)', border: `1px solid ${COLOR}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 11l3 3L22 4" stroke={COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke={COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13.5, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.filename || data.title || 'PPTX Analysis'}
            </div>
            <div style={{ fontSize: 11.5, color: mutedCol, marginTop: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
              <span>Presentation Analysis</span>
              {data.slide_count && <><span style={{ opacity: 0.4 }}>·</span><span>{data.slide_count} slides</span></>}
              <span style={{ opacity: 0.35 }}>·</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4, backgroundColor: `${COLOR}14`, color: COLOR, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>ANALYSE</span>
            </div>
          </div>
          {/* Brand score badge */}
          {score !== null && (
            <div style={{ textAlign: 'center', flexShrink: 0, padding: '8px 14px', borderRadius: 10, background: `${scoreColor}12`, border: `1px solid ${scoreColor}25` }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: 9.5, color: mutedCol, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>Brand Score</div>
            </div>
          )}
        </div>

        {/* Metrics row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {data.template_detected && (
            <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 600 }}>
              ✓ Template: {data.template_detected}
            </span>
          )}
          {violations.length > 0 ? (
            <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontWeight: 600 }}>
              ⚠ {violations.length} brand violation{violations.length !== 1 ? 's' : ''}
            </span>
          ) : score !== null ? (
            <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 600 }}>
              ✓ No brand violations detected
            </span>
          ) : null}
          {data.theme && (
            <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: metaBg, border: `1px solid ${metaBdr}`, color: mutedCol }}>
              Theme: {data.theme}
            </span>
          )}
        </div>

        {/* Violations section */}
        {violations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => setViolationsOpen(!violationsOpen)} style={{ background: 'none', border: 'none', color: textColor, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, padding: '0 0 8px 0', fontFamily: "'Instrument Sans', sans-serif" }}>
              {violationsOpen ? '▲' : '▼'} Brand Violations ({violations.length})
            </button>
            {violationsOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {violations.map((v, i) => (
                  <div key={i} style={{ padding: '9px 11px', borderRadius: 8, background: metaBg, border: `1px solid ${metaBdr}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4, backgroundColor: severityColor(v.severity) }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 3 }}>
                        {v.slide && <span style={{ fontSize: 10.5, fontWeight: 700, color: COLOR, fontFamily: "'DM Mono', monospace" }}>Slide {v.slide}</span>}
                        {v.type && <span style={{ fontSize: 10.5, fontWeight: 600, color: textColor }}>{v.type}</span>}
                        {v.severity && (
                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', backgroundColor: `${severityColor(v.severity)}18`, color: severityColor(v.severity) }}>
                            {v.severity}
                          </span>
                        )}
                      </div>
                      {v.description && <div style={{ fontSize: 11.5, color: mutedCol, lineHeight: 1.5 }}>{v.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Text output */}
        {data.text && (
          <div style={{ padding: '12px 14px', borderRadius: 9, background: metaBg, border: `1px solid ${metaBdr}`, fontSize: 12.5, color: textColor, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
            {data.text}
          </div>
        )}

        {/* Slide-by-slide detail */}
        {slides.length > 0 && (
          <div>
            <button onClick={() => setSlidesOpen(!slidesOpen)} style={{ background: 'none', border: 'none', color: mutedCol, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0', fontFamily: "'DM Mono', monospace" }}>
              {slidesOpen ? '▲' : '▼'} {slidesOpen ? 'Hide' : 'Show'} per-slide detail ({slides.length} slides)
            </button>
            {slidesOpen && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {slides.map((s, i) => (
                  <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: metaBg, border: `1px solid ${metaBdr}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: COLOR, minWidth: 20, textAlign: 'center', fontFamily: "'DM Mono', monospace" }}>{s.number}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: textColor }}>{s.title}</div>
                      {s.issues && s.issues.map((issue, j) => (
                        <div key={j} style={{ fontSize: 10.5, color: '#F59E0B', marginTop: 2 }}>⚠ {issue}</div>
                      ))}
                    </div>
                    {s.compliance && (
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', backgroundColor: s.compliance === 'pass' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: s.compliance === 'pass' ? '#10b981' : '#EF4444' }}>
                        {s.compliance}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pptxAnalSlideIn { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes pptxAnalSpin    { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

export default PptxAnalysisCard;
