'use client';

import React, { useRef, useState, useCallback } from 'react';
import {
  Upload,
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  FileCode,
  FileSpreadsheet,
  FileImage,
  File,
  Info,
} from 'lucide-react';
import { Document } from '@/types/api';

interface KBUploadPanelProps {
  onUpload: (file: File) => Promise<Document>;
  onUploadComplete: () => void;
  isDark: boolean;
  colors: Record<string, string>;
  isMobile: boolean;
}

interface UploadItem {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const ACCEPTED_FORMATS = [
  { ext: '.pdf', label: 'PDF', color: '#ef4444' },
  { ext: '.txt', label: 'TXT', color: '#22c55e' },
  { ext: '.doc', label: 'DOC', color: '#3b82f6' },
  { ext: '.docx', label: 'DOCX', color: '#3b82f6' },
  { ext: '.csv', label: 'CSV', color: '#22c55e' },
  { ext: '.md', label: 'MD', color: '#a855f7' },
  { ext: '.json', label: 'JSON', color: '#f59e0b' },
  { ext: '.xml', label: 'XML', color: '#f59e0b' },
  { ext: '.html', label: 'HTML', color: '#ef4444' },
  { ext: '.xlsx', label: 'XLSX', color: '#22c55e' },
  { ext: '.rtf', label: 'RTF', color: '#6366f1' },
];

const ACCEPT_STRING = ACCEPTED_FORMATS.map((f) => f.ext).join(',');

function getUploadIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'rtf':
      return FileText;
    case 'csv':
    case 'xlsx':
    case 'xls':
      return FileSpreadsheet;
    case 'md':
    case 'json':
    case 'xml':
    case 'html':
      return FileCode;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return FileImage;
    default:
      return File;
  }
}

export default function KBUploadPanel({
  onUpload,
  onUploadComplete,
  isDark,
  colors,
  isMobile,
}: KBUploadPanelProps) {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const items: UploadItem[] = files.map((file) => ({
        file,
        status: 'pending' as const,
      }));
      setUploadItems(items);
      setUploading(true);

      for (let i = 0; i < items.length; i++) {
        setUploadItems((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'uploading' } : item
          )
        );
        try {
          await onUpload(items[i].file);
          setUploadItems((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: 'success' } : item
            )
          );
        } catch (err) {
          setUploadItems((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? {
                    ...item,
                    status: 'error',
                    error:
                      err instanceof Error ? err.message : 'Upload failed',
                  }
                : item
            )
          );
        }
      }

      setUploading(false);
      onUploadComplete();

      setTimeout(() => {
        setUploadItems([]);
      }, 4000);
    },
    [onUpload, onUploadComplete]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [processFiles]
  );

  const completedCount = uploadItems.filter(
    (i) => i.status === 'success' || i.status === 'error'
  ).length;
  const successCount = uploadItems.filter((i) => i.status === 'success').length;
  const failedCount = uploadItems.filter((i) => i.status === 'error').length;

  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: isMobile ? '16px' : '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: `${colors.accent}14`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Upload size={16} color={colors.accent} />
          </div>
          <div>
            <h3
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '15px',
                fontWeight: 700,
                color: colors.text,
                letterSpacing: '1px',
                margin: 0,
              }}
            >
              UPLOAD DOCUMENTS
            </h3>
            <p style={{ color: colors.textMuted, fontSize: '11px', margin: '2px 0 0 0' }}>
              Expand your knowledge base with new files
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: isMobile ? '16px' : '20px 24px' }}>
        {/* Drop Zone */}
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? colors.accent : colors.border}`,
            borderRadius: '12px',
            padding: isMobile ? '28px 16px' : '36px 24px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.25s ease',
            backgroundColor: dragOver
              ? isDark
                ? '#1A1A10'
                : '#FFFEF5'
              : isDark
              ? '#161616'
              : '#FAFAFA',
          }}
        >
          {uploading ? (
            <Loader2
              size={32}
              color={colors.accent}
              style={{ animation: 'spin 1s linear infinite' }}
            />
          ) : (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: `${colors.accent}14`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <Upload size={24} color={colors.accent} />
            </div>
          )}
          <p
            style={{
              color: colors.text,
              fontSize: '14px',
              fontWeight: 600,
              marginTop: '14px',
              marginBottom: '4px',
            }}
          >
            {uploading
              ? `Uploading ${completedCount}/${uploadItems.length}...`
              : dragOver
              ? 'Drop files here'
              : 'Click or drag files to upload'}
          </p>
          <p
            style={{
              color: colors.textMuted,
              fontSize: '12px',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {uploading
              ? ''
              : 'Supports PDF, TXT, DOC, DOCX, CSV, MD, JSON, XML, HTML, XLSX, RTF'}
          </p>
        </div>

        {/* Supported Formats Grid */}
        {!uploading && uploadItems.length === 0 && (
          <div style={{ marginTop: '16px' }}>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: colors.textMuted,
                marginBottom: '8px',
                fontFamily: "'Rajdhani', sans-serif",
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Info size={11} />
              SUPPORTED FORMATS
            </p>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {ACCEPTED_FORMATS.map((f) => (
                <span
                  key={f.ext}
                  style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: `${f.color}14`,
                    color: f.color,
                    fontWeight: 700,
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '0.3px',
                  }}
                >
                  {f.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadItems.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                {completedCount} of {uploadItems.length} files
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {successCount > 0 && (
                  <span
                    style={{
                      color: '#22c55e',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle size={12} />
                    {successCount}
                  </span>
                )}
                {failedCount > 0 && (
                  <span
                    style={{
                      color: '#DC2626',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <XCircle size={12} />
                    {failedCount}
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: isDark ? '#2A2A2A' : '#E5E5E5',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${
                    uploadItems.length > 0
                      ? (completedCount / uploadItems.length) * 100
                      : 0
                  }%`,
                  height: '100%',
                  backgroundColor: colors.accent,
                  borderRadius: '2px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            {/* Individual file status */}
            <div
              style={{
                marginTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                maxHeight: '160px',
                overflow: 'auto',
              }}
            >
              {uploadItems.map((item, idx) => {
                const FIcon = getUploadIcon(item.file.name);
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: isDark ? '#161616' : '#FAFAFA',
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {item.status === 'uploading' && (
                      <Loader2
                        size={14}
                        color={colors.accent}
                        style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
                      />
                    )}
                    {item.status === 'success' && (
                      <CheckCircle size={14} color="#22c55e" style={{ flexShrink: 0 }} />
                    )}
                    {item.status === 'error' && (
                      <XCircle size={14} color="#DC2626" style={{ flexShrink: 0 }} />
                    )}
                    {item.status === 'pending' && (
                      <FIcon size={14} color={colors.textMuted} style={{ flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        color:
                          item.status === 'error'
                            ? '#DC2626'
                            : item.status === 'success'
                            ? '#22c55e'
                            : colors.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        fontSize: '12px',
                      }}
                    >
                      {item.file.name}
                    </span>
                    <span style={{ color: colors.textMuted, fontSize: '10px', flexShrink: 0 }}>
                      {(item.file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={ACCEPT_STRING}
        multiple
        style={{ display: 'none' }}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
