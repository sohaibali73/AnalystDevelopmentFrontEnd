'use client';

import React, { useState } from 'react';
import { DollarSign, TrendingUp, ChevronDown, ChevronUp, Download, Copy, Check, BarChart3 } from 'lucide-react';

interface DCFModelCardProps {
  success?: boolean;
  error?: string;
  text?: string;
  skill_name?: string;
  execution_time?: number;
  files?: Array<{ filename?: string; download_url?: string; size_kb?: number }>;
  // DCF-specific fields from structured output
  company?: string;
  ticker?: string;
  intrinsic_value?: number;
  current_price?: number;
  upside_downside?: number;
  wacc?: number;
  terminal_growth_rate?: number;
  enterprise_value?: number;
  equity_value?: number;
  shares_outstanding?: number;
  sensitivity_matrix?: any;
  _tool_time_ms?: number;
}

export function DCFModelCard(props: DCFModelCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!props.success && props.error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '13px', marginTop: '8px', maxWidth: '700px' }}>
        DCF Model Error: {props.error}
      </div>
    );
  }

  const upside = props.upside_downside ?? (props.intrinsic_value && props.current_price
    ? ((props.intrinsic_value - props.current_price) / props.current_price * 100)
    : null);
  const isUndervalued = upside !== null && upside > 0;

  return (
    <div style={{
      borderRadius: '12px', overflow: 'hidden',
      border: '1px solid rgba(249,115,22,0.3)', maxWidth: '700px', marginTop: '8px',
      background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(234,88,12,0.04) 100%)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        background: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.08) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={18} color="#F97316" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#F97316' }}>
              DCF Valuation {props.ticker ? `— ${props.ticker}` : ''}
            </div>
            {props.company && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{props.company}</div>}
          </div>
        </div>
        <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(249,115,22,0.2)', color: '#FB923C', letterSpacing: '0.5px' }}>
          DCF MODEL
        </span>
      </div>

      {/* Key Metrics */}
      {(props.intrinsic_value || props.current_price || props.wacc) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1px', background: 'rgba(249,115,22,0.1)' }}>
          {props.intrinsic_value && (
            <div style={{ padding: '12px', background: 'rgba(13,17,23,0.9)', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>INTRINSIC VALUE</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#F97316' }}>${props.intrinsic_value.toFixed(2)}</div>
            </div>
          )}
          {props.current_price && (
            <div style={{ padding: '12px', background: 'rgba(13,17,23,0.9)', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>CURRENT PRICE</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#e6edf3' }}>${props.current_price.toFixed(2)}</div>
            </div>
          )}
          {upside !== null && (
            <div style={{ padding: '12px', background: 'rgba(13,17,23,0.9)', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>UPSIDE/DOWNSIDE</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: isUndervalued ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <TrendingUp size={14} style={{ transform: isUndervalued ? 'none' : 'rotate(180deg)' }} />
                {upside > 0 ? '+' : ''}{upside.toFixed(1)}%
              </div>
            </div>
          )}
          {props.wacc && (
            <div style={{ padding: '12px', background: 'rgba(13,17,23,0.9)', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>WACC</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#818cf8' }}>{(props.wacc * 100).toFixed(1)}%</div>
            </div>
          )}
        </div>
      )}

      {/* Text Output */}
      {props.text && (
        <div style={{ padding: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: expanded ? 'none' : '200px', overflow: 'hidden', position: 'relative' }}>
          {props.text}
          {!expanded && props.text.length > 400 && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(transparent, rgba(13,17,23,0.95))' }} />
          )}
        </div>
      )}

      {props.text && props.text.length > 400 && (
        <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', padding: '8px', background: 'none', border: 'none', borderTop: '1px solid rgba(249,115,22,0.1)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          {expanded ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Show Full Analysis</>}
        </button>
      )}

      {/* Files */}
      {props.files && props.files.length > 0 && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(249,115,22,0.1)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {props.files.map((file, i) => (
            <a key={i} href={file.download_url} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(249,115,22,0.2)', background: 'rgba(249,115,22,0.08)', color: '#FB923C', cursor: 'pointer', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
              <BarChart3 size={14} /> {file.filename} {file.size_kb && <span style={{ fontSize: '10px', opacity: 0.5 }}>{file.size_kb}KB</span>}
              <Download size={12} />
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(249,115,22,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => { navigator.clipboard.writeText(props.text || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {copied ? <><Check size={12} color="#22c55e" /> Copied!</> : <><Copy size={12} /> Copy</>}
        </button>
        {props.execution_time && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{props.execution_time.toFixed(1)}s</span>}
      </div>
    </div>
  );
}

export default DCFModelCard;
