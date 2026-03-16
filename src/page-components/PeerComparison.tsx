'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useResearcher } from '../hooks/useResearcher';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Building,
  Loader2,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export const PeerComparison: React.FC = () => {
  const router = useRouter();
  const { getPeerComparison, loading, error } = useResearcher();
  
  const [symbol, setSymbol] = useState('');
  const [peers, setPeers] = useState<string[]>([]);
  const [peerInput, setPeerInput] = useState('');

  const handleAddPeer = () => {
    const peer = peerInput.trim().toUpperCase();
    if (peer && !peers.includes(peer)) {
      setPeers([...peers, peer]);
      setPeerInput('');
    }
  };

  const handleRemovePeer = (peerToRemove: string) => {
    setPeers(peers.filter(peer => peer !== peerToRemove));
  };

  const handleCompare = async () => {
    if (!symbol.trim()) {
      toast.error('Please enter a stock symbol');
      return;
    }

    if (peers.length === 0) {
      toast.error('Please add at least one peer for comparison');
      return;
    }

    try {
      const result = await getPeerComparison(symbol.trim().toUpperCase(), peers);
      toast.success('Peer comparison completed');
      console.log('Comparison result:', result);
    } catch (err) {
      toast.error(`Failed to compare peers: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const samplePeers = [
    { sector: 'Technology', peers: ['MSFT', 'GOOGL', 'AMZN', 'META'] },
    { sector: 'Finance', peers: ['JPM', 'BAC', 'WFC', 'C'] },
    { sector: 'Healthcare', peers: ['JNJ', 'PFE', 'MRK', 'ABBV'] },
    { sector: 'Consumer', peers: ['PG', 'KO', 'PEP', 'MO'] }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Peer Comparison</h1>
            <p className="text-gray-600">Compare companies against peers and industry benchmarks</p>
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

      {/* Comparison Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600" />
            Company Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company to Analyze</label>
              <Input
                placeholder="Enter stock symbol (e.g., AAPL)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="h-12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Peer Companies</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter peer symbol (e.g., MSFT)"
                  value={peerInput}
                  onChange={(e) => setPeerInput(e.target.value)}
                  className="h-12"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPeer()}
                />
                <Button onClick={handleAddPeer} size="lg" className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Selected Peers */}
          {peers.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Selected Peers</label>
              <div className="flex flex-wrap gap-2">
                {peers.map((peer) => (
                  <Badge key={peer} variant="secondary" className="text-lg px-3 py-1 flex items-center gap-2">
                    {peer}
                    <button
                      onClick={() => handleRemovePeer(peer)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={handleCompare}
            disabled={loading || !symbol.trim() || peers.length === 0}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Users className="h-5 w-5" />
            )}
            Compare Companies
          </Button>
        </CardContent>
      </Card>

      {/* Sample Peer Groups */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Building className="h-6 w-6 text-green-600" />
            Sample Peer Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {samplePeers.map((group, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">{group.sector}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {group.peers.map((peer) => (
                      <div key={peer} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{peer}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!peers.includes(peer)) {
                              setPeers([...peers, peer]);
                              toast.success(`${peer} added to comparison`);
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Valuation Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Valuation Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">P/E Ratio</span>
                <span className="font-medium">Relative valuation</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price/Book</span>
                <span className="font-medium">Asset-based valuation</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price/Sales</span>
                <span className="font-medium">Revenue-based valuation</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">EV/EBITDA</span>
                <span className="font-medium">Enterprise value multiple</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Growth Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Growth Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Revenue Growth</span>
                <span className="font-medium">Sales expansion rate</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Earnings Growth</span>
                <span className="font-medium">Profit expansion rate</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">EPS Growth</span>
                <span className="font-medium">Earnings per share growth</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Dividend Growth</span>
                <span className="font-medium">Payout growth rate</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profitability Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Profitability Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Net Margin</span>
                <span className="font-medium">Net profit as % of revenue</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ROE</span>
                <span className="font-medium">Return on equity</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ROA</span>
                <span className="font-medium">Return on assets</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ROIC</span>
                <span className="font-medium">Return on invested capital</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Comparison Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Users className="h-5 w-5" />
            Comparison Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-600">
            Enter a company symbol and add peer companies to compare key metrics and performance indicators.
            Results will appear here after comparison.
          </div>
        </CardContent>
      </Card>

      {/* Analysis Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Building className="h-5 w-5" />
            Analysis Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Relative Valuation</h4>
              <p className="text-gray-600 text-sm">
                Compare valuation multiples to identify undervalued or overvalued companies
                relative to their peers. Consider growth rates and profitability when interpreting.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Competitive Positioning</h4>
              <p className="text-gray-600 text-sm">
                Analyze market share, growth rates, and profitability to understand each
                company's competitive advantages and market position.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

