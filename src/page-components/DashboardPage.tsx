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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import apiClient from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [stats, setStats] = useState({ conversations: 0, documents: 0 });

  const isDark = resolvedTheme === 'dark';

  const colors = {
    background: isDark ? '#121212' : '#ffffff',
    cardBg: isDark ? '#1E1E1E' : '#f8f9fa',
    border: isDark ? '#424242' : '#e0e0e0',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    accent: '#FEC00F',
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Run on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load recent conversations and stats
  useEffect(() => {
    (async () => {
      try {
        const convs = await apiClient.getConversations();
        const agentChats = (convs || []).filter((c: any) => !c.conversation_type || c.conversation_type === 'agent');
        setRecentChats(agentChats.slice(0, 5));
        setStats(prev => ({ ...prev, conversations: agentChats.length }));
      } catch {}
      try {
        const docs = await apiClient.getDocuments();
        setStats(prev => ({ ...prev, documents: (docs || []).length }));
      } catch {}
    })();
  }, []);

  const features = [
    {
      icon: Code2,
      title: 'AFL Generator',
      description: 'Generate AmiBroker Formula Language code from natural language',
      href: '/afl',
      color: '#3B82F6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      icon: MessageCircle,
      title: 'AI Chat',
      description: 'Chat with AI about trading strategies and get instant help',
      href: '/chat',
      color: '#8B5CF6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
    {
      icon: Database,
      title: 'Knowledge Base',
      description: 'Upload and search your trading documents and strategies',
      href: '/knowledge',
      color: '#22C55E',
      bgColor: 'rgba(34, 197, 94, 0.1)',
    },
    {
      icon: TrendingUp,
      title: 'Backtest Analysis',
      description: 'Analyze backtest results with AI-powered insights',
      href: '/backtest',
      color: '#F97316',
      bgColor: 'rgba(249, 115, 22, 0.1)',
    },
    {
      icon: Zap,
      title: 'Reverse Engineer',
      description: 'Convert trading strategies into working AFL code',
      href: '/reverse-engineer',
      color: '#FEC00F',
      bgColor: 'rgba(254, 192, 15, 0.1)',
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.background,
      fontFamily: "'Quicksand', sans-serif",
      transition: 'background-color 0.3s ease',
    }}>
      {/* Header */}
      <div style={{
        background: isDark 
          ? 'linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%)'
          : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        borderBottom: `1px solid ${colors.border}`,
        padding: isMobile ? '28px 20px' : '48px 32px',
        transition: 'background 0.3s ease',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: isMobile ? '32px' : '48px',
            fontWeight: 700,
            color: colors.text,
            marginBottom: '16px',
            letterSpacing: '1.5px',
            lineHeight: 1.2,
          }}>
            Welcome back, <span style={{ color: colors.accent }}>{user?.name || 'Trader'}</span>
          </h1>
          <p style={{
            color: colors.textMuted,
            fontSize: isMobile ? '15px' : '17px',
            marginBottom: '28px',
            lineHeight: 1.7,
            maxWidth: isMobile ? '100%' : '600px',
          }}>
            Your AI-powered AFL code generation and trading strategy platform
          </p>
          <button
            onClick={() => router.push('/afl')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: isMobile ? '16px 28px' : '16px 36px',
              backgroundColor: colors.accent,
              color: '#212121',
              border: 'none',
              borderRadius: '12px',
              fontSize: isMobile ? '15px' : '15px',
              fontWeight: 700,
              fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(254, 192, 15, 0.3)',
              minHeight: '52px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(254, 192, 15, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(254, 192, 15, 0.3)';
            }}
          >
            <Sparkles size={20} />
            START GENERATING CODE
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        padding: isMobile ? '24px 20px' : '48px 32px',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Quick Actions + Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '40px',
        }}>
          <div
            onClick={() => router.push('/chat')}
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={22} color="#8B5CF6" />
            </div>
            <div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, color: colors.text, letterSpacing: '0.5px' }}>NEW CHAT</div>
              <div style={{ fontSize: '12px', color: colors.textMuted }}>Start a conversation</div>
            </div>
          </div>

          <div style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(254, 192, 15, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={22} color="#FEC00F" />
            </div>
            <div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '22px', fontWeight: 700, color: colors.text }}>{stats.conversations}</div>
              <div style={{ fontSize: '12px', color: colors.textMuted }}>Conversations</div>
            </div>
          </div>

          <div style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} color="#22C55E" />
            </div>
            <div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '22px', fontWeight: 700, color: colors.text }}>{stats.documents}</div>
              <div style={{ fontSize: '12px', color: colors.textMuted }}>Documents</div>
            </div>
          </div>

          <div
            onClick={() => router.push('/afl')}
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 size={22} color="#3B82F6" />
            </div>
            <div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, color: colors.text, letterSpacing: '0.5px' }}>GENERATE AFL</div>
              <div style={{ fontSize: '12px', color: colors.textMuted }}>Create strategy code</div>
            </div>
          </div>
        </div>

        {/* Recent Conversations */}
        {recentChats.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: 600,
              color: colors.text,
              marginBottom: '20px',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <Clock size={22} style={{ color: colors.accent }} />
              RECENT CONVERSATIONS
            </h2>
            <div style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              overflow: 'hidden',
            }}>
              {recentChats.map((chat, idx) => (
                <div
                  key={chat.id}
                  onClick={() => router.push('/chat')}
                  style={{
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    cursor: 'pointer',
                    borderBottom: idx < recentChats.length - 1 ? `1px solid ${colors.border}` : 'none',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? '#262626' : '#f0f0f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <MessageSquare size={18} color={colors.accent} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: colors.text,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {chat.title || 'Untitled Chat'}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textMuted, flexShrink: 0 }}>
                    {chat.updated_at ? new Date(chat.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                  </div>
                  <ArrowRight size={14} color={colors.textMuted} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Section */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: 600,
            color: colors.text,
            marginBottom: '24px',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <Sparkles size={24} style={{ color: colors.accent }} />
            EXPLORE FEATURES
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}>
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.href}
                  onClick={() => router.push(feature.href)}
                  style={{
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '16px',
                    padding: '28px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.accent;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    backgroundColor: feature.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                  }}>
                    <Icon size={28} style={{ color: feature.color }} />
                  </div>
                  
                  <h3 style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '18px',
                    fontWeight: 600,
                    color: colors.text,
                    marginBottom: '10px',
                    letterSpacing: '0.5px',
                  }}>
                    {feature.title}
                  </h3>
                  
                  <p style={{
                    color: colors.textMuted,
                    fontSize: '14px',
                    marginBottom: '16px',
                    lineHeight: 1.6,
                  }}>
                    {feature.description}
                  </p>
                  
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: colors.accent,
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: "'Rajdhani', sans-serif",
                  }}>
                    Get Started <ArrowRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Tips */}
        <div style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          padding: isMobile ? '24px' : '32px',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}>
          <h3 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '20px',
            fontWeight: 600,
            color: colors.text,
            marginBottom: '16px',
            letterSpacing: '0.5px',
          }}>
            💡 QUICK TIPS
          </h3>
          <ul style={{
            margin: 0,
            paddingLeft: '24px',
            color: colors.textMuted,
            fontSize: '14px',
            lineHeight: 2,
          }}>
            <li>Start with the <strong style={{ color: colors.text }}>AFL Generator</strong> to create your first trading strategy</li>
            <li>Use <strong style={{ color: colors.text }}>AI Chat</strong> to refine your strategies and ask questions</li>
            <li>Upload documents to <strong style={{ color: colors.text }}>Knowledge Base</strong> for better AI responses</li>
            <li>Analyze your backtest results to get AI-powered insights and improvements</li>
            <li>Try <strong style={{ color: colors.text }}>Reverse Engineer</strong> to convert strategy descriptions into code</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


