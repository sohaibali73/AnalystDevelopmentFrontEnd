'use client';
import React from 'react';
import { GitBranch } from 'lucide-react';

interface MatrixRow { symbol: string; correlations: Record<string, number>; }
interface Pair { pair: string; correlation: number; }
interface CorrelationMatrixProps { success?: boolean; error?: string; symbols?: string[]; period?: string; matrix?: MatrixRow[]; notable_pairs?: Pair[]; data_points?: number; fetch_time_ms?: number; }

function corrColor(v: number): string {
  if (v >= 0.7) return '#22c55e';
  if (v >= 0.3) return '#86efac';
  if (v >= -0.3) return 'rgba(255,255,255,0.5)';
  if (v >= -0.7) return '#fca5a5';
  return '#ef4444';
}

export function CorrelationMatrix(props: CorrelationMatrixProps) {
  if (!props.success && props.error) return <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px', color: '#ef4444' }}>Correlation Error: {props.error}</div>;
  const matrix = props.matrix || [];
  const syms = props.symbols || matrix.map(m => m.symbol);
  return (
    <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '16px', padding: '20px', color: '#fff', maxWidth: '600px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <GitBranch size={18} color="#FEC00F" />
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#FEC00F' }}>Correlation Matrix</span>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>({props.period || '6mo'})</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead><tr><th style={{ padding: '6px' }}></th>{syms.map(s => <th key={s} style={{ padding: '6px', color: '#FEC00F', fontWeight: 700 }}>{s}</th>)}</tr></thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td style={{ padding: '6px', fontWeight: 700, color: '#FEC00F' }}>{row.symbol}</td>
                {syms.map(s => {
                  const v = row.correlations[s] ?? 0;
                  return <td key={s} style={{ padding: '6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, color: corrColor(v), backgroundColor: `rgba(255,255,255,${Math.abs(v) * 0.05})`, borderRadius: '4px' }}>{v === 1 ? '1.00' : v.toFixed(2)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {props.notable_pairs && props.notable_pairs.length > 0 && (
        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Notable Pairs</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {props.notable_pairs.map((p, i) => (
              <span key={i} style={{ padding: '3px 8px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '11px' }}>
                {p.pair}: <span style={{ color: corrColor(p.correlation), fontWeight: 600 }}>{p.correlation}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default CorrelationMatrix;
