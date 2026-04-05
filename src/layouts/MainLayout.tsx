'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Menu, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Code2,
  MessageCircle,
  Database,
  TrendingUp,
  Zap,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Smartphone,
  Monitor,
  Rocket,
  Presentation,
  Star,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

// Use logo from public directory
const logo = '/potomac-icon.png';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'DASHBOARD', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AFL GENERATOR', href: '/afl', icon: Code2 },
  { name: 'CHAT', href: '/chat', icon: MessageCircle },
  { name: 'KNOWLEDGE BASE', href: '/knowledge', icon: Database },
  { name: 'SETTINGS', href: '/settings', icon: Settings },
];

// Hidden pages - accessible via URL but not shown in navigation
// reverse-engineer, skills, backtest, developer, deck-generator, non-apple-developer, autopilot

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { actualTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      // Auto-collapse on tablet, hide on mobile
      if (mobile) {
        setCollapsed(true);
        setMobileMenuOpen(false);
      } else if (tablet) {
        setCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Run on mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen, isMobile]);

  const sidebarWidth = isMobile ? 0 : (collapsed ? 80 : 256);
  const isDark = actualTheme === 'dark';

  // Theme-aware colors using CSS variables
  const colors = {
    background: 'var(--bg)',
    sidebar: 'var(--bg-card)',
    border: 'var(--border)',
    text: 'var(--text)',
    textMuted: 'var(--text-muted)',
    textSecondary: 'var(--text-muted)',
    hoverBg: 'var(--accent-dim)',
    accent: 'var(--accent)',
    accentText: '#0A0A0B',
    accentGlow: 'var(--accent-glow)',
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname === href;
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: colors.background,
      fontFamily: "'Instrument Sans', sans-serif",
      transition: 'background-color 0.3s ease',
      position: 'relative',
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          background: isDark 
            ? 'linear-gradient(180deg, rgba(96,165,250,0.1), rgba(96,165,250,0.05))'
            : 'linear-gradient(180deg, rgba(96,165,250,0.08), rgba(96,165,250,0.03))',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 100,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isDark 
            ? '0 4px 20px rgba(96,165,250,0.15)'
            : '0 4px 20px rgba(96,165,250,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDark 
                ? 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(167,139,250,0.12))'
                : 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(167,139,250,0.09))',
              border: `1px solid ${colors.border}`,
              boxShadow: isDark 
                ? '0 8px 24px rgba(96,165,250,0.15)'
                : '0 8px 24px rgba(96,165,250,0.1)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <img 
                src={logo} 
                alt="Analyst Logo" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  filter: isDark ? 'brightness(1.1) saturate(1.2)' : 'none',
                }} 
              />
            </div>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '18px',
              color: colors.text,
              letterSpacing: '1.5px',
              textShadow: isDark ? '0 0 15px rgba(96,165,250,0.3)' : 'none',
            }}>
              ANALYST
            </span>
          </div>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: colors.text,
              cursor: 'pointer',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              minWidth: '48px',
              minHeight: '48px',
              boxShadow: isDark 
                ? '0 4px 16px rgba(96,165,250,0.15)'
                : '0 4px 16px rgba(96,165,250,0.1)',
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = isDark 
                ? '0 8px 24px rgba(96,165,250,0.25)'
                : '0 8px 24px rgba(96,165,250,0.15)';
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isDark 
                ? '0 4px 20px rgba(96,165,250,0.15)'
                : '0 4px 20px rgba(96,165,250,0.08)';
            }}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>
      )}

      {/* Backdrop for mobile menu */}
      {mobileMenuOpen && isMobile && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: isDark 
              ? 'radial-gradient(circle at 50% 50%, rgba(96,165,250,0.3) 0%, rgba(96,165,250,0.1) 50%, transparent 100%)'
              : 'radial-gradient(circle at 50% 50%, rgba(96,165,250,0.2) 0%, rgba(96,165,250,0.05) 50%, transparent 100%)',
            zIndex: 98,
            animation: 'fadeIn 0.2s ease',
            WebkitTapHighlightColor: 'transparent',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setMobileMenuOpen(false)}
          onTouchEnd={(e) => {
            e.preventDefault();
            setMobileMenuOpen(false);
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position: 'fixed',
        left: isMobile ? (mobileMenuOpen ? 0 : '-100%') : 0,
        top: isMobile ? '64px' : 0,
        height: isMobile ? 'calc(100vh - 64px)' : '100vh',
        width: isMobile ? '280px' : sidebarWidth,
        background: isDark 
          ? 'linear-gradient(180deg, #0D0D0D, #0A0A0A)'
          : 'linear-gradient(180deg, #ffffff, #fafafa)',
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 99,
        overflowY: 'auto',
        overflowX: 'hidden',
        boxShadow: isDark 
          ? '0 8px 32px rgba(96,165,250,0.15), inset 0 0 20px rgba(96,165,250,0.05)'
          : '0 8px 32px rgba(96,165,250,0.1), inset 0 0 20px rgba(96,165,250,0.03)',
      }}>
        {/* Enhanced Logo Section */}
        {!isMobile && (
          <div style={{
            height: collapsed ? '80px' : '88px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Floating accent background */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: `radial-gradient(circle at 70% 30%, rgba(96,165,250,0.08), transparent 50%)`,
              opacity: 0,
              transition: 'opacity 0.5s ease',
              pointerEvents: 'none',
            }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(167,139,250,0.12))'
                  : 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(167,139,250,0.09))',
                border: `1px solid ${colors.border}`,
                boxShadow: isDark 
                  ? '0 8px 24px rgba(96,165,250,0.15)'
                  : '0 8px 24px rgba(96,165,250,0.1)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}>
                <img 
                  src={logo} 
                  alt="Analyst Logo" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    filter: isDark ? 'brightness(1.1) saturate(1.2)' : 'none',
                  }} 
                />
              </div>
              {!collapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: '20px',
                    color: colors.text,
                    letterSpacing: '2px',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    textShadow: isDark ? '0 0 15px rgba(96,165,250,0.3)' : 'none',
                    lineHeight: 1,
                  }}>
                    ANALYST
                  </span>
                  {/* RELEASE CANDIDATE 3.0 badge - uses theme accent */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '8px',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase' as const,
                    color: 'var(--accent)',
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--border-hover)',
                    borderRadius: '5px',
                    padding: '2px 7px',
                    boxShadow: '0 0 8px var(--accent-glow)',
                    animation: 'devBetaPulse 2.5s ease-in-out infinite',
                    whiteSpace: 'nowrap' as const,
                  }}>
                    <span style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      flexShrink: 0,
                      boxShadow: '0 0 4px var(--accent-glow)',
                      animation: 'devBetaDot 2.5s ease-in-out infinite',
                    }} />
                    RELEASE CANDIDATE 3.0
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: 'none',
                border: 'none',
                color: colors.textMuted,
                cursor: 'pointer',
                padding: '10px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                minWidth: '40px',
                minHeight: '40px',
                boxShadow: isDark 
                  ? '0 4px 16px rgba(96,165,250,0.15)'
                  : '0 4px 16px rgba(96,165,250,0.1)',
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.color = '#93C5FD';
                e.currentTarget.style.boxShadow = isDark 
                  ? '0 8px 24px rgba(96,165,250,0.25)'
                  : '0 8px 24px rgba(96,165,250,0.15)';
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.color = colors.textMuted;
                e.currentTarget.style.boxShadow = isDark 
                  ? '0 4px 16px rgba(96,165,250,0.15)'
                  : '0 4px 16px rgba(96,165,250,0.1)';
              }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        )}

        {/* Enhanced Navigation */}
        <nav style={{
          flex: 1,
          padding: isMobile ? '24px 16px' : (collapsed ? '20px 8px' : '24px 16px'),
          overflowY: 'auto',
        }}>
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: isMobile ? '16px 20px' : (collapsed ? '14px 8px' : '16px 16px'),
                  marginBottom: '8px',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  fontFamily: "'Syne', sans-serif",
                  fontSize: isMobile ? '15px' : '13px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: active ? colors.accentText : colors.textMuted,
                  justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                  minHeight: isMobile ? '52px' : '52px',
                  position: 'relative',
                  transform: 'translateZ(0)',
                  boxShadow: active 
                    ? '0 8px 24px var(--accent-glow), inset 0 0 20px var(--accent-dim)'
                    : 'none',
                  background: active 
                    ? 'var(--accent)'
                    : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.transform = 'translateX(6px) translateZ(0)';
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.background = 'var(--accent-dim)';
                    e.currentTarget.style.boxShadow = '0 8px 24px var(--accent-glow)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.transform = 'translateX(0) translateZ(0)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
                title={collapsed && !isMobile ? item.name : undefined}
              >
                {/* Enhanced icon container */}
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: active 
                    ? 'rgba(255,255,255,0.2)'
                    : 'var(--accent-dim)',
                  border: active 
                    ? '1px solid rgba(255,255,255,0.3)'
                    : '1px solid var(--border)',
                  boxShadow: active 
                    ? '0 4px 16px var(--accent-glow)'
                    : 'none',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  flexShrink: 0,
                }}>
                  <Icon size={isMobile ? 20 : 18} style={{ color: active ? '#ffffff' : 'var(--accent)' }} />
                </div>
                
                {(!collapsed || isMobile) && (
                  <>
                    <span style={{
                      position: 'relative',
                      zIndex: 1,
                    }}>
                      {item.name}
                    </span>
                    {'badge' in item && item.badge && (
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: active 
                          ? 'rgba(255,255,255,0.2)'
                          : 'var(--accent-dim)',
                        color: active ? '#ffffff' : 'var(--accent)',
                        letterSpacing: '0.5px',
                        lineHeight: 1.4,
                        border: active 
                          ? '1px solid rgba(255,255,255,0.3)'
                          : '1px solid var(--border)',
                        boxShadow: active 
                          ? '0 4px 12px var(--accent-glow)'
                          : 'none',
                        flexShrink: 0,
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Enhanced User Section */}
        <div style={{
          padding: isMobile ? '24px 16px' : '24px',
          borderTop: `1px solid ${colors.border}`,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Floating accent background */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: `radial-gradient(circle at 70% 30%, rgba(96,165,250,0.06), transparent 50%)`,
            opacity: 0,
            transition: 'opacity 0.5s ease',
            pointerEvents: 'none',
          }} />
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#0A0A0B',
              fontSize: '16px',
              flexShrink: 0,
              boxShadow: '0 8px 24px var(--accent-glow)',
              border: '1px solid rgba(255,255,255,0.3)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              {user?.name?.charAt(0).toUpperCase() || user?.nickname?.charAt(0).toUpperCase() || 'U'}
            </div>
            {(!collapsed || isMobile) && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  color: colors.text, 
                  fontSize: '15px', 
                  fontWeight: 700, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  lineHeight: 1.4,
                  transition: 'color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  textShadow: isDark ? '0 0 10px rgba(96,165,250,0.3)' : 'none',
                }}>
                  {user?.name || user?.nickname || 'User'}
                </div>
                <div style={{ 
                  color: colors.textSecondary, 
                  fontSize: '13px', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  lineHeight: 1.4,
                  marginTop: '4px',
                  fontFamily: "'Instrument Sans', sans-serif",
                }}>
                  {user?.email || 'user@example.com'}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => { 
              logout(); 
              router.push('/login');
              if (isMobile) setMobileMenuOpen(false);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '16px 18px',
              background: 'transparent',
              color: '#EF4444',
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              cursor: 'pointer',
              fontSize: isMobile ? '14px' : '13px',
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              letterSpacing: '0.5px',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              minHeight: isMobile ? '52px' : '52px',
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <LogOut size={isMobile ? 18 : 16} />
            {(!collapsed || isMobile) && 'LOGOUT'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        height: isMobile ? 'calc(100vh - 64px)' : '100vh',
        marginLeft: isMobile ? 0 : sidebarWidth,
        marginTop: isMobile ? '64px' : 0,
        width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
        transition: 'margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {children}
      </main>

      {/* Enhanced CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @keyframes slideOutToLeft {
          from { transform: translateX(0); }
          to   { transform: translateX(-100%); }
        }
        @keyframes devBetaPulse {
          0%, 100% {
            box-shadow: 0 0 6px rgba(252,211,77,0.2), 0 0 16px rgba(252,211,77,0.08);
            border-color: rgba(252,211,77,0.28);
          }
          50% {
            box-shadow: 0 0 12px rgba(252,211,77,0.5), 0 0 28px rgba(252,211,77,0.22);
            border-color: rgba(252,211,77,0.55);
          }
        }
        @keyframes devBetaDot {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.35); box-shadow: 0 0 6px rgba(252,211,77,0.9); }
        }
      `}</style>
    </div>
  );
}

export default MainLayout;
