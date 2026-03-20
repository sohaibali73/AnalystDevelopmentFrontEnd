'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Mail, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Key,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ForgotPasswordPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsSmallMobile(window.innerWidth < 768);
    };

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
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email. Please try again.');
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
    }}>
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

        {/* Floating particles */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          {mounted && [
            { size: 4, opacity: 0.35, left: 15, top: 20, duration: 8 },
            { size: 3, opacity: 0.4, left: 85, top: 15, duration: 6 },
            { size: 5, opacity: 0.3, left: 45, top: 80, duration: 9 },
            { size: 3.5, opacity: 0.45, left: 70, top: 55, duration: 7 },
            { size: 4.5, opacity: 0.35, left: 25, top: 65, duration: 10 },
            { size: 3, opacity: 0.5, left: 90, top: 40, duration: 6.5 },
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
            color: 'var(--text)',
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
            color: '#60A5FA',
            letterSpacing: '0.14em',
            marginBottom: isSmallMobile ? '36px' : '52px',
            textTransform: 'uppercase',
            textShadow: '0 0 15px rgba(96,165,250,0.4)',
          }}>
            BY POTOMAC
          </p>

          {/* Security Feature Card */}
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
              background: 'linear-gradient(90deg, transparent, #60A5FA, transparent)',
              boxShadow: '0 0 15px rgba(96,165,250,0.5)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
              <Shield size={28} color="#60A5FA" style={{ filter: 'drop-shadow(0 0 8px rgba(96,165,250,0.5))' }} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ 
                  color: 'var(--text)', 
                  fontSize: '15px', 
                  fontWeight: 600, 
                  margin: 0,
                  fontFamily: "'Syne', sans-serif",
                  letterSpacing: '0.05em',
                }}>
                  Secure Password Reset
                </p>
                <p style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: '13px', 
                  margin: '4px 0 0 0',
                  fontFamily: "'Instrument Sans', sans-serif",
                }}>
                  We'll send you a secure link to reset your password
                </p>
              </div>
            </div>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #60A5FA, transparent)',
              boxShadow: '0 0 15px rgba(96,165,250,0.5)',
            }} />
          </div>
        </div>
      </div>

      {/* Right Side - Reset Form */}
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
          {/* Back Button */}
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#60A5FA',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              marginBottom: '32px',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(96,165,250,0.2)',
              background: isDark ? 'rgba(96,165,250,0.06)' : 'rgba(96,165,250,0.04)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              fontFamily: "'Instrument Sans', sans-serif",
            }}
          >
            <ArrowLeft size={18} />
            Back to Login
          </Link>

          {!success ? (
            <>
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
                  <Key size={18} color="#60A5FA" />
                </div>
                <div>
                  <h2 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: '28px',
                    fontWeight: 800,
                    color: 'var(--text)',
                    letterSpacing: '0.08em',
                    margin: 0,
                    textShadow: isDark ? '0 0 15px rgba(96,165,250,0.3)' : 'none',
                    textTransform: 'uppercase',
                  }}>
                    Reset Password
                  </h2>
                  <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    margin: '6px 0 0',
                    fontFamily: "'Instrument Sans', sans-serif",
                  }}>
                    Enter your email to receive a reset link
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
                  animation: 'fadeInUp 0.3s ease-out',
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
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{
                        width: '100%',
                        padding: '16px 18px 16px 48px',
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
                    <Mail
                      size={20}
                      color="var(--text-muted)"
                      style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                      }}
                    />
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
                          Sending...
                        </span>
                      </>
                    ) : (
                      <>
                        <Mail size={20} />
                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Send Reset Link
                        </span>
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* Additional Help */}
              <div style={{
                marginTop: '32px',
                padding: '20px',
                backgroundColor: isDark ? 'rgba(96, 165, 250, 0.06)' : 'rgba(96, 165, 250, 0.04)',
                border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(96, 165, 250, 0.1)'}`,
                borderRadius: '12px',
              }}>
                <p style={{
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  margin: 0,
                  fontFamily: "'Instrument Sans', sans-serif",
                }}>
                  <strong style={{ color: 'var(--text)' }}>Need help?</strong><br />
                  Contact our support team at{' '}
                  <a
                    href="mailto:support@potomac.com"
                    style={{
                      color: '#60A5FA',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    support@potomac.com
                  </a>
                </p>
              </div>
            </>
          ) : (
            /* Success State */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              animation: 'fadeInUp 0.5s ease-out',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '2px solid rgba(34, 197, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                boxShadow: '0 8px 24px rgba(34, 197, 94, 0.15)',
                animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>
                <CheckCircle size={40} color="#22C55E" />
              </div>

              <h2 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '28px',
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '0.08em',
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}>
                Check Your Email
              </h2>

              <p style={{
                color: 'var(--text-muted)',
                fontSize: '14px',
                lineHeight: 1.7,
                marginBottom: '32px',
                fontFamily: "'Instrument Sans', sans-serif",
              }}>
                We've sent a password reset link to<br />
                <span style={{ color: '#60A5FA', fontWeight: 600 }}>{email}</span>
              </p>

              <div style={{
                width: '100%',
                padding: '16px 20px',
                backgroundColor: isDark ? 'rgba(96, 165, 250, 0.06)' : 'rgba(96, 165, 250, 0.04)',
                border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(96, 165, 250, 0.1)'}`,
                borderRadius: '12px',
                marginBottom: '32px',
              }}>
                <p style={{
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  margin: 0,
                  fontFamily: "'Instrument Sans', sans-serif",
                }}>
                  <strong style={{ color: 'var(--text)' }}>Didn't receive the email?</strong><br />
                  Check your spam folder or{' '}
                  <button
                    onClick={() => setSuccess(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60A5FA',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                      fontFamily: "'Instrument Sans', sans-serif",
                      fontSize: '13px',
                    }}
                  >
                    try again
                  </button>
                </p>
              </div>

              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${isDark ? 'rgba(96,165,250,0.3)' : 'rgba(96,165,250,0.25)'}`,
                  borderRadius: '12px',
                  color: 'var(--text)',
                  fontSize: '14px',
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#60A5FA';
                  e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDark ? 'rgba(96,165,250,0.3)' : 'rgba(96,165,250,0.25)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <ArrowLeft size={18} />
                Back to Login
              </Link>
            </div>
          )}
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

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
          100% { transform: translateY(0px) rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(16px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        @keyframes scaleIn {
          from { 
            transform: scale(0.8); 
            opacity: 0; 
          }
          to { 
            transform: scale(1); 
            opacity: 1; 
          }
        }
      `}</style>
    </div>
  );
}

export default ForgotPasswordPage;
