'use client';

import React, { useState } from 'react';
import { TrendingUp, ArrowUpRight, Hash, ChevronDown, ChevronUp } from 'lucide-react';

interface TrendItem {
  rank?: number;
  title?: string;
  query?: string;
  category?: string;
  volume?: string | number;
  change?: string | number;
  change_percent?: number;
  url?: string;
  description?: string;
  related_queries?: string[];
  is_rising?: boolean;
}

interface SearchTrendsProps {
  trends?: TrendItem[];
  region?: string;
  period?: string;
  source?: string;
  category?: string;
  error?: string;
  success?: boolean;
  [key: string]: any;
}

const categoryColors: Record<string, string> = {
  technology: '#3B82F6',
  tech: '#3B82F6',
  entertainment: '#EC4899',
  sports: '#22C55E',
  politics: '#EF4444',
  business: '#F59E0B',
  finance: '#FEC00F',
  health: '#10B981',
  science: '#8B5CF6',
  world: '#6366F1',
  default: '#9CA3AF',
};

function getCategoryColor(cat?: string) {
  if (!cat) return categoryColors.default;
  return categoryColors[cat.toLowerCase()] || categoryColors.default;
}

export function SearchTrends(props: SearchTrendsProps) {
  const [showAll, setShowAll] = useState(false);
  const trends = props.trends || [];
  const period = props.period || 'Today';
  const region = props.region || '';

  if (props.success === false && props.error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '14px', maxWidth: '520px' }}>
        <strong>Trends Error:</strong> {props.error}
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div style={{
        padding: '24px', borderRadius: '16px',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(255,255,255,0.08)', maxWidth: '520px',
        textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px',
      }}>
        <TrendingUp size={28} color="#7c3aed" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
        No trending data available
      </div>
    );
  }

  const maxVolume = Math.max(...trends.map(t => {
    const v = typeof t.volume === 'number' ? t.volume : parseInt(String(t.volume || '0').replace(/[,+K]/g, ''));
    return isNaN(v) ? 0 : v;
  }), 1);

  const displayed = showAll ? trends : trends.slice(0, 8);

  return (
    <div style={{
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f172a 50%, #1e1b4b 100%)',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      maxWidth: '520px',
      marginTop: '8px',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={16} color="#7c3aed" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Search Trends
            </h3>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              {period}{region && ` \u00B7 ${region}`}
              {props.source && ` \u00B7 ${props.source}`}
            </div>
          </div>
        </div>
        <span style={{
          fontSize: '10px', fontWeight: 700, color: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.15)',
          padding: '4px 8px', borderRadius: '6px',
          letterSpacing: '0.5px',
        }}>
          {trends.length} TRENDING
        </span>
      </div>

      {/* Trend list */}
      <div style={{ padding: '8px 12px' }}>
        {displayed.map((trend, i) => {
          const title = trend.title || trend.query || 'Unknown';
          const volNum = typeof trend.volume === 'number' ? trend.volume : parseInt(String(trend.volume || '0').replace(/[,+K]/g, ''));
          const barWidth = maxVolume > 0 ? Math.max((isNaN(volNum) ? 0 : volNum) / maxVolume * 100, 8) : 8;
          const catColor = getCategoryColor(trend.category);
          const rank = trend.rank ?? i + 1;

          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 8px', borderRadius: '8px',
                transition: 'background-color 0.2s ease',
                cursor: trend.url ? 'pointer' : 'default',
              }}
              onClick={() => trend.url && window.open(trend.url, '_blank')}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* Rank */}
              <span style={{
                fontSize: '12px', fontWeight: 800, color: rank <= 3 ? '#7c3aed' : 'rgba(255,255,255,0.3)',
                fontFamily: 'monospace', minWidth: '20px', textAlign: 'center',
              }}>
                {rank}
              </span>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '13px', fontWeight: 600, color: '#fff',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {title}
                  </span>
                  {trend.is_rising && <ArrowUpRight size={12} color="#22C55E" />}
                  {trend.url && <ArrowUpRight size={10} color="rgba(255,255,255,0.2)" />}
                </div>
                {/* Popularity bar */}
                <div style={{
                  height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${barWidth}%`, borderRadius: '2px',
                    background: `linear-gradient(90deg, ${catColor}80, ${catColor})`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                {trend.description && (
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {trend.description}
                  </div>
                )}
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                {trend.volume && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
                    {trend.volume}
                  </span>
                )}
                {trend.category && (
                  <span style={{
                    fontSize: '9px', fontWeight: 700, color: catColor,
                    backgroundColor: `${catColor}15`,
                    padding: '2px 6px', borderRadius: '4px',
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                  }}>
                    {trend.category}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more/less */}
      {trends.length > 8 && (
        <div style={{ padding: '8px 20px 14px', textAlign: 'center' }}>
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '6px 16px',
              color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          >
            {showAll ? <><ChevronUp size={12} /> Show Less</> : <><ChevronDown size={12} /> Show All {trends.length}</>}
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchTrends;
