'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  uploadChartImage,
  generateDeck,
  type UploadImageResponse,
  type GenerateDeckResponse,
} from '@/lib/pptxApi';
import { useTheme } from '@/contexts/ThemeContext';
import { Download, Upload, FileImage, Loader2, AlertCircle, Presentation, X, CheckCircle2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

const DECK_TYPES = [
  { value: 'bull-bear', label: 'Bull-Bear' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'income-plus', label: 'Income Plus' },
  { value: 'max-growth', label: 'Max Growth' },
] as const;

type DeckFamily = (typeof DECK_TYPES)[number]['value'];

interface UploadProgress {
  fileName: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  savedAs?: string;
  error?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DeckGeneratorPage() {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [deckType, setDeckType] = useState<DeckFamily>('bull-bear');
  const [brief, setBrief] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Progress / result state
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [slideCount, setSlideCount] = useState<number | null>(null);

  // ── File selection helpers ──────────────────────────────────────────────

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setError(null);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Submit handler ─────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDownloadUrl(null);
    setSlideCount(null);
    setIsGenerating(true);

    try {
      // 1. Upload each chart image
      const progress: UploadProgress[] = selectedFiles.map((f) => ({
        fileName: f.name,
        status: 'pending' as const,
      }));
      setUploadProgress([...progress]);

      const uploadedFilenames: string[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        progress[i] = { ...progress[i], status: 'uploading' };
        setUploadProgress([...progress]);

        try {
          const result: UploadImageResponse = await uploadChartImage(selectedFiles[i]);
          uploadedFilenames.push(result.filename);
          progress[i] = { ...progress[i], status: 'done', savedAs: result.saved_as };
        } catch (uploadErr: unknown) {
          const msg = uploadErr instanceof Error ? uploadErr.message : 'Upload failed';
          progress[i] = { ...progress[i], status: 'error', error: msg };
          throw new Error(`Failed to upload "${selectedFiles[i].name}": ${msg}`);
        }
        setUploadProgress([...progress]);
      }

      // 2. Generate the deck (SSE streaming — onStatus shows live progress)
      setStatusMessage('Starting presentation generation...');
      const result = await generateDeck(
        {
          outline: brief,
          deck_family: deckType,
          uploaded_images: uploadedFilenames,
        },
        (message) => setStatusMessage(message), // SSE progress callback
      );

      setStatusMessage(null);
      setDownloadUrl(result.download_url);
      setSlideCount(result.slide_count);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────

  const colors = {
    bg: isDark ? '#1a1a1a' : '#ffffff',
    cardBg: isDark ? '#242424' : '#f9fafb',
    border: isDark ? '#333333' : '#e5e7eb',
    text: isDark ? '#f5f5f5' : '#111827',
    textMuted: isDark ? '#9ca3af' : '#6b7280',
    inputBg: isDark ? '#1e1e1e' : '#ffffff',
    inputBorder: isDark ? '#404040' : '#d1d5db',
    accent: '#FEC00F',
    accentHover: '#e5ad0e',
    accentText: '#212121',
    errorBg: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2',
    errorText: isDark ? '#fca5a5' : '#dc2626',
    successBg: isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4',
    successText: isDark ? '#86efac' : '#16a34a',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '40px 24px',
        backgroundColor: colors.bg,
        fontFamily: "'Quicksand', sans-serif",
        transition: 'background-color 0.3s ease',
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
            <Presentation size={32} color={colors.accent} />
            <h1
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: '28px',
                letterSpacing: '3px',
                color: colors.text,
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              PRESENTATION GENERATOR
            </h1>
          </div>
          <p style={{ color: colors.textMuted, fontSize: '15px', margin: 0 }}>
            Create professional PowerPoint decks powered by AI
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Deck Type */}
          <div>
            <label
              htmlFor="deckType"
              style={{
                display: 'block',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: '14px',
                letterSpacing: '0.5px',
                color: colors.text,
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}
            >
              Deck Type
            </label>
            <select
              id="deckType"
              value={deckType}
              onChange={(e) => setDeckType(e.target.value as DeckFamily)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: `1px solid ${colors.inputBorder}`,
                backgroundColor: colors.inputBg,
                color: colors.text,
                fontSize: '15px',
                fontFamily: "'Quicksand', sans-serif",
                cursor: 'pointer',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                appearance: 'auto',
              }}
              onFocus={(e) => (e.target.style.borderColor = colors.accent)}
              onBlur={(e) => (e.target.style.borderColor = colors.inputBorder)}
            >
              {DECK_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Presentation Brief */}
          <div>
            <label
              htmlFor="brief"
              style={{
                display: 'block',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: '14px',
                letterSpacing: '0.5px',
                color: colors.text,
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}
            >
              Presentation Brief
            </label>
            <textarea
              id="brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe what this presentation should cover, who the audience is, and any specific data points to include..."
              rows={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: `1px solid ${colors.inputBorder}`,
                backgroundColor: colors.inputBg,
                color: colors.text,
                fontSize: '15px',
                fontFamily: "'Quicksand', sans-serif",
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                lineHeight: 1.6,
              }}
              onFocus={(e) => (e.target.style.borderColor = colors.accent)}
              onBlur={(e) => (e.target.style.borderColor = colors.inputBorder)}
            />
          </div>

          {/* Chart Images Upload */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: '14px',
                letterSpacing: '0.5px',
                color: colors.text,
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}
            >
              Chart Images
            </label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* Drop zone / upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '24px',
                borderRadius: '10px',
                border: `2px dashed ${colors.inputBorder}`,
                backgroundColor: 'transparent',
                color: colors.textMuted,
                fontSize: '14px',
                fontFamily: "'Quicksand', sans-serif",
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'border-color 0.2s ease, background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.accent;
                e.currentTarget.style.backgroundColor = isDark
                  ? 'rgba(254,192,15,0.05)'
                  : 'rgba(254,192,15,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.inputBorder;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Upload size={24} />
              <span>Click to select chart images</span>
              <span style={{ fontSize: '12px' }}>PNG, JPG, JPEG — multiple files allowed</span>
            </button>

            {/* Selected files list */}
            {selectedFiles.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6',
                      fontSize: '13px',
                      color: colors.text,
                    }}
                  >
                    <FileImage size={16} color={colors.textMuted} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </span>
                    <span style={{ color: colors.textMuted, fontSize: '12px', flexShrink: 0 }}>
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: colors.textMuted,
                        padding: '4px',
                        display: 'flex',
                        borderRadius: '4px',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = colors.errorText)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadProgress.length > 0 && isGenerating && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: isDark ? '#1e1e1e' : '#f9fafb',
                border: `1px solid ${colors.border}`,
              }}
            >
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  fontSize: '13px',
                  letterSpacing: '0.5px',
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Upload Progress
              </span>
              {uploadProgress.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: colors.text,
                  }}
                >
                  {p.status === 'pending' && (
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: `2px solid ${colors.border}`,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {p.status === 'uploading' && <Loader2 size={16} color={colors.accent} className="animate-spin" />}
                  {p.status === 'done' && <CheckCircle2 size={16} color={colors.successText} />}
                  {p.status === 'error' && <AlertCircle size={16} color={colors.errorText} />}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.fileName}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color:
                        p.status === 'done'
                          ? colors.successText
                          : p.status === 'error'
                          ? colors.errorText
                          : colors.textMuted,
                    }}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Generation Status Message */}
          {statusMessage && isGenerating && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 16px',
                borderRadius: '10px',
                backgroundColor: isDark ? 'rgba(254,192,15,0.08)' : 'rgba(254,192,15,0.1)',
                border: `1px solid ${isDark ? 'rgba(254,192,15,0.2)' : 'rgba(254,192,15,0.3)'}`,
                fontSize: '14px',
                color: colors.text,
              }}
            >
              <Loader2 size={16} color={colors.accent} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Quicksand', sans-serif" }}>{statusMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '14px 16px',
                borderRadius: '10px',
                backgroundColor: colors.errorBg,
                color: colors.errorText,
                fontSize: '14px',
                lineHeight: 1.5,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success / Download */}
          {downloadUrl && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: '20px',
                borderRadius: '10px',
                backgroundColor: colors.successBg,
              }}
            >
              <CheckCircle2 size={28} color={colors.successText} />
              <span
                style={{
                  color: colors.successText,
                  fontWeight: 600,
                  fontSize: '15px',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.5px',
                }}
              >
                Presentation ready!{slideCount ? ` (${slideCount} slides)` : ''}
              </span>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 28px',
                  borderRadius: '10px',
                  backgroundColor: colors.accent,
                  color: colors.accentText,
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: '15px',
                  letterSpacing: '1px',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  transition: 'background-color 0.2s ease, transform 0.1s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.accentHover;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.accent;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Download size={18} />
                Download Your Presentation
              </a>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="submit"
            disabled={isGenerating || !brief.trim()}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '16px 24px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: isGenerating || !brief.trim() ? (isDark ? '#333' : '#d1d5db') : colors.accent,
              color: isGenerating || !brief.trim() ? (isDark ? '#666' : '#9ca3af') : colors.accentText,
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: '16px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              cursor: isGenerating || !brief.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease, transform 0.1s ease',
            }}
            onMouseEnter={(e) => {
              if (!isGenerating && brief.trim()) {
                e.currentTarget.style.backgroundColor = colors.accentHover;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isGenerating && brief.trim()) {
                e.currentTarget.style.backgroundColor = colors.accent;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Presentation size={20} />
                Generate Presentation
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
