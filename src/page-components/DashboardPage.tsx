'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Code2,
  MessageCircle,
  Database,
  TrendingUp,
  Zap,
  ArrowRight,
  Sparkles,
  MessageSquare,
  FileText,
  Plus,
  ArrowUpRight,
  Activity,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import apiClient from '@/lib/api';

/* ─────────────────────────────────────────────
   Injected global styles + Google Fonts
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

  @keyframes dash-fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dash-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.35; transform: scale(0.6); }
  }
  @keyframes dash-shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes dash-scan {
    0%   { transform: translateY(0%); opacity: 0.6; }
    100% { transform: translateY(100vh); opacity: 0; }
  }
  @keyframes ticker-slide {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  .da0 { animation: dash-fadeUp .6s cubic-bezier(.22,.68,0,1.15) both; animation-delay: 0ms; }
  .da1 { animation: dash-fadeUp .6s cubic-bezier(.22,.68,0,1.15) both; animation-delay: 80ms; }
  .da2 { animation: dash-fadeUp .6s cubic-bezier(.22,.68,0,1.15) both; animation-delay: 160ms; }
  .da3 { animation: dash-fadeUp .6s cubic-bezier(.22,.68,0,1.15) both; animation-delay: 240ms; }
  .da4 { animation: dash-fadeUp .6s cubic-bezier(.22,.68,0,1.15) both; animation-delay: 320ms; }
  .da5 { animation: dash-fadeUp .6s cubic-bezier(.22,.68,0,1.15) both; animation-delay: 400ms; }

  /* Feature card */
  .dash-feat-card {
    position: relative;
    overflow: hidden;
    transition: transform .28s cubic-bezier(.22,.68,0,1.2), box-shadow .28s ease;
  }
  .dash-feat-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(254,192,15,0.06) 0%, transparent 60%);
    opacity: 0;
    transition: opacity .28s ease;
    pointer-events: none;
  }
  .dash-feat-card:hover { transform: translateY(-5px); }
  .dash-feat-card:hover::before { opacity: 1; }

  /* Card shimmer on hover */
  .dash-feat-card .shimmer-layer {
    position: absolute;
    top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(254,192,15,0.04), transparent);
    pointer-events: none;
  }
  .dash-feat-card:hover .shimmer-layer {
    animation: dash-shimmer .65s ease forwards;
  }

  /* Recent item */
  .dash-recent-item {
    position: relative;
    transition: background .15s ease;
  }
  .dash-recent-item::before {
    content: '';
    position: absolute;
    left: 0; top: 8px; bottom: 8px;
    width: 2px;
    background: linear-gradient(to bottom, var(--accent), var(--accent-glow));
    border-radius: 2px;
    opacity: 0;
    transition: opacity .15s ease;
  }
  .dash-recent-item:hover::before { opacity: 1; }

  /* Quick action button */
  .dash-quick-btn {
    transition: border-color .2s ease, background .2s ease, color .2s ease, transform .2s ease, box-shadow .2s ease;
  }
  .dash-quick-btn:hover { transform: translateY(-2px); }

  /* CTA Button */
  .dash-cta-btn {
    position: relative;
    overflow: hidden;
    transition: transform .2s ease, box-shadow .2s ease;
  }
  .dash-cta-btn:hover { transform: translateY(-2px); }
  .dash-cta-btn:active { transform: translateY(0); }

  /* Stat card number glow */
  .stat-num-glow {
    text-shadow: 0 0 40px rgba(254,192,15,0.35);
  }

  /* Ticker */
  .ticker-inner {
    display: flex;
    gap: 48px;
    animation: ticker-slide 22s linear infinite;
    white-space: nowrap;
  }
  .ticker-inner:hover { animation-play-state: paused; }

  /* Scrollbar */
  * { scrollbar-width: thin; scrollbar-color: rgba(254,192,15,0.25) transparent; }
  *::-webkit-scrollbar { width: 4px; height: 4px; }
  *::-webkit-scrollbar-track { background: transparent; }
  *::-webkit-scrollbar-thumb { background: rgba(254,192,15,0.25); border-radius: 4px; }
`;

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

/* Sparkline SVG */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 80, h = 28;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h * 0.8 - h * 0.1;
    return `${x},${y}`;
  }).join(' ');
  const areaPath = `M0,${h} L${pts.split(' ').join(' L')} L${w},${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Section header with ornament */
function SectionHead({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
      <div style={{
        width: '3px', height: '16px',
        background: 'linear-gradient(to bottom, var(--accent), var(--accent-glow))',
        borderRadius: '3px', flexShrink: 0,
      }} />
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '9px', letterSpacing: '0.18em',
        textTransform: 'uppercase' as const,
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap' as const,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      {action && (
        <button onClick={onAction} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: "'DM Mono', monospace",
          fontSize: '9px', letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          color: 'var(--accent)', opacity: 0.7,
          transition: 'opacity .15s',
          padding: '2px 0',
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
        >
          {action}
        </button>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────��─
   Main Component
───────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [stats, setStats] = useState({ conversations: 0, documents: 0 });
  const [greeting, setGreeting] = useState('');

  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const convs = await apiClient.getConversations();
        const agentChats = (convs || []).filter(
          (c: any) => !c.conversation_type || c.conversation_type === 'agent'
        );
        setRecentChats(agentChats.slice(0, 5));
        setStats(prev => ({ ...prev, conversations: agentChats.length }));
      } catch { }
      try {
        const docs = await apiClient.getDocuments();
        setStats(prev => ({ ...prev, documents: (docs || []).length }));
      } catch { }
    })();
  }, []);

  const features = [
    {
      icon: Code2,
      title: 'AFL Generator',
      description: 'Generate AmiBroker Formula Language code from plain-language descriptions.',
      href: '/afl',
      color: '#60A5FA',
      bgColor: 'rgba(96,165,250,0.1)',
      sparkData: [3, 7, 5, 11, 8, 14, 10, 16, 12, 18],
    },
    {
      icon: MessageCircle,
      title: 'AI Chat',
      description: 'Discuss trading strategies and get contextual, intelligent assistance.',
      href: '/chat',
      color: '#A78BFA',
      bgColor: 'rgba(167,139,250,0.1)',
      sparkData: [5, 4, 8, 6, 12, 9, 14, 11, 16, 13],
    },
    {
      icon: Database,
      title: 'Knowledge Base',
      description: 'Upload and semantically search your trading documents and archives.',
      href: '/knowledge',
      color: '#34D399',
      bgColor: 'rgba(52,211,153,0.1)',
      sparkData: [2, 5, 3, 8, 6, 11, 7, 13, 9, 15],
    },
    {
      icon: TrendingUp,
      title: 'Backtest Analysis',
      description: 'Decode backtest reports with AI-powered performance breakdowns.',
      href: '/backtest',
      color: '#FB923C',
      bgColor: 'rgba(251,146,60,0.1)',
      sparkData: [8, 6, 10, 7, 13, 9, 15, 11, 17, 14],
    },
    {
      icon: Zap,
      title: 'Reverse Engineer',
      description: 'Convert strategy logic and descriptions directly into working AFL code.',
      href: '/reverse-engineer',
      color: 'var(--accent)',
      bgColor: 'rgba(254,192,15,0.08)',
      sparkData: [4, 8, 5, 10, 6, 14, 8, 16, 10, 18],
    },
  ];

  const tickerItems = [
    { label: 'AFL Generator', change: '+Active' },
    { label: 'AI Chat', change: 'Online' },
    { label: 'Knowledge Base', change: 'Indexed' },
    { label: 'Backtest AI', change: 'Ready' },
    { label: 'Reverse Eng.', change: 'Live' },
  ];

  /* CSS variables are now set globally by ThemeContext */

  /* ── Styles object ── */
  const p = isMobile ? '20px' : '52px';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div style={{
        minHeight: 'auto',
        background: `radial-gradient(ellipse 120% 60% at 60% -10%, var(--accent-dim) 0%, transparent 60%), var(--bg)`,
        fontFamily: "'Instrument Sans', sans-serif",
        color: 'var(--text)',
      }}>

        {/* ── Top bar ── */}
        <div style={{
          height: '1px',
          background: `linear-gradient(90deg, transparent 0%, var(--accent) 40%, var(--accent-glow) 60%, transparent 100%)`,
          opacity: 0.5,
        }} />

        {/* ── Ticker ── */}
        <div style={{
          borderBottom: '1px solid var(--border)',
          overflow: 'hidden',
          background: isDark ? 'rgba(254,192,15,0.02)' : 'rgba(254,192,15,0.015)',
          padding: '0',
        }}>
          <div className="ticker-inner" style={{ padding: '7px 0' }}>
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '9.5px',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                display: 'inline-flex',
                gap: '8px',
                alignItems: 'center',
              }}>
                <span style={{ color: 'var(--text)', opacity: 0.6 }}>{item.label}</span>
                <span style={{ color: '#34D399', fontSize: '8.5px' }}>● {item.change}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Hero ── */}
        <div style={{
          padding: isMobile ? '40px 20px 36px' : '64px 52px 56px',
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 320px',
          gap: isMobile ? '36px' : '40px',
          alignItems: 'start',
        }}>

          {/* Left */}
          <div className="da0">
            {/* Eyebrow */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              background: isDark ? 'rgba(254,192,15,0.07)' : 'rgba(254,192,15,0.08)',
              border: '1px solid var(--accent-glow)',
              borderRadius: '100px',
              padding: '5px 14px 5px 10px',
              marginBottom: '24px',
            }}>
              <div style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'dash-pulse 2.4s ease-in-out infinite',
              }} />
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '9.5px', letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
                color: 'var(--accent)',
              }}>
                Trading Platform · Live
              </span>
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: isMobile ? '36px' : '58px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.04,
              color: 'var(--text)',
              marginBottom: '20px',
            }}>
              {greeting},{' '}
              <span style={{
                color: 'var(--accent)',
                position: 'relative' as const,
              }}>
                {user?.name || 'Trader'}
              </span>
              <span style={{ display: 'block', fontWeight: 400, fontSize: isMobile ? '20px' : '28px', color: 'var(--text-muted)', marginTop: '6px', letterSpacing: '-0.01em' }}>
                Your edge starts here.
              </span>
            </h1>

            <p style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              lineHeight: 1.8,
              maxWidth: '500px',
              marginBottom: '36px',
            }}>
              AI-powered AFL generation, strategy analysis, and intelligent trading tools — purpose-built for systematic traders.
            </p>

            {/* CTA row */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
              <button
                className="dash-cta-btn"
                onClick={() => router.push('/afl')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  padding: isMobile ? '13px 24px' : '15px 32px',
                  background: 'var(--accent)',
                  color: '#09090B',
                  border: 'none', borderRadius: '10px',
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '12px', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                  cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(254,192,15,0.35)',
                }}
              >
                <Sparkles size={15} />
                Generate AFL
              </button>
              <button
                onClick={() => router.push('/chat')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  padding: isMobile ? '13px 24px' : '15px 28px',
                  background: 'var(--bg-card)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '12px', fontWeight: 600,
                  letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                  cursor: 'pointer',
                  transition: 'border-color .2s, background .2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(254,192,15,0.35)';
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                }}
              >
                <MessageCircle size={15} />
                Open Chat
              </button>
            </div>
          </div>

          {/* Right: stat cards */}
          <div className="da1" style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column' as const, gap: '12px' }}>
            {[
              {
                label: 'Conversations',
                value: stats.conversations,
                icon: MessageCircle,
                color: '#A78BFA',
                spark: [4, 7, 5, 9, 6, 12, 8, 14, 10, 16],
              },
              {
                label: 'Documents',
                value: stats.documents,
                icon: Database,
                color: '#34D399',
                spark: [2, 5, 3, 8, 5, 10, 7, 12, 9, 13],
              },
            ].map(({ label, value, icon: Icon, color, spark }) => (
              <div key={label} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '20px 22px',
                flex: isMobile ? '1' : 'none',
                boxShadow: 'var(--shadow-card)',
                position: 'relative' as const,
                overflow: 'hidden',
              }}>
                {/* Top accent line */}
                <div style={{
                  position: 'absolute' as const, top: 0, left: 0, right: 0, height: '1.5px',
                  background: `linear-gradient(90deg, ${color}, transparent)`,
                  opacity: 0.6,
                }} />
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  marginBottom: '12px',
                }}>
                  <div>
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '8.5px', letterSpacing: '0.14em',
                      textTransform: 'uppercase' as const,
                      color: 'var(--text-muted)',
                      marginBottom: '8px',
                    }}>
                      {label}
                    </div>
                    <div className="stat-num-glow" style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: isMobile ? '32px' : '40px',
                      fontWeight: 400,
                      color: 'var(--text)',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}>
                      {String(value).padStart(2, '0')}
                    </div>
                  </div>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '9px',
                    background: `${color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} color={color} />
                  </div>
                </div>
                <Sparkline values={spark} color={color} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Content ── */}
        <div style={{ padding: isMobile ? '0 20px 64px' : `0 ${p} 80px`, maxWidth: '1360px', margin: '0 auto' }}>

          {/* Quick actions */}
          <div className="da2" style={{ display: 'flex', gap: '10px', marginBottom: '52px', flexWrap: 'wrap' as const }}>
            {[
              { label: 'New Chat', icon: Plus, href: '/chat', bg: 'rgba(167,139,250,0.1)', color: '#A78BFA' },
              { label: 'Generate AFL', icon: Code2, href: '/afl', bg: 'rgba(96,165,250,0.1)', color: '#60A5FA' },
              { label: 'Upload Doc', icon: FileText, href: '/knowledge', bg: 'rgba(52,211,153,0.1)', color: '#34D399' },
              { label: 'Backtest', icon: BarChart2, href: '/backtest', bg: 'rgba(251,146,60,0.1)', color: '#FB923C' },
            ].map(({ label, icon: Icon, href, bg, color }) => (
              <div
                key={href}
                className="dash-quick-btn"
                onClick={() => router.push(href)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  padding: '10px 18px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '9px',
                  color: 'var(--text)',
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '11px', fontWeight: 600,
                  letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-card)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(254,192,15,0.3)';
                  e.currentTarget.style.background = 'var(--accent-dim)';
                  e.currentTarget.style.color = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(254,192,15,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.color = 'var(--text)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <div style={{
                  width: '26px', height: '26px', borderRadius: '7px',
                  background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={13} color={color} />
                </div>
                {label}
              </div>
            ))}
          </div>

          {/* ── Recent Conversations ── */}
          {recentChats.length > 0 && (
            <div className="da3" style={{ marginBottom: '52px' }}>
              <SectionHead
                label="Recent Conversations"
                action="View All →"
                onAction={() => router.push('/chat')}
              />
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card)',
              }}>
                {recentChats.map((chat, idx) => (
                  <div
                    key={chat.id}
                    className="dash-recent-item"
                    onClick={() => router.push('/chat')}
                    style={{
                      padding: '14px 22px',
                      display: 'flex', alignItems: 'center', gap: '16px',
                      cursor: 'pointer',
                      borderBottom: idx < recentChats.length - 1 ? '1px solid var(--border)' : 'none',
                      paddingLeft: '24px',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = isDark ? '#121216' : '#F8F8F9';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '8px',
                      background: isDark ? 'rgba(254,192,15,0.08)' : 'rgba(254,192,15,0.07)',
                      border: '1px solid rgba(254,192,15,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <MessageSquare size={13} color="var(--accent)" />
                    </div>
                    <span style={{
                      flex: 1, fontSize: '13px', fontWeight: 500,
                      color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                      letterSpacing: '-0.01em',
                    }}>
                      {chat.title || 'Untitled Chat'}
                    </span>
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '9.5px', color: 'var(--text-muted)', flexShrink: 0,
                    }}>
                      {chat.updated_at
                        ? new Date(chat.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
                        : ''}
                    </span>
                    <ArrowRight size={13} color="var(--text-dim)" style={{ flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Feature Cards ── */}
          <div className="da4" style={{ marginBottom: '52px' }}>
            <SectionHead label="Platform Tools" />
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}>
              {features.map((feat, index) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.href}
                    className="dash-feat-card"
                    onClick={() => router.push(feat.href)}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '20px',
                      padding: '28px',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column' as const,
                      boxShadow: 'var(--shadow-card)',
                      position: 'relative' as const,
                      overflow: 'hidden',
                      transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: 'translateZ(0)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-8px) translateZ(0)';
                      e.currentTarget.style.borderColor = 'rgba(254,192,15,0.4)';
                      e.currentTarget.style.boxShadow = isDark
                        ? '0 24px 56px rgba(0,0,0,0.6), 0 0 0 1px rgba(254,192,15,0.3), 0 0 40px var(--accent-glow)'
                        : '0 16px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(254,192,15,0.3), 0 0 40px rgba(254,192,15,0.1)';
                      e.currentTarget.style.background = isDark
                        ? 'linear-gradient(180deg, rgba(254,192,15,0.05), rgba(254,192,15,0.02))'
                        : 'linear-gradient(180deg, rgba(254,192,15,0.04), rgba(254,192,15,0.02))';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0) translateZ(0)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                      e.currentTarget.style.background = 'var(--bg-card)';
                    }}
                  >
                    {/* Enhanced shimmer layer with gradient sweep */}
                    <div className="shimmer-layer" style={{
                      animation: 'dash-shimmer 0.8s ease-out forwards',
                      background: `linear-gradient(90deg, transparent, ${feat.color}20, transparent)`,
                    }} />

                    {/* Floating accent background */}
                    <div style={{
                      position: 'absolute',
                      top: '-50%',
                      right: '-50%',
                      width: '200%',
                      height: '200%',
                      background: `radial-gradient(circle at 70% 30%, ${feat.color}15 0%, transparent 50%)`,
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      pointerEvents: 'none',
                      zIndex: 0,
                    }} />

                    {/* Icon + sparkline row */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '24px',
                      position: 'relative' as const,
                      zIndex: 1,
                    }}>
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '14px',
                        background: `linear-gradient(135deg, ${feat.bgColor}, ${feat.color}15)`,
                        border: `1px solid ${feat.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 8px 24px ${feat.color}20`,
                        position: 'relative' as const,
                        overflow: 'hidden',
                      }}>
                        {/* Icon container with subtle pulse */}
                        <div style={{
                          position: 'absolute',
                          inset: '-2px',
                          borderRadius: '14px',
                          background: `linear-gradient(135deg, transparent, ${feat.color}10)`,
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                        }} />
                        <Icon size={22} color={feat.color} style={{ position: 'relative', zIndex: 2 }} />
                      </div>
                      <div style={{
                        position: 'relative' as const,
                        padding: '6px',
                        borderRadius: '12px',
                        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        <Sparkline values={feat.sparkData} color={feat.color} />
                      </div>
                    </div>

                    <h3 style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: '16px', fontWeight: 800,
                      color: 'var(--text)',
                      letterSpacing: '-0.02em',
                      marginBottom: '10px',
                      lineHeight: 1.2,
                      position: 'relative' as const,
                      zIndex: 1,
                    }}>
                      {feat.title}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      lineHeight: 1.65, flex: 1, marginBottom: '22px',
                      position: 'relative' as const,
                      zIndex: 1,
                    }}>
                      {feat.description}
                    </p>

                    {/* Enhanced CTA with gradient border */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '10px',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase' as const,
                      color: feat.color,
                      fontWeight: 600,
                      position: 'relative' as const,
                      zIndex: 1,
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${feat.color}40`,
                      background: isDark ? `${feat.color}08` : `${feat.color}06`,
                      transition: 'all 0.25s ease',
                      boxShadow: `0 4px 16px ${feat.color}20`,
                    }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = `${feat.color}15`;
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = `0 6px 20px ${feat.color}30`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = isDark ? `${feat.color}08` : `${feat.color}06`;
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 4px 16px ${feat.color}20`;
                      }}
                    >
                      <span style={{ color: feat.color }}>Launch</span>
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${feat.color}, ${feat.color}80)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 12px ${feat.color}40`,
                      }}>
                        <ArrowUpRight size={10} color="#000" />
                      </div>
                    </div>

                    {/* Interactive hover overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '20px',
                      background: `linear-gradient(180deg, transparent, ${feat.color}05)`,
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      pointerEvents: 'none',
                      zIndex: 0,
                    }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Bottom grid ── */}
          <div className="da5" style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '16px',
          }}>

            {/* Platform Guide */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '28px',
              position: 'relative' as const,
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{
                position: 'absolute' as const, top: 0, left: 0, right: 0, height: '1.5px',
                background: 'linear-gradient(90deg, var(--accent) 0%, rgba(254,192,15,0.1) 80%, transparent 100%)',
              }} />
              {/* Subtle bg decoration */}
              <div style={{
                position: 'absolute' as const, bottom: '-30px', right: '-30px',
                width: '120px', height: '120px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(254,192,15,0.04) 0%, transparent 70%)',
                pointerEvents: 'none' as const,
              }} />

              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px',
              }}>
                <Activity size={14} color="var(--accent)" />
                <span style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '13px', fontWeight: 700,
                  color: 'var(--text)', letterSpacing: '-0.01em',
                }}>
                  Platform Guide
                </span>
              </div>

              {[
                { strong: 'AFL Generator', text: ' — describe any strategy in plain language.' },
                { strong: 'AI Chat', text: ' — refine logic and ask trading questions.' },
                { strong: 'Knowledge Base', text: ' — upload docs for context-aware responses.' },
                { strong: 'Backtest Analysis', text: ' — extract insights from your results.' },
                { strong: 'Reverse Engineer', text: ' — convert ideas directly to AFL code.' },
              ].map((tip, idx, arr) => (
                <div key={idx} style={{
                  display: 'flex', gap: '14px',
                  padding: '11px 0',
                  borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'flex-start',
                }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '9px', color: 'var(--accent)',
                    opacity: 0.55, flexShrink: 0, paddingTop: '2px', width: '16px',
                  }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{tip.strong}</strong>
                    {tip.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Activity */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '28px',
              position: 'relative' as const,
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{
                position: 'absolute' as const, top: 0, left: 0, right: 0, height: '1.5px',
                background: 'linear-gradient(90deg, #34D399 0%, rgba(52,211,153,0.1) 80%, transparent 100%)',
              }} />
              <div style={{
                position: 'absolute' as const, bottom: '-30px', right: '-30px',
                width: '120px', height: '120px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)',
                pointerEvents: 'none' as const,
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
                <BarChart2 size={14} color="#34D399" />
                <span style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '13px', fontWeight: 700,
                  color: 'var(--text)', letterSpacing: '-0.01em',
                }}>
                  Activity
                </span>
              </div>

              {[
                { label: 'Total Conversations', value: stats.conversations, valueColor: 'var(--text)' },
                { label: 'Documents Indexed', value: stats.documents, valueColor: 'var(--text)' },
                { label: 'Platform Status', value: 'Online', valueColor: '#34D399' },
                { label: 'AI Engine', value: 'Active', valueColor: 'var(--accent)' },
              ].map(({ label, value, valueColor }, idx, arr) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '13px 0',
                  borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '12.5px',
                    color: valueColor,
                    fontWeight: 400,
                  }}>
                    {typeof value === 'number' ? String(value).padStart(2, '0') : value}
                  </span>
                </div>
              ))}

              {/* Divider */}
              <div style={{ margin: '20px 0 18px', borderTop: '1px solid var(--border)' }} />

              {/* Quick nav */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                {[
                  { label: 'Go to AFL Generator', href: '/afl', color: '#60A5FA' },
                  { label: 'Open Knowledge Base', href: '/knowledge', color: '#34D399' },
                ].map(({ label, href, color }) => (
                  <button key={href} onClick={() => router.push(href)} style={{
                    width: '100%',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    fontFamily: "'Instrument Sans', sans-serif",
                    transition: 'border-color .15s, color .15s',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = `${color}44`;
                      e.currentTarget.style.color = color;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    {label}
                    <ArrowRight size={12} />
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
