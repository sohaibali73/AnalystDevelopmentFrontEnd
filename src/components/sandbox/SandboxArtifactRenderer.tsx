'use client';

/**
 * SandboxArtifactRenderer - Renders sandbox execution results
 * 
 * Handles all display_types from the sandbox backend:
 * - text: Plain stdout in a code block
 * - image: PNG/SVG from matplotlib, pillow, etc (base64)
 * - html: HTML fragments from display(HTML(...))
 * - react: Complete React app (CDN Babel) in iframe
 * - json: Structured data
 * 
 * Based on: SANDBOX_GUIDE.md Section 5 - Rendering Artifacts on the Frontend
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Play,
  Code,
  Eye,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Terminal,
  Image as ImageIcon,
  FileCode,
  Braces,
  RefreshCw,
} from 'lucide-react';
import type { ExecutionResult, SandboxArtifact, SandboxDisplayType } from '@/lib/sandbox/types';

interface SandboxArtifactRendererProps {
  result: ExecutionResult;
  onRerun?: (code?: string) => void;
  className?: string;
}

/**
 * Main renderer component for sandbox execution results
 */
export function SandboxArtifactRenderer({ 
  result, 
  onRerun,
  className = '',
}: SandboxArtifactRendererProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle malformed or missing result
  if (!result || typeof result !== 'object') {
    return (
      <div className={`sandbox-result ${className}`} style={styles.errorContainer}>
        <div style={styles.errorHeader}>
          <AlertCircle size={16} style={{ color: '#ef4444' }} />
          <span style={styles.errorTitle}>Invalid Result</span>
        </div>
        <pre style={styles.errorContent}>No execution result available</pre>
      </div>
    );
  }

  // Error state (success explicitly false, or error present)
  if (result.success === false || result.error) {
    return (
      <div className={`sandbox-result sandbox-result--error ${className}`} style={styles.errorContainer}>
        <div style={styles.errorHeader}>
          <AlertCircle size={16} style={{ color: '#ef4444' }} />
          <span style={styles.errorTitle}>Execution Error</span>
          <span style={styles.languageBadge}>{result.language}</span>
        </div>
        <pre style={styles.errorContent}>{result.error || 'Unknown error occurred'}</pre>
        {onRerun && (
          <button onClick={() => onRerun()} style={styles.retryButton}>
            <RefreshCw size={14} />
            Retry
          </button>
        )}
      </div>
    );
  }

  const containerStyle: React.CSSProperties = isFullscreen 
    ? styles.fullscreenContainer 
    : styles.container;

  return (
    <div className={`sandbox-result ${className}`} style={containerStyle}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <CheckCircle size={14} style={{ color: '#22c55e' }} />
          <span style={styles.languageBadge}>{result.language}</span>
          {result.display_type !== 'text' && (
            <span style={styles.displayTypeBadge}>{result.display_type}</span>
          )}
        </div>
        <div style={styles.headerRight}>
          {result.execution_time_ms != null && (
            <span style={styles.execTime}>
              <Clock size={12} />
              {result.execution_time_ms.toFixed(0)}ms
            </span>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={styles.iconButton}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Text output (stdout) */}
      {result.output && result.output !== 'Code executed successfully' && (
        <div style={styles.outputSection}>
          <div style={styles.outputHeader}>
            <Terminal size={14} />
            <span>Output</span>
            <button
              onClick={() => handleCopy(result.output || '')}
              style={styles.copyButton}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
          <pre style={styles.outputContent}>{result.output}</pre>
        </div>
      )}

      {/* Artifacts */}
      {result.artifacts && result.artifacts.length > 0 && (
        <div style={styles.artifactsSection}>
          {result.artifacts.map((artifact, index) => (
            <ArtifactItem
              key={artifact.artifact_id || index}
              artifact={artifact}
              isFullscreen={isFullscreen}
            />
          ))}
        </div>
      )}

      {/* Variables (optional display) */}
      {result.variables && Object.keys(result.variables).length > 0 && (
        <div style={styles.variablesSection}>
          <div style={styles.variablesHeader}>
            <Braces size={14} />
            <span>Session Variables</span>
          </div>
          <div style={styles.variablesList}>
            {Object.entries(result.variables).slice(0, 5).map(([key, value]) => (
              <div key={key} style={styles.variableItem}>
                <span style={styles.variableKey}>{key}</span>
                <span style={styles.variableValue}>
                  {String(value).slice(0, 50)}
                  {String(value).length > 50 && '...'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta footer - only show if we have session/execution IDs */}
      {(result.session_id || result.execution_id) && (
        <div style={styles.footer}>
          {result.session_id && (
            <span style={styles.footerText}>
              Session: {result.session_id.slice(0, 8)}...
            </span>
          )}
          {result.execution_id && (
            <span style={styles.footerText}>
              Exec: {result.execution_id.slice(0, 8)}...
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual artifact renderer
 */
function ArtifactItem({ 
  artifact, 
  isFullscreen 
}: { 
  artifact: SandboxArtifact; 
  isFullscreen: boolean;
}) {
  const [viewMode, setViewMode] = useState<'preview' | 'data'>('preview');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-resize iframe to content height
  const handleIframeLoad = useCallback(() => {
    if (iframeRef.current) {
      try {
        const height = iframeRef.current.contentDocument?.body?.scrollHeight;
        if (height) {
          iframeRef.current.style.height = `${Math.min(height + 32, 600)}px`;
        }
      } catch {
        // Cross-origin - use default height
      }
    }
  }, []);

  const handleDownload = () => {
    const extensions: Record<string, string> = {
      'image/png': '.png',
      'image/svg+xml': '.svg',
      'text/html': '.html',
      'application/json': '.json',
    };
    const ext = extensions[artifact.type] || '.txt';
    const filename = `artifact-${artifact.artifact_id.slice(0, 8)}${ext}`;
    
    let blob: Blob;
    if (artifact.encoding === 'base64' && artifact.type.startsWith('image/')) {
      // Decode base64 to binary
      const binary = atob(artifact.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: artifact.type });
    } else {
      blob = new Blob([artifact.data], { type: artifact.type });
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openInNewTab = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      if (artifact.display_type === 'react' || artifact.display_type === 'html') {
        newWindow.document.write(artifact.data);
        newWindow.document.close();
      } else if (artifact.display_type === 'image') {
        newWindow.document.write(`
          <html>
            <head><title>Artifact Preview</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#121212;">
              <img src="data:${artifact.type};base64,${artifact.data}" style="max-width:100%;height:auto;" />
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  const getArtifactIcon = () => {
    switch (artifact.display_type) {
      case 'react':
      case 'html':
        return <FileCode size={14} />;
      case 'image':
        return <ImageIcon size={14} />;
      case 'json':
        return <Braces size={14} />;
      default:
        return <Code size={14} />;
    }
  };

  const getArtifactLabel = () => {
    switch (artifact.display_type) {
      case 'react':
        return 'React Component';
      case 'html':
        return 'HTML Preview';
      case 'image':
        return artifact.metadata?.source === 'matplotlib' ? 'Chart' : 'Image';
      case 'json':
        return 'JSON Data';
      default:
        return 'Artifact';
    }
  };

  return (
    <div style={styles.artifactContainer}>
      {/* Artifact Header */}
      <div style={styles.artifactHeader}>
        <div style={styles.artifactHeaderLeft}>
          {getArtifactIcon()}
          <span style={styles.artifactLabel}>{getArtifactLabel()}</span>
          <span style={styles.artifactType}>{artifact.type}</span>
        </div>
        <div style={styles.artifactHeaderRight}>
          {(artifact.display_type === 'react' || artifact.display_type === 'html') && (
            <div style={styles.viewToggle}>
              <button
                onClick={() => setViewMode('preview')}
                style={{
                  ...styles.viewToggleButton,
                  ...(viewMode === 'preview' ? styles.viewToggleButtonActive : {}),
                }}
              >
                <Eye size={12} />
                Preview
              </button>
              <button
                onClick={() => setViewMode('data')}
                style={{
                  ...styles.viewToggleButton,
                  ...(viewMode === 'data' ? styles.viewToggleButtonActive : {}),
                }}
              >
                <Code size={12} />
                Source
              </button>
            </div>
          )}
          <button onClick={handleDownload} style={styles.iconButton} title="Download">
            <Download size={14} />
          </button>
          {(artifact.display_type === 'react' || artifact.display_type === 'html' || artifact.display_type === 'image') && (
            <button onClick={openInNewTab} style={styles.iconButton} title="Open in new tab">
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Artifact Content */}
      <div style={styles.artifactContent}>
        {/* React/HTML - iframe with srcDoc */}
        {(artifact.display_type === 'react' || artifact.display_type === 'html') && (
          viewMode === 'preview' ? (
            <iframe
              ref={iframeRef}
              srcDoc={artifact.data}
              style={styles.iframe}
              sandbox="allow-scripts allow-same-origin"
              title="Sandbox output"
              onLoad={handleIframeLoad}
            />
          ) : (
            <pre style={styles.sourceCode}>{artifact.data}</pre>
          )
        )}

        {/* Image - base64 src */}
        {artifact.display_type === 'image' && (
          <div style={styles.imageContainer}>
            <img
              src={`data:${artifact.type};base64,${artifact.data}`}
              alt="Generated artifact"
              style={styles.image}
            />
          </div>
        )}

        {/* JSON - formatted display */}
        {artifact.display_type === 'json' && (
          <pre style={styles.jsonContent}>
            {JSON.stringify(JSON.parse(artifact.data), null, 2)}
          </pre>
        )}

        {/* Text/default - pre block */}
        {artifact.display_type === 'text' && (
          <pre style={styles.textContent}>{artifact.data}</pre>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#0d1117',
    borderRadius: '12px',
    border: '1px solid #30363d',
    overflow: 'hidden',
    marginTop: '12px',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  fullscreenContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: '#0d1117',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    padding: '16px',
    marginTop: '12px',
  },
  errorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: '14px',
    fontWeight: 600,
  },
  errorContent: {
    margin: 0,
    padding: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    color: '#f97583',
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', monospace",
    whiteSpace: 'pre-wrap',
    overflow: 'auto',
    maxHeight: '200px',
  },
  retryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '12px',
    padding: '8px 16px',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: '6px',
    color: '#ef4444',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#161b22',
    borderBottom: '1px solid #30363d',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  languageBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#FEC00F',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '4px 8px',
    backgroundColor: 'rgba(254, 192, 15, 0.15)',
    borderRadius: '4px',
  },
  displayTypeBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#8b949e',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '4px 8px',
    backgroundColor: 'rgba(139, 148, 158, 0.1)',
    borderRadius: '4px',
  },
  execTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#8b949e',
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    backgroundColor: 'transparent',
    border: '1px solid #30363d',
    borderRadius: '6px',
    color: '#8b949e',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  outputSection: {
    borderBottom: '1px solid #30363d',
  },
  outputHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: '#8b949e',
    fontSize: '12px',
    fontWeight: 600,
  },
  copyButton: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    color: '#8b949e',
    cursor: 'pointer',
  },
  outputContent: {
    margin: 0,
    padding: '12px 16px',
    backgroundColor: '#010409',
    color: '#7ee787',
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    overflow: 'auto',
    maxHeight: '300px',
  },
  artifactsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '12px',
  },
  artifactContainer: {
    backgroundColor: '#161b22',
    borderRadius: '8px',
    border: '1px solid #30363d',
    overflow: 'hidden',
  },
  artifactHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottom: '1px solid #30363d',
  },
  artifactHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#c9d1d9',
    fontSize: '13px',
  },
  artifactHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  artifactLabel: {
    fontWeight: 600,
  },
  artifactType: {
    fontSize: '11px',
    color: '#8b949e',
    padding: '2px 6px',
    backgroundColor: 'rgba(139, 148, 158, 0.1)',
    borderRadius: '4px',
  },
  viewToggle: {
    display: 'flex',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '6px',
    padding: '2px',
  },
  viewToggleButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    color: '#8b949e',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  viewToggleButtonActive: {
    backgroundColor: '#FEC00F',
    color: '#121212',
  },
  artifactContent: {
    minHeight: '200px',
    maxHeight: '600px',
    overflow: 'auto',
  },
  iframe: {
    width: '100%',
    minHeight: '400px',
    border: 'none',
    backgroundColor: '#ffffff',
  },
  sourceCode: {
    margin: 0,
    padding: '12px',
    backgroundColor: '#010409',
    color: '#c9d1d9',
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    overflow: 'auto',
    maxHeight: '400px',
  },
  imageContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#ffffff',
  },
  image: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '4px',
  },
  jsonContent: {
    margin: 0,
    padding: '12px',
    backgroundColor: '#010409',
    color: '#79c0ff',
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.5,
    overflow: 'auto',
    maxHeight: '400px',
  },
  textContent: {
    margin: 0,
    padding: '12px',
    backgroundColor: '#0d1117',
    color: '#c9d1d9',
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
  variablesSection: {
    borderTop: '1px solid #30363d',
    padding: '12px 16px',
  },
  variablesHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#8b949e',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  variablesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  variableItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '4px',
    fontSize: '12px',
  },
  variableKey: {
    color: '#79c0ff',
    fontFamily: "'JetBrains Mono', monospace",
  },
  variableValue: {
    color: '#8b949e',
    fontFamily: "'JetBrains Mono', monospace",
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    borderTop: '1px solid #30363d',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  footerText: {
    fontSize: '11px',
    color: '#484f58',
    fontFamily: "'JetBrains Mono', monospace",
  },
};

export default SandboxArtifactRenderer;
