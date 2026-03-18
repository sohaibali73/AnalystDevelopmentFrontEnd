'use client';

/**
 * Tool Registry — Maps tool names to their generative UI components.
 *
 * Replaces the massive 500+ line switch statement in renderMessage() with a
 * declarative registry. Adding a new tool is now a single line instead of
 * ~12 lines of boilerplate per tool.
 */

import React from 'react';
import {
  StockCard,
  LiveStockChart,
  TechnicalAnalysis,
  WeatherCard,
  NewsHeadlines,
  CodeSandbox,
  DataChart,
  CodeExecution,
  KnowledgeBaseResults,
  AFLGenerateCard,
  AFLValidateCard,
  AFLDebugCard,
  AFLExplainCard,
  AFLSanityCheckCard,
  WebSearchResults,
  ToolLoading,
  StockScreener,
  StockComparison,
  SectorPerformance,
  PositionSizer,
  CorrelationMatrix,
  DividendCard,
  RiskMetrics,
  MarketOverview,
  BacktestResults,
  OptionsSnapshot,
  LiveSportsScores,
  SearchTrends,
  LinkedInPost,
  WebsitePreview,
  FoodOrder,
  FlightTracker,
  FlightSearchCard,
  // Skill result cards
  SkillResultCard,
  DCFModelCard,
  BubbleDetectorCard,
  FinancialResearchCard,
  DocInterpreterCard,
} from '@/components/generative-ui';
import PersistentGenerationCard from '@/components/generative-ui/PersistentGenerationCard';
import DocumentDownloadCard from '@/components/ai-elements/document-download-card';
import { Tool as AITool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ToolPartState {
  type: string;
  state: string;
  input?: any;
  output?: any;
  errorText?: string;
  toolCallId?: string;
  toolName?: string;
}

type ToolRenderMode = 'standard' | 'persistent' | 'flight-search';

interface ToolRegistryEntry {
  /** The React component to render for output-available state */
  component: React.ComponentType<any>;
  /** How to render: standard (loading → component), persistent (PersistentGenerationCard), flight-search (special wrapper) */
  mode?: ToolRenderMode;
  /** Display name for loading state (defaults to tool name) */
  displayName?: string;
}

// ─── Standard Tool Registry ──────────────────────────────────────────────────
// Maps tool-name → { component, mode }
// "standard" tools show ToolLoading → Component → error div
// "persistent" tools use PersistentGenerationCard for the full lifecycle

const TOOL_REGISTRY: Record<string, ToolRegistryEntry> = {
  // ── Market Data ────────────────────────────
  get_stock_data:           { component: StockCard },
  get_stock_chart:          { component: LiveStockChart },
  technical_analysis:       { component: TechnicalAnalysis },
  get_weather:              { component: WeatherCard },
  get_news:                 { component: NewsHeadlines },
  create_chart:             { component: DataChart },
  screen_stocks:            { component: StockScreener },
  compare_stocks:           { component: StockComparison },
  get_sector_performance:   { component: SectorPerformance },
  calculate_position_size:  { component: PositionSizer },
  get_correlation_matrix:   { component: CorrelationMatrix },
  get_dividend_info:        { component: DividendCard },
  calculate_risk_metrics:   { component: RiskMetrics },
  get_market_overview:      { component: MarketOverview },
  backtest_quick:           { component: BacktestResults },
  get_options_snapshot:     { component: OptionsSnapshot },

  // ── Code & KB ──────────────────────────────
  execute_python:           { component: CodeExecution },
  search_knowledge_base:    { component: KnowledgeBaseResults },
  code_sandbox:             { component: CodeSandbox },

  // ── AFL Tools ──────────────────────────────
  generate_afl_code:        { component: AFLGenerateCard },
  validate_afl:             { component: AFLValidateCard },
  debug_afl_code:           { component: AFLDebugCard },
  explain_afl_code:         { component: AFLExplainCard },
  sanity_check_afl:         { component: AFLSanityCheckCard },

  // ── Web Search (multiple aliases) ──────────
  web_search:               { component: WebSearchResults },
  brave_search:             { component: WebSearchResults, displayName: 'web_search' },
  search_web:               { component: WebSearchResults, displayName: 'web_search' },
  web_search_tool:          { component: WebSearchResults, displayName: 'web_search' },
  internet_search:          { component: WebSearchResults, displayName: 'web_search' },

  // ── Lifestyle / Utility ────────────────────
  get_live_scores:          { component: LiveSportsScores },
  get_search_trends:        { component: SearchTrends },
  create_linkedin_post:     { component: LinkedInPost },
  preview_website:          { component: WebsitePreview },
  order_food:               { component: FoodOrder },
  track_flight:             { component: FlightTracker },

  // ── Flight Search (special wrapper) ────────
  search_flights:           { component: FlightSearchCard, mode: 'flight-search' },
  get_flights:              { component: FlightSearchCard, mode: 'flight-search' },
  find_flights:             { component: FlightSearchCard, mode: 'flight-search' },

  // ── Claude Custom Beta Skills ──────────────
  // Skills that produce structured output get specialized cards;
  // all others fall through to the generic SkillResultCard.
  execute_skill:                  { component: SkillResultCard, displayName: 'Skill Execution' },
  run_skill:                      { component: SkillResultCard, displayName: 'Skill Execution' },
  // DCF / Valuation
  dcf_model:                      { component: DCFModelCard, displayName: 'DCF Model' },
  run_dcf_model:                  { component: DCFModelCard, displayName: 'DCF Model' },
  create_dcf_model:               { component: DCFModelCard, displayName: 'DCF Model' },
  // Market Bubble Detection
  us_market_bubble_detector:      { component: BubbleDetectorCard, displayName: 'Bubble Detector' },
  detect_bubble:                  { component: BubbleDetectorCard, displayName: 'Bubble Detector' },
  bubble_analysis:                { component: BubbleDetectorCard, displayName: 'Bubble Detector' },
  // Financial Research / Initiating Coverage
  financial_deep_research:        { component: FinancialResearchCard, displayName: 'Financial Research' },
  deep_research:                  { component: FinancialResearchCard, displayName: 'Financial Research' },
  initiating_coverage:            { component: FinancialResearchCard, displayName: 'Initiating Coverage' },
  equity_research:                { component: FinancialResearchCard, displayName: 'Equity Research' },
  // Document Interpreter
  doc_interpreter:                { component: DocInterpreterCard, displayName: 'Document Interpreter' },
  interpret_document:             { component: DocInterpreterCard, displayName: 'Document Interpreter' },
  extract_document:               { component: DocInterpreterCard, displayName: 'Document Interpreter' },
  read_document:                  { component: DocInterpreterCard, displayName: 'Document Interpreter' },
  // Quant / Backtest skills (generic card)
  quant_analyst:                  { component: SkillResultCard, displayName: 'Quant Analyst' },
  backtest_expert:                { component: SkillResultCard, displayName: 'Backtest Expert' },
  backtesting_frameworks:         { component: SkillResultCard, displayName: 'Backtesting Frameworks' },
  // Potomac branded skills (persistent — produce files)
  potomac_docx:                   { component: PersistentGenerationCard, mode: 'persistent' },
  potomac_pptx:                   { component: PersistentGenerationCard, mode: 'persistent' },
  potomac_xlsx:                   { component: PersistentGenerationCard, mode: 'persistent' },
  create_potomac_docx:            { component: PersistentGenerationCard, mode: 'persistent' },
  create_potomac_pptx:            { component: PersistentGenerationCard, mode: 'persistent' },
  create_potomac_xlsx:            { component: PersistentGenerationCard, mode: 'persistent' },
  // Datapack Builder (persistent — produces Excel)
  datapack_builder:               { component: PersistentGenerationCard, mode: 'persistent' },
  build_datapack:                 { component: PersistentGenerationCard, mode: 'persistent' },
  // AFL Developer skill
  amibroker_afl_developer:        { component: AFLGenerateCard, displayName: 'AFL Developer' },
  afl_developer:                  { component: AFLGenerateCard, displayName: 'AFL Developer' },
  // AI Elements / Artifacts Builder (generic)
  ai_elements:                    { component: SkillResultCard, displayName: 'AI Elements' },
  artifacts_builder:              { component: SkillResultCard, displayName: 'Artifacts Builder' },

  // ── Document Generation (persistent) ───────
  create_word_document:     { component: PersistentGenerationCard, mode: 'persistent' },
  create_pptx_with_skill:   { component: PersistentGenerationCard, mode: 'persistent' },
  create_presentation:      { component: PersistentGenerationCard, mode: 'persistent' },
  create_document:          { component: PersistentGenerationCard, mode: 'persistent' },
  create_docx:              { component: PersistentGenerationCard, mode: 'persistent' },
  generate_document:        { component: PersistentGenerationCard, mode: 'persistent' },
  generate_docx:            { component: PersistentGenerationCard, mode: 'persistent' },
  create_word_doc:          { component: PersistentGenerationCard, mode: 'persistent' },
  create_pptx:              { component: PersistentGenerationCard, mode: 'persistent' },
  generate_pptx:            { component: PersistentGenerationCard, mode: 'persistent' },
  generate_presentation:    { component: PersistentGenerationCard, mode: 'persistent' },
  create_powerpoint:        { component: PersistentGenerationCard, mode: 'persistent' },
};

// ─── Error Component ─────────────────────────────────────────────────────────

function ToolError({ toolName, errorText }: { toolName: string; errorText?: string }) {
  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderRadius: '12px',
        marginTop: '8px',
        color: '#DC2626',
        fontSize: '13px',
      }}
    >
      {toolName.replace(/_/g, ' ')} error: {errorText || 'Unknown error'}
    </div>
  );
}

// ─── Render Function ─────────────────────────────────────────────────────────

/**
 * Render a tool part using the registry.
 * Returns a React element, or null if the tool isn't in the registry.
 */
export function renderToolPart(
  part: ToolPartState,
  pIdx: number,
  messageId: string,
  conversationId?: string | null,
): React.ReactNode {
  // Extract tool name from part type
  const toolName = part.type === 'dynamic-tool'
    ? (part.toolName || 'unknown')
    : (part.type?.replace('tool-', '') || 'unknown');

  const entry = TOOL_REGISTRY[toolName];

  // ── Registered standard tool ───────────────────────────────────────────
  if (entry && (!entry.mode || entry.mode === 'standard')) {
    const loadingName = entry.displayName || toolName;
    switch (part.state) {
      case 'input-streaming':
      case 'input-available':
        return <ToolLoading key={pIdx} toolName={loadingName} input={part.input} />;
      case 'output-available': {
        const Component = entry.component;
        return <Component key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
      }
      case 'output-error':
        return <ToolError key={pIdx} toolName={toolName} errorText={part.errorText} />;
      default:
        return null;
    }
  }

  // ── Registered persistent tool (document/presentation generation) ──────
  if (entry?.mode === 'persistent') {
    return (
      <PersistentGenerationCard
        key={pIdx}
        toolCallId={part.toolCallId || `${messageId}_${pIdx}`}
        toolName={toolName}
        input={part.input}
        output={part.state === 'output-available' ? part.output : undefined}
        state={part.state as any}
        errorText={part.errorText}
        conversationId={conversationId || undefined}
      />
    );
  }

  // ── Flight search (special wrapper — FlightSearchCard expects { data }) ─
  if (entry?.mode === 'flight-search') {
    switch (part.state) {
      case 'input-streaming':
      case 'input-available':
        return <ToolLoading key={pIdx} toolName="search_flights" input={part.input} />;
      case 'output-available': {
        const flightData = typeof part.output === 'object' ? part.output : {};
        return <FlightSearchCard key={pIdx} data={flightData as any} />;
      }
      case 'output-error':
        return <ToolError key={pIdx} toolName="search_flights" errorText={part.errorText} />;
      default:
        return null;
    }
  }

  // ── Dynamic tool / unknown tool — smart detection + AI Elements fallback ─
  return renderDynamicTool(part, pIdx, toolName);
}

// ─── Dynamic / Unknown Tool Renderer ─────────────────────────────────────────

function renderDynamicTool(
  part: ToolPartState,
  pIdx: number,
  toolName: string,
): React.ReactNode {
  // Smart detection: document download output
  if (part.state === 'output-available' && typeof part.output === 'object' && part.output) {
    const out = part.output as any;

    // Document / download detection
    if (
      out.download_url || out.document_id || out.presentation_id ||
      /document|docx|pptx|word|presentation|powerpoint/.test(toolName)
    ) {
      return <DocumentDownloadCard key={pIdx} output={out} />;
    }

    // Web search results detection
    if (
      out.results && Array.isArray(out.results) && out.results[0]?.url &&
      /search|web/.test(toolName)
    ) {
      return <WebSearchResults key={pIdx} {...out} />;
    }
  }

  // Generic AI Elements Tool composable
    switch (part.state) {
      case 'input-streaming':
      case 'input-available':
        return <ToolLoading key={pIdx} toolName={toolName} input={part.input} />;
      case 'output-available':
        return (
          <AITool key={pIdx}>
            <ToolHeader type={part.type as any} state={part.state as any} toolName={toolName} />
            <ToolContent>
              <ToolInput input={part.input} />
              <ToolOutput output={part.output} errorText={part.errorText} />
            </ToolContent>
          </AITool>
        );
      case 'output-error':
        return (
          <AITool key={pIdx}>
            <ToolHeader type={part.type as any} state={part.state as any} toolName={toolName} />
            <ToolContent>
              <ToolOutput output={part.output} errorText={part.errorText} />
            </ToolContent>
          </AITool>
        );
      default:
        return null;
    }
}

/**
 * Check if a part type is a tool part (used for filtering in message rendering).
 */
export function isToolPart(partType: string): boolean {
  return partType?.startsWith('tool-') || partType === 'dynamic-tool';
}
