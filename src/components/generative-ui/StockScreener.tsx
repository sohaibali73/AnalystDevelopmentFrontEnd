'use client';
import React from 'react';
import { TrendingUp, TrendingDown, Search, Filter } from 'lucide-react';

interface ScreenResult {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  market_cap_b: number;
  pe_ratio: number | null;
  dividend_yield: number;
  '52w_change': number;
}

interface StockScreenerProps {
  success?: boolean;
  error?: string;
  results?: ScreenResult[];
  count?: number;
  filters?: { sector?: string; min_market_cap?: number; max_pe_ratio?: number; min_dividend_yield?: number };
  fetch_time_ms?: number;
}

export function StockScreener(props: StockScreenerProps) {
  if (!props.success && props.error) {
    return <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px', color: '#ef4444', fontSize: '14px' }}>Stock Screener Error: {props.error}</div>;
  }

  const results = props.results || [];
  const filters = props.filters || {};

  return (
    <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '16px', padding: '20px', color: '#fff', maxWidth: '700px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={18} color="#FEC00F" />
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#FEC00F' }}>Stock Screener</span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginLeft: '8px' }}>{results.length} results</span>
        </div>
        {props.fetch_time_ms && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{props.fetch_time_ms}ms</span>}
      </div>

      {Object.values(filters).some(Boolean) && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <Filter size={12} color="rgba(255,255,255,0.4)" />
          {filters.sector && <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(254,192,15,0.15)', color: '#FEC00F', fontSize: '11px' }}>{filters.sector}</span>}
          {filters.min_market_cap && <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: '11px' }}>Cap &gt; ${filters.min_market_cap}B</span>}
          {filters.max_pe_ratio && <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '11px' }}>PE &lt; {filters.max_pe_ratio}</span>}
          {filters.min_dividend_yield && <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(168,85,247,0.15)', color: '#a855f7', fontSize: '11px' }}>Div &gt; {filters.min_dividend_yield}%</span>}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
              <th style={{ padding: '8px 6px', fontWeight: 600 }}>Symbol</th>
              <th style={{ padding: '8px 6px', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '8px 6px', fontWeight: 600, textAlign: 'right' }}>Price</th>
              <th style={{ padding: '8px 6px', fontWeight: 600, textAlign: 'right' }}>Mkt Cap</th>
              <th style={{ padding: '8px 6px', fontWeight: 600, textAlign: 'right' }}>P/E</th>
              <th style={{ padding: '8px 6px', fontWeight: 600, textAlign: 'right' }}>Div %</th>
              <th style={{ padding: '8px 6px', fontWeight: 600, textAlign: 'right' }}>52W</th>
            </tr>
          </thead>
          <tbody>
            {results.slice(0, 20).map((r, i) => {
              const chg = r['52w_change'] || 0;
              const isUp = chg > 0;
              return (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 6px', fontWeight: 700, color: '#FEC00F' }}>{r.symbol}</td>
                  <td style={{ padding: '8px 6px', color: 'rgba(255,255,255,0.7)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'monospace' }}>${r.price?.toFixed(2)}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right' }}>${r.market_cap_b}B</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right' }}>{r.pe_ratio ?? '—'}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right' }}>{r.dividend_yield}%</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', color: isUp ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                    {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {chg > 0 ? '+' : ''}{chg}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StockScreener;
