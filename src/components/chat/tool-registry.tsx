'use client';

/**
 * Tool Registry — Maps tool names to their generative UI components.
 *
 * invoke_skill is handled dynamically in renderToolPart() — it routes
 * to the correct card based on the skill_slug in the tool input, not
 * the tool name itself. Do NOT add a static invoke_skill entry here.
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
  SkillResultCard,
  DCFModelCard,
  BubbleDetectorCard,
  FinancialResearchCard,
  DocInterpreterCard,
} from '@/components/generative-ui';
import PersistentGenerationCard from '@/components/generative-ui/PersistentGenerationCard';
import DocumentGenerationCard from '@/components/generative-ui/DocumentGenerationCard';
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

type ToolRenderMode = 'standard' | 'persistent' | 'document-generation' | 'flight-search';

interface ToolRegistryEntry {
  component: React.ComponentType<any>;
  mode?: ToolRenderMode;
  displayName?: string;
}

// ─── invoke_skill Slug Sets ───────────────────────────────────────────────────
// These determine which card invoke_skill renders based on the skill_slug.
// Normalised to lowercase with underscores (hyphens replaced).

const INVOKE_FILE_SLUGS = new Set([
  'potomac_xlsx',
  'potomac_pptx',
  'potomac_pptx_skill',
  'potomac_docx_skill',
  'dcf_model',
  'datapack_builder',
  'build_datapack',
]);

const INVOKE_RESEARCH_SLUGS = new Set([
  'financial_deep_research',
  'run_financial_deep_research',
  'initiating_coverage',
  'equity_research',
  'deep_research',
]);

const INVOKE_BACKTEST_SLUGS = new Set([
  'backtest_expert',
  'run_backtest_analysis',
  'backtesting_frameworks',
]);

const INVOKE_QUANT_SLUGS = new Set([
  'quant_analyst',
  'run_quant_analysis',
]);

const INVOKE_BUBBLE_SLUGS = new Set([
  'us_market_bubble_detector',
  'run_bubble_detection',
  'detect_bubble',
  'bubble_analysis',
]);

const INVOKE_DOC_INTERPRETER_SLUGS = new Set([
  'doc_interpreter',
  'interpret_document',
  'extract_document',
  'read_document',
]);

const INVOKE_AFL_SLUGS = new Set([
  'amibroker_afl_developer',
  'afl_developer',
  'generate_afl',
  'afl_generate',
  'afl_code',
  'create_afl',
  'write_afl',
  'afl_strategy',
  'amibroker',
  'afl',
]);

const INVOKE_DCF_SLUGS = new Set([
  'dcf_model',
  'run_dcf_model',
  'create_dcf_model',
]);

// ─── Tool Registry ────────────────────────────────────────────────────────────

const TOOL_REGISTRY: Record<string, ToolRegistryEntry> = {

  // ── Market Data ──────────────────────────────────────────────────────────
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

  // ── Code & Knowledge Base ────────────────────────────────────────────────
  execute_python:           { component: CodeExecution },
  search_knowledge_base:    { component: KnowledgeBaseResults },
  code_sandbox:             { component: CodeSandbox },

  // ── AFL Tools ────────────────────────────────────────────────────────────
  generate_afl_code:        { component: AFLGenerateCard },
  validate_afl:             { component: AFLValidateCard },
  debug_afl_code:           { component: AFLDebugCard },
  explain_afl_code:         { component: AFLExplainCard },
  sanity_check_afl:         { component: AFLSanityCheckCard },
  generate_afl:             { component: AFLGenerateCard, displayName: 'AFL Generator' },
  afl_generate:             { component: AFLGenerateCard, displayName: 'AFL Generator' },
  afl_code:                 { component: AFLGenerateCard, displayName: 'AFL Code' },
  create_afl:               { component: AFLGenerateCard, displayName: 'AFL Creator' },
  write_afl:                { component: AFLGenerateCard, displayName: 'AFL Writer' },
  afl_strategy:             { component: AFLGenerateCard, displayName: 'AFL Strategy' },
  amibroker:                { component: AFLGenerateCard, displayName: 'AmiBroker' },
  afl:                      { component: AFLGenerateCard, displayName: 'AFL' },

  // ── Web Search ───────────────────────────────────────────────────────────
  web_search:               { component: WebSearchResults },
  brave_search:             { component: WebSearchResults,     displayName: 'Web Search' },
  search_web:               { component: WebSearchResults,     displayName: 'Web Search' },
  web_search_tool:          { component: WebSearchResults,     displayName: 'Web Search' },
  internet_search:          { component: WebSearchResults,     displayName: 'Web Search' },

  // ── Lifestyle / Utility ──────────────────────────────────────────────────
  get_live_scores:          { component: LiveSportsScores },
  get_search_trends:        { component: SearchTrends },
  create_linkedin_post:     { component: LinkedInPost },
  preview_website:          { component: WebsitePreview },
  order_food:               { component: FoodOrder },
  track_flight:             { component: FlightTracker },

  // ── Flight Search (special wrapper) ─────────────────────────────────────
  search_flights:           { component: FlightSearchCard, mode: 'flight-search' },
  get_flights:              { component: FlightSearchCard, mode: 'flight-search' },
  find_flights:             { component: FlightSearchCard, mode: 'flight-search' },

  // ── Direct Skill Tool Calls (not via invoke_skill) ───────────────────────
  execute_skill:            { component: SkillResultCard,      displayName: 'Skill Execution' },
  run_skill:                { component: SkillResultCard,      displayName: 'Skill Execution' },

  // DCF / Valuation
  dcf_model:                { component: DCFModelCard,         displayName: 'DCF Model' },
  run_dcf_model:            { component: DCFModelCard,         displayName: 'DCF Model' },
  create_dcf_model:         { component: DCFModelCard,         displayName: 'DCF Model' },

  // Market Bubble Detection
  us_market_bubble_detector:{ component: BubbleDetectorCard,  displayName: 'Bubble Detector' },
  detect_bubble:            { component: BubbleDetectorCard,  displayName: 'Bubble Detector' },
  bubble_analysis:          { component: BubbleDetectorCard,  displayName: 'Bubble Detector' },
  run_bubble_detection:     { component: BubbleDetectorCard,  displayName: 'Bubble Detector' },

  // Financial Research
  financial_deep_research:  { component: FinancialResearchCard, displayName: 'Financial Research' },
  deep_research:            { component: FinancialResearchCard, displayName: 'Financial Research' },
  initiating_coverage:      { component: FinancialResearchCard, displayName: 'Initiating Coverage' },
  equity_research:          { component: FinancialResearchCard, displayName: 'Equity Research' },
  run_financial_deep_research: { component: FinancialResearchCard, displayName: 'Financial Research' },

  // Document Interpreter
  doc_interpreter:          { component: DocInterpreterCard,  displayName: 'Document Interpreter' },
  interpret_document:       { component: DocInterpreterCard,  displayName: 'Document Interpreter' },
  extract_document:         { component: DocInterpreterCard,  displayName: 'Document Interpreter' },
  read_document:            { component: DocInterpreterCard,  displayName: 'Document Interpreter' },

  // Quant / Backtest
  quant_analyst:            { component: SkillResultCard,      displayName: 'Quant Analyst' },
  run_quant_analysis:       { component: SkillResultCard,      displayName: 'Quant Analyst' },
  backtest_expert:          { component: SkillResultCard,      displayName: 'Backtest Expert' },
  run_backtest_analysis:    { component: SkillResultCard,      displayName: 'Backtest Analysis' },
  backtesting_frameworks:   { component: SkillResultCard,      displayName: 'Backtesting Frameworks' },

  // AFL Developer
  amibroker_afl_developer:  { component: AFLGenerateCard,     displayName: 'AFL Developer' },
  afl_developer:            { component: AFLGenerateCard,     displayName: 'AFL Developer' },

  // Generic skill cards
  ai_elements:              { component: SkillResultCard,      displayName: 'AI Elements' },
  artifacts_builder:        { component: SkillResultCard,      displayName: 'Artifacts Builder' },

  // ── Document Generation (direct tool calls, not via invoke_skill) ─────────
  create_word_document:     { component: DocumentGenerationCard, mode: 'document-generation' },
  create_pptx_with_skill:   { component: DocumentGenerationCard, mode: 'document-generation' },
  create_presentation:      { component: DocumentGenerationCard, mode: 'document-generation' },
  create_document:          { component: DocumentGenerationCard, mode: 'document-generation' },
  create_docx:              { component: DocumentGenerationCard, mode: 'document-generation' },
  generate_document:        { component: DocumentGenerationCard, mode: 'document-generation' },
  generate_docx:            { component: DocumentGenerationCard, mode: 'document-generation' },
  create_word_doc:          { component: DocumentGenerationCard, mode: 'document-generation' },
  create_pptx:              { component: DocumentGenerationCard, mode: 'document-generation' },
  generate_pptx:            { component: DocumentGenerationCard, mode: 'document-generation' },
  generate_presentation:    { component: DocumentGenerationCard, mode: 'document-generation' },
  create_powerpoint:        { component: DocumentGenerationCard, mode: 'document-generation' },
  create_xlsx:              { component: DocumentGenerationCard, mode: 'document-generation' },
  generate_xlsx:            { component: DocumentGenerationCard, mode: 'document-generation' },
  create_spreadsheet:       { component: DocumentGenerationCard, mode: 'document-generation' },
  generate_spreadsheet:     { component: DocumentGenerationCard, mode: 'document-generation' },
  create_excel:             { component: DocumentGenerationCard, mode: 'document-generation' },
  create_pdf:               { component: DocumentGenerationCard, mode: 'document-generation' },
  generate_pdf:             { component: DocumentGenerationCard, mode: 'document-generation' },
  potomac_docx:             { component: DocumentGenerationCard, mode: 'document-generation' },
  potomac_pptx:             { component: DocumentGenerationCard, mode: 'document-generation' },
  potomac_xlsx:             { component: DocumentGenerationCard, mode: 'document-generation' },
  create_potomac_docx:      { component: DocumentGenerationCard, mode: 'document-generation' },
  create_potomac_pptx:      { component: DocumentGenerationCard, mode: 'document-generation' },
  create_potomac_xlsx:      { component: DocumentGenerationCard, mode: 'document-generation' },
  datapack_builder:         { component: DocumentGenerationCard, mode: 'document-generation' },
  build_datapack:           { component: DocumentGenerationCard, mode: 'document-generation' },
};

// ─── Error Component ──────────────────────────────────────────────────────────

function ToolError({ toolName, errorText }: { toolName: string; errorText?: string }) {
  return (
    <div style={{
      padding: '12px',
      backgroundColor: 'var(--error-dim)',
      borderRadius: '12px',
      marginTop: '8px',
      color: 'var(--error)',
      fontSize: '13px',
    }}>
      {toolName.replace(/_/g, ' ')} error: {errorText || 'Unknown error'}
    </div>
  );
}

// ─── invoke_skill Router ──────────────────────────────────────────────────────
// Determines the correct card for invoke_skill based on the skill_slug in input.

function renderInvokeSkill(
  part: ToolPartState,
  pIdx: number,
  messageId: string,
  conversationId?: string | null,
  externalOutput?: any,
): React.ReactNode {
  // Normalise slug: lowercase, hyphens → underscores
  const rawSlug = part.input?.skill_slug || '';
  const slug = rawSlug.toLowerCase().replace(/-/g, '_');
  const displaySlug = rawSlug || 'invoke_skill';

  // ── File-producing skills → DocumentGenerationCard (ALL states) ─────────
  // This MUST come before the early-return switch below so the rich generation
  // animation is shown for DOCX / PPTX / XLSX / datapack skills.
  if (INVOKE_FILE_SLUGS.has(slug)) {
    return (
      <DocumentGenerationCard
        key={pIdx}
        toolCallId={part.toolCallId || `${messageId}_${pIdx}`}
        toolName={slug || 'invoke_skill'}
        input={part.input}
        output={part.state === 'output-available' ? part.output : undefined}
        externalOutput={externalOutput}
        state={part.state as any}
        errorText={part.errorText}
        conversationId={conversationId || undefined}
      />
    );
  }

  // ── Analysis/Research skills → specific cards (check FIRST) ─────────────
  let Component: React.ComponentType<any> | null = null;

  if (INVOKE_RESEARCH_SLUGS.has(slug))       Component = FinancialResearchCard;
  else if (INVOKE_BUBBLE_SLUGS.has(slug))    Component = BubbleDetectorCard;
  else if (INVOKE_DOC_INTERPRETER_SLUGS.has(slug)) Component = DocInterpreterCard;
  else if (INVOKE_AFL_SLUGS.has(slug))       Component = AFLGenerateCard;
  else if (INVOKE_DCF_SLUGS.has(slug))       Component = DCFModelCard;
  else if (INVOKE_BACKTEST_SLUGS.has(slug))  Component = SkillResultCard;
  else if (INVOKE_QUANT_SLUGS.has(slug))     Component = SkillResultCard;
  else                                       Component = SkillResultCard;

  // Always use SkillResultCard for ALL non-file skills — fast and clean
  switch (part.state) {
    case 'input-streaming':
    case 'input-available':
      return <ToolLoading key={pIdx} toolName={displaySlug} input={part.input} />;
    case 'output-available':
      return (
        <SkillResultCard
          key={pIdx}
          skill={slug}
          skill_name={displaySlug}
          {...(typeof part.output === 'object' && part.output ? part.output : {})}
        />
      );
    case 'output-error':
      return <ToolError key={pIdx} toolName={displaySlug} errorText={part.errorText} />;
    default:
      return null;
  }
}

// ─── Main Render Function ─────────────────────────────────────────────────────

export function renderToolPart(
  part: ToolPartState,
  pIdx: number,
  messageId: string,
  conversationId?: string | null,
  externalOutput?: any,
): React.ReactNode {
  // Handle new backend format: "tool-invocation" with separate toolName field
  // Also handle legacy format: "tool-{tool_name}" in type field
  let toolName: string;
  if (part.type === 'dynamic-tool') {
    toolName = part.toolName || 'unknown';
  } else if (part.type === 'tool-invocation') {
    // New backend format: type="tool-invocation", toolName="actual_tool_name"
    toolName = part.toolName || 'unknown';
  } else if (part.type?.startsWith('tool-')) {
    // Legacy format: type="tool-get_stock_data"
    toolName = part.type.replace('tool-', '');
  } else {
    toolName = 'unknown';
  }

  // ── invoke_skill: dynamic routing by skill_slug ────────────────────────────
  if (toolName === 'invoke_skill') {
    return renderInvokeSkill(part, pIdx, messageId, conversationId, externalOutput);
  }

  const entry = TOOL_REGISTRY[toolName];

  // ── Standard tool ──────────────────────────────────────────────────────────
  if (entry && (!entry.mode || entry.mode === 'standard')) {
    const loadingName = entry.displayName || toolName;
    switch (part.state) {
      case 'input-streaming':
      case 'input-available':
        return <ToolLoading key={pIdx} toolName={loadingName} input={part.input} />;
      case 'output-available': {
        const Component = entry.component;
        return (
          <Component
            key={pIdx}
            {...(typeof part.output === 'object' && part.output ? part.output : {})}
          />
        );
      }
      case 'output-error':
        return <ToolError key={pIdx} toolName={toolName} errorText={part.errorText} />;
      default:
        return null;
    }
  }

  // ── Document generation ────────────────────────────────────────────────────
  if (entry?.mode === 'document-generation') {
    return (
      <DocumentGenerationCard
        key={pIdx}
        toolCallId={part.toolCallId || `${messageId}_${pIdx}`}
        toolName={toolName}
        input={part.input}
        output={part.state === 'output-available' ? part.output : undefined}
        externalOutput={externalOutput}
        state={part.state as any}
        errorText={part.errorText}
        conversationId={conversationId || undefined}
      />
    );
  }

  // ── Persistent (legacy) ────────────────────────────────────────────────────
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

  // ── Flight search ──────────────────────────────────────────────────────────
  if (entry?.mode === 'flight-search') {
    switch (part.state) {
      case 'input-streaming':
      case 'input-available':
        return <ToolLoading key={pIdx} toolName="search_flights" input={part.input} />;
      case 'output-available':
        return (
          <FlightSearchCard
            key={pIdx}
            data={(typeof part.output === 'object' && part.output ? part.output : {}) as any}
          />
        );
      case 'output-error':
        return <ToolError key={pIdx} toolName="search_flights" errorText={part.errorText} />;
      default:
        return null;
    }
  }

  // ── Unknown / dynamic tool — smart fallback ────────────────────────────────
  return renderDynamicTool(part, pIdx, toolName);
}

// ─── Dynamic / Unknown Tool Renderer ─────────────────────────────────────────

function renderDynamicTool(
  part: ToolPartState,
  pIdx: number,
  toolName: string,
): React.ReactNode {
  if (part.state === 'output-available' && typeof part.output === 'object' && part.output) {
    const out = part.output as any;

    // Has a download URL → show download card
    if (
      out.download_url || out.document_id || out.file_id ||
      /document|docx|pptx|xlsx|word|presentation|powerpoint|excel|spreadsheet/.test(toolName)
    ) {
      return <DocumentDownloadCard key={pIdx} output={out} />;
    }

    // Web search shape → show search card
    if (
      out.results && Array.isArray(out.results) && out.results[0]?.url &&
      /search|web/.test(toolName)
    ) {
      return <WebSearchResults key={pIdx} {...out} />;
    }
  }

  // Generic AI Elements fallback
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

// ─── isToolPart ───────────────────────────────────────────────────────────────

export function isToolPart(partType: string): boolean {
  return partType?.startsWith('tool-') || partType === 'dynamic-tool' || partType === 'tool-invocation';
}
