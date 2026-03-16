'use client';

import React, { useState } from 'react';
import { Code2, CheckCircle, XCircle, AlertTriangle, Copy, Check, Bug, BookOpen, Wand2, Shield } from 'lucide-react';

// ---- AFL Generate Result ----
interface AFLGenerateProps {
  success?: boolean;
  description?: string;
  strategy_type?: string;
  afl_code?: string;
  explanation?: string;
  error?: string;
  _tool_time_ms?: number;
}

export function AFLGenerateCard({ success, description, strategy_type, afl_code, explanation, error, _tool_time_ms }: AFLGenerateProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(afl_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!success) {
    return <ErrorCard title="AFL Generation Failed" error={error} />;
  }

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(254, 192, 15, 0.3)', maxWidth: '700px', marginTop: '8px' }}>
      <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, rgba(254, 192, 15, 0.15) 0%, rgba(254, 192, 15, 0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wand2 size={16} color="#FEC00F" />
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#FEC00F' }}>AFL Code Generated</span>
          {strategy_type && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(254, 192, 15, 0.2)', color: '#FEC00F' }}>{strategy_type}</span>}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {_tool_time_ms && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{_tool_time_ms}ms</span>}
          <button onClick={copyCode} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
            {copied ? <><Check size={14} color="#22c55e" /> Copied!</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
      </div>
      {description && <div style={{ padding: '8px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontStyle: 'italic' }}>{description}</div>}
      <pre style={{ margin: 0, padding: '16px', backgroundColor: '#0d1117', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#e6edf3', whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: '400px', overflowY: 'auto' }}>
        {afl_code || 'No code generated'}
      </pre>
      {explanation && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
          <BookOpen size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} color="rgba(255,255,255,0.5)" />
          {explanation}
        </div>
      )}
    </div>
  );
}

// ---- AFL Validate Result ----
interface AFLValidateProps {
  success?: boolean;
  valid?: boolean;
  errors?: string[];
  warnings?: string[];
  line_count?: number;
  has_buy_sell?: boolean;
  has_plot?: boolean;
  _tool_time_ms?: number;
}

export function AFLValidateCard(props: AFLValidateProps) {
  const isValid = props.valid ?? props.success;
  const errors = props.errors || [];
  const warnings = props.warnings || [];

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${isValid ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, maxWidth: '600px', marginTop: '8px' }}>
      <div style={{ padding: '12px 16px', background: isValid ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color={isValid ? '#22c55e' : '#ef4444'} />
          <span style={{ fontWeight: 700, fontSize: '13px', color: isValid ? '#22c55e' : '#ef4444' }}>
            {isValid ? 'AFL Code Valid ✓' : 'AFL Validation Issues'}
          </span>
        </div>
        {props._tool_time_ms && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{props._tool_time_ms}ms</span>}
      </div>
      <div style={{ padding: '16px', backgroundColor: '#0d1117' }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: errors.length > 0 || warnings.length > 0 ? '12px' : '0', flexWrap: 'wrap' }}>
          {props.line_count && <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>📄 {props.line_count} lines</span>}
          {props.has_buy_sell && <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>📈 Buy/Sell signals</span>}
          {props.has_plot && <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>📊 Plot functions</span>}
        </div>
        {errors.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            {errors.map((err, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#f97583', marginBottom: '4px' }}>
                <XCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} /> {err}
              </div>
            ))}
          </div>
        )}
        {warnings.length > 0 && (
          <div>
            {warnings.map((warn, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#d29922', marginBottom: '4px' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} /> {warn}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- AFL Debug Result ----
interface AFLDebugProps {
  success?: boolean;
  original_code?: string;
  error_message?: string;
  fixed_code?: string;
  error?: string;
  _tool_time_ms?: number;
}

export function AFLDebugCard({ success, fixed_code, error_message, error, _tool_time_ms }: AFLDebugProps) {
  const [copied, setCopied] = useState(false);

  if (!success) return <ErrorCard title="AFL Debug Failed" error={error} />;

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(99, 102, 241, 0.3)', maxWidth: '700px', marginTop: '8px' }}>
      <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bug size={16} color="#818cf8" />
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#818cf8' }}>AFL Code Debugged & Fixed</span>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(fixed_code || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
          {copied ? <><Check size={14} color="#22c55e" /> Copied!</> : <><Copy size={14} /> Copy Fixed Code</>}
        </button>
      </div>
      {error_message && <div style={{ padding: '8px 16px', fontSize: '12px', color: '#f97583', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Original error: {error_message}</div>}
      <pre style={{ margin: 0, padding: '16px', backgroundColor: '#0d1117', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#e6edf3', whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: '400px', overflowY: 'auto' }}>
        {fixed_code || 'No fixed code'}
      </pre>
    </div>
  );
}

// ---- AFL Explain Result ----
interface AFLExplainProps {
  success?: boolean;
  code?: string;
  explanation?: string;
  error?: string;
  _tool_time_ms?: number;
}

export function AFLExplainCard({ success, explanation, error, _tool_time_ms }: AFLExplainProps) {
  if (!success) return <ErrorCard title="AFL Explanation Failed" error={error} />;

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(59, 130, 246, 0.3)', maxWidth: '700px', marginTop: '8px' }}>
      <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BookOpen size={16} color="#3b82f6" />
        <span style={{ fontWeight: 700, fontSize: '13px', color: '#3b82f6' }}>AFL Code Explanation</span>
      </div>
      <div style={{ padding: '16px', backgroundColor: '#0d1117', fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {explanation || 'No explanation available'}
      </div>
    </div>
  );
}

// ---- AFL Sanity Check Result ----
interface AFLSanityCheckProps {
  success?: boolean;
  original_valid?: boolean;
  total_issues_found?: number;
  auto_fixed?: boolean;
  fixes_applied?: string[];
  fixed_code?: string;
  fixed_valid?: boolean;
  error?: string;
  _tool_time_ms?: number;
}

export function AFLSanityCheckCard(props: AFLSanityCheckProps) {
  const [copied, setCopied] = useState(false);
  const wasFixed = props.auto_fixed && !props.original_valid && props.fixed_valid;

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${props.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, maxWidth: '700px', marginTop: '8px' }}>
      <div style={{ padding: '12px 16px', background: wasFixed ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(254, 192, 15, 0.05) 100%)' : props.success ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color={props.success ? '#22c55e' : '#ef4444'} />
          <span style={{ fontWeight: 700, fontSize: '13px', color: props.success ? '#22c55e' : '#ef4444' }}>
            {wasFixed ? 'AFL Sanity Check — Auto-Fixed ✓' : props.original_valid ? 'AFL Sanity Check — Clean ✓' : 'AFL Sanity Check — Issues Found'}
          </span>
        </div>
        {props.fixed_code && (
          <button onClick={() => { navigator.clipboard.writeText(props.fixed_code || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
            {copied ? <><Check size={14} color="#22c55e" /> Copied!</> : <><Copy size={14} /> Copy</>}
          </button>
        )}
      </div>

      <div style={{ padding: '16px', backgroundColor: '#0d1117' }}>
        {props.total_issues_found !== undefined && props.total_issues_found > 0 && (
          <div style={{ marginBottom: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
            Found <strong style={{ color: '#FEC00F' }}>{props.total_issues_found}</strong> issue{props.total_issues_found !== 1 ? 's' : ''}
            {wasFixed && <span style={{ color: '#22c55e' }}> — all auto-fixed!</span>}
          </div>
        )}
        {props.fixes_applied && props.fixes_applied.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            {props.fixes_applied.map((fix, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#22c55e', marginBottom: '4px' }}>
                <CheckCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} /> {fix}
              </div>
            ))}
          </div>
        )}
        {props.fixed_code && (
          <pre style={{ margin: 0, fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#e6edf3', whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: '300px', overflowY: 'auto' }}>
            {props.fixed_code}
          </pre>
        )}
      </div>
    </div>
  );
}

// ---- Shared Error Card ----
function ErrorCard({ title, error }: { title: string; error?: string }) {
  return (
    <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '14px', marginTop: '8px', maxWidth: '600px' }}>
      <strong>{title}:</strong> {error || 'Unknown error'}
    </div>
  );
}
