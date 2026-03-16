'use client';
import React from 'react';
import { Shield, Target, AlertTriangle } from 'lucide-react';

interface PositionSizerProps { success?: boolean; error?: string; account_size?: number; risk_percent?: number; entry_price?: number; stop_loss_price?: number; risk_per_share?: number; max_risk_amount?: number; recommended_shares?: number; position_value?: number; position_percent?: number; potential_loss?: number; reward_targets?: { '1R': number; '2R': number; '3R': number }; current_price?: number; symbol?: string; }

export function PositionSizer(props: PositionSizerProps) {
  if (!props.success && props.error) return <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px', color: '#ef4444' }}>Position Size Error: {props.error}</div>;
  const fmt = (n?: number) => n !== undefined ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
  return (
    <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)', borderRadius: '16px', padding: '24px', color: '#fff', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Shield size={20} color="#FEC00F" />
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#FEC00F' }}>Position Sizer</span>
        {props.symbol && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>({props.symbol})</span>}
      </div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '42px', fontWeight: 800, fontFamily: 'monospace', color: '#22c55e' }}>{props.recommended_shares}</div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Recommended Shares</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'Account Size', value: fmt(props.account_size) },
          { label: 'Risk/Trade', value: `${props.risk_percent}%` },
          { label: 'Entry Price', value: fmt(props.entry_price) },
          { label: 'Stop Loss', value: fmt(props.stop_loss_price), color: '#ef4444' },
          { label: 'Position Value', value: fmt(props.position_value) },
          { label: 'Position %', value: `${props.position_percent}%` },
          { label: 'Risk/Share', value: fmt(props.risk_per_share), color: '#f59e0b' },
          { label: 'Max Loss', value: fmt(props.potential_loss), color: '#ef4444' },
        ].map((item, i) => (
          <div key={i} style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: item.color || '#fff', fontFamily: 'monospace' }}>{item.value}</div>
          </div>
        ))}
      </div>
      {props.reward_targets && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><Target size={12} /> Reward Targets</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {Object.entries(props.reward_targets).map(([k, v]) => (
              <div key={k} style={{ flex: 1, padding: '6px', backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#22c55e' }}>{k}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace' }}>${v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default PositionSizer;
