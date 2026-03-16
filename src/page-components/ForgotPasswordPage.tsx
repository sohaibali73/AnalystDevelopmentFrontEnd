'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Mail, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Key
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

// Use logo from public directory (Next.js serves from /public)
const logo = '/potomac-icon.png';

export function ForgotPasswordPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // FIXED: SSR-safe - don't access window in useState initializer
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsSmallMobile(window.innerWidth < 768);
    };

    handleResize(); // Call immediately to set initial values
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Implement actual password reset API call
      // const response = await apiClient.requestPasswordReset(email);
      
      // Simulate API call
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
        padding: isSmallMobile ? '40px 24px' : '60px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: isMobile ? 'auto' : '100dvh',
        paddingTop: isMobile ? '20px' : '60px',
        paddingBottom: isMobile ? '30px' : '0',
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
            width: '100px',
            height: '100px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
            overflow: 'hidden',
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

          <h1 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '48px',
            fontWeight: 700,
            color: isDark ? '#FFFFFF' : '#1a1a1a',
            letterSpacing: '4px',
            marginBottom: '8px',
          }}>
            ANALYST
          </h1>
          <p style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '16px',
            fontWeight: 500,
            color: '#FEC00F',
            letterSpacing: '8px',
            marginBottom: '24px',
          }}>
            BY POTOMAC
          </p>
          <p style={{
            color: isDark ? '#9E9E9E' : '#666666',
            fontSize: '16px',
            lineHeight: 1.7,
            marginBottom: '48px',
          }}>
            Secure password recovery<br />
            Get back to analyzing and optimizing your strategies.
          </p>

          {/* Security Feature */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '20px 24px',
            backgroundColor: 'rgba(254, 192, 15, 0.05)',
            border: '1px solid rgba(254, 192, 15, 0.1)',
            borderRadius: '12px',
          }}>
            <Key size={28} color="#FEC00F" />
            <div style={{ textAlign: 'left' }}>
              <p style={{ color: isDark ? '#E0E0E0' : '#333333', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                Secure Password Reset
              </p>
              <p style={{ color: isDark ? '#9E9E9E' : '#666666', fontSize: '12px', margin: '4px 0 0 0' }}>
                We'll send you a secure link to reset your password
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <p style={{
          position: 'absolute',
          bottom: '32px',
          color: '#757575',
          fontSize: '12px',
        }}>
          © 2026 Potomac Fund Management. All rights reserved.
        </p>
      </div>

      {/* Right Side - Reset Form */}
      <div style={{
        width: isMobile ? '100%' : '500px',
        backgroundColor: isDark ? '#121212' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: isSmallMobile ? '32px 24px' : '60px',
        borderLeft: isMobile ? 'none' : `1px solid ${isDark ? '#2A2A2A' : '#e0e0e0'}`,
        borderTop: isMobile ? `1px solid ${isDark ? '#2A2A2A' : '#e0e0e0'}` : 'none',
        minHeight: isMobile ? 'auto' : '100dvh',
        paddingBottom: isSmallMobile ? 'max(32px, env(safe-area-inset-bottom))' : '60px',
      }}>
        <div style={{ maxWidth: '360px', margin: '0 auto', width: '100%' }}>
          {/* Back Button */}
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#FEC00F',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              marginBottom: '32px',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <ArrowLeft size={18} />
            Back to Login
          </Link>

          {!success ? (
            <>
              <h2 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '28px',
                fontWeight: 700,
                color: isDark ? '#FFFFFF' : '#1a1a1a',
                letterSpacing: '2px',
                marginBottom: '8px',
              }}>
                FORGOT PASSWORD?
              </h2>
              <p style={{
                color: isDark ? '#757575' : '#666666',
                fontSize: '14px',
                marginBottom: '40px',
                lineHeight: 1.6,
              }}>
                No worries! Enter your email address and we'll send you a link to reset your password.
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
                <div style={{ marginBottom: '24px' }}>
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
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{
                        width: '100%',
                        height: '52px',
                        padding: '0 16px 0 48px',
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
                    <Mail
                      size={20}
                      color="#757575"
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
                      SENDING...
                    </>
                  ) : (
                    <>
                      <Mail size={20} />
                      SEND RESET LINK
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
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
                }}>
                  <CheckCircle size={40} color="#22C55E" />
                </div>

                <h2 style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '28px',
                  fontWeight: 700,
                  color: isDark ? '#FFFFFF' : '#1a1a1a',
                  letterSpacing: '2px',
                  marginBottom: '12px',
                }}>
                  CHECK YOUR EMAIL
                </h2>

                <p style={{
                  color: isDark ? '#9E9E9E' : '#666666',
                  fontSize: '14px',
                  lineHeight: 1.7,
                  marginBottom: '32px',
                }}>
                  We've sent a password reset link to<br />
                  <span style={{ color: '#FEC00F', fontWeight: 600 }}>{email}</span>
                </p>

                <div style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: 'rgba(254, 192, 15, 0.05)',
                  border: '1px solid rgba(254, 192, 15, 0.1)',
                  borderRadius: '10px',
                  marginBottom: '32px',
                }}>
                  <p style={{
                    color: '#E0E0E0',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    margin: 0,
                  }}>
                    <strong>Didn't receive the email?</strong><br />
                    Check your spam folder or{' '}
                    <button
                      onClick={() => setSuccess(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FEC00F',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                        fontFamily: "'Quicksand', sans-serif",
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
                    padding: '12px 24px',
                    backgroundColor: 'transparent',
                    border: '1px solid #2A2A2A',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    letterSpacing: '1px',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#FEC00F';
                    e.currentTarget.style.backgroundColor = 'rgba(254, 192, 15, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#2A2A2A';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ArrowLeft size={18} />
                  BACK TO LOGIN
                </Link>
              </div>
            </>
          )}

          {/* Additional Help */}
          {!success && (
            <div style={{
              marginTop: '32px',
              padding: '16px',
              backgroundColor: 'rgba(254, 192, 15, 0.05)',
              border: '1px solid rgba(254, 192, 15, 0.1)',
              borderRadius: '10px',
            }}>
              <p style={{
                color: '#9E9E9E',
                fontSize: '12px',
                lineHeight: 1.6,
                margin: 0,
              }}>
                <strong style={{ color: '#E0E0E0' }}>Need help?</strong><br />
                Contact our support team at{' '}
                <a
                  href="mailto:support@potomac.com"
                  style={{
                    color: '#FEC00F',
                    textDecoration: 'none',
                  }}
                >
                  support@potomac.com
                </a>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}


export default ForgotPasswordPage;
