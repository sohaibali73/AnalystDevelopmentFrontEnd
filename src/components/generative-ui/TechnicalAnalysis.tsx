'use client';

import React, { useState } from 'react';
import { Activity, TrendingUp, TrendingDown, BarChart3, Gauge, ArrowUp, ArrowDown, Minus, ChevronDown, ChevronRight } from 'lucide-react';

interface IndicatorValue {
  name: string;
  value: number | string;
  signal?: 'buy' | 'sell' | 'neutral';
  description?: string;
}

interface TechnicalAnalysisProps {
  symbol: string;
  timeframe?: string;
  overall_signal?: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  summary?: string;
  indicators?: {
    trend?: IndicatorValue[];
    momentum?: IndicatorValue[];
    volatility?: IndicatorValue[];
    volume?: IndicatorValue[];
  };
  support_levels?: number[];
  resistance_levels?: number[];
  current_price?: number;
  moving_averages?: Array<{ period: string; value: number; signal: 'buy' | 'sell' | 'neutral' }>;
}

const signalColors: Record<string, { bg: string; text: string; border: string }> = {
  strong_buy: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E', border: 'rgba(34,197,94,0.3)' },
  buy: { bg: 'rgba(34,197,94,0.1)', text: '#4ADE80', border: 'rgba(34,197,94,0.2)' },
  neutral: { bg: 'rgba(156,163,175,0.1)', text: '#9CA3AF', border: 'rgba(156,163,175,0.2)' },
  sell: { bg: 'rgba(239,68,68,0.1)', text: '#F87171', border: 'rgba(239,68,68,0.2)' },
  strong_sell: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', border: 'rgba(239,68,68,0.3)' },
};

const signalIcon = (signal?: string) => {
  if (signal === 'buy' || signal === 'strong_buy') return <ArrowUp size={12} color="#22C55E" />;
  if (signal === 'sell' || signal === 'strong_sell') return <ArrowDown size={12} color="#EF4444" />;
  return <Minus size={12} color="#9CA3AF" />;
};

function GaugeMeter({ signal }: { signal: string }) {
  const positions: Record<string, number> = { strong_sell: 10, sell: 30, neutral: 50, buy: 70, strong_buy: 90 };
  const pos = positions[signal] || 50;
  const color = signalColors[signal]?.text || '#9CA3AF';

  return (
    <div style={{ position: 'relative', width: '100%', height: '8px', borderRadius: '4px', background: 'linear-gradient(90deg, #EF4444 0%, #F59E0B 25%, #9CA3AF 50%, #4ADE80 75%, #22C55E 100%)', marginTop: '8px' }}>
      <div style={{
        position: 'absolute',
        left: `${pos}%`,
        top: '-4px',
        transform: 'translateX(-50%)',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: color,
        border: '2px solid #1a1a2e',
        boxShadow: `0 0 8px ${color}`,
      }} />
    </div>
  );
}

export function TechnicalAnalysis({
  symbol,
  timeframe = 'Daily',
  overall_signal = 'neutral',
  summary,
  indicators,
  support_levels = [],
  resistance_levels = [],
  current_price,
  moving_averages = [],
}: TechnicalAnalysisProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('trend');
  const sigStyle = signalColors[overall_signal] || signalColors.neutral;

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const renderIndicatorGroup = (title: string, items: IndicatorValue[] | undefined, icon: React.ReactNode, key: string) => {
    if (!items || items.length === 0) return null;
    const isOpen = expandedSection === key;
    return (
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => toggleSection(key)} style={{
          width: '100%', padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon}
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{title}</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>({items.length})</span>
          </div>
          {isOpen ? <ChevronDown size={14} color="rgba(255,255,255,0.4)" /> : <ChevronRight size={14} color="rgba(255,255,255,0.4)" />}
        </button>
        {isOpen && (
          <div style={{ padding: '0 20px 16px' }}>
            {items.map((ind, i) => {
              const sig = ind.signal || 'neutral';
              const s = signalColors[sig] || signalColors.neutral;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', marginBottom: '4px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {signalIcon(sig)}
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{ind.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>{typeof ind.value === 'number' ? ind.value.toFixed(2) : ind.value}</span>
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}`, textTransform: 'uppercase' }}>{sig}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#fff',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      maxWidth: '560px',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Activity size={18} color="#FEC00F" />
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#FEC00F' }}>{symbol}</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)' }}>{timeframe}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Technical Analysis</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px', backgroundColor: sigStyle.bg, color: sigStyle.text, border: `1px solid ${sigStyle.border}`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {overall_signal.replace('_', ' ')}
            </div>
          </div>
        </div>

        <GaugeMeter signal={overall_signal} />

        {summary && (
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginTop: '16px', marginBottom: 0 }}>{summary}</p>
        )}
      </div>

      {/* Support/Resistance */}
      {(support_levels.length > 0 || resistance_levels.length > 0) && (
        <div style={{ padding: '0 24px 16px', display: 'flex', gap: '12px' }}>
          {resistance_levels.length > 0 && (
            <div style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', marginBottom: '6px' }}>Resistance</div>
              {resistance_levels.map((r, i) => (
                <div key={i} style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: '#F87171' }}>${r.toFixed(2)}</div>
              ))}
            </div>
          )}
          {current_price && (
            <div style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(254,192,15,0.08)', border: '1px solid rgba(254,192,15,0.15)', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#FEC00F', textTransform: 'uppercase', marginBottom: '6px' }}>Price</div>
              <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', color: '#FEC00F' }}>${current_price.toFixed(2)}</div>
            </div>
          )}
          {support_levels.length > 0 && (
            <div style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', marginBottom: '6px' }}>Support</div>
              {support_levels.map((s, i) => (
                <div key={i} style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: '#4ADE80' }}>${s.toFixed(2)}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Moving Averages */}
      {moving_averages.length > 0 && (
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {moving_averages.map((ma, i) => {
              const s = signalColors[ma.signal] || signalColors.neutral;
              return (
                <div key={i} style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: s.bg, border: `1px solid ${s.border}`, fontSize: '11px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{ma.period}: </span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: s.text }}>${ma.value.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Indicator Groups */}
      {renderIndicatorGroup('Trend', indicators?.trend, <TrendingUp size={14} color="#60A5FA" />, 'trend')}
      {renderIndicatorGroup('Momentum', indicators?.momentum, <Gauge size={14} color="#A78BFA" />, 'momentum')}
      {renderIndicatorGroup('Volatility', indicators?.volatility, <Activity size={14} color="#FB923C" />, 'volatility')}
      {renderIndicatorGroup('Volume', indicators?.volume, <BarChart3 size={14} color="#22C55E" />, 'volume')}
    </div>
  );
}

export default TechnicalAnalysis;
