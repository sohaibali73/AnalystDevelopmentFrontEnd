'use client';

/**
 * SkillExecutionAnimation — Claude-style animated timeline card for skill invocations.
 *
 * Shows when invoke_skill is in the input-streaming or input-available state.
 * Renders a timeline step with spinning indicator, scrolling status messages,
 * elapsed time, and a subtle shimmer — matching the aesthetic in the screenshot.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  FileText, BarChart2, Monitor, Code2, Search,
  Sparkles, TrendingUp, BookOpen, Brain, Cpu,
  FlaskConical, Globe, Layers, Calculator,
  CheckCircle2,
} from 'lucide-react';

// ─── Skill metadata ───────────────────────────────────────────────────────────

interface SkillMeta {
  icon: React.ReactNode;
  label: string;
  color: string;
  accentBg: string;
  steps: string[];
}

function getSkillMeta(slug: string): SkillMeta {
  const s = (slug || '').toLowerCase().replace(/-/g, '_');

  if (/pptx|powerpoint|presentation|slide/.test(s))
    return {
      icon: <Monitor size={13} />,
      label: 'Creating Presentation',
      color: '#f59e0b',
      accentBg: 'rgba(245,158,11,0.08)',
      steps: [
        'Initialising presentation skill…',
        'Laying out slide structure…',
        'Applying Potomac branding…',
        'Generating slide content…',
        'Finalising presentation…',
      ],
    };

  if (/docx|word|document|internal_comms|doc_co/.test(s))
    return {
      icon: <FileText size={13} />,
      label: 'Creating Document',
      color: '#3b82f6',
      accentBg: 'rgba(59,130,246,0.08)',
      steps: [
        'Initialising document skill…',
        'Structuring document layout…',
        'Applying brand guidelines…',
        'Generating content sections…',
        'Finalising document…',
      ],
    };

  if (/xlsx|excel|spreadsheet|csv/.test(s))
    return {
      icon: <BarChart2 size={13} />,
      label: 'Creating Spreadsheet',
      color: '#10b981',
      accentBg: 'rgba(16,185,129,0.08)',
      steps: [
        'Initialising spreadsheet skill…',
        'Building data model…',
        'Applying cell formatting…',
        'Adding formulas and charts…',
        'Finalising spreadsheet…',
      ],
    };

  if (/afl|amibroker/.test(s))
    return {
      icon: <Code2 size={13} />,
      label: 'Generating AFL Code',
      color: '#fbbf24',
      accentBg: 'rgba(251,191,36,0.08)',
      steps: [
        'Initialising AFL developer…',
        'Analysing strategy requirements…',
        'Writing indicator logic…',
        'Applying buy/sell rules…',
        'Validating AFL syntax…',
      ],
    };

  if (/dcf|valuation|model/.test(s))
    return {
      icon: <Calculator size={13} />,
      label: 'Building DCF Model',
      color: '#34d399',
      accentBg: 'rgba(52,211,153,0.08)',
      steps: [
        'Initialising DCF modeller…',
        'Fetching financial data…',
        'Projecting free cash flows…',
        'Calculating WACC…',
        'Computing intrinsic value…',
      ],
    };

  if (/backtest|backtesting/.test(s))
    return {
      icon: <TrendingUp size={13} />,
      label: 'Running Backtest',
      color: '#a78bfa',
      accentBg: 'rgba(167,139,250,0.08)',
      steps: [
        'Initialising backtest engine…',
        'Loading historical data…',
        'Applying strategy rules…',
        'Simulating trades…',
        'Computing performance metrics…',
      ],
    };

  if (/bubble|market_detection/.test(s))
    return {
      icon: <TrendingUp size={13} />,
      label: 'Detecting Market Bubble',
      color: '#f87171',
      accentBg: 'rgba(248,113,113,0.08)',
      steps: [
        'Initialising bubble detector…',
        'Analysing valuation metrics…',
        'Checking breadth indicators…',
        'Comparing to historical peaks…',
        'Generating bubble report…',
      ],
    };

  if (/research|coverage|equity|initiating/.test(s))
    return {
      icon: <Search size={13} />,
      label: 'Running Research',
      color: '#60a5fa',
      accentBg: 'rgba(96,165,250,0.08)',
      steps: [
        'Initialising research skill…',
        'Gathering market data…',
        'Analysing financials…',
        'Synthesising findings…',
        'Formatting report…',
      ],
    };

  if (/datapack|data_pack|csv_summ/.test(s))
    return {
      icon: <Layers size={13} />,
      label: 'Building Data Pack',
      color: '#c084fc',
      accentBg: 'rgba(192,132,252,0.08)',
      steps: [
        'Initialising data pack builder…',
        'Parsing source data…',
        'Structuring tables…',
        'Generating summary…',
        'Packaging files…',
      ],
    };

  if (/artifact|react|jsx|tsx|web_art/.test(s))
    return {
      icon: <Code2 size={13} />,
      label: 'Building Artifact',
      color: '#38bdf8',
      accentBg: 'rgba(56,189,248,0.08)',
      steps: [
        'Initialising artifact builder…',
        'Designing component structure…',
        'Writing React component…',
        'Applying styling…',
        'Preparing live preview…',
      ],
    };

  if (/people|lead|linkedin|person/.test(s))
    return {
      icon: <Globe size={13} />,
      label: 'Researching People',
      color: '#0ea5e9',
      accentBg: 'rgba(14,165,233,0.08)',
      steps: [
        'Initialising people search…',
        'Scanning professional networks…',
        'Compiling profile data…',
        'Enriching with public records…',
        'Generating profile report…',
      ],
    };

  if (/brain|knowledge|kb/.test(s))
    return {
      icon: <Brain size={13} />,
      label: 'Querying Knowledge Base',
      color: '#e879f9',
      accentBg: 'rgba(232,121,249,0.08)',
      steps: [
        'Initialising knowledge search…',
        'Embedding query…',
        'Performing vector search…',
        'Ranking results…',
        'Synthesising answer…',
      ],
    };

  // Default: generic skill
  const readableLabel = (slug || 'skill')
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    icon: <Sparkles size={13} />,
    label: `Running ${readableLabel}`,
    color: '#a78bfa',
    accentBg: 'rgba(167,139,250,0.08)',
    steps: [
      `Initialising ${readableLabel.toLowerCase()}…`,
      'Processing your request…',
      'Generating output…',
      'Finalising results…',
    ],
  };
}

// ─── Spinner SVG ──────────────────────────────────────────────────────────────

function Spinner({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <style>{`
        @keyframes skill-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .skill-spinner { transform-origin: 8px 8px; animation: skill-spin 0.9s linear infinite; }
      `}</style>
      {/* Track */}
      <circle cx="8" cy="8" r="6" stroke={color} strokeOpacity="0.2" strokeWidth="1.8" />
      {/* Arc */}
      <path
        className="skill-spinner"
        d="M8 2 A6 6 0 0 1 14 8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Pulse dot row ─────────────────────────────────────────────────────────────

function PulseDots({ color }: { color: string }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', marginLeft: 4 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: 3,
            borderRadius: '50%',
            backgroundColor: color,
            display: 'inline-block',
            animation: `skill-dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes skill-dot-pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1);   }
        }
      `}</style>
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SkillExecutionAnimationProps {
  /** Raw skill slug from the tool input */
  skillSlug?: string;
  /** Message from the skill_status data stream */
  statusMessage?: string;
  /** Whether the skill has completed */
  completed?: boolean;
}

export function SkillExecutionAnimation({
  skillSlug = '',
  statusMessage,
  completed = false,
}: SkillExecutionAnimationProps) {
  const meta = getSkillMeta(skillSlug);

  // Cycle through step messages while running
  const [stepIdx, setStepIdx] = useState(0);
  const stepRef = useRef(stepIdx);
  stepRef.current = stepIdx;

  const advance = useCallback(() => {
    setStepIdx((prev) => (prev < meta.steps.length - 1 ? prev + 1 : prev));
  }, [meta.steps.length]);

  useEffect(() => {
    if (completed) return;
    // Advance steps with some variance to feel organic
    const delays = [2200, 3400, 4600, 6000, 8000];
    const timers = delays.map((d, i) =>
      setTimeout(() => {
        if (i < meta.steps.length - 1) advance();
      }, d)
    );
    return () => timers.forEach(clearTimeout);
  }, [advance, completed, meta.steps.length]);

  // Elapsed time counter
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (completed) return;
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [completed]);

  const currentStep = statusMessage || meta.steps[stepIdx];
  const { color, accentBg } = meta;

  return (
    <>
      <style>{`
        @keyframes skill-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes skill-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes skill-glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 transparent; }
          50%       { box-shadow: 0 0 12px 1px ${color}22; }
        }
        .skill-exec-root {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 14px 10px 12px;
          border-radius: 10px;
          border: 1px solid ${color}30;
          background: ${accentBg};
          max-width: 440px;
          margin-top: 8px;
          animation: skill-fadein 0.25s ease both, skill-glow-pulse 2.5s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }
        .skill-exec-root.completed {
          animation: skill-fadein 0.25s ease both;
          border-color: ${color}20;
          opacity: 0.75;
        }
        .skill-exec-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            ${color}10 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: skill-shimmer 2.4s ease-in-out infinite;
          pointer-events: none;
        }
        .skill-exec-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          flex-shrink: 0;
          padding-top: 1px;
        }
        .skill-exec-icon-wrap {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid ${color}40;
          background: ${color}12;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
        }
        .skill-exec-connector {
          width: 1.5px;
          flex: 1;
          min-height: 8px;
          background: linear-gradient(to bottom, ${color}40, transparent);
          margin-top: 4px;
          border-radius: 1px;
        }
        .skill-exec-body {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
          min-width: 0;
        }
        .skill-exec-label {
          font-size: 12.5px;
          font-weight: 600;
          color: ${color};
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .skill-exec-step {
          font-size: 11.5px;
          color: rgba(255,255,255,0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: flex;
          align-items: center;
          gap: 4px;
          min-height: 17px;
        }
        .skill-exec-elapsed {
          font-size: 10px;
          color: rgba(255,255,255,0.25);
          font-variant-numeric: tabular-nums;
          margin-left: auto;
          flex-shrink: 0;
        }
      `}</style>

      <div className={`skill-exec-root${completed ? ' completed' : ''}`}>
        {!completed && <div className="skill-exec-shimmer" />}

        {/* Left: icon + connector line */}
        <div className="skill-exec-left">
          <div className="skill-exec-icon-wrap">
            {completed ? (
              <CheckCircle2 size={13} color={color} />
            ) : (
              <span style={{ color }}>{meta.icon}</span>
            )}
            {/* Spinning ring overlay when running */}
            {!completed && (
              <span style={{ position: 'absolute', inset: -4, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spinner color={color} size={36} />
              </span>
            )}
          </div>
          <div className="skill-exec-connector" />
        </div>

        {/* Right: label + step */}
        <div className="skill-exec-body">
          <div className="skill-exec-label">
            <span>{meta.label}</span>
            {!completed && (
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: '4px',
                backgroundColor: `${color}20`,
                color,
                letterSpacing: '0.5px',
                textTransform: 'uppercase' as const,
              }}>
                Running
              </span>
            )}
            {completed && (
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: '4px',
                backgroundColor: 'rgba(34,197,94,0.12)',
                color: '#22c55e',
                letterSpacing: '0.5px',
                textTransform: 'uppercase' as const,
              }}>
                Done
              </span>
            )}
          </div>

          <div className="skill-exec-step">
            {!completed && (
              <span style={{ color, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <Cpu size={10} />
              </span>
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentStep}
            </span>
            {!completed && <PulseDots color={color} />}
            {elapsed > 0 && !completed && (
              <span className="skill-exec-elapsed">{elapsed}s</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default SkillExecutionAnimation;
