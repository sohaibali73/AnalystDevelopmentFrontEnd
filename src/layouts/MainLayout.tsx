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
  { name: 'BACKTEST', href: '/backtest', icon: TrendingUp },
  { name: 'REVERSE ENGINEER', href: '/reverse-engineer', icon: Zap },
  { name: 'SETTINGS', href: '/settings', icon: Settings },
];

// Hidden pages - accessible via URL but not shown in navigation
// developer, non-apple-developer, autopilot, deck-generator

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

  // Theme-aware colors
  const colors = {
    background: isDark ? '#121212' : '#ffffff',
    sidebar: isDark ? '#1E1E1E' : '#f5f5f5',
    border: isDark ? '#424242' : '#e0e0e0',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    textSecondary: isDark ? '#757575' : '#9E9E9E',
    hoverBg: isDark ? '#2A2A2A' : '#e8e8e8',
    accent: '#FEC00F',
    accentText: '#212121',
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
      fontFamily: "'Quicksand', sans-serif",
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
          backgroundColor: colors.sidebar,
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 100,
          transition: 'all 0.3s ease',
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
            }}>
              <img 
                src={logo} 
                alt="Analyst Logo" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain' 
                }} 
              />
            </div>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: '18px',
              color: colors.text,
              letterSpacing: '1.5px',
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
              borderRadius: '8px',
              transition: 'background-color 0.2s ease',
              minWidth: '48px',
              minHeight: '48px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.hoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
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
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 98,
            animation: 'fadeIn 0.2s ease',
            WebkitTapHighlightColor: 'transparent',
            backdropFilter: 'blur(2px)',
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
        backgroundColor: colors.sidebar,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        zIndex: 99,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {/* Desktop Logo Section */}
        {!isMobile && (
          <div style={{
            height: '72px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
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
              }}>
                <img 
                  src={logo} 
                  alt="Analyst Logo" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain' 
                  }} 
                />
              </div>
              {!collapsed && (
                <span style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: '20px',
                  color: colors.text,
                  letterSpacing: '2px',
                  transition: 'color 0.3s ease',
                }}>
                  ANALYST
                </span>
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
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease',
                minWidth: '40px',
                minHeight: '40px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.hoverBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav style={{
          flex: 1,
          padding: isMobile ? '24px 16px' : (collapsed ? '20px 8px' : '20px 12px'),
          overflowY: 'auto',
        }}>
          {navItems.map((item) => {
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
                  padding: isMobile ? '16px 20px' : (collapsed ? '14px 8px' : '14px 16px'),
                  marginBottom: '6px',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: isMobile ? '15px' : '13px',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  backgroundColor: active ? colors.accent : 'transparent',
                  color: active ? colors.accentText : colors.textMuted,
                  justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                  minHeight: isMobile ? '52px' : '48px',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = colors.hoverBg;
                    e.currentTarget.style.color = colors.text;
                    if (!collapsed || isMobile) {
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.textMuted;
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
                title={collapsed && !isMobile ? item.name : undefined}
              >
                <Icon size={isMobile ? 22 : 20} style={{ flexShrink: 0 }} />
                {(!collapsed || isMobile) && (
                  <>
                    <span>{item.name}</span>
                    {'badge' in item && item.badge && (
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: isDark ? 'rgba(254, 192, 15, 0.2)' : 'rgba(254, 192, 15, 0.3)',
                        color: isDark ? '#FEC00F' : '#996600',
                        letterSpacing: '0.5px',
                        lineHeight: 1.4,
                        flexShrink: 0,
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

        {/* User Section */}
        <div style={{
          padding: isMobile ? '20px 16px' : '20px',
          borderTop: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px',
            marginBottom: '16px',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FEC00F 0%, #FFD740 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#212121',
              fontSize: '16px',
              flexShrink: 0,
            }}>
              {user?.name?.charAt(0).toUpperCase() || user?.nickname?.charAt(0).toUpperCase() || 'U'}
            </div>
            {(!collapsed || isMobile) && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  color: colors.text, 
                  fontSize: '15px', 
                  fontWeight: 600, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  lineHeight: 1.4,
                  transition: 'color 0.3s ease',
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
                  marginTop: '2px',
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
              gap: '10px',
              padding: '14px 16px',
              backgroundColor: 'transparent',
              color: '#DC2626',
              border: `1px solid ${colors.border}`,
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: isMobile ? '14px' : '13px',
              fontWeight: 600,
              fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: '0.5px',
              transition: 'all 0.2s ease',
              minHeight: isMobile ? '52px' : '48px',
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
              e.currentTarget.style.borderColor = '#DC2626';
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = colors.border;
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
        transition: 'margin-left 0.3s ease',
        overflow: 'hidden',
      }}>
        {children}
      </main>
    </div>
  );
}

export default MainLayout;
