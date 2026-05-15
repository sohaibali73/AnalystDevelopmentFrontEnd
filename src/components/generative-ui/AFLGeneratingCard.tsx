'use client';

/**
 * AFLGeneratingCard
 * -----------------
 * Premium loading state for the unified `generate_afl_code` pipeline.
 * Visual language matches AFLStrategyCard so the transition from "in-flight"
 * to "complete" feels like the same surface settling, not a swap.
 *
 *   - Hero header with diagonal-stripe overlay + radial yellow gradient
 *   - Animated 40px Wand2 tile with a soft pulsing halo
 *   - User's prompt rendered verbatim (one line, ellipsis)
 *   - Rotating phase label ("Drafting strategy" -> "Generating AFL" ->
 *     "Running validator" -> "Auto-fixing issues" -> "Finalizing"),
 *     auto-advances on elapsed time so it feels like real progress
 *   - Indeterminate progress bar with travelling shimmer
 *   - Skeleton preview of the code body (greyed rows + line numbers),
 *     hinting at the shape of the result that will replace it
 *   - Elapsed seconds + "taking longer than expected" amber state past 30s
 *
 * No emoji. lucide-react icons only. Brand-yellow #FEC00F accent.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Wand2,
  Sparkles,
  Code2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Target,
  Clock,
} from 'lucide-react';

const YELLOW = '#FEC00F';
const SLATE = 'rgba(255,255,255,0.55)';
const SUBTLE = 'rgba(255,255,255,0.06)';
const PANEL = '#0d1117';
const SHELL = '#0a0a0a';

interface AFLGeneratingCardProps {
  /** Tool input — typically { description, strategy_type, trade_timing, ... } */
  input?: Record<string, unknown>;
  /** Show amber warning above this many milliseconds. */
  timeoutMs?: number;
}

interface Phase {
  key: string;
  label: string;
  detail: string;
  icon: React.ReactNode;
  startAt: number; // seconds
}

const PHASES: Phase[] = [
  { key: 'draft', label: 'Drafting strategy', detail: 'Mapping requirements to AFL primitives', icon: <Sparkles size={12} />, startAt: 0 },
  { key: 'generate', label: 'Generating AFL', detail: 'Composing buy / sell / plot blocks', icon: <Code2 size={12} />, startAt: 5 },
  { key: 'validate', label: 'Running validator', detail: '19-phase syntax & semantics pass', icon: <Shield size={12} />, startAt: 14 },
  { key: 'autofix', label: 'Auto-fixing issues', detail: 'Patching warnings & cascades', icon: <AlertTriangle size={12} />, startAt: 22 },
  { key: 'finalize', label: 'Finalizing', detail: 'Scoring quality & packaging output', icon: <CheckCircle size={12} />, startAt: 30 },
];

function pickPhase(elapsedSec: number): Phase {
  let current = PHASES[0];
  for (const p of PHASES) {
    if (elapsedSec >= p.startAt) current = p;
  }
  return current;
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r.toString().padStart(2, '0')}s`;
}

const KEYFRAMES = `
  @keyframes afl-gen-fade {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes afl-gen-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.85; transform: scale(1.04); }
  }
  @keyframes afl-gen-halo {
    0%, 100% { box-shadow: 0 0 0 0 rgba(254, 192, 15, 0.40), 0 4px 14px rgba(254, 192, 15, 0.12); }
    50%      { box-shadow: 0 0 0 8px rgba(254, 192, 15, 0.00), 0 4px 14px rgba(254, 192, 15, 0.22); }
  }
  @keyframes afl-gen-shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(220%); }
  }
  @keyframes afl-gen-skeleton {
    0%, 100% { opacity: 0.35; }
    50%      { opacity: 0.65; }
  }
  @keyframes afl-gen-phase-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes afl-gen-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes afl-gen-dot {
    0%, 80%, 100% { opacity: 0.25; }
    40%           { opacity: 1; }
  }
  .afl-gen-root { animation: afl-gen-fade 0.35s cubic-bezier(.16,1,.3,1) both; }
  .afl-gen-tile { animation: afl-gen-halo 2.2s ease-in-out infinite; }
  .afl-gen-spin { animation: afl-gen-spin 1.1s linear infinite; }
  .afl-gen-phase { animation: afl-gen-phase-in 0.35s cubic-bezier(.16,1,.3,1) both; }
  .afl-gen-shimmer {
    position: absolute;
    top: 0; bottom: 0;
    width: 38%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(254, 192, 15, 0.55) 45%,
      rgba(254, 192, 15, 0.85) 50%,
      rgba(254, 192, 15, 0.55) 55%,
      transparent 100%
    );
    animation: afl-gen-shimmer 1.6s cubic-bezier(.55,.06,.42,.94) infinite;
    filter: blur(0.5px);
  }
  .afl-gen-skel-line {
    animation: afl-gen-skeleton 1.6s ease-in-out infinite;
  }
  .afl-gen-dot {
    display: inline-block;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: currentColor;
    margin: 0 2px;
    animation: afl-gen-dot 1.2s ease-in-out infinite;
  }
  .afl-gen-dot:nth-child(2) { animation-delay: 0.15s; }
  .afl-gen-dot:nth-child(3) { animation-delay: 0.30s; }
`;

export function AFLGeneratingCard({ input, timeoutMs = 60000 }: AFLGeneratingCardProps) {
  const [elapsed, setElapsed] = useState(0);
  const [overdue, setOverdue] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const ms = Date.now() - start;
      setElapsed(ms);
      if (ms >= timeoutMs && !overdue) setOverdue(true);
    }, 250);
    return () => window.clearInterval(id);
  }, [timeoutMs, overdue]);

  const description =
    (input?.description as string | undefined) ||
    (input?.prompt as string | undefined) ||
    (input?.query as string | undefined) ||
    'Generating AmiBroker AFL strategy';

  const strategyType = (input?.strategy_type as string | undefined) || null;
  const tradeTiming = (input?.trade_timing as string | undefined) || null;

  const elapsedSec = elapsed / 1000;
  const phase = useMemo(() => pickPhase(elapsedSec), [elapsedSec]);
  const phaseIndex = PHASES.findIndex((p) => p.key === phase.key);

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        className="afl-gen-root"
        style={{
          position: 'relative',
          borderRadius: '14px',
          overflow: 'hidden',
          border: `1px solid ${YELLOW}33`,
          maxWidth: '820px',
          marginTop: '8px',
          backgroundColor: SHELL,
          boxShadow: '0 4px 28px rgba(0,0,0,0.4), 0 0 0 1px rgba(254,192,15,0.04)',
        }}
      >
        {/* ─── Hero ────────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            padding: '18px 18px 16px 18px',
            background: `
              radial-gradient(ellipse 80% 140% at 0% 0%, rgba(254, 192, 15, 0.18) 0%, transparent 55%),
              radial-gradient(ellipse 60% 100% at 100% 0%, rgba(254, 192, 15, 0.08) 0%, transparent 60%),
              linear-gradient(180deg, rgba(254, 192, 15, 0.04) 0%, transparent 100%)
            `,
            borderBottom: `1px solid ${SUBTLE}`,
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(135deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 14px)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              className="afl-gen-tile"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${YELLOW}33 0%, ${YELLOW}14 100%)`,
                border: `1px solid ${YELLOW}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Wand2 size={18} color={YELLOW} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: YELLOW,
                    opacity: 0.85,
                  }}
                >
                  AmiBroker AFL
                </span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>·</span>
                <span style={{ fontSize: '10.5px', color: SLATE, fontWeight: 500 }}>
                  Generating strategy
                </span>
                <span
                  className="afl-gen-spin"
                  style={{ display: 'inline-flex', alignItems: 'center', color: YELLOW, marginLeft: '4px' }}
                >
                  <Loader2 size={11} />
                </span>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '15.5px',
                  color: 'rgba(255,255,255,0.97)',
                  lineHeight: 1.35,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: '6px',
                }}
                title={description}
              >
                {description}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                {strategyType && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: `${YELLOW}1A`,
                      color: YELLOW,
                      border: `1px solid ${YELLOW}33`,
                      fontWeight: 600,
                    }}
                  >
                    <Target size={11} />
                    {String(strategyType).replace(/_/g, ' ')}
                  </span>
                )}
                {tradeTiming && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(129, 140, 248, 0.10)',
                      color: '#818cf8',
                      border: '1px solid rgba(129, 140, 248, 0.2)',
                      fontWeight: 600,
                    }}
                  >
                    <Clock size={11} />
                    {String(tradeTiming).replace(/_/g, ' ')}
                  </span>
                )}
                <span
                  style={{
                    fontSize: '11px',
                    color: overdue ? '#fbbf24' : SLATE,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {overdue ? 'Taking longer than expected · ' : ''}
                  {formatElapsed(elapsed)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Phase / progress strip ──────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '11px 18px',
            backgroundColor: `${YELLOW}0A`,
            borderBottom: `1px solid ${SUBTLE}`,
            borderLeft: `3px solid ${YELLOW}`,
          }}
        >
          <div
            key={phase.key}
            className="afl-gen-phase"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}
          >
            <span style={{ color: YELLOW, display: 'inline-flex', alignItems: 'center' }}>{phase.icon}</span>
            <span style={{ fontSize: '12.5px', color: YELLOW, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {phase.label}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>·</span>
            <span
              style={{
                fontSize: '11.5px',
                color: SLATE,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {phase.detail}
              <span style={{ color: YELLOW, marginLeft: '4px' }}>
                <span className="afl-gen-dot" />
                <span className="afl-gen-dot" />
                <span className="afl-gen-dot" />
              </span>
            </span>
          </div>
        </div>

        {/* ─── Phase steps tracker ─────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            padding: '10px 16px',
            borderBottom: `1px solid ${SUBTLE}`,
            backgroundColor: 'rgba(255,255,255,0.015)',
          }}
        >
          {PHASES.map((p, i) => {
            const isPast = i < phaseIndex;
            const isCurrent = i === phaseIndex;
            return (
              <div
                key={p.key}
                style={{
                  flex: 1,
                  height: '3px',
                  borderRadius: '2px',
                  background: isPast
                    ? YELLOW
                    : isCurrent
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(255,255,255,0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                title={p.label}
              >
                {isCurrent && <div className="afl-gen-shimmer" />}
              </div>
            );
          })}
        </div>

        {/* ─── Skeleton code preview ───────────────────────────────────── */}
        <div style={{ padding: '14px 16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code2 size={12} color={SLATE} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: SLATE,
                }}
              >
                AFL source
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>· composing</span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: PANEL,
              borderRadius: '10px',
              border: `1px solid ${SUBTLE}`,
              padding: '12px 0',
              minHeight: '180px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '52px 1fr',
                  padding: '4px 0',
                }}
              >
                <span
                  style={{
                    textAlign: 'right',
                    paddingRight: '12px',
                    color: 'rgba(255,255,255,0.18)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11.5px',
                    borderRight: '1px solid rgba(255,255,255,0.04)',
                    userSelect: 'none',
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center' }}>
                  <div
                    className="afl-gen-skel-line"
                    style={{
                      height: '8px',
                      width: `${[78, 62, 88, 45, 70, 92, 55, 80][i]}%`,
                      borderRadius: '4px',
                      background: `linear-gradient(90deg, rgba(254,192,15,${0.10 + (i % 3) * 0.04}), rgba(255,255,255,0.04))`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Stat-row skeleton ───────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '0 16px 16px 16px',
          }}
        >
          {['Quality', 'Lines', 'Validation', 'Time'].map((label, i) => (
            <div
              key={label}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.025)',
                border: `1px solid ${SUBTLE}`,
              }}
            >
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: SLATE,
                  marginBottom: '6px',
                }}
              >
                {label}
              </div>
              <div
                className="afl-gen-skel-line"
                style={{
                  height: '12px',
                  width: `${[55, 40, 70, 50][i]}%`,
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, rgba(254,192,15,0.18), rgba(255,255,255,0.04))',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default AFLGeneratingCard;
