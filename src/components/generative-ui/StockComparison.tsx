'use client';
import React from 'react';
import { BarChart3 } from 'lucide-react';

interface Comparison { symbol: string; name: string; sector: string; price: number; market_cap_b: number; pe_ratio: number; forward_pe: number; revenue_b: number; profit_margin: number; dividend_yield: number; beta: number; '52w_change': number; error?: string; }
interface StockComparisonProps { success?: boolean; error?: string; symbols?: string[]; comparisons?: Comparison[]; metrics?: string[]; fetch_time_ms?: number; }

export function StockComparison(props: StockComparisonProps) {
  if (!props.success && props.error) return <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px', color: '#ef4444' }}>Compare Error: {props.error}</div>;
  const comps = props.comparisons || [];
  const metrics = [
    { key: 'price', label: 'Price', fmt: (v: any) => `$${v?.toFixed(2) || '—'}` },
    { key: 'market_cap_b', label: 'Mkt Cap', fmt: (v: any) => `$${v}B` },
    { key: 'pe_ratio', label: 'P/E', fmt: (v: any) => v || '—' },
    { key: 'revenue_b', label: 'Revenue', fmt: (v: any) => `$${v}B` },
    { key: 'profit_margin', label: 'Margin', fmt: (v: any) => `${v}%` },
    { key: 'dividend_yield', label: 'Div Yield', fmt: (v: any) => `${v}%` },
    { key: 'beta', label: 'Beta', fmt: (v: any) => v },
    { key: '52w_change', label: '52W Chg', fmt: (v: any) => { const n = v || 0; return <span style={{ color: n > 0 ? '#22c55e' : '#ef4444' }}>{n > 0 ? '+' : ''}{n}%</span>; }},
  ];
  return (
    <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '16px', padding: '20px', color: '#fff', maxWidth: '700px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <BarChart3 size={18} color="#FEC00F" />
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#FEC00F' }}>Stock Comparison</span>
        {props.fetch_time_ms && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>{props.fetch_time_ms}ms</span>}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <th style={{ padding: '8px 6px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Metric</th>
            {comps.map((c, i) => <th key={i} style={{ padding: '8px 6px', textAlign: 'right', color: '#FEC00F', fontWeight: 700 }}>{c.symbol}</th>)}
          </tr></thead>
          <tbody>
            {metrics.map((m, mi) => (
              <tr key={mi} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '7px 6px', color: 'rgba(255,255,255,0.6)' }}>{m.label}</td>
                {comps.map((c: any, ci) => <td key={ci} style={{ padding: '7px 6px', textAlign: 'right', fontFamily: 'monospace' }}>{c.error ? '—' : m.fmt(c[m.key])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default StockComparison;
