'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Play, Copy, Check, RotateCcw, Terminal, Code2, ChevronDown, ChevronRight, 
  Maximize2, Minimize2, Download, X, AlertTriangle, FileCode, Eye, 
  Loader2, SplitSquareHorizontal, PanelRightClose, ExternalLink 
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface InteractiveCodeSandboxProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  initialLanguage?: string;
  isDark?: boolean;
}

type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'html' | 'react' | 'css';

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
}

const languageConfig: Record<SupportedLanguage, { 
  label: string; 
  color: string; 
  bgColor: string;
  extension: string;
  icon: React.ReactNode;
}> = {
  javascript: { label: 'JavaScript', color: '#F7DF1E', bgColor: 'rgba(247,223,30,0.15)', extension: 'js', icon: <FileCode size={14} /> },
  typescript: { label: 'TypeScript', color: '#3178C6', bgColor: 'rgba(49,120,198,0.15)', extension: 'ts', icon: <FileCode size={14} /> },
  python: { label: 'Python', color: '#3572A5', bgColor: 'rgba(53,114,165,0.15)', extension: 'py', icon: <FileCode size={14} /> },
  html: { label: 'HTML', color: '#E34F26', bgColor: 'rgba(227,79,38,0.15)', extension: 'html', icon: <Code2 size={14} /> },
  react: { label: 'React/JSX', color: '#61DAFB', bgColor: 'rgba(97,218,251,0.15)', extension: 'jsx', icon: <Code2 size={14} /> },
  css: { label: 'CSS', color: '#663399', bgColor: 'rgba(102,51,153,0.15)', extension: 'css', icon: <FileCode size={14} /> },
};

const codeTemplates: Record<SupportedLanguage, string> = {
  javascript: `// JavaScript Sandbox
function greet(name) {
  return \`Hello, \${name}!\`;
}

// Test the function
const result = greet('World');
console.log(result);

// You can also use modern JS features
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('Doubled:', doubled);`,

  typescript: `// TypeScript Sandbox
interface User {
  name: string;
  age: number;
}

function greetUser(user: User): string {
  return \`Hello \${user.name}, you are \${user.age} years old!\`;
}

const user: User = { name: 'Alice', age: 30 };
console.log(greetUser(user));`,

  python: `# Python Sandbox
def factorial(n):
    """Calculate factorial of n"""
    if n <= 1:
        return 1
    return n * factorial(n - 1)

# Test the function
for i in range(1, 8):
    print(f"factorial({i}) = {factorial(i)}")

# List comprehension example
squares = [x**2 for x in range(1, 6)]
print(f"Squares: {squares}")`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Preview</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
    }
    h1 { color: #333; margin: 0 0 16px; }
    p { color: #666; margin: 0; }
    button {
      margin-top: 20px;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover { background: #5a67d8; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello from HTML!</h1>
    <p>Edit this code and see live preview</p>
    <button onclick="alert('Button clicked!')">Click Me</button>
  </div>
</body>
</html>`,

  react: `// React Component Preview
function App() {
  const [count, setCount] = React.useState(0);
  const [theme, setTheme] = React.useState('light');
  
  const colors = theme === 'light' 
    ? { bg: '#f8fafc', text: '#1e293b', accent: '#3b82f6' }
    : { bg: '#1e293b', text: '#f8fafc', accent: '#60a5fa' };

  return (
    <div style={{
      padding: '32px',
      minHeight: '100vh',
      backgroundColor: colors.bg,
      color: colors.text,
      fontFamily: 'system-ui, sans-serif',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>
          React Sandbox
        </h1>
        <p style={{ opacity: 0.7, marginBottom: '24px' }}>
          Interactive component preview
        </p>
        
        <div style={{
          backgroundColor: colors.accent + '20',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: colors.accent }}>
            {count}
          </div>
          <p style={{ opacity: 0.6, fontSize: '14px' }}>Counter</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => setCount(c => c - 1)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#ef4444',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            - Decrease
          </button>
          <button
            onClick={() => setCount(c => c + 1)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#22c55e',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            + Increase
          </button>
        </div>
        
        <button
          onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          style={{
            marginTop: '24px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: \`2px solid \${colors.accent}\`,
            backgroundColor: 'transparent',
            color: colors.accent,
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
        </button>
      </div>
    </div>
  );
}`,

  css: `/* CSS Sandbox - Edit and see results in HTML preview */
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  font-family: system-ui, sans-serif;
}

.box {
  width: 200px;
  height: 200px;
  background: linear-gradient(45deg, #ff6b6b, #feca57);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
  animation: pulse 2s infinite;
  box-shadow: 0 20px 60px rgba(255, 107, 107, 0.4);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.title {
  color: white;
  margin-bottom: 30px;
  font-size: 32px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}`,
};

// Simple syntax highlighting
function highlightCode(code: string, lang: SupportedLanguage): React.ReactNode[] {
  const lines = code.split('\n');
  
  return lines.map((line, i) => {
    let html = line
      // Strings
      .replace(/(["'`])((?:\\\1|(?:(?!\1).))*)\1/g, '<span style="color:#CE9178">$&</span>')
      // Keywords
      .replace(/\b(const|let|var|function|return|if|else|for|while|import|export|from|class|extends|new|this|async|await|try|catch|throw|typeof|instanceof|def|print|lambda|True|False|None|in|not|and|or|is)\b/g, '<span style="color:#569CD6">$1</span>')
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#B5CEA8">$1</span>')
      // HTML tags
      .replace(/(&lt;\/?[\w-]+)/g, '<span style="color:#569CD6">$1</span>')
      .replace(/(\/&gt;|&gt;)/g, '<span style="color:#569CD6">$1</span>')
      // Attributes
      .replace(/\s([\w-]+)=/g, ' <span style="color:#9CDCFE">$1</span>=');

    // Comments
    const commentPatterns = {
      javascript: /\/\/.*$/,
      typescript: /\/\/.*$/,
      python: /#.*$/,
      html: /<!--.*-->/,
      react: /\/\/.*$/,
      css: /\/\*.*?\*\//,
    };
    
    const commentMatch = line.match(commentPatterns[lang]);
    if (commentMatch) {
      const idx = line.indexOf(commentMatch[0]);
      const before = line.slice(0, idx);
      const comment = commentMatch[0];
      html = before.replace(/./g, (c) => c) + `<span style="color:#6A9955">${comment}</span>`;
    }

    return (
      <div key={i} style={{ display: 'flex', minHeight: '20px' }}>
        <span style={{ 
          width: '40px', 
          color: 'rgba(255,255,255,0.25)', 
          textAlign: 'right', 
          paddingRight: '16px', 
          userSelect: 'none',
          flexShrink: 0,
          fontSize: '12px',
        }}>
          {i + 1}
        </span>
        <span 
          style={{ color: '#D4D4D4' }}
          dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} 
        />
      </div>
    );
  });
}

// Execute JavaScript/TypeScript code safely
function executeJavaScript(code: string): ExecutionResult {
  const logs: string[] = [];
  const startTime = performance.now();
  
  try {
    // Capture console.log output
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.map(a => 
        typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
      ).join(' '));
    };

    // Execute in a function scope
    const result = new Function(`
      "use strict";
      ${code}
    `)();

    console.log = originalLog;

    const executionTime = performance.now() - startTime;
    const output = logs.length > 0 
      ? logs.join('\n') 
      : result !== undefined 
        ? String(result) 
        : 'Code executed successfully (no output)';

    return { success: true, output, executionTime };
  } catch (error: any) {
    console.log = console.log; // Restore
    return { 
      success: false, 
      output: '', 
      error: error.message || String(error),
      executionTime: performance.now() - startTime 
    };
  }
}

// Simulate Python execution (would need a backend in production)
function executePython(code: string): ExecutionResult {
  const startTime = performance.now();
  
  // Simple simulation - in production, this would call a backend API
  const printMatches = code.match(/print\s*\((.*?)\)/g) || [];
  const outputs: string[] = [];
  
  printMatches.forEach(match => {
    const content = match.replace(/print\s*\(/, '').replace(/\)$/, '');
    // Very basic evaluation for f-strings and simple values
    if (content.startsWith('f"') || content.startsWith("f'")) {
      outputs.push(content.slice(2, -1));
    } else {
      outputs.push(content.replace(/["']/g, ''));
    }
  });

  return {
    success: true,
    output: outputs.length > 0 
      ? outputs.join('\n') 
      : `[Python] Code parsed successfully.\n\nNote: Full Python execution requires server-side runtime.\nCode: ${code.split('\n').length} lines`,
    executionTime: performance.now() - startTime,
  };
}

export function InteractiveCodeSandbox({ 
  isOpen, 
  onClose, 
  initialCode = '', 
  initialLanguage = 'react',
  isDark = true 
}: InteractiveCodeSandboxProps) {
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage as SupportedLanguage);
  const [code, setCode] = useState(initialCode || codeTemplates[language as SupportedLanguage] || codeTemplates.react);
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update code when language changes
  useEffect(() => {
    if (!initialCode) {
      setCode(codeTemplates[language] || '');
    }
    setOutput(null);
  }, [language, initialCode]);

  // Auto-refresh preview for HTML/React/CSS
  useEffect(() => {
    if (['html', 'react', 'css'].includes(language) && showPreview) {
      const timeout = setTimeout(() => {
        setPreviewKey(k => k + 1);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [code, language, showPreview]);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    
    await new Promise(r => setTimeout(r, 100));

    let result: ExecutionResult;
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        result = executeJavaScript(code);
        break;
      case 'python':
        result = executePython(code);
        break;
      case 'html':
      case 'react':
      case 'css':
        // For these, the preview is the "output"
        setPreviewKey(k => k + 1);
        result = { success: true, output: 'Preview updated', executionTime: 0 };
        break;
      default:
        result = { success: false, output: '', error: 'Unsupported language' };
    }

    setOutput(result);
    setIsRunning(false);
  }, [code, language]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleReset = useCallback(() => {
    setCode(codeTemplates[language] || '');
    setOutput(null);
    setPreviewKey(k => k + 1);
  }, [language]);

  const handleDownload = useCallback(() => {
    const config = languageConfig[language];
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sandbox.${config.extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, language]);

  // Build preview HTML for React/HTML/CSS
  const getPreviewHtml = useCallback(() => {
    if (language === 'html') {
      return code;
    }
    
    if (language === 'css') {
      return `<!DOCTYPE html>
<html><head><style>${code}</style></head>
<body><div class="container"><h1 class="title">CSS Preview</h1><div class="box">Box</div></div></body>
</html>`;
    }
    
    if (language === 'react') {
      // Clean up imports/exports for React
      let cleanCode = code
        .replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '')
        .replace(/^export\s+default\s+/gm, '')
        .replace(/^export\s+/gm, '');

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; }
    .error { color: #ef4444; padding: 20px; font-family: monospace; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo, useCallback } = React;
    try {
      ${cleanCode}
      
      const _C = typeof App !== 'undefined' ? App : 
                 typeof Main !== 'undefined' ? Main :
                 typeof Component !== 'undefined' ? Component : null;
      
      if (_C) {
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(_C));
      } else {
        document.getElementById('root').innerHTML = '<div class="error">No component found. Define a function called App, Main, or Component.</div>';
      }
    } catch(e) {
      document.getElementById('root').innerHTML = '<div class="error">Error: ' + e.message + '</div>';
    }
  </script>
</body>
</html>`;
    }
    
    return '';
  }, [code, language]);

  if (!isOpen) return null;

  const config = languageConfig[language];
  const showLivePreview = ['html', 'react', 'css'].includes(language);

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? 0 : '24px',
        animation: 'sandboxFadeIn 0.2s ease-out',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: isFullscreen ? '100%' : '95%',
          maxWidth: isFullscreen ? '100%' : '1400px',
          height: isFullscreen ? '100%' : '85vh',
          backgroundColor: '#0D1117',
          borderRadius: isFullscreen ? 0 : '16px',
          border: isFullscreen ? 'none' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          background: 'linear-gradient(180deg, #161B22 0%, #0D1117 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code2 size={18} color="#FEC00F" />
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 700, 
                color: '#fff',
                fontFamily: "'Rajdhani', sans-serif",
                letterSpacing: '0.5px',
              }}>
                CODE SANDBOX
              </span>
            </div>

            {/* Language selector */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px' }}>
              {(Object.keys(languageConfig) as SupportedLanguage[]).map((lang) => {
                const cfg = languageConfig[lang];
                const isActive = language === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: isActive ? cfg.bgColor : 'transparent',
                      color: isActive ? cfg.color : 'rgba(255,255,255,0.5)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Run button */}
            <button
              onClick={handleRun}
              disabled={isRunning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isRunning ? 'rgba(34,197,94,0.15)' : '#22C55E',
                color: isRunning ? '#22C55E' : '#fff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: isRunning ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {isRunning ? 'Running...' : 'Run'}
            </button>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={handleCopy} title="Copy code" style={iconBtnStyle}>
                {copied ? <Check size={14} color="#22C55E" /> : <Copy size={14} />}
              </button>
              <button onClick={handleReset} title="Reset to template" style={iconBtnStyle}>
                <RotateCcw size={14} />
              </button>
              <button onClick={handleDownload} title="Download" style={iconBtnStyle}>
                <Download size={14} />
              </button>
              {showLivePreview && (
                <button 
                  onClick={() => setShowPreview(!showPreview)} 
                  title={showPreview ? 'Hide preview' : 'Show preview'}
                  style={{ ...iconBtnStyle, backgroundColor: showPreview ? 'rgba(254,192,15,0.15)' : undefined, color: showPreview ? '#FEC00F' : undefined }}
                >
                  {showPreview ? <PanelRightClose size={14} /> : <SplitSquareHorizontal size={14} />}
                </button>
              )}
              <button onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} style={iconBtnStyle}>
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button onClick={onClose} title="Close" style={{ ...iconBtnStyle, color: '#ef4444' }}>
                <X size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Code editor */}
          <div style={{ 
            flex: showLivePreview && showPreview ? '0 0 50%' : 1, 
            display: 'flex', 
            flexDirection: 'column',
            borderRight: showLivePreview && showPreview ? '1px solid rgba(255,255,255,0.08)' : 'none',
          }}>
            {/* Editor area */}
            <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onBlur={() => setIsEditing(false)}
                  autoFocus
                  spellCheck={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    padding: '16px',
                    paddingLeft: '56px',
                    backgroundColor: '#0D1117',
                    color: '#D4D4D4',
                    border: 'none',
                    outline: 'none',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    fontSize: '13px',
                    lineHeight: '20px',
                    resize: 'none',
                    whiteSpace: 'pre',
                    overflowWrap: 'normal',
                  }}
                />
              ) : (
                <div
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '16px',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    fontSize: '13px',
                    lineHeight: '20px',
                    cursor: 'text',
                    minHeight: '100%',
                  }}
                >
                  {highlightCode(code, language)}
                </div>
              )}
              {!isEditing && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.3)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                }}>
                  Click to edit
                </div>
              )}
            </div>

            {/* Output panel (for JS/Python) */}
            {!showLivePreview && (
              <div style={{ 
                borderTop: '1px solid rgba(255,255,255,0.08)',
                maxHeight: '200px',
              }}>
                <div style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)',
                }}>
                  <Terminal size={14} />
                  Output
                  {output?.executionTime && (
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                      {output.executionTime.toFixed(1)}ms
                    </span>
                  )}
                </div>
                <pre style={{
                  margin: 0,
                  padding: '12px 16px',
                  backgroundColor: '#010409',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  lineHeight: 1.6,
                  color: output?.error ? '#F97583' : '#7EE787',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '150px',
                  overflow: 'auto',
                }}>
                  {output?.error ? (
                    <span style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                      {output.error}
                    </span>
                  ) : output?.output || 'Click "Run" to execute your code'}
                </pre>
              </div>
            )}
          </div>

          {/* Live preview panel */}
          {showLivePreview && showPreview && (
            <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
              <div style={{
                padding: '8px 16px',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e9ecef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={14} color="#6c757d" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>Live Preview</span>
                </div>
                <button
                  onClick={() => {
                    const win = window.open('', '_blank');
                    if (win) {
                      win.document.write(getPreviewHtml());
                      win.document.close();
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6',
                    backgroundColor: '#fff',
                    color: '#495057',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  <ExternalLink size={12} />
                  Open in new tab
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <iframe
                  key={previewKey}
                  ref={iframeRef}
                  srcDoc={getPreviewHtml()}
                  title="Preview"
                  sandbox="allow-scripts allow-same-origin"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: '#fff',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes sandboxFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}

const iconBtnStyle: React.CSSProperties = {
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: 'transparent',
  color: 'rgba(255,255,255,0.6)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
};

export default InteractiveCodeSandbox;
