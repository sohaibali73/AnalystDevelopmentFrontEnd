'use client';

import React, { useState } from 'react';
import { Trophy, Clock, ChevronDown, ChevronUp, Radio } from 'lucide-react';

interface Game {
  sport?: string;
  league?: string;
  status?: string; // 'live' | 'final' | 'scheduled' | 'halftime'
  home_team?: string;
  away_team?: string;
  home_abbreviation?: string;
  away_abbreviation?: string;
  home_score?: number;
  away_score?: number;
  home_logo?: string;
  away_logo?: string;
  period?: string;
  clock?: string;
  venue?: string;
  broadcast?: string;
  start_time?: string;
  highlights?: string[];
}

interface LiveSportsScoresProps {
  games?: Game[];
  sport?: string;
  league?: string;
  date?: string;
  error?: string;
  success?: boolean;
  [key: string]: any;
}

const sportColors: Record<string, string> = {
  nba: '#F97316',
  nfl: '#22C55E',
  mlb: '#EF4444',
  nhl: '#3B82F6',
  soccer: '#8B5CF6',
  mls: '#8B5CF6',
  premier_league: '#8B5CF6',
  default: '#FEC00F',
};

function getStatusColor(status?: string) {
  switch (status?.toLowerCase()) {
    case 'live': case 'in_progress': case 'in progress': return '#22C55E';
    case 'final': case 'finished': return '#9CA3AF';
    case 'halftime': case 'half': return '#F59E0B';
    case 'scheduled': case 'upcoming': return '#3B82F6';
    default: return '#9CA3AF';
  }
}

function getStatusLabel(status?: string) {
  switch (status?.toLowerCase()) {
    case 'live': case 'in_progress': case 'in progress': return 'LIVE';
    case 'final': case 'finished': return 'FINAL';
    case 'halftime': case 'half': return 'HALF';
    case 'scheduled': case 'upcoming': return 'UPCOMING';
    default: return status?.toUpperCase() || 'SCHEDULED';
  }
}

function TeamInitials({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '10px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.7)',
      letterSpacing: '0.5px', fontFamily: 'monospace',
    }}>
      {initials}
    </div>
  );
}

function GameCard({ game, accent }: { game: Game; accent: string }) {
  const isLive = ['live', 'in_progress', 'in progress'].includes(game.status?.toLowerCase() || '');
  const isFinal = ['final', 'finished'].includes(game.status?.toLowerCase() || '');
  const homeWin = isFinal && (game.home_score ?? 0) > (game.away_score ?? 0);
  const awayWin = isFinal && (game.away_score ?? 0) > (game.home_score ?? 0);
  const statusColor = getStatusColor(game.status);

  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderRadius: '12px',
      border: isLive ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Live pulse */}
      {isLive && (
        <div style={{
          position: 'absolute', top: '0', left: '0', right: '0', height: '2px',
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          animation: 'shimmer 2s ease-in-out infinite',
        }} />
      )}

      {/* Status row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isLive && <Radio size={10} color={statusColor} style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />}
          <span style={{
            fontSize: '10px', fontWeight: 800, color: statusColor, letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            {getStatusLabel(game.status)}
          </span>
          {game.period && (
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              {game.period}
            </span>
          )}
        </div>
        {game.clock && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={10} color="rgba(255,255,255,0.4)" />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontWeight: 700 }}>
              {game.clock}
            </span>
          </div>
        )}
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Away team */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TeamInitials name={game.away_team || 'TBD'} />
            <div>
              <div style={{
                fontSize: '14px', fontWeight: awayWin ? 800 : 600,
                color: awayWin ? '#fff' : 'rgba(255,255,255,0.8)',
              }}>
                {game.away_team || 'TBD'}
              </div>
              {game.away_abbreviation && (
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                  {game.away_abbreviation}
                </div>
              )}
            </div>
          </div>
          <span style={{
            fontSize: '22px', fontWeight: 800, fontFamily: 'monospace',
            color: awayWin ? '#fff' : 'rgba(255,255,255,0.6)',
            minWidth: '36px', textAlign: 'right',
          }}>
            {game.away_score ?? '-'}
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', margin: '0 4px' }} />

        {/* Home team */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TeamInitials name={game.home_team || 'TBD'} />
            <div>
              <div style={{
                fontSize: '14px', fontWeight: homeWin ? 800 : 600,
                color: homeWin ? '#fff' : 'rgba(255,255,255,0.8)',
              }}>
                {game.home_team || 'TBD'}
              </div>
              {game.home_abbreviation && (
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                  {game.home_abbreviation}
                </div>
              )}
            </div>
          </div>
          <span style={{
            fontSize: '22px', fontWeight: 800, fontFamily: 'monospace',
            color: homeWin ? '#fff' : 'rgba(255,255,255,0.6)',
            minWidth: '36px', textAlign: 'right',
          }}>
            {game.home_score ?? '-'}
          </span>
        </div>
      </div>

      {/* Footer info */}
      {(game.venue || game.broadcast) && (
        <div style={{
          marginTop: '10px', paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', justifyContent: 'space-between',
          fontSize: '10px', color: 'rgba(255,255,255,0.3)',
        }}>
          {game.venue && <span>{game.venue}</span>}
          {game.broadcast && <span>{game.broadcast}</span>}
        </div>
      )}
    </div>
  );
}

export function LiveSportsScores(props: LiveSportsScoresProps) {
  const [expanded, setExpanded] = useState(true);
  const games = props.games || [];
  const league = props.league || props.sport || 'Sports';
  const accent = sportColors[league.toLowerCase()] || sportColors.default;

  if (props.success === false && props.error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '14px', maxWidth: '520px' }}>
        <strong>Sports Error:</strong> {props.error}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div style={{
        padding: '24px', borderRadius: '16px',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(255,255,255,0.08)', maxWidth: '520px',
        textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px',
      }}>
        <Trophy size={28} color={accent} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
        No games found for {league}
      </div>
    );
  }

  const liveCount = games.filter(g => ['live', 'in_progress', 'in progress'].includes(g.status?.toLowerCase() || '')).length;

  return (
    <div style={{
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      maxWidth: '520px',
      marginTop: '8px',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trophy size={16} color={accent} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>
              {league.toUpperCase()} Scores
            </h3>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              {games.length} game{games.length !== 1 ? 's' : ''}
              {liveCount > 0 && <span style={{ color: '#22C55E', fontWeight: 700 }}> &middot; {liveCount} live</span>}
              {props.date && <span> &middot; {props.date}</span>}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />}
      </div>

      {/* Games list */}
      {expanded && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {games.map((game, i) => (
            <GameCard key={i} game={game} accent={accent} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

export default LiveSportsScores;
