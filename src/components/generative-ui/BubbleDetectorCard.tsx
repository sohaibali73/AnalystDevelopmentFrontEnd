'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, TrendingDown, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface BubbleDetectorCardProps {
  success?: boolean;
  error?: string;
  text?: string;
  skill_name?: string;
  execution_time?: number;
  // Bubble-specific fields
  risk_level?: 'low' | 'moderate' | 'elevated' | 'high' | 'extreme';
  risk_score?: number;
  indicators?: Array<{ name: string; signal: string; value?: string | number }>;
  summary?: string;
  _tool_time_ms?: number;
}

const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  low:      { bg: 'rgba(34,197,94,0.1)', text: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  moderate: { bg: 'rgba(234,179,8,0.1)', text: '#eab308', border: 'rgba(234,179,8,0.3)' },
  elevated: { bg: 'rgba(249,115,22,0.1)', text: '#f97316', border: 'rgba(249,115,22,0.3)' },
  high:     { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  extreme:  { bg: 'rgba(220,38,38,0.15)', text: '#dc2626', border: 'rgba(220,38,38,0.4)' },
};

export function BubbleDetectorCard(props: BubbleDetectorCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!props.success && props.error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '13px', marginTop: '8px', maxWidth: '700px' }}>
        Bubble Detector Error: {props.error}
      </div>
    );
  }

  const risk = props.risk_level || 'moderate';
  const rc = RISK_COLORS[risk] || RISK_COLORS.moderate;
  const score = props.risk_score ?? 50;

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${rc.border}`, maxWidth: '700px', marginTop: '8px', background: `linear-gradient(135deg, ${rc.bg}, rgba(13,17,23,0.95))` }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', background: rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${rc.text}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {risk === 'low' ? <ShieldCheck size={18} color={rc.text} /> : <AlertTriangle size={18} color={rc.text} />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: rc.text }}>US Market Bubble Detector</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Risk Assessment</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: rc.text }}>{score}/100</div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: rc.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{risk} RISK</div>
        </div>
      </div>

      {/* Risk bar */}
      <div style={{ padding: '0 16px', background: 'rgba(13,17,23,0.9)' }}>
        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', marginTop: '12px', marginBottom: '12px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(score, 100)}%`, borderRadius: '3px', background: `linear-gradient(90deg, #22c55e, #eab308, #ef4444)`, transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Indicators */}
      {props.indicators && props.indicators.length > 0 && (
        <div style={{ padding: '8px 16px 12px', background: 'rgba(13,17,23,0.9)' }}>
          {props.indicators.slice(0, expanded ? undefined : 5).map((ind, i) => {
            const sigColor = ind.signal === 'bullish' || ind.signal === 'low' ? '#22c55e' : ind.signal === 'bearish' || ind.signal === 'high' ? '#ef4444' : '#eab308';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < (expanded ? props.indicators!.length - 1 : 4) ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{ind.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {ind.value && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{ind.value}</span>}
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: `${sigColor}15`, color: sigColor, textTransform: 'uppercase' }}>{ind.signal}</span>
                </div>
              </div>
            );
          })}
          {props.indicators.length > 5 && (
            <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', padding: '6px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
              {expanded ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Show All {props.indicators.length} Indicators</>}
            </button>
          )}
        </div>
      )}

      {/* Text */}
      {props.text && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: '250px', overflowY: 'auto' }}>
          {props.text}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => { navigator.clipboard.writeText(props.text || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {copied ? <><Check size={12} color="#22c55e" /> Copied!</> : <><Copy size={12} /> Copy</>}
        </button>
        {props.execution_time && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{props.execution_time.toFixed(1)}s</span>}
      </div>
    </div>
  );
}

export default BubbleDetectorCard;
