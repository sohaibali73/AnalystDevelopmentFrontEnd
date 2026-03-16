'use client';
import React from 'react';
import { Activity, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface BacktestResultsProps { success?: boolean; error?: string; symbol?: string; strategy?: string; period?: string; parameters?: { fast_period?: number; slow_period?: number }; total_return?: number; buy_hold_return?: number; excess_return?: number; total_trades?: number; win_rate?: number; max_drawdown?: number; annual_volatility?: number; sharpe_ratio?: number; trading_days?: number; start_date?: string; end_date?: string; fetch_time_ms?: number; }

export function BacktestResults(props: BacktestResultsProps) {
  if (!props.success && props.error) return <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px', color: '#ef4444' }}>Backtest Error: {props.error}</div>;
  const strategyLabel = (props.strategy || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const beatsBuyHold = (props.excess_return || 0) > 0;
  return (
    <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)', borderRadius: '16px', padding: '24px', color: '#fff', maxWidth: '500px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <Activity size={18} color="#FEC00F" />
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#FEC00F' }}>Backtest: {props.symbol}</span>
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
        {strategyLabel} ({props.parameters?.fast_period}/{props.parameters?.slow_period}) • {props.start_date} → {props.end_date}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: (props.total_return || 0) >= 0 ? '#22c55e' : '#ef4444' }}>{(props.total_return || 0) > 0 ? '+' : ''}{props.total_return}%</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Strategy Return</div>
        </div>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: (props.buy_hold_return || 0) >= 0 ? '#22c55e' : '#ef4444' }}>{(props.buy_hold_return || 0) > 0 ? '+' : ''}{props.buy_hold_return}%</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Buy & Hold</div>
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '8px', backgroundColor: beatsBuyHold ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: beatsBuyHold ? '#22c55e' : '#ef4444' }}>
          {beatsBuyHold ? '✅ Beats' : '❌ Underperforms'} Buy & Hold by {Math.abs(props.excess_return || 0)}%
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {[
          { label: 'Trades', value: props.total_trades },
          { label: 'Win Rate', value: `${props.win_rate}%`, color: (props.win_rate || 0) >= 50 ? '#22c55e' : '#ef4444' },
          { label: 'Sharpe', value: props.sharpe_ratio, color: (props.sharpe_ratio || 0) >= 1 ? '#22c55e' : '#fbbf24' },
          { label: 'Max DD', value: `${props.max_drawdown}%`, color: '#ef4444' },
          { label: 'Volatility', value: `${props.annual_volatility}%`, color: '#f59e0b' },
          { label: 'Days', value: props.trading_days },
        ].map((item, i) => (
          <div key={i} style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{item.label}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: item.color || '#fff', fontFamily: 'monospace' }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default BacktestResults;
