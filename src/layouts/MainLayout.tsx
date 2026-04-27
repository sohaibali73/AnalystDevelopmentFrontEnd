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
  Bug,
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
  { name: 'CHAT', href: '/chat', icon: MessageCircle },
  { name: 'KNOWLEDGE BASE', href: '/knowledge', icon: Database },
  { name: 'SETTINGS', href: '/settings', icon: Settings },
  { name: 'DEBUG', href: '/debug', icon: Bug },
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
      
      if (mobile) {
        setCollapsed(true);
        setMobileMenuOpen(false);
      } else if (tablet) {
        setCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      backgroundColor: 'var(--bg)',
      fontFamily: "'Rajdhani', sans-serif",
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
           background: 'rgba(13, 13, 16, 0.6)',
           backdropFilter: 'blur(20px)',
           WebkitBackdropFilter: 'blur(20px)',
           borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 100,
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
               background: 'var(--accent-dim)',
               border: '1px solid var(--border)',
               boxShadow: '0 0 20px var(--accent-glow)',
            }}>
              <img 
                src={logo} 
                alt="Potomac Logo" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                 filter: 'drop-shadow(0 0 8px var(--accent-glow))',
                }} 
              />
            </div>

          </div>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
               background: 'var(--accent-dim)',
               border: '1px solid var(--border)',
               color: 'var(--accent)',
              cursor: 'pointer',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              transition: 'all 0.3s ease',
              minWidth: '48px',
              minHeight: '48px',
            }}
            onMouseEnter={(e) => { 
                 e.currentTarget.style.background = 'var(--accent-dim)';
                 e.currentTarget.style.boxShadow = '0 0 20px var(--accent-glow)';
            }}
            onMouseLeave={(e) => { 
                 e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>
      )}

      {/* Mobile Menu Backdrop */}
      {isMobile && mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 998,
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position: 'fixed',
        left: isMobile ? (mobileMenuOpen ? 0 : '-100%') : 0,
        top: 0,
        bottom: 0,
        width: isMobile ? '280px' : sidebarWidth,
        background: 'rgba(26, 26, 26, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(212, 169, 68, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        transition: isMobile 
          ? 'left 0.4s cubic-bezier(0.16, 1, 0.3, 1)' 
          : 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: isMobile ? 999 : 50,
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Logo Section */}
        <div style={{
          padding: collapsed && !isMobile ? '24px 16px' : '32px 24px',
          borderBottom: '1px solid rgba(212, 169, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          gap: '16px',
          flexShrink: 0,
          background: 'rgba(212, 169, 68, 0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: collapsed && !isMobile ? '48px' : '52px',
              height: collapsed && !isMobile ? '48px' : '52px',
              borderRadius: '14px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(212, 169, 68, 0.15)',
              border: '1px solid rgba(212, 169, 68, 0.3)',
              boxShadow: '0 0 24px rgba(212, 169, 68, 0.2)',
              flexShrink: 0,
            }}>
              <img 
                src={logo} 
                alt="Potomac Logo" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 10px rgba(212, 169, 68, 0.5))',
                }} 
              />
            </div>

          </div>
          
          {!isMobile && (!collapsed || isMobile) && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: 'rgba(212, 169, 68, 0.1)',
                border: '1px solid rgba(212, 169, 68, 0.2)',
                borderRadius: '10px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#D4A944',
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212, 169, 68, 0.2)';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(212, 169, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(212, 169, 68, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                title={collapsed && !isMobile ? item.name : ''}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: collapsed && !isMobile ? '16px' : '14px 16px',
                  background: active 
                    ? 'rgba(212, 169, 68, 0.15)' 
                    : 'transparent',
                  color: active ? '#ffffff' : '#9ca3af',
                  border: active 
                    ? '1px solid rgba(212, 169, 68, 0.3)'
                    : '1px solid transparent',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '1.5px',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: active 
                    ? '0 0 20px rgba(212, 169, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : 'none',
                  justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(212, 169, 68, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(212, 169, 68, 0.15)';
                    e.currentTarget.style.color = '#D4A944';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                {/* Active indicator glow */}
                {active && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 50% 50%, rgba(212, 169, 68, 0.1), transparent 70%)',
                    pointerEvents: 'none',
                  }} />
                )}
                
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: active 
                    ? 'rgba(212, 169, 68, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: active 
                    ? '1px solid rgba(212, 169, 68, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: active 
                    ? '0 0 16px rgba(212, 169, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    : 'none',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                }}>
                  <Icon size={isMobile ? 20 : 18} style={{ 
                    color: active ? '#D4A944' : 'currentColor',
                    filter: active ? 'drop-shadow(0 0 6px rgba(212, 169, 68, 0.6))' : 'none',
                  }} />
                </div>
                
                {(!collapsed || isMobile) && (
                  <>
                    <span style={{
                      position: 'relative',
                      zIndex: 1,
                      textShadow: active ? '0 0 12px rgba(212, 169, 68, 0.4)' : 'none',
                    }}>
                      {item.name}
                    </span>
                    {'badge' in item && item.badge && (
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(212, 169, 68, 0.2)',
                        color: '#D4A944',
                        letterSpacing: '0.5px',
                        lineHeight: 1.4,
                        border: '1px solid rgba(212, 169, 68, 0.3)',
                        boxShadow: '0 0 12px rgba(212, 169, 68, 0.2)',
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
          padding: isMobile ? '24px 16px' : '24px',
          borderTop: '1px solid rgba(212, 169, 68, 0.1)',
          flexShrink: 0,
          background: 'rgba(212, 169, 68, 0.03)',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #D4A944 0%, #C9A03D 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#0a0a0a',
              fontSize: '18px',
              flexShrink: 0,
              boxShadow: '0 0 24px rgba(212, 169, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              {user?.name?.charAt(0).toUpperCase() || user?.nickname?.charAt(0).toUpperCase() || 'U'}
            </div>
            {(!collapsed || isMobile) && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  color: '#ffffff', 
                  fontSize: '15px', 
                  fontWeight: 700, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  lineHeight: 1.4,
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.5px',
                  textShadow: '0 0 12px rgba(212, 169, 68, 0.3)',
                }}>
                  {user?.name || user?.nickname || 'User'}
                </div>
                <div style={{ 
                  color: '#6b7280', 
                  fontSize: '12px', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  lineHeight: 1.4,
                  marginTop: '4px',
                  fontFamily: "'Quicksand', sans-serif",
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
              padding: '14px 18px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: isMobile ? '13px' : '12px',
              fontWeight: 700,
              fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: '1.5px',
              transition: 'all 0.3s ease',
              minHeight: '48px',
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
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
    </div>
  );
}

export default MainLayout;