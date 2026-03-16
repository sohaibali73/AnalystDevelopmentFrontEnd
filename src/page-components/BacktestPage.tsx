'use client';

import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  Upload,
  TrendingUp,
  Loader2,
  AlertTriangle,
  BarChart3,
  GitCompare,
  Layers,
  FileText,
  ArrowUpDown,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTheme } from '@/contexts/ThemeContext';
import apiClient from '@/lib/api';
import type { BacktestResult } from '@/types/api';
import FeedbackModal from '@/components/FeedbackModal';
import BacktestFilters, { type FilterState, DEFAULT_FILTERS } from '@/components/backtest/BacktestFilters';
import BacktestTable from '@/components/backtest/BacktestTable';
import BacktestDetail from '@/components/backtest/BacktestDetail';
import BacktestCompare from '@/components/backtest/BacktestCompare';

// ---- Summary Stat Card ----
interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  isDark: boolean;
}

function StatCard({ label, value, sub, color, icon, isDark }: StatCardProps) {
  return (
    <Card
      className="border transition-all duration-200 hover:shadow-md"
      style={{
        backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
        borderColor: isDark ? '#333' : '#E5E5E5',
      }}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wider" style={{ color: isDark ? '#9E9E9E' : '#757575' }}>
            {label}
          </p>
          <p
            className="text-xl font-bold"
            style={{ fontFamily: "'Rajdhani', sans-serif", color: isDark ? '#F5F5F5' : '#212121' }}
          >
            {value}
          </p>
          {sub && (
            <p className="text-xs" style={{ color: isDark ? '#616161' : '#BDBDBD' }}>
              {sub}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Demo / Sample Data ----
function createDemoBacktest(index: number): BacktestResult {
  const strategies = ['Momentum', 'MeanRev', 'Breakout', 'MACD_Cross', 'RSI_OB'];
  const returns = [0.24, -0.08, 0.45, 0.12, 0.31];
  const sharpes = [1.8, 0.3, 2.4, 0.9, 1.5];
  const winRates = [0.62, 0.38, 0.71, 0.55, 0.65];
  const drawdowns = [-0.12, -0.28, -0.08, -0.19, -0.1];
  const profitFactors = [2.1, 0.7, 3.0, 1.3, 2.5];
  const tradesCounts = [142, 87, 65, 210, 120];
  const i = index % strategies.length;

  return {
    id: `demo-${strategies[i]}-${Date.now()}-${index}`,
    strategy_id: `${strategies[i]}_Strategy`,
    metrics: {
      cagr: returns[i] * 0.8,
      sharpe_ratio: sharpes[i],
      max_drawdown: drawdowns[i],
      win_rate: winRates[i],
      profit_factor: profitFactors[i],
      total_trades: tradesCounts[i],
    },
    total_return: returns[i],
    win_rate: winRates[i],
    max_drawdown: drawdowns[i],
    sharpe_ratio: sharpes[i],
    created_at: new Date(Date.now() - index * 86400000).toISOString(),
    recommendations: [
      {
        priority: 1,
        recommendation: 'Optimize position sizing based on volatility regime.',
        expected_impact: 'Potential 15-20% improvement in risk-adjusted returns.',
        implementation: 'Implement ATR-based position sizing with a 2% risk per trade cap.',
      },
      {
        priority: 2,
        recommendation: 'Add a trend filter to reduce false signals in ranging markets.',
        expected_impact: 'Reduced max drawdown by ~25%.',
        implementation: 'Use a 200-period SMA filter: only take long signals above the SMA.',
      },
    ],
  };
}

// ---- Main Page ----
export function BacktestPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // State
  const [backtests, setBacktests] = useState<BacktestResult[]>(() => {
    try {
      const saved = localStorage.getItem('backtest_results');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBacktest, setSelectedBacktest] = useState<BacktestResult | null>(null);
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist
  React.useEffect(() => {
    try {
      const toSave = backtests.slice(0, 50);
      localStorage.setItem('backtest_results', JSON.stringify(toSave));
    } catch { /* Silently fail */ }
  }, [backtests]);

  // Filtered data
  const filteredBacktests = useMemo(() => {
    return backtests.filter((bt) => {
      const totalReturn = (bt.total_return ?? bt.metrics?.cagr ?? 0) * 100;
      const sharpe = bt.sharpe_ratio ?? bt.metrics?.sharpe_ratio ?? 0;
      const strategyId = (bt.strategy_id ?? '').toLowerCase();

      if (filters.search && !strategyId.includes(filters.search.toLowerCase())) return false;
      if (totalReturn < filters.minReturn || totalReturn > filters.maxReturn) return false;
      if (sharpe < filters.minSharpe) return false;
      if (filters.profitableOnly && totalReturn < 0) return false;
      return true;
    });
  }, [backtests, filters]);

  // Summary stats
  const stats = useMemo(() => {
    if (backtests.length === 0) return null;
    const returns = backtests.map((bt) => bt.total_return ?? bt.metrics?.cagr ?? 0);
    const sharpes = backtests.map((bt) => bt.sharpe_ratio ?? bt.metrics?.sharpe_ratio ?? 0);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const avgSharpe = sharpes.reduce((a, b) => a + b, 0) / sharpes.length;
    const bestReturnIdx = returns.indexOf(Math.max(...returns));
    const bestStrategy = backtests[bestReturnIdx]?.strategy_id?.slice(0, 12) || 'Unknown';
    return {
      count: backtests.length,
      avgReturn,
      avgSharpe,
      bestStrategy,
      bestReturn: returns[bestReturnIdx],
    };
  }, [backtests]);

  // Upload handler
  const processFile = useCallback(async (file: File) => {
    const validTypes = ['.csv', '.json'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(ext)) {
      setError(`Invalid file type "${ext}". Please upload CSV or JSON files.`);
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('File exceeds 100MB limit.');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + Math.random() * 15, 90));
    }, 300);

    try {
      const result = await apiClient.uploadBacktest(file);
      setUploadProgress(100);
      setBacktests((prev) => [result, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze backtest');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      await processFile(files[i]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      await processFile(files[i]);
    }
  };

  const handleDelete = (index: number) => {
    setBacktests((prev) => prev.filter((_, i) => i !== index));
    if (selectedBacktest && filteredBacktests[index]?.id === selectedBacktest.id) {
      setSelectedBacktest(null);
    }
  };

  const handleSelectBacktest = (bt: BacktestResult) => {
    setSelectedBacktest(bt);
    setActiveTab('detail');
  };

  const handleExportCSV = () => {
    const rows = ['Strategy,Return,Win Rate,Sharpe,Max Drawdown,Profit Factor,Trades,Date'];
    filteredBacktests.forEach((bt) => {
      rows.push([
        bt.strategy_id || 'Unknown',
        ((bt.total_return ?? 0) * 100).toFixed(2) + '%',
        ((bt.win_rate ?? 0) * 100).toFixed(2) + '%',
        (bt.sharpe_ratio ?? 0).toFixed(2),
        (Math.abs(bt.max_drawdown ?? 0) * 100).toFixed(2) + '%',
        bt.metrics?.profit_factor?.toFixed(2) ?? '-',
        bt.metrics?.total_trades?.toString() ?? '-',
        new Date(bt.created_at).toLocaleDateString(),
      ].join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backtest_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadDemoData = () => {
    const demoData = Array.from({ length: 5 }, (_, i) => createDemoBacktest(i));
    setBacktests((prev) => [...demoData, ...prev]);
  };

  const formatPercent = (v: number) => `${(v * 100).toFixed(1)}%`;

  return (
    <div
      className="min-h-screen p-4 md:p-6 lg:p-8"
      style={{
        backgroundColor: isDark ? '#121212' : '#F5F5F5',
        fontFamily: "'Quicksand', sans-serif",
      }}
    >
      {/* Page Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold uppercase tracking-widest md:text-3xl"
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            color: isDark ? '#FFFFFF' : '#212121',
          }}
        >
          Backtest Analysis
        </h1>
        <p className="mt-1 text-sm" style={{ color: isDark ? '#9E9E9E' : '#757575' }}>
          Upload, analyze, and compare your strategy backtest results with AI-powered insights
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className="mb-6 flex w-full justify-start gap-1 overflow-x-auto rounded-lg border p-1"
          style={{
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderColor: isDark ? '#333' : '#E5E5E5',
          }}
        >
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:shadow-sm"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: '0.5px',
            }}
          >
            <Layers size={15} />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="detail"
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:shadow-sm"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: '0.5px',
            }}
            disabled={!selectedBacktest}
          >
            <BarChart3 size={15} />
            <span className="hidden sm:inline">Detail</span>
            {selectedBacktest && (
              <Badge
                className="ml-1 h-4 px-1 text-[10px]"
                style={{ backgroundColor: '#FEC00F', color: '#212121' }}
              >
                1
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="compare"
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:shadow-sm"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: '0.5px',
            }}
            disabled={backtests.length < 2}
          >
            <GitCompare size={15} />
            <span className="hidden sm:inline">Compare</span>
          </TabsTrigger>
        </TabsList>

        {/* ============ OVERVIEW TAB ============ */}
        <TabsContent value="overview" className="flex flex-col gap-6">
          {/* Upload Zone */}
          <Card
            className="border"
            style={{
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderColor: isDark ? '#333' : '#E5E5E5',
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ fontFamily: "'Rajdhani', sans-serif", color: isDark ? '#F5F5F5' : '#212121' }}
              >
                Upload Backtest Results
              </CardTitle>
              <CardDescription
                className="text-xs"
                style={{ color: isDark ? '#757575' : '#9E9E9E' }}
              >
                Drag & drop or click to upload CSV/JSON files for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {error && (
                <div
                  className="flex items-center gap-2 rounded-lg p-3 text-sm"
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#EF4444',
                  }}
                >
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 md:p-14"
                style={{
                  borderColor: dragActive
                    ? '#FEC00F'
                    : isDark
                    ? '#424242'
                    : '#D0D0D0',
                  backgroundColor: dragActive
                    ? isDark
                      ? 'rgba(254,192,15,0.05)'
                      : 'rgba(254,192,15,0.03)'
                    : 'transparent',
                }}
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2
                      size={36}
                      className="animate-spin"
                      style={{ color: '#FEC00F' }}
                    />
                    <p
                      className="text-sm font-medium"
                      style={{ color: isDark ? '#F5F5F5' : '#212121' }}
                    >
                      Analyzing backtest...
                    </p>
                    <Progress value={uploadProgress} className="h-1.5 w-48" />
                  </div>
                ) : (
                  <>
                    <Upload size={36} style={{ color: isDark ? '#555' : '#BDBDBD' }} />
                    <p
                      className="mt-3 text-sm font-medium"
                      style={{ color: isDark ? '#F5F5F5' : '#212121' }}
                    >
                      {dragActive ? 'Drop files here...' : 'Click or drag files to upload'}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: isDark ? '#757575' : '#9E9E9E' }}>
                      CSV, JSON - Max 100MB - Supports multiple files
                    </p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleUpload}
                accept=".csv,.json"
                multiple
                className="hidden"
              />

              {backtests.length === 0 && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadDemoData}
                    className="flex items-center gap-2"
                    style={{
                      borderColor: '#FEC00F',
                      color: '#FEC00F',
                    }}
                  >
                    <FileText size={14} />
                    Load Demo Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats Row */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Total Backtests"
                value={stats.count.toString()}
                icon={<Layers size={20} />}
                color="#3B82F6"
                isDark={isDark}
              />
              <StatCard
                label="Avg Return"
                value={formatPercent(stats.avgReturn)}
                sub={stats.avgReturn >= 0 ? 'Positive overall' : 'Negative overall'}
                icon={stats.avgReturn >= 0 ? <TrendingUp size={20} /> : <ArrowUpDown size={20} />}
                color={stats.avgReturn >= 0 ? '#22C55E' : '#EF4444'}
                isDark={isDark}
              />
              <StatCard
                label="Avg Sharpe"
                value={stats.avgSharpe.toFixed(2)}
                sub={stats.avgSharpe >= 1 ? 'Good risk-adjusted' : 'Below threshold'}
                icon={<BarChart3 size={20} />}
                color="#FEC00F"
                isDark={isDark}
              />
              <StatCard
                label="Best Strategy"
                value={stats.bestStrategy}
                sub={formatPercent(stats.bestReturn)}
                icon={<TrendingUp size={20} />}
                color="#A78BFA"
                isDark={isDark}
              />
            </div>
          )}

          {/* Filters + Table */}
          {backtests.length > 0 ? (
            <div className="flex flex-col gap-4">
              <BacktestFilters
                filters={filters}
                onFiltersChange={setFilters}
                resultCount={filteredBacktests.length}
                totalCount={backtests.length}
              />
              <BacktestTable
                data={filteredBacktests}
                onSelect={handleSelectBacktest}
                onDelete={handleDelete}
                onExport={handleExportCSV}
                selectedId={selectedBacktest?.id}
              />
            </div>
          ) : (
            !uploading && (
              <Card
                className="border"
                style={{
                  backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                  borderColor: isDark ? '#333' : '#E5E5E5',
                }}
              >
                <CardContent className="flex flex-col items-center py-16 text-center">
                  <TrendingUp
                    size={56}
                    style={{ color: isDark ? '#333' : '#E0E0E0', marginBottom: '16px' }}
                  />
                  <p
                    className="text-base font-medium"
                    style={{ color: isDark ? '#9E9E9E' : '#757575' }}
                  >
                    No backtests yet. Upload a file or load demo data to get started.
                  </p>
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>

        {/* ============ DETAIL TAB ============ */}
        <TabsContent value="detail">
          {selectedBacktest ? (
            <BacktestDetail
              backtest={selectedBacktest}
              onBack={() => setActiveTab('overview')}
              onFeedback={() => setFeedbackOpen(true)}
            />
          ) : (
            <Card
              className="border"
              style={{
                backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                borderColor: isDark ? '#333' : '#E5E5E5',
              }}
            >
              <CardContent className="flex flex-col items-center py-16 text-center">
                <BarChart3
                  size={56}
                  style={{ color: isDark ? '#333' : '#E0E0E0', marginBottom: '16px' }}
                />
                <p
                  className="text-base font-medium"
                  style={{ color: isDark ? '#9E9E9E' : '#757575' }}
                >
                  Select a backtest from the Overview tab to view detailed analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============ COMPARE TAB ============ */}
        <TabsContent value="compare">
          <BacktestCompare backtests={backtests} />
        </TabsContent>
      </Tabs>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        strategyId={selectedBacktest?.strategy_id}
        originalPrompt={`Backtest analysis for strategy ${selectedBacktest?.strategy_id}`}
      />
    </div>
  );
}

export default BacktestPage;
