'use client';

/**
 * PerformanceCard — Potomac-branded GenUI card for the `calculate_performance`
 * tool result and the `data-card_performance` envelope.
 *
 * Accepts EITHER:
 *   • Raw tool result with nested groups: meta / returns / drawdown /
 *     risk_ratios / statistics / ulcer / trade_stats
 *   • Flat GenUI envelope payload (annual_return_pct, max_drawdown_pct, ...).
 */

import React from 'react';
import { motion } from 'framer-motion';

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  yellow:      '#FEC00F',
  dark:        '#141414',
  darkMid:     '#1E1E1E',
  surface:     '#252525',
  surfaceAlt:  '#2C2C2C',
  border:      '#333333',
  muted:       '#888888',
  label:       '#AAAAAA',
  body:        '#E0E0E0',
  white:       '#FFFFFF',
  green:       '#3DD68C',
  red:         '#FF5A6A',
  greenDim:    'rgba(61,214,140,0.12)',
  redDim:      'rgba(255,90,106,0.12)',
};

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
    : `$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const fmtNum = (v: any, dp = 2): string =>
  !isNum(v) ? '—' : v.toFixed(dp);

const colorFor = (v: any): string =>
  !isNum(v) ? C.body : v > 0 ? C.green : v < 0 ? C.red : C.body;

// ── Normaliser ───────────────────────────────────────────────────────────────

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
    annual_return_pct: input.returns?.annual_return_pct ?? input.annual_return_pct ?? null,
    total_return_pct: input.returns?.total_return_pct ?? input.total_return_pct ?? null,
    net_profit_usd: input.returns?.net_profit_usd ?? input.net_profit_usd ?? null,
    final_equity_usd: input.returns?.final_equity_usd ?? input.final_equity_usd ?? null,
  };
  const drawdown = {
    max_system_drawdown_pct: input.drawdown?.max_system_drawdown_pct ?? input.max_drawdown_pct ?? null,
    max_system_drawdown_usd: input.drawdown?.max_system_drawdown_usd ?? input.max_drawdown_usd ?? null,
    peak_date: input.drawdown?.peak_date ?? input.peak_date ?? null,
    trough_date: input.drawdown?.trough_date ?? input.trough_date ?? null,
    recovery_date: input.drawdown?.recovery_date ?? input.recovery_date ?? null,
    dd_duration_days: input.drawdown?.dd_duration_days ?? input.dd_duration_days ?? null,
  };
  const risk_ratios = {
    recovery_factor: input.risk_ratios?.recovery_factor ?? input.recovery_factor ?? null,
    car_maxdd: input.risk_ratios?.car_maxdd ?? input.car_maxdd ?? null,
    rar_maxdd: input.risk_ratios?.rar_maxdd ?? input.rar_maxdd ?? null,
  };
  const statistics = {
    ann_volatility_pct: input.statistics?.ann_volatility_pct ?? input.ann_volatility_pct ?? null,
    sharpe_ratio: input.statistics?.sharpe_ratio ?? input.sharpe_ratio ?? null,
    k_ratio: input.statistics?.k_ratio ?? input.k_ratio ?? null,
  };
  const ulcer = {
    ulcer_index: input.ulcer?.ulcer_index ?? input.ulcer_index ?? null,
    ulcer_performance_index: input.ulcer?.ulcer_performance_index ?? input.ulcer_performance_index ?? null,
  };
  const trade_stats = {
    win_rate_pct: input.trade_stats?.win_rate_pct ?? input.win_rate_pct ?? null,
    profit_factor: input.trade_stats?.profit_factor ?? input.profit_factor ?? null,
    win_loss_ratio: input.trade_stats?.win_loss_ratio ?? input.win_loss_ratio ?? null,
    avg_win_pct: input.trade_stats?.avg_win_pct ?? input.avg_win_pct ?? null,
    avg_loss_pct: input.trade_stats?.avg_loss_pct ?? input.avg_loss_pct ?? null,
  };
  return { meta, returns, drawdown, risk_ratios, statistics, ulcer, trade_stats };
}

// ── Shared inline styles (avoids Tailwind color-interp issues) ───────────────

const cardStyle: React.CSSProperties = {
  maxWidth: 720,
  background: C.dark,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  overflow: 'hidden',
  fontFamily: '"DM Sans", "Inter", system-ui, sans-serif',
  color: C.body,
  boxShadow: '0 8px 40px rgba(0,0,0,0.55)',
};

const headerStyle: React.CSSProperties = {
  background: C.darkMid,
  borderBottom: `1px solid ${C.border}`,
  padding: '14px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const tickerStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: '0.04em',
  color: C.white,
  fontFamily: '"DM Mono", "Courier New", monospace',
};

const subheadStyle: React.CSSProperties = {
  fontSize: 11,
  color: C.muted,
  marginTop: 2,
  letterSpacing: '0.02em',
};

const metaBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  color: C.muted,
  textAlign: 'right',
  letterSpacing: '0.02em',
};

// Hero section
const heroGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 0,
  borderBottom: `1px solid ${C.border}`,
};

const heroItemStyle = (isLast?: boolean): React.CSSProperties => ({
  textAlign: 'center',
  padding: '20px 12px',
  borderRight: isLast ? 'none' : `1px solid ${C.border}`,
});

const heroValueStyle = (color: string): React.CSSProperties => ({
  fontSize: 26,
  fontWeight: 700,
  color,
  fontFamily: '"DM Mono", "Courier New", monospace',
  letterSpacing: '-0.01em',
  lineHeight: 1.1,
});

const heroLabelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: C.muted,
  marginTop: 6,
  fontWeight: 500,
};

// Panels
const panelGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  borderBottom: `1px solid ${C.border}`,
};

const panelStyle = (withBorder?: boolean): React.CSSProperties => ({
  padding: '16px 20px',
  borderRight: withBorder ? `1px solid ${C.border}` : 'none',
});

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  fontWeight: 700,
  color: C.yellow,
  marginBottom: 12,
  paddingBottom: 6,
  borderBottom: `1px solid ${C.border}`,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '5px 0',
  borderBottom: `1px solid rgba(255,255,255,0.04)`,
};

const rowLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: C.label,
  fontWeight: 400,
};

const rowValueStyle = (color?: string): React.CSSProperties => ({
  fontSize: 12,
  color: color || C.body,
  fontFamily: '"DM Mono", "Courier New", monospace',
  fontWeight: 500,
  letterSpacing: '0.01em',
});

// Trade stat tiles
const tileGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  borderBottom: `1px solid ${C.border}`,
};

const tileStyle = (withBorder?: boolean): React.CSSProperties => ({
  textAlign: 'center',
  padding: '14px 8px',
  borderRight: withBorder ? `1px solid ${C.border}` : 'none',
});

const tileValueStyle = (color?: string): React.CSSProperties => ({
  fontSize: 15,
  fontWeight: 700,
  color: color || C.body,
  fontFamily: '"DM Mono", "Courier New", monospace',
  lineHeight: 1.2,
});

const tileLabelStyle: React.CSSProperties = {
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: C.muted,
  marginTop: 5,
  fontWeight: 500,
};

// Footer
const footerStyle: React.CSSProperties = {
  padding: '12px 20px',
  fontSize: 12,
  color: C.label,
  background: C.darkMid,
  borderTop: `2px solid ${C.yellow}`,
  lineHeight: 1.6,
};

// ── Subcomponents ────────────────────────────────────────────────────────────

function Hero({ label, value, color, isLast }: { label: string; value: string; color: string; isLast?: boolean }) {
  return (
    <div style={heroItemStyle(isLast)}>
      <div style={heroValueStyle(color)}>{value}</div>
      <div style={heroLabelStyle}>{label}</div>
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <div style={rowStyle}>
      <span style={rowLabelStyle}>{label}</span>
      <span style={rowValueStyle(valueColor)}>{value}</span>
    </div>
  );
}

function Tile({ label, value, color, isLast }: { label: string; value: string; color?: string; isLast?: boolean }) {
  return (
    <div style={tileStyle(!isLast)}>
      <div style={tileValueStyle(color)}>{value}</div>
      <div style={tileLabelStyle}>{label}</div>
    </div>
  );
}

// ── Error card ───────────────────────────────────────────────────────────────

function PerformanceErrorCard({ error, ticker }: { error?: string; ticker?: string }) {
  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${C.red}44`,
      background: C.redDim,
      padding: '12px 16px',
      maxWidth: 480,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.red }}>
        Performance data unavailable{ticker ? ` for ${ticker}` : ''}
      </div>
      <div style={{ fontSize: 12, color: C.label, marginTop: 4 }}>
        {error || 'The Performance Engine returned no data.'}
      </div>
    </div>
  );
}

// ── Main card ────────────────────────────────────────────────────────────────

export interface PerformanceCardProps {
  data?: PerformanceInput;
  [key: string]: any;
}

export function PerformanceCard(props: PerformanceCardProps) {
  const raw: PerformanceInput =
    ((props.data && typeof props.data === 'object'
      ? props.data
      : (props as unknown as PerformanceInput)) || {}) as PerformanceInput;

  if (raw.status === 'error' || raw.success === false || raw.error) {
    return <PerformanceErrorCard error={raw.error} ticker={raw.ticker} />;
  }

  const ticker = raw.ticker || '—';
  const frequency = raw.frequency || 'daily';
  const { meta, returns, drawdown, risk_ratios, statistics, ulcer, trade_stats } = normalise(raw);

  const ddPctColor = isNum(drawdown.max_system_drawdown_pct)
    ? C.red
    : C.body;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={cardStyle}
    >
      {/* ── Header ── */}
      <div style={headerStyle}>
        <div>
          <div style={tickerStyle}>{ticker}</div>
          <div style={subheadStyle}>
            Performance Engine &middot; live yfinance &middot; {frequency} bars
            {meta.start_date ? ` · since ${meta.start_date}` : ''}
          </div>
        </div>
        <div style={metaBadgeStyle}>
          {isNum(meta.years) && <div>{meta.years.toFixed(1)} yrs</div>}
          {isNum(meta.bars) && <div>{meta.bars.toLocaleString()} bars</div>}
        </div>
      </div>

      {/* ── Hero metrics ── */}
      <div style={heroGridStyle}>
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
          isLast
        />
      </div>

      {/* ── Risk + Ratios ── */}
      <div style={panelGridStyle}>
        <div style={panelStyle(true)}>
          <div style={sectionTitleStyle}>Risk</div>
          <Row
            label="Max Drawdown"
            value={
              <span>
                <span style={{ color: ddPctColor }}>{fmtPct(drawdown.max_system_drawdown_pct)}</span>
                <span style={{ color: C.muted }}> / </span>
                <span style={{ color: ddPctColor }}>{fmtUSD(drawdown.max_system_drawdown_usd)}</span>
              </span>
            }
          />
          <Row label="Peak" value={drawdown.peak_date || '—'} />
          <Row label="Trough" value={drawdown.trough_date || '—'} />
          <Row
            label="Recovery"
            value={drawdown.recovery_date || 'Not yet recovered'}
            valueColor={drawdown.recovery_date ? C.body : C.muted}
          />
          <Row
            label="DD Duration"
            value={isNum(drawdown.dd_duration_days) ? `${drawdown.dd_duration_days} days` : '—'}
          />
        </div>

        <div style={panelStyle()}>
          <div style={sectionTitleStyle}>Ratios</div>
          <Row
            label="Sharpe"
            value={fmtNum(statistics.sharpe_ratio)}
            valueColor={colorFor(statistics.sharpe_ratio)}
          />
          <Row
            label="Volatility (ann)"
            value={fmtPct(statistics.ann_volatility_pct)}
            valueColor={isNum(statistics.ann_volatility_pct) ? C.red : C.body}
          />
          <Row
            label="Recovery Factor"
            value={fmtNum(risk_ratios.recovery_factor)}
            valueColor={colorFor(risk_ratios.recovery_factor)}
          />
          <Row
            label="CAR / MaxDD"
            value={fmtNum(risk_ratios.car_maxdd)}
            valueColor={colorFor(risk_ratios.car_maxdd)}
          />
          <Row label="Ulcer Index" value={fmtNum(ulcer.ulcer_index)} />
          <Row
            label="UPI"
            value={fmtNum(ulcer.ulcer_performance_index)}
            valueColor={colorFor(ulcer.ulcer_performance_index)}
          />
          <Row
            label="K-Ratio"
            value={fmtNum(statistics.k_ratio, 4)}
            valueColor={colorFor(statistics.k_ratio)}
          />
        </div>
      </div>

      {/* ── Trade stats ── */}
      <div style={tileGridStyle}>
        <Tile label="Win Rate" value={fmtPct(trade_stats.win_rate_pct, 1)} color={colorFor(trade_stats.win_rate_pct)} />
        <Tile label="Profit Factor" value={fmtNum(trade_stats.profit_factor)} color={colorFor(trade_stats.profit_factor)} />
        <Tile label="W/L Ratio" value={fmtNum(trade_stats.win_loss_ratio)} color={colorFor(trade_stats.win_loss_ratio)} />
        <Tile label="Avg Win" value={fmtPct(trade_stats.avg_win_pct)} color={C.green} />
        <Tile label="Avg Loss" value={fmtPct(trade_stats.avg_loss_pct)} color={C.red} isLast />
      </div>

      {/* ── Footer ── */}
      <div style={footerStyle}>
        {raw.summary ||
          `${ticker} returned ${fmtPct(returns.annual_return_pct)} CAGR${
            isNum(meta.years) ? ` over ${meta.years.toFixed(1)} years` : ''
          } with a ${fmtPct(drawdown.max_system_drawdown_pct)} max drawdown.`}
      </div>
    </motion.div>
  );
}

export default PerformanceCard;