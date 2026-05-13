'use client';

/**
 * PerformanceCard — Potomac-branded GenUI card for the `calculate_performance`
 * tool result and the `data-card_performance` envelope.
 *
 * Accepts EITHER:
 *   • Raw tool result with nested groups: meta / returns / drawdown /
 *     risk_ratios / statistics / ulcer / trade_stats
 *   • Flat GenUI envelope payload (annual_return_pct, max_drawdown_pct, ...).
 *
 * Numbers are rendered verbatim from the backend — no recompute, display
 * rounding only.
 */

import React from 'react';
import { motion } from 'framer-motion';

const YELLOW = '#FEC00F';
const DARK = '#212121';
const GREEN = '#22C55E';
const RED = '#EB2F5C';

// ── Types ────────────────────────────────────────────────────────────────────

interface NestedPerformance {
  status?: string;
  success?: boolean;
  error?: string;
  ticker?: string;
  frequency?: string;
  meta?: {
    start_date?: string;
    end_date?: string;
    bars?: number;
    start_price?: number;
    end_price?: number;
    initial_capital?: number;
    years?: number;
  };
  returns?: {
    annual_return_pct?: number | null;
    total_return_pct?: number | null;
    net_profit_usd?: number | null;
    net_profit_pct?: number | null;
    final_equity_usd?: number | null;
    exposure_pct?: number | null;
    risk_adj_return_pct?: number | null;
  };
  drawdown?: {
    max_system_drawdown_pct?: number | null;
    max_system_drawdown_usd?: number | null;
    peak_date?: string | null;
    trough_date?: string | null;
    recovery_date?: string | null;
    dd_duration_days?: number | null;
    recovery_bars?: number | null;
  };
  risk_ratios?: {
    net_risk_adj_return?: number | null;
    recovery_factor?: number | null;
    car_maxdd?: number | null;
    rar_maxdd?: number | null;
  };
  statistics?: {
    ann_volatility_pct?: number | null;
    sharpe_ratio?: number | null;
    risk_reward_ratio?: number | null;
    std_error_pct?: number | null;
    k_ratio?: number | null;
  };
  ulcer?: {
    ulcer_index?: number | null;
    ulcer_performance_index?: number | null;
  };
  trade_stats?: {
    avg_win_pct?: number | null;
    avg_loss_pct?: number | null;
    win_loss_ratio?: number | null;
    win_rate_pct?: number | null;
    profit_factor?: number | null;
  };
}

interface FlatPerformance {
  status?: string;
  success?: boolean;
  error?: string;
  ticker?: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  years?: number;
  bars?: number;
  start_price?: number;
  end_price?: number;
  initial_capital?: number;
  annual_return_pct?: number | null;
  total_return_pct?: number | null;
  net_profit_usd?: number | null;
  final_equity_usd?: number | null;
  max_drawdown_pct?: number | null;
  max_drawdown_usd?: number | null;
  peak_date?: string | null;
  trough_date?: string | null;
  recovery_date?: string | null;
  dd_duration_days?: number | null;
  sharpe_ratio?: number | null;
  ann_volatility_pct?: number | null;
  recovery_factor?: number | null;
  car_maxdd?: number | null;
  rar_maxdd?: number | null;
  ulcer_index?: number | null;
  ulcer_performance_index?: number | null;
  k_ratio?: number | null;
  win_rate_pct?: number | null;
  profit_factor?: number | null;
  win_loss_ratio?: number | null;
  avg_win_pct?: number | null;
  avg_loss_pct?: number | null;
  summary?: string;
}

type PerformanceInput = NestedPerformance & FlatPerformance;

// ── Formatters ───────────────────────────────────────────────────────────────

const isNum = (v: any): v is number => typeof v === 'number' && Number.isFinite(v);

const fmtPct = (v: any, dp = 2): string =>
  !isNum(v) ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(dp)}%`;

const fmtUSD = (v: any): string =>
  !isNum(v)
    ? '—'
    : `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const fmtNum = (v: any, dp = 2): string =>
  !isNum(v) ? '—' : v.toFixed(dp);

const colorFor = (v: any): string =>
  !isNum(v) ? DARK : v > 0 ? GREEN : v < 0 ? RED : DARK;

// ── Normaliser: collapse nested OR flat input into one shape ────────────────

function normalise(input: PerformanceInput) {
  const meta = {
    start_date: input.meta?.start_date ?? input.start_date,
    end_date: input.meta?.end_date ?? input.end_date,
    bars: input.meta?.bars ?? input.bars,
    start_price: input.meta?.start_price ?? input.start_price,
    end_price: input.meta?.end_price ?? input.end_price,
    initial_capital: input.meta?.initial_capital ?? input.initial_capital,
    years: input.meta?.years ?? input.years,
  };
  const returns = {
    annual_return_pct:
      input.returns?.annual_return_pct ?? input.annual_return_pct ?? null,
    total_return_pct:
      input.returns?.total_return_pct ?? input.total_return_pct ?? null,
    net_profit_usd:
      input.returns?.net_profit_usd ?? input.net_profit_usd ?? null,
    final_equity_usd:
      input.returns?.final_equity_usd ?? input.final_equity_usd ?? null,
  };
  const drawdown = {
    max_system_drawdown_pct:
      input.drawdown?.max_system_drawdown_pct ?? input.max_drawdown_pct ?? null,
    max_system_drawdown_usd:
      input.drawdown?.max_system_drawdown_usd ?? input.max_drawdown_usd ?? null,
    peak_date: input.drawdown?.peak_date ?? input.peak_date ?? null,
    trough_date: input.drawdown?.trough_date ?? input.trough_date ?? null,
    recovery_date:
      input.drawdown?.recovery_date ?? input.recovery_date ?? null,
    dd_duration_days:
      input.drawdown?.dd_duration_days ?? input.dd_duration_days ?? null,
  };
  const risk_ratios = {
    recovery_factor:
      input.risk_ratios?.recovery_factor ?? input.recovery_factor ?? null,
    car_maxdd: input.risk_ratios?.car_maxdd ?? input.car_maxdd ?? null,
    rar_maxdd: input.risk_ratios?.rar_maxdd ?? input.rar_maxdd ?? null,
  };
  const statistics = {
    ann_volatility_pct:
      input.statistics?.ann_volatility_pct ?? input.ann_volatility_pct ?? null,
    sharpe_ratio: input.statistics?.sharpe_ratio ?? input.sharpe_ratio ?? null,
    k_ratio: input.statistics?.k_ratio ?? input.k_ratio ?? null,
  };
  const ulcer = {
    ulcer_index: input.ulcer?.ulcer_index ?? input.ulcer_index ?? null,
    ulcer_performance_index:
      input.ulcer?.ulcer_performance_index ??
      input.ulcer_performance_index ??
      null,
  };
  const trade_stats = {
    win_rate_pct: input.trade_stats?.win_rate_pct ?? input.win_rate_pct ?? null,
    profit_factor:
      input.trade_stats?.profit_factor ?? input.profit_factor ?? null,
    win_loss_ratio:
      input.trade_stats?.win_loss_ratio ?? input.win_loss_ratio ?? null,
    avg_win_pct: input.trade_stats?.avg_win_pct ?? input.avg_win_pct ?? null,
    avg_loss_pct: input.trade_stats?.avg_loss_pct ?? input.avg_loss_pct ?? null,
  };
  return { meta, returns, drawdown, risk_ratios, statistics, ulcer, trade_stats };
}

// ── Subcomponents ────────────────────────────────────────────────────────────

const Hero = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <div className="text-center">
    <div
      className="text-3xl font-bold"
      style={{ color, fontFamily: 'Rajdhani, "Inter", system-ui, sans-serif' }}
    >
      {value}
    </div>
    <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">
      {label}
    </div>
  </div>
);

const Section = ({
  title,
  leftBorder,
  children,
}: {
  title: string;
  leftBorder?: boolean;
  children: React.ReactNode;
}) => (
  <div className={`p-5 ${leftBorder ? 'border-l border-gray-100' : ''}`}>
    <div
      className="text-[10px] uppercase tracking-widest font-bold mb-2"
      style={{
        color: DARK,
        borderBottom: `2px solid ${YELLOW}`,
        paddingBottom: 4,
        display: 'inline-block',
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex justify-between text-sm py-1">
    <span className="text-gray-500">{k}</span>
    <span className="font-mono">{v}</span>
  </div>
);

const Tile = ({
  k,
  v,
  color,
}: {
  k: string;
  v: string;
  color?: string;
}) => (
  <div className="text-center">
    <div className="text-base font-bold" style={{ color: color || DARK }}>
      {v}
    </div>
    <div className="text-[10px] uppercase text-gray-500">{k}</div>
  </div>
);

// ── Error card ───────────────────────────────────────────────────────────────

function PerformanceErrorCard({
  error,
  ticker,
}: {
  error?: string;
  ticker?: string;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 my-2 max-w-xl">
      <div className="text-sm font-bold text-red-700">
        Performance data unavailable{ticker ? ` for ${ticker}` : ''}
      </div>
      <div className="text-xs text-red-600 mt-1">
        {error || 'The Performance Engine returned no data.'}
      </div>
    </div>
  );
}

// ── Main card ────────────────────────────────────────────────────────────────

export interface PerformanceCardProps {
  /** Preferred: pass the tool result / envelope payload under `data`. */
  data?: PerformanceInput;
  /** Fallback: tool-registry spreads top-level keys directly as props. */
  [key: string]: any;
}

export function PerformanceCard(props: PerformanceCardProps) {
  // The card is invoked from two paths:
  //   1. Inline envelope renderer   → <PerformanceCard data={envelope.data} />
  //   2. tool-registry tool-result  → <PerformanceCard {...toolOutput} />
  // Accept either by picking `data` if present, otherwise treating props
  // themselves as the payload.
  const raw: PerformanceInput =
    ((props.data && typeof props.data === 'object'
      ? props.data
      : (props as unknown as PerformanceInput)) || {}) as PerformanceInput;

  // Error short-circuit.
  if (raw.status === 'error' || raw.success === false || raw.error) {
    return <PerformanceErrorCard error={raw.error} ticker={raw.ticker} />;
  }

  const ticker = raw.ticker || '—';
  const frequency = raw.frequency || 'daily';
  const { meta, returns, drawdown, risk_ratios, statistics, ulcer, trade_stats } =
    normalise(raw);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden my-2"
      style={{ maxWidth: 720 }}
    >
      {/* Header bar */}
      <div
        className="px-5 py-3 flex justify-between items-baseline"
        style={{ background: DARK, color: 'white' }}
      >
        <div>
          <div className="text-lg font-bold tracking-wide">{ticker}</div>
          <div className="text-xs opacity-70">
            Performance Engine · live yfinance · {frequency} bars
            {meta.start_date ? ` · since ${meta.start_date}` : ''}
          </div>
        </div>
        <div className="text-xs opacity-80 text-right">
          {isNum(meta.years) ? `${meta.years.toFixed(1)} yrs` : ''}
          {isNum(meta.bars) ? ` · ${meta.bars.toLocaleString()} bars` : ''}
        </div>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-3 gap-3 px-5 py-5 border-b border-gray-100">
        <Hero
          label="CAGR"
          value={fmtPct(returns.annual_return_pct)}
          color={colorFor(returns.annual_return_pct)}
        />
        <Hero
          label="Total Return"
          value={fmtPct(returns.total_return_pct)}
          color={colorFor(returns.total_return_pct)}
        />
        <Hero
          label="Net Profit"
          value={fmtUSD(returns.net_profit_usd)}
          color={colorFor(returns.net_profit_usd)}
        />
      </div>

      {/* Risk + Ratios grid */}
      <div className="grid grid-cols-2 gap-0 border-b border-gray-100">
        <Section title="Risk">
          <Row
            k="Max Drawdown"
            v={
              <span style={{ color: RED }}>
                {fmtPct(drawdown.max_system_drawdown_pct)} ·{' '}
                {fmtUSD(drawdown.max_system_drawdown_usd)}
              </span>
            }
          />
          <Row k="Peak" v={drawdown.peak_date || '—'} />
          <Row k="Trough" v={drawdown.trough_date || '—'} />
          <Row
            k="Recovery"
            v={drawdown.recovery_date || 'Not yet recovered'}
          />
          <Row
            k="Duration"
            v={
              isNum(drawdown.dd_duration_days)
                ? `${drawdown.dd_duration_days} days`
                : '—'
            }
          />
        </Section>

        <Section title="Ratios" leftBorder>
          <Row k="Sharpe" v={fmtNum(statistics.sharpe_ratio)} />
          <Row
            k="Volatility (ann)"
            v={fmtPct(statistics.ann_volatility_pct)}
          />
          <Row k="Recovery Factor" v={fmtNum(risk_ratios.recovery_factor)} />
          <Row k="CAR / MaxDD" v={fmtNum(risk_ratios.car_maxdd)} />
          <Row k="Ulcer Index" v={fmtNum(ulcer.ulcer_index)} />
          <Row k="UPI" v={fmtNum(ulcer.ulcer_performance_index)} />
          <Row k="K-Ratio" v={fmtNum(statistics.k_ratio, 4)} />
        </Section>
      </div>

      {/* Trade stats */}
      <div className="px-5 py-3 grid grid-cols-5 gap-2 text-sm border-b border-gray-100">
        <Tile k="Win Rate" v={fmtPct(trade_stats.win_rate_pct, 1)} />
        <Tile k="Profit Factor" v={fmtNum(trade_stats.profit_factor)} />
        <Tile k="W/L Ratio" v={fmtNum(trade_stats.win_loss_ratio)} />
        <Tile
          k="Avg Win"
          v={fmtPct(trade_stats.avg_win_pct)}
          color={GREEN}
        />
        <Tile
          k="Avg Loss"
          v={fmtPct(trade_stats.avg_loss_pct)}
          color={RED}
        />
      </div>

      {/* Footer summary */}
      <div
        className="px-5 py-3 text-sm text-gray-700"
        style={{ borderTop: `2px solid ${YELLOW}` }}
      >
        {raw.summary ||
          `${ticker} returned ${fmtPct(returns.annual_return_pct)} CAGR${
            isNum(meta.years) ? ` over ${meta.years.toFixed(1)} years` : ''
          } with a ${fmtPct(drawdown.max_system_drawdown_pct)} max drawdown.`}
      </div>
    </motion.div>
  );
}

export default PerformanceCard;
