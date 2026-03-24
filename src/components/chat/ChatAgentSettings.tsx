'use client';

import React, { useState } from 'react';
import { Settings, X, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ChatAgentSettingsProps {
  isDark: boolean;
  thinkingEffort: string;
  onThinkingEffortChange: (effort: string) => void;
  usePromptCaching: boolean;
  onUsePromptCachingChange: (value: boolean) => void;
  maxIterations: number;
  onMaxIterationsChange: (value: number) => void;
  pinModelVersion: boolean;
  onPinModelVersionChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ChatAgentSettings({
  isDark,
  thinkingEffort,
  onThinkingEffortChange,
  usePromptCaching,
  onUsePromptCachingChange,
  maxIterations,
  onMaxIterationsChange,
  pinModelVersion,
  onPinModelVersionChange,
  disabled,
}: ChatAgentSettingsProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const T = {
    text: isDark ? '#EFEFEF' : '#0A0A0B',
    muted: isDark ? '#606068' : '#808088',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    bg: isDark ? '#0D0D10' : '#FFFFFF',
    panelBg: isDark ? '#141418' : '#FFFFFF',
    panelBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    panelShadow: isDark
      ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
    accent: '#60A5FA',
    accentBg: isDark ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.06)',
    accentBorder: 'rgba(96,165,250,0.35)',
    inputBg: isDark ? '#1a1a1e' : '#f5f5f5',
    toggleBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    toggleActiveBg: 'rgba(96,165,250,0.2)',
  };

  const hasCustomSettings = thinkingEffort !== 'medium' || !usePromptCaching || maxIterations !== 5 || pinModelVersion;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        title="Agent Settings"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          border: `1px solid ${open ? T.accentBorder : T.border}`,
          background: open ? T.accentBg : 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: hasCustomSettings ? T.accent : T.muted,
          opacity: disabled ? 0.4 : 1,
          transition: 'all .15s',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!disabled && !open) {
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
            e.currentTarget.style.borderColor = T.accentBorder;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !open) {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.borderColor = T.border;
          }
        }}
      >
        <Settings size={14} />
        {hasCustomSettings && (
          <span style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: T.accent,
          }} />
        )}
      </button>

      {open && typeof document !== 'undefined' && (() => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return null;
        return createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              bottom: window.innerHeight - rect.top + 8,
              right: window.innerWidth - rect.right,
              width: '320px',
              borderRadius: '12px',
              border: `1px solid ${T.panelBorder}`,
              background: T.panelBg,
              boxShadow: T.panelShadow,
              overflow: 'hidden',
              zIndex: 10000,
              animation: 'chat-fadeIn 0.15s ease-out',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px 8px',
              borderBottom: `1px solid ${T.border}`,
            }}>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '9px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
                color: T.muted,
              }}>
                Agent Settings
              </span>
              <button
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: T.muted,
                  transition: 'background .15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.toggleBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <X size={12} />
              </button>
            </div>

            {/* Settings */}
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Thinking Effort */}
              <div>
                <label style={{
                  display: 'block',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  color: T.muted,
                  marginBottom: '6px',
                  textTransform: 'uppercase' as const,
                }}>
                  Thinking Effort
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['low', 'medium', 'high'].map((effort) => (
                    <button
                      key={effort}
                      onClick={() => onThinkingEffortChange(effort)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: `1px solid ${thinkingEffort === effort ? T.accentBorder : T.border}`,
                        background: thinkingEffort === effort ? T.toggleActiveBg : 'transparent',
                        color: thinkingEffort === effort ? T.accent : T.muted,
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textTransform: 'capitalize' as const,
                        transition: 'all .15s',
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {effort}
                    </button>
                  ))}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '10px', color: T.muted, lineHeight: 1.4 }}>
                  Controls reasoning depth. Higher = better quality, slower.
                </p>
              </div>

              {/* Prompt Caching */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: T.text }}>Prompt Caching</span>
                  <p style={{ margin: '2px 0 0', fontSize: '10px', color: T.muted, lineHeight: 1.4 }}>
                    Cache system prompt for faster responses
                  </p>
                </div>
                <button
                  onClick={() => onUsePromptCachingChange(!usePromptCaching)}
                  style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: usePromptCaching ? T.accent : T.toggleBg,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background .2s',
                    flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    left: usePromptCaching ? '18px' : '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left .2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>

              {/* Max Iterations */}
              <div>
                <label style={{
                  display: 'block',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  color: T.muted,
                  marginBottom: '6px',
                  textTransform: 'uppercase' as const,
                }}>
                  Max Tool Iterations
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[3, 5, 7, 10].map((val) => (
                    <button
                      key={val}
                      onClick={() => onMaxIterationsChange(val)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: `1px solid ${maxIterations === val ? T.accentBorder : T.border}`,
                        background: maxIterations === val ? T.toggleActiveBg : 'transparent',
                        color: maxIterations === val ? T.accent : T.muted,
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all .15s',
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '10px', color: T.muted, lineHeight: 1.4 }}>
                  More iterations = more tool calls per response
                </p>
              </div>

              {/* Pin Model Version */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: T.text }}>Pin Model Version</span>
                  <p style={{ margin: '2px 0 0', fontSize: '10px', color: T.muted, lineHeight: 1.4 }}>
                    Use stable snapshot for production
                  </p>
                </div>
                <button
                  onClick={() => onPinModelVersionChange(!pinModelVersion)}
                  style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: pinModelVersion ? T.accent : T.toggleBg,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background .2s',
                    flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    left: pinModelVersion ? '18px' : '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left .2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
}

export default ChatAgentSettings;