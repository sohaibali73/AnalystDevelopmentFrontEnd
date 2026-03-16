import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  Calendar,
  Users,
  Globe
} from 'lucide-react';

interface CompanyResearchTerminalProps {
  symbol: string;
}

export default function CompanyResearchTerminal({ symbol }: CompanyResearchTerminalProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950 text-green-400 font-mono p-6">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm mb-6">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">COMPANY RESEARCH TERMINAL</span>
            <span className="text-lg font-bold text-green-400">{symbol}</span>
          </div>
          <Button
            onClick={() => router.push('/researcher')}
            variant="outline"
            size="sm"
          >
            Back to Researcher
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto space-y-6">
        {/* Company Overview */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-400">
              <Building2 className="h-6 w-6" />
              Company Overview - {symbol}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">COMPANY NAME</div>
                <div className="text-lg font-semibold">{symbol} Corporation</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">SECTOR</div>
                <div className="text-lg font-semibold">Technology</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">INDUSTRY</div>
                <div className="text-lg font-semibold">Software</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Data */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-400">
              <TrendingUp className="h-6 w-6" />
              Market Data
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">PRICE</div>
                <div className="text-xl font-bold text-green-400">$150.00</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">MARKET CAP</div>
                <div className="text-xl font-bold">$1.0B</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">CHANGE</div>
                <div className="text-xl font-bold text-green-400">+2.5%</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">VOLUME</div>
                <div className="text-xl font-bold">1.2M</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Metrics */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-400">
              <DollarSign className="h-6 w-6" />
              Key Financial Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">P/E RATIO</div>
                <div className="text-lg font-semibold">25.5</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">EPS</div>
                <div className="text-lg font-semibold">$5.88</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">DIVIDEND YIELD</div>
                <div className="text-lg font-semibold">2.1%</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">ROE</div>
                <div className="text-lg font-semibold">15.2%</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">DEBT/EQUITY</div>
                <div className="text-lg font-semibold">0.45</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">PROFIT MARGIN</div>
                <div className="text-lg font-semibold">18.5%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-green-400">
                <BarChart3 className="h-5 w-5" />
                Growth Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-3">
              <div className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
                <span className="text-sm">Revenue Growth (YoY)</span>
                <span className="font-semibold text-green-400">+12.5%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
                <span className="text-sm">Earnings Growth (YoY)</span>
                <span className="font-semibold text-green-400">+8.3%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
                <span className="text-sm">EPS Growth (5Y)</span>
                <span className="font-semibold text-green-400">+15.7%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-green-400">
                <Calendar className="h-5 w-5" />
                Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-3">
              <div className="p-2 bg-gray-800/30 rounded">
                <div className="text-xs text-gray-500 mb-1">EARNINGS REPORT</div>
                <div className="text-sm">Q4 2025 - Beat Expectations</div>
              </div>
              <div className="p-2 bg-gray-800/30 rounded">
                <div className="text-xs text-gray-500 mb-1">ANALYST RATING</div>
                <div className="text-sm">Upgraded to Buy (3 analysts)</div>
              </div>
              <div className="p-2 bg-gray-800/30 rounded">
                <div className="text-xs text-gray-500 mb-1">NEWS</div>
                <div className="text-sm">New Product Launch Announced</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Research Note */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-400">
              <Globe className="h-6 w-6" />
              Research Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <p className="mb-4">
              {symbol} shows strong fundamentals with solid growth metrics and healthy profitability ratios.
              The company maintains a competitive position in its sector with consistent market share gains.
            </p>
            <p className="text-sm text-gray-500">
              Note: This is mock data for demonstration purposes. Connect to a real financial data API 
              for actual company research and analysis.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
