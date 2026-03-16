'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useResearcher } from '../hooks/useResearcher';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  Users, 
  Calendar,
  Loader2,
  AlertCircle,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

export const StrategyAnalysis: React.FC = () => {
  const router = useRouter();
  const { analyzeStrategyFit, loading, error } = useResearcher();
  
  const [symbol, setSymbol] = useState('');
  const [strategyType, setStrategyType] = useState('moving_average_crossover');
  const [timeframe, setTimeframe] = useState('daily');

  const strategyTypes = [
    { value: 'moving_average_crossover', label: 'Moving Average Crossover' },
    { value: 'momentum', label: 'Momentum' },
    { value: 'mean_reversion', label: 'Mean Reversion' },
    { value: 'breakout', label: 'Breakout' },
    { value: 'trend_following', label: 'Trend Following' },
    { value: 'pairs_trading', label: 'Pairs Trading' }
  ];

  const timeframes = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const handleAnalyze = async () => {
    if (!symbol.trim()) {
      toast.error('Please enter a stock symbol');
      return;
    }

    try {
      const result = await analyzeStrategyFit(symbol.trim().toUpperCase(), strategyType, timeframe);
      toast.success('Strategy analysis completed');
      console.log('Analysis result:', result);
    } catch (err) {
      toast.error(`Failed to analyze strategy: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Strategy Analysis</h1>
            <p className="text-gray-600">Analyze how well trading strategies fit current market conditions</p>
          </div>
          <Button onClick={() => router.push('/researcher')} variant="outline">
            Back to Researcher
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Analysis Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Search className="h-6 w-6 text-blue-600" />
            Strategy Fit Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Symbol</label>
              <Input
                placeholder="Enter stock symbol (e.g., AAPL, MSFT)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="h-12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Strategy Type</label>
              <select
                value={strategyType}
                onChange={(e) => setStrategyType(e.target.value)}
                className="w-full h-12 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {strategyTypes.map((strategy) => (
                  <option key={strategy.value} value={strategy.value}>
                    {strategy.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full h-12 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeframes.map((tf) => (
                  <option key={tf.value} value={tf.value}>
                    {tf.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button 
            onClick={handleAnalyze}
            disabled={loading || !symbol.trim()}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
            Analyze Strategy Fit
          </Button>
        </CardContent>
      </Card>

      {/* Strategy Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Moving Average Crossover */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Moving Average Crossover
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Buy when short MA crosses above long MA, sell when it crosses below. 
              Works best in trending markets.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Best Market:</span>
                <span className="font-medium">Trending</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Risk Level:</span>
                <span className="font-medium">Medium</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Timeframe:</span>
                <span className="font-medium">Daily/Weekly</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => {
                setStrategyType('moving_average_crossover');
                toast.info('Strategy type set to Moving Average Crossover');
              }}
            >
              Select Strategy
            </Button>
          </CardContent>
        </Card>

        {/* Momentum */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Momentum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Buy stocks with strong recent performance, sell those with weak performance.
              Captures price momentum and trend continuation.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Best Market:</span>
                <span className="font-medium">Bullish</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Risk Level:</span>
                <span className="font-medium">High</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Timeframe:</span>
                <span className="font-medium">Weekly/Monthly</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => {
                setStrategyType('momentum');
                toast.info('Strategy type set to Momentum');
              }}
            >
              Select Strategy
            </Button>
          </CardContent>
        </Card>

        {/* Mean Reversion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-purple-600" />
              Mean Reversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Buy when prices are below average, sell when above average.
              Assumes prices will revert to their mean over time.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Best Market:</span>
                <span className="font-medium">Range-bound</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Risk Level:</span>
                <span className="font-medium">Low</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Timeframe:</span>
                <span className="font-medium">Daily</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => {
                setStrategyType('mean_reversion');
                toast.info('Strategy type set to Mean Reversion');
              }}
            >
              Select Strategy
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Users className="h-5 w-5" />
            Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-600">
            Enter a stock symbol and select a strategy type to analyze how well the strategy fits current market conditions.
            Results will appear here after analysis.
          </div>
        </CardContent>
      </Card>

      {/* Market Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Calendar className="h-5 w-5" />
            Market Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Current Market Regime</h4>
              <p className="text-gray-600 text-sm">
                Understanding the current market regime helps determine which strategies are most likely to succeed.
                Trending markets favor momentum strategies, while range-bound markets favor mean reversion.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Strategy Optimization</h4>
              <p className="text-gray-600 text-sm">
                Based on current market conditions, we can suggest optimal parameters and adjustments
                to improve your strategy's performance and risk-adjusted returns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

