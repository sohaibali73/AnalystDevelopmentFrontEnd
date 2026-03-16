/**
 * ArtifactRenderer - Main component for rendering visual artifacts in chat
 * Supports: React, HTML, SVG, Mermaid diagrams, and code
 */

import React, { useState } from 'react';
import { 
  Code, 
  Eye, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Check, 
  Download,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { Artifact, ArtifactType } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { MermaidArtifact } from './MermaidArtifact';
import { ReactArtifact } from './ReactArtifact';
import { HTMLArtifact } from './HTMLArtifact';
import { SVGArtifact } from './SVGArtifact';
import { CodeArtifact } from './CodeArtifact';
import { DocumentArtifact } from './DocumentArtifact';

interface ArtifactRendererProps {
  artifact: Artifact;
  onClose?: () => void;
}

export function ArtifactRenderer({ artifact, onClose }: ArtifactRendererProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const [viewMode, setViewMode] = useState<'rendered' | 'code'>('rendered');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    background: isDark ? '#1E1E1E' : '#ffffff',
    headerBg: isDark ? '#161B22' : '#f5f5f5',
    border: isDark ? '#424242' : '#e0e0e0',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    accent: '#FEC00F',
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const extensions: Record<ArtifactType, string> = {
      react: '.jsx',
      html: '.html',
      svg: '.svg',
      mermaid: '.mmd',
      markdown: '.md',
      document: '.md',
      code: '.txt',
      jsx: '.jsx',
      tsx: '.tsx',
      javascript: '.js',
      js: '.js',
      typescript: '.ts',
      ts: '.ts',
      python: '.py',
      json: '.json',
      css: '.css',
      text: '.txt',
    };
    
    const extension = extensions[artifact.type] || '.txt';
    const filename = artifact.title || `artifact-${artifact.id}`;
    const blob = new Blob([artifact.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      let content = artifact.code;
      
      if (artifact.type === 'react') {
        content = wrapReactForPreview(artifact.code);
      } else if (artifact.type === 'html') {
        content = wrapHTMLForPreview(artifact.code);
      } else if (artifact.type === 'svg') {
        content = wrapSVGForPreview(artifact.code);
      }
      
      newWindow.document.write(content);
      newWindow.document.close();
    }
  };

  const getArtifactTitle = () => {
    if (artifact.title) return artifact.title;
    
    const typeLabels: Record<ArtifactType, string> = {
      react: 'React Component',
      html: 'HTML Preview',
      svg: 'SVG Graphic',
      mermaid: 'Diagram',
      markdown: 'Markdown',
      document: 'Document',
      code: 'Code',
      jsx: 'React Component',
      tsx: 'React Component',
      javascript: 'JavaScript',
      js: 'JavaScript',
      typescript: 'TypeScript',
      ts: 'TypeScript',
      python: 'Python',
      json: 'JSON',
      css: 'CSS',
      text: 'Text',
    };
    
    return typeLabels[artifact.type] || 'Artifact';
  };

  const getLanguageLabel = () => {
    const labels: Record<string, string> = {
      jsx: 'React JSX',
      react: 'React',
      html: 'HTML',
      svg: 'SVG',
      mermaid: 'Mermaid',
      markdown: 'Markdown',
      md: 'Markdown',
      document: 'Document',
      afl: 'AFL',
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
    };
    
    return labels[artifact.language.toLowerCase()] || artifact.language.toUpperCase();
  };

  // Support all common artifact types for visual rendering
  const canRenderVisually = ['react', 'html', 'svg', 'mermaid', 'jsx', 'tsx', 'javascript', 'js', 'document', 'markdown', 'md'].includes(artifact.type.toLowerCase());
  
  // Normalize type for rendering - treat jsx/tsx/javascript as react
  const normalizedType = ['jsx', 'tsx', 'javascript', 'js'].includes(artifact.type.toLowerCase()) ? 'react' : artifact.type.toLowerCase();

  const containerStyle: React.CSSProperties = isFullscreen 
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: colors.background,
        display: 'flex',
        flexDirection: 'column',
      }
    : {
        backgroundColor: colors.background,
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
        marginTop: '16px',
        marginBottom: '16px',
      };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: colors.headerBg,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        {/* Left: Title & Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: colors.accent,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: "'Rajdhani', sans-serif",
            padding: '4px 8px',
            backgroundColor: `${colors.accent}20`,
            borderRadius: '4px',
          }}>
            {getLanguageLabel()}
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: colors.text,
          }}>
            {getArtifactTitle()}
          </span>
        </div>

        {/* Right: Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* View Mode Toggle (only if renderable) */}
          {canRenderVisually && (
            <div style={{
              display: 'flex',
              backgroundColor: isDark ? '#2A2A2A' : '#e8e8e8',
              borderRadius: '8px',
              padding: '2px',
              marginRight: '8px',
            }}>
              <button
                onClick={() => setViewMode('rendered')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  backgroundColor: viewMode === 'rendered' ? colors.accent : 'transparent',
                  color: viewMode === 'rendered' ? '#121212' : colors.textMuted,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                <Eye size={14} />
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  backgroundColor: viewMode === 'code' ? colors.accent : 'transparent',
                  color: viewMode === 'code' ? '#121212' : colors.textMuted,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                <Code size={14} />
                Code
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              backgroundColor: copied ? '#22C55E' : 'transparent',
              border: `1px solid ${copied ? '#22C55E' : colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Copy code"
          >
            {copied ? <Check size={14} color="#fff" /> : <Copy size={14} color={colors.textMuted} />}
          </button>

          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Download"
          >
            <Download size={14} color={colors.textMuted} />
          </button>

          {canRenderVisually && (
            <button
              onClick={handleOpenInNewTab}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                backgroundColor: 'transparent',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Open in new tab"
            >
              <ExternalLink size={14} color={colors.textMuted} />
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 size={14} color={colors.textMuted} />
            ) : (
              <Maximize2 size={14} color={colors.textMuted} />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        minHeight: isFullscreen ? 'calc(100vh - 60px)' : '300px',
        maxHeight: isFullscreen ? 'none' : '600px',
      }}>
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: '#DC262620',
            borderBottom: `1px solid #DC2626`,
            color: '#DC2626',
            fontSize: '13px',
          }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {viewMode === 'code' || !canRenderVisually ? (
          <CodeArtifact 
            code={artifact.code} 
            language={artifact.language}
            isDark={isDark}
          />
        ) : (
          <div style={{ height: '100%', width: '100%' }}>
            {normalizedType === 'mermaid' && (
              <MermaidArtifact 
                code={artifact.code}
                isDark={isDark}
                onError={setError}
              />
            )}
            {normalizedType === 'react' && (
              <ReactArtifact 
                code={artifact.code}
                isDark={isDark}
                onError={setError}
              />
            )}
            {normalizedType === 'html' && (
              <HTMLArtifact 
                code={artifact.code}
                isDark={isDark}
              />
            )}
            {normalizedType === 'svg' && (
              <SVGArtifact 
                code={artifact.code}
                isDark={isDark}
              />
            )}
            {['document', 'markdown', 'md'].includes(normalizedType) && (
              <DocumentArtifact 
                code={artifact.code}
                isDark={isDark}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions for wrapping content
function wrapReactForPreview(code: string): string {
  const cleanCode = code.trim();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Preview</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <!-- Load Babel Standalone -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #121212;
            color: #ffffff;
        }
        #root {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <!-- Your custom script with type="text/babel" -->
    <script type="text/babel">
        ${cleanCode}
        
        // Try to find and render the component
        const componentName = Object.keys(window).find(key => 
          typeof window[key] === 'function' && 
          /^[A-Z]/.test(key) &&
          key !== 'React' && 
          key !== 'ReactDOM'
        );
        
        if (typeof App !== 'undefined') {
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(<App />);
        } else if (componentName) {
          const Component = window[componentName];
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(<Component />);
        }
    </script>
</body>
</html>`;
}

function wrapHTMLForPreview(code: string): string {
  const cleanCode = code.trim();
  
  if (cleanCode.startsWith('<!DOCTYPE html>') || cleanCode.startsWith('<html')) {
    return cleanCode;
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
    </style>
</head>
<body>
    ${cleanCode}
</body>
</html>`;
}

function wrapSVGForPreview(code: string): string {
  const cleanCode = code.trim();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #121212;
        }
        svg {
            max-width: 100%;
            height: auto;
        }
    </style>
</head>
<body>
    ${cleanCode}
</body>
</html>`;
}

export default ArtifactRenderer;
