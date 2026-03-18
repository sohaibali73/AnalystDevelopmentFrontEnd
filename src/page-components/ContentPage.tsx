'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  LayoutDashboard,
  Code2,
  MessageCircle,
  Database,
  TrendingUp,
  Zap,
  ArrowRight,
  Sparkles,
  FileText,
  Plus
} from 'lucide-react';

export default function ContentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const features = [
    {
      icon: Code2,
      title: 'AFL Generator',
      description: 'Generate AmiBroker Formula Language code from plain-language descriptions.',
      href: '/afl',
      color: '#60A5FA',
    },
    {
      icon: MessageCircle,
      title: 'AI Chat',
      description: 'Discuss trading strategies and get contextual, intelligent assistance.',
      href: '/chat',
      color: '#A78BFA',
    },
    {
      icon: Database,
      title: 'Knowledge Base',
      description: 'Upload and semantically search your trading documents and archives.',
      href: '/knowledge',
      color: '#34D399',
    },
    {
      icon: TrendingUp,
      title: 'Backtest Analysis',
      description: 'Decode backtest reports with AI-powered performance breakdowns.',
      href: '/backtest',
      color: '#FB923C',
    },
    {
      icon: Zap,
      title: 'Reverse Engineer',
      description: 'Convert strategy logic and descriptions directly into working AFL code.',
      href: '/reverse-engineer',
      color: '#FEC00F',
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? '#080809' : '#F5F5F6',
      color: isDark ? '#EFEFEF' : '#0A0A0B',
      fontFamily: "'Instrument Sans', sans-serif",
      padding: '40px 20px',
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: '40px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <div style={{
            width: '6px',
            height: '24px',
            background: 'linear-gradient(to bottom, #FEC00F, rgba(254,192,15,0.2))',
            borderRadius: '3px',
          }} />
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: isDark ? '#606068' : '#808088',
          }}>
            Content Hub
          </span>
        </div>

        <h1 style={{
          fontSize: '42px',
          fontWeight: 800,
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #FEC00F, #A78BFA)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Your Trading Content
        </h1>

        <p style={{
          fontSize: '16px',
          color: isDark ? '#A0A0A8' : '#666666',
          lineHeight: 1.6,
          maxWidth: '600px',
        }}>
          Access all your trading tools, documents, and AI-powered features in one place.
        </p>
      </div>

      {/* Feature Grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
      }}>
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              onClick={() => router.push(feature.href)}
              style={{
                background: isDark ? '#0D0D10' : '#FFFFFF',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
                borderRadius: '16px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = `${feature.color}44`;
                e.currentTarget.style.boxShadow = `0 8px 24px ${feature.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Accent line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: feature.color,
                opacity: 0.3,
              }} />

              {/* Icon background */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${feature.color}15`,
                border: `1px solid ${feature.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <Icon size={24} color={feature.color} />
              </div>

              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '8px',
                color: isDark ? '#EFEFEF' : '#0A0A0B',
              }}>
                {feature.title}
              </h3>

              <p style={{
                fontSize: '14px',
                color: isDark ? '#A0A0A8' : '#666666',
                lineHeight: 1.5,
                marginBottom: '16px',
              }}>
                {feature.description}
              </p>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: `${feature.color}10`,
                borderRadius: '8px',
                border: `1px solid ${feature.color}20`,
                fontSize: '12px',
                fontWeight: 600,
                color: feature.color,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                Open tool
                <ArrowRight size={12} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div style={{
        maxWidth: '1200px',
        margin: '40px auto 0',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'New Chat', icon: Plus, href: '/chat', color: '#A78BFA' },
          { label: 'Generate AFL', icon: Code2, href: '/afl', color: '#60A5FA' },
          { label: 'Upload Document', icon: FileText, href: '/knowledge', color: '#34D399' },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: isDark ? '#121216' : '#FFFFFF',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '12px',
                fontWeight: 600,
                color: isDark ? '#EFEFEF' : '#0A0A0B',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${action.color}44`;
                e.currentTarget.style.background = `${action.color}10`;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
                e.currentTarget.style.background = isDark ? '#121216' : '#FFFFFF';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Icon size={14} color={action.color} />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}