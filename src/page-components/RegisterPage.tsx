'use client'

import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export function RegisterPage() {
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
  const [mounted, setMounted] = useState(false);

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
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.claudeApiKey,
        formData.tavilyApiKey || ''
      );
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
    if (s <= 1) return '#EF4444';
    if (s <= 2) return '#F97316';
    if (s <= 3) return '#FBBF24';
    return '#22C55E';
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
        padding: isSmallMobile ? '36px 28px' : '72px 64px',
        borderRight: isMobile ? 'none' : `1px solid var(--border)`,
        overflowY: 'auto',
        minHeight: isMobile ? 'auto' : '100dvh',
        paddingBottom: isSmallMobile ? 'max(70px, env(safe-area-inset-bottom))' : '90px',
        position: 'relative',
      }}>
        {/* Form accent background */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle at 30% 70%, rgba(96,165,250,0.08), transparent 50%)`,
          opacity: 0,
          transition: 'opacity 0.5s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <div style={{ 
          maxWidth: '440px', 
          margin: '0 auto', 
          width: '100%',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Logo Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              background: isDark 
                ? 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(167,139,250,0.08))'
                : 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(167,139,250,0.06))',
              border: `1px solid ${isDark ? 'rgba(96,165,250,0.2)' : 'rgba(96,165,250,0.15)'}`,
              boxShadow: isDark 
                ? '0 8px 24px rgba(96,165,250,0.12)'
                : '0 8px 24px rgba(96,165,250,0.08)',
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
            <div>
              <h1 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '22px',
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
                fontSize: '11px',
                color: '#60A5FA',
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
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: step >= s 
                    ? 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)'
                    : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  border: step >= s 
                    ? 'none' 
                    : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: step >= s 
                    ? '0 4px 16px rgba(96,165,250,0.3)'
                    : 'none',
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
                    background: step > s 
                      ? 'linear-gradient(90deg, #60A5FA, #A78BFA)'
                      : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    margin: '0 8px',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Title */}
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
              {step === 1 && <Sparkles size={18} color="#60A5FA" />}
              {step === 2 && <Shield size={18} color="#60A5FA" />}
              {step === 3 && <Zap size={18} color="#60A5FA" />}
            </div>
            <div>
              <h2 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '28px',
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '0.08em',
                margin: 0,
                textTransform: 'uppercase',
                textShadow: isDark ? '0 0 15px rgba(96,165,250,0.3)' : 'none',
              }}>
                {step === 1 && 'Create Account'}
                {step === 2 && 'Set Password'}
                {step === 3 && 'API Configuration'}
              </h2>
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '14px',
                margin: '6px 0 0',
                fontFamily: "'Instrument Sans', sans-serif",
              }}>
                {step === 1 && 'Enter your personal information'}
                {step === 2 && 'Create a secure password'}
                {step === 3 && 'Configure your AI services'}
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
              marginBottom: '24px',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.1)',
              animation: 'fadeInUp 0.3s ease-out',
            }}>
              <AlertCircle size={20} color="#EF4444" />
              <p style={{ color: '#EF4444', fontSize: '13px', margin: 0, fontFamily: "'Instrument Sans', sans-serif" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '9px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: '10px',
                  }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="John Doe"
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

                <div style={{ marginBottom: '28px' }}>
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
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
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

                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    width: '100%',
                    height: '56px',
                    borderRadius: '14px',
                    border: 'none',
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(96,165,250,0.25), 0 0 0 1px rgba(96,165,250,0.2)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(96,165,250,0.35), 0 0 0 1px rgba(96,165,250,0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(96,165,250,0.25), 0 0 0 1px rgba(96,165,250,0.2)';
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
                  }} />
                  <span style={{
                    position: 'relative',
                    zIndex: 2,
                    color: '#0A0A0B',
                    textShadow: '0 0 10px rgba(255,255,255,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textTransform: 'uppercase',
                  }}>
                    Continue
                    <ChevronRight size={20} />
                  </span>
                </button>
              </div>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '9px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: '10px',
                  }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      placeholder="Min. 8 characters"
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
                              transition: 'all 0.3s ease',
                            }}
                          />
                        ))}
                      </div>
                      <p style={{ 
                        color: strengthColor(), 
                        fontSize: '12px', 
                        margin: 0, 
                        fontFamily: "'Instrument Sans', sans-serif",
                        fontWeight: 600,
                      }}>
                        Password strength: {strengthText()}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <label style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '9px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: '10px',
                  }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                      placeholder="Confirm your password"
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
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p style={{ 
                      color: '#22C55E', 
                      fontSize: '12px', 
                      marginTop: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      fontFamily: "'Instrument Sans', sans-serif",
                      fontWeight: 600,
                    }}>
                      <Check size={14} /> Passwords match
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={handleBack} 
                    style={{
                      height: '56px',
                      padding: '0 24px',
                      borderRadius: '14px',
                      border: `1px solid ${isDark ? 'rgba(96,165,250,0.3)' : 'rgba(96,165,250,0.25)'}`,
                      backgroundColor: 'transparent',
                      color: 'var(--text)',
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#60A5FA';
                      e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.08)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(96,165,250,0.3)' : 'rgba(96,165,250,0.25)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <ChevronLeft size={20} />
                    Back
                  </button>
                  <button 
                    type="button" 
                    onClick={handleNext} 
                    style={{
                      flex: 1,
                      height: '56px',
                      borderRadius: '14px',
                      border: 'none',
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(96,165,250,0.25), 0 0 0 1px rgba(96,165,250,0.2)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(96,165,250,0.35), 0 0 0 1px rgba(96,165,250,0.3)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(96,165,250,0.25), 0 0 0 1px rgba(96,165,250,0.2)';
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
                    }} />
                    <span style={{
                      position: 'relative',
                      zIndex: 2,
                      color: '#0A0A0B',
                      textShadow: '0 0 10px rgba(255,255,255,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      textTransform: 'uppercase',
                    }}>
                      Continue
                      <ChevronRight size={20} />
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: API Keys */}
            {step === 3 && (
              <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
                {/* Info Box */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px 18px',
                  backgroundColor: isDark ? 'rgba(96, 165, 250, 0.06)' : 'rgba(96, 165, 250, 0.04)',
                  border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(96, 165, 250, 0.1)'}`,
                  borderRadius: '12px',
                  marginBottom: '24px',
                }}>
                  <Info size={20} color="#60A5FA" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '13px', 
                    lineHeight: 1.6, 
                    margin: 0, 
                    fontFamily: "'Instrument Sans', sans-serif" 
                  }}>
                    Your API keys are encrypted and stored securely. They're only used to make AI requests on your behalf.
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '9px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '10px',
                  }}>
                    Claude API Key
                    <span style={{
                      padding: '3px 8px',
                      background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                      borderRadius: '4px',
                      fontSize: '9px',
                      color: '#FFFFFF',
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
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
                      {showClaudeKey ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '12px', 
                    marginTop: '8px', 
                    fontFamily: "'Instrument Sans', sans-serif" 
                  }}>
                    Get your key from{' '}
                    <a
                      href="https://console.anthropic.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#60A5FA', 
                        textDecoration: 'none', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        fontWeight: 600,
                      }}
                    >
                      console.anthropic.com <ExternalLink size={12} />
                    </a>
                  </p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '9px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '10px',
                  }}>
                    Tavily API Key
                    <span style={{
                      padding: '3px 8px',
                      backgroundColor: 'var(--border)',
                      borderRadius: '4px',
                      fontSize: '9px',
                      color: 'var(--text-muted)',
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                    }}>
                      Optional
                    </span>
                  </label>
                  <input
                    type="password"
                    value={formData.tavilyApiKey}
                    onChange={(e) => updateFormData('tavilyApiKey', e.target.value)}
                    placeholder="tvly-..."
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
                  <p style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '12px', 
                    marginTop: '8px', 
                    fontFamily: "'Instrument Sans', sans-serif" 
                  }}>
                    Used for web search features
                  </p>
                </div>

                {/* Terms Checkbox */}
                <div
                  onClick={() => updateFormData('agreeToTerms', !formData.agreeToTerms)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    cursor: 'pointer',
                    marginBottom: '28px',
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: formData.agreeToTerms 
                      ? isDark ? 'rgba(96, 165, 250, 0.06)' : 'rgba(96, 165, 250, 0.04)'
                      : 'transparent',
                    border: `1px solid ${formData.agreeToTerms ? 'rgba(96,165,250,0.3)' : 'var(--border)'}`,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '8px',
                      border: formData.agreeToTerms ? 'none' : `2px solid var(--border)`,
                      background: formData.agreeToTerms 
                        ? 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)' 
                        : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: formData.agreeToTerms ? '0 4px 12px rgba(96,165,250,0.3)' : 'none',
                    }}
                  >
                    {formData.agreeToTerms && <Check size={14} color="#0A0A0B" />}
                  </div>
                  <span style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '13px', 
                    lineHeight: 1.6, 
                    fontFamily: "'Instrument Sans', sans-serif" 
                  }}>
                    I agree to the{' '}
                    <span style={{ color: '#60A5FA', fontWeight: 600 }}>Terms of Service</span>
                    {' '}and{' '}
                    <span style={{ color: '#60A5FA', fontWeight: 600 }}>Privacy Policy</span>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={handleBack} 
                    style={{
                      height: '56px',
                      padding: '0 24px',
                      borderRadius: '14px',
                      border: `1px solid ${isDark ? 'rgba(96,165,250,0.3)' : 'rgba(96,165,250,0.25)'}`,
                      backgroundColor: 'transparent',
                      color: 'var(--text)',
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#60A5FA';
                      e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.08)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(96,165,250,0.3)' : 'rgba(96,165,250,0.25)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <ChevronLeft size={20} />
                    Back
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    style={{
                      flex: 1,
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
                    </span>
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Sign In Link */}
          <div style={{
            textAlign: 'center',
            marginTop: '36px',
            padding: '20px 16px',
            borderRadius: '14px',
            background: isDark 
              ? 'linear-gradient(135deg, rgba(96,165,250,0.06), rgba(167,139,250,0.04))'
              : 'linear-gradient(135deg, rgba(96,165,250,0.04), rgba(167,139,250,0.03))',
            border: `1px solid ${isDark ? 'rgba(96,165,250,0.2)' : 'rgba(96,165,250,0.15)'}`,
          }}>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '14px',
              margin: '0 0 8px 0',
              fontFamily: "'Instrument Sans', sans-serif",
            }}>
              Already have an account?
            </p>
            <Link
              href="/login"
              style={{
                color: '#60A5FA',
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
              Sign in
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Branding (Hidden on mobile) */}
      <div style={{
        flex: isMobile ? undefined : 1,
        background: isDark
          ? 'linear-gradient(135deg, #0A0A0B 0%, #0D1117 50%, #0A0A0B 100%)'
          : 'linear-gradient(160deg, #f8fbff 0%, #f0f7ff 40%, #e8f2ff 100%)',
        display: isMobile ? 'none' : 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100dvh',
      }}>
        {/* Enhanced Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 80% 50%, rgba(96,165,250,0.12) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(96,165,250,0.08) 0%, transparent 40%),
            radial-gradient(circle at 40% 20%, rgba(167,139,250,0.06) 0%, transparent 50%)
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
            { size: 4, opacity: 0.35, left: 85, top: 20, duration: 8 },
            { size: 3, opacity: 0.4, left: 15, top: 15, duration: 6 },
            { size: 5, opacity: 0.3, left: 55, top: 80, duration: 9 },
            { size: 3.5, opacity: 0.45, left: 30, top: 55, duration: 7 },
            { size: 4.5, opacity: 0.35, left: 75, top: 65, duration: 10 },
            { size: 3, opacity: 0.5, left: 10, top: 40, duration: 6.5 },
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
          <div style={{
            width: '110px',
            height: '110px',
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
            fontSize: '52px',
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
            fontSize: '17px',
            fontWeight: 600,
            color: '#60A5FA',
            letterSpacing: '0.14em',
            marginBottom: '52px',
            textTransform: 'uppercase',
            textShadow: '0 0 15px rgba(96,165,250,0.4)',
          }}>
            BY POTOMAC
          </p>

          {/* Tagline */}
          <div style={{
            position: 'relative',
            padding: '32px 44px',
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
            <h2
              className="tagline-glow"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '30px',
                fontWeight: 800,
                color: '#60A5FA',
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
              background: 'linear-gradient(90deg, transparent, #60A5FA, transparent)',
              boxShadow: '0 0 15px rgba(96,165,250,0.5)',
            }} />
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
        @keyframes taglinePulse {
          0%, 100% {
            text-shadow:
              0 0 10px  #60A5FA,
              0 0 20px  #60A5FA,
              0 0 40px  rgba(96,165,250,0.85),
              0 0 70px  rgba(96,165,250,0.65),
              0 0 110px rgba(96,165,250,0.45),
              0 0 160px rgba(96,165,250,0.25);
            opacity: 0.95;
          }
          50% {
            text-shadow:
              0 0 15px  #60A5FA,
              0 0 30px  #60A5FA,
              0 0 60px  rgba(96,165,250,1),
              0 0 100px rgba(96,165,250,0.9),
              0 0 150px rgba(96,165,250,0.7),
              0 0 200px rgba(96,165,250,0.4);
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
