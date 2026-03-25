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
  // FIXED: Proper React hooks usage - call useTheme unconditionally
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

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
      return <span style={{ color: 'var(--syntax-comment, #6A9955)' }}>{line}</span>;
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
            return <span key={i} style={{ color: 'var(--accent, #FEC00F)', fontWeight: 600 }}>{part}</span>;
          }
          if (functions.includes(part)) {
            return <span key={i} style={{ color: 'var(--syntax-function, #DCDCAA)' }}>{part}</span>;
          }
          if (variables.includes(part)) {
            return <span key={i} style={{ color: 'var(--syntax-variable, #9CDCFE)' }}>{part}</span>;
          }
          if (/^\d+\.?\d*$/.test(part)) {
            return <span key={i} style={{ color: 'var(--syntax-number, #B5CEA8)' }}>{part}</span>;
          }
          if (/^".*"$/.test(part) || /^'.*'$/.test(part)) {
            return <span key={i} style={{ color: 'var(--syntax-string, #CE9178)' }}>{part}</span>;
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const lines = (code ?? '').split('\n');

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border)',
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
        backgroundColor: 'var(--bg-raised)',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text)',
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
              backgroundColor: copied ? 'var(--success, #2D7F3E)' : 'transparent',
              border: `1px solid ${copied ? 'var(--success, #2D7F3E)' : 'var(--border)'}`,
              borderRadius: '6px',
              color: 'var(--text)',
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
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text)',
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
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text)',
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
        backgroundColor: 'var(--bg)',
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
                  color: 'var(--text-muted)',
                  textAlign: 'right',
                  paddingRight: '20px',
                  userSelect: 'none',
                  borderRight: '1px solid var(--border)',
                  marginRight: '20px',
                }}>
                  {index + 1}
                </span>
              )}
              <span style={{ color: 'var(--text)', flex: 1 }}>
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
        backgroundColor: 'var(--bg-raised)',
        borderTop: '1px solid var(--border)',
      }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
          {lines.length} lines • {language.toUpperCase()}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
          {code.length} characters
        </span>
      </div>
    </div>
  );
}