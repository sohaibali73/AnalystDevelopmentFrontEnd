'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Search, 
  TrendingUp, 
  Users, 
  BarChart3, 
  FileText,
  Building2,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useResponsive } from '@/hooks/useResponsive';

export default function Researcher() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [symbol, setSymbol] = useState('');

  const handleCompanyResearch = () => {
    if (!symbol.trim()) {
      toast.error('Please enter a stock symbol');
      return;
    }
    router.push(`/researcher/company/${symbol.trim().toUpperCase()}`);
  };

  const features = [
    {
      icon: Building2,
      title: 'Company Research',
      description: 'Deep dive into company fundamentals, financials, and market analysis',
      action: () => handleCompanyResearch(),
      buttonText: 'Research Company',
      color: 'blue'
    },
    {
      icon: TrendingUp,
      title: 'Strategy Analysis',
      description: 'Analyze trading strategy fit for current market conditions',
      action: () => router.push('/researcher/strategy'),
      buttonText: 'Analyze Strategy',
      color: 'green'
    },
    {
      icon: Users,
      title: 'Peer Comparison',
      description: 'Compare companies against industry peers and benchmarks',
      action: () => router.push('/researcher/compare'),
      buttonText: 'Compare Peers',
      color: 'purple'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Research Hub</h1>
        <p className="text-lg text-gray-600">
          Advanced tools for company research, strategy analysis, and peer comparison
        </p>
      </div>

      {/* Quick Search */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Search className="h-6 w-6 text-blue-600" />
            Quick Company Research
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter stock symbol (e.g., AAPL, MSFT, GOOGL)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCompanyResearch()}
              className="h-12 text-lg"
            />
            <Button 
              onClick={handleCompanyResearch}
              size="lg"
              className="flex items-center gap-2 px-8"
            >
              <Search className="h-5 w-5" />
              Research
            </Button>
          </div>
          <div className="mt-4 flex gap-2">
            <span className="text-sm text-gray-600">Popular:</span>
            {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'].map((ticker) => (
              <Button
                key={ticker}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSymbol(ticker);
                  router.push(`/researcher/company/${ticker}`);
                }}
              >
                {ticker}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card 
            key={index} 
            className="hover:shadow-xl transition-all duration-300 border-2 hover:border-gray-300"
          >
            <CardHeader>
              <div className={`w-12 h-12 rounded-lg bg-${feature.color}-100 flex items-center justify-center mb-4`}>
                <feature.icon className={`h-6 w-6 text-${feature.color}-600`} />
              </div>
              <CardTitle className="text-xl">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">{feature.description}</p>
              <Button 
                onClick={feature.action}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                {feature.buttonText}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Research Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-gray-700" />
            Research Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-lg">Fundamental Analysis</h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">â€¢</span>
                  <span>Comprehensive financial statement analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">â€¢</span>
                  <span>Key metrics and valuation ratios</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">â€¢</span>
                  <span>Growth trends and profitability analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">â€¢</span>
                  <span>Industry comparison and benchmarking</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-lg">Technical & Strategy Analysis</h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">â€¢</span>
                  <span>Trading strategy fit and optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">â€¢</span>
                  <span>Market regime detection and analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">â€¢</span>
                  <span>Peer group comparison and ranking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">â€¢</span>
                  <span>Risk-adjusted performance metrics</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card className="bg-gradient-to-br from-gray-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-gray-700" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                <h5 className="font-semibold mb-1">Enter a Stock Symbol</h5>
                <p className="text-gray-600 text-sm">
                  Use the quick search above or navigate to specific research tools
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                <h5 className="font-semibold mb-1">Choose Your Analysis Type</h5>
                <p className="text-gray-600 text-sm">
                  Company research, strategy analysis, or peer comparison
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div>
                <h5 className="font-semibold mb-1">Review Insights & Data</h5>
                <p className="text-gray-600 text-sm">
                  Get comprehensive analysis and actionable insights
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


