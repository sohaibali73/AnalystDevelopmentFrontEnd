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
  ChevronRight,
  ChevronLeft,
  User,
  Mail,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

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
  const [isMobile, setIsMobile] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setError('');

    try {
      await register(
        formData.email,
        formData.password,
        formData.name,
        '', // No Claude API key - server keys used
        ''  // No Tavily API key - server keys used
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
    if (s <= 3) return '#EAB308';
    return '#22C55E';
  };

  const strengthText = () => {
    const s = passwordStrength();
    if (s <= 1) return 'Weak';
    if (s <= 2) return 'Fair';
    if (s <= 3) return 'Good';
    return 'Strong';
  };

  // Frosted glass styles
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
        maxWidth: '460px',
        padding: isMobile ? '32px 24px' : '48px 40px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: isDark 
              ? 'linear-gradient(135deg, rgba(254, 192, 15, 0.15) 0%, rgba(254, 192, 15, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(254, 192, 15, 0.2) 0%, rgba(254, 192, 15, 0.08) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: `1px solid ${isDark ? 'rgba(254, 192, 15, 0.2)' : 'rgba(254, 192, 15, 0.3)'}`,
          }}>
            <img 
              src={logoSrc} 
              alt="Analyst Logo" 
              style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
            />
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '28px',
            fontWeight: 700,
            color: isDark ? '#FAFAFA' : '#0A0A0B',
            letterSpacing: '-0.02em',
            margin: '0 0 4px',
          }}>
            Create Account
          </h1>
          <p style={{
            fontSize: '14px',
            color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            margin: 0,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}>
            Join Potomac Analyst today
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '32px',
        }}>
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step >= s 
                  ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                  : isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                border: step >= s 
                  ? 'none' 
                  : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                boxShadow: step >= s ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
              }}>
                {step > s ? (
                  <Check size={16} color="#FFFFFF" />
                ) : (
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: step >= s ? '#FFFFFF' : isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}>
                    {s}
                  </span>
                )}
              </div>
              {s < 2 && (
                <div style={{
                  width: '48px',
                  height: '2px',
                  borderRadius: '1px',
                  background: step > s 
                    ? 'linear-gradient(90deg, #6366F1, #8B5CF6)'
                    : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.3s ease',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Titles */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#6366F1',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            margin: '0 0 4px',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}>
            Step {step} of 2
          </p>
          <p style={{
            fontSize: '15px',
            fontWeight: 500,
            color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            margin: 0,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}>
            {step === 1 ? 'Your Information' : 'Secure Your Account'}
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
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User 
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
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="John Doe"
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
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
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

              <button
                type="button"
                onClick={handleNext}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  marginTop: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  color: '#FFFFFF',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.3)';
                }}
              >
                Continue
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Password</label>
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
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    placeholder="Min. 8 characters"
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

                {/* Password Strength */}
                {formData.password && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: '3px',
                            borderRadius: '2px',
                            background: i <= passwordStrength() 
                              ? strengthColor() 
                              : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                            transition: 'all 0.2s ease',
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ 
                      color: strengthColor(), 
                      fontSize: '12px', 
                      margin: 0, 
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontWeight: 500,
                    }}>
                      {strengthText()}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Confirm Password</label>
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
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p style={{ 
                    color: '#22C55E', 
                    fontSize: '12px', 
                    marginTop: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontWeight: 500,
                  }}>
                    <Check size={14} /> Passwords match
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div
                onClick={() => updateFormData('agreeToTerms', !formData.agreeToTerms)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    border: formData.agreeToTerms 
                      ? 'none' 
                      : `2px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                    background: formData.agreeToTerms 
                      ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' 
                      : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    marginTop: '2px',
                  }}
                >
                  {formData.agreeToTerms && <Check size={12} color="#FFFFFF" />}
                </div>
                <span style={{ 
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.55)', 
                  fontSize: '13px', 
                  lineHeight: 1.5, 
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  I agree to the{' '}
                  <Link href="/terms" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: 500 }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</Link>
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={handleBack} 
                  style={{
                    padding: '14px 20px',
                    fontSize: '15px',
                    fontWeight: 600,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
                  }}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    fontSize: '15px',
                    fontWeight: 600,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    color: '#FFFFFF',
                    background: loading 
                      ? 'linear-gradient(135deg, #4B5563 0%, #6B7280 100%)'
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Create Account
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Sign In Link */}
        <p style={{
          textAlign: 'center',
          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          fontSize: '14px',
          marginTop: '28px',
          marginBottom: 0,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          Already have an account?{' '}
          <Link 
            href="/login" 
            style={{ 
              color: '#6366F1', 
              fontWeight: 600, 
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 20px); }
        }
        input::placeholder {
          color: ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.35)'};
        }
      `}</style>
    </div>
  );
}

export default RegisterPage;
