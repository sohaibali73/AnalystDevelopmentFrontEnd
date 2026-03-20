'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Eye, 
  EyeOff, 
  LogIn, 
  Loader2, 
  AlertCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsSmallMobile(window.innerWidth < 768);
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      // Note: AuthContext.login() already handles navigation to /dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: 'var(--bg)',
      display: 'flex',
      fontFamily: "'Instrument Sans', sans-serif",
      flexDirection: isMobile ? 'column' : 'row',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      paddingTop: '36px', // offset for the fixed DEV banner
    }}>
      {/* ── DEV ENVIRONMENT TOP BANNER ── */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: '36px',
        background: 'repeating-linear-gradient(90deg, var(--accent) 0px, var(--accent) 60px, var(--bg) 60px, var(--bg) 120px)',
        backgroundSize: '120px 100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        animation: 'devBannerScroll 6s linear infinite',
        borderBottom: '2px solid rgba(96,165,250,0.6)',
        boxShadow: '0 2px 20px rgba(96,165,250,0.25)',
      }}>
        {/* Frosted label sits on top of the moving stripes */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'rgba(10,10,11,0.82)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          padding: '0 20px',
          borderRadius: '4px',
          height: '26px',
          border: '1px solid rgba(96,165,250,0.35)',
        }}>
          {/* Blinking dot */}
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent)',
            display: 'inline-block',
            animation: 'devDotBlink 1.2s ease-in-out infinite',
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '3px',
            color: 'var(--accent)',
          }}>
            DEVELOPMENT ENVIRONMENT — NOT FOR PRODUCTION USE
          </span>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent)',
            display: 'inline-block',
            animation: 'devDotBlink 1.2s ease-in-out infinite 0.6s',
            flexShrink: 0,
          }} />
        </div>
      </div>

      {/* ── DEV CORNER BADGE ── */}
      <div style={{
        position: 'fixed',
        bottom: '52px', // sits just above the copyright footer
        right: '16px',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: isDark ? 'rgba(10,10,11,0.9)' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(96,165,250,0.5)',
        borderRadius: '8px',
        padding: '6px 12px',
        boxShadow: '0 0 0 0 rgba(96,165,250,0.4)',
        animation: 'devBadgePulse 2.5s ease-in-out infinite',
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent)',
          display: 'inline-block',
          animation: 'devDotBlink 1.2s ease-in-out infinite',
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '2px',
          color: 'var(--accent)',
        }}>
          DEV
        </span>
        <span style={{
          fontFamily: "'Instrument Sans', sans-serif",
          fontSize: '11px',
          fontWeight: 600,
          color: isDark ? '#757575' : '#999999',
          letterSpacing: '0.5px',
        }}>
          localhost
        </span>
      </div>

      {/* Left Side - Branding */}
      <div style={{
        flex: isMobile ? undefined : 1,
        background: isDark 
          ? 'linear-gradient(135deg, #0A0A0B 0%, #0D1117 50%, #0A0A0B 100%)'
          : 'linear-gradient(160deg, #f8fbff 0%, #f0f7ff 40%, #e8f2ff 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isSmallMobile ? '48px 24px' : '60px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: isMobile ? 'auto' : '100dvh',
      }}>
        {/* Enhanced Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(96,165,250,0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(96,165,250,0.08) 0%, transparent 40%),
            radial-gradient(circle at 60% 20%, rgba(167,139,250,0.06) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }} />

        {/* Enhanced Grid Lines */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(96,165,250,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(96,165,250,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />

        {/* Floating particles - using fixed values to avoid hydration mismatch */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          {[
            { size: 4, opacity: 0.35, left: 15, top: 20, duration: 8 },
            { size: 3, opacity: 0.4, left: 85, top: 15, duration: 6 },
            { size: 5, opacity: 0.3, left: 45, top: 80, duration: 9 },
            { size: 3.5, opacity: 0.45, left: 70, top: 55, duration: 7 },
            { size: 4.5, opacity: 0.35, left: 25, top: 65, duration: 10 },
            { size: 3, opacity: 0.5, left: 90, top: 40, duration: 6.5 },
            { size: 4, opacity: 0.4, left: 10, top: 85, duration: 8.5 },
            { size: 3.5, opacity: 0.35, left: 55, top: 10, duration: 7.5 },
          ].map((particle, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              borderRadius: '50%',
              background: `rgba(96,165,250,${particle.opacity})`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animation: `float ${particle.duration}s linear infinite`,
              opacity: particle.opacity + 0.2,
            }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '500px' }}>
          {/* Logo with enhanced container */}
          <div style={{
            width: isSmallMobile ? '90px' : '110px',
            height: isSmallMobile ? '90px' : '110px',
            borderRadius: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 36px',
            overflow: 'hidden',
            background: isDark 
              ? 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(167,139,250,0.08))'
              : 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(167,139,250,0.06))',
            border: `1px solid ${isDark ? 'rgba(96,165,250,0.2)' : 'rgba(96,165,250,0.15)'}`,
            boxShadow: isDark 
              ? '0 8px 32px rgba(96,165,250,0.15), inset 0 0 20px rgba(96,165,250,0.05)'
              : '0 8px 32px rgba(96,165,250,0.1), inset 0 0 20px rgba(96,165,250,0.03)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <img 
              src="/potomac-icon.png" 
              alt="Analyst Logo" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                filter: isDark ? 'brightness(1.1) saturate(1.2)' : 'none',
              }} 
            />
          </div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: isSmallMobile ? '42px' : '52px',
            fontWeight: 800,
            color: isDark ? 'var(--text)' : 'var(--text)',
            letterSpacing: '-0.03em',
            marginBottom: '8px',
            textShadow: isDark ? '0 0 20px rgba(96,165,250,0.3)' : 'none',
          }}>
            ANALYST
          </h1>
          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: isSmallMobile ? '14px' : '17px',
            fontWeight: 600,
            color: 'var(--accent)',
            letterSpacing: '0.14em',
            marginBottom: isSmallMobile ? '36px' : '52px',
            textTransform: 'uppercase',
            textShadow: '0 0 15px rgba(96,165,250,0.4)',
          }}>
            BY POTOMAC
          </p>

          {/* Enhanced Tagline */}
          <div style={{
            position: 'relative',
            padding: isSmallMobile ? '24px 28px' : '32px 44px',
            marginBottom: '0',
            borderRadius: '16px',
            background: isDark 
              ? 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(167,139,250,0.06))'
              : 'linear-gradient(135deg, rgba(96,165,250,0.06), rgba(167,139,250,0.04))',
            border: `1px solid ${isDark ? 'rgba(96,165,250,0.25)' : 'rgba(96,165,250,0.2)'}`,
            boxShadow: isDark 
              ? '0 8px 32px rgba(96,165,250,0.15), inset 0 0 20px rgba(96,165,250,0.05)'
              : '0 8px 32px rgba(96,165,250,0.1), inset 0 0 20px rgba(96,165,250,0.03)',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
              boxShadow: '0 0 15px rgba(96,165,250,0.5)',
            }} />
            <h2
              className="tagline-glow"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: isSmallMobile ? '24px' : '30px',
                fontWeight: 800,
                color: 'var(--accent)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                margin: 0,
                lineHeight: 1.3,
                textShadow: '0 0 20px rgba(96,165,250,0.6)',
              }}
            >
              Break the Status Quo
            </h2>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
              boxShadow: '0 0 15px rgba(96,165,250,0.5)',
            }} />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div style={{
        width: isMobile ? '100%' : '520px',
        backgroundColor: 'var(--bg-card)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: isSmallMobile ? '36px 28px' : '72px 64px',
        borderLeft: isMobile ? 'none' : `1px solid var(--border)`,
        borderTop: isMobile ? `1px solid var(--border)` : 'none',
        boxShadow: isDark ? 'none' : 'var(--shadow-card)',
        minHeight: isMobile ? 'auto' : '100dvh',
        paddingBottom: isSmallMobile ? 'max(70px, env(safe-area-inset-bottom))' : '90px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Form accent background */}
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
          zIndex: 0,
        }} />

        <div style={{ 
          position: 'relative', 
          zIndex: 1, 
          maxWidth: '380px', 
          margin: '0 auto', 
          width: '100%' 
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: isDark 
                ? 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(167,139,250,0.12))'
                : 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(167,139,250,0.09))',
              border: `1px solid ${isDark ? 'rgba(96,165,250,0.3)' : 'rgba(96,165,250,0.25)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isDark 
                ? '0 8px 24px rgba(96,165,250,0.15)'
                : '0 8px 24px rgba(96,165,250,0.1)',
            }}>
              <Sparkles size={18} color="#60A5FA" />
            </div>
            <div>
              <h2 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '30px',
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '0.08em',
                margin: 0,
                textShadow: isDark ? '0 0 15px rgba(96,165,250,0.3)' : 'none',
              }}>
                Welcome Back
              </h2>
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '14px',
                margin: '6px 0 0',
                fontFamily: "'Instrument Sans', sans-serif",
              }}>
                Sign in to continue to your dashboard
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 18px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              marginBottom: '28px',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.1)',
            }}>
              <AlertCircle size={20} color="#EF4444" />
              <p style={{ color: '#EF4444', fontSize: '13px', margin: 0, fontFamily: "'Instrument Sans', sans-serif" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '9px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: '10px',
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  borderRadius: '12px',
                  border: `1px solid var(--border)`,
                  backgroundColor: 'var(--bg-raised)',
                  color: 'var(--text)',
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-card)',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96,165,250,0.15)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}>
                <label style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '9px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}>
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'Instrument Sans', sans-serif",
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateX(2px)';
                    e.currentTarget.style.color = '#93C5FD';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '16px 52px 16px 18px',
                    borderRadius: '12px',
                    border: `1px solid var(--border)`,
                    backgroundColor: 'var(--bg-raised)',
                    color: 'var(--text)',
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-card)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96,165,250,0.15)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '6px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(96,165,250,0.1)';
                    e.currentTarget.style.color = '#60A5FA';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '56px',
                borderRadius: '14px',
                border: 'none',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                letterSpacing: '0.08em',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(96,165,250,0.25), 0 0 0 1px rgba(96,165,250,0.2)',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(96,165,250,0.35), 0 0 0 1px rgba(96,165,250,0.3)';
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(96,165,250,0.25), 0 0 0 1px rgba(96,165,250,0.2)';
                }
              }}
            >
              {/* Animated gradient background */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
                opacity: loading ? 0.6 : 1,
                transition: 'opacity 0.3s ease',
              }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, #93C5FD 0%, #C084FC 100%)',
                opacity: 0,
                transition: 'opacity 0.3s ease',
              }} />
              
              <span style={{
                position: 'relative',
                zIndex: 2,
                color: loading ? '#6B7280' : '#0A0A0B',
                textShadow: loading ? 'none' : '0 0 10px rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                {loading ? (
                  <>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Signing In...
                    </span>
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Sign In
                    </span>
                    <ChevronRight size={16} style={{ transition: 'transform 0.3s ease' }} />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '36px 0',
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
            <span style={{ padding: '0 16px', color: 'var(--text-muted)', fontSize: '12px', fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
          </div>

          {/* Sign Up Link */}
          <div style={{
            textAlign: 'center',
            padding: '20px 16px',
            borderRadius: '14px',
            background: isDark 
              ? 'linear-gradient(135deg, rgba(96,165,250,0.06), rgba(167,139,250,0.04))'
              : 'linear-gradient(135deg, rgba(96,165,250,0.04), rgba(167,139,250,0.03))',
            border: `1px solid ${isDark ? 'rgba(96,165,250,0.2)' : 'rgba(96,165,250,0.15)'}`,
            boxShadow: isDark 
              ? '0 8px 24px rgba(96,165,250,0.1)'
              : '0 8px 24px rgba(96,165,250,0.05)',
          }}>
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '14px',
                margin: '0 0 8px 0',
                fontFamily: "'Instrument Sans', sans-serif",
              }}>
              Don't have an account?
            </p>
            <Link
              href="/register"
              style={{
                color: 'var(--accent)',
                fontWeight: 700,
                textDecoration: 'none',
                fontFamily: "'Syne', sans-serif",
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: '10px 16px',
                borderRadius: '10px',
                border: `1px solid rgba(96,165,250,0.3)`,
                background: isDark ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.06)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(96,165,250,0.25)';
                e.currentTarget.style.background = 'rgba(96,165,250,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = isDark ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.06)';
              }}
            >
              Create one
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Fixed Copyright Footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: '12px 16px',
        backgroundColor: isDark ? 'rgba(10, 10, 11, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderTop: `1px solid var(--border)`,
        zIndex: 50,
      }}>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '12px',
          margin: 0,
          fontFamily: "'Instrument Sans', sans-serif",
        }}>
          © 2026 Potomac Fund Management. All rights reserved.
        </p>
      </div>

      {/* Enhanced CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes devBannerScroll {
          from { background-position: 0 0; }
          to   { background-position: 120px 0; }
        }
        @keyframes devDotBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.7); }
        }
        @keyframes devBadgePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(96,165,250,0); }
          50%       { box-shadow: 0 0 0 4px rgba(96,165,250,0.15); }
        }
        @keyframes taglinePulse {
          0%, 100% {
            text-shadow:
              0 0 10px  var(--accent),
              0 0 20px  var(--accent),
              0 0 40px  rgba(96,165,250,0.85),
              0 0 70px  rgba(96,165,250,0.65),
              0 0 110px rgba(96,165,250,0.45),
              0 0 160px rgba(96,165,250,0.25);
            opacity: 0.95;
          }
          50% {
            text-shadow:
              0 0 15px  var(--accent),
              0 0 30px  var(--accent),
              0 0 60px  rgba(96,165,250,1),
              0 0 100px rgba(96,165,250,0.9),
              0 0 150px rgba(96,165,250,0.7),
              0 0 200px rgba(96,165,250,0.4);
            opacity: 1;
          }
        }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
          100% { transform: translateY(0px) rotate(360deg); }
        }
        .tagline-glow {
          animation: taglinePulse 3.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
