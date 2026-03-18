'use client';

import React, { useState } from 'react';
import { Search, BookOpen, Copy, Check, ChevronDown, ChevronUp, Download, FileText, ExternalLink } from 'lucide-react';

interface FinancialResearchCardProps {
  success?: boolean;
  error?: string;
  text?: string;
  skill?: string;
  skill_name?: string;
  execution_time?: number;
  files?: Array<{ filename?: string; download_url?: string; size_kb?: number }>;
  // Research-specific
  company?: string;
  ticker?: string;
  rating?: string;
  target_price?: number;
  sections?: Array<{ title: string; content: string }>;
  sources?: Array<{ title: string; url?: string }>;
  _tool_time_ms?: number;
}

export function FinancialResearchCard(props: FinancialResearchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!props.success && props.error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '13px', marginTop: '8px', maxWidth: '700px' }}>
        Research Error: {props.error}
      </div>
    );
  }

  const accentColor = props.skill === 'initiating-coverage' ? '#818cf8' : '#14b8a6';
  const label = props.skill === 'initiating-coverage' ? 'INITIATING COVERAGE' : 'DEEP RESEARCH';

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${accentColor}40`, maxWidth: '750px', marginTop: '8px', background: `linear-gradient(135deg, ${accentColor}0A, ${accentColor}04)` }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', background: `${accentColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {props.skill === 'initiating-coverage' ? <BookOpen size={18} color={accentColor} /> : <Search size={18} color={accentColor} />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: accentColor }}>
              {props.skill_name || label} {props.ticker ? `— ${props.ticker}` : ''}
            </div>
            {props.company && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{props.company}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {props.rating && (
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: props.rating.toLowerCase().includes('buy') ? 'rgba(34,197,94,0.15)' : props.rating.toLowerCase().includes('sell') ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)', color: props.rating.toLowerCase().includes('buy') ? '#22c55e' : props.rating.toLowerCase().includes('sell') ? '#ef4444' : '#eab308' }}>
              {props.rating}
            </span>
          )}
          {props.target_price && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: accentColor }}>TP: ${props.target_price.toFixed(2)}</span>
          )}
          <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: `${accentColor}20`, color: accentColor, letterSpacing: '0.5px' }}>{label}</span>
        </div>
      </div>

      {/* Sections */}
      {props.sections && props.sections.length > 0 && (
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {props.sections.slice(0, expanded ? undefined : 3).map((section, i) => (
            <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{section.title}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{section.content.slice(0, 200)}{section.content.length > 200 ? '...' : ''}</div>
            </div>
          ))}
          {props.sections.length > 3 && (
            <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', padding: '8px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              {expanded ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Show All {props.sections.length} Sections</>}
            </button>
          )}
        </div>
      )}

      {/* Text */}
      {props.text && (
        <div style={{ padding: '14px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: expanded ? 'none' : '300px', overflow: 'hidden', position: 'relative' }}>
          {props.text}
          {!expanded && props.text.length > 600 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(transparent, rgba(13,17,23,0.95))' }} />}
        </div>
      )}

      {props.text && props.text.length > 600 && !props.sections?.length && (
        <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', padding: '8px', background: 'none', border: 'none', borderTop: `1px solid ${accentColor}10`, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          {expanded ? <><ChevronUp size={14} /> Collapse</> : <><ChevronDown size={14} /> Read Full Report</>}
        </button>
      )}

      {/* Sources */}
      {props.sources && props.sources.length > 0 && (
        <div style={{ padding: '8px 16px', borderTop: `1px solid ${accentColor}10`, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {props.sources.slice(0, 5).map((src, i) => (
            <a key={i} href={src.url || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: `${accentColor}10`, color: accentColor, textDecoration: 'none' }}>
              <ExternalLink size={10} /> {src.title}
            </a>
          ))}
        </div>
      )}

      {/* Files */}
      {props.files && props.files.length > 0 && (
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${accentColor}10`, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {props.files.map((file, i) => (
            <a key={i} href={file.download_url} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${accentColor}25`, background: `${accentColor}08`, color: accentColor, cursor: 'pointer', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
              <FileText size={14} /> {file.filename} <Download size={12} />
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '8px 16px', borderTop: `1px solid ${accentColor}08`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => { navigator.clipboard.writeText(props.text || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {copied ? <><Check size={12} color="#22c55e" /> Copied!</> : <><Copy size={12} /> Copy</>}
        </button>
        {props.execution_time && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{props.execution_time.toFixed(1)}s</span>}
      </div>
    </div>
  );
}

export default FinancialResearchCard;
