'use client'

import React, { useState, useCallback } from 'react'
import {
  Code2,
  ArrowRight,
  Database,
  MessageCircle,
  TrendingUp,
  Zap,
  Settings,
  LayoutDashboard,
  Sparkles,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Copy,
  Check,
  BookOpen,
  GitBranch,
  Shield,
  Paintbrush,
  Monitor,
  Search,
  Upload,
  Eye,
  LogIn,
  LogOut,
  Plus,
  Trash2,
  FileText,
  Laptop,
  ChevronLeft,
  ChevronUp,
  Wifi,
  BatteryFull,
  Signal,
  Smartphone,
  Tablet,
  Tv,
  Mic,
  ClipboardCopy,
  Volume2,
  Activity,
  Bell,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

// ========================================================================
// ANDROID STATUS BAR
// ========================================================================

function AndroidStatusBar() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', height: '100%' }}>
      <span style={{ fontSize: '10px', fontWeight: 600, color: '#fff', fontFamily: 'system-ui, sans-serif' }}>12:30</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Signal size={10} color="#fff" />
        <Wifi size={10} color="#fff" />
        <BatteryFull size={12} color="#fff" />
      </div>
    </div>
  )
}

// ========================================================================
// ANDROID DEVICE FRAME
// ========================================================================

function AndroidPhoneFrame({
  children,
  label,
  isActive,
  onClick,
  colors,
  size = 'normal',
}: {
  children: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
  colors: Record<string, string>
  size?: 'small' | 'normal' | 'large'
}) {
  const dims = {
    small: { w: 180, h: 380, r: 20, p: 6, punch: 8 },
    normal: { w: 280, h: 580, r: 26, p: 10, punch: 10 },
    large: { w: 340, h: 700, r: 30, p: 12, punch: 12 },
  }
  const d = dims[size]

  return (
    <div onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', transition: 'all 0.3s ease', transform: isActive ? 'scale(1.02)' : 'scale(1)' }}>
      <div
        style={{
          width: `${d.w}px`,
          height: `${d.h}px`,
          borderRadius: `${d.r}px`,
          border: `3px solid ${isActive ? '#FEC00F' : colors.border}`,
          backgroundColor: '#000000',
          padding: `${d.p}px`,
          position: 'relative',
          boxShadow: isActive
            ? '0 0 40px rgba(254, 192, 15, 0.15), 0 20px 60px rgba(0,0,0,0.4)'
            : '0 20px 60px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Punch-hole camera */}
        <div style={{ position: 'absolute', top: `${d.p + 6}px`, left: '50%', transform: 'translateX(-50%)', width: `${d.punch}px`, height: `${d.punch}px`, borderRadius: '50%', backgroundColor: '#1a1a2e', border: '1px solid #2a2a2a', zIndex: 10 }} />
        {/* Power button */}
        <div style={{ position: 'absolute', right: '-3px', top: '110px', width: '3px', height: '45px', backgroundColor: isActive ? '#FEC00F' : colors.border, borderRadius: '0 2px 2px 0' }} />
        {/* Volume buttons */}
        <div style={{ position: 'absolute', right: '-3px', top: '170px', width: '3px', height: '30px', backgroundColor: isActive ? '#FEC00F' : colors.border, borderRadius: '0 2px 2px 0' }} />
        <div style={{ position: 'absolute', right: '-3px', top: '210px', width: '3px', height: '30px', backgroundColor: isActive ? '#FEC00F' : colors.border, borderRadius: '0 2px 2px 0' }} />
        {/* Screen */}
        <div style={{ width: '100%', height: '100%', borderRadius: `${d.r - 6}px`, overflow: 'hidden', backgroundColor: colors.screenBg }}>
          {children}
        </div>
        {/* Android gesture bar */}
        <div style={{ position: 'absolute', bottom: `${d.p + 4}px`, left: '50%', transform: 'translateX(-50%)', width: `${d.w * 0.3}px`, height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.25)' }} />
      </div>
      {label && (
        <p style={{ textAlign: 'center', marginTop: '14px', fontFamily: "'Rajdhani', sans-serif", fontSize: size === 'small' ? '11px' : '14px', fontWeight: 600, letterSpacing: '1px', color: isActive ? '#FEC00F' : colors.textMuted, transition: 'color 0.3s ease' }}>
          {label}
        </p>
      )}
    </div>
  )
}

// ========================================================================
// ANDROID TABLET FRAME
// ========================================================================

function AndroidTabletFrame({
  children,
  label,
  isActive,
  onClick,
  colors,
}: {
  children: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
  colors: Record<string, string>
}) {
  return (
    <div onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', transition: 'all 0.3s ease' }}>
      <div
        style={{
          width: '520px',
          height: '380px',
          borderRadius: '16px',
          border: `3px solid ${isActive ? '#FEC00F' : colors.border}`,
          backgroundColor: '#000000',
          padding: '10px',
          position: 'relative',
          boxShadow: isActive ? '0 0 40px rgba(254, 192, 15, 0.12), 0 20px 60px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Front camera */}
        <div style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1a1a2e', border: '1px solid #2a2a2a', zIndex: 10 }} />
        <div style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden', backgroundColor: colors.screenBg }}>
          {children}
        </div>
        {/* Gesture bar */}
        <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', width: '100px', height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
      </div>
      {label && (
        <p style={{ textAlign: 'center', marginTop: '14px', fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '1px', color: isActive ? '#FEC00F' : colors.textMuted }}>
          {label}
        </p>
      )}
    </div>
  )
}

// ========================================================================
// WINDOWS DESKTOP FRAME
// ========================================================================

function WindowsFrame({
  children,
  label,
  colors,
  title = 'Analyst Workbench',
}: {
  children: React.ReactNode
  label: string
  colors: Record<string, string>
  title?: string
}) {
  const [showSnap, setShowSnap] = useState(false)
  return (
    <div>
      <div
        style={{
          width: '620px',
          borderRadius: '8px',
          border: `2px solid ${colors.border}`,
          backgroundColor: '#1a1a1a',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Windows title bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: '36px', backgroundColor: '#202020', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', overflow: 'hidden' }}>
              <img src="/potomac-icon.png" alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: '12px', color: '#ccc', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>{title}</span>
          </div>
          {/* Window controls with Snap Layout on maximize hover */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '46px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <div style={{ width: '10px', height: '1px', backgroundColor: '#999' }} />
            </div>
            <div
              onMouseEnter={() => setShowSnap(true)}
              onMouseLeave={() => setShowSnap(false)}
              style={{ width: '46px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
            >
              <div style={{ width: '9px', height: '9px', border: '1px solid #999', borderRadius: '1px' }} />
              {/* Snap Layout popup */}
              {showSnap && (
                <div style={{ position: 'absolute', top: '34px', right: '0', width: '120px', padding: '8px', borderRadius: '6px', backgroundColor: '#2a2a2a', border: '1px solid #444', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 100 }}>
                  <span style={{ fontSize: '8px', color: '#999', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Snap layouts</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {[
                      ['50%', '50%'],
                      ['33%', '67%'],
                      ['25%', '25%', '50%'],
                      ['25%', '25%', '25%', '25%'],
                    ].map((layout, i) => (
                      <div key={i} style={{ display: 'flex', gap: '2px', padding: '4px', borderRadius: '3px', backgroundColor: i === 0 ? 'rgba(254,192,15,0.15)' : 'transparent', border: `1px solid ${i === 0 ? 'rgba(254,192,15,0.3)' : '#444'}`, cursor: 'pointer' }}>
                        {layout.map((w, j) => (
                          <div key={j} style={{ width: w, height: '12px', borderRadius: '1px', backgroundColor: i === 0 ? '#FEC00F' : '#555' }} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ width: '46px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '0 6px 0 0' }}>
              <span style={{ fontSize: '16px', color: '#999', fontFamily: 'system-ui', lineHeight: 1 }}>{'x'}</span>
            </div>
          </div>
        </div>
        {/* Screen content */}
        <div style={{ height: '380px', overflow: 'hidden', backgroundColor: colors.screenBg }}>
          {children}
        </div>
        {/* Windows Taskbar */}
        <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', backgroundColor: '#1a1a1a', borderTop: '1px solid #333', padding: '0 12px' }}>
          <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <div style={{ width: '12px', height: '12px', background: 'linear-gradient(135deg, #0078d4 25%, #0050a0 25%, #0050a0 50%, #0078d4 50%, #0078d4 75%, #0050a0 75%)', borderRadius: '2px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '4px', backgroundColor: '#262626', flex: 1, maxWidth: '160px' }}>
            <Search size={10} color="#666" />
            <span style={{ fontSize: '9px', color: '#666' }}>Search</span>
          </div>
          <div style={{ width: '16px', height: '16px', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(254,192,15,0.3)' }}>
            <img src="/potomac-icon.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#888' }}>
            <Wifi size={9} color="#888" />
            <Volume2 size={9} color="#888" />
            <span>9:41</span>
          </div>
        </div>
      </div>
      {label && (
        <p style={{ textAlign: 'center', marginTop: '14px', fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '1px', color: colors.textMuted }}>
          {label}
        </p>
      )}
    </div>
  )
}

// ========================================================================
// ANDROID SCREEN MOCKUPS
// ========================================================================

function AndroidSplashMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0B', position: 'relative' }}>
      <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(254,192,15,0.08) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 8px 32px rgba(254,192,15,0.2)' }}>
          <img src="/potomac-icon.png" alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '24px', color: '#fff', letterSpacing: '6px' }}>ANALYST</span>
        <span style={{ fontSize: '9px', color: '#FEC00F', letterSpacing: '5px', marginTop: '6px', fontWeight: 600 }}>BY POTOMAC</span>
        {/* Material 3 progress indicator */}
        <div style={{ marginTop: '40px', width: '40px', height: '3px', borderRadius: '2px', backgroundColor: '#2A2A2A', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', width: '50%', height: '100%', backgroundColor: '#FEC00F', borderRadius: '2px', animation: 'shimmer 1.5s ease-in-out infinite', left: '-50%' }} />
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: '40px' }}>
        <span style={{ fontSize: '8px', color: '#555', letterSpacing: '2px' }}>VERSION 1.0</span>
      </div>
    </div>
  )
}

function AndroidLoginMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0A0A0B' }}>
      <div style={{ height: '28px', padding: '6px 0 0' }}><AndroidStatusBar /></div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', overflow: 'hidden', marginBottom: '14px', boxShadow: '0 4px 20px rgba(254,192,15,0.15)' }}>
          <img src="/potomac-icon.png" alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '20px', color: '#fff', letterSpacing: '3px' }}>ANALYST</span>
        <span style={{ fontSize: '9px', color: '#FEC00F', letterSpacing: '4px', marginTop: '4px' }}>BY POTOMAC</span>
      </div>
      <div style={{ padding: '20px', borderTop: '1px solid #2A2A2A' }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>WELCOME BACK</span>
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '9px', color: '#9E9E9E', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.5px' }}>EMAIL</div>
          {/* Material 3 outlined text field */}
          <div style={{ height: '40px', borderRadius: '4px', backgroundColor: 'transparent', border: '2px solid #555', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
            <span style={{ fontSize: '10px', color: '#555' }}>you@example.com</span>
          </div>
        </div>
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ fontSize: '9px', color: '#9E9E9E', fontWeight: 600, letterSpacing: '0.5px' }}>PASSWORD</div>
            <span style={{ fontSize: '8px', color: '#FEC00F' }}>Forgot?</span>
          </div>
          <div style={{ height: '40px', borderRadius: '4px', backgroundColor: 'transparent', border: '2px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
            <span style={{ fontSize: '10px', color: '#555' }}>{'*'.repeat(8)}</span>
            <Eye size={12} color="#555" />
          </div>
        </div>
        {/* Material 3 filled button */}
        <div style={{ marginTop: '14px', height: '40px', borderRadius: '20px', backgroundColor: '#FEC00F', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <LogIn size={14} color="#0A0A0B" />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: 700, color: '#0A0A0B', letterSpacing: '1px' }}>SIGN IN</span>
        </div>
        {/* Fingerprint */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '15px', border: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={14} color="#757575" />
          </div>
          <span style={{ fontSize: '9px', color: '#757575' }}>Sign in with Biometrics</span>
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <span style={{ fontSize: '9px', color: '#757575' }}>{"Don't have an account? "}</span>
          <span style={{ fontSize: '9px', color: '#FEC00F', fontWeight: 600 }}>Create one</span>
        </div>
      </div>
    </div>
  )
}

function AndroidDashboardMockup({ colors }: { colors: Record<string, string> }) {
  const features = [
    { icon: Code2, label: 'AFL Generator', color: '#3B82F6', desc: 'Generate trading code' },
    { icon: MessageCircle, label: 'AI Chat', color: '#8B5CF6', desc: 'Ask Yang anything' },
    { icon: Database, label: 'Knowledge Base', color: '#22C55E', desc: '24 documents' },
    { icon: TrendingUp, label: 'Backtest', color: '#F97316', desc: 'Analyze strategies' },
  ]
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.screenBg }}>
      <div style={{ height: '28px', padding: '6px 0 0' }}><AndroidStatusBar /></div>
      <div style={{ padding: '4px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden' }}>
            <img src="/potomac-icon.png" alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '1px', display: 'block', lineHeight: 1.1 }}>
              Welcome, <span style={{ color: '#FEC00F' }}>Trader</span>
            </span>
            <span style={{ fontSize: '8px', color: '#9E9E9E' }}>Potomac Analyst Workbench</span>
          </div>
        </div>
        {/* Material 3 FAB-style CTA */}
        <div style={{ height: '36px', borderRadius: '18px', backgroundColor: '#FEC00F', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Sparkles size={12} color="#212121" />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '10px', fontWeight: 700, color: '#212121', letterSpacing: '0.5px' }}>START GENERATING</span>
        </div>
      </div>
      <div style={{ flex: 1, padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '11px', fontWeight: 600, color: '#9E9E9E', letterSpacing: '0.5px' }}>FEATURES</span>
        {features.map((f) => {
          const Icon = f.icon
          return (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: '#1E1E1E', borderRadius: '16px', border: '1px solid #2E2E2E' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} color={f.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#E8E8E8', display: 'block' }}>{f.label}</span>
                <span style={{ fontSize: '8px', color: '#757575' }}>{f.desc}</span>
              </div>
              <ArrowRight size={12} color="#FEC00F" />
            </div>
          )
        })}
      </div>
      <AndroidBottomNav active="Home" />
    </div>
  )
}

function AndroidChatMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.screenBg }}>
      <div style={{ height: '28px', padding: '6px 0 0' }}><AndroidStatusBar /></div>
      {/* Material 3 top app bar */}
      <div style={{ padding: '0 8px 8px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #2E2E2E' }}>
        <ChevronLeft size={22} color="#FEC00F" />
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '1px', flex: 1 }}>AI CHAT</span>
        <Plus size={18} color="#FEC00F" />
      </div>
      <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
        <div style={{ alignSelf: 'flex-end', maxWidth: '80%' }}>
          <div style={{ padding: '8px 12px', borderRadius: '18px 18px 4px 18px', backgroundColor: '#FEC00F', fontSize: '10px', color: '#0A0A0B', lineHeight: 1.4, fontWeight: 500 }}>
            Analyze AAPL for a momentum strategy
          </div>
          <span style={{ fontSize: '7px', color: '#555', display: 'block', textAlign: 'right', marginTop: '3px' }}>12:30 PM</span>
        </div>
        <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '9px', overflow: 'hidden' }}>
              <img src="/potomac-icon.png" alt="Yang" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: '9px', fontWeight: 600, color: '#FEC00F' }}>Yang</span>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: '4px 18px 18px 18px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
            <p style={{ fontSize: '9px', color: '#d4d4d4', lineHeight: 1.5, margin: 0 }}>
              Based on AAPL analysis, I recommend a dual moving average crossover with RSI confirmation...
            </p>
            <div style={{ marginTop: '8px', padding: '8px', borderRadius: '12px', backgroundColor: '#262626', border: '1px solid #333' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={10} color="#22C55E" />
                <span style={{ fontSize: '8px', fontWeight: 600, color: '#22C55E' }}>Stock Analysis</span>
              </div>
              <span style={{ fontSize: '8px', color: '#9E9E9E', marginTop: '4px', display: 'block' }}>AAPL: $198.45 (+2.3%)</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '8px 12px 12px', borderTop: '1px solid #2E2E2E' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '24px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
          <Plus size={14} color="#757575" />
          <span style={{ fontSize: '10px', color: '#757575', flex: 1 }}>Ask Yang anything...</span>
          <div style={{ width: '28px', height: '28px', borderRadius: '14px', backgroundColor: '#FEC00F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight size={12} color="#0A0A0B" />
          </div>
        </div>
      </div>
    </div>
  )
}

function AndroidAFLMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.screenBg }}>
      <div style={{ height: '28px', padding: '6px 0 0' }}><AndroidStatusBar /></div>
      <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #2E2E2E' }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>AFL GENERATOR</span>
      </div>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #2E2E2E' }}>
        <div style={{ padding: '10px 12px', borderRadius: '4px', backgroundColor: 'transparent', border: '2px solid #555' }}>
          <span style={{ fontSize: '9px', color: '#757575' }}>Describe your trading strategy...</span>
        </div>
      </div>
      <div style={{ flex: 1, padding: '10px 12px', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: '12px', backgroundColor: '#0d1117', border: '1px solid #2E2E2E', padding: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '9px', color: '#FEC00F', fontWeight: 600, fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px' }}>STRATEGY.AFL</span>
            <span style={{ fontSize: '8px', color: '#555', fontFamily: 'monospace' }}>line 1, col 1</span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '8px', lineHeight: 1.7, color: '#adbac7' }}>
            <div><span style={{ color: '#f47067' }}>// </span><span style={{ color: '#768390' }}>Momentum Strategy</span></div>
            <div><span style={{ color: '#6cb6ff' }}>FastMA</span> = <span style={{ color: '#dcbdfb' }}>MA</span>(C, <span style={{ color: '#6cb6ff' }}>10</span>);</div>
            <div><span style={{ color: '#6cb6ff' }}>SlowMA</span> = <span style={{ color: '#dcbdfb' }}>MA</span>(C, <span style={{ color: '#6cb6ff' }}>50</span>);</div>
            <div><span style={{ color: '#6cb6ff' }}>RSIVal</span> = <span style={{ color: '#dcbdfb' }}>RSI</span>(<span style={{ color: '#6cb6ff' }}>14</span>);</div>
            <div />
            <div><span style={{ color: '#f47067' }}>Buy</span> = <span style={{ color: '#dcbdfb' }}>Cross</span>(FastMA,SlowMA)</div>
            <div>  AND RSIVal {'<'} <span style={{ color: '#6cb6ff' }}>70</span>;</div>
            <div><span style={{ color: '#f47067' }}>Sell</span> = <span style={{ color: '#dcbdfb' }}>Cross</span>(SlowMA,FastMA)</div>
            <div>  OR RSIVal {'>'} <span style={{ color: '#6cb6ff' }}>80</span>;</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '8px 12px 12px', borderTop: '1px solid #2E2E2E', display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, height: '40px', borderRadius: '20px', backgroundColor: '#FEC00F', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Zap size={12} color="#212121" />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '10px', fontWeight: 700, color: '#212121' }}>GENERATE</span>
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: '20px', border: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Copy size={12} color="#9E9E9E" />
        </div>
      </div>
    </div>
  )
}

function AndroidKnowledgeMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.screenBg }}>
      <div style={{ height: '28px', padding: '6px 0 0' }}><AndroidStatusBar /></div>
      <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2E2E2E' }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>KNOWLEDGE BASE</span>
        <Plus size={18} color="#FEC00F" />
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '28px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
          <Search size={12} color="#757575" />
          <span style={{ fontSize: '10px', color: '#757575' }}>Search documents...</span>
        </div>
      </div>
      <div style={{ padding: '0 12px 8px', display: 'flex', gap: '8px' }}>
        {[
          { label: 'Documents', value: '24', color: '#FEC00F' },
          { label: 'Total Size', value: '12 MB', color: '#3B82F6' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, padding: '10px', borderRadius: '16px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
            <span style={{ fontSize: '8px', color: '#9E9E9E', display: 'block' }}>{s.label}</span>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: '0 12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {['Trading Strategies.pdf', 'RSI_Analysis.csv', 'Market_Report.pdf'].map((doc) => (
          <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '16px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
            <FileText size={14} color="#FEC00F" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#E8E8E8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc}</div>
              <div style={{ fontSize: '8px', color: '#757575', marginTop: '2px' }}>2 days ago</div>
            </div>
            <Trash2 size={12} color="#555" />
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ height: '38px', borderRadius: '20px', border: '1px dashed rgba(254,192,15,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Upload size={12} color="#FEC00F" />
          <span style={{ fontSize: '10px', color: '#FEC00F', fontWeight: 600 }}>Upload Document</span>
        </div>
      </div>
    </div>
  )
}

function AndroidBacktestMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.screenBg }}>
      <div style={{ height: '28px', padding: '6px 0 0' }}><AndroidStatusBar /></div>
      <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #2E2E2E' }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>BACKTEST</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ padding: '14px', borderRadius: '16px', border: '1px dashed rgba(254,192,15,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <Upload size={18} color="#FEC00F" />
          <span style={{ fontSize: '10px', color: '#FEC00F', fontWeight: 600 }}>Upload Results</span>
        </div>
      </div>
      <div style={{ padding: '0 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[
          { label: 'CAGR', value: '18.5%', color: '#22C55E' },
          { label: 'Sharpe', value: '1.82', color: '#3B82F6' },
          { label: 'Max DD', value: '-12.3%', color: '#DC2626' },
          { label: 'Win Rate', value: '67.2%', color: '#FEC00F' },
        ].map((m) => (
          <div key={m.label} style={{ padding: '10px', borderRadius: '16px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
            <span style={{ fontSize: '8px', color: '#9E9E9E' }}>{m.label}</span>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '18px', fontWeight: 700, color: m.color, marginTop: '2px' }}>{m.value}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: '10px 12px' }}>
        <div style={{ height: '100%', borderRadius: '16px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E', padding: '12px', display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
          {[40, 55, 45, 65, 50, 70, 60, 80, 75, 90, 85, 95].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: h > 60 ? 'rgba(34,197,94,0.4)' : 'rgba(254,192,15,0.3)', borderRadius: '4px 4px 0 0' }} />
          ))}
        </div>
      </div>
      <AndroidBottomNav active="More" />
    </div>
  )
}

function AndroidSettingsMockup({ colors }: { colors: Record<string, string> }) {
  const items = [
    { icon: Shield, label: 'Profile', desc: 'Name, email, nickname', color: '#3B82F6' },
    { icon: Settings, label: 'API Keys', desc: 'Claude, Tavily keys', color: '#F97316' },
    { icon: Paintbrush, label: 'Appearance', desc: 'Theme, colors, font', color: '#8B5CF6' },
    { icon: Sparkles, label: 'Notifications', desc: 'Email & push alerts', color: '#22C55E' },
    { icon: Eye, label: 'Security', desc: 'Password, fingerprint', color: '#DC2626' },
  ]
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.screenBg }}>
      <div style={{ height: '28px', padding: '6px 0 0' }}><AndroidStatusBar /></div>
      <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #2E2E2E' }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>SETTINGS</span>
      </div>
      <div style={{ padding: '14px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '22px', background: 'linear-gradient(135deg, #FEC00F, #FFD740)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#212121' }}>S</span>
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#E8E8E8' }}>Sohaib Ali</div>
          <div style={{ fontSize: '9px', color: '#757575' }}>sohaib@potomac.com</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '16px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '14px', backgroundColor: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} color={item.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#E8E8E8' }}>{item.label}</div>
                <div style={{ fontSize: '8px', color: '#757575', marginTop: '2px' }}>{item.desc}</div>
              </div>
              <ChevronRightIcon size={14} color="#555" />
            </div>
          )
        })}
      </div>
      <div style={{ padding: '12px' }}>
        <div style={{ height: '40px', borderRadius: '20px', border: '1px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <LogOut size={12} color="#DC2626" />
          <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: 600 }}>SIGN OUT</span>
        </div>
      </div>
    </div>
  )
}

// ── Android Bottom Nav (Material 3 style) ──────────────────────────────
function AndroidBottomNav({ active = 'Home' }: { active?: string }) {
  return (
    <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px', borderTop: '1px solid #2E2E2E', backgroundColor: '#0e0e0e', flexShrink: 0 }}>
      {[
        { icon: LayoutDashboard, label: 'Home' },
        { icon: MessageCircle, label: 'Chat' },
        { icon: Code2, label: 'AFL' },
        { icon: Database, label: 'KB' },
        { icon: Settings, label: 'More' },
      ].map((item) => {
        const Icon = item.icon
        const isActive = item.label === active
        return (
          <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', position: 'relative' }}>
            {/* Material 3 active indicator pill */}
            {isActive && <div style={{ position: 'absolute', top: '-2px', width: '32px', height: '20px', borderRadius: '10px', backgroundColor: 'rgba(254,192,15,0.15)' }} />}
            <Icon size={16} color={isActive ? '#FEC00F' : '#555'} style={{ position: 'relative', zIndex: 1 }} />
            <span style={{ fontSize: '7px', color: isActive ? '#FEC00F' : '#555', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Android Tablet Dashboard ───────────────────────────────────────────
function AndroidTabletDashboard({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', backgroundColor: colors.screenBg }}>
      {/* Navigation rail (Material 3) */}
      <div style={{ width: '80px', borderRight: '1px solid #2E2E2E', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#161616', flexShrink: 0, padding: '14px 0' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
          <img src="/potomac-icon.png" alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        {[
          { icon: LayoutDashboard, label: 'Home', active: true },
          { icon: MessageCircle, label: 'Chat', active: false },
          { icon: Code2, label: 'AFL', active: false },
          { icon: Database, label: 'KB', active: false },
          { icon: TrendingUp, label: 'Test', active: false },
          { icon: Settings, label: 'More', active: false },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginBottom: '8px', position: 'relative', padding: '6px 0' }}>
              {item.active && <div style={{ position: 'absolute', top: '2px', width: '32px', height: '20px', borderRadius: '10px', backgroundColor: 'rgba(254,192,15,0.15)' }} />}
              <Icon size={16} color={item.active ? '#FEC00F' : '#757575'} style={{ position: 'relative', zIndex: 1 }} />
              <span style={{ fontSize: '7px', color: item.active ? '#FEC00F' : '#757575', fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
            </div>
          )
        })}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2E2E2E' }}>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>
            Welcome, <span style={{ color: '#FEC00F' }}>Trader</span>
          </span>
        </div>
        <div style={{ flex: 1, padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', overflow: 'hidden' }}>
          {[
            { icon: Code2, label: 'AFL Generator', color: '#3B82F6', desc: 'Generate trading code' },
            { icon: MessageCircle, label: 'AI Chat', color: '#8B5CF6', desc: 'Ask Yang anything' },
            { icon: Database, label: 'Knowledge Base', color: '#22C55E', desc: '24 documents indexed' },
            { icon: TrendingUp, label: 'Backtest', color: '#F97316', desc: 'Analyze strategies' },
          ].map((f) => {
            const Icon = f.icon
            return (
              <div key={f.label} style={{ padding: '14px', borderRadius: '16px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '18px', backgroundColor: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={f.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#E8E8E8', display: 'block' }}>{f.label}</span>
                  <span style={{ fontSize: '8px', color: '#757575' }}>{f.desc}</span>
                </div>
                <ArrowRight size={14} color="#FEC00F" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Windows Dashboard ──────────────────────────────────────────────────
function WindowsDashboardMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', backgroundColor: colors.screenBg }}>
      {/* WinUI 3 NavigationView pane */}
      <div style={{ width: '200px', borderRight: '1px solid #2E2E2E', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a', flexShrink: 0 }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #2E2E2E' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '4px', overflow: 'hidden' }}>
            <img src="/potomac-icon.png" alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>ANALYST</span>
        </div>
        <div style={{ flex: 1, padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: true },
            { icon: Code2, label: 'AFL Generator', active: false },
            { icon: MessageCircle, label: 'AI Chat', active: false },
            { icon: Database, label: 'Knowledge', active: false },
            { icon: TrendingUp, label: 'Backtest', active: false },
            { icon: Sparkles, label: 'Content', active: false },
            { icon: Zap, label: 'Reverse Engineer', active: false },
            { icon: Settings, label: 'Settings', active: false },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '4px', backgroundColor: item.active ? 'rgba(254,192,15,0.12)' : 'transparent', borderLeft: item.active ? '3px solid #FEC00F' : '3px solid transparent' }}>
                <Icon size={14} color={item.active ? '#FEC00F' : '#757575'} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: item.active ? '#FEC00F' : '#9E9E9E', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>{item.label}</span>
              </div>
            )
          })}
        </div>
        <div style={{ padding: '10px 12px', borderTop: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #FEC00F, #FFD740)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '10px', color: '#212121' }}>S</span>
          </div>
          <span style={{ fontSize: '10px', color: '#E8E8E8', fontWeight: 600 }}>Sohaib Ali</span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>Welcome, <span style={{ color: '#FEC00F' }}>Trader</span></span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Search size={14} color="#757575" />
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #FEC00F, #FFD740)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '9px', color: '#212121' }}>S</span>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, padding: '12px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', overflow: 'hidden', alignContent: 'start' }}>
          {[
            { icon: Code2, label: 'AFL Generator', color: '#3B82F6' },
            { icon: MessageCircle, label: 'AI Chat', color: '#8B5CF6' },
            { icon: Database, label: 'Knowledge', color: '#22C55E' },
            { icon: TrendingUp, label: 'Backtest', color: '#F97316' },
            { icon: Sparkles, label: 'Content', color: '#EC4899' },
            { icon: Zap, label: 'Reverse Eng.', color: '#06B6D4' },
          ].map((f) => {
            const Icon = f.icon
            return (
              <div key={f.label} style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color={f.color} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#E8E8E8' }}>{f.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ========================================================================
// SAMSUNG TV (TIZEN) COMPONENTS
// ========================================================================

function SamsungTVFrame({
  children,
  label,
  isActive,
  colors,
}: {
  children: React.ReactNode
  label: string
  isActive?: boolean
  colors: Record<string, string>
}) {
  return (
    <div>
      <div
        style={{
          width: '680px',
          height: '400px',
          borderRadius: '6px',
          border: `3px solid ${isActive ? '#FEC00F' : '#333'}`,
          backgroundColor: '#000',
          padding: '4px',
          position: 'relative',
          boxShadow: isActive ? '0 0 40px rgba(254,192,15,0.08), 0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Screen */}
        <div style={{ width: '100%', height: '100%', borderRadius: '3px', overflow: 'hidden', backgroundColor: colors.screenBg }}>
          {children}
        </div>
        {/* Samsung logo hint */}
        <div style={{ position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50)', width: '12px', height: '4px', borderRadius: '0 0 2px 2px', backgroundColor: '#333' }} />
      </div>
      {/* TV Stand */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '240px', marginTop: '-2px' }}>
        <div style={{ width: '60px', height: '20px', background: 'linear-gradient(180deg, #333 0%, #222 100%)', clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)' }} />
        <div style={{ width: '60px', height: '20px', background: 'linear-gradient(180deg, #333 0%, #222 100%)', clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)' }} />
      </div>
      {label && (
        <p style={{ textAlign: 'center', marginTop: '10px', fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '1px', color: isActive ? '#FEC00F' : colors.textMuted }}>
          {label}
        </p>
      )}
    </div>
  )
}

// ─── Tizen Home Screen ──────────────────────────────────────────────────
function TizenHomeMockup({ colors, focusIndex = 0 }: { colors: Record<string, string>; focusIndex?: number }) {
  const cards = [
    { icon: LayoutDashboard, label: 'Dashboard', color: '#FEC00F', desc: 'Trading overview' },
    { icon: MessageCircle, label: 'AI Chat', color: '#8B5CF6', desc: 'Ask Yang' },
    { icon: Code2, label: 'AFL Generator', color: '#3B82F6', desc: 'Create strategies' },
    { icon: Database, label: 'Knowledge', color: '#22C55E', desc: '24 documents' },
    { icon: TrendingUp, label: 'Backtest', color: '#F97316', desc: 'Analyze results' },
  ]
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0a0a0a' }}>
      {/* TV status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', height: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '4px', overflow: 'hidden' }}>
            <img src="/potomac-icon.png" alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>ANALYST</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wifi size={12} color="#888" />
          <span style={{ fontSize: '11px', color: '#888', fontFamily: 'system-ui' }}>9:41 PM</span>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #FEC00F, #FFD740)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '9px', color: '#212121' }}>S</span>
          </div>
        </div>
      </div>
      {/* Featured area */}
      <div style={{ padding: '8px 24px 12px' }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>
          Welcome, <span style={{ color: '#FEC00F' }}>Trader</span>
        </span>
        <p style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>Potomac Analyst Workbench - Trading intelligence on the big screen</p>
      </div>
      {/* Horizontal card rail */}
      <div style={{ padding: '0 24px', display: 'flex', gap: '12px', overflow: 'hidden' }}>
        {cards.map((c, i) => {
          const Icon = c.icon
          const isFocused = i === focusIndex
          return (
            <div key={c.label} style={{
              width: '120px',
              height: '120px',
              borderRadius: '12px',
              backgroundColor: '#1a1a1a',
              border: isFocused ? '3px solid #FEC00F' : '2px solid #2E2E2E',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              transform: isFocused ? 'scale(1.05)' : 'scale(1)',
              boxShadow: isFocused ? '0 0 24px rgba(254,192,15,0.2)' : 'none',
            }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} color={c.color} />
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: isFocused ? '#FEC00F' : '#E8E8E8', display: 'block' }}>{c.label}</span>
                <span style={{ fontSize: '7px', color: '#757575' }}>{c.desc}</span>
              </div>
            </div>
          )
        })}
      </div>
      {/* Recently used rail */}
      <div style={{ padding: '16px 24px 0' }}>
        <span style={{ fontSize: '10px', color: '#666', fontWeight: 600, letterSpacing: '0.5px', fontFamily: "'Rajdhani', sans-serif" }}>RECENTLY USED</span>
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          {['AAPL Strategy', 'RSI Analysis', 'Portfolio Review'].map((item) => (
            <div key={item} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #2E2E2E' }}>
              <span style={{ fontSize: '9px', color: '#999' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
      {/* D-pad hint */}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '8px', borderTop: '1px solid #1E1E1E' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ChevronUp size={8} color="#555" />
            <div style={{ display: 'flex', gap: '6px' }}>
              <ChevronLeft size={8} color="#555" />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#333', border: '1px solid #555' }} />
              <ChevronRightIcon size={8} color="#555" />
            </div>
            <ChevronDown size={8} color="#555" />
          </div>
        </div>
        <span style={{ fontSize: '8px', color: '#555' }}>D-pad navigation</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Mic size={8} color="#555" />
          <span style={{ fontSize: '8px', color: '#555' }}>Voice</span>
        </div>
      </div>
    </div>
  )
}

// ─── Tizen Dashboard ────────────────────────────────────────────────────
function TizenDashboardMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0a0a0a' }}>
      {/* Top nav bar (no sidebar for 10-foot UI) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '10px 24px', borderBottom: '1px solid #2E2E2E' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '4px', overflow: 'hidden' }}>
            <img src="/potomac-icon.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>ANALYST</span>
        </div>
        {['Dashboard', 'Chat', 'AFL', 'Knowledge', 'Backtest'].map((t, i) => (
          <span key={t} style={{ fontSize: '11px', fontWeight: 600, color: i === 0 ? '#FEC00F' : '#888', cursor: 'pointer', padding: '4px 0', borderBottom: i === 0 ? '2px solid #FEC00F' : 'none' }}>{t}</span>
        ))}
      </div>
      {/* Large cards */}
      <div style={{ flex: 1, padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', overflow: 'hidden', alignContent: 'start' }}>
        {[
          { icon: TrendingUp, label: 'Portfolio Value', value: '$48,234', color: '#FEC00F', sub: '+2.3% today' },
          { icon: Activity, label: 'Active Strategies', value: '3', color: '#3B82F6', sub: '2 profitable' },
          { icon: Bell, label: 'Alerts', value: '5 new', color: '#F97316', sub: '2 momentum signals' },
        ].map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#1a1a1a', border: '2px solid #2E2E2E' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Icon size={16} color={c.color} />
                <span style={{ fontSize: '11px', color: '#999' }}>{c.label}</span>
              </div>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '24px', fontWeight: 700, color: c.color, display: 'block' }}>{c.value}</span>
              <span style={{ fontSize: '9px', color: '#666' }}>{c.sub}</span>
            </div>
          )
        })}
      </div>
      {/* Bottom status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 24px', borderTop: '1px solid #1E1E1E' }}>
        <span style={{ fontSize: '9px', color: '#555' }}>Samsung Smart TV - Tizen 7</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mic size={10} color="#555" />
          <span style={{ fontSize: '9px', color: '#555' }}>{"'Hey Bixby' for voice"}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Tizen Chat View ────────────────────────────────────────────────────
function TizenChatMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0a0a0a' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 24px', borderBottom: '1px solid #2E2E2E' }}>
        <ChevronLeft size={18} color="#FEC00F" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '6px', overflow: 'hidden' }}>
            <img src="/potomac-icon.png" alt="Yang" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>AI CHAT</span>
        </div>
      </div>
      {/* Messages - large text for 10-foot */}
      <div style={{ flex: 1, padding: '16px 40px', display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'hidden' }}>
        <div style={{ alignSelf: 'flex-end', maxWidth: '45%' }}>
          <div style={{ padding: '12px 18px', borderRadius: '20px 20px 4px 20px', backgroundColor: '#FEC00F', fontSize: '13px', color: '#0A0A0B', lineHeight: 1.4, fontWeight: 500 }}>
            Analyze AAPL for a momentum strategy
          </div>
        </div>
        <div style={{ alignSelf: 'flex-start', maxWidth: '55%' }}>
          <div style={{ padding: '14px 18px', borderRadius: '4px 20px 20px 20px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
            <p style={{ fontSize: '12px', color: '#d4d4d4', lineHeight: 1.5, margin: 0 }}>
              Based on AAPL analysis, I recommend a dual moving average crossover with RSI confirmation. Strong buy signal detected at $198.45.
            </p>
          </div>
        </div>
      </div>
      {/* Voice input prominently featured */}
      <div style={{ padding: '12px 40px 16px', borderTop: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <div style={{ flex: 1, padding: '10px 16px', borderRadius: '24px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
          <span style={{ fontSize: '12px', color: '#757575' }}>Ask Yang anything...</span>
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FEC00F', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(254,192,15,0.2)' }}>
          <Mic size={18} color="#0A0A0B" />
        </div>
      </div>
    </div>
  )
}

// ─── Tizen Code View ────────────────────────────────────────────────────
function TizenCodeMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0d1117' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 24px', borderBottom: '1px solid #2E2E2E', backgroundColor: '#161b22' }}>
        <ChevronLeft size={16} color="#FEC00F" />
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>AFL CODE EDITOR</span>
        <div style={{ flex: 1 }} />
        {['Run', 'Copy', 'Save'].map((a, i) => (
          <div key={a} style={{ padding: '4px 12px', borderRadius: '6px', backgroundColor: i === 0 ? '#FEC00F' : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: i === 0 ? '#0A0A0B' : '#999' }}>{a}</span>
          </div>
        ))}
      </div>
      {/* Large monospace code */}
      <div style={{ flex: 1, padding: '20px 32px', fontFamily: "'Fira Code', 'Consolas', monospace", fontSize: '14px', lineHeight: 2, color: '#adbac7', overflow: 'hidden' }}>
        <div><span style={{ color: '#f47067' }}>// </span><span style={{ color: '#768390' }}>Momentum Strategy - AAPL</span></div>
        <div><span style={{ color: '#6cb6ff' }}>FastMA</span> = <span style={{ color: '#dcbdfb' }}>MA</span>(Close, <span style={{ color: '#6cb6ff' }}>10</span>);</div>
        <div><span style={{ color: '#6cb6ff' }}>SlowMA</span> = <span style={{ color: '#dcbdfb' }}>MA</span>(Close, <span style={{ color: '#6cb6ff' }}>50</span>);</div>
        <div><span style={{ color: '#6cb6ff' }}>RSIVal</span> = <span style={{ color: '#dcbdfb' }}>RSI</span>(<span style={{ color: '#6cb6ff' }}>14</span>);</div>
        <div />
        <div><span style={{ color: '#f47067' }}>Buy</span> = <span style={{ color: '#dcbdfb' }}>Cross</span>(FastMA, SlowMA)</div>
        <div>  <span style={{ color: '#f47067' }}>AND</span> RSIVal {'<'} <span style={{ color: '#6cb6ff' }}>70</span>;</div>
        <div><span style={{ color: '#f47067' }}>Sell</span> = <span style={{ color: '#dcbdfb' }}>Cross</span>(SlowMA, FastMA)</div>
        <div>  <span style={{ color: '#f47067' }}>OR</span> RSIVal {'>'} <span style={{ color: '#6cb6ff' }}>80</span>;</div>
      </div>
      {/* Bottom status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 24px', borderTop: '1px solid #2E2E2E', backgroundColor: '#161b22' }}>
        <span style={{ fontSize: '9px', color: '#555' }}>strategy.afl - 9 lines</span>
        <span style={{ fontSize: '9px', color: '#555' }}>AFL Language</span>
      </div>
    </div>
  )
}

// ========================================================================
// COPY AS MARKDOWN BUTTON (Non-Apple)
// ========================================================================

function CopyAsMarkdownButton({
  activeDevice,
  activeScreen,
  screens,
  deviceSpecs,
  colors,
}: {
  activeDevice: string
  activeScreen: string
  screens: Array<{ id: string; label: string }>
  deviceSpecs: Array<{ label: string; value: string }>
  colors: Record<string, string>
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    const currentScreen = screens.find((s) => s.id === activeScreen)
    const platformLabel = activeDevice === 'android' ? 'Android (Material 3)' : activeDevice === 'tablet' ? 'Android Tablet' : activeDevice === 'windows' ? 'Windows (WinUI 3)' : 'Samsung TV (Tizen)'
    const lines = [
      `# Device Mockup: ${platformLabel}`,
      '',
      `## Active Screen: ${currentScreen?.label || activeScreen}`,
      '',
      '## Device Specifications',
      ...deviceSpecs.map((s) => `- **${s.label}**: ${s.value}`),
      '',
      '## All Available Screens',
      ...screens.map((s) => `- ${s.label}${s.id === activeScreen ? ' (active)' : ''}`),
      '',
      '## UI Elements',
      '- Navigation: Bottom nav / Navigation Rail / NavigationView (device adaptive)',
      '- Primary Action: START GENERATING (brand yellow #FEC00F)',
      '- Features: AFL Generator, AI Chat, Knowledge Base, Backtest, Content, Settings',
      '- Brand: Potomac Analyst Workbench',
      '- Typography: Rajdhani (headings), Quicksand (body)',
      `- Design System: ${activeDevice === 'windows' ? 'WinUI 3 / Fluent' : activeDevice === 'tv' ? 'Tizen / 10-foot UI' : 'Material 3 / Material You'}`,
      '',
      `---`,
      `*Exported from Potomac Analyst Non-Apple Developer Blueprint*`,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }, [activeDevice, activeScreen, screens, deviceSpecs])

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: copied ? 'rgba(34,197,94,0.1)' : colors.cardBg,
        color: copied ? '#22C55E' : colors.textMuted,
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.5px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        outline: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : colors.border}`,
      }}
    >
      {copied ? <Check size={14} color="#22C55E" /> : <ClipboardCopy size={14} />}
      {copied ? 'COPIED AS MARKDOWN' : 'COPY AS MARKDOWN'}
    </button>
  )
}

// ========================================================================
// DOCUMENTATION COMPONENTS
// ========================================================================

function CodeSnippet({ code, language, title, colors }: { code: string; language: string; title?: string; colors: Record<string, string> }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div style={{ borderRadius: '12px', border: `1px solid ${colors.border}`, overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', backgroundColor: colors.codeBg, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {title && <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: 600, color: colors.textMuted, letterSpacing: '0.5px' }}>{title}</span>}
          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(254,192,15,0.1)', color: '#FEC00F', fontWeight: 600, textTransform: 'uppercase' }}>{language}</span>
        </div>
        <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: 'none', backgroundColor: colors.hoverBg, color: colors.textMuted, cursor: 'pointer', fontSize: '11px', fontWeight: 600, transition: 'all 0.2s' }}>
          {copied ? <Check size={12} color="#22C55E" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{ padding: '16px', margin: 0, overflow: 'auto', fontFamily: "'Fira Code', 'Consolas', monospace", fontSize: '12px', lineHeight: 1.6, color: '#adbac7', backgroundColor: '#0d1117' }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function CollapsibleSection({ title, children, defaultOpen = false, colors, badge }: { title: string; children: React.ReactNode; defaultOpen?: boolean; colors: Record<string, string>; badge?: string }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderRadius: '14px', border: `1px solid ${colors.border}`, overflow: 'hidden', marginBottom: '16px', transition: 'border-color 0.3s ease' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px', border: 'none', backgroundColor: colors.cardBg, cursor: 'pointer', transition: 'background-color 0.2s ease' }}>
        {open ? <ChevronDown size={18} color="#FEC00F" /> : <ChevronRightIcon size={18} color={colors.textMuted} />}
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 700, color: colors.text, letterSpacing: '0.5px', flex: 1, textAlign: 'left' }}>{title}</span>
        {badge && <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', backgroundColor: 'rgba(254,192,15,0.1)', color: '#FEC00F', fontWeight: 600, letterSpacing: '0.5px' }}>{badge}</span>}
      </button>
      {open && <div style={{ padding: '0 20px 20px', backgroundColor: colors.cardBg }}>{children}</div>}
    </div>
  )
}

function MappingRow({ jsComponent, nativeCode, notes, colors, nativeColor = '#8ddb8c' }: { jsComponent: string; nativeCode: string; notes: string; colors: Record<string, string>; nativeColor?: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '12px', padding: '12px 0', borderBottom: `1px solid ${colors.border}`, fontSize: '13px' }}>
      <code style={{ color: '#FEC00F', fontFamily: "'Fira Code', monospace", fontSize: '12px', fontWeight: 500 }}>{jsComponent}</code>
      <code style={{ color: nativeColor, fontFamily: "'Fira Code', monospace", fontSize: '12px', fontWeight: 500 }}>{nativeCode}</code>
      <span style={{ color: colors.textMuted, lineHeight: 1.5 }}>{notes}</span>
    </div>
  )
}

// ========================================================================
// MAIN PAGE
// ========================================================================

export function NonAppleDeveloperPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [activeScreen, setActiveScreen] = useState('splash')
  const [activeDevice, setActiveDevice] = useState<'android' | 'tablet' | 'windows' | 'tv'>('android')
  const [activePlatform, setActivePlatform] = useState<'compose' | 'winui'>('compose')
  const [activeTVScreen, setActiveTVScreen] = useState('home')
  const [tvFocusIndex, setTVFocusIndex] = useState(0)

  const colors = {
    background: isDark ? '#0A0A0B' : '#ffffff',
    surface: isDark ? '#121212' : '#f8f9fa',
    cardBg: isDark ? '#1A1A1A' : '#ffffff',
    inputBg: isDark ? '#262626' : '#f0f0f0',
    border: isDark ? '#2E2E2E' : '#e5e5e5',
    text: isDark ? '#E8E8E8' : '#1A1A1A',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    hoverBg: isDark ? '#262626' : '#f0f0f0',
    codeBg: isDark ? '#141414' : '#f5f5f5',
    screenBg: '#121212',
    accent: '#FEC00F',
  }

  const androidScreens = [
    { id: 'splash', label: 'SPLASH', component: AndroidSplashMockup },
    { id: 'login', label: 'LOGIN', component: AndroidLoginMockup },
    { id: 'dashboard', label: 'DASHBOARD', component: AndroidDashboardMockup },
    { id: 'chat', label: 'AI CHAT', component: AndroidChatMockup },
    { id: 'afl', label: 'AFL GENERATOR', component: AndroidAFLMockup },
    { id: 'knowledge', label: 'KNOWLEDGE BASE', component: AndroidKnowledgeMockup },
    { id: 'backtest', label: 'BACKTEST', component: AndroidBacktestMockup },
    { id: 'settings', label: 'SETTINGS', component: AndroidSettingsMockup },
  ]

  const activeScreenData = androidScreens.find((s) => s.id === activeScreen)
  const ActiveComponent = activeScreenData?.component || AndroidSplashMockup

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, fontFamily: "'Quicksand', sans-serif", transition: 'background-color 0.3s ease' }}>
      <style>{`
  @keyframes shimmer { 0% { left: -50%; } 100% { left: 100%; } }
  @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(254,192,15,0); } 50% { box-shadow: 0 0 12px 4px rgba(254,192,15,0.15); } }
  @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`}</style>

      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <div style={{ background: isDark ? 'linear-gradient(135deg, #0A0A0B 0%, #1A1A1D 50%, #0A0A0B 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%)', borderBottom: `1px solid ${colors.border}`, padding: '48px 32px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(254,192,15,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(254,192,15,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'rgba(254,192,15,0.1)', border: '1px solid rgba(254,192,15,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Monitor size={28} color="#FEC00F" />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '48px', fontWeight: 700, color: colors.text, letterSpacing: '2px', lineHeight: 1.1, margin: 0 }}>NON APPLE DEVELOPER</h1>
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 500, color: '#FEC00F', letterSpacing: '6px', margin: '4px 0 0' }}>ANDROID & WINDOWS APP BLUEPRINT</p>
            </div>
          </div>
          <p style={{ color: colors.textMuted, fontSize: '16px', lineHeight: 1.7, maxWidth: '700px', margin: 0 }}>
            Full-scale interactive mockups and comprehensive translation guides for rebuilding the Potomac Analyst Workbench as native apps on Android (Jetpack Compose), Windows (WinUI 3), and Samsung TV (Tizen) with 1:1 feature parity. Includes high-fidelity device frames, interactive prototype elements, and markdown export.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
            {[
              { label: '8+ Screens', icon: Monitor },
              { label: 'Jetpack Compose', icon: Smartphone },
              { label: 'WinUI 3', icon: Laptop },
              { label: 'Tizen TV', icon: Tv },
              { label: 'Material 3', icon: Paintbrush },
              { label: 'MVVM', icon: GitBranch },
            ].map((b) => {
              const Icon = b.icon
              return (
                <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', backgroundColor: 'rgba(254,192,15,0.06)', border: '1px solid rgba(254,192,15,0.15)' }}>
                  <Icon size={14} color="#FEC00F" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>{b.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 32px' }}>

        {/* ── Section 1: Device Selector ──────────────────────────────── */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Paintbrush size={22} color="#FEC00F" />
            <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '28px', fontWeight: 700, color: colors.text, letterSpacing: '1.5px', margin: 0 }}>APP INTERFACE MOCKUPS</h2>
          </div>
          <p style={{ color: colors.textMuted, fontSize: '14px', lineHeight: 1.6, marginBottom: '28px', maxWidth: '700px' }}>
            Interactive mockups across Android and Windows platforms. Select a device to preview with realistic device frames including punch-hole cameras, gesture navigation bars, safe areas, and platform-specific window controls.
          </p>

          {/* Device type tabs + Copy as Markdown */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            {([
              { id: 'android', label: 'Android Phone', icon: Smartphone },
              { id: 'tablet', label: 'Android Tablet', icon: Tablet },
              { id: 'windows', label: 'Windows Desktop', icon: Laptop },
              { id: 'tv', label: 'Samsung TV (Tizen)', icon: Tv },
            ] as const).map((device) => {
              const Icon = device.icon
              const isDeviceActive = activeDevice === device.id
              return (
                <button key={device.id} onClick={() => setActiveDevice(device.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: isDeviceActive ? '#FEC00F' : colors.cardBg, color: isDeviceActive ? '#0A0A0B' : colors.textMuted, fontFamily: "'Rajdhani', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.2s ease', outline: isDeviceActive ? 'none' : `1px solid ${colors.border}` }}>
                  <Icon size={16} />
                  {device.label}
                </button>
              )
            })}
            <div style={{ flex: 1 }} />
            <CopyAsMarkdownButton
              activeDevice={activeDevice}
              activeScreen={activeDevice === 'tv' ? activeTVScreen : activeScreen}
              screens={activeDevice === 'tv' ? [
                { id: 'home', label: 'HOME SCREEN' },
                { id: 'dashboard', label: 'DASHBOARD' },
                { id: 'chat', label: 'CHAT VIEW' },
                { id: 'code', label: 'CODE EDITOR' },
              ] : androidScreens}
              deviceSpecs={activeDevice === 'tv' ? [
                { label: 'Platform', value: 'Tizen 7+' },
                { label: 'UI', value: '10-foot UI' },
                { label: 'Input', value: 'D-pad + Voice' },
                { label: 'Resolution', value: '16:9 4K' },
              ] : [
                { label: 'Camera', value: 'Punch-hole' },
                { label: 'Display', value: '6.1" AMOLED' },
              ]}
              colors={colors}
            />
          </div>

          {/* ── Android Phone View ────────────────────────────────────── */}
          {activeDevice === 'android' && (
            <>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
                {androidScreens.map((screen) => (
                  <button key={screen.id} onClick={() => setActiveScreen(screen.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeScreen === screen.id ? '#FEC00F' : colors.cardBg, color: activeScreen === screen.id ? '#0A0A0B' : colors.textMuted, fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s ease', outline: activeScreen === screen.id ? 'none' : `1px solid ${colors.border}` }}>
                    {screen.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <AndroidPhoneFrame label={activeScreenData?.label || ''} isActive colors={colors} size="large">
                    <ActiveComponent colors={colors} />
                  </AndroidPhoneFrame>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                      { label: 'Camera', value: 'Punch-hole' },
                      { label: 'Status Bar', value: '24dp' },
                      { label: 'Nav Bar', value: 'Gesture (48dp)' },
                      { label: 'Display', value: '6.1" AMOLED' },
                    ].map((spec) => (
                      <div key={spec.label} style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '9px', color: colors.textMuted, display: 'block', letterSpacing: '0.5px' }}>{spec.label}</span>
                        <span style={{ fontSize: '11px', color: colors.text, fontWeight: 600 }}>{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: '300px' }}>
                  <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 600, color: colors.textMuted, letterSpacing: '1px', marginBottom: '16px' }}>ALL SCREENS</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                    {androidScreens.map((screen) => {
                      const ScreenComp = screen.component
                      return (
                        <div key={screen.id} onClick={() => setActiveScreen(screen.id)} style={{ cursor: 'pointer', borderRadius: '14px', border: `2px solid ${activeScreen === screen.id ? '#FEC00F' : colors.border}`, overflow: 'hidden', transition: 'all 0.2s ease', backgroundColor: '#000', position: 'relative' }}>
                          <div style={{ transform: 'scale(0.48)', transformOrigin: 'top left', width: '280px', height: '200px', pointerEvents: 'none' }}>
                            <ScreenComp colors={colors} />
                          </div>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))' }}>
                            <span style={{ fontSize: '9px', fontWeight: 600, color: activeScreen === screen.id ? '#FEC00F' : '#9E9E9E', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px' }}>{screen.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Android Tablet View ───────────────────────────────────── */}
          {activeDevice === 'tablet' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div>
                <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 600, color: colors.textMuted, letterSpacing: '1px', marginBottom: '4px' }}>ANDROID TABLET - NAVIGATION RAIL LAYOUT</h3>
                <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '20px', lineHeight: 1.6 }}>On Android tablets, the app uses a Material 3 Navigation Rail replacing the bottom navigation bar. The rail provides icon-and-label navigation along the left edge, following Material Design 3 large-screen guidelines. Supports foldable and multi-window modes.</p>
                <AndroidTabletFrame label="DASHBOARD - TABLET" isActive colors={colors}>
                  <AndroidTabletDashboard colors={colors} />
                </AndroidTabletFrame>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Navigation', value: 'Material 3 Rail' },
                  { label: 'Status Bar', value: '24dp' },
                  { label: 'Nav Bar', value: 'Gesture (48dp)' },
                  { label: 'Multi-Window', value: 'Split-screen supported' },
                  { label: 'Input', value: 'Touch + S Pen / stylus' },
                ].map((spec) => (
                  <div key={spec.label} style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                    <span style={{ fontSize: '9px', color: colors.textMuted, display: 'block', letterSpacing: '0.5px', marginBottom: '4px' }}>{spec.label}</span>
                    <span style={{ fontSize: '12px', color: colors.text, fontWeight: 600 }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Windows View ─────────────────────────────────────────── */}
          {activeDevice === 'windows' && (
            <div>
              <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 600, color: colors.textMuted, letterSpacing: '1px', marginBottom: '4px' }}>WINDOWS DESKTOP - WINUI 3 NAVIGATIONVIEW</h3>
              <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '20px', lineHeight: 1.6 }}>The Windows version uses WinUI 3 with a NavigationView control providing a persistent sidebar. Hover over the maximize button to see Snap Layout options. The title bar integrates standard window controls, and the bottom taskbar shows the Windows experience. Supports Mica material backdrop, keyboard shortcuts, and full DPI scaling.</p>
              <WindowsFrame label="DASHBOARD - WINUI 3" colors={colors}>
                <WindowsDashboardMockup colors={colors} />
              </WindowsFrame>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '24px' }}>
                {[
                  { label: 'Title Bar', value: 'Minimize / Snap / Close' },
                  { label: 'Backdrop', value: 'Mica material' },
                  { label: 'Navigation', value: 'WinUI NavigationView' },
                  { label: 'Minimum Size', value: '1024 x 768' },
                  { label: 'DPI Scaling', value: 'Per-monitor aware' },
                  { label: 'Taskbar', value: 'Search + System tray' },
                ].map((spec) => (
                  <div key={spec.label} style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                    <span style={{ fontSize: '9px', color: colors.textMuted, display: 'block', letterSpacing: '0.5px', marginBottom: '4px' }}>{spec.label}</span>
                    <span style={{ fontSize: '12px', color: colors.text, fontWeight: 600 }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Samsung TV (Tizen) View ──────────────────────────────── */}
          {activeDevice === 'tv' && (
            <div>
              <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 600, color: colors.textMuted, letterSpacing: '1px', marginBottom: '4px' }}>SAMSUNG TV - TIZEN 7+ (10-FOOT UI)</h3>
              <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '20px', lineHeight: 1.6 }}>TV-optimized interface designed for the 10-foot viewing distance. Uses large text, high contrast, horizontal card rails with D-pad focus navigation, and prominent voice input. The yellow focus ring indicates the currently selected element, navigable with the Samsung remote D-pad. Click the arrow buttons on the home screen to simulate focus movement.</p>

              {/* TV screen selector */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
                {[
                  { id: 'home', label: 'HOME SCREEN' },
                  { id: 'dashboard', label: 'DASHBOARD' },
                  { id: 'chat', label: 'CHAT VIEW' },
                  { id: 'code', label: 'CODE EDITOR' },
                ].map((s) => (
                  <button key={s.id} onClick={() => setActiveTVScreen(s.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeTVScreen === s.id ? '#FEC00F' : colors.cardBg, color: activeTVScreen === s.id ? '#0A0A0B' : colors.textMuted, fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.2s ease', outline: activeTVScreen === s.id ? 'none' : `1px solid ${colors.border}` }}>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* D-pad focus controls for home screen */}
              {activeTVScreen === 'home' && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 600 }}>D-pad Focus:</span>
                  <button onClick={() => setTVFocusIndex(Math.max(0, tvFocusIndex - 1))} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', backgroundColor: colors.cardBg, color: colors.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: `1px solid ${colors.border}` }}>
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => setTVFocusIndex(Math.min(4, tvFocusIndex + 1))} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', backgroundColor: colors.cardBg, color: colors.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: `1px solid ${colors.border}` }}>
                    <ChevronRightIcon size={14} />
                  </button>
                  <span style={{ fontSize: '10px', color: '#FEC00F', fontWeight: 600 }}>Card {tvFocusIndex + 1} of 5</span>
                </div>
              )}

              <SamsungTVFrame label={activeTVScreen === 'home' ? 'HOME - SMART HUB' : activeTVScreen === 'dashboard' ? 'DASHBOARD - 10FT UI' : activeTVScreen === 'chat' ? 'CHAT - VOICE INPUT' : 'AFL CODE EDITOR'} isActive colors={colors}>
                {activeTVScreen === 'home' && <TizenHomeMockup colors={colors} focusIndex={tvFocusIndex} />}
                {activeTVScreen === 'dashboard' && <TizenDashboardMockup colors={colors} />}
                {activeTVScreen === 'chat' && <TizenChatMockup colors={colors} />}
                {activeTVScreen === 'code' && <TizenCodeMockup colors={colors} />}
              </SamsungTVFrame>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '28px' }}>
                {[
                  { label: 'Platform', value: 'Tizen 7+' },
                  { label: 'UI', value: '10-foot UI design' },
                  { label: 'Input', value: 'D-pad + Voice (Bixby)' },
                  { label: 'Resolution', value: '16:9 4K UHD' },
                  { label: 'Smart Hub', value: 'Card rail navigation' },
                  { label: 'Focus', value: 'Yellow ring indicator' },
                ].map((spec) => (
                  <div key={spec.label} style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                    <span style={{ fontSize: '9px', color: colors.textMuted, display: 'block', letterSpacing: '0.5px', marginBottom: '4px' }}>{spec.label}</span>
                    <span style={{ fontSize: '12px', color: colors.text, fontWeight: 600 }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Section 2: Translation Guide ───────────────────────────── */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <BookOpen size={22} color="#FEC00F" />
            <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '28px', fontWeight: 700, color: colors.text, letterSpacing: '1.5px', margin: 0 }}>TRANSLATION GUIDES</h2>
          </div>
          <p style={{ color: colors.textMuted, fontSize: '14px', lineHeight: 1.6, marginBottom: '24px', maxWidth: '700px' }}>
            Step-by-step instructions for rewriting each JavaScript/React component into native code for Android (Jetpack Compose with Kotlin) and Windows (WinUI 3 with C#). Select a platform below.
          </p>

          {/* Platform switcher */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
            {([
              { id: 'compose', label: 'Jetpack Compose (Android)' },
              { id: 'winui', label: 'WinUI 3 (Windows)' },
            ] as const).map((plat) => (
              <button key={plat.id} onClick={() => setActivePlatform(plat.id)} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', backgroundColor: activePlatform === plat.id ? '#FEC00F' : colors.cardBg, color: activePlatform === plat.id ? '#0A0A0B' : colors.textMuted, fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.2s ease', outline: activePlatform === plat.id ? 'none' : `1px solid ${colors.border}` }}>
                {plat.label}
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* JETPACK COMPOSE GUIDE                                       */}
          {/* ════════════════════════════════════════════════════════════ */}
          {activePlatform === 'compose' && (
            <>
              <CollapsibleSection title="1. PROJECT ARCHITECTURE" defaultOpen colors={colors} badge="FOUNDATION">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                  Map the Next.js app to a Kotlin/Compose project using MVVM with Hilt dependency injection. Targets: Android 10+ (API 29), tablet support, Material 3 design system.
                </p>
                <CodeSnippet title="Android Project Structure" language="kotlin" colors={colors} code={`// app/src/main/java/com/potomac/analyst/
├── App.kt                          // Application class with Hilt setup
├── MainActivity.kt                 // Single Activity (replaces layout.tsx)
├── data/
│   ├── model/
│   │   ├── User.kt                 // From AuthContext
│   │   ├── Conversation.kt         // From types/api.ts
��   │   ├── Document.kt             // Knowledge base types
│   │   └── BacktestResult.kt       // Backtest types
│   ├── remote/
│   │   ├── ApiService.kt           // Retrofit interface (replaces api.ts)
│   │   ├── AuthInterceptor.kt      // Token injection interceptor
│   │   └── SSEClient.kt            // SSE streaming (replaces AI SDK)
│   ├── local/
│   │   └── TokenManager.kt         // EncryptedSharedPreferences
│   └── repository/
│       ├── AuthRepository.kt       // Replaces AuthContext
│       ├── ChatRepository.kt       // Replaces useChat hook
│       └── KnowledgeRepository.kt  // Replaces KnowledgeBasePage state
├── di/
│   ├── AppModule.kt                // Hilt module for singletons
│   └── NetworkModule.kt            // Retrofit + OkHttp setup
├── ui/
│   ├── navigation/
│   │   └── AppNavigation.kt        // Replaces MainLayout sidebar routing
│   ├── theme/
│   │   ├── Theme.kt                // Replaces ThemeContext + globals.css
│   │   ├── Color.kt                // Brand color constants
│   │   └── Type.kt                 // Rajdhani + Quicksand typography
│   ├── splash/
│   │   └── SplashScreen.kt         // App launch with logo
│   ├── auth/
│   │   ├── LoginScreen.kt          // LoginPage.tsx -> Compose
│   │   └── LoginViewModel.kt
│   ├── dashboard/
│   │   ├── DashboardScreen.kt      // DashboardPage.tsx -> Compose
│   │   └── DashboardViewModel.kt
│   ├── chat/
│   │   ├── ChatScreen.kt           // ChatPage.tsx -> Compose
│   │   ├── ChatViewModel.kt
│   │   └── MessageBubble.kt        // AI message rendering
│   ���── afl/
│   │   ├── AFLScreen.kt            // AFLGeneratorPage.tsx -> Compose
│   │   └── AFLViewModel.kt
│   ├── knowledge/
│   │   ├── KnowledgeScreen.kt
│   │   └── KnowledgeViewModel.kt
│   ├── backtest/
│   │   └── BacktestScreen.kt
│   ├── content/
│   │   └── ContentScreen.kt
│   └── settings/
│       ├── SettingsScreen.kt
│       └── SettingsViewModel.kt
└── util/
    ├── BiometricHelper.kt          // Fingerprint auth
    └── Logger.kt`} />
              </CollapsibleSection>

              <CollapsibleSection title="2. COMPONENT MAPPING TABLE" defaultOpen colors={colors} badge="CORE">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>Direct mappings between existing React/Next.js components and their Jetpack Compose equivalents.</p>
                <div style={{ overflow: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '12px', padding: '12px 0', borderBottom: '2px solid rgba(254,192,15,0.3)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', fontFamily: "'Rajdhani', sans-serif" }}>
                    <span style={{ color: '#FEC00F' }}>REACT / NEXT.JS</span>
                    <span style={{ color: '#8ddb8c' }}>JETPACK COMPOSE</span>
                    <span style={{ color: colors.textMuted }}>NOTES</span>
                  </div>
                  <MappingRow jsComponent="MainLayout.tsx" nativeCode="NavigationBar + NavHost" notes="Use Material 3 NavigationBar for phone bottom nav. NavigationRail for tablets. NavHost for routing." colors={colors} />
                  <MappingRow jsComponent="AuthContext.tsx" nativeCode="AuthViewModel + Hilt" notes="Use Hilt-injected ViewModel with StateFlow. Store tokens in EncryptedSharedPreferences." colors={colors} />
                  <MappingRow jsComponent="ThemeContext.tsx" nativeCode="MaterialTheme + isSystemInDarkTheme" notes="Use Material 3 dynamic color with custom color scheme. isSystemInDarkTheme() for auto mode." colors={colors} />
                  <MappingRow jsComponent="useChat (AI SDK)" nativeCode="OkHttp SSE + Flow" notes="Use OkHttp EventSource for SSE. Emit events via Kotlin Flow for reactive streaming." colors={colors} />
                  <MappingRow jsComponent="Monaco Editor" nativeCode="BasicTextField + AnnotatedString" notes="Use BasicTextField with custom AnnotatedString syntax highlighting or integrate CodeView library." colors={colors} />
                  <MappingRow jsComponent="PromptInput" nativeCode="OutlinedTextField" notes="Material 3 OutlinedTextField with trailingIcon for send button. Support ImeAction.Send." colors={colors} />
                  <MappingRow jsComponent="Sonner toasts" nativeCode="SnackbarHost" notes="Use Scaffold SnackbarHost for Material 3 snackbars with custom actions." colors={colors} />
                  <MappingRow jsComponent="lucide-react icons" nativeCode="Material Icons" notes="Map each Lucide icon to its Material Symbol equivalent. Use compose-icons-extended." colors={colors} />
                  <MappingRow jsComponent="localStorage" nativeCode="DataStore / EncryptedSP" notes="DataStore for preferences. EncryptedSharedPreferences for tokens and API keys." colors={colors} />
                  <MappingRow jsComponent="useResponsive" nativeCode="WindowSizeClass" notes="Use Material 3 WindowSizeClass for Compact/Medium/Expanded adaptive layouts." colors={colors} />
                  <MappingRow jsComponent="apiClient (fetch)" nativeCode="Retrofit + OkHttp" notes="Retrofit with coroutines adapter. OkHttp interceptor for auth token injection." colors={colors} />
                  <MappingRow jsComponent="React.useState" nativeCode="mutableStateOf / StateFlow" notes="remember { mutableStateOf() } for local UI state. StateFlow in ViewModel for shared state." colors={colors} />
                  <MappingRow jsComponent="React.useEffect" nativeCode="LaunchedEffect / DisposableEffect" notes="LaunchedEffect for async on-composition. DisposableEffect for cleanup on dispose." colors={colors} />
                  <MappingRow jsComponent="React.useRef" nativeCode="remember { Ref() } / FocusRequester" notes="FocusRequester for input focus. ScrollState for scroll control." colors={colors} />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="3. SPLASH SCREEN & APP LAUNCH" colors={colors} badge="LAUNCH">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                  Android 12+ supports the SplashScreen API for a branded launch experience. Create an animated splash screen showing the Potomac logo with a loading indicator during auth check.
                </p>
                <CodeSnippet title="SplashScreen.kt" language="kotlin" colors={colors} code={`@Composable
fun SplashScreen(onFinished: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "shimmer")
    val shimmerOffset by infiniteTransition.animateFloat(
        initialValue = -1f, targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = EaseInOut),
            repeatMode = RepeatMode.Restart
        ), label = "offset"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0A0B)),
        contentAlignment = Alignment.Center
    ) {
        // Radial glow
        Box(
            modifier = Modifier
                .size(200.dp)
                .background(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            PotomacYellow.copy(alpha = 0.08f),
                            Color.Transparent
                        )
                    )
                )
        )

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            // Logo from drawable resources
            Image(
                painter = painterResource(R.drawable.potomac_icon),
                contentDescription = "Analyst Logo",
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(20.dp))
            )
            Spacer(modifier = Modifier.height(20.dp))
            Text(
                text = "ANALYST",
                fontFamily = RajdhaniFamily,
                fontWeight = FontWeight.Bold,
                fontSize = 28.sp,
                color = Color.White,
                letterSpacing = 6.sp
            )
            Text(
                text = "BY POTOMAC",
                fontFamily = QuicksandFamily,
                fontWeight = FontWeight.SemiBold,
                fontSize = 10.sp,
                color = PotomacYellow,
                letterSpacing = 5.sp
            )
            Spacer(modifier = Modifier.height(40.dp))
            // Animated loading bar
            Box(
                modifier = Modifier
                    .width(50.dp)
                    .height(3.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color.White.copy(alpha = 0.1f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(0.5f)
                        .offset(x = (shimmerOffset * 50).dp)
                        .background(PotomacYellow, RoundedCornerShape(2.dp))
                )
            }
        }

        // Version text at bottom
        Text(
            text = "VERSION 1.0",
            fontSize = 9.sp, color = Color.Gray.copy(alpha = 0.5f),
            letterSpacing = 2.sp,
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 50.dp)
        )
    }

    LaunchedEffect(Unit) {
        delay(2000)
        onFinished()
    }
}`} />
              </CollapsibleSection>

              <CollapsibleSection title="4. AUTHENTICATION FLOW" colors={colors} badge="AUTH">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                  Translate AuthContext to a Hilt-injected ViewModel using StateFlow for reactive state and EncryptedSharedPreferences for secure token storage with biometric (fingerprint) support.
                </p>
                <CodeSnippet title="AuthViewModel.kt" language="kotlin" colors={colors} code={`@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Loading)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    init { checkAuth() }

    // Replaces: AuthContext.checkAuth()
    private fun checkAuth() {
        viewModelScope.launch {
            val token = tokenManager.getToken()
            if (token != null) {
                try {
                    val user = authRepository.getCurrentUser(token)
                    _uiState.value = AuthUiState.Authenticated(user)
                } catch (e: Exception) {
                    tokenManager.clearToken()
                    _uiState.value = AuthUiState.Unauthenticated
                }
            } else {
                _uiState.value = AuthUiState.Unauthenticated
            }
        }
    }

    // Replaces: AuthContext.login()
    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            try {
                val response = authRepository.login(email, password)
                tokenManager.saveToken(response.accessToken)
                _uiState.value = AuthUiState.Authenticated(response.user)
            } catch (e: Exception) {
                _uiState.value = AuthUiState.Error(e.message ?: "Login failed")
            }
        }
    }

    fun logout() {
        tokenManager.clearToken()
        _uiState.value = AuthUiState.Unauthenticated
    }
}

sealed class AuthUiState {
    data object Loading : AuthUiState()
    data object Unauthenticated : AuthUiState()
    data class Authenticated(val user: User) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}`} />
              </CollapsibleSection>

              <CollapsibleSection title="5. NAVIGATION ARCHITECTURE" colors={colors} badge="NAV">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                  On phones, use Material 3 NavigationBar (bottom). On tablets, use NavigationRail (side). Use NavHost from Compose Navigation for screen routing with type-safe destinations.
                </p>
                <CodeSnippet title="AppNavigation.kt" language="kotlin" colors={colors} code={`@Composable
fun AppNavigation(authViewModel: AuthViewModel = hiltViewModel()) {
    val authState by authViewModel.uiState.collectAsStateWithLifecycle()
    val windowSizeClass = calculateWindowSizeClass(LocalContext.current as Activity)

    when (authState) {
        is AuthUiState.Loading -> SplashScreen {}
        is AuthUiState.Unauthenticated -> LoginScreen()
        is AuthUiState.Authenticated -> {
            when (windowSizeClass.widthSizeClass) {
                WindowWidthSizeClass.Compact -> PhoneLayout()    // Bottom nav
                WindowWidthSizeClass.Medium -> TabletLayout()    // Nav rail
                WindowWidthSizeClass.Expanded -> DesktopLayout() // Full sidebar
            }
        }
        is AuthUiState.Error -> LoginScreen()
    }
}

@Composable
fun PhoneLayout() {
    val navController = rememberNavController()
    var selectedTab by remember { mutableStateOf(AppTab.Dashboard) }

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = Color(0xFF0E0E0E)) {
                AppTab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = selectedTab == tab,
                        onClick = {
                            selectedTab = tab
                            navController.navigate(tab.route) {
                                popUpTo(navController.graph.startDestinationId)
                                launchSingleTop = true
                            }
                        },
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label, fontFamily = RajdhaniFamily) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = PotomacYellow,
                            selectedTextColor = PotomacYellow,
                            indicatorColor = PotomacYellow.copy(alpha = 0.15f)
                        )
                    )
                }
            }
        }
    ) { padding ->
        NavHost(navController, startDestination = "dashboard", Modifier.padding(padding)) {
            composable("dashboard") { DashboardScreen() }
            composable("chat") { ChatScreen() }
            composable("afl") { AFLScreen() }
            composable("knowledge") { KnowledgeScreen() }
            composable("more") { MoreScreen() }
        }
    }
}`} />
              </CollapsibleSection>

              <CollapsibleSection title="6. AI CHAT & SSE STREAMING" colors={colors} badge="CORE">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                  Replace the AI SDK useChat hook with OkHttp Server-Sent Events and Kotlin Flows for real-time message streaming with tool call support.
                </p>
                <CodeSnippet title="SSEClient.kt" language="kotlin" colors={colors} code={`class SSEClient @Inject constructor(
    private val okHttpClient: OkHttpClient,
    private val tokenManager: TokenManager
) {
    fun streamChat(
        messages: List<ChatMessage>,
        conversationId: String?
    ): Flow<StreamEvent> = callbackFlow {
        val json = JSONObject().apply {
            put("messages", JSONArray(messages.map { it.toJson() }))
            put("conversationId", conversationId ?: JSONObject.NULL)
        }

        val request = Request.Builder()
            .url("\${BuildConfig.API_URL}/api/chat")
            .post(json.toString().toRequestBody("application/json".toMediaType()))
            .addHeader("Authorization", "Bearer \${tokenManager.getToken()}")
            .build()

        val call = okHttpClient.newCall(request)
        val response = call.execute()
        val source = response.body?.source() ?: return@callbackFlow

        try {
            while (!source.exhausted()) {
                val line = source.readUtf8Line() ?: continue
                if (!line.startsWith("data: ")) continue
                val data = line.removePrefix("data: ")
                if (data == "[DONE]") break
                parseEvent(data)?.let { trySend(it) }
            }
        } finally {
            response.close()
        }
        close()
    }

    private fun parseEvent(data: String): StreamEvent? {
        val json = JSONObject(data)
        return when {
            json.has("text") -> StreamEvent.TextDelta(json.getString("text"))
            json.has("tool_call") -> StreamEvent.ToolCall(json.getJSONObject("tool_call"))
            else -> null
        }
    }
}

sealed class StreamEvent {
    data class TextDelta(val text: String) : StreamEvent()
    data class ToolCall(val data: JSONObject) : StreamEvent()
    data object Finished : StreamEvent()
}`} />
              </CollapsibleSection>

              <CollapsibleSection title="7. THEME, TYPOGRAPHY & STYLING" colors={colors} badge="UI">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                  Translate globals.css and ThemeContext to Material 3 color schemes with custom Rajdhani and Quicksand typography.
                </p>
                <CodeSnippet title="Theme.kt" language="kotlin" colors={colors} code={`// Brand Colors
val PotomacYellow = Color(0xFFFEC00F)
val PotomacGray = Color(0xFF212121)
val PotomacTurquoise = Color(0xFF00DED1)
val PotomacPink = Color(0xFFEB2F5C)

// Surface colors
val SurfaceDark = Color(0xFF121212)
val SurfaceSecondaryDark = Color(0xFF1E1E1E)
val BorderDark = Color(0xFF2E2E2E)

private val DarkColorScheme = darkColorScheme(
    primary = PotomacYellow,
    onPrimary = Color.Black,
    surface = SurfaceDark,
    surfaceVariant = SurfaceSecondaryDark,
    outline = BorderDark,
    onSurface = Color(0xFFE8E8E8),
    onSurfaceVariant = Color(0xFF9E9E9E)
)

// Typography with custom fonts
val RajdhaniFamily = FontFamily(
    Font(R.font.rajdhani_bold, FontWeight.Bold),
    Font(R.font.rajdhani_semibold, FontWeight.SemiBold),
    Font(R.font.rajdhani_medium, FontWeight.Medium)
)
val QuicksandFamily = FontFamily(
    Font(R.font.quicksand_regular, FontWeight.Normal),
    Font(R.font.quicksand_medium, FontWeight.Medium),
    Font(R.font.quicksand_semibold, FontWeight.SemiBold),
    Font(R.font.quicksand_bold, FontWeight.Bold)
)

val AnalystTypography = Typography(
    headlineLarge = TextStyle(fontFamily = RajdhaniFamily, fontWeight = FontWeight.Bold),
    headlineMedium = TextStyle(fontFamily = RajdhaniFamily, fontWeight = FontWeight.Bold),
    titleLarge = TextStyle(fontFamily = RajdhaniFamily, fontWeight = FontWeight.SemiBold),
    bodyLarge = TextStyle(fontFamily = QuicksandFamily, fontWeight = FontWeight.Normal),
    bodyMedium = TextStyle(fontFamily = QuicksandFamily, fontWeight = FontWeight.Normal),
    labelLarge = TextStyle(fontFamily = RajdhaniFamily, fontWeight = FontWeight.SemiBold)
)

@Composable
fun AnalystTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme,
        typography = AnalystTypography,
        content = content
    )
}`} />
              </CollapsibleSection>

              <CollapsibleSection title="8. STATE MANAGEMENT PATTERNS" colors={colors} badge="DATA">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                  Map React contexts and hooks to Kotlin state patterns with ViewModel, StateFlow, and Compose state primitives.
                </p>
                <div style={{ overflow: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '12px', padding: '12px 0', borderBottom: '2px solid rgba(254,192,15,0.3)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', fontFamily: "'Rajdhani', sans-serif" }}>
                    <span style={{ color: '#FEC00F' }}>REACT PATTERN</span>
                    <span style={{ color: '#8ddb8c' }}>COMPOSE PATTERN</span>
                    <span style={{ color: colors.textMuted }}>MIGRATION NOTES</span>
                  </div>
                  <MappingRow jsComponent="createContext + useContext" nativeCode="Hilt + collectAsState" notes="Inject ViewModel via Hilt, collect StateFlow as Compose state." colors={colors} />
                  <MappingRow jsComponent="useState" nativeCode="mutableStateOf" notes="remember { mutableStateOf(initial) } for local composable state." colors={colors} />
                  <MappingRow jsComponent="useEffect([], [])" nativeCode="LaunchedEffect(Unit)" notes="LaunchedEffect for coroutine on first composition. Auto-cancelled." colors={colors} />
                  <MappingRow jsComponent="useEffect(dep)" nativeCode="LaunchedEffect(dep)" notes="Re-launched when key changes. Use for side effects on state change." colors={colors} />
                  <MappingRow jsComponent="useRef" nativeCode="remember { mutableStateOf() }" notes="For non-recomposition refs, use plain variables in ViewModel." colors={colors} />
                  <MappingRow jsComponent="useCallback" nativeCode="remember { lambda }" notes="Compose smart recomposition reduces need, but remember lambdas if needed." colors={colors} />
                  <MappingRow jsComponent="useMemo" nativeCode="derivedStateOf" notes="remember { derivedStateOf { } } for computed values from state." colors={colors} />
                  <MappingRow jsComponent="localStorage" nativeCode="DataStore / EncryptedSP" notes="Jetpack DataStore for preferences. EncryptedSharedPreferences for secrets." colors={colors} />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="9. ICON MAPPING (LUCIDE TO MATERIAL SYMBOLS)" colors={colors} badge="ICONS">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                  Map every Lucide icon to its closest Material Symbol equivalent for native Android rendering.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                  {[
                    { lucide: 'LayoutDashboard', native: 'Icons.Outlined.Dashboard' },
                    { lucide: 'Code2', native: 'Icons.Outlined.Code' },
                    { lucide: 'MessageCircle', native: 'Icons.Outlined.Chat' },
                    { lucide: 'Database', native: 'Icons.Outlined.Storage' },
                    { lucide: 'TrendingUp', native: 'Icons.Outlined.TrendingUp' },
                    { lucide: 'Zap', native: 'Icons.Outlined.Bolt' },
                    { lucide: 'Settings', native: 'Icons.Outlined.Settings' },
                    { lucide: 'Sparkles', native: 'Icons.Outlined.AutoAwesome' },
                    { lucide: 'Search', native: 'Icons.Outlined.Search' },
                    { lucide: 'Upload', native: 'Icons.Outlined.Upload' },
                    { lucide: 'Trash2', native: 'Icons.Outlined.Delete' },
                    { lucide: 'Copy', native: 'Icons.Outlined.ContentCopy' },
                    { lucide: 'Eye / EyeOff', native: 'Visibility / VisibilityOff' },
                    { lucide: 'LogIn / LogOut', native: 'Login / Logout' },
                    { lucide: 'Menu / X', native: 'Menu / Close' },
                    { lucide: 'Plus', native: 'Icons.Outlined.Add' },
                    { lucide: 'ChevronLeft/Right', native: 'ChevronLeft / ChevronRight' },
                    { lucide: 'FileText', native: 'Icons.Outlined.Description' },
                    { lucide: 'ArrowRight', native: 'Icons.Outlined.ArrowForward' },
                    { lucide: 'Loader2', native: 'CircularProgressIndicator()' },
                  ].map((item) => (
                    <div key={item.lucide} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, fontSize: '12px' }}>
                      <code style={{ color: '#FEC00F', fontFamily: 'monospace', flex: 1, fontSize: '11px' }}>{item.lucide}</code>
                      <ArrowRight size={10} color={colors.textMuted} />
                      <code style={{ color: '#8ddb8c', fontFamily: 'monospace', flex: 1, fontSize: '11px' }}>{item.native}</code>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="10. TESTING & DEPLOYMENT" colors={colors} badge="SHIP">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>Recommended testing strategy and deployment approach for the Android app.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {[
                    { icon: Shield, title: 'Unit Tests', desc: 'Test ViewModels with JUnit 5 + MockK. Use Turbine for StateFlow testing. Mock repositories with Hilt test modules.' },
                    { icon: Monitor, title: 'UI Tests', desc: 'Use Compose UI Test (createComposeRule) for screen-level testing. Test both phone and tablet layouts with custom device configs.' },
                    { icon: Smartphone, title: 'Preview Testing', desc: 'Use @Preview annotations for rapid iteration. Create preview fixtures for every screen matching the mockups on this page.' },
                    { icon: GitBranch, title: 'CI/CD Pipeline', desc: 'Use GitHub Actions or Bitrise for automated builds. Deploy to Firebase App Distribution for beta, then Google Play Console for production.' },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.title} style={{ padding: '20px', borderRadius: '14px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(254,192,15,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                          <Icon size={20} color="#FEC00F" />
                        </div>
                        <h4 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 600, color: colors.text, letterSpacing: '0.5px', marginBottom: '8px' }}>{item.title}</h4>
                        <p style={{ fontSize: '12px', color: colors.textMuted, lineHeight: 1.6 }}>{item.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </CollapsibleSection>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* WINUI 3 GUIDE                                               */}
          {/* ════════════���═══════════════════════════════════════════════ */}
          {activePlatform === 'winui' && (
            <>
              <CollapsibleSection title="1. PROJECT ARCHITECTURE" defaultOpen colors={colors} badge="FOUNDATION">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                  Map the Next.js app to a WinUI 3 (Windows App SDK) project using MVVM with the CommunityToolkit.Mvvm package. Targets: Windows 10 1809+ and Windows 11.
                </p>
                <CodeSnippet title="Visual Studio Solution Structure" language="csharp" colors={colors} code={`// AnalystWorkbench.sln
├── AnalystWorkbench/
│   ├── App.xaml / App.xaml.cs       // Application entry (replaces layout.tsx)
│   ├── MainWindow.xaml              // Root window with NavigationView
│   ├── Models/
│   │   ├── User.cs                  // From AuthContext
│   │   ├── Conversation.cs          // From types/api.ts
│   │   ├── Document.cs              // Knowledge base types
│   │   └── BacktestResult.cs        // Backtest types
│   ├── ViewModels/
│   │   ├── AuthViewModel.cs         // Auth state (replaces AuthContext)
│   │   ├── ChatViewModel.cs         // Chat logic (replaces useChat)
│   │   ├── AFLViewModel.cs          // AFL generation
│   │   ├── KnowledgeViewModel.cs    // Doc management
│   │   ├── DashboardViewModel.cs    // Dashboard state
│   │   └── SettingsViewModel.cs     // Settings
│   ├── Views/
│   │   ├── SplashPage.xaml          // Splash screen
│   │   ├── LoginPage.xaml           // LoginPage.tsx -> XAML
│   │   ├── DashboardPage.xaml       // DashboardPage.tsx -> XAML
│   │   ├── ChatPage.xaml            // ChatPage.tsx -> XAML
│   │   ├── AFLGeneratorPage.xaml    // AFL code editor
│   │   ├── KnowledgeBasePage.xaml   // Document management
│   │   ├── BacktestPage.xaml        // Backtest analysis
│   │   ├── ContentPage.xaml         // Content hub
│   │   └── SettingsPage.xaml        // Settings
│   ├── Services/
│   │   ├── ApiClient.cs             // HttpClient (replaces api.ts)
│   │   ├── AuthService.cs           // Token management
│   │   ├── SSEService.cs            // SSE streaming
│   │   └── CredentialService.cs     // Windows Credential Manager
│   ├── Themes/
│   │   ├── Colors.xaml              // Brand color ResourceDictionary
│   │   ├── Styles.xaml              // Custom control styles
│   │   └── Typography.xaml          // Font definitions
│   ├── Helpers/
│   │   ├── NavigationHelper.cs      // Page navigation service
│   │   └── WindowsHelloHelper.cs    // Windows Hello biometrics
│   └── Assets/
│       └─�� potomac-icon.png         // App icon
└── AnalystWorkbench.Tests/
    └── ViewModelTests.cs            // Unit tests`} />
              </CollapsibleSection>

              <CollapsibleSection title="2. COMPONENT MAPPING TABLE" defaultOpen colors={colors} badge="CORE">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>Direct mappings between existing React/Next.js components and their WinUI 3 equivalents.</p>
                <div style={{ overflow: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '12px', padding: '12px 0', borderBottom: '2px solid rgba(254,192,15,0.3)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', fontFamily: "'Rajdhani', sans-serif" }}>
                    <span style={{ color: '#FEC00F' }}>REACT / NEXT.JS</span>
                    <span style={{ color: '#6cb6ff' }}>WINUI 3 / XAML</span>
                    <span style={{ color: colors.textMuted }}>NOTES</span>
                  </div>
                  <MappingRow jsComponent="MainLayout.tsx" nativeCode="NavigationView" notes="WinUI NavigationView with PaneDisplayMode='Left' for persistent sidebar, matching the web sidebar layout." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="AuthContext.tsx" nativeCode="ObservableObject ViewModel" notes="Use CommunityToolkit.Mvvm ObservableObject with [ObservableProperty] attributes." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="ThemeContext.tsx" nativeCode="RequestedTheme + ResourceDictionary" notes="Use Application.Current.RequestedTheme with ThemeResource references for dark/light support." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="useChat (AI SDK)" nativeCode="HttpClient SSE + IAsyncEnumerable" notes="Use HttpClient with ReadAsStreamAsync for SSE. Yield events via IAsyncEnumerable." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="Monaco Editor" nativeCode="Monaco via WebView2" notes="Embed Monaco Editor inside a WebView2 control for full code editing with syntax highlighting." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="PromptInput" nativeCode="TextBox + Button" notes="WinUI TextBox with PlaceholderText. Use KeyDown event for Enter-to-send behavior." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="Sonner toasts" nativeCode="InfoBar / TeachingTip" notes="Use WinUI InfoBar for persistent alerts, TeachingTip for contextual notifications." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="lucide-react icons" nativeCode="Segoe Fluent Icons" notes="Map each Lucide icon to Segoe Fluent Icons glyph. Use FontIcon or SymbolIcon." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="localStorage" nativeCode="ApplicationData / CredentialManager" notes="ApplicationData.Current.LocalSettings for preferences. Windows Credential Manager for secrets." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="useResponsive" nativeCode="VisualStateManager + AdaptiveTrigger" notes="Use XAML AdaptiveTrigger with MinWindowWidth for responsive layout breakpoints." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="apiClient (fetch)" nativeCode="HttpClient + System.Text.Json" notes="Use System.Net.Http.HttpClient with System.Text.Json for typed deserialization." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="React.useState" nativeCode="[ObservableProperty]" notes="CommunityToolkit.Mvvm auto-generates INotifyPropertyChanged from [ObservableProperty] attribute." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="React.useEffect" nativeCode="OnNavigatedTo / Loaded" notes="Use Page.OnNavigatedTo for init logic, Loaded event for UI-dependent setup." colors={colors} nativeColor="#6cb6ff" />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="3. NAVIGATION ARCHITECTURE" colors={colors} badge="NAV">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                  WinUI 3 NavigationView provides the persistent sidebar matching the web app MainLayout. Use Frame navigation for page switching within the content area.
                </p>
                <CodeSnippet title="MainWindow.xaml" language="xml" colors={colors} code={`<Window x:Class="AnalystWorkbench.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Analyst Workbench">

    <Grid>
        <NavigationView x:Name="NavView"
                        PaneDisplayMode="Left"
                        IsBackButtonVisible="Collapsed"
                        SelectionChanged="NavView_SelectionChanged"
                        Background="{ThemeResource SurfaceBrush}">

            <NavigationView.MenuItems>
                <NavigationViewItem Content="Dashboard" Tag="dashboard"
                    Icon="{ui:FontIcon Glyph=&#xE80F;}" />
                <NavigationViewItem Content="AFL Generator" Tag="afl"
                    Icon="{ui:FontIcon Glyph=&#xE943;}" />
                <NavigationViewItem Content="AI Chat" Tag="chat"
                    Icon="{ui:FontIcon Glyph=&#xE8BD;}" />
                <NavigationViewItem Content="Knowledge Base" Tag="knowledge"
                    Icon="{ui:FontIcon Glyph=&#xE7C3;}" />
                <NavigationViewItem Content="Backtest" Tag="backtest"
                    Icon="{ui:FontIcon Glyph=&#xE9D2;}" />
                <NavigationViewItem Content="Content" Tag="content"
                    Icon="{ui:FontIcon Glyph=&#xE8A1;}" />
                <NavigationViewItem Content="Reverse Engineer" Tag="reverse"
                    Icon="{ui:FontIcon Glyph=&#xE945;}" />
            </NavigationView.MenuItems>

            <NavigationView.FooterMenuItems>
                <NavigationViewItem Content="Settings" Tag="settings"
                    Icon="{ui:FontIcon Glyph=&#xE713;}" />
            </NavigationView.FooterMenuItems>

            <NavigationView.PaneHeader>
                <StackPanel Orientation="Horizontal" Spacing="12" Padding="12">
                    <Image Source="ms-appx:///Assets/potomac-icon.png"
                           Width="32" Height="32" />
                    <TextBlock Text="ANALYST" FontFamily="Rajdhani"
                               FontWeight="Bold" FontSize="18"
                               VerticalAlignment="Center" />
                </StackPanel>
            </NavigationView.PaneHeader>

            <!-- Content Frame -->
            <Frame x:Name="ContentFrame" />

        </NavigationView>
    </Grid>
</Window>`} />
                <CodeSnippet title="MainWindow.xaml.cs" language="csharp" colors={colors} code={`public sealed partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        // Apply Mica backdrop
        SystemBackdrop = new MicaBackdrop();
        // Navigate to dashboard on launch
        ContentFrame.Navigate(typeof(DashboardPage));
    }

    private void NavView_SelectionChanged(
        NavigationView sender,
        NavigationViewSelectionChangedEventArgs args)
    {
        if (args.SelectedItemContainer is NavigationViewItem item)
        {
            var tag = item.Tag?.ToString();
            Type pageType = tag switch
            {
                "dashboard" => typeof(DashboardPage),
                "afl"       => typeof(AFLGeneratorPage),
                "chat"      => typeof(ChatPage),
                "knowledge" => typeof(KnowledgeBasePage),
                "backtest"  => typeof(BacktestPage),
                "content"   => typeof(ContentPage),
                "reverse"   => typeof(ReverseEngineerPage),
                "settings"  => typeof(SettingsPage),
                _ => typeof(DashboardPage)
            };
            ContentFrame.Navigate(pageType,
                null,
                new SlideNavigationTransitionInfo
                {
                    Effect = SlideNavigationTransitionEffect.FromRight
                });
        }
    }
}`} />
              </CollapsibleSection>

              <CollapsibleSection title="4. AI CHAT & SSE STREAMING" colors={colors} badge="CORE">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                  Replace the AI SDK with HttpClient SSE parsing using IAsyncEnumerable for real-time chat streaming in C#.
                </p>
                <CodeSnippet title="SSEService.cs" language="csharp" colors={colors} code={`public class SSEService
{
    private readonly HttpClient _httpClient;
    private readonly CredentialService _credentials;

    public SSEService(HttpClient httpClient, CredentialService credentials)
    {
        _httpClient = httpClient;
        _credentials = credentials;
    }

    public async IAsyncEnumerable<StreamEvent> StreamChatAsync(
        List<ChatMessage> messages,
        string? conversationId,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        var payload = new
        {
            messages = messages.Select(m => new { m.Role, m.Content }),
            conversationId
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/chat")
        {
            Content = JsonContent.Create(payload)
        };
        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", _credentials.GetToken());

        var response = await _httpClient.SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            ct);

        response.EnsureSuccessStatusCode();
        using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var reader = new StreamReader(stream);

        while (!reader.EndOfStream && !ct.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(ct);
            if (line is null || !line.StartsWith("data: ")) continue;

            var data = line[6..];
            if (data == "[DONE]") yield break;

            var evt = ParseEvent(data);
            if (evt is not null) yield return evt;
        }
    }

    private StreamEvent? ParseEvent(string data)
    {
        var json = JsonDocument.Parse(data).RootElement;
        if (json.TryGetProperty("text", out var text))
            return new StreamEvent.TextDelta(text.GetString()!);
        if (json.TryGetProperty("tool_call", out var toolCall))
            return new StreamEvent.ToolCall(toolCall);
        return null;
    }
}`} />
              </CollapsibleSection>

              <CollapsibleSection title="5. THEME & STYLING" colors={colors} badge="UI">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                  Define brand colors and custom styles in XAML ResourceDictionaries. Use Mica material for the window backdrop and ThemeResource for automatic dark/light mode support.
                </p>
                <CodeSnippet title="Colors.xaml" language="xml" colors={colors} code={`<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation">
    <!-- Potomac Brand Colors -->
    <Color x:Key="PotomacYellow">#FEC00F</Color>
    <Color x:Key="PotomacGray">#212121</Color>
    <Color x:Key="PotomacTurquoise">#00DED1</Color>
    <Color x:Key="PotomacPink">#EB2F5C</Color>

    <SolidColorBrush x:Key="PotomacYellowBrush" Color="{StaticResource PotomacYellow}" />
    <SolidColorBrush x:Key="PotomacGrayBrush" Color="{StaticResource PotomacGray}" />

    <!-- Surface Colors (Dark) -->
    <Color x:Key="SurfacePrimaryDark">#FF121212</Color>
    <Color x:Key="SurfaceSecondaryDark">#FF1E1E1E</Color>
    <Color x:Key="BorderDark">#FF2E2E2E</Color>

    <SolidColorBrush x:Key="SurfaceBrush" Color="{ThemeResource SurfacePrimaryDark}" />
    <SolidColorBrush x:Key="CardBrush" Color="{ThemeResource SurfaceSecondaryDark}" />
    <SolidColorBrush x:Key="BorderBrush" Color="{ThemeResource BorderDark}" />

    <!-- Typography -->
    <FontFamily x:Key="RajdhaniFont">ms-appx:///Assets/Fonts/Rajdhani-Bold.ttf#Rajdhani</FontFamily>
    <FontFamily x:Key="QuicksandFont">ms-appx:///Assets/Fonts/Quicksand-Regular.ttf#Quicksand</FontFamily>

    <!-- Primary Button Style -->
    <Style x:Key="PotomacPrimaryButton" TargetType="Button">
        <Setter Property="Background" Value="{StaticResource PotomacYellowBrush}" />
        <Setter Property="Foreground" Value="Black" />
        <Setter Property="FontFamily" Value="{StaticResource RajdhaniFont}" />
        <Setter Property="FontWeight" Value="Bold" />
        <Setter Property="CornerRadius" Value="10" />
        <Setter Property="Padding" Value="24,12" />
    </Style>
</ResourceDictionary>`} />
              </CollapsibleSection>

              <CollapsibleSection title="6. STATE MANAGEMENT PATTERNS" colors={colors} badge="DATA">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                  Map React contexts and hooks to WinUI 3 patterns using CommunityToolkit.Mvvm for observable properties and relay commands.
                </p>
                <div style={{ overflow: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '12px', padding: '12px 0', borderBottom: '2px solid rgba(254,192,15,0.3)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', fontFamily: "'Rajdhani', sans-serif" }}>
                    <span style={{ color: '#FEC00F' }}>REACT PATTERN</span>
                    <span style={{ color: '#6cb6ff' }}>WINUI 3 / C# PATTERN</span>
                    <span style={{ color: colors.textMuted }}>MIGRATION NOTES</span>
                  </div>
                  <MappingRow jsComponent="createContext" nativeCode="DI container + ObservableObject" notes="Register ViewModels in App.xaml.cs DI. Use [ObservableProperty] for bindable properties." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="useState" nativeCode="[ObservableProperty]" notes="CommunityToolkit auto-generates PropertyChanged. Use x:Bind in XAML for binding." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="useEffect([])" nativeCode="OnNavigatedTo async" notes="Override OnNavigatedTo for page init logic. Use async Task for loading data." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="useEffect(dep)" nativeCode="partial OnXxxChanged" notes="CommunityToolkit generates partial OnXxxChanged method when property changes." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="useCallback" nativeCode="[RelayCommand]" notes="[RelayCommand] attribute generates ICommand. Bind to Button.Command in XAML." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="useMemo" nativeCode="Computed property + notify" notes="Create dependent properties, call OnPropertyChanged in setter of source property." colors={colors} nativeColor="#6cb6ff" />
                  <MappingRow jsComponent="localStorage" nativeCode="LocalSettings / CredentialManager" notes="ApplicationData.Current.LocalSettings for prefs. PasswordVault for credentials." colors={colors} nativeColor="#6cb6ff" />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="7. ICON MAPPING (LUCIDE TO SEGOE FLUENT)" colors={colors} badge="ICONS">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                  Map every Lucide icon to its closest Segoe Fluent Icons glyph for native Windows rendering.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '8px' }}>
                  {[
                    { lucide: 'LayoutDashboard', native: 'E80F (ViewDashboard)' },
                    { lucide: 'Code2', native: 'E943 (Code)' },
                    { lucide: 'MessageCircle', native: 'E8BD (Message)' },
                    { lucide: 'Database', native: 'E7C3 (Library)' },
                    { lucide: 'TrendingUp', native: 'E9D2 (AreaChart)' },
                    { lucide: 'Zap', native: 'E945 (LightningBolt)' },
                    { lucide: 'Settings', native: 'E713 (Settings)' },
                    { lucide: 'Sparkles', native: 'E9CE (Sparkle)' },
                    { lucide: 'Search', native: 'E721 (Search)' },
                    { lucide: 'Upload', native: 'E898 (Upload)' },
                    { lucide: 'Trash2', native: 'E74D (Delete)' },
                    { lucide: 'Copy', native: 'E8C8 (Copy)' },
                    { lucide: 'Eye / EyeOff', native: 'E7B3 / E7B4 (View/Hide)' },
                    { lucide: 'LogOut', native: 'F3B1 (SignOut)' },
                    { lucide: 'Plus', native: 'E710 (Add)' },
                    { lucide: 'ChevronLeft/Right', native: 'E76B / E76C' },
                    { lucide: 'FileText', native: 'E8A5 (Document)' },
                    { lucide: 'ArrowRight', native: 'E72A (Forward)' },
                    { lucide: 'Loader2', native: 'ProgressRing control' },
                  ].map((item) => (
                    <div key={item.lucide} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, fontSize: '12px' }}>
                      <code style={{ color: '#FEC00F', fontFamily: 'monospace', flex: 1, fontSize: '11px' }}>{item.lucide}</code>
                      <ArrowRight size={10} color={colors.textMuted} />
                      <code style={{ color: '#6cb6ff', fontFamily: 'monospace', flex: 1, fontSize: '11px' }}>{item.native}</code>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="8. TESTING & DEPLOYMENT" colors={colors} badge="SHIP">
                <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>Recommended testing and deployment approach for the WinUI 3 Windows app.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {[
                    { icon: Shield, title: 'Unit Tests', desc: 'Test ViewModels with MSTest or xUnit. Mock services using Moq. Test state transitions, data parsing, and command execution.' },
                    { icon: Monitor, title: 'UI Tests', desc: 'Use WinAppDriver or Appium for automated UI testing. Test all page navigation flows and window resize behavior.' },
                    { icon: Laptop, title: 'Packaging', desc: 'Package as MSIX for distribution. Configure Package.appxmanifest with capabilities, splash screen, and tile assets.' },
                    { icon: GitBranch, title: 'CI/CD Pipeline', desc: 'Use Azure DevOps or GitHub Actions for builds. Deploy via Microsoft Store or sideloading for enterprise distribution.' },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.title} style={{ padding: '20px', borderRadius: '14px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(254,192,15,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                          <Icon size={20} color="#FEC00F" />
                        </div>
                        <h4 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 600, color: colors.text, letterSpacing: '0.5px', marginBottom: '8px' }}>{item.title}</h4>
                        <p style={{ fontSize: '12px', color: colors.textMuted, lineHeight: 1.6 }}>{item.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </CollapsibleSection>
            </>
          )}
        </section>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <footer style={{ padding: '32px 0', borderTop: `1px solid ${colors.border}`, textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: colors.textMuted }}>Potomac Analyst Workbench - Non-Apple Developer Blueprint v3.0 (Android, Windows, Samsung TV Tizen)</p>
        </footer>
      </div>
    </div>
  )
}

export default NonAppleDeveloperPage
