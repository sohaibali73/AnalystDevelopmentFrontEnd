'use client';
import React from 'react';
import { Globe, TrendingUp, TrendingDown } from 'lucide-react';

interface Quote { price: number; change: number; change_percent: number; }
interface MarketOverviewProps { success?: boolean; error?: string; indices?: Record<string, Quote>; commodities?: Record<string, Quote>; crypto?: Record<string, Quote>; bonds?: Record<string, Quote>; market_sentiment?: string; fetch_time_ms?: number; }

function QuoteRow({ name, q }: { name: string; q: Quote }) {
  const isUp = q.change >= 0;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace' }}>{q.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: isUp ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: '2px', minWidth: '65px', justifyContent: 'flex-end' }}>
          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {isUp ? '+' : ''}{q.change_percent}%
        </span>
      </div>
    </div>
  );
}

export function MarketOverview(props: MarketOverviewProps) {
  if (!props.success && props.error) return <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px', color: '#ef4444' }}>Market Error: {props.error}</div>;
  const sentColor = props.market_sentiment === 'bullish' ? '#22c55e' : props.market_sentiment === 'bearish' ? '#ef4444' : '#fbbf24';
  return (
    <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '16px', padding: '20px', color: '#fff', maxWidth: '500px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Globe size={18} color="#FEC00F" />
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#FEC00F' }}>Market Overview</span>
        <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: '12px', backgroundColor: `${sentColor}20`, color: sentColor, fontSize: '11px', fontWeight: 700, textTransform: 'capitalize' }}>{props.market_sentiment}</span>
      </div>
      {props.indices && Object.keys(props.indices).length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Indices</div>
          {Object.entries(props.indices).map(([name, q]) => <QuoteRow key={name} name={name} q={q} />)}
        </div>
      )}
      {props.commodities && Object.keys(props.commodities).length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Commodities</div>
          {Object.entries(props.commodities).map(([name, q]) => <QuoteRow key={name} name={name} q={q} />)}
        </div>
      )}
      {props.crypto && Object.keys(props.crypto).length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Crypto</div>
          {Object.entries(props.crypto).map(([name, q]) => <QuoteRow key={name} name={name} q={q} />)}
        </div>
      )}
      {props.bonds && Object.keys(props.bonds).length > 0 && (
        <div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Bonds</div>
          {Object.entries(props.bonds).map(([name, q]) => <QuoteRow key={name} name={name} q={q} />)}
        </div>
      )}
    </div>
  );
}
export default MarketOverview;
