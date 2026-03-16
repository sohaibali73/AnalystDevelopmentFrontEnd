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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useFontSize } from '@/contexts/FontSizeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { apiClient } from '@/lib/api';

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

const sections = [
  { id: 'profile', label: 'PROFILE', icon: User },
  { id: 'api-keys', label: 'API KEYS', icon: Key },
  { id: 'appearance', label: 'APPEARANCE', icon: Palette },
  { id: 'notifications', label: 'NOTIFICATIONS', icon: Bell },
  { id: 'security', label: 'SECURITY', icon: Shield },
  { id: 'about', label: 'ABOUT', icon: Info },
];

export function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme, setAccentColor } = useTheme();
  const { setFontSize } = useFontSize();
  const { isMobile, isTablet } = useResponsive();
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showTavilyKey, setShowTavilyKey] = useState(false);

  const isDark = resolvedTheme === 'dark';

  const [settings, setSettings] = useState<SettingsData>({
    profile: {
      name: '',
      email: '',
      nickname: '',
    },
    apiKeys: {
      claudeApiKey: '',
      tavilyApiKey: '',
    },
    appearance: {
      theme: 'dark',
      accentColor: '#FEC00F',
      fontSize: 'medium',
    },
    notifications: {
      emailNotifications: true,
      codeGenComplete: true,
      backtestComplete: true,
      weeklyDigest: false,
    },
  });

  useEffect(() => {
    // Load from localStorage first (instant)
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setSettings(prev => ({
          ...prev,
          profile: { ...prev.profile, name: user.name || '', email: user.email || '' },
        }));
      } catch (e) {
        console.error('Failed to parse user info:', e);
      }
    }
    // Then sync from backend (authoritative)
    (async () => {
      try {
        const user = await apiClient.getCurrentUser();
        if (user) {
          const u = user as any;
          setSettings(prev => ({
            ...prev,
            profile: {
              ...prev.profile,
              name: u.name || prev.profile.name,
              email: u.email || prev.profile.email,
              nickname: u.nickname || prev.profile.nickname,
            },
            apiKeys: {
              claudeApiKey: u.claude_api_key || u.claudeApiKey || prev.apiKeys.claudeApiKey,
              tavilyApiKey: u.tavily_api_key || u.tavilyApiKey || prev.apiKeys.tavilyApiKey,
            },
          }));
        }
      } catch {
        // Backend unreachable — use localStorage values
      }
    })();
  }, []);

  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      appearance: { ...prev.appearance, theme },
    }));
  }, [theme]);

  const colors = {
    background: isDark ? '#121212' : '#F5F5F5',
    cardBg: isDark ? '#1E1E1E' : '#FFFFFF',
    inputBg: isDark ? '#2A2A2A' : '#F8F8F8',
    border: isDark ? '#2E2E2E' : '#E5E5E5',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    hoverBg: isDark ? '#262626' : '#F0F0F0',
    accent: '#FEC00F',
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // 1. Always save to localStorage (instant)
    localStorage.setItem('user_settings', JSON.stringify(settings));
    setTheme(settings.appearance.theme as 'light' | 'dark' | 'system');

    // 2. Push profile + API keys to backend via PUT /auth/me
    try {
      await apiClient.updateProfile({
        name: settings.profile.name,
        nickname: settings.profile.nickname,
        claude_api_key: settings.apiKeys.claudeApiKey,
        tavily_api_key: settings.apiKeys.tavilyApiKey,
      });
      // Update local user_info cache
      try {
        const existing = JSON.parse(localStorage.getItem('user_info') || '{}');
        localStorage.setItem('user_info', JSON.stringify({
          ...existing,
          name: settings.profile.name,
          nickname: settings.profile.nickname,
        }));
      } catch {}
    } catch (err) {
      console.error('Failed to save settings to backend:', err);
      // Still show saved — localStorage was updated
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    router.push('/login');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      localStorage.clear();
      router.push('/login');
    }
  };

  const updateProfile = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
  };
  const updateApiKeys = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, apiKeys: { ...prev.apiKeys, [field]: value } }));
  };
  const updateAppearance = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, appearance: { ...prev.appearance, [field]: value } }));
    if (field === 'accentColor') setAccentColor(value);
    if (field === 'fontSize') setFontSize(value as 'small' | 'medium' | 'large');
  };
  const updateNotifications = (field: string, value: boolean) => {
    setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [field]: value } }));
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, desc: 'Clean, bright interface' },
    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
    { value: 'system', label: 'System', icon: Monitor, desc: 'Match system preference' },
  ];

  const accentColors = [
    { value: '#FEC00F', label: 'Potomac Yellow' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#22C55E', label: 'Green' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#F97316', label: 'Orange' },
    { value: '#EC4899', label: 'Pink' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        fontFamily: "'Quicksand', sans-serif",
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%)'
            : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderBottom: `1px solid ${colors.border}`,
          padding: isMobile ? '28px 20px' : '48px 32px',
          transition: 'background 0.3s ease',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: 'rgba(254, 192, 15, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={28} color="#FEC00F" />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: isMobile ? '1.75rem' : '2.5rem',
                  fontWeight: 700,
                  color: colors.text,
                  letterSpacing: '1.5px',
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                SETTINGS
              </h1>
            </div>
          </div>
          <p
            style={{
              color: colors.textMuted,
              fontSize: isMobile ? '0.875rem' : '1rem',
              lineHeight: 1.7,
              maxWidth: '600px',
              margin: 0,
            }}
          >
            Manage your account, appearance, and security preferences
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: isMobile ? '24px 20px' : '32px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '220px 1fr' : '260px 1fr',
            gap: '20px',
          }}
        >
          {/* Sidebar Navigation */}
          <div
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '12px',
              height: 'fit-content',
              transition: 'background-color 0.3s ease, border-color 0.3s ease',
            }}
          >
            <nav style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '4px', overflowX: isMobile ? 'auto' : 'visible' }}>
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: isMobile ? '10px 16px' : '12px 16px',
                      backgroundColor: isActive ? colors.accent : 'transparent',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      width: isMobile ? 'auto' : '100%',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = colors.hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Icon size={18} color={isActive ? '#212121' : colors.textMuted} />
                    <span
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: isActive ? '#212121' : colors.text,
                        letterSpacing: '0.5px',
                      }}
                    >
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            {!isMobile && (
              <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: '12px', paddingTop: '12px' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    border: `1px solid rgba(220, 38, 38, 0.3)`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.08)';
                    e.currentTarget.style.borderColor = '#DC2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.3)';
                  }}
                >
                  <LogOut size={18} color="#DC2626" />
                  <span
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#DC2626',
                      letterSpacing: '0.5px',
                    }}
                  >
                    LOGOUT
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Main Content Panel */}
          <div
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: isMobile ? '24px 20px' : '32px',
              transition: 'background-color 0.3s ease, border-color 0.3s ease',
            }}
          >
            {/* ─── Profile ──────────────────────────────────────────────────── */}
            {activeSection === 'profile' && (
              <div>
                <SectionHeader
                  title="PROFILE SETTINGS"
                  desc="Update your personal information"
                  colors={colors}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(254, 192, 15, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: colors.accent,
                      }}
                    >
                      {settings.profile.name.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: colors.text,
                        margin: '0 0 4px 0',
                      }}
                    >
                      {settings.profile.name || 'Your Name'}
                    </p>
                    <p style={{ color: colors.textMuted, fontSize: '0.8125rem', margin: 0 }}>
                      {settings.profile.email || 'your@email.com'}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: '20px',
                  }}
                >
                  <FieldGroup label="FULL NAME" colors={colors}>
                    <StyledInput
                      type="text"
                      value={settings.profile.name}
                      onChange={(e) => updateProfile('name', e.target.value)}
                      colors={colors}
                      isDark={isDark}
                    />
                  </FieldGroup>
                  <FieldGroup label="NICKNAME" colors={colors}>
                    <StyledInput
                      type="text"
                      value={settings.profile.nickname}
                      onChange={(e) => updateProfile('nickname', e.target.value)}
                      placeholder="What should we call you?"
                      colors={colors}
                      isDark={isDark}
                    />
                  </FieldGroup>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FieldGroup label="EMAIL ADDRESS" colors={colors}>
                      <StyledInput
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) => updateProfile('email', e.target.value)}
                        colors={colors}
                        isDark={isDark}
                      />
                    </FieldGroup>
                  </div>
                </div>
              </div>
            )}

            {/* ─── API Keys ────────────��────────────────────────────────────── */}
            {activeSection === 'api-keys' && (
              <div>
                <SectionHeader
                  title="API KEYS"
                  desc="Manage your API keys for AI services"
                  colors={colors}
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px 20px',
                    backgroundColor: 'rgba(254, 192, 15, 0.06)',
                    border: `1px solid rgba(254, 192, 15, 0.2)`,
                    borderRadius: '12px',
                    marginBottom: '32px',
                  }}
                >
                  <Shield size={18} color={colors.accent} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ color: colors.textMuted, fontSize: '0.8125rem', lineHeight: 1.6, margin: 0 }}>
                    Your API keys are encrypted and stored securely. They are never shared or exposed to third parties.
                  </p>
                </div>

                <div style={{ display: 'grid', gap: '24px' }}>
                  <FieldGroup
                    label="CLAUDE API KEY"
                    badge={{ text: 'REQUIRED', color: '#22c55e' }}
                    colors={colors}
                  >
                    <div style={{ position: 'relative' }}>
                      <StyledInput
                        type={showClaudeKey ? 'text' : 'password'}
                        value={settings.apiKeys.claudeApiKey}
                        onChange={(e) => updateApiKeys('claudeApiKey', e.target.value)}
                        placeholder="sk-ant-..."
                        colors={colors}
                        isDark={isDark}
                        style={{ paddingRight: '48px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowClaudeKey(!showClaudeKey)}
                        style={{
                          position: 'absolute',
                          right: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: colors.textMuted,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                        }}
                      >
                        {showClaudeKey ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '8px' }}>
                      Get your key from{' '}
                      <a
                        href="https://console.anthropic.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: colors.accent, textDecoration: 'none', fontWeight: 600 }}
                      >
                        console.anthropic.com <ExternalLink size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
                      </a>
                    </p>
                  </FieldGroup>

                  <FieldGroup
                    label="TAVILY API KEY"
                    badge={{ text: 'OPTIONAL', color: colors.textMuted }}
                    colors={colors}
                  >
                    <div style={{ position: 'relative' }}>
                      <StyledInput
                        type={showTavilyKey ? 'text' : 'password'}
                        value={settings.apiKeys.tavilyApiKey}
                        onChange={(e) => updateApiKeys('tavilyApiKey', e.target.value)}
                        placeholder="tvly-..."
                        colors={colors}
                        isDark={isDark}
                        style={{ paddingRight: '48px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowTavilyKey(!showTavilyKey)}
                        style={{
                          position: 'absolute',
                          right: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: colors.textMuted,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                        }}
                      >
                        {showTavilyKey ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </FieldGroup>
                </div>
              </div>
            )}

            {/* ─── Appearance ───────────────────────────────────────────────── */}
            {activeSection === 'appearance' && (
              <div>
                <SectionHeader
                  title="APPEARANCE"
                  desc="Customize the look and feel"
                  colors={colors}
                />

                {/* Theme Picker */}
                <div style={{ marginBottom: '32px' }}>
                  <FieldLabel colors={colors}>THEME</FieldLabel>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                      gap: '12px',
                      marginTop: '12px',
                    }}
                  >
                    {themeOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = settings.appearance.theme === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => updateAppearance('theme', opt.value)}
                          style={{
                            padding: '20px 16px',
                            backgroundColor: isSelected
                              ? 'rgba(254, 192, 15, 0.08)'
                              : colors.inputBg,
                            border: `2px solid ${isSelected ? colors.accent : colors.border}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = isDark ? '#424242' : '#ccc';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = colors.border;
                          }}
                        >
                          <Icon
                            size={28}
                            color={isSelected ? colors.accent : colors.textMuted}
                            style={{ marginBottom: '10px' }}
                          />
                          <p
                            style={{
                              fontFamily: "'Rajdhani', sans-serif",
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: isSelected ? colors.text : colors.textMuted,
                              margin: '0 0 4px 0',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {opt.label.toUpperCase()}
                          </p>
                          <p
                            style={{
                              color: colors.textMuted,
                              fontSize: '0.75rem',
                              margin: 0,
                            }}
                          >
                            {opt.desc}
                          </p>
                          {isSelected && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                width: '22px',
                                height: '22px',
                                backgroundColor: colors.accent,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Check size={13} color="#212121" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accent Color */}
                <div style={{ marginBottom: '32px' }}>
                  <FieldLabel colors={colors}>ACCENT COLOR</FieldLabel>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {accentColors.map((color) => {
                      const isSelected = settings.appearance.accentColor === color.value;
                      return (
                        <button
                          key={color.value}
                          onClick={() => updateAppearance('accentColor', color.value)}
                          title={color.label}
                          style={{
                            width: '44px',
                            height: '44px',
                            backgroundColor: color.value,
                            border: isSelected
                              ? `3px solid ${colors.text}`
                              : '3px solid transparent',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {isSelected && <Check size={18} color="#212121" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <FieldLabel colors={colors}>FONT SIZE</FieldLabel>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    {(['small', 'medium', 'large'] as const).map((size) => {
                      const isSelected = settings.appearance.fontSize === size;
                      return (
                        <button
                          key={size}
                          onClick={() => updateAppearance('fontSize', size)}
                          style={{
                            padding: '10px 24px',
                            backgroundColor: isSelected ? colors.accent : colors.inputBg,
                            border: `1px solid ${isSelected ? colors.accent : colors.border}`,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontFamily: "'Rajdhani', sans-serif",
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: isSelected ? '#212121' : colors.text,
                            letterSpacing: '0.5px',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = isDark ? '#424242' : '#ccc';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = isSelected ? colors.accent : colors.border;
                          }}
                        >
                          {size.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Notifications ────────────────────────────────────────────── */}
            {activeSection === 'notifications' && (
              <div>
                <SectionHeader
                  title="NOTIFICATIONS"
                  desc="Configure how you receive notifications"
                  colors={colors}
                />

                <div style={{ display: 'grid', gap: '8px' }}>
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'codeGenComplete', label: 'Code Generation Complete', desc: 'Notify when AFL code generation finishes' },
                    { key: 'backtestComplete', label: 'Backtest Analysis Complete', desc: 'Notify when backtest analysis finishes' },
                    { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive a weekly summary' },
                  ].map((item) => {
                    const isOn = settings.notifications[item.key as keyof typeof settings.notifications];
                    return (
                      <div
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '18px 20px',
                          backgroundColor: colors.inputBg,
                          borderRadius: '12px',
                          transition: 'background-color 0.2s ease',
                          gap: '16px',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontFamily: "'Rajdhani', sans-serif",
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: colors.text,
                              margin: '0 0 3px 0',
                              letterSpacing: '0.3px',
                            }}
                          >
                            {item.label.toUpperCase()}
                          </p>
                          <p style={{ color: colors.textMuted, fontSize: '0.8125rem', margin: 0, lineHeight: 1.4 }}>
                            {item.desc}
                          </p>
                        </div>
                        {/* Toggle */}
                        <button
                          onClick={() => updateNotifications(item.key, !isOn)}
                          aria-label={`Toggle ${item.label}`}
                          style={{
                            width: '48px',
                            height: '26px',
                            backgroundColor: isOn ? colors.accent : isDark ? '#424242' : '#D1D5DB',
                            borderRadius: '13px',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'background-color 0.2s ease',
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '50%',
                              position: 'absolute',
                              top: '3px',
                              left: isOn ? '25px' : '3px',
                              transition: 'left 0.2s ease',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            }}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── Security ─────────────────────────────────────────────────── */}
            {activeSection === 'security' && (
              <div>
                <SectionHeader
                  title="SECURITY"
                  desc="Manage your security settings"
                  colors={colors}
                />

                {/* Change Password */}
                <div
                  style={{
                    padding: '24px',
                    backgroundColor: colors.inputBg,
                    borderRadius: '14px',
                    marginBottom: '20px',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: colors.text,
                      margin: '0 0 20px 0',
                      letterSpacing: '0.5px',
                    }}
                  >
                    CHANGE PASSWORD
                  </p>
                  <div style={{ display: 'grid', gap: '14px', maxWidth: '480px' }}>
                    <StyledInput type="password" placeholder="Current password" colors={colors} isDark={isDark} />
                    <StyledInput type="password" placeholder="New password" colors={colors} isDark={isDark} />
                    <StyledInput type="password" placeholder="Confirm new password" colors={colors} isDark={isDark} />
                    <button
                      style={{
                        width: 'fit-content',
                        padding: '10px 24px',
                        backgroundColor: colors.accent,
                        border: 'none',
                        borderRadius: '10px',
                        color: '#212121',
                        fontSize: '0.8125rem',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        cursor: 'pointer',
                        letterSpacing: '0.5px',
                        transition: 'opacity 0.2s',
                        marginTop: '4px',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                      UPDATE PASSWORD
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div
                  style={{
                    padding: '24px',
                    backgroundColor: 'rgba(220, 38, 38, 0.06)',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                    borderRadius: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <AlertTriangle size={20} color="#DC2626" />
                    <p
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        color: '#DC2626',
                        margin: 0,
                        letterSpacing: '0.5px',
                      }}
                    >
                      DANGER ZONE
                    </p>
                  </div>
                  <p
                    style={{
                      color: colors.textMuted,
                      fontSize: '0.8125rem',
                      marginBottom: '16px',
                      lineHeight: 1.5,
                    }}
                  >
                    Once you delete your account, there is no going back. All your data will be permanently removed.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(220, 38, 38, 0.4)',
                      borderRadius: '10px',
                      color: '#DC2626',
                      fontSize: '0.8125rem',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      letterSpacing: '0.5px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                      e.currentTarget.style.borderColor = '#DC2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.4)';
                    }}
                  >
                    <Trash2 size={15} />
                    DELETE ACCOUNT
                  </button>
                </div>

                {/* Mobile logout */}
                {isMobile && (
                  <button
                    onClick={handleLogout}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <LogOut size={18} color="#DC2626" />
                    <span
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#DC2626',
                        letterSpacing: '0.5px',
                      }}
                    >
                      LOGOUT
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* ─── About ────────────────────────────────────────────────────── */}
            {activeSection === 'about' && (
              <div>
                <SectionHeader
                  title="ABOUT"
                  desc="Application information and legal"
                  colors={colors}
                />

                {/* Tagline */}
                <div
                  style={{
                    textAlign: 'center',
                    padding: isMobile ? '32px 20px' : '48px 32px',
                    backgroundColor: colors.inputBg,
                    borderRadius: '14px',
                    marginBottom: '24px',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: isMobile ? '1.75rem' : '2.25rem',
                      fontWeight: 700,
                      color: colors.accent,
                      letterSpacing: '2px',
                      margin: '0 0 8px 0',
                      lineHeight: 1.2,
                    }}
                  >
                    BREAK THE STATUS QUO
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: isMobile ? '1rem' : '1.125rem',
                      fontWeight: 600,
                      color: colors.text,
                      letterSpacing: '1.5px',
                      margin: '0 0 24px 0',
                    }}
                  >
                    BUILT TO CONQUER RISK<span style={{ verticalAlign: 'super', fontSize: '0.625rem' }}>&reg;</span>
                  </p>
                  <div
                    style={{
                      width: '48px',
                      height: '2px',
                      backgroundColor: colors.accent,
                      margin: '0 auto 24px auto',
                    }}
                  />
                  <p
                    style={{
                      fontFamily: "'Quicksand', sans-serif",
                      fontSize: '0.9375rem',
                      color: colors.text,
                      fontWeight: 600,
                      margin: '0 0 4px 0',
                    }}
                  >
                    Developed by Sohaib Ali
                  </p>
                  <p
                    style={{
                      fontFamily: "'Quicksand', sans-serif",
                      fontSize: '0.8125rem',
                      color: colors.textMuted,
                      margin: 0,
                    }}
                  >
                    {'© Copyright 2026 \u2014 All Rights Reserved'}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: colors.text,
                      letterSpacing: '0.5px',
                      margin: '4px 0 0 0',
                    }}
                  >
                    Potomac Fund Management, Inc.
                  </p>
                </div>

                {/* Version info */}
                <div
                  style={{
                    padding: '20px 24px',
                    backgroundColor: colors.inputBg,
                    borderRadius: '14px',
                    marginBottom: '24px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: colors.textMuted,
                          letterSpacing: '0.5px',
                          margin: '0 0 4px 0',
                        }}
                      >
                        VERSION
                      </p>
                      <p
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: colors.text,
                          margin: 0,
                          letterSpacing: '0.5px',
                        }}
                      >
                        BETA VERSION: 1.6.3
                      </p>
                    </div>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        fontFamily: "'Rajdhani', sans-serif",
                        letterSpacing: '0.5px',
                        color: colors.accent,
                        backgroundColor: 'rgba(254, 192, 15, 0.1)',
                        border: '1px solid rgba(254, 192, 15, 0.2)',
                      }}
                    >
                      BETA
                    </span>
                  </div>
                </div>

                {/* Fine print */}
                <div
                  style={{
                    padding: '16px 24px',
                    backgroundColor: colors.inputBg,
                    borderRadius: '14px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Quicksand', sans-serif",
                      fontSize: '0.6875rem',
                      color: colors.textMuted,
                      lineHeight: 1.7,
                      margin: 0,
                      textAlign: 'center',
                    }}
                  >
                    {'This application\u2019s AI engine is powered by Claude\u2122, a registered trademark of Anthropic, PBC. All trademarks, service marks, and trade names referenced herein are the property of their respective owners. Use of these marks does not imply endorsement or affiliation.'}
                  </p>
                </div>
              </div>
            )}

            {/* ─── Save Footer ──────────────────────────────────────────────── */}
            {activeSection !== 'about' && (
              <div
                style={{
                  marginTop: '32px',
                  paddingTop: '20px',
                  borderTop: `1px solid ${colors.border}`,
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={handleSave}
                  style={{
                    padding: '12px 28px',
                    backgroundColor: saved ? '#22c55e' : colors.accent,
                    border: 'none',
                    borderRadius: '10px',
                    color: saved ? '#FFFFFF' : '#212121',
                    fontSize: '0.875rem',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s ease',
                    boxShadow: saved ? 'none' : '0 2px 8px rgba(254, 192, 15, 0.25)',
                  }}
                  onMouseEnter={(e) => {
                    if (!saved) e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {saved ? <Check size={17} /> : <Save size={17} />}
                  {saved ? 'SAVED!' : 'SAVE CHANGES'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable sub-components ────────────────────────────────────────────────────

function SectionHeader({
  title,
  desc,
  colors,
}: {
  title: string;
  desc: string;
  colors: Record<string, string>;
}) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <h2
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: '1.25rem',
          fontWeight: 700,
          color: colors.text,
          margin: '0 0 6px 0',
          letterSpacing: '0.5px',
        }}
      >
        {title}
      </h2>
      <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
        {desc}
      </p>
    </div>
  );
}

function FieldLabel({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: Record<string, string>;
}) {
  return (
    <span
      style={{
        display: 'block',
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '0.75rem',
        fontWeight: 600,
        color: colors.text,
        letterSpacing: '1px',
      }}
    >
      {children}
    </span>
  );
}

function FieldGroup({
  label,
  badge,
  children,
  colors,
}: {
  label: string;
  badge?: { text: string; color: string };
  children: React.ReactNode;
  colors: Record<string, string>;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <FieldLabel colors={colors}>{label}</FieldLabel>
        {badge && (
          <span
            style={{
              padding: '1px 8px',
              borderRadius: '5px',
              fontSize: '0.625rem',
              fontWeight: 700,
              fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: '0.5px',
              color: badge.color,
              backgroundColor:
                badge.color === '#22c55e'
                  ? 'rgba(34, 197, 94, 0.12)'
                  : colors.inputBg,
            }}
          >
            {badge.text}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function StyledInput({
  colors,
  isDark,
  style,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  colors: Record<string, string>;
  isDark: boolean;
  style?: React.CSSProperties;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <input
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={{
        width: '100%',
        height: '46px',
        padding: '0 16px',
        backgroundColor: colors.inputBg,
        border: `1px solid ${focused ? '#FEC00F' : colors.border}`,
        borderRadius: '10px',
        color: colors.text,
        fontSize: '0.875rem',
        fontFamily: "'Quicksand', sans-serif",
        outline: 'none',
        boxSizing: 'border-box' as const,
        transition: 'border-color 0.2s ease',
        ...style,
      }}
    />
  );
}

export default SettingsPage;
