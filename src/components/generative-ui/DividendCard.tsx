'use client';
import React from 'react';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';

interface DivHistory { date: string; amount: number; }
interface DividendCardProps { success?: boolean; error?: string; symbol?: string; name?: string; annual_dividend?: number; dividend_yield?: number; payout_ratio?: number; ex_dividend_date?: string; frequency?: string; '5y_avg_yield'?: number; history?: DivHistory[]; fetch_time_ms?: number; }

export function DividendCard(props: DividendCardProps) {
  if (!props.success && props.error) return <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px', color: '#ef4444' }}>Dividend Error: {props.error}</div>;
  return (
    <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '16px', padding: '24px', color: '#fff', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <DollarSign size={18} color="#22c55e" />
        <div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#FEC00F' }}>{props.symbol}</span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginLeft: '8px' }}>Dividends</span>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '36px', fontWeight: 800, color: '#22c55e' }}>{props.dividend_yield?.toFixed(2)}%</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Annual Yield • ${props.annual_dividend?.toFixed(2)}/share</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Payout Ratio</div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>{props.payout_ratio?.toFixed(1)}%</div>
        </div>
        <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>5Y Avg Yield</div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>{props['5y_avg_yield']}%</div>
        </div>
        <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Frequency</div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>{props.frequency || 'Quarterly'}</div>
        </div>
        <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Ex-Div Date</div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>{props.ex_dividend_date || '—'}</div>
        </div>
      </div>
      {props.history && props.history.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Recent Payments</div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '40px' }}>
            {props.history.map((h, i) => {
              const maxAmt = Math.max(...(props.history || []).map(x => x.amount));
              const height = (h.amount / maxAmt) * 36 + 4;
              return <div key={i} title={`${h.date}: $${h.amount}`} style={{ flex: 1, height: `${height}px`, backgroundColor: 'rgba(34,197,94,0.5)', borderRadius: '2px 2px 0 0' }} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
export default DividendCard;
