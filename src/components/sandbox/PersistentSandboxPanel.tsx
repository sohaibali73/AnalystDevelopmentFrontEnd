'use client';

/**
 * PersistentSandboxPanel - Main sandbox interface with persistent sessions
 * Features:
 * - Code editor with syntax highlighting
 * - Live execution preview (React/HTML/Python/JS)
 * - Artifact management and persistence
 * - File downloads
 * - Session management
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Download,
  Upload,
  Trash2,
  Maximize2,
  Minimize2,
  X,
  ChevronDown,
  ChevronRight,
  Code2,
  Terminal,
  FileCode,
  FileText,
  Image as ImageIcon,
  FolderOpen,
  Settings,
  Plus,
  Save,
  History,
  Layers,
  SplitSquareHorizontal,
  PanelRightClose,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Sparkles,
  Cpu,
} from 'lucide-react';

import {
  sandboxService,
  sessionManager,
  type SandboxLanguage,
  type SandboxSession,
  type LocalSandboxArtifact,
  type ExecutionResult,
  type ExecutionHistoryItem,
  SandboxError,
} from '@/lib/sandbox';

// Language configuration
const LANGUAGE_CONFIG: Record<
  SandboxLanguage,
  { label: string; color: string; bgColor: string; extension: string }
> = {
  python: {
    label: 'Python',
    color: '#3572A5',
    bgColor: 'rgba(53,114,165,0.15)',
    extension: 'py',
  },
  javascript: {
    label: 'JavaScript',
    color: '#F7DF1E',
    bgColor: 'rgba(247,223,30,0.15)',
    extension: 'js',
  },
  react: {
    label: 'React',
    color: '#61DAFB',
    bgColor: 'rgba(97,218,251,0.15)',
    extension: 'tsx',
  },
};

// Code templates
const CODE_TEMPLATES: Record<SandboxLanguage, string> = {
  python: `# Python Sandbox
import pandas as pd
import numpy as np

# Create sample data
data = pd.DataFrame({
    'Name': ['Alice', 'Bob', 'Charlie'],
    'Age': [25, 30, 35],
    'Score': [85, 90, 78]
})

print("Data Summary:")
print(data.describe())
print("\\nAverage Score:", data['Score'].mean())
`,
  javascript: `// JavaScript Sandbox
const greet = (name) => {
  return \`Hello, \${name}!\`;
};

// Test the function
console.log(greet('World'));

// Modern JS features
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('Doubled:', doubled);

// Object destructuring
const user = { name: 'Alice', age: 30 };
const { name, age } = user;
console.log(\`\${name} is \${age} years old\`);
`,
  react: `// React Component Sandbox
export default function App() {
  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <h1>Hello from React!</h1>
      <p>Edit this component and run to preview.</p>
    </div>
  );
}
`,
};

// Simple syntax highlighting
function highlightCode(code: string, language: SandboxLanguage): string {
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Strings
  html = html.replace(
    /(["'`])((?:\\\1|(?:(?!\1).))*)\1/g,
    '<span style="color:#CE9178">$&</span>'
  );

  // Comments
  if (language === 'python') {
    html = html.replace(/(#.*$)/gm, '<span style="color:#6A9955">$1</span>');
  } else {
    html = html.replace(/(\/\/.*$)/gm, '<span style="color:#6A9955">$1</span>');
  }

  // Keywords
  const keywords =
    language === 'python'
      ? ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'with', 'as', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'print', 'lambda']
      : ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined'];

  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    html = html.replace(regex, '<span style="color:#569CD6;font-weight:600">$1</span>');
  });

  // Numbers
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#B5CEA8">$1</span>');

  return html;
}

interface PersistentSandboxPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  initialLanguage?: SandboxLanguage;
  isDark?: boolean;
  onArtifactGenerated?: (artifact: LocalSandboxArtifact) => void;
}

export function PersistentSandboxPanel({
  isOpen,
  onClose,
  initialCode,
  initialLanguage = 'python',
  isDark = true,
  onArtifactGenerated,
}: PersistentSandboxPanelProps) {
  // State
  const [session, setSession] = useState<SandboxSession | null>(null);
  const [code, setCode] = useState(initialCode || CODE_TEMPLATES[initialLanguage]);
  const [language, setLanguage] = useState<SandboxLanguage>(initialLanguage);
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'output' | 'artifacts' | 'history'>('code');
  const [showSplitView, setShowSplitView] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [showSessionList, setShowSessionList] = useState(false);
  const [allSessions, setAllSessions] = useState<SandboxSession[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);

  // Initialize session
  useEffect(() => {
    if (!isOpen) return;

    const activeSession = sessionManager.getOrCreateActiveSession();
    setSession(activeSession);
    setAllSessions(sessionManager.getAllSessions());

    if (activeSession.executionHistory.length > 0) {
      const lastExecution = activeSession.executionHistory[activeSession.executionHistory.length - 1];
      setCode(lastExecution.code);
      setLanguage(lastExecution.language);
      setOutput(lastExecution.result);
    } else if (initialCode) {
      setCode(initialCode);
    }

    // Check backend connection
    sandboxService.healthCheck().then(setBackendConnected).catch(() => setBackendConnected(false));

    // Subscribe to session changes
    const unsubscribe = sessionManager.subscribe(() => {
      setAllSessions(sessionManager.getAllSessions());
      const current = sessionManager.getActiveSession();
      if (current) setSession(current);
    });

    return unsubscribe;
  }, [isOpen, initialCode]);

  // Update code when language changes
  useEffect(() => {
    if (!initialCode && CODE_TEMPLATES[language]) {
      setCode(CODE_TEMPLATES[language]);
    }
  }, [language, initialCode]);

  // Execute code
  const handleRun = useCallback(async () => {
    if (!session || isRunning) return;

    setIsRunning(true);
    setError(null);
    setActiveTab('output');

    try {
      const result = await sandboxService.execute({
        code,
        language,
        timeout: 30,
        context: session.variables,
      });

      setOutput(result);

      // Add to history
      const historyItem = sessionManager.addExecution(session.id, {
        code,
        language,
        result,
      });

      // Create artifact if successful
      if (result.success && onArtifactGenerated) {
        const artifact = sessionManager.addArtifact(session.id, {
          type: 'code',
          title: `${language} execution`,
          content: code,
          language,
          metadata: {
            output: result.output,
            executionTime: result.execution_time_ms,
          },
        });
        onArtifactGenerated(artifact);
      }
    } catch (err) {
      const message = err instanceof SandboxError ? err.message : 'Execution failed';
      setError(message);
      setOutput({
        success: false,
        output: null,
        error: message,
        execution_time_ms: 0,
        language,
        execution_id: '',
        session_id: '',
        display_type: 'text',
        artifacts: [],
      });
    } finally {
      setIsRunning(false);
    }
  }, [session, code, language, isRunning, onArtifactGenerated]);

  // Copy code
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // Reset code
  const handleReset = useCallback(() => {
    setCode(CODE_TEMPLATES[language]);
    setOutput(null);
    setError(null);
  }, [language]);

  // Download code
  const handleDownload = useCallback(() => {
    const config = LANGUAGE_CONFIG[language];
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sandbox.${config.extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, language]);

  // Download output
  const handleDownloadOutput = useCallback(() => {
    if (!output) return;
    const content = output.success ? (output.output ?? '') : `Error: ${output.error ?? 'Unknown error'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  // Create new session
  const handleNewSession = useCallback(() => {
    const newSession = sessionManager.createSession();
    setSession(newSession);
    setCode(CODE_TEMPLATES[language]);
    setOutput(null);
    setError(null);
    setShowSessionList(false);
  }, [language]);

  // Switch session
  const handleSwitchSession = useCallback((sessionId: string) => {
    sessionManager.setActiveSessionId(sessionId);
    const switchedSession = sessionManager.getSession(sessionId);
    if (switchedSession) {
      setSession(switchedSession);
      if (switchedSession.executionHistory.length > 0) {
        const lastExecution = switchedSession.executionHistory[switchedSession.executionHistory.length - 1];
        setCode(lastExecution.code);
        setLanguage(lastExecution.language);
        setOutput(lastExecution.result);
      } else {
        setCode(CODE_TEMPLATES[switchedSession.activeLanguage]);
        setLanguage(switchedSession.activeLanguage);
        setOutput(null);
      }
    }
    setShowSessionList(false);
  }, []);

  // Delete session
  const handleDeleteSession = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sessionManager.deleteSession(sessionId);
    if (session?.id === sessionId) {
      const remaining = sessionManager.getAllSessions();
      if (remaining.length > 0) {
        handleSwitchSession(remaining[0].id);
      } else {
        handleNewSession();
      }
    }
  }, [session, handleSwitchSession, handleNewSession]);

  // Restore from history
  const handleRestoreHistory = useCallback((item: ExecutionHistoryItem) => {
    setCode(item.code);
    setLanguage(item.language);
    setOutput(item.result);
    setActiveTab('code');
  }, []);

  if (!isOpen) return null;

  const config = LANGUAGE_CONFIG[language];

  // Render content
  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? 0 : '24px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: isFullscreen ? '100%' : '95%',
          maxWidth: isFullscreen ? '100%' : '1600px',
          height: isFullscreen ? '100%' : '90vh',
          backgroundColor: isDark ? '#0a0a0c' : '#fafafa',
          borderRadius: isFullscreen ? 0 : '16px',
          border: isFullscreen ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
          boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            background: isDark
              ? 'linear-gradient(180deg, #0f0f12 0%, #0a0a0c 100%)'
              : 'linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="#FEC00F" />
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: isDark ? '#fff' : '#1a1a1a',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.5px',
                }}
              >
                SANDBOX
              </span>
            </div>

            {/* Connection status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: backendConnected === null
                  ? 'rgba(255,193,7,0.1)'
                  : backendConnected
                  ? 'rgba(34,197,94,0.1)'
                  : 'rgba(239,68,68,0.1)',
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: backendConnected === null
                    ? '#FFC107'
                    : backendConnected
                    ? '#22C55E'
                    : '#EF4444',
                }}
              />
              <span
                style={{
                  color: backendConnected === null
                    ? '#FFC107'
                    : backendConnected
                    ? '#22C55E'
                    : '#EF4444',
                }}
              >
                {backendConnected === null ? 'Checking...' : backendConnected ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Session selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowSessionList(!showSessionList)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  backgroundColor: 'transparent',
                  color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <FolderOpen size={14} />
                {session?.name || 'Session'}
                <ChevronDown size={12} style={{ opacity: 0.6 }} />
              </button>

              {showSessionList && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    width: '240px',
                    maxHeight: '300px',
                    overflow: 'auto',
                    backgroundColor: isDark ? '#161618' : '#fff',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    zIndex: 100,
                  }}
                >
                  <button
                    onClick={handleNewSession}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                      color: '#FEC00F',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Plus size={14} />
                    New Session
                  </button>
                  {allSessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSwitchSession(s.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: s.id === session?.id
                          ? isDark ? 'rgba(254,192,15,0.08)' : 'rgba(254,192,15,0.1)'
                          : 'transparent',
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a' }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                          {s.executionHistory.length} executions
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        style={{
                          padding: '4px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Language selector */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                borderRadius: '8px',
                padding: '3px',
              }}
            >
              {(Object.keys(LANGUAGE_CONFIG) as SandboxLanguage[]).map((lang) => {
                const cfg = LANGUAGE_CONFIG[lang];
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
                      color: isActive ? cfg.color : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Run button */}
            <button
              onClick={handleRun}
              disabled={isRunning || !backendConnected}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isRunning ? 'rgba(34,197,94,0.1)' : backendConnected ? '#22C55E' : '#6B7280',
                color: isRunning ? '#22C55E' : '#fff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: isRunning || !backendConnected ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {isRunning ? 'Running...' : 'Run'}
            </button>

            {/* Action buttons */}
            <button onClick={handleCopy} style={actionButtonStyle(isDark)}>
              {copied ? <Check size={14} color="#22C55E" /> : <Copy size={14} />}
            </button>
            <button onClick={handleReset} style={actionButtonStyle(isDark)}>
              <RotateCcw size={14} />
            </button>
            <button onClick={handleDownload} style={actionButtonStyle(isDark)}>
              <Download size={14} />
            </button>
            <button onClick={() => setShowSplitView(!showSplitView)} style={actionButtonStyle(isDark)}>
              <SplitSquareHorizontal size={14} />
            </button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} style={actionButtonStyle(isDark)}>
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button onClick={onClose} style={{ ...actionButtonStyle(isDark), color: '#EF4444' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Code editor panel */}
          <div
            style={{
              flex: showSplitView ? 1 : 1,
              display: 'flex',
              flexDirection: 'column',
              borderRight: showSplitView ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}` : 'none',
            }}
          >
            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              }}
            >
              {[
                { id: 'code', label: 'Code', icon: Code2 },
                { id: 'output', label: 'Output', icon: Terminal },
                { id: 'artifacts', label: 'Artifacts', icon: Layers },
                { id: 'history', label: 'History', icon: History },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    backgroundColor: activeTab === tab.id
                      ? isDark ? 'rgba(254,192,15,0.06)' : 'rgba(254,192,15,0.08)'
                      : 'transparent',
                    borderBottom: activeTab === tab.id ? '2px solid #FEC00F' : '2px solid transparent',
                    border: 'none',
                    color: activeTab === tab.id
                      ? '#FEC00F'
                      : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <tab.icon size={14} />
                  {tab.label}
                  {tab.id === 'artifacts' && session && session.artifacts.length > 0 && (
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(254,192,15,0.2)',
                        color: '#FEC00F',
                        fontSize: '10px',
                        fontWeight: 700,
                      }}
                    >
                      {session.artifacts.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {activeTab === 'code' && (
                <div ref={codeContainerRef} style={{ height: '100%', position: 'relative' }}>
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
                        backgroundColor: isDark ? '#0d0d0f' : '#fafafa',
                        color: isDark ? '#D4D4D4' : '#24292E',
                        border: 'none',
                        outline: 'none',
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        fontSize: '13px',
                        lineHeight: '22px',
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
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        fontSize: '13px',
                        lineHeight: '22px',
                        cursor: 'text',
                        minHeight: '100%',
                        backgroundColor: isDark ? '#0d0d0f' : '#fafafa',
                      }}
                    >
                      {code.split('\n').map((line, i) => (
                        <div key={i} style={{ display: 'flex', minHeight: '22px' }}>
                          <span
                            style={{
                              width: '40px',
                              color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                              textAlign: 'right',
                              paddingRight: '16px',
                              userSelect: 'none',
                              flexShrink: 0,
                              fontSize: '12px',
                            }}
                          >
                            {i + 1}
                          </span>
                          <span
                            style={{ color: isDark ? '#D4D4D4' : '#24292E' }}
                            dangerouslySetInnerHTML={{ __html: highlightCode(line, language) || '&nbsp;' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {!isEditing && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '10px',
                        color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      }}
                    >
                      Click to edit
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'output' && (
                <div style={{ padding: '16px', height: '100%' }}>
                  {output ? (
                    <div>
                      {/* Status header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '12px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: output.success
                            ? 'rgba(34,197,94,0.1)'
                            : 'rgba(239,68,68,0.1)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {output.success ? (
                            <CheckCircle size={16} color="#22C55E" />
                          ) : (
                            <AlertCircle size={16} color="#EF4444" />
                          )}
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: output.success ? '#22C55E' : '#EF4444',
                            }}
                          >
                            {output.success ? 'Execution Successful' : 'Execution Failed'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                            }}
                          >
                            <Clock size={12} />
                            {output.execution_time_ms.toFixed(2)}ms
                          </span>
                          <button onClick={handleDownloadOutput} style={actionButtonStyle(isDark)}>
                            <Download size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Output content */}
                      <pre
                        style={{
                          margin: 0,
                          padding: '16px',
                          backgroundColor: isDark ? '#0d0d0f' : '#f5f5f5',
                          borderRadius: '8px',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          fontSize: '13px',
                          lineHeight: 1.6,
                          color: output.success
                            ? isDark ? '#7EE787' : '#116329'
                            : isDark ? '#F97583' : '#CF222E',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxHeight: '400px',
                          overflow: 'auto',
                        }}
                      >
                        {output.success ? output.output : output.error}
                      </pre>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                      }}
                    >
                      <Terminal size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                      <span style={{ fontSize: '14px' }}>No output yet. Click &quot;Run&quot; to execute code.</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'artifacts' && session && (
                <div style={{ padding: '16px' }}>
                  {session.artifacts.length === 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '200px',
                        color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                      }}
                    >
                      <Layers size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                      <span style={{ fontSize: '14px' }}>No artifacts yet. Execute code to generate artifacts.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {session.artifacts.map((artifact) => (
                        <div
                          key={artifact.id}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileCode size={14} color="#FEC00F" />
                              <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1a' }}>
                                {artifact.title}
                              </span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: LANGUAGE_CONFIG[artifact.language || 'python'].bgColor,
                                  color: LANGUAGE_CONFIG[artifact.language || 'python'].color,
                                  fontWeight: 600,
                                }}
                              >
                                {artifact.language}
                              </span>
                            </div>
                            <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                              {new Date(artifact.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <pre
                            style={{
                              margin: 0,
                              padding: '8px',
                              backgroundColor: isDark ? '#0d0d0f' : '#f5f5f5',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontFamily: "'JetBrains Mono', monospace",
                              color: isDark ? '#D4D4D4' : '#24292E',
                              maxHeight: '100px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {artifact.content.slice(0, 200)}...
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && session && (
                <div style={{ padding: '16px' }}>
                  {session.executionHistory.length === 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '200px',
                        color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                      }}
                    >
                      <History size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                      <span style={{ fontSize: '14px' }}>No execution history yet.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[...session.executionHistory].reverse().map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleRestoreHistory(item)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {item.result.success ? (
                              <CheckCircle size={14} color="#22C55E" />
                            ) : (
                              <AlertCircle size={14} color="#EF4444" />
                            )}
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a' }}>
                                {item.code.split('\n')[0].slice(0, 40)}...
                              </div>
                              <div style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                                {item.language} - {item.result.execution_time_ms.toFixed(2)}ms
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preview panel (split view) */}
          {showSplitView && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Sparkles size={14} color="#FEC00F" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1a' }}>
                  Live Preview
                </span>
              </div>
              <div style={{ flex: 1, backgroundColor: isDark ? '#0d0d0f' : '#fff' }}>
                {output && output.success ? (
                  <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
                    <pre
                      style={{
                        margin: 0,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: isDark ? '#7EE787' : '#116329',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {output.output}
                    </pre>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                    }}
                  >
                    <span style={{ fontSize: '13px' }}>Run code to see output here</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
          }}
        >
          <span>
            {code.split('\n').length} lines | {code.length} chars
          </span>
          <span>
            Session: {session?.name} | {session?.executionHistory.length || 0} executions
          </span>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(content, document.body);
}

// Styles helper
function actionButtonStyle(isDark: boolean): React.CSSProperties {
  return {
    padding: '8px',
    borderRadius: '6px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
    backgroundColor: 'transparent',
    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

export default PersistentSandboxPanel;
