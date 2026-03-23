'use client';

/**
 * ChatModelSelector — Dropdown button for selecting Claude model.
 * Lives in the prompt toolbar alongside KB, Voice, etc.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

// ─── Static model list ──────────────────────────────────────────────────────

interface ModelInfo {
  id: string;
  label: string;
  fullName: string;
  description: string;
}

const MODELS: ModelInfo[] = [
  {
    id: 'claude-sonnet-4-6',
    label: 'Sonnet 4',
    fullName: 'Claude Sonnet 4',
    description: 'Best balance of speed and capability',
  },
  {
    id: 'claude-opus-4-6',
    label: 'Opus 4',
    fullName: 'Claude Opus 4',
    description: 'Most powerful, best for complex reasoning',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'Haiku 4',
    fullName: 'Claude Haiku 4',
    description: 'Fastest, most efficient for simple tasks',
  },
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface ChatModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  isDark: boolean;
  disabled?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ChatModelSelector({
  selectedModel,
  onModelChange,
  isDark,
  disabled,
}: ChatModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  // Close on outside click
  useEffect(() => {
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

  const handleSelect = useCallback(
    (modelId: string) => {
      onModelChange(modelId);
      setOpen(false);
    },
    [onModelChange]
  );

  // Theme tokens
  const T = {
    text: isDark ? '#EFEFEF' : '#0A0A0B',
    muted: isDark ? '#606068' : '#808088',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    bg: isDark ? '#0D0D10' : '#FFFFFF',
    bgHover: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    panelBg: isDark ? '#141418' : '#FFFFFF',
    panelBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    panelShadow: isDark
      ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
    accent: '#60A5FA',
    accentBg: isDark ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.06)',
    accentBorder: 'rgba(96,165,250,0.35)',
    providerBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    providerText: isDark ? '#606068' : '#909098',
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        ref={buttonRef}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        title="Select model"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 10px',
          borderRadius: '8px',
          border: `1px solid ${open ? T.accentBorder : T.border}`,
          background: open ? T.accentBg : 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: T.text,
          fontFamily: "'DM Mono', monospace",
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.02em',
          opacity: disabled ? 0.4 : 1,
          transition: 'all .15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (!disabled && !open) {
            e.currentTarget.style.background = T.bgHover;
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
        {currentModel.label}
        <ChevronDown
          size={12}
          style={{
            transition: 'transform .2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Floating panel via portal */}
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
            width: '280px',
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
          <div
            style={{
              padding: '10px 14px 6px',
              fontFamily: "'DM Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase' as const,
              color: T.muted,
            }}
          >
            Select Model
          </div>

          {/* Model list */}
          <div style={{ padding: '4px 6px 6px' }}>
            {MODELS.map((model) => {
              const isSelected = model.id === selectedModel;
              return (
                <button
                  key={model.id}
                  onClick={() => handleSelect(model.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 10px',
                    borderRadius: '8px',
                    border: isSelected
                      ? `1px solid ${T.accentBorder}`
                      : '1px solid transparent',
                    background: isSelected ? T.accentBg : 'none',
                    cursor: 'pointer',
                    textAlign: 'left' as const,
                    transition: 'all .15s',
                    position: 'relative' as const,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = T.bgHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'none';
                    }
                  }}
                >
                  {/* Blue left-border highlight */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '8px',
                        bottom: '8px',
                        width: '3px',
                        borderRadius: '0 3px 3px 0',
                        background: T.accent,
                      }}
                    />
                  )}

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Provider label */}
                    <span
                      style={{
                        display: 'inline-block',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '8px',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase' as const,
                        color: T.providerText,
                        background: T.providerBg,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        marginBottom: '4px',
                      }}
                    >
                      Claude
                    </span>

                    {/* Model name */}
                    <div
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: '13px',
                        fontWeight: 600,
                        color: T.text,
                        letterSpacing: '-0.01em',
                        marginBottom: '2px',
                      }}
                    >
                      {model.fullName}
                    </div>

                    {/* Description */}
                    <div
                      style={{
                        fontSize: '11px',
                        color: T.muted,
                        lineHeight: 1.4,
                      }}
                    >
                      {model.description}
                    </div>
                  </div>

                  {/* Check icon */}
                  {isSelected && (
                    <Check
                      size={14}
                      color={T.accent}
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
        );
      })()}
    </div>
  );
}

export default ChatModelSelector;