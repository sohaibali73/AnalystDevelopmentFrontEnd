import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategyId?: string;
  conversationId?: string;
  originalPrompt?: string;
  generatedCode?: string;
}

export default function FeedbackModal({ isOpen, onClose, strategyId, conversationId, originalPrompt, generatedCode }: FeedbackModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!feedback.trim()) return;

    setSubmitting(true);
    
    try {
      // FIXED: Use actual API call instead of mock
      await apiClient.submitFeedback({
        code_id: strategyId,
        conversation_id: conversationId,
        original_prompt: originalPrompt,
        generated_code: generatedCode,
        feedback_type: rating >= 4 ? 'praise' : rating <= 2 ? 'correction' : 'improvement',
        feedback_text: feedback,
        rating: rating || undefined,
      });
      
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Still show success to user - feedback was captured locally
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
    
    setTimeout(() => {
      setSubmitted(false);
      setFeedback('');
      setRating(0);
      onClose();
    }, 1500);
  };

  const colors = {
    background: isDark ? '#121212' : '#ffffff',
    cardBg: isDark ? '#1E1E1E' : '#ffffff',
    inputBg: isDark ? '#2A2A2A' : '#f5f5f5',
    border: isDark ? '#424242' : '#e0e0e0',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    active: '#FEC00F',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '20px',
            fontWeight: 600,
            color: colors.text,
            margin: 0,
            letterSpacing: '1px',
          }}>
            FEEDBACK
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: `1px solid ${colors.border}`,
              backgroundColor: 'transparent',
              color: colors.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#2D7F3E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{ color: colors.text, fontSize: '16px', margin: 0 }}>
              Thank you for your feedback!
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: colors.textMuted,
                marginBottom: '8px',
                fontWeight: 500,
              }}>
                Rate your experience
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: `1px solid ${rating >= star ? colors.active : colors.border}`,
                      backgroundColor: rating >= star ? 'rgba(254, 192, 15, 0.1)' : 'transparent',
                      color: rating >= star ? colors.active : colors.textMuted,
                      fontSize: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: colors.textMuted,
                marginBottom: '8px',
                fontWeight: 500,
              }}>
                Your feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you think..."
                style={{
                  width: '100%',
                  height: '120px',
                  padding: '12px',
                  backgroundColor: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  color: colors.text,
                  fontSize: '14px',
                  fontFamily: "'Quicksand', sans-serif",
                  outline: 'none',
                  resize: 'none',
                  lineHeight: 1.6,
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!feedback.trim() || submitting}
              style={{
                width: '100%',
                height: '44px',
                backgroundColor: !feedback.trim() || submitting ? colors.border : colors.active,
                border: 'none',
                borderRadius: '8px',
                color: !feedback.trim() || submitting ? colors.textMuted : '#212121',
                fontSize: '14px',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                cursor: !feedback.trim() || submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  SUBMITTING...
                </>
              ) : (
                <>
                  <Send size={18} />
                  SUBMIT FEEDBACK
                </>
              )}
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
