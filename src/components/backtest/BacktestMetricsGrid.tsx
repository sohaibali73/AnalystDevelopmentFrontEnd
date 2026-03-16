'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Activity,
  Shield,
  Zap,
  Hash,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import type { BacktestResult } from '@/types/api';

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  badge?: { text: string; variant: 'default' | 'destructive' | 'outline' | 'secondary' };
  color: string;
  subtext?: string;
}

function MetricCard({ label, value, icon, badge, color, subtext }: MetricCardProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Card
      className="relative overflow-hidden border transition-all duration-200 hover:shadow-lg"
      style={{
        backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
        borderColor: isDark ? '#333' : '#E5E5E5',
      }}
    >
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{ backgroundColor: color }}
      />
      <CardContent className="flex items-start justify-between p-4">
        <div className="flex flex-col gap-1">
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: isDark ? '#9E9E9E' : '#757575' }}
          >
            {label}
          </span>
          <span
            className="font-sans text-2xl font-bold tracking-tight"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              color: isDark ? '#F5F5F5' : '#212121',
            }}
          >
            {value}
          </span>
          {subtext && (
            <span className="text-xs" style={{ color: isDark ? '#757575' : '#9E9E9E' }}>
              {subtext}
            </span>
          )}
          {badge && (
            <Badge
              variant={badge.variant}
              className="mt-1 w-fit text-xs"
              style={
                badge.variant === 'default'
                  ? { backgroundColor: color, color: '#fff' }
                  : undefined
              }
            >
              {badge.text}
            </Badge>
          )}
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `${color}15`,
            color: color,
          }}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function formatPercent(value: number | undefined, abs = false): string {
  if (value === undefined || value === null) return 'N/A';
  const v = abs ? Math.abs(value) : value;
  return `${(v * 100).toFixed(2)}%`;
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null) return 'N/A';
  return value.toFixed(2);
}

function sharpeRating(v: number): { text: string; variant: 'default' | 'destructive' | 'outline' | 'secondary' } {
  if (v >= 2) return { text: 'Excellent', variant: 'default' };
  if (v >= 1) return { text: 'Good', variant: 'secondary' };
  if (v >= 0.5) return { text: 'Average', variant: 'outline' };
  return { text: 'Poor', variant: 'destructive' };
}

function drawdownSeverity(v: number): { text: string; variant: 'default' | 'destructive' | 'outline' | 'secondary' } {
  const abs = Math.abs(v);
  if (abs < 0.1) return { text: 'Low', variant: 'secondary' };
  if (abs < 0.2) return { text: 'Moderate', variant: 'outline' };
  if (abs < 0.35) return { text: 'High', variant: 'default' };
  return { text: 'Severe', variant: 'destructive' };
}

interface BacktestMetricsGridProps {
  backtest: BacktestResult;
}

export default function BacktestMetricsGrid({ backtest }: BacktestMetricsGridProps) {
  const totalReturn = backtest.total_return ?? backtest.metrics?.cagr ?? 0;
  const winRate = backtest.win_rate ?? backtest.metrics?.win_rate ?? 0;
  const maxDrawdown = backtest.max_drawdown ?? backtest.metrics?.max_drawdown ?? 0;
  const sharpeRatio = backtest.sharpe_ratio ?? backtest.metrics?.sharpe_ratio ?? 0;
  const profitFactor = backtest.metrics?.profit_factor;
  const totalTrades = backtest.metrics?.total_trades;
  const cagr = backtest.metrics?.cagr;

  const metrics: MetricCardProps[] = [
    {
      label: 'Total Return',
      value: formatPercent(totalReturn),
      icon: totalReturn >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />,
      color: totalReturn >= 0 ? '#22C55E' : '#EF4444',
      badge:
        totalReturn >= 0
          ? { text: 'Profitable', variant: 'default' }
          : { text: 'Loss', variant: 'destructive' },
    },
    {
      label: 'Sharpe Ratio',
      value: formatNumber(sharpeRatio),
      icon: <Activity size={20} />,
      color: '#FEC00F',
      badge: sharpeRating(sharpeRatio),
    },
    {
      label: 'Max Drawdown',
      value: formatPercent(maxDrawdown, true),
      icon: <Shield size={20} />,
      color: '#EF4444',
      badge: drawdownSeverity(maxDrawdown),
    },
    {
      label: 'Win Rate',
      value: formatPercent(winRate),
      icon: <Target size={20} />,
      color: '#3B82F6',
      subtext: winRate > 0.5 ? 'Above average' : 'Below average',
    },
  ];

  if (cagr !== undefined && cagr !== null) {
    metrics.push({
      label: 'CAGR',
      value: formatPercent(cagr),
      icon: <Zap size={20} />,
      color: cagr >= 0 ? '#22C55E' : '#EF4444',
    });
  }

  if (profitFactor !== undefined && profitFactor !== null) {
    metrics.push({
      label: 'Profit Factor',
      value: formatNumber(profitFactor),
      icon: <BarChart3 size={20} />,
      color: profitFactor >= 1.5 ? '#22C55E' : profitFactor >= 1 ? '#FEC00F' : '#EF4444',
      subtext: profitFactor >= 1.5 ? 'Strong' : profitFactor >= 1 ? 'Marginal' : 'Negative edge',
    });
  }

  if (totalTrades !== undefined && totalTrades !== null) {
    metrics.push({
      label: 'Total Trades',
      value: totalTrades.toString(),
      icon: <Hash size={20} />,
      color: '#A78BFA',
      subtext: totalTrades >= 100 ? 'Large sample' : totalTrades >= 30 ? 'Moderate sample' : 'Small sample',
    });
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </div>
  );
}
