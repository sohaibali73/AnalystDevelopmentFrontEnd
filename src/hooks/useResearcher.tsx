import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface CompanyData {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  market_cap: number;
  price: number;
  data: any;
}

export function useResearcher() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [currentSymbol, setCurrentSymbol] = useState<string>('');

  const fetchCompanyResearch = useCallback(async (symbol: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // FIXED: Use actual API instead of mock
      const data = await api.researcher.getCompanyResearch(symbol);
      setCompanyData(data);
      setCurrentSymbol(symbol.toUpperCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch company data');
      setCompanyData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPeerComparison = useCallback(async (symbol: string, peers?: string[], sector?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // FIXED: Use actual API instead of mock
      const result = await api.researcher.getPeerComparison(symbol, peers, sector);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare peers');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeStrategyFit = useCallback(async (
    symbol: string,
    strategyType: string,
    timeframe: string,
    additionalContext?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // FIXED: Use actual API instead of mock
      const result = await api.researcher.analyzeStrategyFit(symbol, strategyType, timeframe, additionalContext);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze strategy');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // FIXED: Added additional researcher methods
  const getCompanyNews = useCallback(async (symbol: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.researcher.getCompanyNews(symbol);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch company news');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMacroContext = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.researcher.getMacroContext();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch macro context');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSecFilings = useCallback(async (symbol: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.researcher.getSecFilings(symbol);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch SEC filings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateReport = useCallback(async (
    symbol: string, 
    includePeers: boolean = true,
    includeTechnicals: boolean = true,
    includeFundamentals: boolean = true
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.researcher.generateReport(symbol, includePeers, includeTechnicals, includeFundamentals);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate research report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTrending = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.researcher.getTrending();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trending research');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    companyData,
    currentSymbol,
    setCurrentSymbol,
    fetchCompanyResearch,
    getPeerComparison,
    analyzeStrategyFit,
    // FIXED: Added new researcher methods
    getCompanyNews,
    getMacroContext,
    getSecFilings,
    generateReport,
    getTrending,
  };
}
