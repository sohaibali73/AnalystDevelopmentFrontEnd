'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Eye, Code2, Copy, Check, Maximize2, Minimize2, Play, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InlineReactPreviewProps {
  text: string;
  isDark?: boolean;
  className?: string;
}

interface DetectedCodeBlock {
  code: string;
  language: string;
  title: string;
  id: string;
}

/**
 * Check if a code block looks like a renderable React component
 */
function isRenderableReact(code: string, language: string): boolean {
  const reactLangs = ['jsx', 'tsx', 'react', 'javascript', 'js'];
  if (!reactLangs.includes(language.toLowerCase())) return false;

  const trimmedCode = code.trim();
  const lines = trimmedCode.split('\n');

  // Need at least a few lines of code
  if (lines.length < 3) return false;

  // Check for JSX elements
  const hasJSX =
    /<[A-Z][a-zA-Z]*[\s/>]/.test(trimmedCode) ||
    /<(?:div|span|button|input|form|section|main|header|p\s|p>|h[1-6]|ul|ol|li|table|tr|td|th|a\s|img\s|nav|footer|article|aside)/.test(trimmedCode);

  if (!hasJSX) return false;

  // Check for component definition
  const hasComponent =
    /(?:function|const|let|var|class)\s+[A-Z][a-zA-Z]*/.test(trimmedCode) ||
    /export\s+default\s+function/.test(trimmedCode) ||
    /=>\s*\(\s*</.test(trimmedCode);

  if (!hasComponent) return false;

  // Must have a return statement with JSX
  return /\breturn\s*\(/.test(trimmedCode) || /\breturn\s*</.test(trimmedCode);
}

/**
 * Extract component name from code
 */
function extractComponentName(code: string): string {
  const patterns = [
    /export\s+default\s+function\s+([A-Z][a-zA-Z]*)/,
    /export\s+default\s+([A-Z][a-zA-Z]*)/,
    /function\s+([A-Z][a-zA-Z]*)/,
    /const\s+([A-Z][a-zA-Z]*)\s*=/,
    /class\s+([A-Z][a-zA-Z]*)/,
  ];

  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match) return match[1];
  }

  return 'Component';
}

/**
 * Extract React code blocks from markdown text
 */
function extractReactCodeBlocks(text: string): DetectedCodeBlock[] {
  const regex = /```(jsx|tsx|react|javascript|js)\s*\n([\s\S]*?)```/g;
  const blocks: DetectedCodeBlock[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const language = match[1];
    const code = match[2].trim();

    if (isRenderableReact(code, language)) {
      blocks.push({
        code,
        language,
        title: extractComponentName(code),
        id: `block-${blocks.length}-${Date.now()}`,
      });
    }
  }

  return blocks;
}

/**
 * Strip renderable React code blocks from markdown so they don't render as code
 */
export function stripReactCodeBlocks(text: string): string {
  return text.replace(/```(jsx|tsx|react|javascript|js)\s*\n([\s\S]*?)```/g, (full, lang, code) => {
    if (isRenderableReact(code.trim(), lang)) {
      return '';
    }
    return full;
  });
}

/**
 * Clean code for iframe: remove imports, TS types, export keywords
 */
function cleanCodeForPreview(code: string): string {
  let cleaned = code.trim();

  // Remove import statements
  cleaned = cleaned.replace(/^import\s+.*?from\s*['"][^'"]*['"];?\s*$/gm, '');
  cleaned = cleaned.replace(/^import\s*['"][^'"]*['"];?\s*$/gm, '');
  cleaned = cleaned.replace(/^import\s*\([^)]*\)\s*;?\s*$/gm, '');

  // Remove TypeScript type annotations
  cleaned = cleaned.replace(/:\s*(string|number|boolean|any|void|never|null|undefined|object|unknown)(\[\])?(?=[,\)\s=>;])/g, '');
  cleaned = cleaned.replace(/:\s*ReadonlyArray<[^>]+>/g, '');
  cleaned = cleaned.replace(/:\s*Array<[^>]+>/g, '');
  cleaned = cleaned.replace(/:\s*\{[^}]+\}/g, '');
  cleaned = cleaned.replace(/<[A-Z][a-zA-Z]*\s*>(?=\s*[,\)\s=>;])/g, '');
  cleaned = cleaned.replace(/<[A-Z][a-zA-Z]*<[^>]+>>/g, '');

  // Remove interface and type definitions
  cleaned = cleaned.replace(/interface\s+\w+(?:\s*<[^>]+>)?\s*\{[^}]*\}\s*/g, '');
  cleaned = cleaned.replace(/type\s+\w+(?:\s*<[^>]+>)?\s*=\s*[^;]+;\s*/g, '');

  // Remove export keywords but keep the declarations
  cleaned = cleaned.replace(/^export\s+default\s+function\s+/gm, 'function ');
  cleaned = cleaned.replace(/^export\s+default\s+class\s+/gm, 'class ');
  cleaned = cleaned.replace(/^export\s+default\s+/gm, '');
  cleaned = cleaned.replace(/^export\s+(const|let|var|function|class)\s+/gm, '$1 ');
  cleaned = cleaned.replace(/^export\s+\{[^}]*\}\s*;?\s*$/gm, '');

  // Remove empty lines at start
  cleaned = cleaned.replace(/^\s*\n/, '');

  return cleaned.trim();
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `preview-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
}

/**
 * Build the static srcdoc shell HTML
 */
function buildShellHtml(isDark: boolean, instanceId: string): string {
  const bg = isDark ? '#0a0a0b' : '#ffffff';
  const fg = isDark ? '#e4e4e7' : '#18181b';
  const muted = isDark ? '#71717a' : '#a1a1aa';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: ${bg};
  color: ${fg};
  min-height: 100%;
}
#root { width: 100%; min-height: 100%; padding: 16px; }
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${muted};
  font-size: 14px;
  gap: 8px;
}
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid ${muted};
  border-top-color: #FEC00F;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.error {
  padding: 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #f87171;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
</head>
<body>
<div id="root">
  <div class="loading">
    <div class="spinner"></div>
    <span>Initializing preview...</span>
  </div>
</div>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.min.js"></script>
<script>
(function() {
  'use strict';

  var instanceId = '${instanceId}';

  // Wait for all dependencies to load
  function waitForDeps(callback, attempts) {
    attempts = attempts || 0;
    if (attempts > 50) {
      showError('Failed to load dependencies. Please refresh.');
      return;
    }
    if (typeof React !== 'undefined' &&
        typeof ReactDOM !== 'undefined' &&
        typeof Babel !== 'undefined' &&
        typeof tailwind !== 'undefined') {
      callback();
    } else {
      setTimeout(function() { waitForDeps(callback, attempts + 1); }, 100);
    }
  }

  function showError(message) {
    var root = document.getElementById('root');
    root.innerHTML = '<div class="error"><strong>Error:</strong>\\n\\n' +
      message.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
  }

  function renderComponent(code, componentName) {
    try {
      // Configure Tailwind for dark mode if needed
      if (typeof tailwind !== 'undefined') {
        tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {}
          }
        };
      }

      // Expose Recharts components globally
      if (window.Recharts) {
        Object.keys(window.Recharts).forEach(function(key) {
          window[key] = window.Recharts[key];
        });
      }

      // Transform JSX to JS
      var transformed = Babel.transform(code, {
        presets: ['react'],
        filename: 'component.jsx'
      }).code;

      // Create sandbox with React APIs
      var sandbox = {
        React: React,
        ReactDOM: ReactDOM,
        useState: React.useState,
        useEffect: React.useEffect,
        useRef: React.useRef,
        useMemo: React.useMemo,
        useCallback: React.useCallback,
        useContext: React.useContext,
        useReducer: React.useReducer,
        createContext: React.createContext,
        Fragment: React.Fragment,
        memo: React.memo,
        forwardRef: React.forwardRef,
        useImperativeHandle: React.useImperativeHandle,
        useLayoutEffect: React.useLayoutEffect,
        // Recharts
        LineChart: window.LineChart,
        Line: window.Line,
        XAxis: window.XAxis,
        YAxis: window.YAxis,
        CartesianGrid: window.CartesianGrid,
        Tooltip: window.Tooltip,
        ResponsiveContainer: window.ResponsiveContainer,
        BarChart: window.BarChart,
        Bar: window.Bar,
        PieChart: window.PieChart,
        Pie: window.Pie,
        Cell: window.Cell,
        Legend: window.Legend,
        Area: window.Area,
        AreaChart: window.AreaChart,
        RadarChart: window.RadarChart,
        Radar: window.Radar,
        PolarGrid: window.PolarGrid,
        PolarAngleAxis: window.PolarAngleAxis,
        PolarRadiusAxis: window.PolarRadiusAxis,
        ComposedChart: window.ComposedChart,
        Scatter: window.Scatter,
        ScatterChart: window.ScatterChart
      };

      var argNames = Object.keys(sandbox);
      var argValues = argNames.map(function(k) { return sandbox[k]; });

      // Try to find the component
      var returnStatement = '\\nreturn typeof ' + componentName + ' !== "undefined" ? ' + componentName + ' : ' +
        '(typeof App !== "undefined" ? App : ' +
        '(typeof Dashboard !== "undefined" ? Dashboard : ' +
        '(typeof Main !== "undefined" ? Main : ' +
        '(typeof Page !== "undefined" ? Page : ' +
        '(typeof Home !== "undefined" ? Home : ' +
        '(typeof Component !== "undefined" ? Component : null))))));';

      var fn = new Function(argNames.join(','), transformed + returnStatement);
      var Component = fn.apply(null, argValues);

      if (Component && typeof Component === 'function') {
        var root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(Component));
        window.parent.postMessage({ type: 'PREVIEW_READY', instanceId: instanceId }, '*');
      } else {
        throw new Error('No valid React component found. Make sure your component is exported.');
      }
    } catch (err) {
      showError(err.message || String(err));
      window.parent.postMessage({
        type: 'PREVIEW_ERROR',
        instanceId: instanceId,
        error: err.message || String(err)
      }, '*');
    }
  }

  // Listen for code from parent
  window.addEventListener('message', function(event) {
    if (!event.data || event.data.instanceId !== instanceId) return;

    if (event.data.type === 'RENDER_CODE') {
      waitForDeps(function() {
        renderComponent(event.data.code, event.data.componentName);
      });
    }
  });

  // Signal ready
  window.parent.postMessage({ type: 'SHELL_READY', instanceId: instanceId }, '*');
})();
</script>
</body>
</html>`;
}

/**
 * Preview Card Component
 */
function PreviewCard({ block, isDark }: { block: DetectedCodeBlock; isDark: boolean }) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [previewState, setPreviewState] = useState<{
    loading: boolean;
    error: string | null;
    version: number;
  }>({
    loading: true,
    error: null,
    version: 0,
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeSentRef = useRef(false);

  // Instance ID derived from block id and version
  const instanceId = useMemo(
    () => `${block.id}-v${previewState.version}`,
    [block.id, previewState.version]
  );

  const shellHtml = useMemo(
    () => buildShellHtml(isDark, instanceId),
    [isDark, instanceId]
  );

  const cleanedCode = useMemo(() => cleanCodeForPreview(block.code), [block.code]);

  // Handle iframe communication
  useEffect(() => {
    codeSentRef.current = false;

    const handleMessage = (event: MessageEvent) => {
      const { type, instanceId: msgInstanceId, error: errorMsg } = event.data || {};

      // Only handle messages for current instance
      if (msgInstanceId && msgInstanceId !== instanceId) return;

      if (type === 'SHELL_READY' && !codeSentRef.current) {
        codeSentRef.current = true;
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: 'RENDER_CODE',
            code: cleanedCode,
            componentName: block.title,
            instanceId: instanceId,
          },
          '*'
        );
      } else if (type === 'PREVIEW_READY') {
        setPreviewState((prev) => ({ ...prev, loading: false, error: null }));
      } else if (type === 'PREVIEW_ERROR') {
        setPreviewState((prev) => ({ ...prev, loading: false, error: errorMsg || 'Unknown error' }));
      }
    };

    window.addEventListener('message', handleMessage);

    const timeout = setTimeout(() => {
      setPreviewState((prev) => {
        if (prev.loading) {
          return { ...prev, loading: false, error: 'Preview timed out. Click refresh to try again.' };
        }
        return prev;
      });
    }, 15000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, [cleanedCode, block.title, instanceId]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(block.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  }, [block.code]);

  const handleRefresh = useCallback(() => {
    // Increment version to trigger a full reset
    codeSentRef.current = false;
    setPreviewState((prev) => ({
      loading: true,
      error: null,
      version: prev.version + 1,
    }));
  }, []);

  const handleExitFullscreen = useCallback(() => {
    setFullscreen(false);
  }, []);

  // Handle escape key for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreen]);

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200',
        fullscreen && 'fixed inset-0 z-50 rounded-none'
      )}
      style={fullscreen ? { background: isDark ? '#0a0a0b' : '#ffffff' } : undefined}
    >
      {/* Header */}
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-amber-500" fill="currentColor" />
          <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20">
            Live
          </Badge>
        </div>
        <span className="text-sm font-semibold flex-1">{block.title}</span>

        {/* Tab Toggle */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'code')}>
          <TabsList className="h-8">
            <TabsTrigger value="preview" className="text-xs px-3 h-7">
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="text-xs px-3 h-7">
              <Code2 className="h-3 w-3 mr-1" />
              Code
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            title="Refresh preview"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setFullscreen((f) => !f)}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-0 relative">
        <div
          className={cn(
            'relative',
            fullscreen ? 'h-[calc(100vh-57px)]' : 'h-[480px]'
          )}
        >
          {/* Loading Overlay */}
          {activeTab === 'preview' && previewState.loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="h-6 w-6 border-2 border-muted-foreground/30 border-t-amber-500 rounded-full animate-spin" />
                <span className="text-sm">Compiling preview...</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {activeTab === 'preview' && previewState.error && !previewState.loading && (
            <div className="absolute bottom-0 left-0 right-0 z-20 p-3 bg-destructive/10 border-t border-destructive/30">
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="font-mono text-xs break-all">{previewState.error}</span>
              </div>
            </div>
          )}

          {/* Fullscreen Close Button */}
          {fullscreen && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 z-30"
              onClick={handleExitFullscreen}
            >
              <Minimize2 className="h-4 w-4 mr-1" />
              Exit Fullscreen
            </Button>
          )}

          {/* Preview iframe */}
          <iframe
            key={instanceId}
            ref={iframeRef}
            title={`Preview: ${block.title}`}
            srcDoc={shellHtml}
            sandbox="allow-scripts"
            className={cn(
              'w-full h-full border-0',
              activeTab !== 'preview' && 'hidden'
            )}
          />

          {/* Code View */}
          {activeTab === 'code' && (
            <div className="absolute inset-0 overflow-auto bg-zinc-950 dark:bg-zinc-950">
              <pre className="p-4 text-sm leading-relaxed font-mono text-zinc-300 whitespace-pre">
                <code>{block.code}</code>
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main InlineReactPreview Component
 */
export function InlineReactPreview({ text, isDark = false, className }: InlineReactPreviewProps) {
  const blocks = useMemo(() => extractReactCodeBlocks(text), [text]);

  if (blocks.length === 0) return null;

  return (
    <div className={cn('w-full space-y-4', className)}>
      {blocks.map((block, index) => (
        <PreviewCard
          key={`${block.title}-${index}`}
          block={block}
          isDark={isDark}
        />
      ))}
    </div>
  );
}

export default InlineReactPreview;
