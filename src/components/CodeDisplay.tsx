// src/components/CodeDisplay.tsx
import React, { useState } from 'react';
import { Copy, Check, Download, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface CodeDisplayProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
}

export function CodeDisplay({ code, language = 'afl', title = 'AFL CODE OUTPUT', showLineNumbers = true }: CodeDisplayProps) {
  // FIXED: Add theme support
  let isDark = true;
  try {
    const { resolvedTheme } = useTheme();
    isDark = resolvedTheme === 'dark';
  } catch {
    isDark = true;
  }

  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategy.${language}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const highlightCode = (line: string) => {
    // Comments
    if (line.trim().startsWith('//')) {
      return <span style={{ color: '#6A9955' }}>{line}</span>;
    }

    // Keywords
    const keywords = ['Buy', 'Sell', 'Short', 'Cover', 'if', 'else', 'for', 'while', 'return', 'function', 'procedure'];
    const functions = ['MA', 'EMA', 'RSI', 'MACD', 'Cross', 'Ref', 'HHV', 'LLV', 'ATR', 'StDev', 'IIf', 'ValueWhen', 'BarsSince'];
    const variables = ['Close', 'Open', 'High', 'Low', 'Volume', 'O', 'H', 'L', 'C', 'V'];

    // This is a simplified highlighter - in production you'd use a proper syntax highlighter
    return (
      <span>
        {line.split(/(\s+|[(),;=<>!&|+\-*/])/).map((part, i) => {
          if (keywords.includes(part)) {
            return <span key={i} style={{ color: '#FEC00F', fontWeight: 600 }}>{part}</span>;
          }
          if (functions.includes(part)) {
            return <span key={i} style={{ color: '#DCDCAA' }}>{part}</span>;
          }
          if (variables.includes(part)) {
            return <span key={i} style={{ color: '#9CDCFE' }}>{part}</span>;
          }
          if (/^\d+\.?\d*$/.test(part)) {
            return <span key={i} style={{ color: '#B5CEA8' }}>{part}</span>;
          }
          if (/^".*"$/.test(part) || /^'.*'$/.test(part)) {
            return <span key={i} style={{ color: '#CE9178' }}>{part}</span>;
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const lines = (code ?? '').split('\n');

  return (
    <div style={{
      backgroundColor: isDark ? '#1E1E1E' : '#ffffff',
      border: `1px solid ${isDark ? '#424242' : '#e0e0e0'}`,
      borderRadius: '12px',
      overflow: 'hidden',
      height: expanded ? '80vh' : 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        backgroundColor: isDark ? '#2A2A2A' : '#f5f5f5',
        borderBottom: `1px solid ${isDark ? '#424242' : '#e0e0e0'}`,
      }}>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
          color: isDark ? '#FFFFFF' : '#212121',
          letterSpacing: '0.5px',
        }}>
          {title}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: copied ? '#2D7F3E' : 'transparent',
              border: `1px solid ${copied ? '#2D7F3E' : '#424242'}`,
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '11px',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'COPIED!' : 'COPY'}
          </button>
          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid #424242',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '11px',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={12} />
            DOWNLOAD
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: '1px solid #424242',
              borderRadius: '6px',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: isDark ? '#0D1117' : '#f8f9fa',
      }}>
        <pre style={{
          margin: 0,
          padding: '20px',
          fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
          fontSize: '13px',
          lineHeight: 1.7,
        }}>
          {lines.map((line, index) => (
            <div key={index} style={{ display: 'flex' }}>
              {showLineNumbers && (
                <span style={{
                  width: '50px',
                  color: isDark ? '#6E7681' : '#adb5bd',
                  textAlign: 'right',
                  paddingRight: '20px',
                  userSelect: 'none',
                  borderRight: `1px solid ${isDark ? '#21262D' : '#e9ecef'}`,
                  marginRight: '20px',
                }}>
                  {index + 1}
                </span>
              )}
              <span style={{ color: isDark ? '#E6EDF3' : '#212529', flex: 1 }}>
                {highlightCode(line) || ' '}
              </span>
            </div>
          ))}
        </pre>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        backgroundColor: isDark ? '#161B22' : '#f1f3f5',
        borderTop: `1px solid ${isDark ? '#21262D' : '#e9ecef'}`,
      }}>
        <span style={{ color: isDark ? '#6E7681' : '#868e96', fontSize: '11px' }}>
          {lines.length} lines • {language.toUpperCase()}
        </span>
        <span style={{ color: isDark ? '#6E7681' : '#868e96', fontSize: '11px' }}>
          {code.length} characters
        </span>
      </div>
    </div>
  );
}
