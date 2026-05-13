'use client';

/**
 * PerformanceLoadingCard — Animated loading state for the `calculate_performance`
 * tool while the backend is fetching prices from yfinance and computing metrics.
 *
 * Mirrors the layout of PerformanceCard so the swap-in feels seamless:
 * dark header bar, three hero metric placeholders, a Risk/Ratios skeleton, and
 * a yellow-bordered footer. Adds a Potomac-yellow scanning bar and rotating
 * status messages so the user knows the engine is alive.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, ShieldAlert } from 'lucide-react';

const YELLOW = '#FEC00F';
const DARK = '#212121';

const STAGES = [
  { icon: TrendingUp,  label: 'Fetching price history from yfinance…' },
  { icon: Activity,    label: 'Computing CAGR, Sharpe & volatility…' },
  { icon: ShieldAlert, label: 'Measuring drawdown & recovery factor…' },
  { icon: Activity,    label: 'Calculating Ulcer & K-Ratio…' },
];

export interface PerformanceLoadingCardProps {
  ticker?: string;
  frequency?: string;
  input?: { ticker?: string; frequency?: string; [k: string]: any };
}

export function PerformanceLoadingCard({
  ticker,
  frequency,
  input,
}: PerformanceLoadingCardProps) {
  const sym = (ticker || input?.ticker || '—').toUpperCase();
  const freq = frequency || input?.frequency || 'daily';

  const [stage, setStage] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 1400);
    return () => clearInterval(id);
  }, []);
  const Stage = STAGES[stage];
  const StageIcon = Stage.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden my-2 relative"
      style={{ maxWidth: 720 }}
    >
      {/* Yellow scanning bar across the top — signals work-in-progress */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${YELLOW}, transparent)`,
          backgroundSize: '200% 100%',
          animation: 'perf-scan 1.6s linear infinite',
          zIndex: 2,
        }}
      />
      <style>{`
        @keyframes perf-scan {
          0%   { background-position: -100% 0; }
          100% { background-position: 100% 0; }
        }
        @keyframes perf-pulse {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.75; }
        }
        @keyframes perf-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .perf-skeleton {
          background: linear-gradient(
            90deg,
            rgba(0,0,0,0.04) 0%,
            rgba(0,0,0,0.08) 50%,
            rgba(0,0,0,0.04) 100%
          );
          background-size: 200% 100%;
          animation: perf-shimmer 1.4s ease-in-out infinite;
          border-radius: 6px;
        }
      `}</style>

      {/* Header bar */}
      <div
        className="px-5 py-3 flex justify-between items-baseline"
        style={{ background: DARK, color: 'white' }}
      >
        <div>
          <div className="text-lg font-bold tracking-wide">{sym}</div>
          <div className="text-xs opacity-70">
            Performance Engine · live yfinance · {freq} bars
          </div>
        </div>
        <div
          className="text-xs"
          style={{ color: YELLOW, fontFamily: 'JetBrains Mono, monospace' }}
        >
          <span style={{ animation: 'perf-pulse 1s ease-in-out infinite' }}>●</span>{' '}
          computing…
        </div>
      </div>

      {/* Stage message strip */}
      <div
        className="px-5 py-2.5 flex items-center gap-2"
        style={{
          background: 'rgba(254, 192, 15, 0.07)',
          borderBottom: '1px solid rgba(254, 192, 15, 0.2)',
        }}
      >
        <motion.div
          key={stage}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-2"
          style={{ color: DARK }}
        >
          <StageIcon size={14} style={{ color: YELLOW }} />
          <span className="text-xs font-medium">{Stage.label}</span>
        </motion.div>
      </div>

      {/* Hero metric skeletons */}
      <div className="grid grid-cols-3 gap-3 px-5 py-5 border-b border-gray-100">
        {[0, 1, 2].map((i) => (
          <div key={i} className="text-center">
            <div
              className="perf-skeleton mx-auto"
              style={{ height: 32, width: '70%' }}
            />
            <div
              className="perf-skeleton mx-auto mt-2"
              style={{ height: 8, width: '40%' }}
            />
          </div>
        ))}
      </div>

      {/* Risk + Ratios skeleton grid */}
      <div className="grid grid-cols-2 gap-0 border-b border-gray-100">
        <div className="p-5">
          <div
            className="text-[10px] uppercase tracking-widest font-bold mb-3 inline-block"
            style={{
              color: DARK,
              borderBottom: `2px solid ${YELLOW}`,
              paddingBottom: 4,
            }}
          >
            Risk
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center py-1.5">
              <div className="perf-skeleton" style={{ height: 10, width: '38%' }} />
              <div className="perf-skeleton" style={{ height: 10, width: '32%' }} />
            </div>
          ))}
        </div>
        <div className="p-5 border-l border-gray-100">
          <div
            className="text-[10px] uppercase tracking-widest font-bold mb-3 inline-block"
            style={{
              color: DARK,
              borderBottom: `2px solid ${YELLOW}`,
              paddingBottom: 4,
            }}
          >
            Ratios
          </div>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex justify-between items-center py-1.5">
              <div className="perf-skeleton" style={{ height: 10, width: '42%' }} />
              <div className="perf-skeleton" style={{ height: 10, width: '24%' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Trade stats skeleton */}
      <div className="px-5 py-3 grid grid-cols-5 gap-2 border-b border-gray-100">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="text-center">
            <div
              className="perf-skeleton mx-auto"
              style={{ height: 14, width: '60%' }}
            />
            <div
              className="perf-skeleton mx-auto mt-1.5"
              style={{ height: 7, width: '70%' }}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-3 text-xs text-gray-500"
        style={{ borderTop: `2px solid ${YELLOW}` }}
      >
        Pulling {freq} bars for {sym} and running the full performance &amp; risk
        suite…
      </div>
    </motion.div>
  );
}

export default PerformanceLoadingCard;
