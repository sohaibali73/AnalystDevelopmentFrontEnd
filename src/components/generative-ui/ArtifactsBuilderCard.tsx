'use client';

/**
 * ArtifactsBuilderCard — Generative UI card for artifacts-builder skill
 * Renders code with live preview for React/JSX/TSX components
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles, Copy, Check, Code2, Eye, Maximize2, Minimize2,
  Play, ExternalLink, Download, AlertTriangle, RefreshCw,
} from 'lucide-react';

interface ArtifactsBuilderCardProps {
  success?: boolean;
  text?: string;
  skill?: string;
  skill_name?: string;
  code?: string;
  language?: string;
  title?: string;
  error?: string;
  execution_time?: number;
  // Also accept raw spread props from invoke_skill
  [key: string]: any;
}

/** Extract code blocks from text response */
function extractCodeBlocks(text: string): Array<{ code: string; language: string; title: string }> {
  const regex = /```(jsx|tsx|react|javascript|js|typescript|ts|html|css|python)\s*\n([\s\S]*?)```/gi;
  const blocks: Array<{ code: string; language: string; title: string }> = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const language = match[1].toLowerCase();
    const code = match[2].trim();
    // Extract component name from code
    const nameMatch = code.match(/(?:export\s+default\s+)?(?:function|const|class)\s+([A-Z][a-zA-Z]*)/);
    const title = nameMatch ? nameMatch[1] : 'Component';
    blocks.push({ code, language, title });
  }
  return blocks;
}

/** Check if code looks like a renderable React component */
function isRenderableReact(code: string, language: string): boolean {
  const reactLangs = ['jsx', 'tsx', 'react', 'javascript', 'js', 'typescript', 'ts'];
  if (!reactLangs.includes(language.toLowerCase())) return false;
  const hasJSX = /<[A-Z][a-zA-Z]*[\s/>]/.test(code) ||
    /<div|<span|<button|<input|<form|<section|<main|<header|<p[ >]|<h[1-6]/.test(code);
  if (!hasJSX) return false;
  const hasComponent = /(?:function|const|let|var|class)\s+[A-Z][a-zA-Z]*/.test(code) ||
    /export\s+default\s+function/.test(code);
  return hasComponent && (/return\s*\(/.test(code) || /return\s*</.test(code));
}

/** Clean code for iframe execution */
function cleanCodeForExecution(code: string): string {
  let c = code.trim();
  c = c.replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  c = c.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');
  c = c.replace(/^import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');
  c = c.replace(/^import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
  // Remove TypeScript types
  c = c.replace(/:\s*(string|number|boolean|any|void|never|null|undefined)(\[\])?\s*(,|\)|\s*=>)/g, '$3');
  c = c.replace(/<(string|number|boolean|any)\[\]>/g, '');
  c = c.replace(/interface\s+\w+\s*\{[^}]*\}\s*/g, '');
  c = c.replace(/type\s+\w+\s*=\s*[^;]+;\s*/g, '');
  // Convert exports
  c = c.replace(/^export\s+default\s+function\s+/gm, 'function ');
  c = c.replace(/^export\s+default\s+class\s+/gm, 'class ');
  c = c.replace(/^export\s+default\s+(?!function|class)/gm, '');
  c = c.replace(/^export\s+/gm, '');
  return c.replace(/^\s*\n/gm, '').trim();
}

/** Build iframe shell */
function buildShell(isDark: boolean): string {
  const bg = isDark ? '#0f0f0f' : '#ffffff';
  const fg = isDark ? '#e2e8f0' : '#1e293b';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:${bg};color:${fg};padding:16px;min-height:100vh}
#root{width:100%;min-height:calc(100vh - 32px)}
.ld{display:flex;align-items:center;justify-content:center;height:200px;color:${isDark ? '#555' : '#aaa'};font-size:14px}
.err{color:#f87171;padding:16px;border:1px solid #dc2626;border-radius:8px;background:rgba(220,38,38,.08);font-family:monospace;white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.5}
</style>
</head>
<body class="${isDark ? 'dark' : ''}">
<div id="root"><div class="ld">Loading preview...</div></div>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js"><\/script>
<script src="https://cdn.tailwindcss.com"><\/script>
<script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.min.js"><\/script>
<script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.min.js"><\/script>
<script>
window.addEventListener('message', function handler(e) {
  if (!e.data || e.data.type !== 'RENDER_CODE') return;
  window.removeEventListener('message', handler);
  var userCode = e.data.code;
  var compName = e.data.componentName;

  function waitAndRender() {
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined' || typeof Babel === 'undefined') {
      return setTimeout(waitAndRender, 100);
    }
    // Expose Recharts
    if (window.Recharts) Object.keys(window.Recharts).forEach(function(k){ window[k] = window.Recharts[k]; });
    // Expose Lucide icons
    if (window.lucideReact) Object.keys(window.lucideReact).forEach(function(k){ window[k] = window.lucideReact[k]; });

    try {
      var transformed = Babel.transform(userCode, { presets: ['react'], filename: 'c.jsx' }).code;

      var args = ['React','ReactDOM','useState','useEffect','useRef','useMemo','useCallback','useContext','useReducer','createContext','Fragment',
        'LineChart','Line','XAxis','YAxis','CartesianGrid','Tooltip','ResponsiveContainer','BarChart','Bar','PieChart','Pie','Cell','Legend','Area','AreaChart'];

      var fallbacks = [React, ReactDOM, React.useState, React.useEffect, React.useRef, React.useMemo, React.useCallback, React.useContext, React.useReducer, React.createContext, React.Fragment];
      var chartNames = ['LineChart','Line','XAxis','YAxis','CartesianGrid','Tooltip','ResponsiveContainer','BarChart','Bar','PieChart','Pie','Cell','Legend','Area','AreaChart'];
      chartNames.forEach(function(n){ fallbacks.push(window[n] || function(){return null}); });

      var returnExpr = 'return typeof '+compName+' !== "undefined" ? '+compName+' : ' +
        '(typeof App !== "undefined" ? App : ' +
        '(typeof Dashboard !== "undefined" ? Dashboard : ' +
        '(typeof Main !== "undefined" ? Main : ' +
        '(typeof Page !== "undefined" ? Page : ' +
        '(typeof Component !== "undefined" ? Component : ' +
        '(typeof Home !== "undefined" ? Home : null))))))';

      var evalFn = new Function(args.join(','), transformed + ';\\n' + returnExpr);
      var Comp = evalFn.apply(null, fallbacks);

      if (Comp && typeof Comp === 'function') {
        var root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(Comp));
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
      } else {
        throw new Error('No renderable component found');
      }
    } catch(err) {
      document.getElementById('root').innerHTML = '<div class="err"><strong>Render Error<\\/strong>\\n\\n' + String(err.message||err).replace(/</g,'&lt;').replace(/>/g,'&gt;') + '<\\/div>';
      window.parent.postMessage({ type: 'PREVIEW_ERROR', error: String(err.message||err) }, '*');
    }
  }
  waitAndRender();
});
window.parent.postMessage({ type: 'SHELL_READY' }, '*');
<\/script>
</body>
</html>`;
}

function LivePreview({ code, title, language, isDark }: { code: string; title: string; language: string; isDark: boolean }) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeSent = useRef(false);

  const shell = useMemo(() => buildShell(isDark), [isDark]);
  const cleaned = useMemo(() => cleanCodeForExecution(code), [code]);

  useEffect(() => {
    codeSent.current = false;
    setLoading(true);
    setError(null);

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'SHELL_READY' && !codeSent.current) {
        codeSent.current = true;
        iframeRef.current?.contentWindow?.postMessage({
          type: 'RENDER_CODE',
          code: cleaned,
          componentName: title,
        }, '*');
      } else if (e.data?.type === 'PREVIEW_READY') {
        setLoading(false);
        setError(null);
      } else if (e.data?.type === 'PREVIEW_ERROR') {
        setLoading(false);
        setError(e.data.error || 'Unknown error');
      }
    };

    window.addEventListener('message', handler);
    const fallback = setTimeout(() => setLoading(false), 10000);
    return () => {
      window.removeEventListener('message', handler);
      clearTimeout(fallback);
    };
  }, [cleaned, title, retryKey]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = () => {
    codeSent.current = false;
    setRetryKey(k => k + 1);
  };

  const handleOpenInNewTab = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js"><\/script>
<script src="https://cdn.tailwindcss.com"><\/script>
<script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.min.js"><\/script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:${isDark ? '#0f0f0f' : '#fff'};color:${isDark ? '#e2e8f0' : '#1e293b'};padding:16px}</style>
</head>
<body>
<div id="root"></div>
<script type="text/babel">
if(window.Recharts)Object.keys(window.Recharts).forEach(k=>window[k]=window.Recharts[k]);
${cleaned}
const _C = typeof ${title} !== 'undefined' ? ${title} : (typeof App !== 'undefined' ? App : null);
if(_C)ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(_C));
<\/script>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  };

  const outerStyle: React.CSSProperties = fullscreen
    ? { position: 'fixed', inset: 0, zIndex: 9999, background: isDark ? '#0a0a14' : '#fff', display: 'flex', flexDirection: 'column' }
    : { borderRadius: 10, border: '1px solid rgba(254,192,15,0.25)', overflow: 'hidden', marginTop: 12 };

  return (
    <div style={outerStyle}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        background: isDark ? 'linear-gradient(135deg, rgba(254,192,15,0.08) 0%, rgba(254,192,15,0.04) 100%)' : '#fef9e7',
        borderBottom: '1px solid rgba(254,192,15,0.2)',
      }}>
        <Play size={14} color="#FEC00F" fill="#FEC00F" />
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
          color: '#FEC00F', padding: '2px 6px', borderRadius: 4, background: 'rgba(254,192,15,0.15)',
        }}>LIVE</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: isDark ? '#fff' : '#333' }}>{title}</span>

        {/* Tab toggle */}
        <div style={{ display: 'flex', borderRadius: 6, padding: 2, background: isDark ? '#1a1a2e' : '#e2e8f0' }}>
          <button onClick={() => setTab('preview')} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
            border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600,
            background: tab === 'preview' ? '#FEC00F' : 'transparent',
            color: tab === 'preview' ? '#000' : isDark ? 'rgba(255,255,255,0.5)' : '#666',
          }}><Eye size={12} /> Preview</button>
          <button onClick={() => setTab('code')} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
            border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600,
            background: tab === 'code' ? '#FEC00F' : 'transparent',
            color: tab === 'code' ? '#000' : isDark ? 'rgba(255,255,255,0.5)' : '#666',
          }}><Code2 size={12} /> Code</button>
        </div>

        {error && (
          <button onClick={handleRetry} title="Retry" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 5, cursor: 'pointer',
            border: '1px solid rgba(254,192,15,0.3)', background: 'rgba(254,192,15,0.1)',
          }}>
            <RefreshCw size={12} color="#FEC00F" />
          </button>
        )}

        <button onClick={handleCopy} title="Copy code" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 5, cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.1)', background: 'none',
        }}>
          {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} color={isDark ? 'rgba(255,255,255,0.5)' : '#666'} />}
        </button>

        <button onClick={handleOpenInNewTab} title="Open in new tab" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 5, cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.1)', background: 'none',
        }}>
          <ExternalLink size={12} color={isDark ? 'rgba(255,255,255,0.5)' : '#666'} />
        </button>

        <button onClick={() => setFullscreen(f => !f)} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 5, cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.1)', background: 'none',
        }}>
          {fullscreen ? <Minimize2 size={12} color={isDark ? 'rgba(255,255,255,0.5)' : '#666'} /> : <Maximize2 size={12} color={isDark ? 'rgba(255,255,255,0.5)' : '#666'} />}
        </button>
      </div>

      {/* Body */}
      <div style={{ position: 'relative', height: fullscreen ? 'calc(100vh - 52px)' : 420, overflow: 'hidden' }}>
        {/* Loading overlay */}
        {tab === 'preview' && loading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isDark ? '#0a0a14' : '#fff',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: isDark ? '#555' : '#aaa' }}>
              <div style={{
                width: 28, height: 28, border: '3px solid rgba(254,192,15,0.2)',
                borderTopColor: '#FEC00F', borderRadius: '50%', animation: '_ab_spin .8s linear infinite',
              }} />
              <span style={{ fontSize: 12 }}>Compiling component...</span>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {tab === 'preview' && error && !loading && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3,
            padding: '10px 14px', background: 'rgba(220,38,38,.12)', borderTop: '1px solid #dc2626',
            color: '#f87171', fontSize: 12, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertTriangle size={14} />
            <span style={{ flex: 1 }}>{error.length > 100 ? error.slice(0, 100) + '...' : error}</span>
            <button onClick={handleRetry} style={{
              padding: '4px 10px', borderRadius: 4, border: '1px solid #dc2626',
              background: 'rgba(220,38,38,.15)', color: '#f87171', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        )}

        {/* Iframe preview */}
        <iframe
          key={retryKey}
          ref={iframeRef}
          title={`Preview: ${title}`}
          srcDoc={shell}
          sandbox="allow-scripts"
          style={{
            width: '100%', height: '100%', border: 'none',
            display: tab === 'preview' ? 'block' : 'none',
            background: isDark ? '#0f0f0f' : '#fff',
          }}
        />

        {/* Code view */}
        {tab === 'code' && (
          <pre style={{
            width: '100%', height: '100%', overflow: 'auto', padding: 16, margin: 0,
            fontSize: 12, lineHeight: 1.6, fontFamily: "'Fira Code','Consolas',monospace",
            background: isDark ? '#0a0a14' : '#f8fafc', color: isDark ? '#c9d1d9' : '#24292f',
            whiteSpace: 'pre', overflowX: 'auto',
          }}>
            <code>{code}</code>
          </pre>
        )}
      </div>

      <style>{`@keyframes _ab_spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export function ArtifactsBuilderCard(props: ArtifactsBuilderCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Determine dark mode
  const isDark = typeof window !== 'undefined' 
    ? document.documentElement.classList.contains('dark') || 
      window.matchMedia('(prefers-color-scheme: dark)').matches
    : true;

  // Handle error state
  if (!props.success && props.error) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: '12px',
        color: '#ef4444',
        fontSize: '13px',
        marginTop: '8px',
        maxWidth: '800px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <AlertTriangle size={16} />
          <strong>Artifacts Builder Error</strong>
        </div>
        {props.error}
      </div>
    );
  }

  // Extract code blocks from text
  const codeBlocks = useMemo(() => {
    if (props.code) {
      return [{
        code: props.code,
        language: props.language || 'jsx',
        title: props.title || 'Component',
      }];
    }
    if (props.text) {
      return extractCodeBlocks(props.text);
    }
    return [];
  }, [props.code, props.language, props.title, props.text]);

  // Find renderable React blocks
  const renderableBlocks = codeBlocks.filter(b => isRenderableReact(b.code, b.language));
  const otherBlocks = codeBlocks.filter(b => !isRenderableReact(b.code, b.language));

  // Strip code blocks from text for display
  const textWithoutCode = props.text
    ? props.text.replace(/```(jsx|tsx|react|javascript|js|typescript|ts|html|css|python)\s*\n[\s\S]*?```/gi, '').trim()
    : '';

  const handleCopy = () => {
    const allCode = codeBlocks.map(b => b.code).join('\n\n');
    navigator.clipboard.writeText(allCode || props.text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(254,192,15,0.3)',
      maxWidth: '850px',
      marginTop: '8px',
      background: isDark 
        ? 'linear-gradient(135deg, rgba(254,192,15,0.06) 0%, rgba(254,192,15,0.02) 100%)'
        : 'linear-gradient(135deg, #fffdf5 0%, #fff 100%)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: isDark 
          ? 'linear-gradient(135deg, rgba(254,192,15,0.12) 0%, rgba(254,192,15,0.06) 100%)'
          : 'linear-gradient(135deg, #fef9e7 0%, #fffdf5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(254,192,15,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#FEC00F" />
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#FEC00F' }}>
            Artifacts Builder
          </span>
          {renderableBlocks.length > 0 && (
            <span style={{
              fontSize: '9px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(34,197,94,0.15)',
              color: '#22c55e',
              letterSpacing: '0.5px',
            }}>
              LIVE PREVIEW
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {props.execution_time && (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              {props.execution_time.toFixed(1)}s
            </span>
          )}
          <button
            onClick={handleCopy}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px',
              color: isDark ? 'rgba(255,255,255,0.5)' : '#666', fontSize: '11px', borderRadius: '4px',
            }}
          >
            {copied ? <><Check size={12} color="#22c55e" /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: renderableBlocks.length === 0 ? '16px' : '0 16px 16px 16px' }}>
        {/* Text content (without code blocks) */}
        {textWithoutCode && (
          <div style={{
            fontSize: '13px',
            color: isDark ? 'rgba(255,255,255,0.85)' : '#333',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            marginBottom: renderableBlocks.length > 0 ? '12px' : 0,
            padding: renderableBlocks.length > 0 ? '12px 0 0 0' : 0,
          }}>
            {textWithoutCode}
          </div>
        )}

        {/* Live React previews */}
        {renderableBlocks.map((block, i) => (
          <LivePreview
            key={`${block.title}-${i}`}
            code={block.code}
            title={block.title}
            language={block.language}
            isDark={isDark}
          />
        ))}

        {/* Non-React code blocks (just show as code) */}
        {otherBlocks.map((block, i) => (
          <div key={`other-${i}`} style={{
            marginTop: '12px', borderRadius: '8px', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{
              padding: '8px 12px',
              background: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0',
              fontSize: '11px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.6)' : '#666',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Code2 size={12} />
              {block.language.toUpperCase()}
            </div>
            <pre style={{
              padding: '12px', margin: 0, fontSize: '12px', lineHeight: 1.5,
              background: isDark ? '#0a0a14' : '#f8fafc',
              color: isDark ? '#c9d1d9' : '#24292f',
              overflow: 'auto', maxHeight: '300px',
            }}>
              <code>{block.code}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArtifactsBuilderCard;
