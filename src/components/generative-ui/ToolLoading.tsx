'use client';

import React from 'react';
import { Loader2, Terminal, Database, DollarSign, Globe, Code2, Shield, Bug, BookOpen, Wand2, Zap } from 'lucide-react';

const toolMeta: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  execute_python: { icon: <Terminal size={16} />, label: 'Executing Python code...', color: '#22c55e' },
  search_knowledge_base: { icon: <Database size={16} />, label: 'Searching knowledge base...', color: '#3b82f6' },
  get_stock_data: { icon: <DollarSign size={16} />, label: 'Fetching stock data...', color: '#FEC00F' },
  get_stock_chart: { icon: <DollarSign size={16} />, label: 'Loading stock chart...', color: '#FEC00F' },
  technical_analysis: { icon: <DollarSign size={16} />, label: 'Running technical analysis...', color: '#818cf8' },
  get_weather: { icon: <Globe size={16} />, label: 'Getting weather data...', color: '#38bdf8' },
  get_news: { icon: <Globe size={16} />, label: 'Fetching news headlines...', color: '#f97316' },
  create_chart: { icon: <DollarSign size={16} />, label: 'Creating data chart...', color: '#a78bfa' },
  code_sandbox: { icon: <Code2 size={16} />, label: 'Running code sandbox...', color: '#22c55e' },
  web_search: { icon: <Globe size={16} />, label: 'Searching the web...', color: '#7c3aed' },
  validate_afl: { icon: <Shield size={16} />, label: 'Validating AFL code...', color: '#22c55e' },
  generate_afl_code: { icon: <Wand2 size={16} />, label: 'Generating AFL code...', color: '#FEC00F' },
  debug_afl_code: { icon: <Bug size={16} />, label: 'Debugging AFL code...', color: '#818cf8' },
  explain_afl_code: { icon: <BookOpen size={16} />, label: 'Explaining AFL code...', color: '#3b82f6' },
  sanity_check_afl: { icon: <Shield size={16} />, label: 'Running AFL sanity check...', color: '#22c55e' },
  get_live_scores: { icon: <Zap size={16} />, label: 'Fetching live scores...', color: '#f97316' },
  get_search_trends: { icon: <Globe size={16} />, label: 'Loading search trends...', color: '#7c3aed' },
  create_linkedin_post: { icon: <Globe size={16} />, label: 'Creating LinkedIn post...', color: '#0077B5' },
  preview_website: { icon: <Globe size={16} />, label: 'Generating website preview...', color: '#3b82f6' },
  order_food: { icon: <Zap size={16} />, label: 'Finding food options...', color: '#FEC00F' },
  track_flight: { icon: <Globe size={16} />, label: 'Tracking flight...', color: '#3b82f6' },
  search_flights: { icon: <Globe size={16} />, label: 'Searching for flights...', color: '#FEC00F' },
};

interface ToolLoadingProps {
  toolName: string;
  input?: Record<string, any>;
}

export function ToolLoading({ toolName, input }: ToolLoadingProps) {
  const meta = toolMeta[toolName] || { icon: <Zap size={16} />, label: `Running ${toolName}...`, color: '#FEC00F' };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 16px',
      borderRadius: '12px',
      backgroundColor: `${meta.color}10`,
      border: `1px solid ${meta.color}30`,
      maxWidth: '480px',
      marginTop: '8px',
      animation: 'pulse 2s ease-in-out infinite',
    }}>
      <div style={{ color: meta.color, display: 'flex', alignItems: 'center' }}>
        {meta.icon}
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color: meta.color }}>
        {meta.label}
      </span>
      <Loader2 size={14} color={meta.color} style={{ animation: 'spin 1s linear infinite', marginLeft: 'auto' }} />
      
      {/* Show key input params */}
      {input && Object.keys(input).length > 0 && (
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginLeft: '4px' }}>
          {input.symbol && `(${input.symbol})`}
          {input.query && `"${input.query.slice(0, 30)}${input.query.length > 30 ? '...' : ''}"`}
          {input.description && `"${input.description.slice(0, 30)}${input.description.length > 30 ? '...' : ''}"`}
        </div>
      )}
    </div>
  );
}

export default ToolLoading;
