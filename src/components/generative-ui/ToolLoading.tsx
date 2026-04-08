'use client';

import React, { useEffect, useState } from 'react';
import { Terminal, Database, DollarSign, Globe, Code2, Shield, Bug, BookOpen, Wand2, Zap, FileSearch, FileText } from 'lucide-react';

const toolMeta: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  execute_python:       { icon: <Terminal size={13} />,   label: 'Executing Python',        color: '#4ade80' },
  search_knowledge_base:{ icon: <Database size={13} />,   label: 'Searching knowledge base', color: '#FEC00F' },
  get_stock_data:       { icon: <DollarSign size={13} />, label: 'Fetching stock data',      color: '#fbbf24' },
  get_stock_chart:      { icon: <DollarSign size={13} />, label: 'Loading stock chart',      color: '#fbbf24' },
  technical_analysis:   { icon: <DollarSign size={13} />, label: 'Running technical analysis', color: '#a78bfa' },
  get_weather:          { icon: <Globe size={13} />,      label: 'Fetching weather',         color: '#38bdf8' },
  get_news:             { icon: <Globe size={13} />,      label: 'Fetching headlines',       color: '#fb923c' },
  create_chart:         { icon: <DollarSign size={13} />, label: 'Creating chart',           color: '#c084fc' },
  code_sandbox:         { icon: <Code2 size={13} />,      label: 'Running sandbox',          color: '#4ade80' },
  web_search:           { icon: <Globe size={13} />,      label: 'Searching the web',        color: '#818cf8' },
  validate_afl:         { icon: <Shield size={13} />,     label: 'Validating AFL',           color: '#4ade80' },
  generate_afl_code:    { icon: <Wand2 size={13} />,      label: 'Generating AFL code',      color: '#fbbf24' },
  debug_afl_code:       { icon: <Bug size={13} />,        label: 'Debugging AFL',            color: '#a78bfa' },
  explain_afl_code:     { icon: <BookOpen size={13} />,   label: 'Explaining AFL',           color: '#60a5fa' },
  sanity_check_afl:     { icon: <Shield size={13} />,     label: 'AFL sanity check',         color: '#4ade80' },
  get_live_scores:      { icon: <Zap size={13} />,        label: 'Fetching live scores',     color: '#fb923c' },
  get_search_trends:    { icon: <Globe size={13} />,      label: 'Loading trends',           color: '#818cf8' },
  create_linkedin_post: { icon: <Globe size={13} />,      label: 'Composing post',           color: '#38bdf8' },
  preview_website:      { icon: <Globe size={13} />,      label: 'Generating preview',       color: '#60a5fa' },
  order_food:           { icon: <Zap size={13} />,        label: 'Finding options',          color: '#fbbf24' },
  track_flight:         { icon: <Globe size={13} />,      label: 'Tracking flight',          color: '#60a5fa' },
  search_flights:       { icon: <Globe size={13} />,      label: 'Searching flights',        color: '#fbbf24' },
  // Document Interpreter and KB skills
  doc_interpreter:      { icon: <FileSearch size={13} />, label: 'Reading document',         color: '#10b981' },
  interpret_document:   { icon: <FileSearch size={13} />, label: 'Interpreting document',    color: '#10b981' },
  extract_document:     { icon: <FileText size={13} />,   label: 'Extracting content',       color: '#10b981' },
  read_document:        { icon: <FileText size={13} />,   label: 'Reading document',         color: '#10b981' },
  invoke_skill:         { icon: <Wand2 size={13} />,      label: 'Running skill',            color: '#a78bfa' },
};

interface ToolLoadingProps {
  toolName: string;
  input?: Record<string, unknown>;
  /** Optional timeout in milliseconds - shows warning after this time */
  timeoutMs?: number;
}

const styles = `
  @keyframes scanline {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  .tool-loading-root {
    display: inline-flex;
    flex-direction: column;
    gap: 0;
    max-width: 340px;
    margin-top: 8px;
    animation: fadeSlideIn 0.25s ease both;
    font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
  }
  .tool-loading-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 13px;
    border-radius: 8px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(8px);
  }
  .tool-loading-scan {
    position: absolute;
    inset: 0;
    width: 25%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
    animation: scanline 2.2s ease-in-out infinite;
    pointer-events: none;
  }
  .tool-loading-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .tool-loading-label {
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0.01em;
    white-space: nowrap;
  }
  .tool-loading-dot {
    display: inline-block;
    animation: blink 1.1s ease-in-out infinite;
    margin-left: 1px;
  }
  .tool-loading-sub {
    font-size: 10px;
    letter-spacing: 0.02em;
    color: rgba(255,255,255,0.25);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
    margin-left: auto;
    flex-shrink: 1;
  }
  .tool-loading-bar-wrap {
    height: 1.5px;
    background: rgba(255,255,255,0.05);
    border-radius: 0 0 8px 8px;
    overflow: hidden;
  }
  .tool-loading-bar-fill {
    height: 100%;
    border-radius: 8px;
    animation: scanline 2.2s ease-in-out infinite;
    width: 40%;
  }
  .tool-loading-elapsed {
    font-size: 9.5px;
    color: rgba(255,255,255,0.35);
    margin-left: 6px;
    font-variant-numeric: tabular-nums;
  }
  .tool-loading-timeout {
    font-size: 9.5px;
    color: #fbbf24;
    margin-left: 6px;
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
`;

export function ToolLoading({ toolName, input, timeoutMs = 30000 }: ToolLoadingProps) {
  const [elapsed, setElapsed] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  // Track elapsed time
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const ms = Date.now() - startTime;
      setElapsed(ms);
      if (ms >= timeoutMs && !timedOut) {
        setTimedOut(true);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [timeoutMs, timedOut]);

  const formatElapsed = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  const meta = toolMeta[toolName] ?? {
    icon: <Zap size={13} />,
    label: toolName.replace(/_/g, ' '),
    color: '#94a3b8',
  };

  const subText = input
    ? (input.symbol as string | undefined)
      ?? ((input.query as string | undefined) && `"${(input.query as string).slice(0, 28)}${(input.query as string).length > 28 ? '…' : ''}"`)
      ?? ((input.description as string | undefined) && `"${(input.description as string).slice(0, 28)}${(input.description as string).length > 28 ? '…' : ''}"`)
    : undefined;

  return (
    <>
      <style>{styles}</style>
      <div className="tool-loading-root">
        <div className="tool-loading-card">
          <div className="tool-loading-scan" />

          {/* Icon */}
          <span className="tool-loading-icon" style={{ color: meta.color }}>
            {meta.icon}
          </span>

          {/* Label */}
          <span className="tool-loading-label" style={{ color: meta.color }}>
            {meta.label}
            <span className="tool-loading-dot" style={{ color: meta.color }}>_</span>
          </span>

          {/* Sub text */}
          {subText && (
            <span className="tool-loading-sub">{subText}</span>
          )}

          {/* Elapsed time */}
          {elapsed >= 1000 && (
            <span className={timedOut ? "tool-loading-timeout" : "tool-loading-elapsed"}>
              {timedOut ? 'Taking longer than expected...' : formatElapsed(elapsed)}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="tool-loading-bar-wrap">
          <div
            className="tool-loading-bar-fill"
            style={{ background: `linear-gradient(90deg, transparent, ${meta.color}99, ${meta.color}, transparent)` }}
          />
        </div>
      </div>
    </>
  );
}

export default ToolLoading;
