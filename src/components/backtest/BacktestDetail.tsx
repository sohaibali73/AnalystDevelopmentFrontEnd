'use client';

import React, { useState } from 'react';
import { ArrowLeft, Zap, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import type { BacktestResult } from '@/types/api';
import BacktestMetricsGrid from './BacktestMetricsGrid';
import {
  EquityCurveChart,
  DrawdownChart,
  TradeDistributionChart,
  RollingSharpeChart,
} from './BacktestCharts';

interface BacktestDetailProps {
  backtest: BacktestResult;
  onBack: () => void;
  onFeedback: () => void;
}

function formatPercent(value: number | undefined, abs = false): string {
  if (value === undefined || value === null) return 'N/A';
  const v = abs ? Math.abs(value) : value;
  return `${(v * 100).toFixed(2)}%`;
}

function generateInsights(bt: BacktestResult): string[] {
  const insights: string[] = [];
  const totalReturn = bt.total_return ?? bt.metrics?.cagr ?? 0;
  const winRate = bt.win_rate ?? bt.metrics?.win_rate ?? 0;
  const sharpe = bt.sharpe_ratio ?? bt.metrics?.sharpe_ratio ?? 0;
  const maxDD = Math.abs(bt.max_drawdown ?? bt.metrics?.max_drawdown ?? 0);
  const pf = bt.metrics?.profit_factor;

  if (totalReturn > 0.15) {
    insights.push(`Strong return of ${formatPercent(totalReturn)} significantly outperforms a typical equity benchmark (~10% annually). The strategy shows potential for alpha generation.`);
  } else if (totalReturn > 0) {
    insights.push(`Positive return of ${formatPercent(totalReturn)}, though below typical equity benchmarks. Consider reviewing entry/exit timing for improvement opportunities.`);
  } else {
    insights.push(`Negative return of ${formatPercent(totalReturn)} indicates the strategy is underperforming. A fundamental review of the entry logic and market conditions is recommended.`);
  }

  if (sharpe >= 2) {
    insights.push(`Exceptional risk-adjusted performance with a Sharpe ratio of ${sharpe.toFixed(2)}. This indicates consistent returns relative to volatility.`);
  } else if (sharpe >= 1) {
    insights.push(`Sharpe ratio of ${sharpe.toFixed(2)} indicates acceptable risk-adjusted returns. There may be room to improve consistency.`);
  } else {
    insights.push(`Sharpe ratio of ${sharpe.toFixed(2)} suggests the risk-adjusted returns are below standard thresholds. Consider position sizing adjustments or adding filters.`);
  }

  if (maxDD > 0.3) {
    insights.push(`Maximum drawdown of ${formatPercent(maxDD)} is severe and may lead to strategy abandonment in live trading. Implement stop-loss mechanisms or reduce position sizes.`);
  } else if (maxDD > 0.15) {
    insights.push(`Drawdown of ${formatPercent(maxDD)} is moderate. Consider adding drawdown-based position reduction rules for better risk management.`);
  } else {
    insights.push(`Low maximum drawdown of ${formatPercent(maxDD)} demonstrates strong risk control. The strategy handles adverse conditions well.`);
  }

  if (winRate > 0.6) {
    insights.push(`High win rate of ${formatPercent(winRate)} combined with ${pf ? `a profit factor of ${pf.toFixed(2)}` : 'the current metrics'} suggests a reliable edge. Monitor for regime changes.`);
  } else if (winRate < 0.4) {
    insights.push(`Win rate of ${formatPercent(winRate)} is below average. If the strategy is profitable, it relies on large winners offsetting frequent small losses - ensure risk/reward remains favorable.`);
  }

  return insights;
}

export default function BacktestDetail({ backtest, onBack, onFeedback }: BacktestDetailProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [expandedRecs, setExpandedRecs] = useState<Set<number>>(new Set());
  const [insightVotes, setInsightVotes] = useState<Record<number, 'up' | 'down'>>({});

  const insights = backtest.analysis
    ? [backtest.analysis]
    : generateInsights(backtest);

  const recommendations = backtest.recommendations ?? [];

  const toggleRec = (idx: number) => {
    setExpandedRecs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const voteInsight = (idx: number, vote: 'up' | 'down') => {
    setInsightVotes((prev) => ({ ...prev, [idx]: prev[idx] === vote ? undefined! : vote }));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-1"
            style={{ color: isDark ? '#E0E0E0' : '#424242' }}
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h2
              className="text-lg font-bold uppercase tracking-wider"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                color: isDark ? '#F5F5F5' : '#212121',
              }}
            >
              Strategy {backtest.strategy_id?.slice(0, 10) || 'Analysis'}
            </h2>
            <span className="text-xs" style={{ color: isDark ? '#757575' : '#9E9E9E' }}>
              Analyzed on {new Date(backtest.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onFeedback}
          className="flex items-center gap-2"
          style={{
            borderColor: '#FEC00F',
            color: '#FEC00F',
          }}
        >
          <MessageSquare size={14} />
          Rate Analysis
        </Button>
      </div>

      {/* Key Metrics Grid */}
      <BacktestMetricsGrid backtest={backtest} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EquityCurveChart backtest={backtest} />
        <DrawdownChart backtest={backtest} />
        <TradeDistributionChart backtest={backtest} />
        <RollingSharpeChart backtest={backtest} />
      </div>

      {/* AI Insights */}
      <Card
        className="overflow-hidden border"
        style={{
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          borderColor: isDark ? '#333' : '#E5E5E5',
        }}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Zap size={18} style={{ color: '#FEC00F' }} />
            <span
              className="text-sm font-semibold uppercase tracking-wider"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                color: isDark ? '#F5F5F5' : '#212121',
              }}
            >
              AI-Powered Insights
            </span>
            {backtest.analysis && (
              <Badge
                className="text-xs"
                style={{ backgroundColor: 'rgba(254,192,15,0.15)', color: '#FEC00F' }}
              >
                API
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-lg p-3"
              style={{
                backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                border: `1px solid ${isDark ? '#333' : '#E0E0E0'}`,
              }}
            >
              <div
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: 'rgba(254,192,15,0.15)', color: '#FEC00F' }}
              >
                {idx + 1}
              </div>
              <div className="flex-1">
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: isDark ? '#E0E0E0' : '#424242' }}
                >
                  {insight}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
                    style={{
                      color: insightVotes[idx] === 'up' ? '#22C55E' : isDark ? '#757575' : '#9E9E9E',
                      backgroundColor: insightVotes[idx] === 'up' ? 'rgba(34,197,94,0.1)' : 'transparent',
                    }}
                    onClick={() => voteInsight(idx, 'up')}
                  >
                    <ThumbsUp size={12} /> Helpful
                  </button>
                  <button
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
                    style={{
                      color: insightVotes[idx] === 'down' ? '#EF4444' : isDark ? '#757575' : '#9E9E9E',
                      backgroundColor: insightVotes[idx] === 'down' ? 'rgba(239,68,68,0.1)' : 'transparent',
                    }}
                    onClick={() => voteInsight(idx, 'down')}
                  >
                    <ThumbsDown size={12} /> Not useful
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mt-2">
              <h4
                className="mb-3 text-xs font-semibold uppercase tracking-wider"
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  color: isDark ? '#9E9E9E' : '#757575',
                }}
              >
                Recommendations
              </h4>
              <div className="flex flex-col gap-2">
                {recommendations
                  .sort((a, b) => a.priority - b.priority)
                  .map((rec, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border"
                      style={{
                        borderColor: isDark ? '#333' : '#E0E0E0',
                        backgroundColor: isDark ? '#262626' : '#FAFAFA',
                      }}
                    >
                      <button
                        className="flex w-full items-center justify-between p-3 text-left"
                        onClick={() => toggleRec(idx)}
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            className="shrink-0 text-xs"
                            style={{
                              backgroundColor:
                                rec.priority === 1
                                  ? 'rgba(239,68,68,0.15)'
                                  : rec.priority === 2
                                  ? 'rgba(254,192,15,0.15)'
                                  : 'rgba(59,130,246,0.15)',
                              color:
                                rec.priority === 1
                                  ? '#EF4444'
                                  : rec.priority === 2
                                  ? '#FEC00F'
                                  : '#3B82F6',
                            }}
                          >
                            P{rec.priority}
                          </Badge>
                          <span
                            className="text-sm font-medium"
                            style={{ color: isDark ? '#E0E0E0' : '#424242' }}
                          >
                            {rec.recommendation}
                          </span>
                        </div>
                        {expandedRecs.has(idx) ? (
                          <ChevronUp size={14} style={{ color: isDark ? '#757575' : '#9E9E9E' }} />
                        ) : (
                          <ChevronDown size={14} style={{ color: isDark ? '#757575' : '#9E9E9E' }} />
                        )}
                      </button>
                      {expandedRecs.has(idx) && (
                        <div
                          className="border-t px-3 pb-3 pt-2"
                          style={{ borderColor: isDark ? '#333' : '#E0E0E0' }}
                        >
                          {rec.expected_impact && (
                            <p className="mb-1 text-xs" style={{ color: isDark ? '#9E9E9E' : '#757575' }}>
                              <strong style={{ color: '#FEC00F' }}>Expected Impact:</strong>{' '}
                              {rec.expected_impact}
                            </p>
                          )}
                          {rec.implementation && (
                            <p className="text-xs" style={{ color: isDark ? '#9E9E9E' : '#757575' }}>
                              <strong style={{ color: '#FEC00F' }}>Implementation:</strong>{' '}
                              {rec.implementation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
