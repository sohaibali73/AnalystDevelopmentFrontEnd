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
  ArtifactsBuilderCard,
} from '@/components/generative-ui';
import PersistentGenerationCard from '@/components/generative-ui/PersistentGenerationCard';
import DocumentGenerationCard from '@/components/generative-ui/DocumentGenerationCard';
import AFLGenerationCard from '@/components/generative-ui/AFLGenerationCard';
import DocumentDownloadCard from '@/components/ai-elements/document-download-card';
import { Tool as AITool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { SandboxArtifactRenderer } from '@/components/sandbox';

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

const INVOKE_ARTIFACTS_SLUGS = new Set([
  'artifacts_builder',
  'artifacts-builder',
  'build_artifact',
  'create_artifact',
  'react_component',
  'component_builder',
  'react',           // Direct react skill
  'jsx',             // JSX variants
  'tsx',
  'sandbox',         // Sandbox artifacts
  'code_artifact',
  'create_react',
  'react_artifact',
]);

const INVOKE_DCF_SLUGS = new Set([
  'dcf_model',
  'run_dcf_model',
  'create_dcf_model',
]);

// Sandbox execution skills - these render with SandboxArtifactRenderer
const INVOKE_SANDBOX_SLUGS = new Set([
  'execute_sandbox',
  'executesandbox',
  'sandbox_execute',
  'run_code',
  'execute_code',
  'code_execution',
  'python_execute',
  'javascript_execute',
  'run_python',
  'run_javascript',
  'run_react',
  'sandbox',
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
  artifacts_builder:        { component: ArtifactsBuilderCard, displayName: 'Artifacts Builder' },
  
  // ── React/Artifact tools (direct tool calls) ─────────────────────────────────
  react:                    { component: ArtifactsBuilderCard, displayName: 'React' },
  jsx:                      { component: ArtifactsBuilderCard, displayName: 'JSX' },
  tsx:                      { component: ArtifactsBuilderCard, displayName: 'TSX' },
  react_artifact:           { component: ArtifactsBuilderCard, displayName: 'React Artifact' },
  create_react:             { component: ArtifactsBuilderCard, displayName: 'React Component' },
  code_artifact:            { component: ArtifactsBuilderCard, displayName: 'Code Artifact' },
  sandbox_artifact:         { component: ArtifactsBuilderCard, displayName: 'Sandbox Artifact' },

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

function ToolError({ toolName, errorText, output }: { toolName: string; errorText?: string; output?: any }) {
  // If there's output data despite the error, show it in a collapsed section
  const hasOutput = output && typeof output === 'object' && Object.keys(output).length > 0;
  const [showOutput, setShowOutput] = React.useState(false);
  
  return (
    <div style={{
      padding: '12px',
      backgroundColor: 'var(--error-dim, rgba(239,68,68,0.1))',
      borderRadius: '12px',
      marginTop: '8px',
      color: 'var(--error, #ef4444)',
      fontSize: '13px',
      border: '1px solid var(--error-border, rgba(239,68,68,0.2))',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{toolName.replace(/_/g, ' ')} error: {errorText || 'Execution failed - output may still be available'}</span>
        {hasOutput && (
          <button 
            onClick={() => setShowOutput(!showOutput)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid currentColor',
              borderRadius: '4px',
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            {showOutput ? 'Hide' : 'Show'} Output
          </button>
        )}
      </div>
      {hasOutput && showOutput && (
        <pre style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '6px',
          fontSize: '11px',
          overflow: 'auto',
          maxHeight: '200px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
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

  // ── Check if output looks like a document generation result ─────────────
  // This helps restore the correct card after page refresh even if skill_slug
  // was not properly persisted in the input.
  const output = part.output || externalOutput;
  const looksLikeDocumentOutput = output && (
    output.download_url ||
    output.downloadUrl ||
    output.file_url ||
    output.file_id ||
    output.fileId ||
    output.document_id ||
    output.presentation_id ||
    (output.filename && /\.(docx|pptx|xlsx|pdf)$/i.test(output.filename))
  );

  // ── File-producing skills → DocumentGenerationCard (ALL states) ─────────
  // This MUST come before the early-return switch below so the rich generation
  // animation is shown for DOCX / PPTX / XLSX / datapack skills.
  // Also render DocumentGenerationCard if the output looks like a document result.
  if (INVOKE_FILE_SLUGS.has(slug) || (part.state === 'output-available' && looksLikeDocumentOutput)) {
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

  // ── Check if output looks like AFL code result ──────────────────────────
  const looksLikeAFLOutput = output && (
    output.afl_code ||
    output.fixed_code ||
    output.strategy_type ||
    output.data?.afl_code ||
    output.data?.filename?.endsWith('.afl') ||
    (output.filename && output.filename.endsWith('.afl'))
  );

  // ── Check if output looks like DCF model result ────────────────────────────
  const looksLikeDCFOutput = output && (
    output.intrinsic_value ||
    output.wacc ||
    output.enterprise_value ||
    output.equity_value ||
    (output.ticker && (output.current_price || output.upside_downside))
  );

  // ── Check if output looks like React/artifact code result ───────────────────
  // Check multiple places where code might be stored
  const outputText = output?.text || output?.code || output?.data?.text || output?.data?.code || '';
  const looksLikeReactArtifact = outputText && (
    /```(jsx|tsx|react|javascript|js)\s*\n/.test(outputText) ||
    (/function\s+[A-Z][a-zA-Z]*/.test(outputText) && /<[A-Z][a-zA-Z]*[\s/>]/.test(outputText)) ||
    // Direct code property with React patterns
    (output?.code && /return\s*[\(\<]/.test(output.code) && /<[A-Z]/.test(output.code)) ||
    // Has explicit language indicator
    (output?.language && ['jsx', 'tsx', 'react'].includes(output.language?.toLowerCase()))
  );

  // ── Check if output looks like presentation result ─────────────────────────
  const looksLikePresentationOutput = output && (
    output.presentation_id ||
    output.slide_count ||
    (output.slides && Array.isArray(output.slides)) ||
    (output.title && output.theme && output.download_url)
  );

  // ── AFL skills → AFLGenerationCard (ALL states for proper lifecycle) ────────
  // This renders the full generation experience with loading animation and code preview
  if (INVOKE_AFL_SLUGS.has(slug) || looksLikeAFLOutput) {
    return (
      <AFLGenerationCard
        key={pIdx}
        toolCallId={part.toolCallId || `${messageId}_${pIdx}`}
        toolName={slug || 'afl_generation'}
        input={part.input}
        output={part.state === 'output-available' ? part.output : undefined}
        externalOutput={externalOutput}
        state={part.state as any}
        errorText={part.errorText}
        conversationId={conversationId || undefined}
      />
    );
  }

  // ── Check if output looks like sandbox execution result ─────────────────────
  // Sandbox results have: success, output, execution_time_ms, language, artifacts
  const looksLikeSandboxOutput = output && (
    (output.execution_id && output.session_id) ||
    (output.execution_time_ms !== undefined && output.language && ['python', 'javascript', 'react'].includes(output.language)) ||
    (output.display_type && ['text', 'image', 'html', 'react', 'json'].includes(output.display_type)) ||
    (output.artifacts && Array.isArray(output.artifacts) && output.artifacts.length > 0 && output.artifacts[0].artifact_id)
  );

  // ── Sandbox execution skills → SandboxArtifactRenderer ──────────────────────
  // Renders code execution results with proper artifact display (charts, React components, etc)
  if (INVOKE_SANDBOX_SLUGS.has(slug) || looksLikeSandboxOutput) {
    // For loading states, show the tool loading spinner
    if (part.state === 'input-streaming' || part.state === 'input-available') {
      return <ToolLoading key={pIdx} toolName={displaySlug || 'Code Execution'} input={part.input} />;
    }
    // For output states, render with SandboxArtifactRenderer
    if (part.state === 'output-available' || part.state === 'output-error') {
      const sandboxResult = part.output || externalOutput;
      if (sandboxResult) {
        return (
          <SandboxArtifactRenderer
            key={pIdx}
            result={sandboxResult}
          />
        );
      }
    }
  }

  // ── Artifacts Builder skills → ArtifactsBuilderCard (ALL states for live preview) ────
  // Also detect by output shape if it contains React code - INCLUDING error states with usable output
  // This ensures artifacts persist on page refresh even if the tool technically errored
  if (INVOKE_ARTIFACTS_SLUGS.has(slug) || looksLikeReactArtifact) {
    // For loading states, show the tool loading spinner
    if (part.state === 'input-streaming' || part.state === 'input-available') {
      return <ToolLoading key={pIdx} toolName={displaySlug} input={part.input} />;
    }
    // For output (including error states with usable data), render the artifacts builder with live preview
    // This allows artifacts to persist even after page refresh if we have the code
    if (part.state === 'output-available' || (part.state === 'output-error' && looksLikeReactArtifact)) {
      return (
        <ArtifactsBuilderCard
          key={pIdx}
          skill={slug}
          skill_name={displaySlug}
          success={part.state === 'output-available'}
          {...(typeof part.output === 'object' && part.output ? part.output : {})}
        />
      );
    }
  }

  // ── Analysis/Research skills → specific cards (check FIRST) ─────────────
  // Also detect card type from output shape as fallback when slug is missing
  let Component: React.ComponentType<any> = SkillResultCard;

  if (INVOKE_RESEARCH_SLUGS.has(slug))                Component = FinancialResearchCard;
  else if (INVOKE_BUBBLE_SLUGS.has(slug))             Component = BubbleDetectorCard;
  else if (INVOKE_DOC_INTERPRETER_SLUGS.has(slug))    Component = DocInterpreterCard;
  else if (INVOKE_DCF_SLUGS.has(slug) || looksLikeDCFOutput)    Component = DCFModelCard;
  else if (INVOKE_ARTIFACTS_SLUGS.has(slug) || looksLikeReactArtifact) Component = ArtifactsBuilderCard;
  else if (INVOKE_BACKTEST_SLUGS.has(slug))           Component = SkillResultCard;
  else if (INVOKE_QUANT_SLUGS.has(slug))              Component = SkillResultCard;
  // Presentation output should go to DocumentGenerationCard for consistent download experience
  else if (looksLikePresentationOutput)               Component = DocumentGenerationCard;

  // ── Render based on state ───────────────────────────────────────────────────
  switch (part.state) {
    case 'input-streaming':
    case 'input-available':
      return <ToolLoading key={pIdx} toolName={displaySlug} input={part.input} />;
    case 'output-available': {
      // For DocumentGenerationCard, pass the full props structure
      if (Component === DocumentGenerationCard) {
        return (
          <DocumentGenerationCard
            key={pIdx}
            toolCallId={part.toolCallId || `${messageId}_${pIdx}`}
            toolName={slug || 'invoke_skill'}
            input={part.input}
            output={part.output}
            externalOutput={externalOutput}
            state={part.state as any}
            errorText={part.errorText}
            conversationId={conversationId || undefined}
          />
        );
      }
      // For other cards, spread the output as props
      return (
        <Component
          key={pIdx}
          skill={slug}
          skill_name={displaySlug}
          {...(typeof part.output === 'object' && part.output ? part.output : {})}
        />
      );
    }
    case 'output-error': {
      // Before showing error, check if we have usable artifact data to display instead
      // This handles cases where the tool "errored" but still produced viewable content
      if (looksLikeReactArtifact) {
        return (
          <ArtifactsBuilderCard
            key={pIdx}
            skill={slug}
            skill_name={displaySlug}
            success={false}
            {...(typeof part.output === 'object' && part.output ? part.output : {})}
          />
        );
      }
      if (looksLikeAFLOutput) {
        return (
          <AFLGenerationCard
            key={pIdx}
            toolCallId={part.toolCallId || `${messageId}_${pIdx}`}
            toolName={slug || 'afl_generation'}
            input={part.input}
            output={part.output}
            externalOutput={externalOutput}
            state={'output-available' as any}
            errorText={part.errorText}
            conversationId={conversationId || undefined}
          />
        );
      }
      if (looksLikeDocumentOutput) {
        return (
          <DocumentGenerationCard
            key={pIdx}
            toolCallId={part.toolCallId || `${messageId}_${pIdx}`}
            toolName={slug || 'invoke_skill'}
            input={part.input}
            output={part.output}
            externalOutput={externalOutput}
            state={'output-available' as any}
            errorText={part.errorText}
            conversationId={conversationId || undefined}
          />
        );
      }
      // No usable output data - show the error
      return <ToolError key={pIdx} toolName={displaySlug} errorText={part.errorText} output={part.output} />;
    }
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
  // Check if this is an artifact-type tool that needs special prop passing
  const isArtifactTool = entry?.component === ArtifactsBuilderCard || 
    ['react', 'jsx', 'tsx', 'react_artifact', 'code_artifact', 'sandbox_artifact', 'create_react', 'artifacts_builder'].includes(toolName);
  
  if (entry && (!entry.mode || entry.mode === 'standard')) {
    const loadingName = entry.displayName || toolName;
    const hasUsableOutput = typeof part.output === 'object' && part.output && Object.keys(part.output).length > 0;
    switch (part.state) {
      case 'input-streaming':
      case 'input-available':
        return <ToolLoading key={pIdx} toolName={loadingName} input={part.input} />;
      case 'output-available': {
        const Component = entry.component;
        // For artifact tools, pass skill metadata along with output
        if (isArtifactTool) {
          return (
            <Component
              key={pIdx}
              skill={toolName}
              skill_name={loadingName}
              success={true}
              {...(hasUsableOutput ? part.output : {})}
            />
          );
        }
        return (
          <Component
            key={pIdx}
            {...(hasUsableOutput ? part.output : {})}
          />
        );
      }
      case 'output-error': {
        // If we have usable output despite the error, show the component instead of error
        if (hasUsableOutput) {
          const Component = entry.component;
          // For artifact tools, pass skill metadata
          if (isArtifactTool) {
            return (
              <Component
                key={pIdx}
                skill={toolName}
                skill_name={loadingName}
                success={false}
                {...part.output}
              />
            );
          }
          return (
            <Component
              key={pIdx}
              {...part.output}
            />
          );
        }
        return <ToolError key={pIdx} toolName={toolName} errorText={part.errorText} output={part.output} />;
      }
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
        return <ToolError key={pIdx} toolName="search_flights" errorText={part.errorText} output={part.output} />;
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
  // Check output for both output-available AND output-error states
  // This allows us to show usable artifacts even after errors
  const hasOutput = typeof part.output === 'object' && part.output;
  const out = (hasOutput ? part.output : {}) as any;
  
  // ── Check for React artifact output (works for both success and error states) ────
  const outputText = out.text || out.code || out.data?.text || out.data?.code || '';
  const looksLikeReactArtifact = outputText && (
    /```(jsx|tsx|react|javascript|js)\s*\n/.test(outputText) ||
    (/function\s+[A-Z][a-zA-Z]*/.test(outputText) && /<[A-Z][a-zA-Z]*[\s/>]/.test(outputText)) ||
    (out.code && /return\s*[\(\<]/.test(out.code) && /<[A-Z]/.test(out.code)) ||
    (out.language && ['jsx', 'tsx', 'react'].includes(out.language?.toLowerCase()))
  );
  
  // Render React artifacts even in error state to preserve persistence
  if (looksLikeReactArtifact && (part.state === 'output-available' || part.state === 'output-error')) {
    return (
      <ArtifactsBuilderCard
        key={pIdx}
        skill={toolName}
        skill_name={toolName}
        success={part.state === 'output-available'}
        {...out}
      />
    );
  }

  if ((part.state === 'output-available' || part.state === 'output-error') && hasOutput) {
    // ── AFL code output detection → use rich AFLGenerationCard ─────────────────
    if (
      out.afl_code ||
      out.fixed_code ||
      out.data?.afl_code ||
      out.data?.filename?.endsWith('.afl') ||
      (out.filename && out.filename.endsWith('.afl')) ||
      /afl|amibroker/.test(toolName)
    ) {
      return (
        <AFLGenerationCard
          key={pIdx}
          toolCallId={part.toolCallId || `dynamic_${pIdx}`}
          toolName={toolName}
          input={part.input}
          output={out}
          state={'output-available' as any}
          errorText={part.errorText}
        />
      );
    }

    // ── DCF model output detection ───────────────────────────────────────────
    if (
      out.intrinsic_value ||
      out.wacc ||
      out.enterprise_value ||
      out.equity_value ||
      (out.ticker && (out.current_price || out.upside_downside)) ||
      /dcf|valuation/.test(toolName)
    ) {
      return <DCFModelCard key={pIdx} {...out} />;
    }

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
