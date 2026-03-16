'use client';
import React from 'react';
import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';

interface Sector { name: string; etf: string; change_percent: number; current_price: number; }
interface SectorPerformanceProps { success?: boolean; error?: string; period?: string; sectors?: Sector[]; best?: Sector; worst?: Sector; fetch_time_ms?: number; }

export function SectorPerformance(props: SectorPerformanceProps) {
  if (!props.success && props.error) return <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px', color: '#ef4444' }}>Sector Error: {props.error}</div>;
  const sectors = props.sectors || [];
  const maxAbs = Math.max(...sectors.map(s => Math.abs(s.change_percent)), 1);
  return (
    <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '16px', padding: '20px', color: '#fff', maxWidth: '500px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <PieChart size={18} color="#FEC00F" />
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#FEC00F' }}>Sector Performance</span>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>({props.period || '1mo'})</span>
      </div>
      {sectors.map((s, i) => {
        const isUp = s.change_percent >= 0;
        const barWidth = Math.abs(s.change_percent) / maxAbs * 100;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ width: '110px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>{s.name}</span>
            <div style={{ flex: 1, height: '20px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: `${barWidth}%`, height: '100%', backgroundColor: isUp ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)', borderRadius: '4px', transition: 'width 0.5s' }} />
            </div>
            <span style={{ width: '55px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: isUp ? '#22c55e' : '#ef4444', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
              {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {isUp ? '+' : ''}{s.change_percent}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
export default SectorPerformance;
