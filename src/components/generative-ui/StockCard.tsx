'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, DollarSign, Activity } from 'lucide-react';

interface StockPriceData {
  current_price?: number;
  previous_close?: number;
  open?: number;
  day_high?: number;
  day_low?: number;
  volume?: number;
  market_cap?: number;
  company_name?: string;
}

interface StockHistoryEntry {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockInfoData {
  name?: string;
  sector?: string;
  industry?: string;
  description?: string;
  exchange?: string;
}

interface StockCardProps {
  symbol: string;
  data_type?: string;
  data?: StockPriceData | StockHistoryEntry[] | StockInfoData;
  cached?: boolean;
  fetch_time_ms?: number;
  success?: boolean;
  error?: string;
  period?: string;
}

function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return 'N/A';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatPrice(num: number | undefined): string {
  if (num === undefined || num === null) return 'N/A';
  return `$${num.toFixed(2)}`;
}

function PriceCard({ symbol, data, cached, fetch_time_ms }: { symbol: string; data: StockPriceData; cached?: boolean; fetch_time_ms?: number }) {
  const price = data.current_price;
  const prevClose = data.previous_close;
  const change = price && prevClose ? price - prevClose : undefined;
  const changePercent = change && prevClose ? (change / prevClose) * 100 : undefined;
  const isUp = change !== undefined ? change > 0 : undefined;
  const isDown = change !== undefined ? change < 0 : undefined;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      borderRadius: '16px',
      padding: '24px',
      color: '#fff',
      minWidth: '320px',
      maxWidth: '480px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
            {data.company_name || symbol}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '1px', color: '#FEC00F' }}>
            {symbol}
          </div>
        </div>
        <div style={{
          padding: '6px 12px',
          borderRadius: '20px',
          backgroundColor: isUp ? 'rgba(34, 197, 94, 0.2)' : isDown ? 'rgba(239, 68, 68, 0.2)' : 'rgba(156, 163, 175, 0.2)',
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '13px', fontWeight: 600,
          color: isUp ? '#22c55e' : isDown ? '#ef4444' : '#9ca3af',
        }}>
          {isUp ? <TrendingUp size={14} /> : isDown ? <TrendingDown size={14} /> : <Minus size={14} />}
          {changePercent !== undefined ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%` : 'N/A'}
        </div>
      </div>

      {/* Price */}
      <div style={{ fontSize: '36px', fontWeight: 800, marginBottom: '4px', fontFamily: 'monospace' }}>
        {formatPrice(price)}
      </div>
      {change !== undefined && (
        <div style={{
          fontSize: '14px',
          color: isUp ? '#22c55e' : isDown ? '#ef4444' : '#9ca3af',
          marginBottom: '20px',
        }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)} today
        </div>
      )}

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        padding: '16px 0',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Open</div>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>{formatPrice(data.open)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prev Close</div>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>{formatPrice(data.previous_close)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Day High</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#22c55e' }}>{formatPrice(data.day_high)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Day Low</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#ef4444' }}>{formatPrice(data.day_low)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Volume</div>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>{formatNumber(data.volume)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Market Cap</div>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>{formatNumber(data.market_cap)}</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
        <span>{cached ? '📦 Cached' : '⚡ Live'}</span>
        {fetch_time_ms && <span>{fetch_time_ms}ms</span>}
      </div>
    </div>
  );
}

function HistoryCard({ symbol, data, period }: { symbol: string; data: StockHistoryEntry[]; period?: string }) {
  if (!Array.isArray(data) || data.length === 0) return null;
  
  const prices = data.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;
  const first = prices[0];
  const last = prices[prices.length - 1];
  const isUp = last >= first;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderRadius: '16px', padding: '24px', color: '#fff',
      minWidth: '320px', maxWidth: '520px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#FEC00F' }}>{symbol}</span>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginLeft: '8px' }}>
            {period || '1mo'} History
          </span>
        </div>
        <BarChart3 size={20} color="rgba(255,255,255,0.4)" />
      </div>

      {/* Mini sparkline using divs */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '60px', marginBottom: '16px' }}>
        {data.map((entry, i) => {
          const height = ((entry.close - minPrice) / range) * 50 + 10;
          return (
            <div key={i} style={{
              flex: 1, height: `${height}px`,
              backgroundColor: entry.close >= (data[i - 1]?.close || entry.open) ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)',
              borderRadius: '2px 2px 0 0',
              transition: 'height 0.3s',
            }} title={`${entry.date}: $${entry.close}`} />
          );
        })}
      </div>

      {/* Table */}
      <div style={{ fontSize: '12px', maxHeight: '200px', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '4px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
          <span>Date</span><span>Open</span><span>High</span><span>Low</span><span>Close</span>
        </div>
        {data.slice(-5).map((entry, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '4px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{entry.date.slice(5)}</span>
            <span>${entry.open}</span>
            <span style={{ color: '#22c55e' }}>${entry.high}</span>
            <span style={{ color: '#ef4444' }}>${entry.low}</span>
            <span style={{ fontWeight: 600 }}>${entry.close}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoCard({ symbol, data }: { symbol: string; data: StockInfoData }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderRadius: '16px', padding: '24px', color: '#fff',
      minWidth: '320px', maxWidth: '480px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{ fontSize: '20px', fontWeight: 800, color: '#FEC00F', marginBottom: '4px' }}>{symbol}</div>
      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>{data.name}</div>
      
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {data.sector && <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: 'rgba(254, 192, 15, 0.15)', color: '#FEC00F', fontSize: '12px', fontWeight: 600 }}>{data.sector}</span>}
        {data.industry && <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontSize: '12px', fontWeight: 600 }}>{data.industry}</span>}
        {data.exchange && <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontSize: '12px', fontWeight: 600 }}>{data.exchange}</span>}
      </div>

      {data.description && (
        <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
          {data.description}
        </p>
      )}
    </div>
  );
}

export function StockCard(props: StockCardProps) {
  if (!props.success && props.error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '14px' }}>
        <strong>Stock Error:</strong> {props.error}
      </div>
    );
  }

  if (props.data_type === 'price' && props.data && !Array.isArray(props.data)) {
    return <PriceCard symbol={props.symbol} data={props.data as StockPriceData} cached={props.cached} fetch_time_ms={props.fetch_time_ms} />;
  }

  if (props.data_type === 'history' && Array.isArray(props.data)) {
    return <HistoryCard symbol={props.symbol} data={props.data as StockHistoryEntry[]} period={props.period} />;
  }

  if (props.data_type === 'info' && props.data && !Array.isArray(props.data)) {
    return <InfoCard symbol={props.symbol} data={props.data as StockInfoData} />;
  }

  return (
    <div style={{ padding: '16px', backgroundColor: 'rgba(254, 192, 15, 0.1)', borderRadius: '12px', border: '1px solid rgba(254, 192, 15, 0.3)' }}>
      <DollarSign size={16} style={{ display: 'inline' }} /> Stock data for <strong>{props.symbol}</strong>
      <pre style={{ fontSize: '12px', marginTop: '8px', whiteSpace: 'pre-wrap' }}>{JSON.stringify(props.data, null, 2)}</pre>
    </div>
  );
}

export default StockCard;
