'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Clock, ArrowUpRight, ArrowDownRight, Maximize2 } from 'lucide-react';

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface LiveStockChartProps {
  symbol: string;
  company_name?: string;
  data: CandleData[];
  period?: string;
  interval?: string;
  chart_type?: 'candlestick' | 'line' | 'area';
  current_price?: number;
  change?: number;
  change_percent?: number;
}

export function LiveStockChart({
  symbol,
  company_name,
  data = [],
  period = '1M',
  interval = '1D',
  chart_type = 'candlestick',
  current_price,
  change,
  change_percent,
}: LiveStockChartProps) {
  const [activeTab, setActiveTab] = useState(chart_type);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { minPrice, maxPrice, maxVolume, priceRange, isUp } = useMemo(() => {
    if (!data.length) return { minPrice: 0, maxPrice: 0, maxVolume: 0, priceRange: 1, isUp: true };
    const prices = data.flatMap(d => [d.high, d.low]);
    const volumes = data.map(d => d.volume || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return {
      minPrice: min,
      maxPrice: max,
      maxVolume: Math.max(...volumes),
      priceRange: max - min || 1,
      isUp: data[data.length - 1].close >= data[0].open,
    };
  }, [data]);

  const chartColor = isUp ? '#22C55E' : '#EF4444';
  const chartColorFaded = isUp ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
  const displayChange = change ?? (data.length >= 2 ? data[data.length - 1].close - data[0].open : 0);
  const displayPercent = change_percent ?? (data.length >= 2 ? ((data[data.length - 1].close - data[0].open) / data[0].open) * 100 : 0);
  const displayPrice = current_price ?? (data.length ? data[data.length - 1].close : 0);

  const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null;

  const chartHeight = 180;
  const volumeHeight = 40;

  const getY = (price: number) => {
    return chartHeight - ((price - minPrice) / priceRange) * (chartHeight - 10) - 5;
  };

  if (!data.length) {
    return (
      <div style={{ padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
        <BarChart3 size={32} color="rgba(255,255,255,0.3)" style={{ marginBottom: '8px' }} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>No chart data available for {symbol}</p>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#fff',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      maxWidth: '640px',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>
              {company_name || symbol}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'monospace' }}>
                ${displayPrice.toFixed(2)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 600, color: chartColor }}>
                {displayChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)} ({displayPercent >= 0 ? '+' : ''}{displayPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['candlestick', 'line', 'area'] as const).map(type => (
              <button key={type} onClick={() => setActiveTab(type)} style={{
                padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                borderRadius: '6px', border: 'none', cursor: 'pointer',
                backgroundColor: activeTab === type ? 'rgba(254,192,15,0.2)' : 'transparent',
                color: activeTab === type ? '#FEC00F' : 'rgba(255,255,255,0.4)',
                textTransform: 'capitalize',
              }}>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Hover tooltip */}
        {hoveredData && (
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '8px', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span><Clock size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />{hoveredData.date}</span>
            <span>O: <b style={{ color: '#fff' }}>${hoveredData.open.toFixed(2)}</b></span>
            <span>H: <b style={{ color: '#22C55E' }}>${hoveredData.high.toFixed(2)}</b></span>
            <span>L: <b style={{ color: '#EF4444' }}>${hoveredData.low.toFixed(2)}</b></span>
            <span>C: <b style={{ color: '#fff' }}>${hoveredData.close.toFixed(2)}</b></span>
            {hoveredData.volume && <span>Vol: <b style={{ color: '#FEC00F' }}>{(hoveredData.volume / 1e6).toFixed(1)}M</b></span>}
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div style={{ padding: '0 8px', position: 'relative' }}>
        <svg
          width="100%"
          height={chartHeight + volumeHeight + 10}
          viewBox={`0 0 ${data.length * 12 + 20} ${chartHeight + volumeHeight + 10}`}
          preserveAspectRatio="none"
          style={{ display: 'block' }}
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(pct => (
            <line key={pct} x1="0" x2={data.length * 12 + 20} y1={getY(minPrice + priceRange * pct)} y2={getY(minPrice + priceRange * pct)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}

          {activeTab === 'area' && (
            <>
              <defs>
                <linearGradient id={`area-grad-${symbol}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`M ${data.map((d, i) => `${i * 12 + 10},${getY(d.close)}`).join(' L ')} L ${(data.length - 1) * 12 + 10},${chartHeight} L 10,${chartHeight} Z`}
                fill={`url(#area-grad-${symbol})`}
              />
            </>
          )}

          {activeTab === 'line' || activeTab === 'area' ? (
            <polyline
              points={data.map((d, i) => `${i * 12 + 10},${getY(d.close)}`).join(' ')}
              fill="none"
              stroke={chartColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          ) : (
            /* Candlesticks */
            data.map((d, i) => {
              const x = i * 12 + 10;
              const bullish = d.close >= d.open;
              const color = bullish ? '#22C55E' : '#EF4444';
              const bodyTop = getY(Math.max(d.open, d.close));
              const bodyBottom = getY(Math.min(d.open, d.close));
              const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
              return (
                <g key={i}>
                  {/* Wick */}
                  <line x1={x} x2={x} y1={getY(d.high)} y2={getY(d.low)} stroke={color} strokeWidth="1" />
                  {/* Body */}
                  <rect x={x - 3} y={bodyTop} width="6" height={bodyHeight} fill={bullish ? color : color} rx="1" />
                </g>
              );
            })
          )}

          {/* Volume bars */}
          {data.map((d, i) => {
            const x = i * 12 + 10;
            const volH = maxVolume > 0 ? ((d.volume || 0) / maxVolume) * volumeHeight : 0;
            const bullish = d.close >= d.open;
            return (
              <rect key={`vol-${i}`} x={x - 3} y={chartHeight + 10 + (volumeHeight - volH)} width="6" height={volH} fill={bullish ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'} rx="1" />
            );
          })}

          {/* Hover overlay zones */}
          {data.map((_, i) => (
            <rect
              key={`hover-${i}`}
              x={i * 12 + 4}
              y={0}
              width={12}
              height={chartHeight + volumeHeight + 10}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'crosshair' }}
            />
          ))}

          {/* Hover crosshair */}
          {hoveredIndex !== null && (
            <line
              x1={hoveredIndex * 12 + 10}
              x2={hoveredIndex * 12 + 10}
              y1={0}
              y2={chartHeight + volumeHeight + 10}
              stroke="rgba(254,192,15,0.4)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          )}
        </svg>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
        <span>{period} · {interval}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E', display: 'inline-block' }} />
          Live
        </span>
      </div>
    </div>
  );
}

export default LiveStockChart;
