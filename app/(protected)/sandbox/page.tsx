'use client';

/**
 * Sandbox Page - Full-featured code execution environment
 * Similar to Claude's artifacts, with persistent sessions and real-time execution
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Download,
  Trash2,
  Maximize2,
  Minimize2,
  ChevronDown,
  Code2,
  Terminal,
  FolderOpen,
  Plus,
  History,
  Layers,
  SplitSquareHorizontal,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Cpu,
  Settings,
  Package,
  FileCode,
  Zap,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  sandboxService,
  sessionManager,
  type SandboxLanguage,
  type LocalSandboxSession,
  type SandboxArtifact,
  type ExecutionResult,
  type ExecutionHistoryItem,
  SandboxError,
} from '@/lib/sandbox';

// Language configuration
const LANGUAGE_CONFIG: Record<
  SandboxLanguage,
  { label: string; color: string; bgColor: string; extension: string; icon: string }
> = {
  python: {
    label: 'Python',
    color: '#3572A5',
    bgColor: 'rgba(53,114,165,0.15)',
    extension: 'py',
    icon: 'py',
  },
  javascript: {
    label: 'JavaScript',
    color: '#F7DF1E',
    bgColor: 'rgba(247,223,30,0.15)',
    extension: 'js',
    icon: 'js',
  },
  react: {
    label: 'React',
    color: '#61DAFB',
    bgColor: 'rgba(97,218,251,0.15)',
    extension: 'jsx',
    icon: 'react',
  },
};

// Code templates
const CODE_TEMPLATES: Record<SandboxLanguage, string> = {
  python: `# Python Sandbox - Data Analysis Example
import pandas as pd
import numpy as np

# Create sample financial data
np.random.seed(42)
dates = pd.date_range('2024-01-01', periods=30, freq='D')
prices = 100 + np.cumsum(np.random.randn(30) * 2)

df = pd.DataFrame({
    'Date': dates,
    'Price': prices,
    'Volume': np.random.randint(1000, 10000, 30),
    'Returns': np.diff(prices, prepend=prices[0]) / prices * 100
})

print("Stock Performance Summary")
print("=" * 40)
print(f"Start Price: \${df['Price'].iloc[0]:.2f}")
print(f"End Price: \${df['Price'].iloc[-1]:.2f}")
print(f"Total Return: {((df['Price'].iloc[-1] / df['Price'].iloc[0]) - 1) * 100:.2f}%")
print(f"Avg Daily Volume: {df['Volume'].mean():.0f}")
print(f"Max Drawdown: {df['Returns'].min():.2f}%")
print()
print("Daily Statistics:")
print(df.describe())
`,
  javascript: `// JavaScript Sandbox - Async Data Processing
const fetchData = async (symbol) => {
  // Simulated API response
  return {
    symbol,
    price: Math.random() * 100 + 50,
    change: (Math.random() - 0.5) * 10,
    volume: Math.floor(Math.random() * 1000000)
  };
};

const analyzePortfolio = async (symbols) => {
  console.log("Fetching portfolio data...");
  
  const data = await Promise.all(
    symbols.map(async (symbol) => {
      const quote = await fetchData(symbol);
      return {
        ...quote,
        changePercent: (quote.change / quote.price * 100).toFixed(2)
      };
    })
  );
  
  console.log("\\nPortfolio Analysis:");
  console.log("=".repeat(50));
  
  data.forEach(stock => {
    const indicator = stock.change >= 0 ? "+" : "";
    console.log(
      \`\${stock.symbol.padEnd(6)} | \$\${stock.price.toFixed(2).padStart(8)} | \` +
      \`\${indicator}\${stock.changePercent}%\`
    );
  });
  
  const totalValue = data.reduce((sum, s) => sum + s.price, 0);
  const avgChange = data.reduce((sum, s) => sum + s.change, 0) / data.length;
  
  console.log("=".repeat(50));
  console.log(\`Total Value: \$\${totalValue.toFixed(2)}\`);
  console.log(\`Avg Change: \${avgChange >= 0 ? "+" : ""}\${avgChange.toFixed(2)}\`);
  
  return data;
};

// Run analysis
analyzePortfolio(['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META']);
`,
  react: `// React Component Example
import React, { useState } from 'react';

export default function StockAnalyzer() {
  const [symbol, setSymbol] = useState('AAPL');
  
  const stockData = {
    AAPL: { price: 150, change: 2.5 },
    GOOGL: { price: 140, change: 1.2 },
    MSFT: { price: 380, change: 3.1 },
  };

  const data = stockData[symbol] || stockData.AAPL;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Stock Analyzer</h1>
      <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
        {Object.keys(stockData).map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <p>Symbol: {symbol}</p>
        <p>Price: \${data.price}</p>
        <p style={{ color: data.change >= 0 ? 'green' : 'red' }}>
          Change: {data.change >= 0 ? '+' : ''}{data.change}%
        </p>
      </div>
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
    '<span class="text-amber-400">$&</span>'
  );

  // Comments
  if (language === 'python') {
    html = html.replace(/(#.*$)/gm, '<span class="text-green-600 dark:text-green-500">$1</span>');
  } else {
    html = html.replace(/(\/\/.*$)/gm, '<span class="text-green-600 dark:text-green-500">$1</span>');
  }

  // Keywords
  const keywords =
    language === 'python'
      ? ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'with', 'as', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'print', 'lambda', 'async', 'await']
      : ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined'];

  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    html = html.replace(regex, '<span class="text-blue-500 font-semibold">$1</span>');
  });

  // Numbers
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-purple-400">$1</span>');

  return html;
}

export default function SandboxPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // State
const [session, setSession] = useState<LocalSandboxSession | null>(null);
const [allSessions, setAllSessions] = useState<LocalSandboxSession[]>([]);
  const [code, setCode] = useState(CODE_TEMPLATES.python);
  const [language, setLanguage] = useState<SandboxLanguage>('python');
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('output');
  const [showSplitView, setShowSplitView] = useState(true);
  const [availablePackages, setAvailablePackages] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize
  useEffect(() => {
    const activeSession = sessionManager.getOrCreateActiveSession();
    setSession(activeSession);
    setAllSessions(sessionManager.getAllSessions());

    // Restore last execution if available
    if (activeSession.executionHistory.length > 0) {
      const lastExecution = activeSession.executionHistory[activeSession.executionHistory.length - 1];
      setCode(lastExecution.code);
      setLanguage(lastExecution.language);
      setOutput(lastExecution.result);
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
  }, []);

  // Load packages when language changes
  useEffect(() => {
    if (backendConnected) {
      sandboxService.getPackages(language).then((res) => {
        setAvailablePackages(res.packages || []);
      }).catch(() => setAvailablePackages([]));
    }
  }, [language, backendConnected]);

  // Update template when language changes
  useEffect(() => {
    setCode(CODE_TEMPLATES[language]);
    setOutput(null);
  }, [language]);

  // Execute code
  const handleRun = useCallback(async () => {
    if (!session || isRunning) return;

    setIsRunning(true);
    setError(null);

    try {
      const result = await sandboxService.execute({
        code,
        language,
        timeout: 30,
        context: session.variables,
      });

      setOutput(result);

      // Add to history
      sessionManager.addExecution(session.id, {
        code,
        language,
        result,
      });

      // Execution is already added to history above
    } catch (err) {
      const message = err instanceof SandboxError ? err.message : 'Execution failed';
      setError(message);
      setOutput({
        success: false,
        output: null,
        error: message,
        execution_time_ms: 0,
        language,
        execution_id: `error-${Date.now()}`,
        session_id: session.id,
        display_type: 'text',
        artifacts: [],
      });
    } finally {
      setIsRunning(false);
    }
  }, [session, code, language, isRunning]);

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

  // Create new session
  const handleNewSession = useCallback(() => {
    const newSession = sessionManager.createSession();
    setSession(newSession);
    setCode(CODE_TEMPLATES[language]);
    setOutput(null);
    setError(null);
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
        const lang = switchedSession.activeLanguage as SandboxLanguage;
        setCode(CODE_TEMPLATES[lang]);
        setLanguage(lang);
        setOutput(null);
      }
    }
  }, []);

  // Restore from history
  const handleRestoreHistory = useCallback((item: ExecutionHistoryItem) => {
    setCode(item.code);
    setLanguage(item.language);
    setOutput(item.result);
  }, []);

  const config = LANGUAGE_CONFIG[language];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0c]' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b ${isDark ? 'border-white/5 bg-[#0f0f12]/95' : 'border-gray-200 bg-white/95'} backdrop-blur-xl`}>
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Cpu size={20} className="text-[#FEC00F]" />
              <h1 className={`text-lg font-bold font-['Rajdhani'] tracking-wide ${isDark ? 'text-white' : 'text-gray-900'}`}>
                CODE SANDBOX
              </h1>
            </div>

            {/* Connection status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              backendConnected === null
                ? 'bg-yellow-500/10 text-yellow-500'
                : backendConnected
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-red-500/10 text-red-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                backendConnected === null
                  ? 'bg-yellow-500'
                  : backendConnected
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-red-500'
              }`} />
              {backendConnected === null ? 'Checking...' : backendConnected ? 'Connected' : 'Offline'}
            </div>

            {/* Session selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FolderOpen size={14} />
                  {session?.name || 'Session'}
                  <ChevronDown size={12} className="opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={handleNewSession} className="gap-2 text-[#FEC00F]">
                  <Plus size={14} />
                  New Session
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {allSessions.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => handleSwitchSession(s.id)}
                    className={s.id === session?.id ? 'bg-[#FEC00F]/10' : ''}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs opacity-50">{s.executionHistory.length} executions</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Language selector */}
            <div className={`flex p-0.5 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              {(Object.keys(LANGUAGE_CONFIG) as SandboxLanguage[]).map((lang) => {
                const cfg = LANGUAGE_CONFIG[lang];
                const isActive = language === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      isActive
                        ? 'text-white shadow-sm'
                        : isDark ? 'text-white/50 hover:text-white/80' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    style={{ backgroundColor: isActive ? cfg.color : 'transparent' }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Run button */}
            <Button
              onClick={handleRun}
              disabled={isRunning || !backendConnected}
              className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {isRunning ? 'Running...' : 'Run Code'}
            </Button>

            {/* Action buttons */}
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}>
              <RotateCcw size={14} />
            </Button>
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download size={14} />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setShowSplitView(!showSplitView)}>
              <SplitSquareHorizontal size={14} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
        <div className={`flex gap-6 ${showSplitView ? '' : 'flex-col'}`} style={{ minHeight: 'calc(100vh - 140px)' }}>
          {/* Code editor panel */}
          <div className={`${showSplitView ? 'flex-1' : 'w-full'} flex flex-col rounded-xl border ${isDark ? 'border-white/5 bg-[#0d0d0f]' : 'border-gray-200 bg-white'} overflow-hidden`}>
            {/* Editor header */}
            <div className={`flex items-center justify-between px-4 py-2 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <FileCode size={14} className="text-[#FEC00F]" />
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  main.{config.extension}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: config.bgColor, color: config.color }}>
                  {config.label}
                </span>
              </div>
              <span className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                {code.split('\n').length} lines | {code.length} chars
              </span>
            </div>

            {/* Editor content */}
            <div className="flex-1 overflow-auto" style={{ maxHeight: showSplitView ? 'calc(100vh - 240px)' : '400px' }}>
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onBlur={() => setIsEditing(false)}
                  autoFocus
                  spellCheck={false}
                  className={`w-full h-full p-4 pl-14 font-mono text-sm leading-relaxed resize-none outline-none ${isDark ? 'bg-[#0d0d0f] text-gray-300' : 'bg-white text-gray-800'}`}
                />
              ) : (
                <div
                  onClick={() => setIsEditing(true)}
                  className={`p-4 font-mono text-sm leading-relaxed cursor-text min-h-full ${isDark ? 'bg-[#0d0d0f]' : 'bg-white'}`}
                >
                  {code.split('\n').map((line, i) => (
                    <div key={i} className="flex min-h-[22px]">
                      <span className={`w-10 text-right pr-4 select-none shrink-0 text-xs ${isDark ? 'text-white/20' : 'text-gray-300'}`}>
                        {i + 1}
                      </span>
                      <span
                        className={isDark ? 'text-gray-300' : 'text-gray-800'}
                        dangerouslySetInnerHTML={{ __html: highlightCode(line, language) || '&nbsp;' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Output panel */}
          <div className={`${showSplitView ? 'flex-1' : 'w-full'} flex flex-col rounded-xl border ${isDark ? 'border-white/5 bg-[#0d0d0f]' : 'border-gray-200 bg-white'} overflow-hidden`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <TabsList className={`h-10 rounded-none border-b ${isDark ? 'bg-transparent border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                <TabsTrigger value="output" className="gap-2 data-[state=active]:text-[#FEC00F]">
                  <Terminal size={14} />
                  Output
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2 data-[state=active]:text-[#FEC00F]">
                  <History size={14} />
                  History
                  {session && session.executionHistory.length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#FEC00F]/20 text-[#FEC00F]">
                      {session.executionHistory.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="artifacts" className="gap-2 data-[state=active]:text-[#FEC00F]">
                  <Layers size={14} />
                  Artifacts
                </TabsTrigger>
                <TabsTrigger value="packages" className="gap-2 data-[state=active]:text-[#FEC00F]">
                  <Package size={14} />
                  Packages
                </TabsTrigger>
              </TabsList>

              <TabsContent value="output" className="flex-1 overflow-auto p-4 m-0">
                {output ? (
                  <div className="space-y-3">
                    {/* Status */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${output.success ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      <div className="flex items-center gap-2">
                        {output.success ? (
                          <CheckCircle size={16} className="text-emerald-500" />
                        ) : (
                          <AlertCircle size={16} className="text-red-500" />
                        )}
                        <span className={`text-sm font-semibold ${output.success ? 'text-emerald-500' : 'text-red-500'}`}>
                          {output.success ? 'Success' : 'Error'}
                        </span>
                      </div>
                      <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                        <Clock size={12} />
                        {output.execution_time_ms.toFixed(2)}ms
                      </span>
                    </div>

                    {/* Output */}
                    <pre className={`p-4 rounded-lg font-mono text-sm leading-relaxed whitespace-pre-wrap break-words overflow-auto max-h-[400px] ${
                      isDark ? 'bg-black/50' : 'bg-gray-50'
                    } ${output.success ? 'text-emerald-400' : 'text-red-400'}`}>
                      {output.success ? output.output : output.error}
                    </pre>
                  </div>
                ) : (
                  <div className={`flex flex-col items-center justify-center h-full ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                    <Terminal size={48} className="mb-4 opacity-50" />
                    <p>No output yet. Click &quot;Run Code&quot; to execute.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="flex-1 overflow-auto p-4 m-0">
                {session && session.executionHistory.length > 0 ? (
                  <div className="space-y-2">
                    {[...session.executionHistory].reverse().map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleRestoreHistory(item)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.result.success ? (
                            <CheckCircle size={14} className="text-emerald-500" />
                          ) : (
                            <AlertCircle size={14} className="text-red-500" />
                          )}
                          <div className="text-left">
                            <p className={`text-sm font-medium truncate max-w-[200px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {item.code.split('\n')[0].slice(0, 40)}...
                            </p>
                            <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                              {item.language} - {item.result.execution_time_ms.toFixed(0)}ms
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={`flex flex-col items-center justify-center h-full ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                    <History size={48} className="mb-4 opacity-50" />
                    <p>No execution history yet.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="artifacts" className="flex-1 overflow-auto p-4 m-0">
                <div className={`flex flex-col items-center justify-center h-full ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                  <Layers size={48} className="mb-4 opacity-50" />
                  <p>Artifacts storage coming soon.</p>
                </div>
              </TabsContent>

              <TabsContent value="packages" className="flex-1 overflow-auto p-4 m-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Available Packages ({language})
                    </h3>
                    <span className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                      {availablePackages.length} packages
                    </span>
                  </div>
                  {availablePackages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {availablePackages.slice(0, 50).map((pkg) => (
                        <span
                          key={pkg}
                          className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-white/5 text-white/70' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {pkg}
                        </span>
                      ))}
                      {availablePackages.length > 50 && (
                        <span className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                          +{availablePackages.length - 50} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                      {backendConnected ? 'Loading packages...' : 'Connect to backend to see available packages.'}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
