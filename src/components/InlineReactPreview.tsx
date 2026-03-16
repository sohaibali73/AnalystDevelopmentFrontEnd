'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Eye, Code2, Copy, Check, Maximize2, Minimize2, Play, AlertTriangle } from 'lucide-react';

interface InlineReactPreviewProps {
  text: string;
  isDark: boolean;
}

interface DetectedCodeBlock {
  code: string;
  language: string;
  title: string;
}

/** Check if a code block looks like a renderable React component */
function isRenderableReact(code: string, language: string): boolean {
  const reactLangs = ['jsx', 'tsx', 'react', 'javascript', 'js'];
  if (!reactLangs.includes(language.toLowerCase())) return false;
  const lines = code.trim().split('\n');
  if (lines.length < 5) return false;
  const hasJSX = /<[A-Z][a-zA-Z]*[\s/>]/.test(code) ||
    /<div|<span|<button|<input|<form|<section|<main|<header|<p[ >]|<h[1-6]/.test(code);
  if (!hasJSX) return false;
  const hasComponent = /(?:function|const|let|var|class)\s+[A-Z][a-zA-Z]*/.test(code) ||
    /export\s+default\s+function/.test(code);
  if (!hasComponent) return false;
  return /return\s*\(/.test(code) || /return\s*</.test(code);
}

function extractComponentName(code: string): string {
  const m = code.match(/(?:export\s+default\s+)?(?:function|const|class)\s+([A-Z][a-zA-Z]*)/);
  return m ? m[1] : 'Component';
}

function extractReactCodeBlocks(text: string): DetectedCodeBlock[] {
  const regex = /```(jsx|tsx|react|javascript|js)\s*\n([\s\S]*?)```/g;
  const blocks: DetectedCodeBlock[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const language = match[1];
    const code = match[2].trim();
    if (isRenderableReact(code, language)) {
      blocks.push({ code, language, title: extractComponentName(code) });
    }
  }
  return blocks;
}

/** Strip renderable React code blocks from markdown so they don't render as code */
export function stripReactCodeBlocks(text: string): string {
  return text.replace(/```(jsx|tsx|react|javascript|js)\s*\n([\s\S]*?)```/g, (full, lang, code) => {
    if (isRenderableReact(code.trim(), lang)) {
      return ''; // remove entire fenced block
    }
    return full; // keep non-react code blocks
  });
}

/** Clean code for iframe: remove imports, TS types, export keywords */
function cleanCode(code: string): string {
  let c = code.trim();
  c = c.replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  c = c.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');
  c = c.replace(/^import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');
  c = c.replace(/^import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
  c = c.replace(/:\s*(string|number|boolean|any|void|never|null|undefined)(\[\])?\s*(,|\)|\s*=>)/g, '$3');
  c = c.replace(/<(string|number|boolean|any)\[\]>/g, '');
  c = c.replace(/interface\s+\w+\s*\{[^}]*\}\s*/g, '');
  c = c.replace(/type\s+\w+\s*=\s*[^;]+;\s*/g, '');
  c = c.replace(/^export\s+default\s+function\s+/gm, 'function ');
  c = c.replace(/^export\s+default\s+class\s+/gm, 'class ');
  c = c.replace(/^export\s+default\s+(?!function|class)/gm, '');
  c = c.replace(/^export\s+/gm, '');
  return c.replace(/^\s*\n/gm, '').trim();
}

/**
 * Build the static srcdoc shell. Code is sent via postMessage after load.
 * This avoids any template literal escaping issues.
 */
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

    try {
      var transformed = Babel.transform(userCode, { presets: ['react'], filename: 'c.jsx' }).code;

      // Build a function that exposes React API + chart components
      var args = ['React','ReactDOM','useState','useEffect','useRef','useMemo','useCallback','useContext','useReducer','createContext','Fragment',
        'LineChart','Line','XAxis','YAxis','CartesianGrid','Tooltip','ResponsiveContainer','BarChart','Bar','PieChart','Pie','Cell','Legend','Area','AreaChart','RadarChart','Radar','PolarGrid','PolarAngleAxis','PolarRadiusAxis','ComposedChart','Scatter','ScatterChart','Treemap','Funnel','FunnelChart','RadialBar','RadialBarChart'];

      var fallbacks = [React, ReactDOM, React.useState, React.useEffect, React.useRef, React.useMemo, React.useCallback, React.useContext, React.useReducer, React.createContext, React.Fragment];
      var chartNames = ['LineChart','Line','XAxis','YAxis','CartesianGrid','Tooltip','ResponsiveContainer','BarChart','Bar','PieChart','Pie','Cell','Legend','Area','AreaChart','RadarChart','Radar','PolarGrid','PolarAngleAxis','PolarRadiusAxis','ComposedChart','Scatter','ScatterChart','Treemap','Funnel','FunnelChart','RadialBar','RadialBarChart'];
      chartNames.forEach(function(n){ fallbacks.push(window[n] || function(){return null}); });

      // Try to return the named component, fall back to common names
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
// Signal parent we are ready to receive code
window.parent.postMessage({ type: 'SHELL_READY' }, '*');
<\/script>
</body>
</html>`;
}


function PreviewCard({ block, isDark }: { block: DetectedCodeBlock; isDark: boolean }) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeSent = useRef(false);

  const shell = useMemo(() => buildShell(isDark), [isDark]);
  const cleaned = useMemo(() => cleanCode(block.code), [block.code]);

  // Send code to iframe once shell signals ready
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
          componentName: block.title,
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
  }, [cleaned, block.title]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(block.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  }, [block.code]);

  const accent = '#FEC00F';
  const bg = isDark ? '#111118' : '#f9fafb';
  const headerBg = isDark ? '#0d0d14' : '#f1f5f9';
  const border = isDark ? '#23233a' : '#e2e8f0';
  const text = isDark ? '#e2e8f0' : '#1e293b';
  const muted = isDark ? '#64748b' : '#94a3b8';

  const outerStyle: React.CSSProperties = fullscreen
    ? { position: 'fixed', inset: 0, zIndex: 9999, background: bg, display: 'flex', flexDirection: 'column' }
    : { marginTop: 12, borderRadius: 10, border: `1px solid ${border}`, overflow: 'hidden', background: bg };

  return (
    <div style={outerStyle}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', background: headerBg,
        borderBottom: `1px solid ${border}`, minHeight: 40,
      }}>
        <Play size={14} color={accent} fill={accent} />
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
          color: accent, padding: '2px 6px', borderRadius: 4, background: `${accent}18`,
        }}>Live</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: text }}>{block.title}</span>

        {/* Tab toggle */}
        <div style={{ display: 'flex', borderRadius: 6, padding: 2, background: isDark ? '#1a1a2e' : '#e2e8f0' }}>
          <button onClick={() => setTab('preview')} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
            border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600,
            background: tab === 'preview' ? accent : 'transparent',
            color: tab === 'preview' ? '#000' : muted,
          }}><Eye size={12} /> Preview</button>
          <button onClick={() => setTab('code')} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
            border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600,
            background: tab === 'code' ? accent : 'transparent',
            color: tab === 'code' ? '#000' : muted,
          }}><Code2 size={12} /> Code</button>
        </div>

        <button onClick={handleCopy} title="Copy code" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 5, cursor: 'pointer',
          border: `1px solid ${border}`, background: 'none',
        }}>
          {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} color={muted} />}
        </button>
        <button onClick={() => setFullscreen(f => !f)} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 5, cursor: 'pointer',
          border: `1px solid ${border}`, background: 'none',
        }}>
          {fullscreen ? <Minimize2 size={12} color={muted} /> : <Maximize2 size={12} color={muted} />}
        </button>
      </div>

      {/* Body */}
      <div style={{ position: 'relative', height: fullscreen ? 'calc(100vh - 48px)' : 480, overflow: 'hidden' }}>
        {/* Loading overlay */}
        {tab === 'preview' && loading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: muted }}>
              <div style={{
                width: 24, height: 24, border: `3px solid ${border}`, borderTopColor: accent,
                borderRadius: '50%', animation: '_spin .8s linear infinite',
              }} />
              <span style={{ fontSize: 12 }}>Compiling...</span>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {tab === 'preview' && error && !loading && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3,
            padding: '8px 12px', background: 'rgba(220,38,38,.1)', borderTop: '1px solid #dc2626',
            color: '#f87171', fontSize: 12, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <AlertTriangle size={14} />
            {error.length > 120 ? error.slice(0, 120) + '...' : error}
          </div>
        )}

        {/* iframe - always mounted for postMessage, hidden when showing code */}
        <iframe
          ref={iframeRef}
          title={`Preview: ${block.title}`}
          srcDoc={shell}
          sandbox="allow-scripts"
          style={{
            width: '100%', height: '100%', border: 'none',
            display: tab === 'preview' ? 'block' : 'none',
            background: isDark ? '#0f0f0f' : '#fff',
          }}
        />

        {tab === 'code' && (
          <pre style={{
            width: '100%', height: '100%', overflow: 'auto', padding: 16, margin: 0,
            fontSize: 12, lineHeight: 1.6, fontFamily: "'Fira Code','Consolas',monospace",
            background: isDark ? '#0a0a14' : '#f8fafc', color: isDark ? '#c9d1d9' : '#24292f',
            whiteSpace: 'pre', overflowX: 'auto',
          }}>
            <code>{block.code}</code>
          </pre>
        )}
      </div>

      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}


export function InlineReactPreview({ text, isDark }: InlineReactPreviewProps) {
  const blocks = useMemo(() => extractReactCodeBlocks(text), [text]);
  if (blocks.length === 0) return null;
  return (
    <div style={{ width: '100%' }}>
      {blocks.map((block, i) => (
        <PreviewCard key={`${block.title}-${i}`} block={block} isDark={isDark} />
      ))}
    </div>
  );
}

export default InlineReactPreview;
