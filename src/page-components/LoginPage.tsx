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
  Mail,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const logoSrc = '/potomac-icon.png';

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Frosted glass styles (matching RegisterPage)
  const glassCard = {
    background: isDark 
      ? 'rgba(255, 255, 255, 0.03)' 
      : 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
    borderRadius: '24px',
    boxShadow: isDark 
      ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)' 
      : '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px 14px 48px',
    fontSize: '15px',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontWeight: 500,
    color: isDark ? '#FAFAFA' : '#0A0A0B',
    background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    marginBottom: '8px',
    fontFamily: "'Inter', system-ui, sans-serif",
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '24px 16px' : '40px',
      background: isDark
        ? 'linear-gradient(135deg, #0A0A0B 0%, #141419 50%, #0A0A0B 100%)'
        : 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 50%, #F8FAFC 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: isDark 
          ? 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float1 8s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: isDark 
          ? 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float2 10s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: isDark 
          ? 'radial-gradient(circle, rgba(254, 192, 15, 0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(254, 192, 15, 0.1) 0%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
      }} />

      {/* Main Card */}
      <div style={{
        ...glassCard,
        width: '100%',
        maxWidth: '440px',
        padding: isMobile ? '32px 24px' : '48px 40px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            background: isDark 
              ? 'linear-gradient(135deg, rgba(254, 192, 15, 0.15) 0%, rgba(254, 192, 15, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(254, 192, 15, 0.2) 0%, rgba(254, 192, 15, 0.08) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: `1px solid ${isDark ? 'rgba(254, 192, 15, 0.2)' : 'rgba(254, 192, 15, 0.3)'}`,
            boxShadow: '0 8px 24px rgba(254, 192, 15, 0.15)',
          }}>
            <img 
              src={logoSrc} 
              alt="Analyst Logo" 
              style={{ width: '44px', height: '44px', objectFit: 'contain' }} 
            />
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '32px',
            fontWeight: 700,
            color: isDark ? '#FAFAFA' : '#0A0A0B',
            letterSpacing: '-0.02em',
            margin: '0 0 6px',
          }}>
            Welcome Back
          </h1>
          <p style={{
            fontSize: '14px',
            color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            margin: 0,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}>
            Sign in to continue to Potomac Analyst
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '10px',
            marginBottom: '20px',
          }}>
            <AlertCircle size={18} color="#EF4444" />
            <p style={{ 
              color: '#EF4444', 
              fontSize: '13px', 
              margin: 0, 
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 500,
            }}>
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email Field */}
            <div>
              <label style={labelStyle}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail 
                  size={18} 
                  style={{ 
                    position: 'absolute', 
                    left: '16px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.35)',
                  }} 
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366F1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6366F1',
                    textDecoration: 'none',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#8B5CF6'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6366F1'}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock 
                  size={18} 
                  style={{ 
                    position: 'absolute', 
                    left: '16px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.35)',
                  }} 
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password"
                  style={{ ...inputStyle, paddingRight: '48px' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366F1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.35)',
                    padding: '4px',
                    display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 24px',
                marginTop: '8px',
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: "'Inter', system-ui, sans-serif",
                color: '#FFFFFF',
                background: loading 
                  ? isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.3)';
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: '28px 0',
        }}>
          <div style={{
            flex: 1,
            height: '1px',
            background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          }} />
          <span style={{
            fontSize: '12px',
            color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}>
            New to Potomac?
          </span>
          <div style={{
            flex: 1,
            height: '1px',
            background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          }} />
        </div>

        {/* Register Link */}
        <Link
          href="/register"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '14px 24px',
            fontSize: '15px',
            fontWeight: 600,
            fontFamily: "'Inter', system-ui, sans-serif",
            color: isDark ? '#FAFAFA' : '#0A0A0B',
            background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
            borderRadius: '12px',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
            e.currentTarget.style.borderColor = '#6366F1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)';
            e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
          }}
        >
          <Sparkles size={18} />
          Create an account
        </Link>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)',
          marginTop: '28px',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          2026 Potomac Fund Management. All rights reserved.
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 20px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
