'use client';

/**
 * XlsxTransformCard — Generative UI card for the transform_xlsx tool.
 * Shows transformation pipeline during loading, then a summary + download on complete.
 */

import React from 'react';
import { useDocGen, type DocGenState } from './hooks/useDocGen';

const COLOR    = '#217346';
const GRADIENT = 'linear-gradient(135deg, #217346 0%, #33A06F 100%)';

const PHASES = [
  'Loading source data',
  'Parsing data types',
  'Applying transformations',
  'Cleaning and deduplication',
  'Formatting output',
  'Generating XLSX file',
];

interface Transformation {
  type?: string;
  description?: string;
  column?: string;
  rows_affected?: number;
}

export interface XlsxTransformCardProps {
  toolCallId: string;
  toolName: string;
  input?: any;
  output?: any;
  externalOutput?: any;
  state: DocGenState;
  errorText?: string;
  conversationId?: string;
}

export function XlsxTransformCard({
  toolCallId, input, output, externalOutput, state, errorText,
}: XlsxTransformCardProps) {

  const {
    progress, currentPhase, elapsedTime, isComplete, isError, safetyTimeout,
    downloadUrl, outputData, handleDownload, formatTime, formatSize, resolveUrl, isDark,
  } = useDocGen({ toolCallId, state, output, externalOutput, phases: PHASES, fileExtension: 'xlsx' });

  const cardBg    = isDark ? 'rgba(17,17,20,0.88)'    : 'rgba(250,250,250,0.88)';
  const textColor = isDark ? '#F0F0F0'                : '#111111';
  const mutedCol  = isDark ? '#7A7A88'                : '#6B7280';
  const trackCol  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const metaBg    = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
  const metaBdr   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  // Extract transformations from input
  const inputTransforms: Transformation[] = input?.transformations || input?.operations || [];
  const outputTransforms: Transformation[] = outputData?.transformations_applied || outputData?.operations_applied || [];
  const transforms = outputTransforms.length > 0 ? outputTransforms : inputTransforms;

  const rowsBefore = outputData?.rows_before ?? outputData?.input_rows ?? null;
  const rowsAfter  = outputData?.rows_after  ?? outputData?.output_rows ?? null;
  const colsAdded  = outputData?.columns_added   ?? null;
  const colsRemoved = outputData?.columns_removed ?? null;

  const statusPill = isError
    ? { bg: isDark ? 'rgba(239,68,68,0.14)' : 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', label: '⚠ ERROR' }
    : isComplete
    ? { bg: isDark ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', label: '✓ TRANSFORMED' }
    : { bg: `${COLOR}12`, color: COLOR, border: `1px solid ${COLOR}20`, label: null };

  return (
    <div style={{ marginTop: 12, borderRadius: 16, overflow: 'hidden', border: `1px solid ${COLOR}28`, backgroundColor: cardBg, fontFamily: "'Instrument Sans', sans-serif", boxShadow: isDark ? `0 8px 32px ${COLOR}20` : `0 8px 32px ${COLOR}12`, animation: 'xlsxTxSlideIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
      <div style={{ height: 3, background: isError ? 'linear-gradient(90deg,#EF4444,#F97316)' : isComplete ? `linear-gradient(90deg,${COLOR},#10B981)` : GRADIENT, transition: 'background 0.5s' }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: isDark ? 'rgba(33,115,70,0.15)' : 'rgba(33,115,70,0.08)', border: `1px solid ${COLOR}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: isComplete ? `0 4px 12px ${COLOR}20` : 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" fill={COLOR} opacity="0.12" stroke={COLOR} strokeWidth="1.5" />
                <path d="M8 12h8M8 8h8M8 16h5" stroke={COLOR} strokeWidth="1.5" strokeLinecap="round" />
                <path d="M19 16l-3 3-3-3" stroke={COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13.5, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {input?.filename || outputData?.filename || 'Excel Transformation'}
              </div>
              <div style={{ fontSize: 11.5, color: mutedCol, marginTop: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
                <span>Data Transformation</span>
                {inputTransforms.length > 0 && <><span style={{ opacity: 0.35 }}>·</span><span>{inputTransforms.length} operation{inputTransforms.length !== 1 ? 's' : ''}</span></>}
                <span style={{ opacity: 0.35 }}>·</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4, backgroundColor: `${COLOR}14`, color: COLOR, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>TRANSFORM</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, fontFamily: "'DM Mono', monospace", flexShrink: 0, backgroundColor: statusPill.bg, color: statusPill.color, border: statusPill.border }}>
            {statusPill.label ?? (
              <><span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: COLOR, animation: 'xlsxTxPulse 1.5s ease-in-out infinite', display: 'inline-block' }} /> TRANSFORMING</>
            )}
          </div>
        </div>

        {/* Pipeline preview (operations to apply) */}
        {inputTransforms.length > 0 && !isComplete && !isError && (
          <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 9, background: metaBg, border: `1px solid ${metaBdr}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: mutedCol, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>Transformation pipeline</div>
            {inputTransforms.slice(0, 6).map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: `${COLOR}20`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 8, fontWeight: 700, color: COLOR, fontFamily: "'DM Mono', monospace", marginTop: 1 }}>{i + 1}</div>
                <div>
                  {t.type && <span style={{ fontSize: 11, fontWeight: 600, color: COLOR, fontFamily: "'DM Mono', monospace" }}>{t.type} </span>}
                  {t.column && <span style={{ fontSize: 11, color: textColor }}>on <code style={{ fontSize: 10.5, backgroundColor: `${COLOR}10`, padding: '0 3px', borderRadius: 3 }}>{t.column}</code> </span>}
                  {t.description && <span style={{ fontSize: 11, color: mutedCol }}>— {t.description}</span>}
                </div>
              </div>
            ))}
            {inputTransforms.length > 6 && <div style={{ fontSize: 10.5, color: mutedCol, marginTop: 4 }}>+{inputTransforms.length - 6} more operations</div>}
          </div>
        )}

        {/* Progress */}
        {!isComplete && !isError && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '12px 4px 8px' }}>
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
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 2 }}>
                {PHASES.map((phase, idx) => {
                  const done = idx < currentPhase, active = idx === currentPhase;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 7, opacity: idx > currentPhase ? 0.38 : 1 }}>
                      {done
                        ? <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg></div>
                        : active
                          ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${COLOR}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: COLOR, animation: 'xlsxTxPulse 1.4s ease-in-out infinite' }} /></div>
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
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress}%`, borderRadius: 2, backgroundColor: COLOR, transition: 'width 0.6s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div style={{ padding: '11px 13px', borderRadius: 9, backgroundColor: isDark ? 'rgba(239,68,68,0.09)' : '#FEF2F2', border: '1px solid rgba(239,68,68,0.18)', color: isDark ? '#FCA5A5' : '#DC2626', fontSize: 12.5, marginBottom: 12 }}>
            ⚠ {errorText || 'Transformation failed — please try again.'}
          </div>
        )}

        {/* Complete */}
        {isComplete && (
          <div>
            {/* Stats: before vs after */}
            {(rowsBefore !== null || rowsAfter !== null) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', marginBottom: 14 }}>
                <div style={{ padding: '10px 12px', borderRadius: 9, background: metaBg, border: `1px solid ${metaBdr}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: mutedCol, fontFamily: "'DM Mono', monospace" }}>{rowsBefore?.toLocaleString() ?? '—'}</div>
                  <div style={{ fontSize: 9.5, color: mutedCol, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>Rows before</div>
                </div>
                <div style={{ fontSize: 16, color: COLOR, fontWeight: 700 }}>→</div>
                <div style={{ padding: '10px 12px', borderRadius: 9, background: `${COLOR}0A`, border: `1px solid ${COLOR}25`, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLOR, fontFamily: "'DM Mono', monospace" }}>{rowsAfter?.toLocaleString() ?? '—'}</div>
                  <div style={{ fontSize: 9.5, color: mutedCol, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>Rows after</div>
                </div>
              </div>
            )}

            {/* Summary badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {outputTransforms.length > 0 && <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 600 }}>✓ {outputTransforms.length} transformation{outputTransforms.length !== 1 ? 's' : ''} applied</span>}
              {colsAdded !== null && colsAdded > 0 && <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: `${COLOR}0A`, border: `1px solid ${COLOR}20`, color: COLOR, fontWeight: 600 }}>+{colsAdded} columns added</span>}
              {colsRemoved !== null && colsRemoved > 0 && <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: metaBg, border: `1px solid ${metaBdr}`, color: mutedCol, fontWeight: 600 }}>−{colsRemoved} columns removed</span>}
              {formatSize() && <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: metaBg, border: `1px solid ${metaBdr}`, color: mutedCol }}>{formatSize()}</span>}
              <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: metaBg, border: `1px solid ${metaBdr}`, color: mutedCol }}>{formatTime(elapsedTime)}</span>
            </div>

            {/* Applied transformations list */}
            {outputTransforms.length > 0 && (
              <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 9, background: metaBg, border: `1px solid ${metaBdr}` }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: mutedCol, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>Applied operations</div>
                {outputTransforms.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginTop: 2, flexShrink: 0 }}><polyline points="20 6 9 17 4 12" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span style={{ fontSize: 11.5, color: textColor }}>
                      {t.type && <span style={{ fontWeight: 600, color: COLOR, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{t.type} </span>}
                      {t.description || (t.column ? `on ${t.column}` : '')}
                      {t.rows_affected !== undefined && <span style={{ color: mutedCol }}> ({t.rows_affected.toLocaleString()} rows affected)</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Download */}
            {downloadUrl && (
              <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, border: 'none', background: GRADIENT, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Syne', sans-serif", letterSpacing: 0.5, boxShadow: `0 4px 14px ${COLOR}35`, transition: 'all 0.18s', width: '100%', marginBottom: 8 }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                Download Transformed XLSX
              </button>
            )}
            {downloadUrl && (
              <button onClick={() => window.open(resolveUrl(downloadUrl), '_blank')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 8, border: `1px solid ${metaBdr}`, background: 'transparent', color: mutedCol, fontSize: 11.5, cursor: 'pointer', width: '100%', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = COLOR; e.currentTarget.style.color = COLOR; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = metaBdr; e.currentTarget.style.color = mutedCol; }}>
                Open in new tab
              </button>
            )}
          </div>
        )}

        {/* Safety timeout */}
        {safetyTimeout && !isComplete && !isError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, backgroundColor: isDark ? 'rgba(251,191,36,0.08)' : '#FFFBEB', border: '1px solid rgba(251,191,36,0.2)', marginTop: 8 }}>
            <span>⚠</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B' }}>Taking longer than expected</div><div style={{ fontSize: 10.5, color: mutedCol }}>The backend may still be processing.</div></div>
            <button onClick={() => window.location.reload()} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.1)', color: '#F59E0B', fontSize: 10.5, fontWeight: 600, cursor: 'pointer' }}>Refresh</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes xlsxTxPulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.45;transform:scale(0.82)} }
        @keyframes xlsxTxSlideIn { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

export default XlsxTransformCard;
