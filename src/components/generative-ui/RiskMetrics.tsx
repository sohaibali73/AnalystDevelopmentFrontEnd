'use client';
import React from 'react';
import { AlertTriangle, TrendingUp, Shield } from 'lucide-react';

interface RiskMetricsProps { success?: boolean; error?: string; symbol?: string; benchmark?: string; period?: string; annual_return?: number; annual_volatility?: number; sharpe_ratio?: number; sortino_ratio?: number; max_drawdown?: number; var_95?: number; var_99?: number; beta?: number; alpha?: number; risk_free_rate?: number; trading_days?: number; fetch_time_ms?: number; }

function ratingColor(label: string): string {
  if (label === 'Excellent') return '#22c55e';
  if (label === 'Good') return '#86efac';
  if (label === 'Average') return '#fbbf24';
  if (label === 'Poor') return '#f97316';
  return '#ef4444';
}

function sharpeRating(v: number): string {
  if (v >= 2) return 'Excellent';
  if (v >= 1) return 'Good';
  if (v >= 0.5) return 'Average';
  if (v >= 0) return 'Poor';
  return 'Bad';
}

export function RiskMetrics(props: RiskMetricsProps) {
  if (!props.success && props.error) return <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px', color: '#ef4444' }}>Risk Error: {props.error}</div>;
  const rating = sharpeRating(props.sharpe_ratio || 0);
  return (
    <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)', borderRadius: '16px', padding: '24px', color: '#fff', maxWidth: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Shield size={18} color="#FEC00F" />
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#FEC00F' }}>{props.symbol} Risk Analysis</span>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>vs {props.benchmark} ({props.period})</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: ratingColor(rating) }}>{props.sharpe_ratio}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Sharpe</div>
          <div style={{ fontSize: '10px', color: ratingColor(rating), fontWeight: 600 }}>{rating}</div>
        </div>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: (props.annual_return || 0) > 0 ? '#22c55e' : '#ef4444' }}>{props.annual_return}%</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Annual Return</div>
        </div>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ef4444' }}>{props.max_drawdown}%</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Max Drawdown</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {[
          { label: 'Sortino', value: props.sortino_ratio, color: (props.sortino_ratio || 0) >= 1 ? '#22c55e' : '#fbbf24' },
          { label: 'Beta', value: props.beta },
          { label: 'Alpha', value: `${props.alpha}%`, color: (props.alpha || 0) > 0 ? '#22c55e' : '#ef4444' },
          { label: 'Volatility', value: `${props.annual_volatility}%`, color: '#f59e0b' },
          { label: 'VaR 95%', value: `${props.var_95}%`, color: '#ef4444' },
          { label: 'VaR 99%', value: `${props.var_99}%`, color: '#ef4444' },
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
export default RiskMetrics;
