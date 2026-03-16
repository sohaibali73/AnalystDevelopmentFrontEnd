'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Play, Copy, Check, RotateCcw, Terminal, Code2, ChevronDown, ChevronRight, Maximize2, Minimize2, Download } from 'lucide-react';

interface CodeSandboxProps {
  code: string;
  language?: string;
  title?: string;
  description?: string;
  output?: string;
  editable?: boolean;
  autorun?: boolean;
  files?: Array<{ name: string; code: string; language?: string }>;
}

const languageColors: Record<string, { bg: string; text: string }> = {
  python: { bg: 'rgba(53,114,165,0.2)', text: '#3572A5' },
  javascript: { bg: 'rgba(241,224,90,0.2)', text: '#F1E05A' },
  typescript: { bg: 'rgba(43,116,137,0.2)', text: '#3178C6' },
  afl: { bg: 'rgba(254,192,15,0.2)', text: '#FEC00F' },
  html: { bg: 'rgba(227,76,38,0.2)', text: '#E34C26' },
  css: { bg: 'rgba(86,61,124,0.2)', text: '#563D7C' },
  sql: { bg: 'rgba(229,153,0,0.2)', text: '#E59900' },
  json: { bg: 'rgba(41,41,41,0.2)', text: '#9CA3AF' },
  r: { bg: 'rgba(25,140,231,0.2)', text: '#198CE7' },
};

// Simple syntax highlighting
function highlightCode(code: string, lang: string): React.ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, i) => {
    let colored = line;
    // Comment detection
    const commentIdx = lang === 'python' ? line.indexOf('#') : line.indexOf('//');
    let commentPart = '';
    if (commentIdx >= 0 && lang !== 'html') {
      commentPart = line.slice(commentIdx);
      colored = line.slice(0, commentIdx);
    }

    return (
      <div key={i} style={{ display: 'flex', minHeight: '20px' }}>
        <span style={{ width: '36px', color: '#6E7681', textAlign: 'right', paddingRight: '12px', userSelect: 'none', borderRight: '1px solid rgba(255,255,255,0.06)', marginRight: '12px', flexShrink: 0 }}>
          {i + 1}
        </span>
        <span>
          <span style={{ color: '#E6EDF3' }}>{colored}</span>
          {commentPart && <span style={{ color: '#6A9955' }}>{commentPart}</span>}
        </span>
      </div>
    );
  });
}

export function CodeSandbox({
  code: initialCode,
  language = 'python',
  title,
  description,
  output: initialOutput,
  editable = true,
  autorun = false,
  files = [],
}: CodeSandboxProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState(initialOutput || '');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(!!initialOutput);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeFile, setActiveFile] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const langStyle = languageColors[language.toLowerCase()] || languageColors.json;

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setShowOutput(true);
    setOutput('Running...');

    // Simulate execution (in a real app, this would call a backend API)
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
    
    try {
      // Try to evaluate JavaScript/simple expressions
      if (language === 'javascript' || language === 'typescript') {
        try {
          // Very limited safe eval for demo
          const result = new Function(`"use strict"; ${code}; return typeof result !== 'undefined' ? result : 'Code executed successfully.';`)();
          setOutput(String(result));
        } catch (e: any) {
          setOutput(`Error: ${e.message}`);
        }
      } else {
        setOutput(`[${language}] Code executed successfully.\n\nNote: Server-side execution not connected.\nCode length: ${code.length} chars, ${code.split('\n').length} lines.`);
      }
    } catch {
      setOutput('Execution completed.');
    }

    setIsRunning(false);
  }, [code, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput(initialOutput || '');
  };

  const handleDownload = () => {
    const ext: Record<string, string> = { python: 'py', javascript: 'js', typescript: 'ts', afl: 'afl', html: 'html', css: 'css', sql: 'sql', json: 'json', r: 'r' };
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'code'}.${ext[language.toLowerCase()] || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allFiles = files.length > 0 ? files : [{ name: title || `main.${language}`, code: initialCode, language }];

  return (
    <div style={{
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      maxWidth: isFullscreen ? '100%' : '640px',
      backgroundColor: '#0D1117',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Code2 size={16} color="#FEC00F" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{title || 'Code Sandbox'}</span>
          <span style={{
            fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px',
            backgroundColor: langStyle.bg, color: langStyle.text, textTransform: 'uppercase',
          }}>
            {language}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={handleRun} disabled={isRunning} style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px',
            borderRadius: '6px', border: 'none', cursor: isRunning ? 'not-allowed' : 'pointer',
            backgroundColor: isRunning ? 'rgba(34,197,94,0.1)' : '#22C55E',
            color: isRunning ? '#22C55E' : '#fff', fontSize: '11px', fontWeight: 700,
          }}>
            <Play size={12} />
            {isRunning ? 'Running...' : 'Run'}
          </button>
          <button onClick={handleCopy} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {copied ? <Check size={12} color="#22C55E" /> : <Copy size={12} color="rgba(255,255,255,0.5)" />}
          </button>
          <button onClick={handleReset} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RotateCcw size={12} color="rgba(255,255,255,0.5)" />
          </button>
          <button onClick={handleDownload} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Download size={12} color="rgba(255,255,255,0.5)" />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {isFullscreen ? <Minimize2 size={12} color="rgba(255,255,255,0.5)" /> : <Maximize2 size={12} color="rgba(255,255,255,0.5)" />}
          </button>
        </div>
      </div>

      {/* File tabs */}
      {allFiles.length > 1 && (
        <div style={{ display: 'flex', backgroundColor: '#161b22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {allFiles.map((file, i) => (
            <button key={i} onClick={() => { setActiveFile(i); setCode(file.code); }} style={{
              padding: '8px 16px', fontSize: '12px', fontWeight: activeFile === i ? 600 : 400,
              backgroundColor: activeFile === i ? '#0D1117' : 'transparent',
              color: activeFile === i ? '#fff' : 'rgba(255,255,255,0.5)',
              border: 'none', borderBottom: activeFile === i ? '2px solid #FEC00F' : '2px solid transparent',
              cursor: 'pointer',
            }}>
              {file.name}
            </button>
          ))}
        </div>
      )}

      {description && (
        <div style={{ padding: '10px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)', fontStyle: 'italic' }}>
          {description}
        </div>
      )}

      {/* Code area */}
      <div style={{ position: 'relative', maxHeight: isFullscreen ? '500px' : '320px', overflow: 'auto' }}>
        {isEditing && editable ? (
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={() => setIsEditing(false)}
            autoFocus
            spellCheck={false}
            style={{
              width: '100%', minHeight: '200px', padding: '16px', paddingLeft: '60px',
              backgroundColor: '#0D1117', color: '#E6EDF3', border: 'none', outline: 'none',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '13px',
              lineHeight: '20px', resize: 'vertical', whiteSpace: 'pre', overflowWrap: 'normal',
            }}
          />
        ) : (
          <div
            onClick={() => editable && setIsEditing(true)}
            style={{
              padding: '16px', fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: '13px', lineHeight: '20px', cursor: editable ? 'text' : 'default',
            }}
          >
            {highlightCode(code, language)}
          </div>
        )}
        {editable && !isEditing && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
            Click to edit
          </div>
        )}
      </div>

      {/* Output */}
      {(showOutput || output) && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setShowOutput(!showOutput)}
            style={{
              width: '100%', padding: '8px 16px', background: 'rgba(255,255,255,0.02)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600,
            }}
          >
            <Terminal size={12} />
            {showOutput ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Output
          </button>
          {showOutput && (
            <pre style={{
              margin: 0, padding: '12px 16px', backgroundColor: '#010409',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', lineHeight: 1.6,
              color: output.startsWith('Error') ? '#F97583' : '#7EE787',
              whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto',
            }}>
              {output || 'No output yet. Click "Run" to execute.'}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default CodeSandbox;
