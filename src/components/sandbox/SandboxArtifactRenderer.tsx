'use client';

/**
 * SandboxArtifactRenderer - Renders sandbox execution results
 * 
 * Handles all display_types from the sandbox backend (v3):
 * - text: Plain stdout in a code block
 * - image: PNG/SVG from matplotlib, pillow, etc (base64)
 * - html: HTML fragments from display(HTML(...))
 * - react: Complete React app (CDN Babel) in iframe
 * - plotly: Interactive Plotly charts (self-contained HTML) [v3]
 * - json: Structured data
 * - file: Downloadable files (CSV, Excel, PPTX, PDF, etc.) [v3]
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
  FileSpreadsheet,
  FileText,
  File,
  FileArchive,
  BarChart3,
} from 'lucide-react';
import type { ExecutionResult, SandboxArtifact, SandboxDisplayType } from '@/lib/sandbox/types';

// Backend URL for file download links (v3)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

interface SandboxArtifactRendererProps {
  result: ExecutionResult;
  onRerun?: (code?: string) => void;
  className?: string;
}

/**
 * Main renderer component for sandbox execution results
 */
export function SandboxArtifactRenderer({ 
  result: rawResult, 
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
  if (!rawResult || typeof rawResult !== 'object') {
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

  // Normalize the result - handle various backend response shapes
  // The result could be:
  // 1. Direct ExecutionResult: { success, output, display_type, artifacts, ... }
  // 2. Nested in data: { data: { success, output, ... } }
  // 3. Wrapped result: { result: { success, output, ... } }
  const result: ExecutionResult = {
    // Start with defaults
    success: true,
    output: '',
    language: 'python',
    display_type: 'text',
    artifacts: [],
    // Spread the raw result (handles direct format)
    ...(rawResult as any),
    // Handle nested formats
    ...(rawResult.data && typeof rawResult.data === 'object' ? rawResult.data : {}),
    ...(rawResult.result && typeof rawResult.result === 'object' ? rawResult.result : {}),
  };

  // Ensure artifacts is always an array
  if (!Array.isArray(result.artifacts)) {
    result.artifacts = [];
  }

  // If we have artifacts but no display_type, infer from first artifact
  if (result.artifacts.length > 0 && !result.display_type) {
    result.display_type = result.artifacts[0].display_type || 'text';
  }

  // Check for error conditions
  const hasError = result.success === false || 
    !!result.error || 
    (typeof rawResult.success === 'boolean' && rawResult.success === false);

  // Error state
  if (hasError) {
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
          {typeof result.execution_time_ms === 'number' && (
            <span style={styles.execTime}>
              <Clock size={12} />
              {Number(result.execution_time_ms).toFixed(0)}ms
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
  artifact: rawArtifact, 
  isFullscreen 
}: { 
  artifact: SandboxArtifact; 
  isFullscreen: boolean;
}) {
  const [viewMode, setViewMode] = useState<'preview' | 'data'>('preview');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Normalize artifact - handle missing/malformed properties
  const artifact: SandboxArtifact = {
    artifact_id: rawArtifact?.artifact_id || `artifact-${Date.now()}`,
    type: rawArtifact?.type || 'text/plain',
    display_type: rawArtifact?.display_type || 'text',
    data: rawArtifact?.data || '',
    encoding: rawArtifact?.encoding || 'utf-8',
    metadata: rawArtifact?.metadata,
  };

  // Early return if no data
  if (!artifact.data) {
    return (
      <div style={styles.artifactContainer}>
        <div style={styles.artifactHeader}>
          <span style={{ color: '#8b949e', fontSize: 13 }}>Empty artifact</span>
        </div>
      </div>
    );
  }

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
    const artifactIdSlice = artifact.artifact_id?.slice(0, 8) || 'unknown';
    const filename = `artifact-${artifactIdSlice}${ext}`;
    
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
      if (artifact.display_type === 'react' || artifact.display_type === 'html' || artifact.display_type === 'plotly') {
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
      case 'plotly':
        return <BarChart3 size={14} />;
      case 'image':
        return <ImageIcon size={14} />;
      case 'json':
        return <Braces size={14} />;
      case 'file': {
        const mimeType = artifact.type;
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
          return <FileSpreadsheet size={14} />;
        }
        if (mimeType.includes('zip') || mimeType.includes('gzip') || mimeType.includes('tar')) {
          return <FileArchive size={14} />;
        }
        if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml')) {
          return <FileText size={14} />;
        }
        return <File size={14} />;
      }
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
      case 'plotly':
        return 'Interactive Chart';
      case 'image':
        return artifact.metadata?.source === 'matplotlib' ? 'Chart' : 'Image';
      case 'json':
        return 'JSON Data';
      case 'file': {
        const meta = artifact.metadata as { filename?: string } | undefined;
        return meta?.filename || 'File';
      }
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
          {(artifact.display_type === 'react' || artifact.display_type === 'html' || artifact.display_type === 'plotly') && (
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
          {/* Hide download button for file artifacts (they have their own download) */}
          {artifact.display_type !== 'file' && (
            <button onClick={handleDownload} style={styles.iconButton} title="Download">
              <Download size={14} />
            </button>
          )}
          {(artifact.display_type === 'react' || artifact.display_type === 'html' || artifact.display_type === 'plotly' || artifact.display_type === 'image') && (
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

        {/* Plotly - interactive charts (v3) - same rendering as react/html */}
        {artifact.display_type === 'plotly' && (
          <iframe
            ref={iframeRef}
            srcDoc={artifact.data}
            style={{ ...styles.iframe, minHeight: '450px', backgroundColor: '#ffffff' }}
            sandbox="allow-scripts allow-same-origin"
            title="Plotly chart"
            onLoad={handleIframeLoad}
          />
        )}

        {/* File - downloadable files (v3) */}
        {artifact.display_type === 'file' && (
          <FileArtifactDisplay artifact={artifact} />
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
            {(() => {
              try {
                return JSON.stringify(JSON.parse(artifact.data), null, 2);
              } catch {
                return artifact.data; // Show raw data if parse fails
              }
            })()}
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

/**
 * File artifact display component (v3)
 * Renders downloadable files with proper icons and download buttons
 */
function FileArtifactDisplay({ artifact }: { artifact: SandboxArtifact }) {
  const meta = (artifact.metadata ?? {}) as Record<string, unknown>;
  const filename = (meta.filename as string) ?? `file${meta.extension ?? ''}`;
  const sizeBytes = meta.size_bytes as number | undefined;
  const sizeLabel = sizeBytes
    ? sizeBytes > 1_000_000
      ? `${(sizeBytes / 1_000_000).toFixed(1)} MB`
      : sizeBytes > 1_000
      ? `${(sizeBytes / 1_000).toFixed(1)} KB`
      : `${sizeBytes} B`
    : '';

  // Use backend download endpoint for proper Content-Disposition headers
  const downloadUrl = `${BACKEND_URL}/sandbox/download/${artifact.artifact_id}`;

  // Determine icon based on MIME type
  const getFileIcon = () => {
    const mimeType = artifact.type;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet size={24} style={{ color: '#22c55e' }} />;
    if (mimeType.includes('csv')) return <FileSpreadsheet size={24} style={{ color: '#22c55e' }} />;
    if (mimeType.includes('presentation')) return <FileText size={24} style={{ color: '#f97316' }} />;
    if (mimeType.includes('pdf')) return <FileText size={24} style={{ color: '#ef4444' }} />;
    if (mimeType.includes('zip') || mimeType.includes('gzip') || mimeType.includes('tar')) return <FileArchive size={24} style={{ color: '#8b5cf6' }} />;
    if (mimeType.startsWith('image/')) return <ImageIcon size={24} style={{ color: '#06b6d4' }} />;
    if (mimeType.startsWith('audio/')) return <File size={24} style={{ color: '#ec4899' }} />;
    if (mimeType.startsWith('video/')) return <File size={24} style={{ color: '#f43f5e' }} />;
    return <File size={24} style={{ color: '#8b949e' }} />;
  };

  const handlePreview = () => {
    // For text-based files, open a preview window
    if (artifact.encoding === 'utf-8' && artifact.type !== 'application/octet-stream') {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(
          `<html><head><title>${filename}</title><style>body{margin:0;padding:16px;font-family:monospace;background:#0d1117;color:#c9d1d9;}</style></head><body><pre style="white-space:pre-wrap;word-break:break-all">${artifact.data.replace(/</g, '&lt;')}</pre></body></html>`
        );
        win.document.close();
      }
    }
  };

  return (
    <div style={styles.fileContainer}>
      {/* File icon */}
      <div style={styles.fileIcon}>
        {getFileIcon()}
      </div>

      {/* Filename + size */}
      <div style={styles.fileInfo}>
        <p style={styles.fileName}>{filename}</p>
        <p style={styles.fileMeta}>
          {artifact.type}
          {sizeLabel ? ` · ${sizeLabel}` : ''}
        </p>
      </div>

      {/* Actions */}
      <div style={styles.fileActions}>
        {/* Preview button for text files */}
        {artifact.encoding === 'utf-8' && artifact.type !== 'application/octet-stream' && (
          <button onClick={handlePreview} style={styles.filePreviewButton}>
            <Eye size={14} />
            Preview
          </button>
        )}

        {/* Download button */}
        <a
          href={downloadUrl}
          download={filename}
          style={styles.fileDownloadButton}
        >
          <Download size={14} />
          Download
        </a>
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
  // File artifact styles (v3)
  fileContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#161b22',
    borderRadius: '8px',
    margin: '8px',
  },
  fileIcon: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#c9d1d9',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  fileMeta: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: '#8b949e',
  },
  fileActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  filePreviewButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid #30363d',
    borderRadius: '6px',
    color: '#c9d1d9',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  fileDownloadButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#238636',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
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
