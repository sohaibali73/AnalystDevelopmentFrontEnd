'use client';

/**
 * YangSettingsPanel — unified settings popover.
 *
 * Replaces the legacy ChatAgentSettings.tsx. Absorbs:
 *   • Agent settings (thinking effort, prompt caching, max iterations, pin model)
 *   • YANG feature flags (10 advanced agentic features)
 *
 * Design: no emojis — lucide-react icons only. Tabs: Features / Model.
 * Rendered via portal so it floats above the chat input.
 */

import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles, X,
  Shield, Zap, Search, GitBranch, Target, Archive,
  Gauge, Clock, Bookmark, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronUp,
  Settings2,
} from 'lucide-react';
import type { YangConfig, YangAdvanced } from '@/types/yang';

// ─── Feature metadata ─────────────────────────────────────────────────────────

type YangKey = keyof Omit<YangConfig, 'advanced'>;

interface FeatureDef {
  key: YangKey;
  label: string;
  desc: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
  accent: string;      // tint when active
  warning?: boolean;   // yolo mode → red accent
}

const FEATURES: FeatureDef[] = [
  { key: 'plan_mode',       label: 'Plan Mode',       desc: 'Read-only tools only',        Icon: Shield,        accent: '#3B82F6' },
  { key: 'yolo_mode',       label: 'Yolo Mode',       desc: 'Auto-approve all tools',      Icon: Zap,           accent: '#EF4444', warning: true },
  { key: 'tool_search',     label: 'Tool Search',     desc: 'Lazy-load tools for context', Icon: Search,        accent: '#06B6D4' },
  { key: 'subagents',       label: 'Subagents',       desc: 'Parallel focused workers',    Icon: GitBranch,     accent: '#8B5CF6' },
  { key: 'focus_chain',     label: 'Focus Chain',     desc: 'Rolling task tracker',        Icon: Target,        accent: '#10B981' },
  { key: 'auto_compact',    label: 'Auto Compact',    desc: 'Summarize old history',       Icon: Archive,       accent: '#F59E0B' },
  { key: 'parallel_tools',  label: 'Parallel Tools',  desc: 'Concurrent read tools',       Icon: Gauge,         accent: '#06B6D4' },
  { key: 'background_edit', label: 'Background Edit', desc: 'Queue doc generation',        Icon: Clock,         accent: '#F59E0B' },
  { key: 'checkpoints',     label: 'Checkpoints',     desc: 'Save rollback points',        Icon: Bookmark,      accent: '#6366F1' },
  { key: 'double_check',    label: 'Double-Check',    desc: 'Verify before finishing',     Icon: CheckCircle2,  accent: '#10B981' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface YangSettingsPanelProps {
  isDark: boolean;
  disabled?: boolean;

  // YANG feature state
  settings: YangConfig;
  advanced: YangAdvanced;
  saving?: boolean;
  onFeatureChange: (key: YangKey, value: boolean) => void;
  onAdvancedChange: (patch: Partial<YangAdvanced>) => void;

  // Agent (model) settings — preserved from ChatAgentSettings
  thinkingEffort: string;
  onThinkingEffortChange: (effort: string) => void;
  usePromptCaching: boolean;
  onUsePromptCachingChange: (value: boolean) => void;
  maxIterations: number;
  onMaxIterationsChange: (value: number) => void;
  pinModelVersion: boolean;
  onPinModelVersionChange: (value: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function YangSettingsPanel({
  isDark, disabled,
  settings, advanced, saving,
  onFeatureChange, onAdvancedChange,
  thinkingEffort, onThinkingEffortChange,
  usePromptCaching, onUsePromptCachingChange,
  maxIterations, onMaxIterationsChange,
  pinModelVersion, onPinModelVersionChange,
}: YangSettingsPanelProps) {
  const [open, setOpen]     = useState(false);
  const [tab, setTab]       = useState<'features' | 'model'>('features');
  const [showAdv, setShowAdv] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const T = {
    text:       isDark ? '#EFEFEF' : '#0A0A0B',
    muted:      isDark ? '#9A9AA3' : '#6B7280',
    dim:        isDark ? '#606068' : '#808088',
    border:     isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    softBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    panelBg:    isDark ? '#141418' : '#FFFFFF',
    shadow:     isDark
      ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
    hover:      isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    toggleBg:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    cardBg:     isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
  };

  const activeCount = FEATURES.filter((f) => settings[f.key]).length;
  const hasCustomModel =
    thinkingEffort !== 'medium' || !usePromptCaching || maxIterations !== 5 || pinModelVersion;
  const hasCustom = activeCount > 0 || hasCustomModel;

  // Trigger dot: red if yolo, amber if plan, accent otherwise
  const indicatorColor = settings.yolo_mode
    ? '#EF4444'
    : settings.plan_mode
      ? '#F59E0B'
      : hasCustom ? '#60A5FA' : null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        title="Agent Features & Settings"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34,
          borderRadius: 999,
          border: `1px solid ${open ? 'rgba(96,165,250,0.35)' : T.border}`,
          background: open ? (isDark ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.06)') : 'transparent',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: hasCustom ? '#60A5FA' : T.muted,
          opacity: disabled ? 0.4 : 1,
          transition: 'all .15s',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!disabled && !open) {
            e.currentTarget.style.background = T.hover;
            e.currentTarget.style.borderColor = 'rgba(96,165,250,0.35)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !open) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = T.border;
          }
        }}
      >
        <Sparkles size={14} strokeWidth={2} />
        {indicatorColor && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 8, height: 8, borderRadius: '50%',
            background: indicatorColor,
            boxShadow: `0 0 0 2px ${T.panelBg}`,
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
              bottom: window.innerHeight - rect.top + 10,
              right: Math.max(8, window.innerWidth - rect.right),
              width: 420,
              maxHeight: 'min(70vh, 640px)',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 16,
              border: `1px solid ${T.border}`,
              background: T.panelBg,
              boxShadow: T.shadow,
              overflow: 'hidden',
              zIndex: 10000,
              animation: 'chat-fadeIn 0.15s ease-out',
            }}
          >
            {/* Header with tabs */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderBottom: `1px solid ${T.border}`,
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['features', 'model'] as const).map((id) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: tab === id ? (isDark ? 'rgba(96,165,250,0.12)' : 'rgba(96,165,250,0.08)') : 'transparent',
                      color: tab === id ? '#60A5FA' : T.muted,
                      fontSize: 11,
                      fontFamily: "'DM Mono', monospace",
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                  >
                    {id === 'features' ? `Features${activeCount > 0 ? ` · ${activeCount}` : ''}` : 'Model'}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {saving && (
                  <span style={{ fontSize: 10, color: T.dim, fontFamily: "'DM Mono', monospace" }}>
                    Saving…
                  </span>
                )}
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    width: 22, height: 22, borderRadius: 6, border: 'none',
                    background: 'transparent', cursor: 'pointer', color: T.muted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.toggleBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ overflow: 'auto', padding: 12 }}>
              {tab === 'features' ? (
                <FeaturesTab
                  T={T}
                  settings={settings}
                  onFeatureChange={onFeatureChange}
                  advanced={advanced}
                  onAdvancedChange={onAdvancedChange}
                  showAdv={showAdv}
                  setShowAdv={setShowAdv}
                />
              ) : (
                <ModelTab
                  T={T}
                  thinkingEffort={thinkingEffort}
                  onThinkingEffortChange={onThinkingEffortChange}
                  usePromptCaching={usePromptCaching}
                  onUsePromptCachingChange={onUsePromptCachingChange}
                  maxIterations={maxIterations}
                  onMaxIterationsChange={onMaxIterationsChange}
                  pinModelVersion={pinModelVersion}
                  onPinModelVersionChange={onPinModelVersionChange}
                />
              )}
            </div>
          </div>,
          document.body,
        );
      })()}
    </div>
  );
}

// ─── Features tab ────────────────────────────────────────────────────────────

function FeaturesTab({
  T, settings, onFeatureChange, advanced, onAdvancedChange, showAdv, setShowAdv,
}: {
  T: any;
  settings: YangConfig;
  onFeatureChange: (k: YangKey, v: boolean) => void;
  advanced: YangAdvanced;
  onAdvancedChange: (patch: Partial<YangAdvanced>) => void;
  showAdv: boolean;
  setShowAdv: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Warning banners when destructive modes are on */}
      {settings.yolo_mode && (
        <InlineBanner T={T} color="#EF4444" Icon={AlertTriangle}>
          Yolo Mode is active — tools will execute without confirmation.
        </InlineBanner>
      )}
      {settings.plan_mode && !settings.yolo_mode && (
        <InlineBanner T={T} color="#3B82F6" Icon={Shield}>
          Plan Mode is active — only read-only tools will run.
        </InlineBanner>
      )}

      {/* 2-col feature grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}>
        {FEATURES.map((f) => (
          <FeatureCard
            key={f.key}
            T={T}
            def={f}
            active={!!settings[f.key]}
            onChange={(v) => onFeatureChange(f.key, v)}
          />
        ))}
      </div>

      {/* Advanced tunables */}
      <button
        onClick={() => setShowAdv(!showAdv)}
        style={{
          marginTop: 4,
          padding: '8px 10px',
          borderRadius: 8,
          border: `1px solid ${T.softBorder}`,
          background: 'transparent',
          color: T.muted,
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all .15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = T.hover; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Settings2 size={12} />
          Advanced Tunables
        </span>
        {showAdv ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {showAdv && (
        <div style={{
          padding: 12,
          borderRadius: 10,
          border: `1px solid ${T.softBorder}`,
          background: T.cardBg,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <TunableNumber
            T={T}
            label="Subagent concurrency"
            hint="Max parallel subagents"
            value={advanced.subagent_max ?? 3}
            min={1} max={8} step={1}
            onChange={(v) => onAdvancedChange({ subagent_max: v })}
          />
          <TunableNumber
            T={T}
            label="Auto-compact token threshold"
            hint="Trigger compaction when history exceeds this"
            value={advanced.compact_token_threshold ?? 120000}
            min={20000} max={500000} step={10000}
            onChange={(v) => onAdvancedChange({ compact_token_threshold: v })}
          />
          <TunableNumber
            T={T}
            label="Focus LLM polish frequency"
            hint="Rewrite focus chain every N turns"
            value={advanced.focus_llm_every_n ?? 5}
            min={2} max={20} step={1}
            onChange={(v) => onAdvancedChange({ focus_llm_every_n: v })}
          />
        </div>
      )}
    </div>
  );
}

function FeatureCard({
  T, def, active, onChange,
}: {
  T: any;
  def: FeatureDef;
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  const { Icon, label, desc, accent, warning } = def;
  return (
    <button
      onClick={() => onChange(!active)}
      style={{
        textAlign: 'left',
        padding: 10,
        borderRadius: 10,
        border: `1px solid ${active ? accent + '55' : T.softBorder}`,
        background: active ? accent + '10' : T.cardBg,
        color: T.text,
        cursor: 'pointer',
        transition: 'all .15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = T.hover;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = T.cardBg;
      }}
    >
      {active && (
        <span style={{
          position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
          background: accent,
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Icon size={14} strokeWidth={2} style={{ color: active ? accent : T.muted }} />
        <Toggle active={active} accent={warning ? '#EF4444' : accent} T={T} />
      </div>
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        color: active ? T.text : T.text,
        lineHeight: 1.2,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 10,
        color: T.dim,
        lineHeight: 1.3,
      }}>
        {desc}
      </div>
    </button>
  );
}

function Toggle({ active, accent, T }: { active: boolean; accent: string; T: any }) {
  return (
    <span
      style={{
        width: 28, height: 16, borderRadius: 999,
        background: active ? accent : T.toggleBg,
        position: 'relative',
        transition: 'background .2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: active ? 14 : 2,
          width: 12, height: 12, borderRadius: '50%',
          background: '#fff',
          transition: 'left .2s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
      />
    </span>
  );
}

function InlineBanner({
  T, color, Icon, children,
}: {
  T: any; color: string;
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '8px 10px',
      borderRadius: 8,
      border: `1px solid ${color}55`,
      background: color + '10',
      color: color,
      fontSize: 11,
      lineHeight: 1.35,
    }}>
      <Icon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  );
}

function TunableNumber({
  T, label, hint, value, min, max, step, onChange,
}: {
  T: any; label: string; hint: string;
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 4,
      }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.08em',
          color: T.muted,
          textTransform: 'uppercase' as const,
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: T.text,
          fontWeight: 600,
        }}>
          {value.toLocaleString()}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#60A5FA' }}
      />
      <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{hint}</div>
    </div>
  );
}

// ─── Model tab (absorbed from legacy ChatAgentSettings) ──────────────────────

function ModelTab({
  T, thinkingEffort, onThinkingEffortChange,
  usePromptCaching, onUsePromptCachingChange,
  maxIterations, onMaxIterationsChange,
  pinModelVersion, onPinModelVersionChange,
}: {
  T: any;
  thinkingEffort: string;
  onThinkingEffortChange: (e: string) => void;
  usePromptCaching: boolean;
  onUsePromptCachingChange: (v: boolean) => void;
  maxIterations: number;
  onMaxIterationsChange: (v: number) => void;
  pinModelVersion: boolean;
  onPinModelVersionChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SegmentGroup
        T={T}
        label="Thinking Effort"
        hint="Controls reasoning depth. Higher = better quality, slower."
        options={['low', 'medium', 'high']}
        value={thinkingEffort}
        onChange={onThinkingEffortChange}
      />

      <RowToggle
        T={T}
        label="Prompt Caching"
        hint="Cache system prompt for faster responses"
        value={usePromptCaching}
        onChange={onUsePromptCachingChange}
      />

      <SegmentGroup
        T={T}
        label="Max Tool Iterations"
        hint="More iterations = more tool calls per response"
        options={[3, 5, 7, 10]}
        value={maxIterations}
        onChange={onMaxIterationsChange}
      />

      <RowToggle
        T={T}
        label="Pin Model Version"
        hint="Use stable snapshot for production"
        value={pinModelVersion}
        onChange={onPinModelVersionChange}
      />
    </div>
  );
}

function SegmentGroup<T extends string | number>({
  T: Toks, label, hint, options, value, onChange,
}: {
  T: any; label: string; hint: string;
  options: T[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.08em',
        color: Toks.muted,
        marginBottom: 6,
        textTransform: 'uppercase' as const,
      }}>{label}</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={String(opt)}
              onClick={() => onChange(opt)}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 8,
                border: `1px solid ${active ? 'rgba(96,165,250,0.35)' : Toks.border}`,
                background: active ? 'rgba(96,165,250,0.12)' : 'transparent',
                color: active ? '#60A5FA' : Toks.muted,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: typeof opt === 'string' ? ('capitalize' as const) : 'none',
                transition: 'all .15s',
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {String(opt)}
            </button>
          );
        })}
      </div>
      <p style={{ margin: '4px 0 0', fontSize: 10, color: Toks.dim, lineHeight: 1.4 }}>{hint}</p>
    </div>
  );
}

function RowToggle({
  T, label, hint, value, onChange,
}: {
  T: any; label: string; hint: string;
  value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        width: '100%',
        padding: 0,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left' as const,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{label}</div>
        <p style={{ margin: '2px 0 0', fontSize: 10, color: T.dim, lineHeight: 1.4 }}>{hint}</p>
      </div>
      <Toggle active={value} accent="#60A5FA" T={T} />
    </button>
  );
}


export default YangSettingsPanel;
