'use client';

/**
 * PptxRevisionCard — Generative UI card for the revise_pptx tool.
 * Shows planned changes during loading, then a revision summary + download on complete.
 */

import React from 'react';
import { useDocGen, type DocGenState } from './hooks/useDocGen';

const COLOR    = '#D24726';
const GRADIENT = 'linear-gradient(135deg, #D24726 0%, #FF6B47 100%)';

const PHASES = [
  'Reading presentation structure',
  'Identifying revision targets',
  'Applying text replacements',
  'Updating slide content',
  'Preserving brand formatting',
  'Saving revised PPTX',
];

interface Change {
  find?: string;
  replace?: string;
  slide?: number;
  count?: number;
}

export interface PptxRevisionCardProps {
  toolCallId: string;
  toolName: string;
  input?: any;
  output?: any;
  externalOutput?: any;
  state: DocGenState;
  errorText?: string;
  conversationId?: string;
}

export function PptxRevisionCard({
  toolCallId, input, output, externalOutput, state, errorText,
}: PptxRevisionCardProps) {

  const {
    progress, currentPhase, elapsedTime, isComplete, isError, safetyTimeout,
    downloadUrl, outputData, handleDownload, formatTime, formatSize, resolveUrl, isDark,
  } = useDocGen({ toolCallId, state, output, externalOutput, phases: PHASES, fileExtension: 'pptx' });

  const cardBg    = isDark ? 'rgba(17,17,20,0.88)'    : 'rgba(250,250,250,0.88)';
  const textColor = isDark ? '#F0F0F0'                : '#111111';
  const mutedCol  = isDark ? '#7A7A88'                : '#6B7280';
  const trackCol  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const metaBg    = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
  const metaBdr   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  // Extract changes from input
  const changes: Change[] = input?.changes || input?.replacements || input?.find_replace || [];
  const changesApplied = outputData?.changes_applied ?? outputData?.replacements_made ?? outputData?.total_changes ?? null;
  const slideCount     = outputData?.slide_count ?? null;

  const statusPill = isError
    ? { bg: isDark ? 'rgba(239,68,68,0.14)' : 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', label: '⚠ ERROR' }
    : isComplete
    ? { bg: isDark ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', label: '✓ REVISED' }
    : { bg: `${COLOR}12`, color: COLOR, border: `1px solid ${COLOR}20`, label: null };

  return (
    <div style={{ marginTop: 12, borderRadius: 16, overflow: 'hidden', border: `1px solid ${COLOR}28`, backgroundColor: cardBg, fontFamily: "'Instrument Sans', sans-serif", boxShadow: isDark ? `0 8px 32px ${COLOR}20` : `0 8px 32px ${COLOR}12`, animation: 'pptxRevSlideIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
      {/* Accent bar */}
      <div style={{ height: 3, background: isError ? 'linear-gradient(90deg,#EF4444,#F97316)' : isComplete ? `linear-gradient(90deg,${COLOR},#10B981)` : GRADIENT, transition: 'background 0.5s' }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: isDark ? 'rgba(210,71,38,0.15)' : 'rgba(210,71,38,0.08)', border: `1px solid ${COLOR}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: isComplete ? `0 4px 12px ${COLOR}20` : 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13.5, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {input?.filename || outputData?.filename || 'Presentation Revision'}
              </div>
              <div style={{ fontSize: 11.5, color: mutedCol, marginTop: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
                <span>PPTX Revision</span>
                {changes.length > 0 && <><span style={{ opacity: 0.35 }}>·</span><span>{changes.length} change{changes.length !== 1 ? 's' : ''} requested</span></>}
                <span style={{ opacity: 0.35 }}>·</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4, backgroundColor: `${COLOR}14`, color: COLOR, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>REVISE</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, fontFamily: "'DM Mono', monospace", flexShrink: 0, backgroundColor: statusPill.bg, color: statusPill.color, border: statusPill.border }}>
            {statusPill.label ?? (
              <><span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: COLOR, animation: 'pptxRevPulse 1.5s ease-in-out infinite', display: 'inline-block' }} /> REVISING</>
            )}
          </div>
        </div>

        {/* Changes preview during loading */}
        {changes.length > 0 && !isComplete && !isError && (
          <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 9, background: metaBg, border: `1px solid ${metaBdr}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: mutedCol, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>Changes to apply</div>
            {changes.slice(0, 6).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, fontSize: 11.5 }}>
                <code style={{ color: isDark ? '#FCA5A5' : '#DC2626', fontFamily: "'DM Mono', monospace", fontSize: 10.5, backgroundColor: 'rgba(239,68,68,0.08)', padding: '1px 5px', borderRadius: 3 }}>
                  "{(c.find || '').slice(0, 28)}{(c.find || '').length > 28 ? '…' : ''}"
                </code>
                <span style={{ color: mutedCol }}>→</span>
                <code style={{ color: isDark ? '#6EE7B7' : '#059669', fontFamily: "'DM Mono', monospace", fontSize: 10.5, backgroundColor: 'rgba(16,185,129,0.08)', padding: '1px 5px', borderRadius: 3 }}>
                  "{(c.replace || '').slice(0, 28)}{(c.replace || '').length > 28 ? '…' : ''}"
                </code>
              </div>
            ))}
            {changes.length > 6 && <div style={{ fontSize: 10.5, color: mutedCol, marginTop: 4 }}>+{changes.length - 6} more changes</div>}
          </div>
        )}

        {/* Progress */}
        {!isComplete && !isError && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '12px 4px 8px' }}>
              {/* Progress ring */}
              <div style={{ flexShrink: 0, position: 'relative', width: 72, height: 72 }}>
                <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke={trackCol} strokeWidth="5" />
                  <circle cx="36" cy="36" r="30" fill="none" stroke={COLOR} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 30}`}
                    strokeDashoffset={`${2 * Math.PI * 30 * (1 - progress / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 13, color: textColor, lineHeight: 1 }}>{Math.round(progress)}%</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, color: mutedCol, textTransform: 'uppercase' }}>{formatTime(elapsedTime)}</span>
                </div>
              </div>
              {/* Phases */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 2 }}>
                {PHASES.map((phase, idx) => {
                  const done = idx < currentPhase, active = idx === currentPhase;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 7, opacity: idx > currentPhase ? 0.38 : 1 }}>
                      {done
                        ? <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg></div>
                        : active
                          ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${COLOR}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: COLOR, animation: 'pptxRevPulse 1.4s ease-in-out infinite' }} /></div>
                          : <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${mutedCol}`, flexShrink: 0, opacity: 0.4 }} />
                      }
                      <span style={{ fontSize: 11, fontWeight: active ? 700 : done ? 600 : 400, color: active ? COLOR : done ? textColor : mutedCol }}>{phase}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '7px 11px', borderRadius: 8, backgroundColor: `${COLOR}06`, border: `1px solid ${COLOR}12`, marginTop: 6 }}>
              <span style={{ fontSize: 11, color: COLOR, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>ⓘ Do not refresh or leave this page</span>
              <div style={{ position: 'relative', width: 80, height: 3, borderRadius: 2, backgroundColor: trackCol, flexShrink: 0, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress}%`, borderRadius: 2, backgroundColor: COLOR, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, width: 30, background: `linear-gradient(90deg,transparent,${COLOR}80,transparent)`, animation: 'pptxRevShimmer 1.6s linear infinite' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div style={{ padding: '11px 13px', borderRadius: 9, backgroundColor: isDark ? 'rgba(239,68,68,0.09)' : '#FEF2F2', border: '1px solid rgba(239,68,68,0.18)', color: isDark ? '#FCA5A5' : '#DC2626', fontSize: 12.5, marginBottom: 12 }}>
            ⚠ {errorText || 'Revision failed — please try again.'}
          </div>
        )}

        {/* Complete */}
        {isComplete && (
          <div>
            {/* Summary badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {changesApplied !== null && (
                <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 600 }}>
                  ✓ {changesApplied} change{changesApplied !== 1 ? 's' : ''} applied
                </span>
              )}
              {slideCount !== null && <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: metaBg, border: `1px solid ${metaBdr}`, color: mutedCol }}>{slideCount} slides</span>}
              {formatSize() && <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: metaBg, border: `1px solid ${metaBdr}`, color: mutedCol }}>{formatSize()}</span>}
              <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: metaBg, border: `1px solid ${metaBdr}`, color: mutedCol }}>{formatTime(elapsedTime)}</span>
            </div>

            {/* Primary download */}
            {downloadUrl && (
              <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, border: 'none', background: GRADIENT, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Syne', sans-serif", letterSpacing: 0.5, boxShadow: `0 4px 14px ${COLOR}35`, transition: 'all 0.18s', width: '100%', marginBottom: 8 }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${COLOR}50`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 14px ${COLOR}35`; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                Download Revised PPTX
              </button>
            )}
            {downloadUrl && (
              <button onClick={() => window.open(resolveUrl(downloadUrl), '_blank')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 8, border: `1px solid ${metaBdr}`, background: 'transparent', color: mutedCol, fontSize: 11.5, cursor: 'pointer', width: '100%', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = COLOR; e.currentTarget.style.color = COLOR; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = metaBdr; e.currentTarget.style.color = mutedCol; }}
              >
                Open in new tab
              </button>
            )}
          </div>
        )}

        {/* Safety timeout */}
        {safetyTimeout && !isComplete && !isError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, backgroundColor: isDark ? 'rgba(251,191,36,0.08)' : '#FFFBEB', border: '1px solid rgba(251,191,36,0.2)', marginTop: 8 }}>
            <span>⚠</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B' }}>Taking longer than expected</div>
              <div style={{ fontSize: 10.5, color: mutedCol }}>The backend may still be processing.</div>
            </div>
            <button onClick={() => window.location.reload()} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.1)', color: '#F59E0B', fontSize: 10.5, fontWeight: 600, cursor: 'pointer' }}>Refresh</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pptxRevPulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.45;transform:scale(0.82)} }
        @keyframes pptxRevShimmer { 0%{left:-60px} 100%{left:calc(100% + 60px)} }
        @keyframes pptxRevSlideIn { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

export default PptxRevisionCard;
