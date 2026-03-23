'use client';

import React from 'react';
import { FileText, User, Calendar, FileIcon, BookOpen } from 'lucide-react';

interface FileAnalysisCardProps {
  fileName?: string;
  fileType?: string;
  author?: string;
  date?: string;
  pages?: number;
  summary?: string;
  [key: string]: any;
}

export function FileAnalysisCard(props: FileAnalysisCardProps) {
  const {
    fileName = 'Unknown File',
    fileType = 'Document',
    author,
    date,
    pages,
    summary,
  } = props;

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('pdf')) return '📄';
    if (t.includes('doc')) return '📝';
    if (t.includes('xls') || t.includes('csv')) return '📊';
    if (t.includes('ppt')) return '📽️';
    if (t.includes('txt')) return '📃';
    return '📁';
  };

  const getFileColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('pdf')) return '#EF4444';
    if (t.includes('doc')) return '#3B82F6';
    if (t.includes('xls') || t.includes('csv')) return '#22C55E';
    if (t.includes('ppt')) return '#F97316';
    if (t.includes('txt')) return '#8B5CF6';
    return '#6B7280';
  };

  const fileColor = getFileColor(fileType);
  const fileIcon = getFileIcon(fileType);

  return (
    <div
      style={{
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #0D0D10 0%, #1a1a24 50%, #0D0D10 100%)',
        color: '#fff',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        maxWidth: '480px',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          background: `linear-gradient(135deg, ${fileColor}15 0%, transparent 100%)`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background icon */}
        <div
          style={{
            position: 'absolute',
            right: '-5px',
            top: '-10px',
            fontSize: '100px',
            opacity: 0.06,
            lineHeight: 1,
          }}
        >
          {fileIcon}
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: `${fileColor}20`,
                border: `1px solid ${fileColor}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              {fileIcon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: fileColor,
                  marginBottom: '2px',
                }}
              >
                {fileType} Analysis
              </div>
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: '-0.01em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {fileName}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1px',
          backgroundColor: 'rgba(255,255,255,0.04)',
        }}
      >
        {author && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(0,0,0,0.2)',
              textAlign: 'center',
            }}
          >
            <User
              size={16}
              color={fileColor}
              style={{ marginBottom: '4px' }}
            />
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {author.split(',')[0].trim()}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
              }}
            >
              Author
            </div>
          </div>
        )}
        {date && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(0,0,0,0.2)',
              textAlign: 'center',
            }}
          >
            <Calendar
              size={16}
              color="#60A5FA"
              style={{ marginBottom: '4px' }}
            />
            <div style={{ fontSize: '12px', fontWeight: 600 }}>{date}</div>
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
              }}
            >
              Date
            </div>
          </div>
        )}
        {pages !== undefined && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(0,0,0,0.2)',
              textAlign: 'center',
            }}
          >
            <BookOpen
              size={16}
              color="#A78BFA"
              style={{ marginBottom: '4px' }}
            />
            <div style={{ fontSize: '12px', fontWeight: 600 }}>{pages}</div>
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
              }}
            >
              Pages
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div style={{ padding: '16px 24px' }}>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: '8px',
            }}
          >
            Summary
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            {summary}
          </p>
        </div>
      )}
    </div>
  );
}

export default FileAnalysisCard;