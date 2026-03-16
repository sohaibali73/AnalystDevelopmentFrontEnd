'use client';

import React, { useState } from 'react';
import { Plus, X, Trophy, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from '@/contexts/ThemeContext';
import type { BacktestResult } from '@/types/api';
import { ComparisonEquityCurve } from './BacktestCharts';

interface BacktestCompareProps {
  backtests: BacktestResult[];
}

function formatPercent(value: number | undefined, abs = false): string {
  if (value === undefined || value === null) return '-';
  const v = abs ? Math.abs(value) : value;
  return `${(v * 100).toFixed(2)}%`;
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null) return '-';
  return value.toFixed(2);
}

interface MetricRow {
  label: string;
  getValue: (bt: BacktestResult) => number | undefined;
  format: (v: number | undefined) => string;
  higherIsBetter: boolean;
}

const METRIC_ROWS: MetricRow[] = [
  {
    label: 'Total Return',
    getValue: (bt) => bt.total_return ?? bt.metrics?.cagr,
    format: (v) => formatPercent(v),
    higherIsBetter: true,
  },
  {
    label: 'Sharpe Ratio',
    getValue: (bt) => bt.sharpe_ratio ?? bt.metrics?.sharpe_ratio,
    format: (v) => formatNumber(v),
    higherIsBetter: true,
  },
  {
    label: 'Win Rate',
    getValue: (bt) => bt.win_rate ?? bt.metrics?.win_rate,
    format: (v) => formatPercent(v),
    higherIsBetter: true,
  },
  {
    label: 'Max Drawdown',
    getValue: (bt) => bt.max_drawdown ?? bt.metrics?.max_drawdown,
    format: (v) => formatPercent(v !== undefined ? Math.abs(v) : undefined),
    higherIsBetter: false, // lower drawdown is better
  },
  {
    label: 'Profit Factor',
    getValue: (bt) => bt.metrics?.profit_factor,
    format: (v) => formatNumber(v),
    higherIsBetter: true,
  },
  {
    label: 'Total Trades',
    getValue: (bt) => bt.metrics?.total_trades,
    format: (v) => (v !== undefined ? Math.round(v).toString() : '-'),
    higherIsBetter: true,
  },
  {
    label: 'CAGR',
    getValue: (bt) => bt.metrics?.cagr,
    format: (v) => formatPercent(v),
    higherIsBetter: true,
  },
];

const SLOT_COLORS = ['#FEC00F', '#3B82F6', '#22C55E'];

export default function BacktestCompare({ backtests }: BacktestCompareProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [selectedIds, setSelectedIds] = useState<(string | null)[]>([null, null]);

  const selectedBacktests = selectedIds
    .map((id) => backtests.find((bt) => bt.id === id))
    .filter(Boolean) as BacktestResult[];

  const addSlot = () => {
    if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, null]);
    }
  };

  const removeSlot = (idx: number) => {
    if (selectedIds.length > 2) {
      setSelectedIds(selectedIds.filter((_, i) => i !== idx));
    } else {
      setSelectedIds(selectedIds.map((id, i) => (i === idx ? null : id)));
    }
  };

  const updateSlot = (idx: number, id: string) => {
    setSelectedIds(selectedIds.map((curr, i) => (i === idx ? id : curr)));
  };

  // Determine best value per metric row
  const getBestIndex = (row: MetricRow): number | null => {
    const values = selectedBacktests.map((bt) => row.getValue(bt));
    const validValues = values.filter((v) => v !== undefined) as number[];
    if (validValues.length < 2) return null;

    let bestIdx = 0;
    let bestVal = values[0] ?? -Infinity;
    for (let i = 1; i < values.length; i++) {
      const val = values[i];
      if (val === undefined) continue;
      if (row.higherIsBetter ? val > bestVal : val < bestVal) {
        bestIdx = i;
        bestVal = val;
      }
    }
    return bestIdx;
  };

  // Generate summary verdict
  const getVerdict = (): string => {
    if (selectedBacktests.length < 2) return 'Select at least 2 backtests to compare.';

    const scores = selectedBacktests.map(() => 0);
    METRIC_ROWS.forEach((row) => {
      const best = getBestIndex(row);
      if (best !== null) scores[best]++;
    });

    const maxScore = Math.max(...scores);
    const winnerIdx = scores.indexOf(maxScore);
    const winnerId = selectedBacktests[winnerIdx]?.strategy_id?.slice(0, 10) || `Strategy ${winnerIdx + 1}`;

    if (scores.filter((s) => s === maxScore).length > 1) {
      return `The comparison is close - strategies are competitive across different metrics. Consider your risk tolerance to decide.`;
    }

    return `Strategy "${winnerId}" leads in ${maxScore} of ${METRIC_ROWS.length} metrics and appears to be the stronger performer overall.`;
  };

  if (backtests.length < 2) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border p-16 text-center"
        style={{
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          borderColor: isDark ? '#333' : '#E5E5E5',
        }}
      >
        <Trophy size={48} style={{ color: isDark ? '#333' : '#E0E0E0', marginBottom: '16px' }} />
        <p
          className="text-base font-medium"
          style={{ color: isDark ? '#9E9E9E' : '#757575' }}
        >
          You need at least 2 backtests to use the comparison feature.
        </p>
        <p className="mt-1 text-sm" style={{ color: isDark ? '#555' : '#BDBDBD' }}>
          Upload more backtest results from the Overview tab.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Selector Row */}
      <div className="flex flex-wrap items-end gap-3">
        {selectedIds.map((id, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: SLOT_COLORS[idx] }}
              />
              <label
                className="text-xs font-medium uppercase tracking-wider"
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  color: isDark ? '#9E9E9E' : '#757575',
                }}
              >
                Strategy {idx + 1}
              </label>
              {selectedIds.length > 2 && (
                <button onClick={() => removeSlot(idx)} className="ml-1">
                  <X size={12} style={{ color: isDark ? '#757575' : '#9E9E9E' }} />
                </button>
              )}
            </div>
            <Select value={id ?? ''} onValueChange={(val) => updateSlot(idx, val)}>
              <SelectTrigger
                className="w-56"
                style={{
                  backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                  borderColor: id ? SLOT_COLORS[idx] : isDark ? '#424242' : '#E0E0E0',
                  color: isDark ? '#F5F5F5' : '#212121',
                }}
              >
                <SelectValue placeholder="Select a backtest..." />
              </SelectTrigger>
              <SelectContent
                style={{
                  backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                  borderColor: isDark ? '#424242' : '#E0E0E0',
                }}
              >
                {backtests.map((bt) => (
                  <SelectItem key={bt.id} value={bt.id}>
                    {bt.strategy_id?.slice(0, 10) || 'Unknown'} - {formatPercent(bt.total_return ?? bt.metrics?.cagr)} return
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {selectedIds.length < 3 && (
          <Button
            variant="outline"
            size="sm"
            onClick={addSlot}
            className="mb-0.5 flex items-center gap-1"
            style={{
              borderColor: isDark ? '#424242' : '#E0E0E0',
              color: isDark ? '#9E9E9E' : '#757575',
            }}
          >
            <Plus size={14} /> Add
          </Button>
        )}
      </div>

      {/* Comparison Table */}
      {selectedBacktests.length >= 2 && (
        <>
          <Card
            className="overflow-hidden border"
            style={{
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderColor: isDark ? '#333' : '#E5E5E5',
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle
                className="text-sm font-semibold uppercase tracking-wider"
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  color: isDark ? '#F5F5F5' : '#212121',
                }}
              >
                Metric Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      style={{
                        borderBottom: `1px solid ${isDark ? '#333' : '#E5E5E5'}`,
                        backgroundColor: isDark ? '#161616' : '#FAFAFA',
                      }}
                    >
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: isDark ? '#9E9E9E' : '#757575' }}
                      >
                        Metric
                      </th>
                      {selectedBacktests.map((bt, idx) => (
                        <th
                          key={bt.id}
                          className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                          style={{ color: SLOT_COLORS[idx] }}
                        >
                          {bt.strategy_id?.slice(0, 10) || `Strategy ${idx + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {METRIC_ROWS.map((row) => {
                      const bestIdx = getBestIndex(row);
                      return (
                        <tr
                          key={row.label}
                          style={{
                            borderBottom: `1px solid ${isDark ? '#2A2A2A' : '#F0F0F0'}`,
                          }}
                        >
                          <td
                            className="px-4 py-3 text-sm font-medium"
                            style={{ color: isDark ? '#E0E0E0' : '#424242' }}
                          >
                            {row.label}
                          </td>
                          {selectedBacktests.map((bt, idx) => {
                            const value = row.getValue(bt);
                            const isBest = bestIdx === idx;
                            return (
                              <td
                                key={bt.id}
                                className="px-4 py-3 text-right text-sm font-semibold tabular-nums"
                                style={{
                                  color: isBest ? '#22C55E' : isDark ? '#E0E0E0' : '#424242',
                                }}
                              >
                                <span className="inline-flex items-center gap-1">
                                  {row.format(value)}
                                  {isBest && <Trophy size={12} style={{ color: '#FEC00F' }} />}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Overlay equity chart */}
          <ComparisonEquityCurve
            backtests={selectedBacktests}
            labels={selectedBacktests.map(
              (bt, idx) => bt.strategy_id?.slice(0, 10) || `Strategy ${idx + 1}`
            )}
          />

          {/* Verdict */}
          <Card
            className="overflow-hidden border"
            style={{
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderColor: '#FEC00F',
            }}
          >
            <CardContent className="flex items-start gap-3 p-4">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'rgba(254,192,15,0.15)' }}
              >
                <Trophy size={16} style={{ color: '#FEC00F' }} />
              </div>
              <div>
                <h4
                  className="mb-1 text-sm font-semibold uppercase tracking-wider"
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    color: isDark ? '#F5F5F5' : '#212121',
                  }}
                >
                  Verdict
                </h4>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: isDark ? '#E0E0E0' : '#424242' }}
                >
                  {getVerdict()}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedBacktests.length < 2 && (
        <div
          className="rounded-xl border p-12 text-center"
          style={{
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderColor: isDark ? '#333' : '#E5E5E5',
          }}
        >
          <p className="text-sm" style={{ color: isDark ? '#757575' : '#9E9E9E' }}>
            Select at least 2 strategies above to see a detailed comparison.
          </p>
        </div>
      )}
    </div>
  );
}
