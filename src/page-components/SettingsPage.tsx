'use client'

import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Key,
  Palette,
  Bell,
  Shield,
  Save,
  Eye,
  EyeOff,
  Check,
  Sun,
  Moon,
  Monitor,
  Trash2,
  LogOut,
  AlertTriangle,
  ExternalLink,
  Info,
  Sparkles,
  ArrowRight,
  Waves,
  Trees,
  Sunset,
  Flower2,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useFontSize } from '@/contexts/FontSizeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { apiClient } from '@/lib/api';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsData {
  profile: {
    name: string;
    email: string;
    nickname: string;
  };
  apiKeys: {
    claudeApiKey: string;
    tavilyApiKey: string;
  };
  appearance: {
    theme: string;
    accentColor: string;
    fontSize: string;
  };
  notifications: {
    emailNotifications: boolean;
    codeGenComplete: boolean;
    backtestComplete: boolean;
    weeklyDigest: boolean;
  };
}

const sectionsList = [
  { id: 'profile', label: 'PROFILE', icon: User, color: '#A78BFA' },
  { id: 'api-keys', label: 'API KEYS', icon: Key, color: '#FEC00F' },
  { id: 'appearance', label: 'APPEARANCE', icon: Palette, color: '#60A5FA' },
  { id: 'notifications', label: 'NOTIFICATIONS', icon: Bell, color: '#34D399' },
  { id: 'security', label: 'SECURITY', icon: Shield, color: '#FB923C' },
  { id: 'about', label: 'ABOUT', icon: Info, color: '#EC4899' },
];

/* ─────────────────────────────────────────────
   Dashboard-style animations & global styles
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

  @keyframes settings-fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes settings-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.35; transform: scale(0.6); }
  }
  @keyframes settings-shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .sa0 { animation: settings-fadeUp .6s cubic-bezier(.22,.68,0,1.15) both; animation-delay: 0ms; }
  .sa1 { animation: settings-fadeUp .6s cubic-bezier(.22,.68,0,1.15) both; animation-delay: 80ms; }
  .sa2 { animation: settings-fadeUp .6s cubic-bezier(.22,.68,0,1.15) both; animation-delay: 160ms; }
  .sa3 { animation: settings-fadeUp .6s cubic-bezier(.22,.68,0,1.15) both; animation-delay: 240ms; }

  .settings-nav-btn {
    transition: all .22s cubic-bezier(.22,.68,0,1.2);
  }
  .settings-nav-btn:hover {
    transform: translateY(-2px);
  }

  .settings-card {
    position: relative;
    overflow: hidden;
    transition: transform .28s cubic-bezier(.22,.68,0,1.2), box-shadow .28s ease, border-color .28s ease;
  }
  .settings-card:hover {
    transform: translateY(-3px);
  }
  .settings-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(254,192,15,0.04) 0%, transparent 60%);
    opacity: 0;
    transition: opacity .28s ease;
    pointer-events: none;
  }
  .settings-card:hover::before { opacity: 1; }

  .settings-card .shimmer-layer {
    position: absolute;
    top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(254,192,15,0.04), transparent);
    pointer-events: none;
  }
  .settings-card:hover .shimmer-layer {
    animation: settings-shimmer .65s ease forwards;
  }

  .stat-num-glow {
    text-shadow: 0 0 40px rgba(254,192,15,0.35);
  }
`;

/* ── Section header ornament (from Dashboard) ── */
function SectionHead({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
      <div style={{
        width: '3px', height: '16px',
        background: 'linear-gradient(to bottom, #FEC00F, rgba(254,192,15,0.2))',
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
    </div>
  );
}

export function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, themeStyle, setThemeStyle, resolvedTheme, accentColor, setAccentColor } = useTheme();
  const { setFontSize } = useFontSize();
  const { isMobile, isTablet } = useResponsive();
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showTavilyKey, setShowTavilyKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDark = resolvedTheme === 'dark';

  const [settings, setSettings] = useState<SettingsData>({
    profile: { name: '', email: '', nickname: '' },
    apiKeys: { claudeApiKey: '', tavilyApiKey: '' },
    appearance: { theme: 'dark', accentColor: '#FEC00F', fontSize: 'medium' },
    notifications: { emailNotifications: true, codeGenComplete: true, backtestComplete: true, weeklyDigest: false },
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      try { setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) })); } catch {}
    }
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setSettings(prev => ({ ...prev, profile: { ...prev.profile, name: user.name || '', email: user.email || '' } }));
      } catch {}
    }
    (async () => {
      try {
        const user = await apiClient.getCurrentUser();
        if (user) {
          const u = user as any;
          setSettings(prev => ({
            ...prev,
            profile: { ...prev.profile, name: u.name || prev.profile.name, email: u.email || prev.profile.email, nickname: u.nickname || prev.profile.nickname },
            apiKeys: { claudeApiKey: u.claude_api_key || u.claudeApiKey || prev.apiKeys.claudeApiKey, tavilyApiKey: u.tavily_api_key || u.tavilyApiKey || prev.apiKeys.tavilyApiKey },
          }));
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    setSettings(prev => ({ ...prev, appearance: { ...prev.appearance, theme } }));
  }, [theme]);

  /* CSS variables are now set globally by ThemeContext */

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('user_settings', JSON.stringify(settings));
    setTheme(settings.appearance.theme as 'light' | 'dark' | 'system');
    try {
      await apiClient.updateProfile({
        name: settings.profile.name, nickname: settings.profile.nickname,
        claude_api_key: settings.apiKeys.claudeApiKey, tavily_api_key: settings.apiKeys.tavilyApiKey,
      });
      try {
        const existing = JSON.parse(localStorage.getItem('user_info') || '{}');
        localStorage.setItem('user_info', JSON.stringify({ ...existing, name: settings.profile.name, nickname: settings.profile.nickname }));
      } catch {}
    } catch {}
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => { localStorage.removeItem('auth_token'); localStorage.removeItem('user_info'); router.push('/login'); };
  const handleDeleteAccount = () => { if (confirm('Are you sure? This cannot be undone.')) { localStorage.clear(); router.push('/login'); } };

  const updateProfile = (f: string, v: string) => setSettings(p => ({ ...p, profile: { ...p.profile, [f]: v } }));
  const updateApiKeys = (f: string, v: string) => setSettings(p => ({ ...p, apiKeys: { ...p.apiKeys, [f]: v } }));
  const updateAppearance = (f: string, v: string) => {
    setSettings(p => ({ ...p, appearance: { ...p.appearance, [f]: v } }));
    // Immediately apply theme changes for instant feedback
    if (f === 'theme') setTheme(v as 'light' | 'dark' | 'system');
    if (f === 'accentColor') setAccentColor(v);
    if (f === 'fontSize') setFontSize(v as 'small' | 'medium' | 'large');
  };
  const updateNotifications = (f: string, v: boolean) => setSettings(p => ({ ...p, notifications: { ...p.notifications, [f]: v } }));

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, desc: 'Clean, bright interface', color: '#FB923C' },
    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes', color: '#A78BFA' },
    { value: 'system', label: 'System', icon: Monitor, desc: 'Match your OS', color: '#60A5FA' },
  ];

  const themeStyleOptions = [
    { value: 'default', label: 'Default', icon: Zap, desc: 'Classic Potomac yellow', color: '#FEC00F' },
    { value: 'midnight', label: 'Midnight', icon: Moon, desc: 'Deep purple elegance', color: '#818CF8' },
    { value: 'ocean', label: 'Ocean', icon: Waves, desc: 'Calm teal waters', color: '#22D3EE' },
    { value: 'forest', label: 'Forest', icon: Trees, desc: 'Natural green vibes', color: '#4ADE80' },
    { value: 'sunset', label: 'Sunset', icon: Sunset, desc: 'Warm orange glow', color: '#FB923C' },
    { value: 'rose', label: 'Rose', icon: Flower2, desc: 'Soft pink elegance', color: '#F472B6' },
  ];

  const accentColors = [
    { value: '#FEC00F', label: 'Potomac Yellow' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#22C55E', label: 'Green' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#F97316', label: 'Orange' },
    { value: '#EC4899', label: 'Pink' },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '46px', padding: '0 16px',
    backgroundColor: 'var(--bg-raised)',
    border: '1px solid var(--border)',
    borderRadius: '10px', color: 'var(--text)',
    fontSize: '14px', fontFamily: "'Instrument Sans', sans-serif",
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div style={{
        minHeight: '100vh',
        background: `radial-gradient(ellipse 120% 60% at 50% -10%, var(--accent-dim) 0%, transparent 60%), var(--bg)`,
        fontFamily: "'Instrument Sans', sans-serif",
        color: 'var(--text)',
      }}>

        {/* ── Top accent bar ── */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, var(--accent) 40%, var(--accent-glow) 60%, transparent 100%)', opacity: 0.5 }} />

        {/* ── Hero Header ── */}
        <div className="sa0" style={{ padding: isMobile ? '40px 20px 32px' : '56px 52px 44px', maxWidth: '1360px', margin: '0 auto' }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: isDark ? 'rgba(254,192,15,0.07)' : 'rgba(254,192,15,0.08)',
            border: '1px solid rgba(254,192,15,0.2)',
            borderRadius: '100px', padding: '5px 14px 5px 10px', marginBottom: '24px',
          }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', animation: 'settings-pulse 2.4s ease-in-out infinite' }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)' }}>
              Configuration · Active
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: isMobile ? '36px' : '52px',
            fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.04, color: 'var(--text)', marginBottom: '12px',
          }}>
            <span style={{ color: 'var(--accent)' }}>Settings</span>
            <span style={{ display: 'block', fontWeight: 400, fontSize: isMobile ? '18px' : '24px', color: 'var(--text-muted)', marginTop: '6px', letterSpacing: '-0.01em' }}>
              Manage your account, appearance, and preferences.
            </span>
          </h1>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="sa1" style={{ padding: isMobile ? '0 20px' : '0 52px', maxWidth: '1360px', margin: '0 auto 32px' }}>
          <div style={{
            display: 'flex', gap: '10px', flexWrap: 'wrap',
            borderBottom: '1px solid var(--border)', paddingBottom: '16px',
          }}>
            {sectionsList.map(({ id, label, icon: Icon, color }) => {
              const isActive = activeSection === id;
              return (
                <button key={id} className="settings-nav-btn" onClick={() => setActiveSection(id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    padding: '10px 18px',
                    background: isActive ? 'var(--accent-dim)' : 'var(--bg-card)',
                    border: isActive ? '1px solid rgba(254,192,15,0.4)' : '1px solid var(--border)',
                    borderRadius: '9px', cursor: 'pointer',
                    fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: isActive ? 'var(--accent)' : 'var(--text)',
                    boxShadow: isActive ? '0 4px 20px var(--accent-dim)' : 'var(--shadow-card)',
                    transition: 'all .22s ease',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--accent)'; }}}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}}
                >
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '7px',
                    background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={13} color={color} />
                  </div>
                  {!isMobile && label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content Area ── */}
        <div className="sa2" style={{ padding: isMobile ? '0 20px 64px' : '0 52px 80px', maxWidth: '1360px', margin: '0 auto' }}>

          {/* ═══ PROFILE ═══ */}
          {activeSection === 'profile' && (
            <div>
              <SectionHead label="Profile Settings" />
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap: '20px' }}>

                {/* Profile card */}
                <div className="settings-card" style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px',
                  padding: '32px', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden',
                }}>
                  <div className="shimmer-layer" />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(90deg, #A78BFA, transparent)', opacity: 0.6 }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '20px', margin: '0 auto 16px',
                      background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(254,192,15,0.1))',
                      border: '2px solid rgba(167,139,250,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(167,139,250,0.2)',
                    }}>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '32px', fontWeight: 800, color: '#A78BFA' }}>
                        {settings.profile.name.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                      {settings.profile.name || 'Your Name'}
                    </h3>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      {settings.profile.email || 'your@email.com'}
                    </p>
                    {settings.profile.nickname && (
                      <span style={{ display: 'inline-block', marginTop: '12px', padding: '4px 12px', borderRadius: '100px', fontSize: '10px', fontWeight: 600, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--border-hover)' }}>
                        {settings.profile.nickname}
                      </span>
                    )}
                  </div>
                </div>

                {/* Form */}
                <div className="settings-card" style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px',
                  padding: '32px', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden',
                }}>
                  <div className="shimmer-layer" />
                  <div style={{ display: 'grid', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                      <div>
                        <FieldLabel>FULL NAME</FieldLabel>
                        <input type="text" value={settings.profile.name} onChange={e => updateProfile('name', e.target.value)}
                          style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                      </div>
                      <div>
                        <FieldLabel>NICKNAME</FieldLabel>
                        <input type="text" value={settings.profile.nickname} onChange={e => updateProfile('nickname', e.target.value)} placeholder="What should we call you?"
                          style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>EMAIL ADDRESS</FieldLabel>
                      <input type="email" value={settings.profile.email} onChange={e => updateProfile('email', e.target.value)}
                        style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ API KEYS ═══ */}
          {activeSection === 'api-keys' && (
            <div>
              <SectionHead label="API Key Management" />

              {/* Security notice */}
              <div className="settings-card" style={{
                background: 'var(--bg-card)', border: '1px solid rgba(254,192,15,0.2)', borderRadius: '16px',
                padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px',
                boxShadow: 'var(--shadow-card)',
              }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(254,192,15,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={16} color="#FEC00F" />
                </div>
                <div>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Encrypted & Secure</p>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                    Your API keys are encrypted and stored securely. They are never shared or exposed to third parties.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                {/* Claude Key */}
                <div className="settings-card" style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px',
                  padding: '28px', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden',
                }}>
                  <div className="shimmer-layer" />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(90deg, #34D399, transparent)', opacity: 0.6 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <FieldLabel>CLAUDE API KEY</FieldLabel>
                    <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '9px', fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', color: '#34D399', background: 'rgba(52,211,153,0.12)' }}>REQUIRED</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input type={showClaudeKey ? 'text' : 'password'} value={settings.apiKeys.claudeApiKey}
                      onChange={e => updateApiKeys('claudeApiKey', e.target.value)} placeholder="sk-ant-..."
                      style={{ ...inputStyle, paddingRight: '48px' }}
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                    <button type="button" onClick={() => setShowClaudeKey(!showClaudeKey)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}>
                      {showClaudeKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '10px', fontFamily: "'DM Mono', monospace", letterSpacing: '0.03em' }}>
                    Get your key from{' '}
                    <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer"
                      style={{ color: '#FEC00F', textDecoration: 'none', fontWeight: 600 }}>
                      console.anthropic.com <ExternalLink size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    </a>
                  </p>
                </div>

                {/* Tavily Key */}
                <div className="settings-card" style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px',
                  padding: '28px', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden',
                }}>
                  <div className="shimmer-layer" />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(90deg, #60A5FA, transparent)', opacity: 0.6 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <FieldLabel>TAVILY API KEY</FieldLabel>
                    <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '9px', fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', color: 'var(--text-muted)', background: 'var(--bg-raised)' }}>OPTIONAL</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input type={showTavilyKey ? 'text' : 'password'} value={settings.apiKeys.tavilyApiKey}
                      onChange={e => updateApiKeys('tavilyApiKey', e.target.value)} placeholder="tvly-..."
                      style={{ ...inputStyle, paddingRight: '48px' }}
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                    <button type="button" onClick={() => setShowTavilyKey(!showTavilyKey)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}>
                      {showTavilyKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ APPEARANCE ═══ */}
          {activeSection === 'appearance' && (
            <div>
              <SectionHead label="Appearance & Theme" />

              {/* Theme Mode Picker */}
              <div style={{ marginBottom: '32px' }}>
                <FieldLabel>THEME MODE</FieldLabel>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginTop: '14px' }}>
                  {themeOptions.map(opt => {
                    const Icon = opt.icon;
                    const isSel = settings.appearance.theme === opt.value;
                    return (
                      <motion.div
                        key={opt.value}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="settings-card" onClick={() => updateAppearance('theme', opt.value)}
                          style={{
                            background: 'var(--bg-card)', border: isSel ? `2px solid ${opt.color}` : '1px solid var(--border)',
                            borderRadius: '20px', padding: '28px', cursor: 'pointer', textAlign: 'center',
                            boxShadow: isSel ? `0 8px 32px ${opt.color}25` : 'var(--shadow-card)', position: 'relative', overflow: 'hidden',
                          }}>
                          <div className="shimmer-layer" />
                          {isSel && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${opt.color}, transparent)` }} />}
                          <div style={{
                            width: '52px', height: '52px', borderRadius: '14px', margin: '0 auto 14px',
                            background: `linear-gradient(135deg, ${opt.color}20, ${opt.color}08)`,
                            border: `1px solid ${opt.color}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 8px 24px ${opt.color}20`,
                          }}>
                            <Icon size={24} color={opt.color} />
                          </div>
                          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: isSel ? 'var(--text)' : 'var(--text-muted)', marginBottom: '4px', letterSpacing: '-0.01em' }}>
                            {opt.label}
                          </p>
                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>{opt.desc}</p>
                          {isSel && (
                            <div style={{ position: 'absolute', top: '12px', right: '12px', width: '24px', height: '24px', backgroundColor: opt.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${opt.color}40` }}>
                              <Check size={14} color="#09090B" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Theme Style Picker */}
              <div style={{ marginBottom: '32px' }}>
                <FieldLabel>THEME STYLE</FieldLabel>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '12px', marginTop: '14px' }}>
                  {themeStyleOptions.map(opt => {
                    const Icon = opt.icon;
                    const isSel = themeStyle === opt.value;
                    return (
                      <motion.div
                        key={opt.value}
                        whileHover={{ scale: 1.03, y: -3 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <div
                          onClick={() => setThemeStyle(opt.value as any)}
                          style={{
                            background: 'var(--bg-card)',
                            border: isSel ? `2px solid ${opt.color}` : '1px solid var(--border)',
                            borderRadius: '16px', padding: '20px', cursor: 'pointer', textAlign: 'center',
                            boxShadow: isSel ? `0 6px 24px ${opt.color}20` : 'var(--shadow-card)',
                            position: 'relative', overflow: 'hidden',
                            transition: 'all 0.25s ease',
                          }}
                        >
                          {isSel && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${opt.color}, transparent)` }} />}
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px', margin: '0 auto 10px',
                            background: `linear-gradient(135deg, ${opt.color}25, ${opt.color}08)`,
                            border: `1px solid ${opt.color}35`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Icon size={20} color={opt.color} />
                          </div>
                          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 700, color: isSel ? 'var(--text)' : 'var(--text-muted)', marginBottom: '2px' }}>
                            {opt.label}
                          </p>
                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: 'var(--text-muted)', margin: 0 }}>{opt.desc}</p>
                          {isSel && (
                            <div style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', backgroundColor: opt.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={12} color="#09090B" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color */}
              <div className="settings-card" style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px',
                padding: '28px', boxShadow: 'var(--shadow-card)', marginBottom: '20px', position: 'relative', overflow: 'hidden',
              }}>
                <div className="shimmer-layer" />
                <FieldLabel>ACCENT COLOR</FieldLabel>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '14px' }}>
                  {accentColors.map(c => {
                    const isSel = accentColor === c.value;
                    return (
                      <button key={c.value} onClick={() => updateAppearance('accentColor', c.value)} title={c.label}
                        style={{
                          width: '48px', height: '48px', backgroundColor: c.value,
                          border: isSel ? '3px solid var(--text)' : '3px solid transparent',
                          borderRadius: '14px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s ease', boxShadow: isSel ? `0 4px 16px ${c.value}40` : 'none',
                          transform: isSel ? 'scale(1.1)' : 'scale(1)',
                        }}>
                        {isSel && <Check size={18} color="#09090B" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size */}
              <div className="settings-card" style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px',
                padding: '28px', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden',
              }}>
                <div className="shimmer-layer" />
                <FieldLabel>FONT SIZE</FieldLabel>
                <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
                  {(['small', 'medium', 'large'] as const).map(size => {
                    const isSel = settings.appearance.fontSize === size;
                    return (
                      <button key={size} onClick={() => updateAppearance('fontSize', size)}
                        style={{
                          padding: '12px 28px', background: isSel ? 'var(--accent)' : 'var(--bg-raised)',
                          border: isSel ? '1px solid var(--accent)' : '1px solid var(--border)',
                          borderRadius: '10px', cursor: 'pointer',
                          fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 700,
                          color: isSel ? '#09090B' : 'var(--text)',
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          transition: 'all 0.2s ease',
                          boxShadow: isSel ? '0 4px 16px var(--accent-glow)' : 'none',
                        }}>
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══ NOTIFICATIONS ═══ */}
          {activeSection === 'notifications' && (
            <div>
              <SectionHead label="Notification Preferences" />
              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email', color: '#A78BFA' },
                  { key: 'codeGenComplete', label: 'Code Generation Complete', desc: 'Notify when AFL code generation finishes', color: '#60A5FA' },
                  { key: 'backtestComplete', label: 'Backtest Analysis Complete', desc: 'Notify when backtest analysis finishes', color: '#FB923C' },
                  { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive a weekly summary', color: '#34D399' },
                ].map(item => {
                  const isOn = settings.notifications[item.key as keyof typeof settings.notifications];
                  return (
                    <div key={item.key} className="settings-card" style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px',
                      padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: '16px', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden',
                    }}>
                      <div className="shimmer-layer" />
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: `linear-gradient(90deg, ${item.color}, transparent)`, opacity: isOn ? 0.6 : 0.15 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Bell size={15} color={item.color} />
                        </div>
                        <div>
                          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px', letterSpacing: '-0.01em' }}>
                            {item.label}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
                        </div>
                      </div>
                      <button onClick={() => updateNotifications(item.key, !isOn)} aria-label={`Toggle ${item.label}`}
                        style={{
                          width: '48px', height: '26px',
                          backgroundColor: isOn ? 'var(--accent)' : isDark ? 'rgba(255,255,255,0.08)' : '#D1D5DB',
                          borderRadius: '13px', border: 'none', cursor: 'pointer', position: 'relative',
                          transition: 'background-color 0.2s ease', flexShrink: 0,
                          boxShadow: isOn ? '0 2px 8px rgba(254,192,15,0.3)' : 'none',
                        }}>
                        <div style={{
                          width: '20px', height: '20px', backgroundColor: '#FFFFFF', borderRadius: '50%',
                          position: 'absolute', top: '3px', left: isOn ? '25px' : '3px',
                          transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ SECURITY ═══ */}
          {activeSection === 'security' && (
            <div>
              <SectionHead label="Security & Access" />

              {/* Change Password */}
              <div className="settings-card" style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px',
                padding: '32px', boxShadow: 'var(--shadow-card)', marginBottom: '20px', position: 'relative', overflow: 'hidden',
              }}>
                <div className="shimmer-layer" />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(90deg, #FB923C, transparent)', opacity: 0.6 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(251,146,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Key size={15} color="#FB923C" />
                  </div>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Change Password</span>
                </div>
                <div style={{ display: 'grid', gap: '14px', maxWidth: '480px' }}>
                  <input type="password" placeholder="Current password" style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                  <input type="password" placeholder="New password" style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                  <input type="password" placeholder="Confirm new password" style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                  <button style={{
                    width: 'fit-content', padding: '12px 28px', background: 'var(--accent)', border: 'none',
                    borderRadius: '10px', color: '#09090B', fontFamily: "'Syne', sans-serif",
                    fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    cursor: 'pointer', boxShadow: '0 4px 16px rgba(254,192,15,0.3)', transition: 'all 0.2s ease', marginTop: '4px',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(254,192,15,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(254,192,15,0.3)'; }}
                  >
                    Update Password
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="settings-card" style={{
                background: isDark ? 'rgba(220,38,38,0.04)' : 'rgba(220,38,38,0.03)',
                border: '1px solid rgba(220,38,38,0.2)', borderRadius: '20px',
                padding: '28px', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #DC2626, transparent)', opacity: 0.6 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <AlertTriangle size={18} color="#DC2626" />
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: '#DC2626' }}>Danger Zone</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.6 }}>
                  Once you delete your account, there is no going back. All your data will be permanently removed.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={handleDeleteAccount} style={{
                    padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid rgba(220,38,38,0.4)',
                    borderRadius: '10px', color: '#DC2626', fontSize: '11px', fontFamily: "'Syne', sans-serif",
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.1)'; e.currentTarget.style.borderColor = '#DC2626'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.4)'; }}
                  >
                    <Trash2 size={14} /> Delete Account
                  </button>
                  <button onClick={handleLogout} style={{
                    padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid rgba(220,38,38,0.3)',
                    borderRadius: '10px', color: '#DC2626', fontSize: '11px', fontFamily: "'Syne', sans-serif",
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ ABOUT ═══ */}
          {activeSection === 'about' && (
            <div>
              <SectionHead label="About the Platform" />

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                {/* Brand card */}
                <div className="settings-card" style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px',
                  padding: '40px 32px', boxShadow: 'var(--shadow-card)', textAlign: 'center', position: 'relative', overflow: 'hidden',
                  gridColumn: isMobile ? '1' : '1 / -1',
                }}>
                  <div className="shimmer-layer" />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />
                  <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(254,192,15,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

                  <h2 className="stat-num-glow" style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? '28px' : '40px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em', marginBottom: '8px', lineHeight: 1.1 }}>
                    BREAK THE STATUS QUO
                  </h2>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? '14px' : '16px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '24px' }}>
                    Built to Conquer Risk<span style={{ verticalAlign: 'super', fontSize: '8px' }}>&reg;</span>
                  </p>
                  <div style={{ width: '48px', height: '2px', backgroundColor: 'var(--accent)', margin: '0 auto 24px auto' }} />
                  <p style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 600, marginBottom: '4px' }}>Developed by Sohaib Ali</p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    {'© Copyright 2026 \u2014 All Rights Reserved'}
                  </p>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginTop: '4px', letterSpacing: '-0.01em' }}>
                    Potomac Fund Management, Inc.
                  </p>
                </div>

                {/* Version */}
                <div className="settings-card" style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px',
                  padding: '24px', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden',
                }}>
                  <div className="shimmer-layer" />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(90deg, var(--accent), transparent)', opacity: 0.6 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Version</p>
                      <p className="stat-num-glow" style={{ fontFamily: "'DM Mono', monospace", fontSize: '28px', fontWeight: 400, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>RC 3.0</p>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: '6px' }}>Release Candidate 3.0</p>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '9px', fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--border-hover)' }}>RC 3</span>
                  </div>
                </div>

                {/* Legal */}
                <div className="settings-card" style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px',
                  padding: '24px', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden',
                }}>
                  <div className="shimmer-layer" />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(90deg, #EC4899, transparent)', opacity: 0.6 }} />
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Legal</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '16px' }}>
                    {"This application\u2019s AI engine is powered by Claude\u2122, a registered trademark of Anthropic, PBC. All trademarks are property of their respective owners."}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <a href="/terms" target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '7px 14px',
                        background: isDark ? 'rgba(236,72,153,0.08)' : 'rgba(236,72,153,0.06)',
                        border: '1px solid rgba(236,72,153,0.25)',
                        borderRadius: '8px',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em',
                        color: '#EC4899', textDecoration: 'none',
                        textTransform: 'uppercase' as const,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(236,72,153,0.15)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.5)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(236,72,153,0.08)' : 'rgba(236,72,153,0.06)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.25)'; }}
                    >
                      <ExternalLink size={10} />
                      Terms of Service
                    </a>
                    <a href="/privacy" target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '7px 14px',
                        background: isDark ? 'rgba(236,72,153,0.08)' : 'rgba(236,72,153,0.06)',
                        border: '1px solid rgba(236,72,153,0.25)',
                        borderRadius: '8px',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em',
                        color: '#EC4899', textDecoration: 'none',
                        textTransform: 'uppercase' as const,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(236,72,153,0.15)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.5)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(236,72,153,0.08)' : 'rgba(236,72,153,0.06)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.25)'; }}
                    >
                      <ExternalLink size={10} />
                      Privacy Policy
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Save Footer ── */}
          {activeSection !== 'about' && (
            <div className="sa3" style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleSave} className="dash-cta-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  padding: '15px 32px',
                  background: saved ? '#34D399' : 'var(--accent)',
                  color: '#09090B', border: 'none', borderRadius: '10px',
                  fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                  boxShadow: saved ? '0 4px 16px rgba(52,211,153,0.35)' : '0 4px 24px rgba(254,192,15,0.35)',
                  transition: 'all 0.2s ease',
                }}>
                {saved ? <Check size={15} /> : <Save size={15} />}
                {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

/* ── Reusable field label ── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'block', fontFamily: "'DM Mono', monospace",
      fontSize: '9px', fontWeight: 500, letterSpacing: '0.16em',
      textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '10px',
    }}>
      {children}
    </span>
  );
}

export default SettingsPage;
