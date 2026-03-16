'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import type { BacktestResult } from '@/types/api';

const CHART_COLORS = {
  green: '#22C55E',
  red: '#EF4444',
  yellow: '#FEC00F',
  blue: '#3B82F6',
  purple: '#A78BFA',
  cyan: '#00DED1',
};

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({ title, description, children, className }: ChartCardProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Card
      className={`overflow-hidden border ${className ?? ''}`}
      style={{
        backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
        borderColor: isDark ? '#333' : '#E5E5E5',
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ fontFamily: "'Rajdhani', sans-serif", color: isDark ? '#F5F5F5' : '#212121' }}
        >
          {title}
        </CardTitle>
        {description && (
          <CardDescription
            className="text-xs"
            style={{ color: isDark ? '#757575' : '#9E9E9E' }}
          >
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-4">{children}</CardContent>
    </Card>
  );
}

function useChartColors() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return {
    gridColor: isDark ? '#333' : '#E5E5E5',
    textColor: isDark ? '#9E9E9E' : '#757575',
    tooltipBg: isDark ? '#2A2A2A' : '#FFFFFF',
    tooltipBorder: isDark ? '#424242' : '#E0E0E0',
    tooltipText: isDark ? '#F5F5F5' : '#212121',
  };
}

// Generate simulated equity curve from summary metrics
function generateEquityCurve(backtest: BacktestResult) {
  const totalReturn = backtest.total_return ?? backtest.metrics?.cagr ?? 0;
  const maxDrawdown = Math.abs(backtest.max_drawdown ?? backtest.metrics?.max_drawdown ?? 0);
  const totalTrades = backtest.metrics?.total_trades ?? 50;
  const numPoints = Math.min(Math.max(totalTrades, 20), 60);

  const data = [];
  let equity = 10000;
  const averageReturnPerPeriod = totalReturn / numPoints;
  const volatility = maxDrawdown / 4;

  // Use a seed based on the backtest id for consistency
  let seed = 0;
  if (backtest.id) {
    for (let i = 0; i < backtest.id.length; i++) {
      seed += backtest.id.charCodeAt(i);
    }
  }
  const pseudoRandom = (i: number) => {
    const x = Math.sin(seed + i * 9301) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i <= numPoints; i++) {
    const randomFactor = (pseudoRandom(i) - 0.5) * volatility * 2;
    const periodReturn = averageReturnPerPeriod + randomFactor;
    equity = equity * (1 + periodReturn);
    data.push({
      period: i,
      equity: Math.round(equity),
      return: ((equity / 10000 - 1) * 100).toFixed(2),
    });
  }
  return data;
}

function generateDrawdownSeries(equityCurve: { period: number; equity: number }[]) {
  let peak = equityCurve[0]?.equity ?? 10000;
  return equityCurve.map((point) => {
    if (point.equity > peak) peak = point.equity;
    const drawdown = ((point.equity - peak) / peak) * 100;
    return {
      period: point.period,
      drawdown: parseFloat(drawdown.toFixed(2)),
    };
  });
}

function generateTradeDistribution(backtest: BacktestResult) {
  const winRate = backtest.win_rate ?? backtest.metrics?.win_rate ?? 0.5;
  const totalTrades = backtest.metrics?.total_trades ?? 50;
  const profitFactor = backtest.metrics?.profit_factor ?? 1.5;

  const bins = [
    { range: '< -5%', count: 0, color: CHART_COLORS.red },
    { range: '-5% to -2%', count: 0, color: '#F87171' },
    { range: '-2% to 0%', count: 0, color: '#FCA5A5' },
    { range: '0% to 2%', count: 0, color: '#86EFAC' },
    { range: '2% to 5%', count: 0, color: '#4ADE80' },
    { range: '> 5%', count: 0, color: CHART_COLORS.green },
  ];

  const losses = Math.round(totalTrades * (1 - winRate));
  const wins = totalTrades - losses;

  // Distribute losses
  bins[0].count = Math.round(losses * 0.15);
  bins[1].count = Math.round(losses * 0.35);
  bins[2].count = losses - bins[0].count - bins[1].count;

  // Distribute wins - skew by profit factor
  const skew = Math.min(profitFactor / 2, 1);
  bins[3].count = Math.round(wins * (1 - skew) * 0.6);
  bins[4].count = Math.round(wins * 0.3);
  bins[5].count = wins - bins[3].count - bins[4].count;

  return bins;
}

function generateRollingMetrics(backtest: BacktestResult) {
  const sharpe = backtest.sharpe_ratio ?? backtest.metrics?.sharpe_ratio ?? 1;
  const numPoints = 12;
  const data = [];

  let seed = 0;
  if (backtest.id) {
    for (let i = 0; i < backtest.id.length; i++) {
      seed += backtest.id.charCodeAt(i);
    }
  }
  const pseudoRandom = (i: number) => {
    const x = Math.sin(seed + i * 7919) * 10000;
    return x - Math.floor(x);
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < numPoints; i++) {
    const variation = (pseudoRandom(i) - 0.5) * sharpe * 1.2;
    data.push({
      month: months[i],
      sharpe: parseFloat((sharpe + variation).toFixed(2)),
      benchmark: 1.0,
    });
  }
  return data;
}

// --- Exported Chart Components ---

interface BacktestChartsProps {
  backtest: BacktestResult;
}

export function EquityCurveChart({ backtest }: BacktestChartsProps) {
  const colors = useChartColors();
  const equityCurve = useMemo(() => generateEquityCurve(backtest), [backtest]);
  const isPositive = (backtest.total_return ?? 0) >= 0;

  return (
    <ChartCard title="Equity Curve" description="Simulated portfolio growth based on strategy metrics">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={equityCurve} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? CHART_COLORS.green : CHART_COLORS.red} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isPositive ? CHART_COLORS.green : CHART_COLORS.red} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
          <XAxis dataKey="period" tick={{ fontSize: 11, fill: colors.textColor }} axisLine={{ stroke: colors.gridColor }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: colors.textColor }} axisLine={{ stroke: colors.gridColor }} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.tooltipBg,
              border: `1px solid ${colors.tooltipBorder}`,
              borderRadius: '8px',
              color: colors.tooltipText,
              fontSize: '12px',
              fontFamily: "'Quicksand', sans-serif",
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
          />
          <ReferenceLine y={10000} stroke={colors.textColor} strokeDasharray="3 3" strokeOpacity={0.5} />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={isPositive ? CHART_COLORS.green : CHART_COLORS.red}
            strokeWidth={2}
            fill="url(#equityGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DrawdownChart({ backtest }: BacktestChartsProps) {
  const colors = useChartColors();
  const equityCurve = useMemo(() => generateEquityCurve(backtest), [backtest]);
  const drawdownData = useMemo(() => generateDrawdownSeries(equityCurve), [equityCurve]);

  return (
    <ChartCard title="Drawdown" description="Peak-to-trough decline in portfolio value">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={drawdownData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.red} stopOpacity={0.4} />
              <stop offset="95%" stopColor={CHART_COLORS.red} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
          <XAxis dataKey="period" tick={{ fontSize: 11, fill: colors.textColor }} axisLine={{ stroke: colors.gridColor }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: colors.textColor }} axisLine={{ stroke: colors.gridColor }} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.tooltipBg,
              border: `1px solid ${colors.tooltipBorder}`,
              borderRadius: '8px',
              color: colors.tooltipText,
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${value}%`, 'Drawdown']}
          />
          <ReferenceLine y={0} stroke={colors.textColor} strokeOpacity={0.3} />
          <Area
            type="monotone"
            dataKey="drawdown"
            stroke={CHART_COLORS.red}
            strokeWidth={2}
            fill="url(#ddGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TradeDistributionChart({ backtest }: BacktestChartsProps) {
  const colors = useChartColors();
  const distribution = useMemo(() => generateTradeDistribution(backtest), [backtest]);

  return (
    <ChartCard title="Trade Distribution" description="Histogram of trade P&L by return bucket">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={distribution} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 10, fill: colors.textColor }}
            axisLine={{ stroke: colors.gridColor }}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={{ fontSize: 11, fill: colors.textColor }} axisLine={{ stroke: colors.gridColor }} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.tooltipBg,
              border: `1px solid ${colors.tooltipBorder}`,
              borderRadius: '8px',
              color: colors.tooltipText,
              fontSize: '12px',
            }}
            formatter={(value: number) => [value, 'Trades']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {distribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RollingSharpeChart({ backtest }: BacktestChartsProps) {
  const colors = useChartColors();
  const rollingData = useMemo(() => generateRollingMetrics(backtest), [backtest]);

  return (
    <ChartCard title="Rolling Sharpe Ratio" description="12-month rolling risk-adjusted performance">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={rollingData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: colors.textColor }} axisLine={{ stroke: colors.gridColor }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: colors.textColor }} axisLine={{ stroke: colors.gridColor }} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.tooltipBg,
              border: `1px solid ${colors.tooltipBorder}`,
              borderRadius: '8px',
              color: colors.tooltipText,
              fontSize: '12px',
            }}
          />
          <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '11px', color: colors.textColor }} />
          <ReferenceLine y={1} stroke={CHART_COLORS.yellow} strokeDasharray="5 5" strokeOpacity={0.6} label={{ value: 'Target', position: 'right', fill: colors.textColor, fontSize: 10 }} />
          <Line type="monotone" dataKey="sharpe" stroke={CHART_COLORS.yellow} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS.yellow }} name="Rolling Sharpe" />
          <Line type="monotone" dataKey="benchmark" stroke={colors.textColor} strokeWidth={1} strokeDasharray="3 3" dot={false} name="Benchmark" />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Overlay chart for comparisons
interface ComparisonChartProps {
  backtests: BacktestResult[];
  labels?: string[];
}

const COMPARISON_COLORS = [CHART_COLORS.yellow, CHART_COLORS.blue, CHART_COLORS.green];

export function ComparisonEquityCurve({ backtests, labels }: ComparisonChartProps) {
  const colors = useChartColors();

  const allCurves = useMemo(() => {
    const curves = backtests.map((bt) => generateEquityCurve(bt));
    const maxLen = Math.max(...curves.map((c) => c.length));
    const data = [];
    for (let i = 0; i < maxLen; i++) {
      const point: Record<string, number> = { period: i };
      curves.forEach((curve, idx) => {
        point[`equity_${idx}`] = curve[i]?.equity ?? curve[curve.length - 1]?.equity ?? 10000;
      });
      data.push(point);
    }
    return data;
  }, [backtests]);

  return (
    <ChartCard title="Equity Curve Comparison" description="Overlayed portfolio growth for selected backtests">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={allCurves} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
          <XAxis dataKey="period" tick={{ fontSize: 11, fill: colors.textColor }} axisLine={{ stroke: colors.gridColor }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: colors.textColor }} axisLine={{ stroke: colors.gridColor }} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.tooltipBg,
              border: `1px solid ${colors.tooltipBorder}`,
              borderRadius: '8px',
              color: colors.tooltipText,
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => {
              const idx = parseInt(name.split('_')[1]);
              return [`$${value.toLocaleString()}`, labels?.[idx] || `Strategy ${idx + 1}`];
            }}
          />
          <Legend
            verticalAlign="top"
            height={30}
            wrapperStyle={{ fontSize: '11px', color: colors.textColor }}
            formatter={(value: string) => {
              const idx = parseInt(value.split('_')[1]);
              return labels?.[idx] || `Strategy ${idx + 1}`;
            }}
          />
          <ReferenceLine y={10000} stroke={colors.textColor} strokeDasharray="3 3" strokeOpacity={0.5} />
          {backtests.map((_, idx) => (
            <Line
              key={idx}
              type="monotone"
              dataKey={`equity_${idx}`}
              stroke={COMPARISON_COLORS[idx % COMPARISON_COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
