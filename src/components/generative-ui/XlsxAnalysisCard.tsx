'use client';

/**
 * XlsxAnalysisCard — Generative UI card for the analyze_xlsx tool.
 * Shows data quality report: null values, duplicates, numeric stats, column types.
 */

import React, { useState } from 'react';

const COLOR = '#217346';

interface ColumnStat {
  column: string;
  type?: string;
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  std?: number;
  null_count?: number;
  unique_count?: number;
}

interface SheetInfo {
  name: string;
  rows?: number;
  columns?: number;
  null_count?: number;
  duplicate_count?: number;
}

interface XlsxAnalysisData {
  success?: boolean;
  filename?: string;
  title?: string;
  sheet_count?: number;
  row_count?: number;
  column_count?: number;
  null_count?: number;
  duplicate_count?: number;
  numeric_stats?: ColumnStat[];
  data_types?: Record<string, string>;
  sheets?: SheetInfo[];
  issues?: string[];
  text?: string;
  error?: string;
}

export interface XlsxAnalysisCardProps {
  toolCallId: string;
  toolName: string;
  input?: any;
  output?: any;
  externalOutput?: any;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  errorText?: string;
  conversationId?: string;
}

export function XlsxAnalysisCard({ state, output, externalOutput, errorText }: XlsxAnalysisCardProps) {
  const [statsOpen, setStatsOpen] = useState(false);
  const [sheetsOpen, setSheetsOpen] = useState(true);

  const isDark =
    typeof window !== 'undefined' &&
    (document.documentElement.getAttribute('data-theme') === 'dark' ||
      window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const cardBg    = isDark ? 'rgba(17,17,20,0.88)'    : 'rgba(250,250,250,0.88)';
  const textColor = isDark ? '#F0F0F0'                : '#111111';
  const mutedCol  = isDark ? '#7A7A88'                : '#6B7280';
  const metaBg    = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
  const metaBdr   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div style={{ marginTop: 12, borderRadius: 12, padding: 20, border: `1px solid ${COLOR}28`, backgroundColor: cardBg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 16, height: 16, border: `2px solid ${COLOR}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'xlsxAnalSpin 0.8s linear infinite', display: 'inline-block' }} />
          <span style={{ fontSize: 13, color: mutedCol }}>Analysing Excel spreadsheet…</span>
        </div>
        <style>{`@keyframes xlsxAnalSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const data: XlsxAnalysisData = output || externalOutput || {};

  if (state === 'output-error' && !data.row_count && !data.text) {
    return (
      <div style={{ marginTop: 12, borderRadius: 12, padding: '14px 16px', backgroundColor: isDark ? 'rgba(239,68,68,0.09)' : '#FEF2F2', border: '1px solid rgba(239,68,68,0.18)', color: isDark ? '#FCA5A5' : '#DC2626', fontSize: 13 }}>
        ⚠ {errorText || 'Analysis failed — please try again.'}
      </div>
    );
  }

  const numericStats: ColumnStat[] = data.numeric_stats || [];
  const sheets: SheetInfo[] = Array.isArray(data.sheets) && typeof data.sheets[0] === 'object'
    ? (data.sheets as SheetInfo[])
    : [];

  const hasQualityIssues = (data.null_count ?? 0) > 0 || (data.duplicate_count ?? 0) > 0;

  return (
    <div style={{ marginTop: 12, borderRadius: 16, overflow: 'hidden', border: `1px solid ${COLOR}28`, backgroundColor: cardBg, fontFamily: "'Instrument Sans', sans-serif", boxShadow: isDark ? `0 8px 32px ${COLOR}20` : `0 8px 32px ${COLOR}12`, animation: 'xlsxAnalSlideIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
      <div style={{ height: 3, background: `linear-gradient(90deg,${COLOR},#10B981)` }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: isDark ? 'rgba(33,115,70,0.15)' : 'rgba(33,115,70,0.08)', border: `1px solid ${COLOR}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" fill={COLOR} opacity="0.12" stroke={COLOR} strokeWidth="1.5" />
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke={COLOR} strokeWidth="1.2" opacity="0.6" />
              <path d="M9 9l2 2 4-4" stroke={COLOR} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13.5, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.filename || data.title || 'Excel Analysis'}
            </div>
            <div style={{ fontSize: 11.5, color: mutedCol, marginTop: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
              <span>Spreadsheet Analysis</span>
              {data.sheet_count && <><span style={{ opacity: 0.4 }}>·</span><span>{data.sheet_count} sheet{data.sheet_count !== 1 ? 's' : ''}</span></>}
              <span style={{ opacity: 0.35 }}>·</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4, backgroundColor: `${COLOR}14`, color: COLOR, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>ANALYSE</span>
            </div>
          </div>
        </div>

        {/* Key metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Rows', value: data.row_count?.toLocaleString() },
            { label: 'Columns', value: data.column_count },
            { label: 'Sheets', value: data.sheet_count },
            { label: 'Null Values', value: data.null_count?.toLocaleString(), warn: (data.null_count ?? 0) > 0 },
            { label: 'Duplicates', value: data.duplicate_count?.toLocaleString(), warn: (data.duplicate_count ?? 0) > 0 },
          ].filter(m => m.value !== undefined).map((m, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 9, background: m.warn ? (isDark ? 'rgba(251,191,36,0.08)' : 'rgba(251,191,36,0.06)') : metaBg, border: `1px solid ${m.warn ? 'rgba(251,191,36,0.2)' : metaBdr}`, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: m.warn ? '#F59E0B' : textColor, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: 9.5, color: mutedCol, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Data quality summary */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {!hasQualityIssues ? (
            <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 600 }}>✓ No data quality issues detected</span>
          ) : (
            <>
              {(data.null_count ?? 0) > 0 && <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: 'rgba(251,191,36,0.12)', color: '#F59E0B', fontWeight: 600 }}>⚠ {data.null_count} null values</span>}
              {(data.duplicate_count ?? 0) > 0 && <span style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: 'rgba(251,191,36,0.12)', color: '#F59E0B', fontWeight: 600 }}>⚠ {data.duplicate_count} duplicate rows</span>}
            </>
          )}
          {data.issues?.map((issue, i) => (
            <span key={i} style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 600 }}>⚠ {issue}</span>
          ))}
        </div>

        {/* Sheet breakdown */}
        {sheets.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <button onClick={() => setSheetsOpen(!sheetsOpen)} style={{ background: 'none', border: 'none', color: textColor, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, padding: '0 0 8px 0' }}>
              {sheetsOpen ? '▲' : '▼'} Sheet Breakdown ({sheets.length})
            </button>
            {sheetsOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {sheets.map((s, i) => (
                  <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: metaBg, border: `1px solid ${metaBdr}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: `${COLOR}14`, border: `1px solid ${COLOR}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke={COLOR} strokeWidth="1.5" /><path d="M3 9h18M9 3v18" stroke={COLOR} strokeWidth="1.2" opacity="0.6" /></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: textColor }}>{s.name}</div>
                      <div style={{ fontSize: 10.5, color: mutedCol, fontFamily: "'DM Mono', monospace", marginTop: 1 }}>
                        {s.rows && `${s.rows.toLocaleString()} rows`}{s.columns && ` · ${s.columns} cols`}
                      </div>
                    </div>
                    {s.null_count !== undefined && s.null_count > 0 && (
                      <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: 'rgba(251,191,36,0.12)', color: '#F59E0B', fontWeight: 600 }}>{s.null_count} nulls</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Numeric stats */}
        {numericStats.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <button onClick={() => setStatsOpen(!statsOpen)} style={{ background: 'none', border: 'none', color: mutedCol, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0', fontFamily: "'DM Mono', monospace" }}>
              {statsOpen ? '▲' : '▼'} {statsOpen ? 'Hide' : 'Show'} numeric statistics ({numericStats.length} columns)
            </button>
            {statsOpen && (
              <div style={{ overflowX: 'auto', marginTop: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                  <thead>
                    <tr>
                      {['Column', 'Mean', 'Median', 'Min', 'Max', 'Std', 'Nulls'].map(h => (
                        <th key={h} style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 700, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.5, color: COLOR, borderBottom: `1px solid ${metaBdr}`, backgroundColor: `${COLOR}09`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {numericStats.map((stat, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)') }}>
                        <td style={{ padding: '4px 8px', borderBottom: `1px solid ${metaBdr}`, color: textColor, fontWeight: 600 }}>{stat.column}</td>
                        {[stat.mean, stat.median, stat.min, stat.max, stat.std].map((v, j) => (
                          <td key={j} style={{ padding: '4px 8px', borderBottom: `1px solid ${metaBdr}`, color: mutedCol }}>{v !== undefined ? Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>
                        ))}
                        <td style={{ padding: '4px 8px', borderBottom: `1px solid ${metaBdr}`, color: (stat.null_count ?? 0) > 0 ? '#F59E0B' : mutedCol }}>{stat.null_count ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Text output */}
        {data.text && (
          <div style={{ padding: '12px 14px', borderRadius: 9, background: metaBg, border: `1px solid ${metaBdr}`, fontSize: 12.5, color: textColor, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {data.text}
          </div>
        )}
      </div>

      <style>{`
        @keyframes xlsxAnalSlideIn { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes xlsxAnalSpin    { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

export default XlsxAnalysisCard;
