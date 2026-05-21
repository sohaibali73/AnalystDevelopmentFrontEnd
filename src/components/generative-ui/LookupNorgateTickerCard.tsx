'use client';

/**
 * LookupNorgateTickerCard
 * -----------------------
 * Generative-UI card for the `lookup_norgate_ticker` tool.
 *
 * Consumes the canonical GenUI envelope:
 *
 *   { type: "data-card_norgate_lookup", data: { ... } }
 *
 * Visual language matches the AFL card family: Potomac yellow accent (#FEC00F),
 * dark #0a0a0a chrome, lucide-react icons only. No emoji.
 *
 * Norgate prefix conventions surfaced in the UI:
 *   $  index
 *   #  index / cash commodity
 *   &  continuous future
 *   @  cash / spot
 *   %  economic series
 *   (none) equity / ETF / forex pair
 */

import React, { useMemo, useState } from 'react';
import {
  Search,
  Database,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Target,
  ArrowRight,
  Building2,
  CandlestickChart,
  Coins,
  Activity,
  Globe2,
  LineChart,
  TrendingUp,
  Hash,
  Info,
  AlertTriangle,
  CircleDot,
  Sparkles,
} from 'lucide-react';

// ─── Palette (aligned with AFL card family) ─────────────────────────────────
const YELLOW = '#FEC00F';
const GREEN = '#22c55e';
const AMBER = '#d29922';
const RED = '#ef4444';
const BLUE = '#3b82f6';
const INDIGO = '#818cf8';
const VIOLET = '#a78bfa';
const TEAL = '#2dd4bf';
const ROSE = '#fb7185';
const SLATE = 'rgba(255,255,255,0.55)';
const SUBTLE = 'rgba(255,255,255,0.78)';
const PANEL = '#0d1117';

// ─── Types ───────────────────────────────────────────────────────────────────
type MatchType = 'exact' | 'prefix' | 'name_token' | 'fuzzy' | string;

interface NorgateResult {
  symbol: string;
  name?: string;
  database?: string;
  match_type?: MatchType;
  currency?: string;
  exchange?: string;
  first_quoted_date?: string;
  last_quoted_date?: string;
  delisted?: boolean;
  score?: number;
}

export interface NorgateLookupData {
  query?: string;
  database?: string;
  total?: number;
  truncated?: boolean;
  limit?: number;
  results?: NorgateResult[];
  suggestions?: string[];
  summary?: string;
}

// ─── Prefix conventions (single source of truth) ────────────────────────────
interface PrefixSpec {
  prefix: string;
  label: string;
  short: string;
  color: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

const PREFIX_SPECS: PrefixSpec[] = [
  { prefix: '$', label: 'Index',                short: 'Index',           color: BLUE,   icon: LineChart       },
  { prefix: '#', label: 'Index / Cash Cmdty',   short: 'Cash Cmdty',      color: AMBER,  icon: Coins           },
  { prefix: '&', label: 'Continuous Future',    short: 'Cont. Future',    color: VIOLET, icon: CandlestickChart},
  { prefix: '@', label: 'Cash / Spot',          short: 'Cash',            color: TEAL,   icon: Activity        },
  { prefix: '%', label: 'Economic Series',      short: 'Economic',        color: ROSE,   icon: TrendingUp      },
  { prefix: '',  label: 'Equity / ETF / FX',    short: 'Equity / FX',     color: YELLOW, icon: Building2       },
];

function specForSymbol(symbol: string): PrefixSpec {
  if (!symbol) return PREFIX_SPECS[5];
  const ch = symbol.charAt(0);
  const found = PREFIX_SPECS.find((p) => p.prefix === ch);
  return found || PREFIX_SPECS[5];
}

function specForDatabase(db?: string): PrefixSpec {
  const d = String(db || '').toLowerCase();
  if (d.includes('continuous future')) return PREFIX_SPECS[2];
  if (d.includes('cash commodit'))     return PREFIX_SPECS[1];
  if (d.includes('us indices') || d.includes('world indices') || d.includes('indices')) return PREFIX_SPECS[0];
  if (d.includes('forex'))             return PREFIX_SPECS[3];
  if (d.includes('economic'))          return PREFIX_SPECS[4];
  return PREFIX_SPECS[5];
}

// ─── Helpers ────────────────────────────────────────────────────────────────
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function matchTypeMeta(mt?: MatchType): { label: string; color: string; icon: React.ReactNode } {
  const m = String(mt || '').toLowerCase();
  if (m === 'exact')       return { label: 'Exact',     color: GREEN,  icon: <Target size={10} /> };
  if (m === 'prefix')      return { label: 'Prefix',    color: YELLOW, icon: <ArrowRight size={10} /> };
  if (m === 'name_token' || m === 'name') return { label: 'Name',      color: INDIGO, icon: <Sparkles size={10} /> };
  if (m === 'fuzzy')       return { label: 'Fuzzy',     color: SLATE,  icon: <CircleDot size={10} /> };
  return { label: 'Match', color: SLATE, icon: <CircleDot size={10} /> };
}

// ─── Small subcomponents ────────────────────────────────────────────────────
function CopyChip({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        const ok = await copyToClipboard(text);
        if (ok) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        background: copied ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${copied ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.08)'}`,
        color: copied ? GREEN : 'rgba(255,255,255,0.78)',
        cursor: 'pointer',
        transition: 'all 120ms ease',
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

function MetaPill({
  color = SLATE,
  bg,
  children,
  title,
}: {
  color?: string;
  bg?: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '10.5px',
        padding: '2px 7px',
        borderRadius: '5px',
        backgroundColor: bg || `${color}1F`,
        color,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
      }}
    >
      {children}
    </span>
  );
}

function PrefixLegend({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '11.5px',
          fontWeight: 600,
          textAlign: 'left',
        }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Info size={12} color={SLATE} />
        Norgate prefix conventions
      </button>
      {open && (
        <div
          style={{
            padding: '0 16px 12px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '6px',
          }}
        >
          {PREFIX_SPECS.map((spec) => {
            const Icon = spec.icon;
            return (
              <div
                key={spec.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '7px',
                  background: `${spec.color}0E`,
                  border: `1px solid ${spec.color}28`,
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '5px',
                    backgroundColor: `${spec.color}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px',
                    fontWeight: 700,
                    color: spec.color,
                  }}
                >
                  {spec.prefix || (
                    <Icon size={11} color={spec.color} />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: 600, lineHeight: 1.2 }}>
                    {spec.label}
                  </div>
                  <div style={{ fontSize: '10px', color: SLATE, lineHeight: 1.2, marginTop: '1px' }}>
                    {spec.prefix ? `prefix “${spec.prefix}”` : 'no prefix'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Result row ─────────────────────────────────────────────────────────────
function ResultRow({ r, queryRaw }: { r: NorgateResult; queryRaw: string }) {
  const spec = specForSymbol(r.symbol);
  const Icon = spec.icon;
  const mm = matchTypeMeta(r.match_type);

  const prefixChar = r.symbol && PREFIX_SPECS.some((p) => p.prefix && p.prefix === r.symbol.charAt(0)) ? r.symbol.charAt(0) : '';
  const symbolBody = prefixChar ? r.symbol.slice(1) : r.symbol;

  // Highlight query inside name
  const nameNode = useMemo(() => {
    const name = r.name || '';
    const q = (queryRaw || '').trim();
    if (!q || !name) return name;
    try {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = name.split(new RegExp(`(${escaped})`, 'ig'));
      return parts.map((p, i) =>
        p.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={i}
            style={{
              backgroundColor: 'rgba(254, 192, 15, 0.22)',
              color: YELLOW,
              padding: '0 2px',
              borderRadius: '3px',
            }}
          >
            {p}
          </mark>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      );
    } catch {
      return name;
    }
  }, [r.name, queryRaw]);

  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr auto',
        gap: '12px',
        alignItems: 'center',
        padding: '10px 12px',
        borderRadius: '9px',
        background: hover ? `${spec.color}0A` : 'rgba(255,255,255,0.025)',
        border: `1px solid ${hover ? `${spec.color}33` : 'rgba(255,255,255,0.06)'}`,
        borderLeft: `3px solid ${spec.color}`,
        transition: 'all 140ms ease',
        cursor: 'default',
      }}
    >
      {/* Prefix glyph tile */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: `linear-gradient(135deg, ${spec.color}22 0%, ${spec.color}08 100%)`,
          border: `1px solid ${spec.color}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {prefixChar ? (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '20px',
              fontWeight: 700,
              color: spec.color,
              lineHeight: 1,
            }}
          >
            {prefixChar}
          </span>
        ) : (
          <Icon size={16} color={spec.color} />
        )}
      </div>

      {/* Symbol + name + meta */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14.5px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: 'rgba(255,255,255,0.96)',
              lineHeight: 1.2,
            }}
          >
            {prefixChar && (
              <span style={{ color: spec.color }}>{prefixChar}</span>
            )}
            {symbolBody}
          </span>
          {r.delisted && (
            <MetaPill color={RED} title="Symbol is delisted">
              <AlertTriangle size={10} /> Delisted
            </MetaPill>
          )}
          {r.exchange && (
            <span style={{ fontSize: '10.5px', color: SLATE, letterSpacing: '0.03em' }}>
              {r.exchange}
            </span>
          )}
        </div>
        {r.name && (
          <div
            style={{
              fontSize: '12.5px',
              color: SUBTLE,
              marginTop: '2px',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={r.name}
          >
            {nameNode}
          </div>
        )}
        <div style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
          <MetaPill color={mm.color} title={`Matched as: ${mm.label}`}>
            {mm.icon} {mm.label}
          </MetaPill>
          {r.database && (
            <MetaPill color={spec.color} title="Norgate database">
              <Database size={10} /> {r.database}
            </MetaPill>
          )}
          {r.currency && (
            <MetaPill color={SLATE} title="Quote currency">
              {r.currency}
            </MetaPill>
          )}
          {typeof r.score === 'number' && (
            <MetaPill color={SLATE} title="Internal match score">
              <Hash size={9} /> {r.score.toFixed(0)}
            </MetaPill>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
        <CopyChip text={r.symbol} label="Copy" />
        <CopyChip
          text={`Foreign("${r.symbol}", "C")`}
          label="Foreign()"
        />
      </div>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────
function EmptyState({ query, suggestions }: { query?: string; suggestions?: string[] }) {
  return (
    <div
      style={{
        padding: '24px 16px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${AMBER}22 0%, ${AMBER}08 100%)`,
          border: `1px solid ${AMBER}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Search size={18} color={AMBER} />
      </div>
      <div style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.92)', fontWeight: 700 }}>
        No Norgate tickers matched
      </div>
      <div style={{ fontSize: '12px', color: SLATE, lineHeight: 1.55, maxWidth: '440px' }}>
        Nothing in the live universe matches{' '}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: YELLOW,
            background: 'rgba(254, 192, 15, 0.08)',
            border: '1px solid rgba(254, 192, 15, 0.25)',
            padding: '1px 6px',
            borderRadius: '5px',
          }}
        >
          {query || '(empty query)'}
        </span>
        . Refine the query or pick a different database scope — never invent a ticker.
      </div>
      {suggestions && suggestions.length > 0 && (
        <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {suggestions.map((s) => (
            <MetaPill key={s} color={YELLOW}>
              <Sparkles size={10} /> {s}
            </MetaPill>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main card
// ═══════════════════════════════════════════════════════════════════════════
export interface LookupNorgateTickerCardProps {
  data?: NorgateLookupData;
}

export function LookupNorgateTickerCard({ data }: LookupNorgateTickerCardProps) {
  const d = data || {};
  const results = Array.isArray(d.results) ? d.results : [];
  const total = typeof d.total === 'number' ? d.total : results.length;
  const truncated = !!d.truncated;
  const limit = d.limit;
  const query = d.query || '';
  const scope = d.database;

  const [legendOpen, setLegendOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>('all');

  // Match-type tallies
  const tallies = useMemo(() => {
    let exact = 0;
    let prefix = 0;
    let name = 0;
    let other = 0;
    results.forEach((r) => {
      const m = String(r.match_type || '').toLowerCase();
      if (m === 'exact') exact += 1;
      else if (m === 'prefix') prefix += 1;
      else if (m === 'name_token' || m === 'name') name += 1;
      else other += 1;
    });
    return { exact, prefix, name, other };
  }, [results]);

  // Group results by database
  const groups = useMemo(() => {
    const byDb: Record<string, NorgateResult[]> = {};
    results.forEach((r) => {
      const k = r.database || 'Other';
      if (!byDb[k]) byDb[k] = [];
      byDb[k].push(r);
    });
    // Stable order: known databases first in a sensible order, then alphabetical
    const order = [
      'US Equities',
      'US Equities Delisted',
      'US Indices',
      'World Indices',
      'Continuous Futures',
      'Futures',
      'Cash Commodities',
      'Forex Spot',
      'Economic',
    ];
    const known = order.filter((k) => byDb[k]);
    const rest = Object.keys(byDb).filter((k) => !order.includes(k)).sort();
    const ordered = [...known, ...rest];
    return ordered.map((k) => ({ name: k, items: byDb[k] }));
  }, [results]);

  const visibleResults = useMemo(() => {
    if (activeGroup === 'all') return groups;
    return groups.filter((g) => g.name === activeGroup);
  }, [groups, activeGroup]);

  return (
    <div
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1px solid ${YELLOW}55`,
        maxWidth: '760px',
        marginTop: '8px',
        backgroundColor: '#0a0a0a',
        boxShadow: '0 2px 22px rgba(0,0,0,0.35)',
      }}
    >
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '14px 16px',
          background: `linear-gradient(135deg, ${YELLOW}22 0%, ${YELLOW}06 100%)`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            background: `linear-gradient(135deg, ${YELLOW}33 0%, ${YELLOW}12 100%)`,
            border: `1px solid ${YELLOW}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Search size={17} color={YELLOW} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: '14px',
              color: 'rgba(255,255,255,0.96)',
              lineHeight: 1.25,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            Norgate Universe Lookup
            {scope && (
              <MetaPill color={YELLOW} title="Database scope filter">
                <Database size={10} /> {scope}
              </MetaPill>
            )}
          </div>
          <div style={{ marginTop: '4px', fontSize: '11.5px', color: SLATE, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Query</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: 'rgba(255,255,255,0.92)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '1px 7px',
                borderRadius: '5px',
                fontSize: '11px',
              }}
            >
              {query || '—'}
            </span>
            {d.summary && (
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>· {d.summary}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: YELLOW,
              lineHeight: 1,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {total}
          </div>
          <div style={{ fontSize: '10px', color: SLATE, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            {total === 1 ? 'Match' : 'Matches'}
          </div>
          {truncated && limit ? (
            <div style={{ fontSize: '9.5px', color: AMBER, marginTop: '2px' }}>
              capped at {limit}
            </div>
          ) : null}
        </div>
      </div>

      {/* ─── Match-type stat strip ──────────────────────────────────────── */}
      {results.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.015)',
            flexWrap: 'wrap',
          }}
        >
          <StatChip label="Exact"  value={tallies.exact}  color={GREEN}  icon={<Target size={11} />} />
          <StatChip label="Prefix" value={tallies.prefix} color={YELLOW} icon={<ArrowRight size={11} />} />
          <StatChip label="Name"   value={tallies.name}   color={INDIGO} icon={<Sparkles size={11} />} />
          {tallies.other > 0 && (
            <StatChip label="Other" value={tallies.other} color={SLATE} icon={<CircleDot size={11} />} />
          )}
        </div>
      )}

      {/* ─── Database group tabs ────────────────────────────────────────── */}
      {groups.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '4px',
            padding: '8px 12px 0 12px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            overflowX: 'auto',
          }}
        >
          {[{ name: 'all', items: results }, ...groups].map((g) => {
            const isActive = activeGroup === g.name;
            const label = g.name === 'all' ? 'All' : g.name;
            const count = g.items.length;
            const sp = g.name === 'all' ? { color: YELLOW } : specForDatabase(g.name);
            return (
              <button
                key={g.name}
                type="button"
                onClick={() => setActiveGroup(g.name)}
                style={{
                  padding: '6px 11px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? sp.color : 'transparent'}`,
                  color: isActive ? sp.color : 'rgba(255,255,255,0.55)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {label}
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: isActive ? `${sp.color}22` : 'rgba(255,255,255,0.05)',
                    color: isActive ? sp.color : SLATE,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Results ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 14px 4px 14px' }}>
        {results.length === 0 ? (
          <EmptyState query={query} suggestions={d.suggestions} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {visibleResults.map((g) => (
              <div key={g.name}>
                {activeGroup === 'all' && groups.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                      paddingLeft: '2px',
                    }}
                  >
                    {(() => {
                      const sp = specForDatabase(g.name);
                      const SpIcon = sp.icon;
                      return (
                        <>
                          <SpIcon size={11} color={sp.color} />
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              color: sp.color,
                            }}
                          >
                            {g.name}
                          </span>
                          <span style={{ fontSize: '10.5px', color: SLATE }}>
                            {g.items.length} result{g.items.length === 1 ? '' : 's'}
                          </span>
                          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                        </>
                      );
                    })()}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {g.items.map((r, idx) => (
                    <ResultRow key={`${g.name}-${r.symbol}-${idx}`} r={r} queryRaw={query} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Prefix legend ──────────────────────────────────────────────── */}
      <PrefixLegend open={legendOpen} onToggle={() => setLegendOpen((v) => !v)} />

      {/* ─── Footer hint ────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '8px 16px 10px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.015)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <Globe2 size={11} color={SLATE} />
        <span style={{ fontSize: '10.5px', color: SLATE, lineHeight: 1.4 }}>
          Norgate live universe · ~75k securities · canonical symbols only.
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
          Never invent a ticker — pick a result above.
        </span>
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  const dim = value === 0;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        padding: '5px 10px',
        borderRadius: '7px',
        background: dim ? 'rgba(255,255,255,0.025)' : `${color}10`,
        border: `1px solid ${dim ? 'rgba(255,255,255,0.06)' : `${color}33`}`,
      }}
    >
      <span style={{ color: dim ? SLATE : color, display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: '10.5px', color: SLATE, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: '12px',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          color: dim ? 'rgba(255,255,255,0.4)' : color,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default LookupNorgateTickerCard;
