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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
// Import removed - will use direct path

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
      backgroundColor: resolvedTheme === 'dark' ? '#0A0A0B' : '#ffffff',
      display: 'flex',
      fontFamily: "'Quicksand', sans-serif",
      flexDirection: isMobile ? 'column' : 'row',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
    }}>
      {/* Left Side - Branding */}
      <div style={{
        flex: isMobile ? undefined : 1,
        background: isDark 
          ? 'linear-gradient(135deg, #1A1A1D 0%, #0A0A0B 50%, #1A1A1D 100%)'
          : 'linear-gradient(160deg, #fdf8ef 0%, #fefcf7 40%, #f5f0e8 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isSmallMobile ? '48px 24px' : '60px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: isMobile ? 'auto' : '100dvh',
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(254, 192, 15, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(254, 192, 15, 0.05) 0%, transparent 40%)
          `,
          pointerEvents: 'none',
        }} />

        {/* Grid Lines */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(254, 192, 15, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(254, 192, 15, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '500px' }}>
          {/* Logo */}
          <div style={{
            width: isSmallMobile ? '80px' : '100px',
            height: isSmallMobile ? '80px' : '100px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
            overflow: 'hidden',
          }}>
            <img 
              src="/potomac-icon.png" 
              alt="Analyst Logo" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain' 
              }} 
            />
          </div>

          <h1 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: isSmallMobile ? '40px' : '48px',
            fontWeight: 700,
            color: isDark ? '#FFFFFF' : '#1a1a1a',
            letterSpacing: '4px',
            marginBottom: '8px',
          }}>
            ANALYST
          </h1>
          <p style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: isSmallMobile ? '13px' : '16px',
            fontWeight: 500,
            color: '#FEC00F',
            letterSpacing: '8px',
            marginBottom: isSmallMobile ? '32px' : '48px',
          }}>
            BY POTOMAC
          </p>

          {/* Tagline - Sleek & Prominent */}
          <div style={{
            position: 'relative',
            padding: isSmallMobile ? '20px 24px' : '28px 40px',
            marginBottom: '0',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #FEC00F, transparent)',
            }} />
            <h2
              className="tagline-glow"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: isSmallMobile ? '22px' : '28px',
                fontWeight: 700,
                color: '#FEC00F',
                letterSpacing: '6px',
                textTransform: 'uppercase',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Break the Status Quo
            </h2>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #FEC00F, transparent)',
            }} />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div style={{
        width: isMobile ? '100%' : '500px',
        backgroundColor: isDark ? '#121212' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: isSmallMobile ? '32px 24px' : '60px',
        borderLeft: isMobile ? 'none' : `1px solid ${isDark ? '#2A2A2A' : '#e8e0d0'}`,
        borderTop: isMobile ? `1px solid ${isDark ? '#2A2A2A' : '#e8e0d0'}` : 'none',
        boxShadow: isDark ? 'none' : '-8px 0 30px rgba(0,0,0,0.06)',
        minHeight: isMobile ? 'auto' : '100dvh',
        paddingBottom: isSmallMobile ? 'max(60px, env(safe-area-inset-bottom))' : '80px',
      }}>
        <div style={{ maxWidth: '360px', margin: '0 auto', width: '100%' }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '28px',
            fontWeight: 700,
            color: isDark ? '#FFFFFF' : '#1a1a1a',
            letterSpacing: '2px',
            marginBottom: '8px',
          }}>
            WELCOME BACK
          </h2>
          <p style={{
            color: isDark ? '#757575' : '#666666',
            fontSize: '14px',
            marginBottom: '40px',
          }}>
            Sign in to continue to your dashboard
          </p>

          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '10px',
              marginBottom: '24px',
            }}>
              <AlertCircle size={20} color="#DC2626" />
              <p style={{ color: '#DC2626', fontSize: '13px', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '12px',
                fontWeight: 600,
                color: isDark ? '#FFFFFF' : '#1a1a1a',
                letterSpacing: '1px',
                marginBottom: '8px',
              }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  height: '52px',
                  padding: '0 16px',
                  backgroundColor: isDark ? '#1E1E1E' : '#f5f5f5',
                  border: `1px solid ${isDark ? '#2A2A2A' : '#d0d0d0'}`,
                  borderRadius: '10px',
                  color: isDark ? '#FFFFFF' : '#1a1a1a',
                  fontSize: '16px',
                  fontFamily: "'Quicksand', sans-serif",
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#FEC00F';
                  e.target.style.boxShadow = '0 0 0 3px rgba(254, 192, 15, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#2A2A2A';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}>
                <label style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isDark ? '#FFFFFF' : '#1a1a1a',
                  letterSpacing: '1px',
                }}>
                  PASSWORD
                </label>
                <Link
                  href="/forgot-password"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FEC00F',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'Quicksand', sans-serif",
                    textDecoration: 'none',
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
                    height: '52px',
                    padding: '0 48px 0 16px',
                    backgroundColor: isDark ? '#1E1E1E' : '#f5f5f5',
                    border: `1px solid ${isDark ? '#2A2A2A' : '#d0d0d0'}`,
                    borderRadius: '10px',
                    color: isDark ? '#FFFFFF' : '#1a1a1a',
                    fontSize: '16px',
                    fontFamily: "'Quicksand', sans-serif",
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FEC00F';
                    e.target.style.boxShadow = '0 0 0 3px rgba(254, 192, 15, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDark ? '#2A2A2A' : '#d0d0d0';
                    e.target.style.boxShadow = 'none';
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
                    color: '#757575',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                height: '52px',
                backgroundColor: loading ? '#424242' : '#FEC00F',
                border: 'none',
                borderRadius: '10px',
                color: loading ? '#757575' : '#0A0A0B',
                fontSize: '14px',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                letterSpacing: '1px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(254, 192, 15, 0.3)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  SIGNING IN...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  SIGN IN
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '32px 0',
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: isDark ? '#2A2A2A' : '#e0e0e0' }} />
            <span style={{ padding: '0 16px', color: '#757575', fontSize: '12px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: isDark ? '#2A2A2A' : '#e0e0e0' }} />
          </div>

          {/* Sign Up Link */}
          <p style={{
            textAlign: 'center',
            color: '#9E9E9E',
            fontSize: '14px',
            margin: 0,
          }}>
            Don't have an account?{' '}
            <Link
              href="/register"
              style={{
                color: '#FEC00F',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Create one
            </Link>
          </p>
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
        borderTop: `1px solid ${isDark ? 'rgba(42, 42, 42, 0.5)' : 'rgba(0,0,0,0.06)'}`,
        zIndex: 50,
      }}>
        <p style={{
          color: '#757575',
          fontSize: '12px',
          margin: 0,
          fontFamily: "'Quicksand', sans-serif",
        }}>
          {'© 2026 Potomac Fund Management. All rights reserved.'}
        </p>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes taglinePulse {
          0%, 100% {
            text-shadow:
              0 0 10px  #FEC00F,
              0 0 20px  #FEC00F,
              0 0 40px  rgba(254, 192, 15, 0.85),
              0 0 70px  rgba(254, 192, 15, 0.65),
              0 0 110px rgba(254, 192, 15, 0.45),
              0 0 160px rgba(254, 192, 15, 0.25);
            opacity: 0.95;
          }
          50% {
            text-shadow:
              0 0 15px  #FEC00F,
              0 0 30px  #FEC00F,
              0 0 60px  rgba(254, 192, 15, 1),
              0 0 100px rgba(254, 192, 15, 0.9),
              0 0 150px rgba(254, 192, 15, 0.7),
              0 0 200px rgba(254, 192, 15, 0.4);
            opacity: 1;
          }
        }
        .tagline-glow {
          animation: taglinePulse 3.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
