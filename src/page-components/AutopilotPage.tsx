'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Minus,
  Square,
  X,
  Search,
  Wifi,
  Volume2,
  Battery,
  ChevronUp,
  ChevronDown,
  MousePointer2,
  Brain,
  Layers,
  Zap,
  Activity,
  Clock,
  Mail,
  FileSpreadsheet,
  Globe,
  FileCode,
  FileText,
  Send,
  Paperclip,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Download,
  Save,
  ZoomIn,
  ZoomOut,
  Star,
  TrendingUp,
  TrendingDown,
  Copy,
  Share2,
  Undo,
  Redo,
  Pause,
  Plus,
  Check,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LogEntry {
  id: number;
  time: string;
  action: string;
  status: 'success' | 'active' | 'pending';
  app?: string;
}

type AppKey = 'amibroker' | 'afl-editor' | 'optuma' | 'outlook' | 'excel' | 'edge' | 'word';

/* ------------------------------------------------------------------ */
/*  Comprehensive Expanded Demo Actions -- 55+ steps                   */
/* ------------------------------------------------------------------ */

const DEMO_ACTIONS: Omit<LogEntry, 'id'>[] = [
  { time: '00:01', action: 'Yang initialized -- scanning desktop environment', status: 'success' },
  { time: '00:03', action: 'Identified 7 applications to manage. Beginning workflow...', status: 'success' },
  { time: '00:04', action: 'Analyzing user patterns from previous sessions', status: 'success' },

  // Phase 1: AmiBroker Chart Analysis
  { time: '00:06', action: 'Opening AmiBroker -- loading Gold Index CDE workspace', status: 'active', app: 'amibroker' },
  { time: '00:08', action: 'Applying DEMA overlay to candlestick chart', status: 'success', app: 'amibroker' },
  { time: '00:10', action: 'Analyzing support/resistance at 69.40 and 81.20 levels', status: 'success', app: 'amibroker' },
  { time: '00:12', action: 'Identifying bullish divergence on volume indicator', status: 'success', app: 'amibroker' },
  { time: '00:14', action: 'Exporting chart snapshot as GoldIndex_2025.png', status: 'success', app: 'amibroker' },

  // Phase 2: AFL Formula Development
  { time: '00:16', action: 'Opening AFL Formula Editor in AmiBroker', status: 'active', app: 'afl-editor' },
  { time: '00:18', action: 'Writing new strategy: Freddy & Marla Bull Trading Algorithm', status: 'active', app: 'afl-editor' },
  { time: '00:20', action: 'Coding Buy = Cross(MACD(), Signal()) with optimized params', status: 'success', app: 'afl-editor' },
  { time: '00:22', action: 'Adding risk management: PositionSize = -2 (% risk model)', status: 'success', app: 'afl-editor' },
  { time: '00:24', action: 'Implementing trailing stop: ApplyStop(stopTypeTrailing, 3%)', status: 'success', app: 'afl-editor' },
  { time: '00:26', action: 'Setting backtest range 2015-2025, verifying syntax...', status: 'success', app: 'afl-editor' },
  { time: '00:28', action: 'Running backtest: 347 trades, 62% win rate, +142% return', status: 'success', app: 'afl-editor' },
  { time: '00:30', action: 'Saving formula as FMBull_v1.afl to strategies folder', status: 'success', app: 'afl-editor' },

  // Phase 3: Optuma Advanced Analysis
  { time: '00:32', action: 'Switching to Optuma -- opening AUD/USD daily chart', status: 'active', app: 'optuma' },
  { time: '00:34', action: 'Drawing Fibonacci retracement from 0.617 to 0.715', status: 'success', app: 'optuma' },
  { time: '00:36', action: 'Checking RSI divergence -- bearish signal at 42.31', status: 'success', app: 'optuma' },
  { time: '00:38', action: 'Applying Gann Fan from recent swing low', status: 'success', app: 'optuma' },
  { time: '00:40', action: 'Adding 14-period RSI indicator to sub-panel', status: 'success', app: 'optuma' },
  { time: '00:42', action: 'Annotating key support zone at 0.6680-0.6700', status: 'success', app: 'optuma' },
  { time: '00:44', action: 'Saving chart workspace and exporting as PDF', status: 'success', app: 'optuma' },

  // Phase 4: Email Communication
  { time: '00:46', action: 'Opening Outlook -- composing market analysis email', status: 'active', app: 'outlook' },
  { time: '00:48', action: 'To: trading-team@yangcapital.com | Subject: Daily Market Brief', status: 'active', app: 'outlook' },
  { time: '00:50', action: 'Drafting executive summary: Gold bullish, AUD/USD bearish setup', status: 'success', app: 'outlook' },
  { time: '00:52', action: 'Inserting key findings and trade recommendations', status: 'success', app: 'outlook' },
  { time: '00:54', action: 'Attaching: GoldIndex_2025.png, FMBull_v1.afl, AUDUSD_chart.pdf', status: 'success', app: 'outlook' },
  { time: '00:56', action: 'Applying HTML formatting and company signature', status: 'success', app: 'outlook' },
  { time: '00:58', action: 'Email sent successfully to 4 recipients + BCC: archive', status: 'success', app: 'outlook' },
  { time: '01:00', action: 'Creating calendar reminder for 3PM market close review', status: 'success', app: 'outlook' },

  // Phase 5: Excel Portfolio Analytics
  { time: '01:02', action: 'Opening Excel -- creating portfolio risk assessment', status: 'active', app: 'excel' },
  { time: '01:04', action: 'Importing live data: 12 positions across Stocks, FX, Commodities', status: 'active', app: 'excel' },
  { time: '01:06', action: 'Building position summary table with current P&L', status: 'success', app: 'excel' },
  { time: '01:08', action: 'Calculating Value at Risk (VaR) using historical method', status: 'success', app: 'excel' },
  { time: '01:10', action: 'Computing Sharpe Ratio: 1.87 (excellent risk-adjusted return)', status: 'success', app: 'excel' },
  { time: '01:12', action: 'Analyzing Max Drawdown: -8.3% (within acceptable limits)', status: 'success', app: 'excel' },
  { time: '01:14', action: 'Building PivotTable: Performance by Asset Class', status: 'success', app: 'excel' },
  { time: '01:16', action: 'Applying conditional formatting heat map to correlations', status: 'success', app: 'excel' },
  { time: '01:18', action: 'Creating dashboard with sparklines and KPI cards', status: 'success', app: 'excel' },
  { time: '01:20', action: 'Saved as Portfolio_Risk_Assessment_2025-02-17.xlsx', status: 'success', app: 'excel' },

  // Phase 6: Web Research & Data Gathering
  { time: '01:22', action: 'Opening Edge browser -- researching RBA policy decision', status: 'active', app: 'edge' },
  { time: '01:24', action: 'Tab 1: Navigating to RBA.gov.au official statement', status: 'active', app: 'edge' },
  { time: '01:26', action: 'Tab 2: Opening Bloomberg terminal for market reaction', status: 'success', app: 'edge' },
  { time: '01:28', action: 'Tab 3: Reuters article on inflation outlook', status: 'success', app: 'edge' },
  { time: '01:30', action: 'Extracting key data: Cash rate 4.35%, dovish forward guidance', status: 'success', app: 'edge' },
  { time: '01:32', action: 'Analyzing market consensus: 65% expect cut by Q3 2025', status: 'success', app: 'edge' },
  { time: '01:34', action: 'Copying key quotes and data points to clipboard', status: 'success', app: 'edge' },
  { time: '01:36', action: 'Bookmarking sources for future reference', status: 'success', app: 'edge' },

  // Phase 7: Document Creation & Reporting
  { time: '01:38', action: 'Opening Word -- drafting Weekly Strategy Report', status: 'active', app: 'word' },
  { time: '01:40', action: 'Applying corporate template with header/footer', status: 'success', app: 'word' },
  { time: '01:42', action: 'Writing executive summary (300 words)', status: 'active', app: 'word' },
  { time: '01:44', action: 'Inserting chart images from AmiBroker and Optuma', status: 'success', app: 'word' },
  { time: '01:46', action: 'Adding Market Outlook section with RBA analysis', status: 'success', app: 'word' },
  { time: '01:48', action: 'Creating Trade Recommendations table (5 setups)', status: 'success', app: 'word' },
  { time: '01:50', action: 'Formatting with styles: Heading 1, Body Text, Quote', status: 'success', app: 'word' },
  { time: '01:52', action: 'Inserting table of contents and page numbers', status: 'success', app: 'word' },
  { time: '01:54', action: 'Document complete: 12 pages with professional layout', status: 'success', app: 'word' },
  { time: '01:56', action: 'Saved as Weekly_Strategy_Report_Week07_2025.docx', status: 'success', app: 'word' },
  { time: '01:58', action: 'Exporting PDF version for distribution', status: 'success', app: 'word' },

  // Phase 8: Learning & Automation
  { time: '02:00', action: 'Yang learning user workflow pattern: Morning briefing sequence', status: 'active' },
  { time: '02:02', action: 'Identified automation opportunity: Daily chart analysis routine', status: 'success' },
  { time: '02:04', action: 'Creating macro for automated AmiBroker → Optuma → Email flow', status: 'success' },
  { time: '02:06', action: 'Stored workflow template: "Daily_Market_Analysis.yangflow"', status: 'success' },
  { time: '02:08', action: 'All 58 tasks complete. 7 applications managed. 0 errors.', status: 'success' },
  { time: '02:10', action: 'Ready to execute learned workflow autonomously tomorrow', status: 'success' },
];

/* ------------------------------------------------------------------ */
/*  StatusDot                                                          */
/* ------------------------------------------------------------------ */

function StatusDot({ status }: { status: string }) {
  const bg = status === 'success' ? '#10b981' : status === 'active' ? '#FEC00F' : '#64748b';
  return <span className="inline-block w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: bg }} />;
}

/* ------------------------------------------------------------------ */
/*  Win11 Title Bar                                                    */
/* ------------------------------------------------------------------ */

function Win11TitleBar({
  title,
  icon,
  bgColor,
  textColor,
  isActive,
}: {
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  isActive: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between select-none flex-shrink-0"
      style={{ background: bgColor, height: 32, paddingLeft: 10, paddingRight: 0, opacity: isActive ? 1 : 0.85 }}
    >
      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
        {icon}
        <span className="truncate" style={{ color: textColor, fontSize: 12, fontWeight: 500 }}>{title}</span>
      </div>
      <div className="flex items-center h-full flex-shrink-0">
        <div className="flex items-center justify-center h-full transition-colors hover:bg-white/10" style={{ width: 46, color: textColor }}>
          <Minus size={14} />
        </div>
        <div className="flex items-center justify-center h-full transition-colors hover:bg-white/10" style={{ width: 46, color: textColor }}>
          <Square size={11} />
        </div>
        <div className="flex items-center justify-center h-full transition-colors hover:bg-white/10" style={{ width: 46, color: textColor, borderRadius: '0 8px 0 0' }}>
          <X size={14} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AmiBroker Window                                                   */
/* ------------------------------------------------------------------ */

function AmiBrokerWindow({ isActive, yangWorking }: { isActive: boolean; yangWorking: boolean }) {
  const windowStyle: React.CSSProperties = {
    boxShadow: isActive ? '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)' : '0 4px 16px rgba(0,0,0,0.3)',
    opacity: isActive ? 1 : 0.7,
    transition: 'all 0.4s ease',
  };

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden" style={windowStyle}>
      <Win11TitleBar
        title="AmiBroker - [RWV] - Sprott Physical Gold Index CDE - [Daily]"
        icon={<div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ background: '#e8912d' }}><span style={{ fontSize: 8, fontWeight: 800, color: '#fff' }}>AB</span></div>}
        bgColor="#2d2d2d" textColor="#cccccc" isActive={isActive}
      />
      {/* Menu bar */}
      <div className="flex items-center gap-0 px-1" style={{ background: '#383838', height: 24 }}>
        {['File', 'Edit', 'View', 'Insert', 'Symbol', 'Analysis', 'Window', 'Help'].map((m) => (
          <span key={m} className="px-2 py-0.5 text-[11px] cursor-default" style={{ color: '#ccc' }}>{m}</span>
        ))}
      </div>
      {/* Tabs */}
      <div className="flex items-center gap-1 px-2" style={{ background: '#333', height: 28, borderBottom: '1px solid #222' }}>
        <div className="flex items-center px-2 rounded" style={{ background: '#444', height: 20 }}>
          <span style={{ fontSize: 9, color: '#aaa' }}>RWV (Daily)</span>
        </div>
        <div className="flex items-center px-2 rounded" style={{ background: '#5a4a1a', border: '1px solid #8a7a2a', height: 20 }}>
          <span style={{ fontSize: 9, color: '#FFD700' }}>CI RWV (Daily)</span>
        </div>
      </div>
      {/* Content */}
      <div className="flex flex-1 min-h-0" style={{ background: '#1a1a1a' }}>
        {/* Indicator tree */}
        <div className="flex-shrink-0 overflow-y-auto" style={{ width: 150, background: '#252525', borderRight: '1px solid #333' }}>
          <div className="p-1.5 space-y-0.5">
            <div className="text-[9px] font-bold text-[#4ec9b0] pl-1">Formulas</div>
            {['DEMA - Double Exp MA', 'EMA5 - Displaced MA', 'Linear Regression', 'TEMA - Triple Exp', 'WMA - Weighted MA'].map((f, i) => (
              <div key={i} className="flex items-center gap-1 px-1 py-0.5 hover:bg-[#333] rounded cursor-default">
                <span style={{ fontSize: 8, color: '#569cd6' }}>{'>'}</span>
                <span style={{ fontSize: 9, color: '#bbb' }}>{f}</span>
              </div>
            ))}
            <div className="text-[9px] font-bold text-[#4ec9b0] pl-1 mt-2">Basic Charts</div>
            {['Candlestick', 'Standard Price', 'Volume', 'Spread'].map((f, i) => (
              <div key={i} className="flex items-center gap-1 px-1 py-0.5 hover:bg-[#333] rounded cursor-default">
                <span style={{ fontSize: 8, color: '#4ec9b0' }}>{'>'}</span>
                <span style={{ fontSize: 9, color: '#bbb' }}>{f}</span>
              </div>
            ))}
            <div className="text-[9px] font-bold text-[#4ec9b0] pl-1 mt-2">Custom</div>
            {['CoppockBolton', 'DPCompound', 'GUPPYHIST'].map((f, i) => (
              <div key={i} className="flex items-center gap-1 px-1 py-0.5 hover:bg-[#333] rounded cursor-default">
                <span style={{ fontSize: 8, color: '#ce9178' }}>{'>'}</span>
                <span style={{ fontSize: 9, color: '#bbb' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Chart area */}
        <div className="flex-1 relative overflow-hidden" style={{ background: '#1e1e1e' }}>
          {/* Y-axis labels */}
          <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between py-2 pr-1" style={{ width: 36, fontSize: 8, color: '#777' }}>
            {['87', '81', '75', '69', '63', '57', '51'].map((p) => (<span key={p} className="text-right">{p}</span>))}
          </div>
          {/* Grid */}
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.06 }}>
            {Array.from({ length: 10 }, (_, i) => (<line key={`v${i}`} x1={`${(i + 1) * 9}%`} y1="0" x2={`${(i + 1) * 9}%`} y2="100%" stroke="#fff" strokeWidth="0.5" />))}
            {Array.from({ length: 6 }, (_, i) => (<line key={`h${i}`} x1="0" y1={`${(i + 1) * 14}%`} x2="100%" y2={`${(i + 1) * 14}%`} stroke="#fff" strokeWidth="0.5" />))}
          </svg>
          {/* Candlestick chart */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none">
            <path d="M 50,350 Q 150,320 250,300 T 450,200 T 600,110 T 750,55" fill="none" stroke="#FFD700" strokeWidth="1.5" opacity="0.8" />
            <path d="M 50,360 Q 150,340 250,320 T 450,220 T 600,130 T 750,75" fill="none" stroke="#4ec9b0" strokeWidth="1" opacity="0.6" />
            {[
              { x: 80, o: 345, c: 335, h: 330, l: 350, up: true }, { x: 110, o: 335, c: 325, h: 320, l: 340, up: true },
              { x: 140, o: 325, c: 330, h: 322, l: 335, up: false }, { x: 170, o: 330, c: 315, h: 310, l: 335, up: true },
              { x: 200, o: 315, c: 305, h: 300, l: 320, up: true }, { x: 230, o: 305, c: 295, h: 290, l: 310, up: true },
              { x: 260, o: 295, c: 280, h: 275, l: 300, up: true }, { x: 290, o: 280, c: 270, h: 265, l: 285, up: true },
              { x: 320, o: 270, c: 260, h: 255, l: 275, up: true }, { x: 350, o: 260, c: 265, h: 258, l: 270, up: false },
              { x: 380, o: 265, c: 250, h: 245, l: 270, up: true }, { x: 410, o: 250, c: 235, h: 230, l: 255, up: true },
              { x: 440, o: 235, c: 215, h: 210, l: 240, up: true }, { x: 470, o: 215, c: 200, h: 195, l: 220, up: true },
              { x: 500, o: 200, c: 180, h: 175, l: 205, up: true }, { x: 530, o: 180, c: 165, h: 160, l: 185, up: true },
              { x: 560, o: 165, c: 150, h: 145, l: 170, up: true }, { x: 590, o: 150, c: 135, h: 130, l: 155, up: true },
              { x: 620, o: 135, c: 120, h: 115, l: 140, up: true }, { x: 650, o: 120, c: 105, h: 100, l: 125, up: true },
              { x: 680, o: 105, c: 90, h: 85, l: 110, up: true }, { x: 710, o: 90, c: 75, h: 68, l: 95, up: true },
              { x: 740, o: 75, c: 65, h: 58, l: 80, up: true },
            ].map((c, i) => (
              <g key={i}>
                <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={c.up ? '#26a69a' : '#ef5350'} strokeWidth="1" />
                <rect x={c.x - 4} y={Math.min(c.o, c.c)} width="8" height={Math.abs(c.o - c.c) || 2} fill={c.up ? '#26a69a' : '#ef5350'} />
              </g>
            ))}
          </svg>
          {/* Bottom tabs */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center" style={{ background: '#2a2a2a', height: 20, borderTop: '1px solid #444' }}>
            <span className="px-2 text-[9px]" style={{ color: '#aaa', background: '#3a3a3a' }}>Composite</span>
            <span className="px-2 text-[9px]" style={{ color: '#777' }}>Symbols</span>
            <span className="px-2 text-[9px] font-bold" style={{ color: '#FFD700', background: '#444' }}>Charts</span>
          </div>
          {yangWorking && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded z-30" style={{ background: 'rgba(254, 192, 15, 0.9)' }}>
              <Loader2 size={10} className="animate-spin" style={{ color: '#212121' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#212121' }}>Yang is working here...</span>
            </div>
          )}
        </div>
      </div>
      {/* Status bar */}
      <div className="flex items-center justify-between px-2 flex-shrink-0" style={{ background: '#2a2a2a', height: 20, borderTop: '1px solid #444' }}>
        <span style={{ fontSize: 8, color: '#777' }}>For Help, press F1</span>
        <span style={{ fontSize: 8, color: '#777' }}>NYSE Arca | S: 38.14300</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AFL Formula Editor Window                                          */
/* ------------------------------------------------------------------ */

function AFLEditorWindow({ isActive, yangWorking }: { isActive: boolean; yangWorking: boolean }) {
  const windowStyle: React.CSSProperties = {
    boxShadow: isActive ? '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)' : '0 4px 16px rgba(0,0,0,0.3)',
    opacity: isActive ? 1 : 0.7,
    transition: 'all 0.4s ease',
  };

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden" style={windowStyle}>
      <Win11TitleBar
        title="AFL Formula Editor - [RATED.afl] * RATED * AUTO-optimized"
        icon={<div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ background: '#e8912d' }}><FileCode size={10} color="#fff" /></div>}
        bgColor="#2d2d2d" textColor="#cccccc" isActive={isActive}
      />
      <div className="flex items-center gap-0 px-1" style={{ background: '#383838', height: 24 }}>
        {['File', 'Edit', 'Tools', 'Window', 'Help'].map((m) => (
          <span key={m} className="px-2 py-0.5 text-[11px] cursor-default" style={{ color: '#ccc' }}>{m}</span>
        ))}
      </div>
      <div className="flex items-center gap-1 px-2" style={{ background: '#333', height: 26, borderBottom: '1px solid #222' }}>
        {['Bb-DQ2.afl', 'BW 131 * AUTO-optimized', 'g-proExp-anim3', 's_Alpha'].map((t, i) => (
          <div key={i} className="flex items-center px-2 rounded" style={{ background: i === 1 ? '#5a4a1a' : '#444', border: i === 1 ? '1px solid #8a7a2a' : 'none', height: 18 }}>
            <span style={{ fontSize: 8, color: i === 1 ? '#FFD700' : '#aaa' }}>{t}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-3 font-mono" style={{ background: '#1e1e1e', fontSize: 10, lineHeight: 1.7 }}>
        <div><span style={{ color: '#608b4e' }}>{'// Strategy: Freddy & Marla Bull Trading Algorithm'}</span></div>
        <div><span style={{ color: '#608b4e' }}>{'// Auto-optimized by Yang AI'}</span></div>
        <div style={{ height: 6 }} />
        <div><span style={{ color: '#608b4e' }}>{'// Keep the ratio of RWI (Gold Floor Index) to Gold Futures'}</span></div>
        <div><span style={{ color: '#608b4e' }}>{'// to act as a gauge for a global GT e.g. CRN.'}</span></div>
        <div style={{ height: 6 }} />
        <div><span style={{ color: '#608b4e' }}>{'// The model supports 4 variables:'}</span></div>
        <div><span style={{ color: '#608b4e' }}>{'//   1. cMode : Upper Threshold Triggers'}</span></div>
        <div><span style={{ color: '#608b4e' }}>{'//   2. nBand : Long-term bands (lower 2.5th)'}</span></div>
        <div><span style={{ color: '#608b4e' }}>{'//   3. mBand : Short-term bands (lower 5.0)'}</span></div>
        <div><span style={{ color: '#608b4e' }}>{'//   4. qEntry: entry UT upper-band entries'}</span></div>
        <div style={{ height: 6 }} />
        <div>
          <span style={{ color: '#569cd6' }}>_SECTION_BEGIN</span>
          <span style={{ color: '#ccc' }}>(</span>
          <span style={{ color: '#ce9178' }}>{'"Test Mode"'}</span>
          <span style={{ color: '#ccc' }}>);</span>
        </div>
        <div style={{ height: 6 }} />
        <div><span style={{ color: '#608b4e' }}>{'// Two user-selectable backtest modes:'}</span></div>
        <div>
          <span style={{ color: '#569cd6' }}>TF_01</span>
          <span style={{ color: '#ccc' }}>{' = '}</span>
          <span style={{ color: '#ce9178' }}>{'"S1 Single"'}</span>
          <span style={{ color: '#ccc' }}>;</span>
          <span style={{ color: '#608b4e' }}>{' // Single-symbol backtest'}</span>
        </div>
        <div>
          <span style={{ color: '#569cd6' }}>TF_07</span>
          <span style={{ color: '#ccc' }}>{' = '}</span>
          <span style={{ color: '#ce9178' }}>{'"S1 Trades"'}</span>
          <span style={{ color: '#ccc' }}>;</span>
          <span style={{ color: '#608b4e' }}>{' // Multi-symbol with MasterPortfolio'}</span>
        </div>
        <div style={{ height: 6 }} />
        <div><span style={{ color: '#608b4e' }}>{'// Starting capital for portfolio testing'}</span></div>
        <div>
          <span style={{ color: '#569cd6' }}>SetOption</span>
          <span style={{ color: '#ccc' }}>(</span>
          <span style={{ color: '#ce9178' }}>{'"InitialEquity"'}</span>
          <span style={{ color: '#ccc' }}>{', '}</span>
          <span style={{ color: '#b5cea8' }}>100000</span>
          <span style={{ color: '#ccc' }}>);</span>
        </div>
        <div style={{ height: 6 }} />
        <div><span style={{ color: '#608b4e' }}>{'// Fractional position size: 1000 / new positions'}</span></div>
        <div>
          <span style={{ color: '#569cd6' }}>PositionSize</span>
          <span style={{ color: '#ccc' }}>{' = '}</span>
          <span style={{ color: '#b5cea8' }}>-2</span>
          <span style={{ color: '#ccc' }}>;</span>
        </div>
        <div style={{ height: 6 }} />
        <div><span style={{ color: '#608b4e' }}>{'// Define Trading/Money Management'}</span></div>
        <div>
          <span style={{ color: '#569cd6' }}>SetOption</span>
          <span style={{ color: '#ccc' }}>(</span>
          <span style={{ color: '#ce9178' }}>{'"MaxOpenPositions"'}</span>
          <span style={{ color: '#ccc' }}>{', '}</span>
          <span style={{ color: '#b5cea8' }}>15</span>
          <span style={{ color: '#ccc' }}>);</span>
        </div>
        {yangWorking && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-4 animate-pulse" style={{ background: '#FEC00F' }} />
            <span style={{ color: '#FEC00F', fontSize: 10 }}>{'Yang is typing...'}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-2 flex-shrink-0" style={{ background: '#2a2a2a', height: 20, borderTop: '1px solid #444' }}>
        <span style={{ fontSize: 8, color: '#777' }}>Ln 47 | Col 1 | For Help, press F1</span>
        <span style={{ fontSize: 8, color: '#777' }}>AFL Syntax OK</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Optuma Window                                                      */
/* ------------------------------------------------------------------ */

function OptumaWindow({ isActive, yangWorking }: { isActive: boolean; yangWorking: boolean }) {
  const windowStyle: React.CSSProperties = {
    boxShadow: isActive ? '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)' : '0 4px 16px rgba(0,0,0,0.3)',
    opacity: isActive ? 1 : 0.7,
    transition: 'all 0.4s ease',
  };

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden" style={windowStyle}>
      <Win11TitleBar
        title="Optuma - Australian Dollar / US Dollar - AUDUSD (FX)"
        icon={<div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ background: '#1a5276' }}><span style={{ fontSize: 7, fontWeight: 800, color: '#fff' }}>O</span></div>}
        bgColor="#1a5276" textColor="#ffffff" isActive={isActive}
      />
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2" style={{ background: '#f0f0f0', height: 32, borderBottom: '1px solid #ccc' }}>
        {['File', 'New', 'Tools', 'Settings', 'Data', 'Alerts', 'Searches', 'Chat', 'Help'].map((t) => (
          <div key={t} className="flex flex-col items-center px-1.5 py-0.5 hover:bg-[#ddd] rounded cursor-default">
            <div className="w-3.5 h-3.5 rounded flex items-center justify-center" style={{ background: t === 'Data' ? '#1a5276' : '#888' }}>
              <span style={{ fontSize: 5, color: '#fff', fontWeight: 700 }}>{t.charAt(0)}</span>
            </div>
            <span style={{ fontSize: 7, color: '#444' }}>{t}</span>
          </div>
        ))}
      </div>
      {/* Tabs */}
      <div className="flex items-center" style={{ background: '#e8e8e8', height: 24, borderBottom: '1px solid #ccc' }}>
        {[{ name: 'Single Charts', active: false }, { name: 'MultiCode', active: false }, { name: 'Scripting', active: false }, { name: 'TA', active: true }].map((tab) => (
          <div key={tab.name} className="flex items-center gap-1 px-3 py-1 cursor-default"
            style={{ background: tab.active ? '#1a5276' : 'transparent', color: tab.active ? '#fff' : '#666', fontSize: 10, fontWeight: tab.active ? 600 : 400, borderRight: '1px solid #ccc' }}>
            {tab.name}
          </div>
        ))}
      </div>
      {/* Content */}
      <div className="flex flex-1 min-h-0" style={{ background: '#ffffff' }}>
        {/* Properties panel */}
        <div className="flex-shrink-0 overflow-y-auto" style={{ width: 140, background: '#fafafa', borderRight: '1px solid #ddd' }}>
          <div className="p-2 space-y-1">
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1a5276' }}>Fibonacci Retracements</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#333', marginTop: 4 }}>Properties</div>
            {['Tool Name: Fibonacci', 'Extend Right: Yes', 'Show Prices: Yes', 'Show %: Yes', 'Font Size: 15', 'Line Colour: Blue'].map((a) => (
              <div key={a} className="text-[8px] py-0.5" style={{ color: '#555' }}>{a}</div>
            ))}
            <div style={{ fontSize: 9, fontWeight: 600, color: '#333', marginTop: 6 }}>Levels</div>
            {['Level 1: 38.2', 'Level 2: 50', 'Level 3: 61.8'].map((l) => (
              <div key={l} className="text-[8px] py-0.5 flex items-center gap-1" style={{ color: '#555' }}>
                <div className="w-2 h-2 rounded-sm border flex items-center justify-center" style={{ borderColor: '#1a5276' }}>
                  <span style={{ fontSize: 5, color: '#1a5276' }}>{'x'}</span>
                </div>
                {l}
              </div>
            ))}
          </div>
        </div>
        {/* Chart area */}
        <div className="flex-1 relative overflow-hidden" style={{ background: '#ffffff' }}>
          <div className="px-2 py-0.5" style={{ borderBottom: '1px solid #eee' }}>
            <span style={{ fontSize: 9, color: '#333' }}>AUD/USD (FX) - Daily CandleStick - No Layout</span>
          </div>
          <div className="absolute top-6 left-3" style={{ fontSize: 14, fontWeight: 300, color: '#333' }}>Daily</div>
          <div className="absolute top-6 right-12 text-right" style={{ fontSize: 11, fontWeight: 300, color: '#555' }}>Australian Dollar / US Dollar</div>
          {/* Y-axis */}
          <div className="absolute right-0 top-6 bottom-14 flex flex-col justify-between pr-1" style={{ width: 40, fontSize: 7, color: '#777' }}>
            {['0.7200', '0.7000', '0.6800', '0.6600', '0.6400', '0.6200'].map((p) => (<span key={p} className="text-right">{p}</span>))}
          </div>
          {/* Chart SVG */}
          <svg className="absolute" style={{ left: 0, top: 24, width: 'calc(100% - 40px)', height: 'calc(100% - 60px)' }} viewBox="0 0 700 350" preserveAspectRatio="none">
            <line x1="0" y1="25" x2="700" y2="25" stroke="#1a5276" strokeWidth="1" opacity="0.5" />
            <text x="615" y="22" fill="#1a5276" fontSize="8">{'End: 0.71574'}</text>
            <line x1="0" y1="105" x2="700" y2="105" stroke="#cc0000" strokeWidth="1" strokeDasharray="5,3" opacity="0.5" />
            <text x="595" y="102" fill="#1a5276" fontSize="7">{'0.67803  61.8%'}</text>
            <line x1="0" y1="155" x2="700" y2="155" stroke="#cc0000" strokeWidth="1" strokeDasharray="5,3" opacity="0.4" />
            <text x="610" y="152" fill="#cc0000" fontSize="7">{'0.66638  50%'}</text>
            <line x1="0" y1="205" x2="700" y2="205" stroke="#1a5276" strokeWidth="1" strokeDasharray="5,3" opacity="0.4" />
            <text x="595" y="202" fill="#1a5276" fontSize="7">{'0.65473  38.2%'}</text>
            <line x1="0" y1="320" x2="700" y2="320" stroke="#1a5276" strokeWidth="1" opacity="0.5" />
            <text x="605" y="317" fill="#1a5276" fontSize="8">{'Start: 0.61702'}</text>
            <path d="M 20,290 Q 140,280 260,240 T 420,150 T 520,100 T 640,60 T 700,50" fill="none" stroke="#26a69a" strokeWidth="1.2" opacity="0.7" />
            {[
              { x: 40, o: 310, c: 295, h: 290, l: 315, up: true }, { x: 80, o: 295, c: 280, h: 275, l: 300, up: true },
              { x: 120, o: 280, c: 265, h: 260, l: 285, up: true }, { x: 160, o: 265, c: 250, h: 245, l: 270, up: true },
              { x: 200, o: 250, c: 240, h: 235, l: 255, up: true }, { x: 240, o: 240, c: 220, h: 215, l: 245, up: true },
              { x: 280, o: 220, c: 210, h: 205, l: 225, up: true }, { x: 320, o: 210, c: 195, h: 190, l: 215, up: true },
              { x: 360, o: 195, c: 180, h: 175, l: 200, up: true }, { x: 400, o: 180, c: 165, h: 160, l: 185, up: true },
              { x: 440, o: 165, c: 150, h: 145, l: 170, up: true }, { x: 480, o: 150, c: 135, h: 130, l: 155, up: true },
              { x: 520, o: 135, c: 120, h: 115, l: 140, up: true }, { x: 560, o: 120, c: 105, h: 100, l: 125, up: true },
              { x: 600, o: 105, c: 85, h: 78, l: 110, up: true }, { x: 640, o: 85, c: 65, h: 58, l: 90, up: true },
            ].map((c, i) => (
              <g key={i}>
                <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={c.up ? '#000' : '#cc0000'} strokeWidth="1" />
                <rect x={c.x - 3} y={Math.min(c.o, c.c)} width="6" height={Math.abs(c.o - c.c) || 2} fill={c.up ? '#000' : '#cc0000'} />
              </g>
            ))}
          </svg>
          {/* RSI panel */}
          <div className="absolute bottom-0 left-0 right-0" style={{ height: 36, borderTop: '2px solid #ddd', background: '#fafafa' }}>
            <span className="absolute top-1 left-2" style={{ fontSize: 7, color: '#333', fontWeight: 600 }}>14 Period RSI</span>
            <svg style={{ width: 'calc(100% - 40px)', height: '100%' }} viewBox="0 0 700 36" preserveAspectRatio="none">
              <line x1="0" y1="10" x2="700" y2="10" stroke="#cc0000" strokeWidth="0.5" strokeDasharray="3,2" />
              <line x1="0" y1="26" x2="700" y2="26" stroke="#1a5276" strokeWidth="0.5" strokeDasharray="3,2" />
              <path d="M 30,28 Q 100,32 200,22 T 400,14 T 560,12 T 650,20" fill="none" stroke="#1a5276" strokeWidth="1.2" />
            </svg>
            <div className="absolute top-1 right-2 px-1 rounded" style={{ background: '#1a5276', fontSize: 6, color: '#fff', fontWeight: 600 }}>42.31</div>
          </div>
          {yangWorking && (
            <div className="absolute top-8 left-2 flex items-center gap-1.5 px-2 py-1 rounded z-30" style={{ background: 'rgba(254, 192, 15, 0.9)' }}>
              <Loader2 size={10} className="animate-spin" style={{ color: '#212121' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#212121' }}>Yang is working here...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Outlook Window                                                     */
/* ------------------------------------------------------------------ */

function OutlookWindow({ isActive, yangWorking }: { isActive: boolean; yangWorking: boolean }) {
  const windowStyle: React.CSSProperties = {
    boxShadow: isActive ? '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)' : '0 4px 16px rgba(0,0,0,0.3)',
    opacity: isActive ? 1 : 0.7,
    transition: 'all 0.4s ease',
  };

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden" style={windowStyle}>
      <Win11TitleBar
        title="Outlook - New Message"
        icon={<div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ background: '#0078d4' }}><Mail size={10} color="#fff" /></div>}
        bgColor="#0078d4" textColor="#ffffff" isActive={isActive}
      />
      <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: '#f3f3f3', borderBottom: '1px solid #ddd' }}>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded" style={{ background: '#0078d4' }}>
          <Send size={10} color="#fff" />
          <span style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>Send</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#e0e0e0] cursor-default">
          <Paperclip size={10} style={{ color: '#555' }} />
          <span style={{ fontSize: 10, color: '#555' }}>Attach</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Bold size={12} style={{ color: '#555' }} />
          <Italic size={12} style={{ color: '#555' }} />
          <Underline size={12} style={{ color: '#555' }} />
          <AlignLeft size={12} style={{ color: '#555' }} />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto" style={{ background: '#ffffff' }}>
        <div className="px-4 py-2 space-y-2" style={{ borderBottom: '1px solid #eee' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: '#777', width: 40 }}>To:</span>
            <div className="flex-1 flex items-center gap-1 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: '#e8f0fe', color: '#1a5276' }}>trading-team@yangcapital.com</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: '#e8f0fe', color: '#1a5276' }}>portfolio@yangcapital.com</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: '#777', width: 40 }}>Cc:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: '#e8f0fe', color: '#1a5276' }}>risk-management@yangcapital.com</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: '#777', width: 40 }}>Subject:</span>
            <span style={{ fontSize: 11, color: '#333', fontWeight: 600 }}>Daily Market Briefing - Gold Bullish, AUD/USD Bearish Divergence</span>
          </div>
        </div>
        <div className="px-4 py-3 space-y-2" style={{ fontSize: 11, color: '#333', lineHeight: 1.6 }}>
          <p>Hi Team,</p>
          <p>{"Please find today's market analysis summary below:"}</p>
          <p style={{ fontWeight: 600 }}>1. Gold Index (CDE) - Bullish</p>
          <p style={{ fontSize: 10, color: '#555' }}>- DEMA crossover confirmed on daily timeframe</p>
          <p style={{ fontSize: 10, color: '#555' }}>- Support at 69.40, resistance at 81.20</p>
          <p style={{ fontSize: 10, color: '#555' }}>- AFL backtest ROI: +38.7% (2015-2025)</p>
          <p style={{ fontWeight: 600 }}>2. AUD/USD - Bearish Divergence</p>
          <p style={{ fontSize: 10, color: '#555' }}>- RSI divergence at 42.31</p>
          <p style={{ fontSize: 10, color: '#555' }}>- Fibonacci 61.8% resistance at 0.67803</p>
          <div className="flex items-center gap-2 mt-2 p-2 rounded" style={{ background: '#f5f5f5', border: '1px solid #eee' }}>
            <Paperclip size={12} style={{ color: '#888' }} />
            <span style={{ fontSize: 9, color: '#555' }}>Gold_Chart_AmiBroker.png</span>
            <span style={{ fontSize: 9, color: '#555' }}>|</span>
            <span style={{ fontSize: 9, color: '#555' }}>RATED_Strategy.afl</span>
          </div>
          {yangWorking && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-block w-1 h-3 animate-pulse" style={{ background: '#0078d4' }} />
              <span style={{ color: '#0078d4', fontSize: 10, fontWeight: 600 }}>Yang is composing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Excel Window                                                       */
/* ------------------------------------------------------------------ */

function ExcelWindow({ isActive, yangWorking }: { isActive: boolean; yangWorking: boolean }) {
  const headers = ['Asset', 'Class', 'Value ($)', 'Weight %', 'VaR 95%', 'Sharpe', 'Max DD'];
  const rows = [
    ['Gold CDE', 'Commodity', '142,500', '28.5%', '-4.2%', '1.82', '-12.3%'],
    ['AAPL', 'Equity', '85,200', '17.0%', '-3.1%', '1.45', '-18.7%'],
    ['AUD/USD', 'FX', '52,000', '10.4%', '-5.8%', '0.92', '-22.1%'],
    ['BTC-USD', 'Crypto', '38,400', '7.7%', '-12.4%', '0.68', '-35.2%'],
    ['US 10Y', 'Bond', '95,000', '19.0%', '-1.8%', '2.10', '-6.4%'],
    ['MSFT', 'Equity', '62,300', '12.5%', '-2.9%', '1.56', '-15.8%'],
    ['EUR/USD', 'FX', '24,600', '4.9%', '-4.0%', '1.05', '-19.3%'],
  ];

  const windowStyle: React.CSSProperties = {
    boxShadow: isActive ? '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)' : '0 4px 16px rgba(0,0,0,0.3)',
    opacity: isActive ? 1 : 0.7,
    transition: 'all 0.4s ease',
  };

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden" style={windowStyle}>
      <Win11TitleBar
        title="Excel - Portfolio_Risk_2025.xlsx"
        icon={<div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ background: '#217346' }}><FileSpreadsheet size={10} color="#fff" /></div>}
        bgColor="#217346" textColor="#ffffff" isActive={isActive}
      />
      <div className="flex items-center gap-0 px-1" style={{ background: '#f3f3f3', height: 24, borderBottom: '1px solid #ccc' }}>
        {['File', 'Home', 'Insert', 'Page Layout', 'Formulas', 'Data', 'Review'].map((m) => (
          <span key={m} className="px-2 py-0.5 text-[10px] cursor-default" style={{ color: '#333' }}>{m}</span>
        ))}
      </div>
      <div className="flex items-center gap-1 px-2" style={{ background: '#f8f8f8', height: 24, borderBottom: '1px solid #ddd' }}>
        <div className="px-2 py-0.5 rounded text-[9px]" style={{ background: '#fff', border: '1px solid #ccc', color: '#333', width: 40, textAlign: 'center' }}>D7</div>
        <div className="flex-1 px-2 py-0.5 rounded text-[9px]" style={{ background: '#fff', border: '1px solid #ccc', color: '#333' }}>{'=STDEV(C2:C8)*NORMINV(0.05,0,1)*SQRT(252)'}</div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto" style={{ background: '#ffffff' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: 9 }}>
          <thead>
            <tr>
              <th className="px-1 py-0.5 text-center" style={{ background: '#f0f0f0', border: '1px solid #ddd', color: '#777', width: 24 }}>{' '}</th>
              {headers.map((h, i) => (
                <th key={i} className="px-2 py-1 text-left font-semibold" style={{ background: '#4472c4', border: '1px solid #3563a5', color: '#fff', fontSize: 8 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                <td className="px-1 py-0.5 text-center" style={{ background: '#f0f0f0', border: '1px solid #ddd', color: '#777', fontSize: 8 }}>{ri + 1}</td>
                {row.map((cell, ci) => {
                  const isNeg = cell.startsWith('-');
                  const isHighSharpe = ci === 5 && parseFloat(cell) > 1.5;
                  let bgCol = ri % 2 === 0 ? '#f8f9fc' : '#fff';
                  if (ci === 4 && isNeg && parseFloat(cell) < -10) bgCol = '#fce4e4';
                  return (
                    <td key={ci} className="px-2 py-0.5"
                      style={{
                        border: '1px solid #e8e8e8',
                        color: isNeg ? '#c00' : isHighSharpe ? '#217346' : '#333',
                        background: bgCol,
                        fontWeight: isHighSharpe ? 700 : 400,
                      }}>
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="px-1 py-0.5 text-center" style={{ background: '#f0f0f0', border: '1px solid #ddd', color: '#777', fontSize: 8 }}>8</td>
              <td colSpan={2} className="px-2 py-0.5 font-bold" style={{ border: '1px solid #e8e8e8', color: '#333' }}>TOTAL</td>
              <td className="px-2 py-0.5 font-bold" style={{ border: '1px solid #e8e8e8', color: '#333' }}>500,000</td>
              <td className="px-2 py-0.5 font-bold" style={{ border: '1px solid #e8e8e8', color: '#333' }}>100%</td>
              <td className="px-2 py-0.5 font-bold" style={{ border: '1px solid #e8e8e8', color: '#c00' }}>-4.88%</td>
              <td className="px-2 py-0.5 font-bold" style={{ border: '1px solid #e8e8e8', color: '#217346' }}>1.37</td>
              <td className="px-2 py-0.5 font-bold" style={{ border: '1px solid #e8e8e8', color: '#c00' }}>-18.5%</td>
            </tr>
          </tbody>
        </table>
        {yangWorking && (
          <div className="flex items-center gap-1.5 px-3 py-1.5">
            <Loader2 size={10} className="animate-spin" style={{ color: '#217346' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: '#217346' }}>Yang is calculating formulas...</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-2 flex-shrink-0" style={{ background: '#217346', height: 20 }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 8, color: '#fff' }}>Sheet1</span>
          <span style={{ fontSize: 8, color: '#ffffff80' }}>Sheet2</span>
          <span style={{ fontSize: 8, color: '#ffffff80' }}>PivotAnalysis</span>
        </div>
        <span style={{ fontSize: 8, color: '#ffffff80' }}>Ready</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Edge Browser Window                                                */
/* ------------------------------------------------------------------ */

function EdgeWindow({ isActive, yangWorking }: { isActive: boolean; yangWorking: boolean }) {
  const windowStyle: React.CSSProperties = {
    boxShadow: isActive ? '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)' : '0 4px 16px rgba(0,0,0,0.3)',
    opacity: isActive ? 1 : 0.7,
    transition: 'all 0.4s ease',
  };

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden" style={windowStyle}>
      <Win11TitleBar
        title="Edge - RBA Interest Rate Decision | Reuters"
        icon={<div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0078d4, #00bcf2)' }}><Globe size={8} color="#fff" /></div>}
        bgColor="#2d2d2d" textColor="#cccccc" isActive={isActive}
      />
      <div className="flex items-center gap-1 px-2" style={{ background: '#323232', height: 34, borderBottom: '1px solid #444' }}>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#444] cursor-default"><span style={{ color: '#aaa', fontSize: 12 }}>{'<'}</span></div>
          <div className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#444] cursor-default"><span style={{ color: '#aaa', fontSize: 12 }}>{'>'}</span></div>
          <div className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#444] cursor-default"><span style={{ color: '#aaa', fontSize: 12 }}>R</span></div>
        </div>
        <div className="flex-1 flex items-center px-3 py-1 rounded-full" style={{ background: '#3a3a3a', border: '1px solid #555' }}>
          <span style={{ fontSize: 9, color: '#4caf50', marginRight: 4 }}>{'https://'}</span>
          <span style={{ fontSize: 9, color: '#ccc' }}>www.reuters.com/markets/rates/rba-interest-rate-decision-feb-2025</span>
        </div>
      </div>
      <div className="flex items-center gap-0" style={{ background: '#2d2d2d', height: 28, borderBottom: '1px solid #444' }}>
        {['Reuters - Markets', 'Bloomberg - AUD', 'RBA.gov.au'].map((t, i) => (
          <div key={i} className="flex items-center gap-1 px-3 py-1"
            style={{ background: i === 0 ? '#3a3a3a' : 'transparent', color: i === 0 ? '#fff' : '#888', fontSize: 10, borderRight: '1px solid #444' }}>
            {t}
            <span style={{ fontSize: 8, color: '#666' }}>x</span>
          </div>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-auto" style={{ background: '#1a1a1a' }}>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 18, fontWeight: 700, color: '#ff6600' }}>REUTERS</span>
            <span style={{ fontSize: 9, color: '#888' }}>{'Markets > Rates > Australia'}</span>
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            RBA Holds Cash Rate at 4.35% with Dovish Forward Guidance
          </h2>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 9, color: '#888' }}>By Yang Capital Research</span>
            <span style={{ fontSize: 9, color: '#555' }}>|</span>
            <span style={{ fontSize: 9, color: '#888' }}>February 17, 2025</span>
          </div>
          <div className="space-y-2" style={{ fontSize: 11, color: '#ccc', lineHeight: 1.6 }}>
            <p>The Reserve Bank of Australia maintained its cash rate target at 4.35% at its February meeting, matching market expectations...</p>
            <div className="p-2 rounded" style={{ background: '#252525', border: '1px solid #333' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#4caf50' }}>Key Takeaways:</div>
              <div className="space-y-0.5 mt-1" style={{ fontSize: 9, color: '#bbb' }}>
                <p>- Cash rate held at 4.35% (7th consecutive hold)</p>
                <p>{'- Dovish language: "Board will respond to incoming data"'}</p>
                <p>- Markets pricing 68% chance of cut by May 2025</p>
                <p>- AUD weakened 0.3% post-announcement to 0.6520</p>
              </div>
            </div>
          </div>
          {yangWorking && (
            <div className="flex items-center gap-1.5 mt-1">
              <Loader2 size={10} className="animate-spin" style={{ color: '#00bcf2' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#00bcf2' }}>Yang is extracting research data...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Word Document Window                                               */
/* ------------------------------------------------------------------ */

function WordWindow({ isActive, yangWorking }: { isActive: boolean; yangWorking: boolean }) {
  const windowStyle: React.CSSProperties = {
    boxShadow: isActive ? '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)' : '0 4px 16px rgba(0,0,0,0.3)',
    opacity: isActive ? 1 : 0.7,
    transition: 'all 0.4s ease',
  };

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden" style={windowStyle}>
      <Win11TitleBar
        title="Word - Weekly_Strategy_Report.docx"
        icon={<div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ background: '#2b579a' }}><FileText size={10} color="#fff" /></div>}
        bgColor="#2b579a" textColor="#ffffff" isActive={isActive}
      />
      <div className="flex items-center gap-0 px-1" style={{ background: '#f3f3f3', height: 24, borderBottom: '1px solid #ccc' }}>
        {['File', 'Home', 'Insert', 'Design', 'Layout', 'References', 'Review'].map((m) => (
          <span key={m} className="px-2 py-0.5 text-[10px] cursor-default" style={{ color: '#333' }}>{m}</span>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3" style={{ background: '#f8f8f8', height: 30, borderBottom: '1px solid #ddd' }}>
        <Bold size={12} style={{ color: '#555' }} />
        <Italic size={12} style={{ color: '#555' }} />
        <Underline size={12} style={{ color: '#555' }} />
        <div className="w-px h-4" style={{ background: '#ccc' }} />
        <AlignLeft size={12} style={{ color: '#555' }} />
        <div className="px-2 py-0.5 rounded text-[9px]" style={{ background: '#fff', border: '1px solid #ccc', color: '#333' }}>Calibri</div>
        <div className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: '#fff', border: '1px solid #ccc', color: '#333' }}>11</div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto flex justify-center" style={{ background: '#e8e8e8' }}>
        <div className="my-3 mx-2 w-full max-w-lg" style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', padding: '20px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Weekly Strategy Report</h1>
            <p style={{ fontSize: 10, color: '#777' }}>Yang Capital | Week of February 17, 2025</p>
            <div className="w-16 h-0.5 mx-auto mt-2" style={{ background: '#2b579a' }} />
          </div>
          <div className="space-y-2" style={{ fontSize: 10, color: '#333', lineHeight: 1.6 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#2b579a' }}>1. Executive Summary</h2>
            <p>Gold continues its bullish trajectory with DEMA confirmation on the daily timeframe. The AFL strategy backtest returned +38.7% over the 2015-2025 period with a maximum drawdown of -12.3%.</p>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#2b579a' }}>2. AUD/USD Technical Analysis</h2>
            <p>{"Fibonacci retracement analysis shows key resistance at the 61.8% level (0.67803). RSI divergence at 42.31 suggests bearish momentum. RBA's dovish guidance supports short AUD positions."}</p>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#2b579a' }}>3. Portfolio Risk Assessment</h2>
            <p>Portfolio VaR (95%) stands at -4.88%. Sharpe ratio of 1.37 is within acceptable range. Recommend reducing FX exposure by 2% and increasing bond allocation.</p>
            <div className="mt-2 p-2 rounded" style={{ background: '#f0f4ff', border: '1px solid #d0daf0' }}>
              <span style={{ fontSize: 9, color: '#2b579a', fontWeight: 600 }}>{'[Chart: Gold_CDE_Daily.png embedded]'}</span>
            </div>
          </div>
          {yangWorking && (
            <div className="flex items-center gap-1.5 mt-3">
              <span className="inline-block w-1 h-3 animate-pulse" style={{ background: '#2b579a' }} />
              <span style={{ color: '#2b579a', fontSize: 10, fontWeight: 600 }}>Yang is writing...</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between px-3 flex-shrink-0" style={{ background: '#2b579a', height: 20 }}>
        <span style={{ fontSize: 8, color: '#ffffff80' }}>Page 3 of 8</span>
        <span style={{ fontSize: 8, color: '#ffffff80' }}>2,847 words</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop Icon                                                       */
/* ------------------------------------------------------------------ */

function DesktopIcon({ label, color, letter }: { label: string; color: string; letter: string }) {
  return (
    <div className="flex flex-col items-center gap-1 w-[68px] py-1.5 rounded-md hover:bg-white/10 cursor-default transition-colors">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ background: color }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{letter}</span>
      </div>
      <span className="text-[10px] text-white text-center leading-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Determine visible windows per phase                                */
/* ------------------------------------------------------------------ */

function getVisibleWindows(step: number): [AppKey, AppKey] {
  if (step < 5) return ['amibroker', 'optuma'];
  if (step < 10) return ['afl-editor', 'amibroker'];
  if (step < 14) return ['optuma', 'afl-editor'];
  if (step < 19) return ['outlook', 'optuma'];
  if (step < 24) return ['excel', 'outlook'];
  if (step < 28) return ['edge', 'excel'];
  if (step < 31) return ['word', 'edge'];
  return ['amibroker', 'optuma'];
}

/* ------------------------------------------------------------------ */
/*  Cursor targets per app                                             */
/* ------------------------------------------------------------------ */

const CURSOR_TARGETS: Record<string, { x: number; y: number }> = {
  amibroker: { x: 18, y: 30 },
  'afl-editor': { x: 18, y: 35 },
  optuma: { x: 58, y: 30 },
  outlook: { x: 18, y: 30 },
  excel: { x: 18, y: 35 },
  edge: { x: 58, y: 30 },
  word: { x: 18, y: 30 },
};

/* ------------------------------------------------------------------ */
/*  App label helper                                                   */
/* ------------------------------------------------------------------ */

function getAppLabel(app: string | null): string {
  if (!app) return 'SYSTEM';
  const labels: Record<string, string> = {
    amibroker: 'AMIBROKER',
    'afl-editor': 'AFL EDITOR',
    optuma: 'OPTUMA',
    outlook: 'OUTLOOK',
    excel: 'EXCEL',
    edge: 'EDGE',
    word: 'WORD',
  };
  return labels[app] || 'SYSTEM';
}

function getAppTagColor(app: string): { bg: string; fg: string } {
  const colors: Record<string, { bg: string; fg: string }> = {
    amibroker: { bg: '#e8912d20', fg: '#e8912d' },
    'afl-editor': { bg: '#e8912d20', fg: '#e8912d' },
    optuma: { bg: '#1a527620', fg: '#1a5276' },
    outlook: { bg: '#0078d420', fg: '#0078d4' },
    excel: { bg: '#21734620', fg: '#217346' },
    edge: { bg: '#0078d420', fg: '#0078d4' },
    word: { bg: '#2b579a20', fg: '#2b579a' },
  };
  return colors[app] || { bg: '#33333320', fg: '#333' };
}

/* ------------------------------------------------------------------ */
/*  Taskbar apps config                                                */
/* ------------------------------------------------------------------ */

const TASKBAR_APPS: { key: AppKey; bg: string; icon: React.ReactNode }[] = [
  { key: 'amibroker', bg: '#e8912d', icon: <span style={{ fontSize: 7, fontWeight: 800, color: '#fff' }}>AB</span> },
  { key: 'afl-editor', bg: '#e8912d', icon: <FileCode size={10} color="#fff" /> },
  { key: 'optuma', bg: '#1a5276', icon: <span style={{ fontSize: 7, fontWeight: 800, color: '#fff' }}>O</span> },
  { key: 'outlook', bg: '#0078d4', icon: <Mail size={10} color="#fff" /> },
  { key: 'excel', bg: '#217346', icon: <FileSpreadsheet size={10} color="#fff" /> },
  { key: 'edge', bg: '#0078d4', icon: <Globe size={10} color="#fff" /> },
  { key: 'word', bg: '#2b579a', icon: <FileText size={10} color="#fff" /> },
];

/* ------------------------------------------------------------------ */
/*  Window renderer                                                    */
/* ------------------------------------------------------------------ */

function renderWindow(appKey: AppKey, isActive: boolean, yangWorking: boolean): React.ReactNode {
  switch (appKey) {
    case 'amibroker': return <AmiBrokerWindow isActive={isActive} yangWorking={yangWorking} />;
    case 'afl-editor': return <AFLEditorWindow isActive={isActive} yangWorking={yangWorking} />;
    case 'optuma': return <OptumaWindow isActive={isActive} yangWorking={yangWorking} />;
    case 'outlook': return <OutlookWindow isActive={isActive} yangWorking={yangWorking} />;
    case 'excel': return <ExcelWindow isActive={isActive} yangWorking={yangWorking} />;
    case 'edge': return <EdgeWindow isActive={isActive} yangWorking={yangWorking} />;
    case 'word': return <WordWindow isActive={isActive} yangWorking={yangWorking} />;
    default: return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AutopilotPage() {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  const [isRunning, setIsRunning] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [demoComplete, setDemoComplete] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const bg = isDark ? '#121212' : '#f5f5f5';
  const card = isDark ? '#1E1E1E' : '#ffffff';
  const border = isDark ? '#333' : '#e0e0e0';
  const text = isDark ? '#ffffff' : '#212121';
  const muted = isDark ? '#9E9E9E' : '#757575';
  const accent = '#FEC00F';
  const accentText = '#212121';

  // Clock
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startDemo = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setDemoComplete(false);
    setLogs([]);
    setActiveApp(null);
    setCurrentStep(0);
    let step = 0;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (step >= DEMO_ACTIONS.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsRunning(false);
        setDemoComplete(true);
        setActiveApp(null);
        return;
      }
      const action = DEMO_ACTIONS[step];
      setLogs((prev) => [...prev, { ...action, id: step }]);
      setCurrentStep(step);
      if (action.app) {
        setActiveApp(action.app);
        const t = CURSOR_TARGETS[action.app] || { x: 50, y: 50 };
        setCursorPos({ x: t.x + Math.random() * 18, y: t.y + Math.random() * 15 });
      } else {
        setCursorPos({ x: 35 + Math.random() * 30, y: 25 + Math.random() * 35 });
      }
      step++;
    }, 2000);
  }, [isRunning]);

  const resetDemo = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setDemoComplete(false);
    setLogs([]);
    setActiveApp(null);
    setCursorPos({ x: 50, y: 50 });
    setCurrentStep(0);
  }, []);

  const todayDate = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  const visibleWindows = getVisibleWindows(currentStep);
  const progressPercent = DEMO_ACTIONS.length > 0 ? Math.round((logs.length / DEMO_ACTIONS.length) * 100) : 0;

  return (
    <div className="min-h-screen p-4 lg:p-6" style={{ background: bg, color: text }}>
      {/* Header */}
      <div className="max-w-[1440px] mx-auto mb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold tracking-wider shadow-lg"
            style={{ background: accent, color: accentText }}>
            <Zap className="w-4 h-4" /> COMING SOON
          </div>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-center mb-1 text-balance" style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '1px' }}>
          Auto Pilot Preview
        </h1>
        <p className="text-center text-sm mb-4" style={{ color: muted }}>
          Watch Yang autonomously manage 7 applications -- writing AFL code, composing emails, building spreadsheets, researching markets, and creating reports.
        </p>

        <div className="flex justify-center mb-6">
          <button
            onClick={isRunning ? undefined : demoComplete ? resetDemo : startDemo}
            disabled={isRunning}
            className="group relative flex items-center gap-3 px-10 py-4 rounded-xl text-lg font-bold tracking-wide transition-all duration-300 disabled:cursor-not-allowed"
            style={{
              background: isRunning ? (isDark ? '#333' : '#9E9E9E') : accent,
              color: accentText,
              boxShadow: isRunning ? 'none' : '0 0 30px rgba(254, 192, 15, 0.45)',
              opacity: isRunning ? 0.6 : 1,
            }}
          >
            {isRunning ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Yang is Working...</>
            ) : demoComplete ? (
              <><RotateCcw className="w-5 h-5" /> Replay Demo</>
            ) : (
              <><Play className="w-5 h-5" /> Go into Autopilot</>
            )}
            {!isRunning && !demoComplete && (
              <span className="absolute inset-0 rounded-xl animate-ping pointer-events-none" style={{ border: '2px solid #FEC00F', opacity: 0.35 }} />
            )}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-[1440px] mx-auto grid lg:grid-cols-[1fr_300px] gap-4">
        {/* Desktop */}
        <div className="rounded-xl overflow-hidden shadow-2xl" style={{ border: `1px solid ${isDark ? '#444' : '#bbb'}` }}>
          {/* Desktop area */}
          <div className="relative" style={{ height: 600, backgroundImage: 'url(/images/win11-wallpaper.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {/* Desktop icons */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 z-[2]">
              <DesktopIcon label="AmiBroker" color="#e8912d" letter="AB" />
              <DesktopIcon label="Optuma" color="#1a5276" letter="O" />
              <DesktopIcon label="Outlook" color="#0078d4" letter="OL" />
              <DesktopIcon label="Excel" color="#217346" letter="XL" />
              <DesktopIcon label="Edge" color="#0078d4" letter="E" />
              <DesktopIcon label="Word" color="#2b579a" letter="W" />
              <DesktopIcon label="This PC" color="#0078d4" letter="PC" />
              <DesktopIcon label="Recycle Bin" color="#555" letter="R" />
            </div>

            {/* Left window */}
            <div className="absolute transition-all duration-700 ease-in-out"
              style={{ left: '7%', top: '2%', width: '48%', height: '84%', zIndex: activeApp === visibleWindows[0] ? 20 : 10 }}>
              {renderWindow(visibleWindows[0], activeApp === visibleWindows[0], isRunning && activeApp === visibleWindows[0])}
            </div>

            {/* Right window */}
            <div className="absolute transition-all duration-700 ease-in-out"
              style={{ right: '1%', top: '4%', width: '46%', height: '82%', zIndex: activeApp === visibleWindows[1] ? 20 : 10 }}>
              {renderWindow(visibleWindows[1], activeApp === visibleWindows[1], isRunning && activeApp === visibleWindows[1])}
            </div>

            {/* Cursor */}
            {isRunning && (
              <div className="absolute pointer-events-none transition-all duration-[1200ms] ease-in-out z-30"
                style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }}>
                <MousePointer2 className="w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(254,192,15,0.9)]" />
                <span className="absolute -top-1 -left-1 w-7 h-7 rounded-full animate-ping pointer-events-none" style={{ background: 'rgba(254, 192, 15, 0.3)' }} />
              </div>
            )}

            {/* Idle overlay */}
            {!isRunning && !demoComplete && logs.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-[15] bg-black/20 backdrop-blur-[1px]">
                <p className="text-white/80 text-sm font-semibold tracking-wide px-6 py-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                  {'Press "Go into Autopilot" to start the simulation'}
                </p>
              </div>
            )}

            {/* Complete overlay */}
            {demoComplete && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-[15] bg-black/30 backdrop-blur-[1px]">
                <CheckCircle2 className="w-10 h-10 mb-2" style={{ color: '#10b981' }} />
                <p className="text-white font-bold text-base">Demo Complete</p>
                <p className="text-white/60 text-xs mt-1">33 tasks executed across 7 applications -- 0 errors</p>
              </div>
            )}

            {/* Active indicator */}
            {isRunning && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg z-[25]" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-bold text-green-300 tracking-wider">AUTOPILOT ACTIVE</span>
              </div>
            )}
          </div>

          {/* Taskbar */}
          <div className="flex items-center justify-between px-3"
            style={{ height: 48, background: isDark ? 'rgba(32,32,32,0.95)' : 'rgba(243,243,243,0.95)', borderTop: `1px solid ${isDark ? '#444' : '#ddd'}`, backdropFilter: 'blur(30px)' }}>
            <div className="flex items-center gap-2">
              <ChevronUp size={14} style={{ color: isDark ? '#aaa' : '#666' }} />
            </div>
            <div className="flex items-center gap-1">
              {/* Windows logo */}
              <div className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-white/10 cursor-default">
                <svg width="16" height="16" viewBox="0 0 16 16" fill={isDark ? '#fff' : '#0078d4'}>
                  <rect x="0" y="0" width="7.2" height="7.2" rx="0.5" />
                  <rect x="8.8" y="0" width="7.2" height="7.2" rx="0.5" />
                  <rect x="0" y="8.8" width="7.2" height="7.2" rx="0.5" />
                  <rect x="8.8" y="8.8" width="7.2" height="7.2" rx="0.5" />
                </svg>
              </div>
              {/* Search */}
              <div className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-white/10 cursor-default">
                <Search size={16} style={{ color: isDark ? '#ccc' : '#555' }} />
              </div>
              {/* App icons */}
              {TASKBAR_APPS.map((app) => {
                const isVisible = visibleWindows.includes(app.key);
                const isActiveApp = activeApp === app.key;
                return (
                  <div key={app.key} className="relative w-10 h-10 flex items-center justify-center rounded-md cursor-default transition-colors"
                    style={{ background: isActiveApp ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)') : 'transparent' }}>
                    <div className="w-5 h-5 rounded-sm flex items-center justify-center" style={{ background: app.bg }}>
                      {app.icon}
                    </div>
                    {isVisible && (
                      <div className="absolute bottom-1 rounded-full" style={{ width: isActiveApp ? 12 : 4, height: 2, background: isActiveApp ? '#FEC00F' : (isDark ? '#888' : '#aaa') }} />
                    )}
                  </div>
                );
              })}
            </div>
            {/* System tray */}
            <div className="flex items-center gap-2">
              <Wifi size={13} style={{ color: isDark ? '#ccc' : '#555' }} />
              <Volume2 size={13} style={{ color: isDark ? '#ccc' : '#555' }} />
              <Battery size={13} style={{ color: isDark ? '#ccc' : '#555' }} />
              <div className="flex flex-col items-end ml-1">
                <span style={{ fontSize: 10, color: isDark ? '#ccc' : '#555', lineHeight: 1.2 }}>{currentTime}</span>
                <span style={{ fontSize: 10, color: isDark ? '#aaa' : '#777', lineHeight: 1.2 }}>{todayDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="rounded-xl overflow-hidden flex flex-col" style={{ background: card, border: `1px solid ${border}`, maxHeight: 660 }}>
          <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${border}` }}>
            <Activity className="w-4 h-4" style={{ color: accent }} />
            <span className="text-sm font-bold tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif" }}>ACTIVITY LOG</span>
            {logs.length > 0 && (
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: isDark ? '#333' : '#e0e0e0', color: muted }}>
                {logs.length}/{DEMO_ACTIONS.length}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {logs.length > 0 && (
            <div className="px-4 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${border}` }}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 9, color: muted }}>Progress</span>
                <span style={{ fontSize: 9, color: muted, fontWeight: 600 }}>{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? '#333' : '#e0e0e0' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%`, background: accent }} />
              </div>
              <div className="mt-1.5 flex items-center gap-1">
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: isDark ? '#333' : '#e8e8e8', color: text }}>
                  {getAppLabel(activeApp)}
                </span>
              </div>
            </div>
          )}

          {/* Log entries */}
          <div ref={logContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12" style={{ color: muted }}>
                <Clock className="w-8 h-8 mb-3 opacity-40" />
                <p className="text-xs text-center">Activity will appear here once the demo starts.</p>
              </div>
            ) : (
              logs.map((log) => {
                const tagColor = log.app ? getAppTagColor(log.app) : null;
                return (
                  <div key={log.id} className="flex items-start gap-2 p-2.5 rounded-lg text-xs transition-all duration-300"
                    style={{
                      background: isDark ? '#0d1117' : '#fafafa',
                      border: `1px solid ${log.status === 'success' ? 'rgba(16, 185, 129, 0.4)' : log.status === 'active' ? 'rgba(254, 192, 15, 0.4)' : border}`,
                    }}>
                    <StatusDot status={log.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-semibold" style={{ color: muted, fontSize: 10 }}>{log.time}</span>
                        {log.app && tagColor && (
                          <span className="text-[8px] font-bold px-1 py-0 rounded" style={{ background: tagColor.bg, color: tagColor.fg }}>
                            {log.app === 'afl-editor' ? 'AFL' : log.app.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span style={{ color: text, lineHeight: '1.4' }}>{log.action}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-[1440px] mx-auto grid sm:grid-cols-4 gap-4 mt-4">
        {[
          { icon: MousePointer2, title: 'Autonomous Control', desc: 'Full mouse and keyboard control across 7+ applications simultaneously.' },
          { icon: FileCode, title: 'AFL Coding', desc: 'Writes, debugs, and optimizes AmiBroker AFL strategies autonomously.' },
          { icon: Brain, title: 'Skill Acquisition', desc: 'Learns new workflows by observing -- no manual programming required.' },
          { icon: Layers, title: 'Multi-App Orchestration', desc: 'Seamlessly manages AmiBroker, Optuma, Outlook, Excel, Edge, and Word.' },
        ].map((f) => (
          <div key={f.title} className="p-4 rounded-xl" style={{ background: card, border: `1px solid ${border}` }}>
            <f.icon className="w-5 h-5 mb-2" style={{ color: accent }} />
            <h4 className="text-sm font-bold mb-1">{f.title}</h4>
            <p className="text-xs leading-relaxed" style={{ color: muted }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
