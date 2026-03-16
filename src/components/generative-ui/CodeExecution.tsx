'use client';

import React, { useState } from 'react';
import { Terminal, CheckCircle, XCircle, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface CodeExecutionProps {
  success?: boolean;
  output?: string;
  error?: string;
  traceback?: string;
  variables?: Record<string, string>;
  code?: string;
  description?: string;
  _tool_time_ms?: number;
}

export function CodeExecution(props: CodeExecutionProps) {
  const [showVars, setShowVars] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyOutput = () => {
    const text = props.output || props.error || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      borderRadius: '12px',
      overflow: 'hidden',
      border: `1px solid ${props.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
      maxWidth: '600px',
      marginTop: '8px',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: props.success
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={16} color={props.success ? '#22c55e' : '#ef4444'} />
          <span style={{ fontWeight: 700, fontSize: '13px', color: props.success ? '#22c55e' : '#ef4444' }}>
            {props.success ? 'Code Executed Successfully' : 'Execution Error'}
          </span>
          {props.success ? <CheckCircle size={14} color="#22c55e" /> : <XCircle size={14} color="#ef4444" />}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {props._tool_time_ms && (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{props._tool_time_ms}ms</span>
          )}
          <button onClick={copyOutput} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} color="rgba(255,255,255,0.5)" />}
          </button>
        </div>
      </div>

      {/* Output */}
      <div style={{ padding: '16px', backgroundColor: '#0d1117' }}>
        {props.description && (
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontStyle: 'italic' }}>
            {props.description}
          </div>
        )}
        
        <pre style={{
          margin: 0,
          fontSize: '13px',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          color: props.success ? '#e6edf3' : '#f97583',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.6,
        }}>
          {props.success ? (props.output || 'No output') : (props.error || 'Unknown error')}
        </pre>

        {props.traceback && (
          <pre style={{
            margin: '12px 0 0',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#f97583',
            whiteSpace: 'pre-wrap',
            opacity: 0.7,
          }}>
            {props.traceback}
          </pre>
        )}
      </div>

      {/* Variables (expandable) */}
      {props.variables && Object.keys(props.variables).length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => setShowVars(!showVars)}
            style={{
              width: '100%', padding: '10px 16px',
              background: 'rgba(255,255,255,0.03)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              color: 'rgba(255,255,255,0.6)', fontSize: '12px',
            }}
          >
            {showVars ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Variables ({Object.keys(props.variables).length})
          </button>
          {showVars && (
            <div style={{ padding: '8px 16px 12px', backgroundColor: '#0d1117' }}>
              {Object.entries(props.variables).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', gap: '8px', fontSize: '12px', marginBottom: '4px', fontFamily: 'monospace' }}>
                  <span style={{ color: '#79c0ff' }}>{key}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>=</span>
                  <span style={{ color: '#a5d6ff' }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Source code (expandable) */}
      {props.code && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => setShowCode(!showCode)}
            style={{
              width: '100%', padding: '10px 16px',
              background: 'rgba(255,255,255,0.03)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              color: 'rgba(255,255,255,0.6)', fontSize: '12px',
            }}
          >
            {showCode ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Source Code
          </button>
          {showCode && (
            <pre style={{ padding: '8px 16px 12px', backgroundColor: '#0d1117', margin: 0, fontSize: '12px', fontFamily: 'monospace', color: '#e6edf3', whiteSpace: 'pre-wrap' }}>
              {props.code}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default CodeExecution;
