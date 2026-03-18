'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  AlertCircle,
  Check,
  Info,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

// Use logo from public directory (not src/assets which doesn't work in Next.js)
const logoSrc = '/potomac-icon.png';

export function RegisterPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    claudeApiKey: '',
    tavilyApiKey: '',
    agreeToTerms: false,
  });

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

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.claudeApiKey.trim()) {
      setError('Claude API key is required');
      return false;
    }
    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);
    setError('');

    try {
      // Use apiClient via AuthContext instead of direct fetch
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.claudeApiKey,
        formData.tavilyApiKey || ''
      );
      // AuthContext.register() handles token storage and navigation to /dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const pwd = formData.password;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strengthColor = () => {
    const s = passwordStrength();
    if (s <= 1) return '#DC2626';
    if (s <= 2) return '#F97316';
    if (s <= 3) return '#FEC00F';
    return '#2D7F3E';
  };

  const strengthText = () => {
    const s = passwordStrength();
    if (s <= 1) return 'Weak';
    if (s <= 2) return 'Fair';
    if (s <= 3) return 'Good';
    return 'Strong';
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
      {/* Left Side - Form */}
      <div style={{
        flex: isMobile ? undefined : 1,
        width: isMobile ? '100%' : undefined,
        backgroundColor: 'var(--bg-card)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isSmallMobile ? '32px 24px' : '60px',
        borderRight: isMobile ? 'none' : `1px solid var(--border)`,
        overflowY: 'auto',
        minHeight: isMobile ? 'auto' : '100dvh',
        paddingBottom: isSmallMobile ? 'max(60px, env(safe-area-inset-bottom))' : '60px',
      }}>
        <div style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <img 
                src={logoSrc} 
                alt="Analyst Logo" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain' 
                }} 
              />
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
                margin: 0,
                textTransform: 'uppercase',
              }}>
                Analyst
              </h1>
              <p style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '10px',
                color: 'var(--accent)',
                letterSpacing: '0.12em',
                margin: 0,
                textTransform: 'uppercase',
              }}>
                by potomac
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}>
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: step >= s ? 'var(--accent)' : 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s',
                }}>
                  {step > s ? (
                    <Check size={18} color="#0A0A0B" />
                  ) : (
                    <span style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: '14px',
                      fontWeight: 700,
                      color: step >= s ? '#0A0A0B' : 'var(--text-muted)',
                    }}>
                      {s}
                    </span>
                  )}
                </div>
                {s < 3 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: step > s ? 'var(--accent)' : 'var(--border)',
                    margin: '0 8px',
                    transition: 'all 0.3s',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Title */}
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '0.08em',
            marginBottom: '8px',
            textTransform: 'uppercase',
          }}>
            {step === 1 && 'Create Account'}
            {step === 2 && 'Set Password'}
            {step === 3 && 'API Configuration'}
          </h2>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '14px',
            marginBottom: '32px',
            fontFamily: "'Instrument Sans', sans-serif",
          }}>
            {step === 1 && 'Enter your personal information'}
            {step === 2 && 'Create a secure password'}
            {step === 3 && 'Configure your AI services'}
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
              <p style={{ color: '#DC2626', fontSize: '13px', margin: 0, fontFamily: "'Instrument Sans', sans-serif" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label className="label-dashboard">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="John Doe"
                    className="input-dashboard"
                    style={{
                      fontFamily: "'Instrument Sans', sans-serif",
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label className="label-dashboard">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="you@example.com"
                    className="input-dashboard"
                    style={{
                      fontFamily: "'Instrument Sans', sans-serif",
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-dashboard"
                  style={{
                    width: '100%',
                    height: '52px',
                    backgroundColor: 'var(--accent)',
                    color: '#0A0A0B',
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Continue
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label className="label-dashboard">
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      placeholder="Min. 8 characters"
                      className="input-dashboard"
                      style={{ 
                        paddingRight: '48px',
                        fontFamily: "'Instrument Sans', sans-serif",
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
                        padding: 0,
                      }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {formData.password && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: '4px',
                              borderRadius: '2px',
                              backgroundColor: i <= passwordStrength() ? strengthColor() : 'var(--border)',
                              transition: 'all 0.2s',
                            }}
                          />
                        ))}
                      </div>
                      <p style={{ color: strengthColor(), fontSize: '12px', margin: 0, fontFamily: "'Instrument Sans', sans-serif" }}>
                        Password strength: {strengthText()}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label className="label-dashboard">
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                      placeholder="Confirm your password"
                      className="input-dashboard"
                      style={{ 
                        paddingRight: '48px',
                        fontFamily: "'Instrument Sans', sans-serif",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: 0,
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p style={{ color: '#2D7F3E', fontSize: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Instrument Sans', sans-serif" }}>
                      <Check size={14} /> Passwords match
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={handleBack} className="btn-secondary" style={{
                    height: '52px',
                    padding: '0 24px',
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    <ChevronLeft size={20} />
                    Back
                  </button>
                  <button type="button" onClick={handleNext} className="btn-dashboard" style={{
                    flex: 1,
                    height: '52px',
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    Continue
                    <ChevronRight size={20} />
                  </button>
                </div>
              </>
            )}

            {/* Step 3: API Keys */}
            {step === 3 && (
              <>
                {/* Info Box */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: 'rgba(254, 192, 15, 0.1)',
                  border: '1px solid rgba(254, 192, 15, 0.2)',
                  borderRadius: '10px',
                  marginBottom: '24px',
                }}>
                  <Info size={20} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5, margin: 0, fontFamily: "'Instrument Sans', sans-serif" }}>
                    Your API keys are encrypted and stored securely. They're only used to make AI requests on your behalf.
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ ...{ display: 'flex', alignItems: 'center', gap: '8px' }, ...{ fontFamily: "'DM Mono', monospace", fontSize: '9px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '8px' } }}>
                    Claude API Key
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: '#2D7F3E',
                      borderRadius: '4px',
                      fontSize: '9px',
                      color: '#FFFFFF',
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase' as const,
                    }}>
                      Required
                    </span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showClaudeKey ? 'text' : 'password'}
                      value={formData.claudeApiKey}
                      onChange={(e) => updateFormData('claudeApiKey', e.target.value)}
                      placeholder="sk-ant-..."
                      className="input-dashboard"
                      style={{ 
                        paddingRight: '48px',
                        fontFamily: "'Instrument Sans', sans-serif",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowClaudeKey(!showClaudeKey)}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: 0,
                      }}
                    >
                      {showClaudeKey ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px', fontFamily: "'Instrument Sans', sans-serif" }}>
                    Get your key from{' '}
                    <a
                      href="https://console.anthropic.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      console.anthropic.com <ExternalLink size={12} />
                    </a>
                  </p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ ...{ display: 'flex', alignItems: 'center', gap: '8px' }, ...{ fontFamily: "'DM Mono', monospace", fontSize: '9px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '8px' } }}>
                    Tavily API Key
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: 'var(--border)',
                      borderRadius: '4px',
                      fontSize: '9px',
                      color: 'var(--text-muted)',
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase' as const,
                    }}>
                      Optional
                    </span>
                  </label>
                  <input
                    type="password"
                    value={formData.tavilyApiKey}
                    onChange={(e) => updateFormData('tavilyApiKey', e.target.value)}
                    placeholder="tvly-..."
                    className="input-dashboard"
                    style={{
                      fontFamily: "'Instrument Sans', sans-serif",
                    }}
                  />
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px', fontFamily: "'Instrument Sans', sans-serif" }}>
                    Used for web search features
                  </p>
                </div>

                {/* Terms Checkbox */}
                <div
                  onClick={() => updateFormData('agreeToTerms', !formData.agreeToTerms)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    cursor: 'pointer',
                    marginBottom: '24px',
                  }}
                >
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      border: `2px solid ${formData.agreeToTerms ? 'var(--accent)' : 'var(--border)'}`, 
                      backgroundColor: formData.agreeToTerms ? 'var(--accent)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                      marginTop: '2px',
                    }}
                  >
                    {formData.agreeToTerms && <Check size={14} color="#0A0A0B" />}
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5, fontFamily: "'Instrument Sans', sans-serif" }}>
                    I agree to the{' '}
                    <span style={{ color: 'var(--accent)' }}>Terms of Service</span>
                    {' '}and{' '}
                    <span style={{ color: 'var(--accent)' }}>Privacy Policy</span>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={handleBack} className="btn-secondary" style={{
                    height: '52px',
                    padding: '0 24px',
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    <ChevronLeft size={20} />
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="btn-dashboard" style={{
                    flex: 1,
                    height: '52px',
                    backgroundColor: loading ? '#424242' : 'var(--accent)',
                    color: loading ? '#757575' : '#0A0A0B',
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    {loading ? (
                      <>
                        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus size={20} />
                        Create Account
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Sign In Link */}
          <p style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '14px',
            marginTop: '32px',
            fontFamily: "'Instrument Sans', sans-serif",
          }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', fontFamily: "'Instrument Sans', sans-serif" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div style={{
        flex: isMobile ? undefined : 1,
        background: isDark
          ? 'linear-gradient(135deg, #1A1A1D 0%, #0A0A0B 50%, #1A1A1D 100%)'
          : 'linear-gradient(160deg, #fdf8ef 0%, #fefcf7 40%, #f5f0e8 100%)',
        display: isMobile ? 'none' : 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100dvh',
      }}>
        {/* Background Effects */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 80% 50%, rgba(254, 192, 15, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(254, 192, 15, 0.05) 0%, transparent 40%)
          `,
          pointerEvents: 'none',
        }} />

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
              src={logoSrc} 
              alt="Analyst Logo" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain' 
              }} 
            />
          </div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '48px',
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '-0.03em',
            marginBottom: '8px',
          }}>
            ANALYST
          </h1>
          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--accent)',
            letterSpacing: '0.12em',
            marginBottom: '40px',
            textTransform: 'uppercase',
          }}>
            by potomac
          </p>

          {/* Tagline */}
          <div style={{
            position: 'relative',
            padding: '28px 40px',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            }} />
            <h2
              className="tagline-glow"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--accent)',
                letterSpacing: '0.12em',
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
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            }} />
          </div>
        </div>

        <p style={{
          position: 'absolute',
          bottom: '32px',
          color: 'var(--text-muted)',
          fontSize: '12px',
          fontFamily: "'Instrument Sans', sans-serif",
        }}>
          © 2026 Potomac Fund Management. All rights reserved.
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
              0 0 10px  var(--accent),
              0 0 20px  var(--accent),
              0 0 40px  rgba(254, 192, 15, 0.85),
              0 0 70px  rgba(254, 192, 15, 0.65),
              0 0 110px rgba(254, 192, 15, 0.45),
              0 0 160px rgba(254, 192, 15, 0.25);
            opacity: 0.95;
          }
          50% {
            text-shadow:
              0 0 15px  var(--accent),
              0 0 30px  var(--accent),
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


export default RegisterPage;
