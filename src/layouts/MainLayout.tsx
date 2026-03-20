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
  FlaskConical,
  BarChart3,
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
  group?: 'main' | 'tools' | 'system';
}

const navItems: NavItem[] = [
  // Main
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard, group: 'main' },
  { name: 'Chat', href: '/chat', icon: MessageCircle, group: 'main' },
  
  // Tools
  { name: 'Code Studio', href: '/afl', icon: Code2, group: 'tools' },
  { name: 'Backtest', href: '/backtest', icon: BarChart3, group: 'tools' },
  { name: 'Analyzer', href: '/reverse-engineer', icon: FlaskConical, group: 'tools' },
  
  // Resources
  { name: 'Skills', href: '/skills', icon: Sparkles, badge: 'New', group: 'system' },
  { name: 'Knowledge', href: '/knowledge', icon: Database, group: 'system' },
  { name: 'Settings', href: '/settings', icon: Settings, group: 'system' },
];

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

  // Modern blue/teal color palette
  const colors = {
    background: isDark ? '#0A0A0A' : '#ffffff',
    sidebar: isDark ? '#0D0D0D' : '#ffffff',
    border: isDark ? 'rgba(96,165,250,0.15)' : 'rgba(96,165,250,0.1)',
    text: isDark ? '#FFFFFF' : '#111111',
    textMuted: isDark ? '#93C5FD' : '#3B82F6',
    textSecondary: isDark ? '#A5B4FC' : '#60A5FA',
    hoverBg: isDark ? 'rgba(96,165,250,0.15)' : 'rgba(96,165,250,0.08)',
    accent: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
    accentText: '#0A0A0B',
    accentGlow: 'rgba(96,165,250,0.3)',
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
            height: '80px',
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
                <span style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: '20px',
                  color: colors.text,
                  letterSpacing: '2px',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  textShadow: isDark ? '0 0 15px rgba(96,165,250,0.3)' : 'none',
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

        {/* Modern Navigation */}
        <nav style={{
          flex: 1,
          padding: isMobile ? '20px 12px' : (collapsed ? '16px 8px' : '20px 12px'),
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          {/* Group items by category */}
          {(['main', 'tools', 'system'] as const).map((group, groupIndex) => {
            const groupItems = navItems.filter(item => item.group === group);
            if (groupItems.length === 0) return null;
            
            return (
              <div key={group}>
                {/* Group separator - only show between groups, not before first */}
                {groupIndex > 0 && (
                  <div style={{
                    height: '1px',
                    background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)`,
                    margin: collapsed && !isMobile ? '12px 4px' : '12px 8px',
                  }} />
                )}
                
                {groupItems.map((item) => {
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
                        gap: '12px',
                        padding: isMobile ? '12px 16px' : (collapsed ? '12px 8px' : '12px 14px'),
                        marginBottom: '2px',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        fontFamily: "'Instrument Sans', sans-serif",
                        fontSize: '14px',
                        fontWeight: 500,
                        letterSpacing: '0.01em',
                        color: active ? '#ffffff' : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)'),
                        justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                        minHeight: '44px',
                        position: 'relative',
                        background: active 
                          ? 'linear-gradient(135deg, #60A5FA 0%, #818CF8 100%)'
                          : 'transparent',
                        boxShadow: active 
                          ? '0 4px 12px rgba(96,165,250,0.3)'
                          : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = isDark 
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.04)';
                          e.currentTarget.style.color = isDark ? '#ffffff' : '#000000';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)';
                        }
                      }}
                      title={collapsed && !isMobile ? item.name : undefined}
                    >
                      <Icon 
                        size={20} 
                        style={{
                          flexShrink: 0,
                          opacity: active ? 1 : 0.8,
                        }}
                      />
                      
                      {(!collapsed || isMobile) && (
                        <>
                          <span>{item.name}</span>
                          {item.badge && (
                            <span style={{
                              marginLeft: 'auto',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: active 
                                ? 'rgba(255,255,255,0.2)'
                                : 'linear-gradient(135deg, #60A5FA 0%, #818CF8 100%)',
                              color: '#ffffff',
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                            }}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
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
              background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#0A0A0B',
              fontSize: '16px',
              flexShrink: 0,
              boxShadow: '0 8px 24px rgba(96,165,250,0.35)',
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
        overflowX: 'hidden',
        overflowY: 'auto',
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
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
        
        /* Smooth scrolling for main content */
        main {
          scroll-behavior: smooth;
        }
        
        /* Enhanced scrollbar for main content */
        main::-webkit-scrollbar {
          width: 8px;
        }
        main::-webkit-scrollbar-track {
          background: transparent;
        }
        main::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(254,192,15,0.4), rgba(254,192,15,0.2));
          border-radius: 8px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        main::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(254,192,15,0.6), rgba(254,192,15,0.4));
          background-clip: padding-box;
        }
        
        /* Firefox scrollbar */
        main {
          scrollbar-width: thin;
          scrollbar-color: rgba(254,192,15,0.35) transparent;
        }
        
        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          main {
            scroll-behavior: auto;
          }
        }
      `}</style>
    </div>
  );
}

export default MainLayout;
