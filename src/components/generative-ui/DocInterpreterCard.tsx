'use client';

import React, { useState } from 'react';
import { FileSearch, Copy, Check, ChevronDown, ChevronUp, Table2, FileText, Image } from 'lucide-react';

interface DocInterpreterCardProps {
  success?: boolean;
  error?: string;
  text?: string;
  skill_name?: string;
  execution_time?: number;
  // Doc-specific
  extraction_mode?: string;
  source_file?: string;
  page_count?: number;
  tables?: Array<{ headers: string[]; rows: string[][] }>;
  fields?: Record<string, string>;
  confidence?: number;
  _tool_time_ms?: number;
}

export function DocInterpreterCard(props: DocInterpreterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'tables' | 'fields'>('text');

  if (!props.success && props.error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '13px', marginTop: '8px', maxWidth: '700px' }}>
        Document Interpreter Error: {props.error}
      </div>
    );
  }

  const hasTables = props.tables && props.tables.length > 0;
  const hasFields = props.fields && Object.keys(props.fields).length > 0;

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(16,185,129,0.3)', maxWidth: '750px', marginTop: '8px', background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(20,184,166,0.04) 100%)' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSearch size={18} color="#10b981" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#10b981' }}>Document Interpreter</div>
            {props.source_file && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{props.source_file}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {props.extraction_mode && (
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {props.extraction_mode}
            </span>
          )}
          {props.page_count && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{props.page_count} pages</span>}
          {props.confidence && <span style={{ fontSize: '11px', color: props.confidence > 0.8 ? '#22c55e' : '#eab308' }}>{(props.confidence * 100).toFixed(0)}% conf</span>}
        </div>
      </div>

      {/* Tabs */}
      {(hasTables || hasFields) && (
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(16,185,129,0.1)', background: 'rgba(13,17,23,0.5)' }}>
          {['text', ...(hasTables ? ['tables'] : []), ...(hasFields ? ['fields'] : [])].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} style={{
              padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === tab ? '#10b981' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              {tab === 'text' && <FileText size={12} />}
              {tab === 'tables' && <Table2 size={12} />}
              {tab === 'fields' && <Image size={12} />}
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {activeTab === 'text' && props.text && (
        <div style={{ padding: '14px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: expanded ? 'none' : '300px', overflow: 'hidden', position: 'relative' }}>
          {props.text}
          {!expanded && props.text.length > 600 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(transparent, rgba(13,17,23,0.95))' }} />}
        </div>
      )}

      {activeTab === 'tables' && hasTables && (
        <div style={{ padding: '12px 16px', overflowX: 'auto' }}>
          {props.tables!.map((table, tIdx) => (
            <div key={tIdx} style={{ marginBottom: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr>
                    {table.headers.map((h, hIdx) => (
                      <th key={hIdx} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.slice(0, expanded ? undefined : 10).map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ padding: '5px 8px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.7)' }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {table.rows.length > 10 && !expanded && (
                <div style={{ textAlign: 'center', padding: '4px', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                  +{table.rows.length - 10} more rows
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'fields' && hasFields && (
        <div style={{ padding: '12px 16px' }}>
          {Object.entries(props.fields!).map(([key, value], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{key}</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {props.text && props.text.length > 600 && (
        <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', padding: '8px', background: 'none', border: 'none', borderTop: '1px solid rgba(16,185,129,0.1)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          {expanded ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Show All</>}
        </button>
      )}

      {/* Footer */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(16,185,129,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => { navigator.clipboard.writeText(props.text || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {copied ? <><Check size={12} color="#22c55e" /> Copied!</> : <><Copy size={12} /> Copy</>}
        </button>
        {props.execution_time && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{props.execution_time.toFixed(1)}s</span>}
      </div>
    </div>
  );
}

export default DocInterpreterCard;
