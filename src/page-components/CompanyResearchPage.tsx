'use client'

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useResearcher } from '../hooks/useResearcher';
import CompanyResearchTerminal from '../components/researcher/CompanyResearchTerminal';

export const CompanyResearch: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const router = useRouter();
  const { fetchCompanyResearch, companyData, loading, error, setCurrentSymbol } = useResearcher();

  useEffect(() => {
    if (symbol) {
      setCurrentSymbol(symbol);
      fetchCompanyResearch(symbol);
    }
  }, [symbol, fetchCompanyResearch, setCurrentSymbol]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-green-400 font-mono">
        <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">COMPANY RESEARCH</span>
              <span className="text-xs text-gray-600">{symbol}</span>
            </div>
            <button
              onClick={() => router.push('/researcher')}
              className="text-xs px-3 py-1 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 text-white"
            >
              Back to Researcher
            </button>
          </div>
        </div>
        
        <div className="p-6 text-center">
          <div className="text-2xl font-bold text-white mb-2">Loading Research Data</div>
          <div className="text-gray-500">Analyzing {symbol} fundamentals and market data...</div>
          <div className="mt-8">
            <div className="w-8 h-8 border-2 border-gray-600 border-t-green-400 rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-green-400 font-mono">
        <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-sm text-gray-400">COMPANY RESEARCH</span>
              <span className="text-xs text-gray-600">{symbol}</span>
            </div>
            <button
              onClick={() => router.push('/researcher')}
              className="text-xs px-3 py-1 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 text-white"
            >
              Back to Researcher
            </button>
          </div>
        </div>
        
        <div className="p-6 text-center">
          <div className="text-2xl font-bold text-red-400 mb-2">Error Loading Research Data</div>
          <div className="text-gray-500 mb-4">{error}</div>
          <button
            onClick={() => router.push('/researcher')}
            className="text-xs px-4 py-2 bg-red-500/20 border border-red-500/50 rounded hover:bg-red-500/30 text-red-400"
          >
            Return to Researcher
          </button>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="min-h-screen bg-gray-950 text-green-400 font-mono">
        <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-sm text-gray-400">COMPANY RESEARCH</span>
              <span className="text-xs text-gray-600">{symbol}</span>
            </div>
            <button
              onClick={() => router.push('/researcher')}
              className="text-xs px-3 py-1 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 text-white"
            >
              Back to Researcher
            </button>
          </div>
        </div>
        
        <div className="p-6 text-center">
          <div className="text-2xl font-bold text-white mb-2">No Research Data Available</div>
          <div className="text-gray-500 mb-4">Please search for a valid stock symbol to begin research.</div>
          <button
            onClick={() => router.push('/researcher')}
            className="text-xs px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded hover:bg-blue-500/30 text-blue-400"
          >
            Return to Researcher
          </button>
        </div>
      </div>
    );
  }

  return (
    <CompanyResearchTerminal symbol={symbol || ''} />
  );
};