'use client';

/**
 * SkillResultCard — Generic generative UI card for Claude skill execution results.
 * Renders the output of any skill with appropriate formatting based on skill type.
 */

import React, { useState } from 'react';
import {
  Sparkles, Copy, Check, Download, ChevronDown, ChevronUp,
  Clock, Cpu, FileText, Zap,
} from 'lucide-react';

interface SkillResultCardProps {
  success?: boolean;
  text?: string;
  skill?: string;
  skill_name?: string;
  usage?: { input_tokens: number; output_tokens: number };
  model?: string;
  execution_time?: number;
  stop_reason?: string;
  files?: Array<{
    file_id?: string;
    filename?: string;
    file_type?: string;
    download_url?: string;
    size_kb?: number;
  }>;
  error?: string;
  // Tool metadata
  _tool_time_ms?: number;
}

export function SkillResultCard(props: SkillResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  if (!props.success && props.error) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: '12px',
        color: '#ef4444',
        fontSize: '13px',
        marginTop: '8px',
        maxWidth: '700px',
        animation: 'skill-result-enter 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Zap size={16} />
          <strong>Skill Error: {props.skill_name || props.skill || 'Unknown'}</strong>
        </div>
        {props.error}
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(props.text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = async (file: any) => {
    if (!file.download_url) return;
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
      const resp = await fetch(file.download_url, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      if (!resp.ok) throw new Error('Download failed');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const totalTokens = props.usage
    ? (props.usage.input_tokens || 0) + (props.usage.output_tokens || 0)
    : null;

  return (
    <div style={{
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(254, 192, 15, 0.25)',
      maxWidth: '750px',
      marginTop: '8px',
      background: 'linear-gradient(135deg, rgba(254, 192, 15, 0.06) 0%, rgba(254, 192, 15, 0.03) 100%)',
      animation: 'skill-result-enter 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}
    onMouseEnter={(e) => {
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.borderColor = 'rgba(254, 192, 15, 0.4)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(254, 192, 15, 0.1)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }
    }}
    onMouseLeave={(e) => {
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.borderColor = 'rgba(254, 192, 15, 0.25)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }
    }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        background: 'linear-gradient(135deg, rgba(254, 192, 15, 0.08) 0%, rgba(254, 192, 15, 0.04) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(254, 192, 15, 0.15)',
        transition: 'all 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#FEC00F" style={{ animation: 'skill-spark 0.6s ease-in-out infinite' }} />
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#FEC00F' }}>
            {props.skill_name || props.skill || 'Skill Result'}
          </span>
          <span style={{
            fontSize: '9px',
            fontWeight: 700,
            padding: '3px 6px',
            borderRadius: '4px',
            backgroundColor: 'rgba(254, 192, 15, 0.15)',
            color: '#FEC00F',
            letterSpacing: '0.5px',
            animation: 'skill-badge-pulse 2s ease-in-out infinite',
          }}>
            SKILL
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {props.execution_time && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              <Clock size={11} /> {props.execution_time.toFixed(1)}s
            </span>
          )}
          {totalTokens && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              <Cpu size={11} /> {totalTokens.toLocaleString()} tokens
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'rgba(255,255,255,0.5)', 
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            }}
          >
            {expanded ? <ChevronUp size={14} style={{ transition: 'transform 0.2s ease' }} /> : <ChevronDown size={14} style={{ transition: 'transform 0.2s ease' }} />}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Content */}
          <div style={{
            padding: '16px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            maxHeight: '500px',
            overflowY: 'auto',
          }}>
            {props.text || 'No output'}
          </div>

          {/* Files */}
          {props.files && props.files.length > 0 && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(96,165,250,0.1)',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}>
              {props.files.map((file, i) => (
                <button
                  key={i}
                  onClick={() => handleDownloadFile(file)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(96,165,250,0.2)',
                    background: 'rgba(96,165,250,0.08)',
                    color: '#93C5FD',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <FileText size={14} />
                  <span>{file.filename || 'Download'}</span>
                  {file.size_kb && (
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                      {file.size_kb}KB
                    </span>
                  )}
                  <Download size={12} />
                </button>
              ))}
            </div>
          )}

          {/* Footer actions */}
          <div style={{
            padding: '8px 16px',
            borderTop: '1px solid rgba(96,165,250,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <button
              onClick={handleCopy}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '11px',
                borderRadius: '4px',
              }}
            >
              {copied ? <><Check size={12} color="#22c55e" /> Copied!</> : <><Copy size={12} /> Copy</>}
            </button>
            {props.model && (
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                {props.model}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default SkillResultCard;
