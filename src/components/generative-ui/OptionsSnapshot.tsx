'use client';
import React from 'react';
import { Layers, ArrowUpDown } from 'lucide-react';

interface Option { strike: number; last: number; volume: number; oi: number; iv: number; }
interface OptionsSnapshotProps { success?: boolean; error?: string; symbol?: string; current_price?: number; expirations?: string[]; nearest_expiration?: string; put_call_ratio?: number; total_call_volume?: number; total_put_volume?: number; average_iv?: number; top_calls?: Option[]; top_puts?: Option[]; fetch_time_ms?: number; }

export function OptionsSnapshot(props: OptionsSnapshotProps) {
  if (!props.success && props.error) return <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px', color: '#ef4444' }}>Options Error: {props.error}</div>;
  const pcColor = (props.put_call_ratio || 0) > 1 ? '#ef4444' : (props.put_call_ratio || 0) < 0.7 ? '#22c55e' : '#fbbf24';
  return (
    <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '16px', padding: '20px', color: '#fff', maxWidth: '600px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Layers size={18} color="#FEC00F" />
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#FEC00F' }}>{props.symbol} Options</span>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Exp: {props.nearest_expiration}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Price</div>
          <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}>${props.current_price?.toFixed(2)}</div>
        </div>
        <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>P/C Ratio</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: pcColor, fontFamily: 'monospace' }}>{props.put_call_ratio}</div>
        </div>
        <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Avg IV</div>
          <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}>{props.average_iv}%</div>
        </div>
        <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Expirations</div>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{props.expirations?.length || 0}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600, marginBottom: '6px' }}>📈 Top Calls (Vol: {props.total_call_volume?.toLocaleString()})</div>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead><tr style={{ color: 'rgba(255,255,255,0.4)' }}><th style={{ padding: '4px', textAlign: 'left' }}>Strike</th><th style={{ padding: '4px', textAlign: 'right' }}>Last</th><th style={{ padding: '4px', textAlign: 'right' }}>Vol</th><th style={{ padding: '4px', textAlign: 'right' }}>IV</th></tr></thead>
            <tbody>{(props.top_calls || []).map((o, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>${o.strike}</td>
                <td style={{ padding: '3px 4px', textAlign: 'right', fontFamily: 'monospace' }}>${o.last.toFixed(2)}</td>
                <td style={{ padding: '3px 4px', textAlign: 'right' }}>{o.volume.toLocaleString()}</td>
                <td style={{ padding: '3px 4px', textAlign: 'right', color: '#f59e0b' }}>{o.iv}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginBottom: '6px' }}>📉 Top Puts (Vol: {props.total_put_volume?.toLocaleString()})</div>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead><tr style={{ color: 'rgba(255,255,255,0.4)' }}><th style={{ padding: '4px', textAlign: 'left' }}>Strike</th><th style={{ padding: '4px', textAlign: 'right' }}>Last</th><th style={{ padding: '4px', textAlign: 'right' }}>Vol</th><th style={{ padding: '4px', textAlign: 'right' }}>IV</th></tr></thead>
            <tbody>{(props.top_puts || []).map((o, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>${o.strike}</td>
                <td style={{ padding: '3px 4px', textAlign: 'right', fontFamily: 'monospace' }}>${o.last.toFixed(2)}</td>
                <td style={{ padding: '3px 4px', textAlign: 'right' }}>{o.volume.toLocaleString()}</td>
                <td style={{ padding: '3px 4px', textAlign: 'right', color: '#f59e0b' }}>{o.iv}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default OptionsSnapshot;
