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
  Clock,
  MessageSquare,
  FileText,
  Plus,
  ArrowUpRight,
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
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dash-fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes dash-pulse {
    0%, 100% { opacity: 1;   transform: scale(1);   }
    50%       { opacity: 0.4; transform: scale(0.65); }
  }

  /* Animation utility classes */
  .da0 { animation: dash-fadeUp .55s cubic-bezier(.22,.68,0,1.2) both; animation-delay: 0ms;   }
  .da1 { animation: dash-fadeUp .55s cubic-bezier(.22,.68,0,1.2) both; animation-delay: 70ms;  }
  .da2 { animation: dash-fadeUp .55s cubic-bezier(.22,.68,0,1.2) both; animation-delay: 140ms; }
  .da3 { animation: dash-fadeUp .55s cubic-bezier(.22,.68,0,1.2) both; animation-delay: 210ms; }
  .da4 { animation: dash-fadeUp .55s cubic-bezier(.22,.68,0,1.2) both; animation-delay: 280ms; }
  .da5 { animation: dash-fadeUp .55s cubic-bezier(.22,.68,0,1.2) both; animation-delay: 350ms; }
  .da6 { animation: dash-fadeUp .55s cubic-bezier(.22,.68,0,1.2) both; animation-delay: 420ms; }

  /* Feature card hover glow fill */
  .dash-feat-card {
    position: relative;
    overflow: hidden;
    transition: border-color .25s ease, transform .25s ease, box-shadow .25s ease, background .25s ease;
  }
  .dash-feat-card::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 70px;
    background: linear-gradient(to top, rgba(254,192,15,0.07), transparent);
    opacity: 0;
    transition: opacity .25s ease;
    pointer-events: none;
  }
  .dash-feat-card:hover { transform: translateY(-4px); }
  .dash-feat-card:hover::after { opacity: 1; }

  /* Recent item left-edge accent */
  .dash-recent-item {
    position: relative;
    transition: background .15s ease;
  }
  .dash-recent-item::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 2px;
    background: #FEC00F;
    opacity: 0;
    transition: opacity .15s ease;
    border-radius: 0 2px 2px 0;
  }
  .dash-recent-item:hover::before { opacity: 1; }

  /* CTA button inner shimmer */
  .dash-cta-btn {
    position: relative;
    overflow: hidden;
    transition: transform .2s ease, box-shadow .2s ease;
  }
  .dash-cta-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%);
    opacity: 0;
    transition: opacity .2s ease;
  }
  .dash-cta-btn:hover { transform: translateY(-1px); }
  .dash-cta-btn:hover::before { opacity: 1; }
  .dash-cta-btn:active { transform: translateY(0); }

  /* Quick action button */
  .dash-quick-btn {
    transition: border-color .2s ease, background .2s ease, color .2s ease, transform .2s ease;
  }
  .dash-quick-btn:hover { transform: translateY(-1px); }
`;

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [stats, setStats] = useState({ conversations: 0, documents: 0 });

  const isDark = resolvedTheme === 'dark';

  /* ── Responsive listener ── */
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  /* ── Load data ── */
  useEffect(() => {
    (async () => {
      try {
        const convs = await apiClient.getConversations();
        const agentChats = (convs || []).filter(
          (c: any) => !c.conversation_type || c.conversation_type === 'agent'
        );
        setRecentChats(agentChats.slice(0, 5));
        setStats(prev => ({ ...prev, conversations: agentChats.length }));
      } catch {}
      try {
        const docs = await apiClient.getDocuments();
        setStats(prev => ({ ...prev, documents: (docs || []).length }));
      } catch {}
    })();
  }, []);

  /* ── Feature definitions ── */
  const features = [
    {
      icon: Code2,
      title: 'AFL Generator',
      description: 'Generate AmiBroker Formula Language code from natural language descriptions.',
      href: '/afl',
      color: '#3B82F6',
      bgColor: 'rgba(59,130,246,0.1)',
    },
    {
      icon: MessageCircle,
      title: 'AI Chat',
      description: 'Chat with AI about trading strategies and get instant, contextual help.',
      href: '/chat',
      color: '#8B5CF6',
      bgColor: 'rgba(139,92,246,0.1)',
    },
    {
      icon: Database,
      title: 'Knowledge Base',
      description: 'Upload and search your trading documents and strategy archives.',
      href: '/knowledge',
      color: '#22C55E',
      bgColor: 'rgba(34,197,94,0.1)',
    },
    {
      icon: TrendingUp,
      title: 'Backtest Analysis',
      description: 'Analyze backtest results with AI-powered performance insights.',
      href: '/backtest',
      color: '#F97316',
      bgColor: 'rgba(249,115,22,0.1)',
    },
    {
      icon: Zap,
      title: 'Reverse Engineer',
      description: 'Convert strategy descriptions and logic directly into working AFL code.',
      href: '/reverse-engineer',
      color: '#FEC00F',
      bgColor: 'rgba(254,192,15,0.08)',
    },
  ];

  const tips = [
    { strong: 'AFL Generator', text: ' to create your first trading strategy from plain language.' },
    { strong: 'AI Chat', text: ' to refine strategies and ask in-depth questions.' },
    { strong: 'Knowledge Base', text: ' — upload documents for richer, context-aware responses.' },
    { strong: 'Backtest Analysis', text: ' to extract AI insights from your results.' },
    { strong: 'Reverse Engineer', text: ' to convert any strategy description into code.' },
  ];

  /* ── CSS custom properties (theme-aware) ── */
  const cssVars: React.CSSProperties = {
    ['--accent' as any]: '#FEC00F',
    ['--accent-dim' as any]: isDark ? 'rgba(254,192,15,0.1)' : 'rgba(254,192,15,0.08)',
    ['--accent-glow' as any]: 'rgba(254,192,15,0.28)',
    ['--bg' as any]: isDark ? '#09090B' : '#F8F8F9',
    ['--bg-card' as any]: isDark ? '#0F0F12' : '#FFFFFF',
    ['--bg-card-hover' as any]: isDark ? '#141418' : '#F4F4F5',
    ['--border' as any]: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    ['--border-hover' as any]: 'rgba(254,192,15,0.45)',
    ['--text' as any]: isDark ? '#F4F4F5' : '#09090B',
    ['--text-muted' as any]: isDark ? '#71717A' : '#71717A',
    ['--text-dim' as any]: isDark ? '#3F3F46' : '#D4D4D8',
    ['--dot-color' as any]: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.035)',
  };

  const s = {
    /* Root */
    root: {
      ...cssVars,
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      backgroundImage: 'radial-gradient(var(--dot-color) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      fontFamily: "'Instrument Sans', sans-serif",
      color: 'var(--text)',
      transition: 'background-color 0.3s ease',
      overflowX: 'hidden' as const,
    },

    /* Top accent line */
    topLine: {
      height: '2px',
      background: 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)',
      opacity: 0.35,
    },

    /* ── Hero ── */
    hero: {
      padding: isMobile ? '36px 20px 32px' : '60px 48px 52px',
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'grid' as const,
      gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
      gap: isMobile ? '32px' : '48px',
      alignItems: 'start',
    },
    heroLeft: {},
    eyebrow: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: "'DM Mono', monospace",
      fontSize: '10px',
      letterSpacing: '0.14em',
      color: 'var(--accent)',
      textTransform: 'uppercase' as const,
      marginBottom: '18px',
    },
    eyebrowDot: {
      width: '5px',
      height: '5px',
      borderRadius: '50%',
      background: 'var(--accent)',
      animation: 'dash-pulse 2.2s ease-in-out infinite',
    },
    heroTitle: {
      fontFamily: "'Syne', sans-serif",
      fontSize: isMobile ? '34px' : '54px',
      fontWeight: 800,
      letterSpacing: '-0.025em',
      lineHeight: 1.08,
      color: 'var(--text)',
      marginBottom: '16px',
    },
    heroAccent: {
      color: 'var(--accent)',
    },
    heroSub: {
      fontSize: '14px',
      color: 'var(--text-muted)',
      lineHeight: 1.75,
      maxWidth: '460px',
      marginBottom: '32px',
    },
    ctaBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      padding: isMobile ? '13px 24px' : '14px 30px',
      background: 'var(--accent)',
      color: '#09090B',
      border: 'none',
      borderRadius: '8px',
      fontFamily: "'Syne', sans-serif",
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '0.09em',
      textTransform: 'uppercase' as const,
      cursor: 'pointer',
      boxShadow: '0 4px 20px var(--accent-glow)',
    },

    /* Stats column */
    statsCol: {
      display: 'flex',
      flexDirection: isMobile ? 'row' : 'column' as const,
      gap: '12px',
    },
    statCard: {
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: isMobile ? '16px 20px' : '20px 26px',
      minWidth: isMobile ? '0' : '170px',
      flex: isMobile ? '1' : 'none',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    statTopLine: {
      position: 'absolute' as const,
      top: 0, left: 0, right: 0,
      height: '2px',
      background: 'linear-gradient(90deg, var(--accent), transparent)',
      opacity: 0.55,
    },
    statLabel: {
      fontFamily: "'DM Mono', monospace",
      fontSize: '9px',
      letterSpacing: '0.13em',
      textTransform: 'uppercase' as const,
      color: 'var(--text-muted)',
      marginBottom: '10px',
    },
    statValue: {
      fontFamily: "'DM Mono', monospace",
      fontSize: isMobile ? '28px' : '36px',
      fontWeight: 400,
      color: 'var(--text)',
      letterSpacing: '-0.02em',
      lineHeight: 1,
    },

    /* ── Content ── */
    content: {
      padding: isMobile ? '8px 20px 56px' : '8px 48px 72px',
      maxWidth: '1400px',
      margin: '0 auto',
    },

    /* Quick actions */
    quickRow: {
      display: 'flex',
      gap: '10px',
      marginBottom: '52px',
      flexWrap: 'wrap' as const,
    },
    quickBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      padding: '11px 20px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      color: 'var(--text)',
      fontFamily: "'Syne', sans-serif",
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.07em',
      textTransform: 'uppercase' as const,
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
    },
    quickIconWrap: (bg: string) => ({
      width: '26px',
      height: '26px',
      borderRadius: '6px',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),

    /* Section header */
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      marginBottom: '18px',
    },
    sectionLabel: {
      fontFamily: "'DM Mono', monospace",
      fontSize: '9px',
      letterSpacing: '0.16em',
      textTransform: 'uppercase' as const,
      color: 'var(--text-muted)',
      whiteSpace: 'nowrap' as const,
    },
    sectionLine: {
      flex: 1,
      height: '1px',
      background: 'var(--border)',
    },

    /* Features */
    featGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(275px, 1fr))',
      gap: '14px',
      marginBottom: '52px',
    },
    featCard: (borderColor: string, boxShadow: string, bg: string) => ({
      background: bg || 'var(--bg-card)',
      border: `1px solid ${borderColor}`,
      borderRadius: '14px',
      padding: '26px',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column' as const,
      boxShadow,
    }),
    featIconWrap: (bg: string) => ({
      width: '46px',
      height: '46px',
      borderRadius: '11px',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '18px',
    }),
    featTitle: {
      fontFamily: "'Syne', sans-serif",
      fontSize: '15px',
      fontWeight: 700,
      color: 'var(--text)',
      marginBottom: '8px',
      letterSpacing: '-0.01em',
    },
    featDesc: {
      fontSize: '12.5px',
      color: 'var(--text-muted)',
      lineHeight: 1.65,
      flex: 1,
      marginBottom: '18px',
    },
    featCta: (color: string) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontFamily: "'DM Mono', monospace",
      fontSize: '10px',
      letterSpacing: '0.09em',
      textTransform: 'uppercase' as const,
      color,
    }),

    /* Recents */
    recentsWrap: { marginBottom: '52px' },
    recentsCard: {
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      overflow: 'hidden',
    },
    recentItem: (isLast: boolean, bgHover: string) => ({
      padding: '15px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      cursor: 'pointer',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
    }),
    recentTitle: {
      flex: 1,
      fontSize: '13px',
      fontWeight: 500,
      color: 'var(--text)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
      letterSpacing: '-0.01em',
    },
    recentDate: {
      fontFamily: "'DM Mono', monospace",
      fontSize: '10px',
      color: 'var(--text-dim)',
      flexShrink: 0,
    },

    /* Bottom grid */
    bottomGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: '16px',
    },

    /* Tips / guide card */
    tipsCard: {
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '28px',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    tipsTopLine: {
      position: 'absolute' as const,
      top: 0, left: 0, right: 0,
      height: '2px',
      background: 'linear-gradient(90deg, var(--accent) 0%, transparent 70%)',
      opacity: 0.5,
    },
    tipsTitle: {
      fontFamily: "'Syne', sans-serif",
      fontSize: '14px',
      fontWeight: 700,
      color: 'var(--text)',
      letterSpacing: '-0.01em',
      marginBottom: '20px',
    },
    tipItem: (isLast: boolean) => ({
      display: 'flex',
      gap: '14px',
      padding: '11px 0',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      alignItems: 'flex-start',
    }),
    tipNumber: {
      fontFamily: "'DM Mono', monospace",
      fontSize: '10px',
      color: 'var(--accent)',
      opacity: 0.65,
      flexShrink: 0,
      paddingTop: '2px',
      width: '16px',
    },
    tipText: {
      fontSize: '12.5px',
      color: 'var(--text-muted)',
      lineHeight: 1.6,
    },
  } as const;

  return (
    <>
      {/* Inject styles */}
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div style={s.root}>
        {/* Top accent line */}
        <div style={s.topLine} />

        {/* ─── Hero ─────────────────────────────────────── */}
        <div style={s.hero}>
          {/* Left: greeting + CTA */}
          <div style={s.heroLeft} className="da0">
            <div style={s.eyebrow}>
              <div style={s.eyebrowDot} />
              Trading Platform
            </div>
            <h1 style={s.heroTitle}>
              Welcome back,{' '}
              <span style={s.heroAccent}>{user?.name || 'Trader'}</span>
            </h1>
            <p style={s.heroSub}>
              AI-powered AFL code generation, strategy analysis, and intelligent trading tools — all in one place.
            </p>
            <button
              className="dash-cta-btn"
              style={s.ctaBtn}
              onClick={() => router.push('/afl')}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px var(--accent-glow)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px var(--accent-glow)';
              }}
            >
              <Sparkles size={16} />
              Start Generating
            </button>
          </div>

          {/* Right: stats */}
          <div style={s.statsCol} className="da1">
            <div style={s.statCard}>
              <div style={s.statTopLine} />
              <div style={s.statLabel}>Conversations</div>
              <div style={s.statValue}>{String(stats.conversations).padStart(2, '0')}</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statTopLine} />
              <div style={s.statLabel}>Documents</div>
              <div style={s.statValue}>{String(stats.documents).padStart(2, '0')}</div>
            </div>
          </div>
        </div>

        {/* ─── Main content ─────────────────────────────── */}
        <div style={s.content}>

          {/* Quick actions */}
          <div style={s.quickRow} className="da2">
            {[
              { label: 'New Chat',     icon: Plus,  href: '/chat',  bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6' },
              { label: 'Generate AFL', icon: Code2, href: '/afl',   bg: 'rgba(59,130,246,0.12)',  color: '#3B82F6' },
              { label: 'Upload Doc',   icon: FileText, href: '/knowledge', bg: 'rgba(34,197,94,0.1)', color: '#22C55E' },
            ].map(({ label, icon: Icon, href, bg, color }) => (
              <div
                key={href}
                className="dash-quick-btn"
                style={s.quickBtn}
                onClick={() => router.push(href)}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.background = 'var(--accent-dim)';
                  e.currentTarget.style.color = 'var(--accent)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.color = 'var(--text)';
                }}
              >
                <div style={s.quickIconWrap(bg)}>
                  <Icon size={14} color={color} />
                </div>
                {label}
              </div>
            ))}
          </div>

          {/* ── Recent Conversations ── */}
          {recentChats.length > 0 && (
            <div style={s.recentsWrap} className="da3">
              <div style={s.sectionHeader}>
                <span style={s.sectionLabel}>Recent Conversations</span>
                <div style={s.sectionLine} />
              </div>
              <div style={s.recentsCard}>
                {recentChats.map((chat, idx) => (
                  <div
                    key={chat.id}
                    className="dash-recent-item"
                    style={s.recentItem(idx === recentChats.length - 1, isDark ? '#141418' : '#F4F4F5')}
                    onClick={() => router.push('/chat')}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = isDark ? '#141418' : '#F4F4F5';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <MessageSquare size={15} color="#FEC00F" style={{ flexShrink: 0, opacity: 0.8 }} />
                    <span style={s.recentTitle}>{chat.title || 'Untitled Chat'}</span>
                    <span style={s.recentDate}>
                      {chat.updated_at
                        ? new Date(chat.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
                        : ''}
                    </span>
                    <ArrowRight size={13} color="var(--text-dim)" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Feature Cards ── */}
          <div className="da4">
            <div style={s.sectionHeader}>
              <span style={s.sectionLabel}>Tools</span>
              <div style={s.sectionLine} />
            </div>
            <div style={s.featGrid}>
              {features.map(feat => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.href}
                    className="dash-feat-card"
                    style={s.featCard('var(--border)', 'none', 'var(--bg-card)')}
                    onClick={() => router.push(feat.href)}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--border-hover)';
                      e.currentTarget.style.background = 'var(--bg-card-hover)';
                      e.currentTarget.style.boxShadow = isDark
                        ? '0 16px 40px rgba(0,0,0,0.45), inset 0 0 0 1px var(--border-hover)'
                        : '0 8px 24px rgba(0,0,0,0.08), inset 0 0 0 1px var(--border-hover)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--bg-card)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={s.featIconWrap(feat.bgColor)}>
                      <Icon size={22} color={feat.color} />
                    </div>
                    <h3 style={s.featTitle}>{feat.title}</h3>
                    <p style={s.featDesc}>{feat.description}</p>
                    <div style={s.featCta(feat.color)}>
                      Open <ArrowUpRight size={12} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Bottom: Platform Guide ── */}
          <div style={s.bottomGrid} className="da5">
            <div style={s.tipsCard}>
              <div style={s.tipsTopLine} />
              <div style={s.tipsTitle}>Platform Guide</div>
              {tips.map((tip, idx) => (
                <div key={idx} style={s.tipItem(idx === tips.length - 1)}>
                  <span style={s.tipNumber}>0{idx + 1}</span>
                  <span style={s.tipText}>
                    Use <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{tip.strong}</strong>
                    {tip.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Activity summary card */}
            <div style={{ ...s.tipsCard }}>
              <div style={s.tipsTopLine} />
              <div style={s.tipsTitle}>Activity</div>
              {[
                { label: 'Total Conversations', value: stats.conversations },
                { label: 'Documents Indexed',   value: stats.documents },
                { label: 'Platform Status',      value: 'Online' },
              ].map(({ label, value }, idx) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '13px 0',
                    borderBottom: idx < 2 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span style={{
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: '12.5px',
                    color: 'var(--text-muted)',
                  }}>
                    {label}
                  </span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '13px',
                    color: label === 'Platform Status' ? '#22C55E' : 'var(--text)',
                    fontWeight: 400,
                  }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}