'use client';

/**
 * DocxGenerationCard — Generative UI card for the generate_docx / potomac_docx tools.
 * Features: progress ring, document HTML preview (collapsible), download DOCX.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { parseFileForPreview, type ParsedDocument } from '@/lib/filePreview';
import { useDocGen, type DocGenState } from './hooks/useDocGen';

const COLOR    = '#2B579A';
const GRADIENT = 'linear-gradient(135deg, #2B579A 0%, #3B7DD8 100%)';
const BG_DARK  = 'rgba(43,87,154,0.15)';
const BG_LIGHT = 'rgba(43,87,154,0.08)';

const PHASES = [
  'Analysing content requirements',
  'Structuring document outline',
  'Writing document content',
  'Applying Potomac formatting',
  'Adding tables and lists',
  'Generating DOCX file',
];

export interface DocxGenerationCardProps {
  toolCallId: string;
  toolName: string;
  input?: any;
  output?: any;
  externalOutput?: any;
  state: DocGenState;
  errorText?: string;
  conversationId?: string;
}

export function DocxGenerationCard({
  toolCallId, input, output, externalOutput, state, errorText,
}: DocxGenerationCardProps) {

  const [previewOpen, setPreviewOpen]       = useState(false);
  const [parsedDoc, setParsedDoc]           = useState<ParsedDocument | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const {
    progress, currentPhase, elapsedTime, isComplete, isError, safetyTimeout,
    downloadUrl, outputData, handleDownload, formatTime, formatSize, resolveUrl, isDark,
  } = useDocGen({ toolCallId, state, output, externalOutput, phases: PHASES, fileExtension: 'docx' });

  const title = input?.title || input?.topic || input?.subject || input?.prompt?.slice(0, 60)
    || outputData?.title || 'Word Document';

  const cardBg    = isDark ? 'rgba(17,17,20,0.88)'    : 'rgba(250,250,250,0.88)';
  const textColor = isDark ? '#F0F0F0'                : '#111111';
  const mutedCol  = isDark ? '#7A7A88'                : '#6B7280';
  const trackCol  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const metaBg    = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
  const metaBdr   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  const loadPreview = useCallback(async () => {
    if (!downloadUrl || !isComplete) return;
    setPreviewLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const resp = await fetch(resolveUrl(downloadUrl), {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!resp.ok) throw new Error('Failed');
      const blob = await resp.blob();
      const parsed = await parseFileForPreview(blob, outputData?.filename || `${title}.docx`);
      setParsedDoc(parsed);
    } catch {
      setParsedDoc({ type: 'unsupported', content: 'Preview could not be loaded.' });
    } finally {
      setPreviewLoading(false);
    }
  }, [downloadUrl, isComplete, resolveUrl, outputData, title]);

  useEffect(() => {
    if (previewOpen && isComplete && downloadUrl && !parsedDoc) loadPreview();
  }, [previewOpen, isComplete, downloadUrl, parsedDoc, loadPreview]);

  useEffect(() => {
    if (isComplete) setTimeout(() => setPreviewOpen(true), 800);
  }, [isComplete]);

  const statusPill = isError
    ? { bg: isDark ? 'rgba(239,68,68,0.14)' : 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', label: '⚠ ERROR' }
    : isComplete
    ? { bg: isDark ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', label: '✓ COMPLETE' }
    : { bg: `${COLOR}12`, color: COLOR, border: `1px solid ${COLOR}20`, label: null };

  return (
    <div style={{ marginTop: 12, borderRadius: 16, overflow: 'hidden', border: `1px solid ${COLOR}28`, backgroundColor: cardBg, fontFamily: "'Instrument Sans', sans-serif", boxShadow: isDark ? `0 8px 32px ${COLOR}20` : `0 8px 32px ${COLOR}12`, animation: 'docxSlideIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
      <div style={{ height: 3, background: isError ? 'linear-gradient(90deg,#EF4444,#F97316)' : isComplete ? `linear-gradient(90deg,${COLOR},#10B981)` : GRADIENT, transition: 'background 0.5s' }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: isDark ? BG_DARK : BG_LIGHT, border: `1px solid ${COLOR}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: isComplete ? `0 4px 12px ${COLOR}20` : 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="2" width="13" height="17" rx="2" fill={COLOR} opacity="0.15" stroke={COLOR} strokeWidth="1.5" />
                <path d="M7 7h6M7 10h6M7 13h4" stroke={COLOR} strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14 15l2 5 2-4 2 4 2-5" stroke={COLOR} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13.5, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
              <div style={{ fontSize: 11.5, color: mutedCol, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Word Document</span>
                {(outputData?.page_count || outputData?.pages) && <><span style={{ opacity: 0.35 }}>·</span><span>{outputData.page_count || outputData.pages} pages</span></>}
                <span style={{ opacity: 0.35 }}>·</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4, backgroundColor: `${COLOR}14`, color: COLOR, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>DOCX</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, fontFamily: "'DM Mono', monospace", flexShrink: 0, backgroundColor: statusPill.bg, color: statusPill.color, border: statusPill.border }}>
            {statusPill.label ?? (
              <><span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: COLOR, animation: 'docxPulse 1.5s ease-in-out infinite', display: 'inline-block' }} /> GENERATING</>
            )}
          </div>
        </div>

        {/* Progress */}
        {!isComplete && !isError && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '16px 4px 12px' }}>
              {/* Ring */}
              <div style={{ flexShrink: 0, position: 'relative', width: 80, height: 80 }}>
                <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="40" cy="40" r="34" fill="none" stroke={trackCol} strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke={COLOR} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 15, color: textColor, lineHeight: 1 }}>{Math.round(progress)}%</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: mutedCol, textTransform: 'uppercase' }}>{formatTime(elapsedTime)}</span>
                </div>
              </div>
              {/* Phases */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 4 }}>
                {PHASES.map((phase, idx) => {
                  const done = idx < currentPhase, active = idx === currentPhase;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: idx > currentPhase ? 0.38 : 1 }}>
                      {done
                        ? <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg></div>
                        : active
                          ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${COLOR}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: COLOR, animation: 'docxPulse 1.4s ease-in-out infinite' }} /></div>
                          : <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${mutedCol}`, flexShrink: 0, opacity: 0.4 }} />
                      }
                      <span style={{ fontSize: 11.5, fontWeight: active ? 700 : done ? 600 : 400, color: active ? COLOR : done ? textColor : mutedCol }}>{phase}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 12px', borderRadius: 8, backgroundColor: `${COLOR}06`, border: `1px solid ${COLOR}12`, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: COLOR, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>ⓘ Do not refresh or leave this page</span>
              <div style={{ position: 'relative', width: 90, height: 4, borderRadius: 2, backgroundColor: trackCol, flexShrink: 0, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress}%`, borderRadius: 2, backgroundColor: COLOR, transition: 'width 0.6s' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, width: 40, background: `linear-gradient(90deg,transparent,${COLOR}80,transparent)`, animation: 'docxShimmer 1.6s linear infinite' }} />
              </div>
            </div>
            {progress > 5 && (
              <div style={{ fontSize: 10.5, color: mutedCol, textAlign: 'center', marginTop: 6, opacity: 0.65, fontFamily: "'DM Mono', monospace" }}>
                {progress < 50 ? '20–45 seconds remaining' : progress < 80 ? 'Almost there' : 'Wrapping up'}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div style={{ padding: '11px 13px', borderRadius: 9, backgroundColor: isDark ? 'rgba(239,68,68,0.09)' : '#FEF2F2', border: '1px solid rgba(239,68,68,0.18)', color: isDark ? '#FCA5A5' : '#DC2626', fontSize: 12.5, marginBottom: 12 }}>
            ⚠ {errorText || 'Document generation failed — please try again.'}
          </div>
        )}

        {/* Complete */}
        {isComplete && outputData && (
          <div>
            {/* Download banner */}
            {downloadUrl && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', borderRadius: 11, marginBottom: 12, background: isDark ? `linear-gradient(135deg,${COLOR}1A 0%,${COLOR}0D 100%)` : `linear-gradient(135deg,${COLOR}0F 0%,${COLOR}06 100%)`, border: `1.5px solid ${COLOR}30` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 9, background: isDark ? BG_DARK : BG_LIGHT, border: `1px solid ${COLOR}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px ${COLOR}20` }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="13" height="17" rx="2" fill={COLOR} opacity="0.15" stroke={COLOR} strokeWidth="1.5" /><path d="M7 7h6M7 10h6M7 13h4" stroke={COLOR} strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: textColor, fontFamily: "'Syne', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{outputData.filename || `${title}.docx`}</div>
                    <div style={{ fontSize: 11, color: mutedCol, marginTop: 2, display: 'flex', gap: 6, fontFamily: "'DM Mono', monospace", flexWrap: 'wrap' }}>
                      {formatSize() && <span>{formatSize()}</span>}
                      {(outputData.page_count || outputData.pages) && <><span style={{ opacity: 0.35 }}>·</span><span>{outputData.page_count || outputData.pages} pages</span></>}
                      {(outputData.word_count || outputData.wordCount) && <><span style={{ opacity: 0.35 }}>·</span><span>{(outputData.word_count || outputData.wordCount).toLocaleString()} words</span></>}
                    </div>
                  </div>
                </div>
                <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 9, border: 'none', background: GRADIENT, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: "'Syne', sans-serif", letterSpacing: 0.5, whiteSpace: 'nowrap', flexShrink: 0, boxShadow: `0 4px 14px ${COLOR}35`, transition: 'all 0.18s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${COLOR}50`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 14px ${COLOR}35`; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                  Download DOCX
                </button>
              </div>
            )}

            {/* Inline document preview */}
            {downloadUrl && (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${metaBdr}`, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: metaBg, borderBottom: previewOpen ? `1px solid ${metaBdr}` : 'none' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: textColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="13" height="17" rx="2" stroke={COLOR} strokeWidth="1.5" /></svg>
                    Document Preview
                  </span>
                  <button onClick={() => setPreviewOpen(!previewOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedCol, fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em', transition: 'color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = textColor; }}
                    onMouseLeave={e => { e.currentTarget.style.color = mutedCol; }}>
                    {previewOpen ? '▲ Hide' : '▼ Show'}
                  </button>
                </div>
                {previewOpen && (
                  <div style={{ maxHeight: 420, overflow: 'auto', backgroundColor: isDark ? '#0D0D10' : '#FFFFFF', padding: '14px 16px' }}>
                    {previewLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, gap: 8, color: mutedCol, fontSize: 12 }}>
                        <span style={{ width: 14, height: 14, border: `2px solid ${COLOR}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'docxSpin 0.8s linear infinite', display: 'inline-block' }} />
                        Loading document preview…
                      </div>
                    ) : parsedDoc ? (
                      <>
                        {parsedDoc.type === 'html' && <div style={{ fontSize: 13, lineHeight: 1.7, color: textColor }} dangerouslySetInnerHTML={{ __html: parsedDoc.content }} />}
                        {parsedDoc.type === 'text' && <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: textColor, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: "'DM Mono', monospace" }}>{parsedDoc.content}</pre>}
                        {parsedDoc.type === 'unsupported' && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: mutedCol, fontSize: 12 }}>{parsedDoc.content}</div>}
                        {parsedDoc.metadata && (
                          <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${metaBdr}`, display: 'flex', gap: 14, fontSize: 10.5, color: mutedCol, fontFamily: "'DM Mono', monospace" }}>
                            {parsedDoc.metadata.pages && <span>{parsedDoc.metadata.pages} pages</span>}
                            {parsedDoc.metadata.wordCount && <span>{parsedDoc.metadata.wordCount.toLocaleString()} words</span>}
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* Action row */}
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {downloadUrl && (
                <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none', background: GRADIENT, color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Syne', sans-serif", boxShadow: `0 3px 10px ${COLOR}28`, transition: 'all 0.18s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                  DOWNLOAD DOCX
                </button>
              )}
              {downloadUrl && (
                <button onClick={() => window.open(resolveUrl(downloadUrl), '_blank')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 9, border: `1px solid ${metaBdr}`, background: 'transparent', color: mutedCol, fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = COLOR; e.currentTarget.style.color = COLOR; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = metaBdr; e.currentTarget.style.color = mutedCol; }}>
                  Open in new tab
                </button>
              )}
            </div>
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
        @keyframes docxPulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.45;transform:scale(0.82)} }
        @keyframes docxSpin    { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes docxShimmer { 0%{left:-60px} 100%{left:calc(100% + 60px)} }
        @keyframes docxSlideIn { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

export default DocxGenerationCard;
