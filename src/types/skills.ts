/**
 * Skills Types — Matches backend skills_registry.py
 * Complete type definitions for the Potomac Custom Beta Skills system.
 */

// ── Skill Categories (matches backend SkillCategory enum) ─────────────────
export type SkillCategory =
  | 'afl'
  | 'document'
  | 'presentation'
  | 'ui'
  | 'backtest'
  | 'market_analysis'
  | 'quant'
  | 'research'
  | 'financial_modeling'
  | 'data';

// ── Skill Definition (matches backend SkillDefinition.to_dict()) ──────────
export interface SkillDefinition {
  skill_id: string;
  name: string;
  slug: string;
  description: string;
  category: SkillCategory;
  max_tokens: number;
  tags: string[];
  enabled: boolean;
  supports_streaming: boolean;
  is_builtin: boolean;
}

// ── API Response Types ────────────────────────────────────────────────────
export interface SkillListResponse {
  skills: SkillDefinition[];
  count: number;
}

export interface SkillCategoryInfo {
  category: string;
  label: string;
  count: number;
}

export interface SkillCategoriesResponse {
  categories: SkillCategoryInfo[];
}

export interface SkillJobsResponse {
  jobs: any[];
  count: number;
}

// ── Skill Execution ───────────────────────────────────────────────────────
export interface SkillExecuteRequest {
  message: string;
  system_prompt?: string;
  conversation_history?: { role: string; content: string }[];
  max_tokens?: number;
  extra_context?: string;
  stream?: boolean;
}

export interface SkillExecuteResponse {
  text: string;
  skill: string;
  skill_name: string;
  usage?: { input_tokens: number; output_tokens: number };
  model?: string;
  execution_time?: number;
  stop_reason?: string;
  files?: SkillOutputFile[];
}

export interface SkillOutputFile {
  file_id: string;
  filename: string;
  file_type: string;
  download_url: string;
  size_kb?: number;
}

// ── Multi-Skill Execution ─────────────────────────────────────────────────
export interface MultiSkillRequest {
  requests: {
    skill_slug: string;
    message: string;
    system_prompt?: string;
    max_tokens?: number;
    extra_context?: string;
  }[];
}

export interface MultiSkillResponse {
  results: SkillExecuteResponse[];
  total_skills: number;
  total_execution_time: number;
}

// ── Skill Category Metadata ───────────────────────────────────────────────
export const SKILL_CATEGORY_META: Record<SkillCategory, {
  icon: string;
  color: string;
  label: string;
  description: string;
}> = {
  afl: {
    icon: '📊',
    color: '#6366F1',
    label: 'AFL',
    description: 'AmiBroker Formula Language code generation and analysis',
  },
  document: {
    icon: '📄',
    color: '#10B981',
    label: 'Documents',
    description: 'Document creation, reading, and manipulation',
  },
  presentation: {
    icon: '📑',
    color: '#F59E0B',
    label: 'Presentations',
    description: 'PowerPoint presentation creation and editing',
  },
  ui: {
    icon: '🎨',
    color: '#EC4899',
    label: 'UI/Components',
    description: 'React component and artifact generation',
  },
  backtest: {
    icon: '📈',
    color: '#3B82F6',
    label: 'Backtesting',
    description: 'Strategy backtesting and performance analysis',
  },
  market_analysis: {
    icon: '🔍',
    color: '#EF4444',
    label: 'Market Analysis',
    description: 'Market conditions, bubble detection, and risk assessment',
  },
  quant: {
    icon: '🧮',
    color: '#8B5CF6',
    label: 'Quantitative',
    description: 'Quantitative analysis, factor models, and systematic strategies',
  },
  research: {
    icon: '🔬',
    color: '#14B8A6',
    label: 'Research',
    description: 'Financial research, equity analysis, and deep dives',
  },
  financial_modeling: {
    icon: '💰',
    color: '#F97316',
    label: 'Financial Modeling',
    description: 'DCF models, valuation, data packs, and financial modeling',
  },
  data: {
    icon: '📊',
    color: '#06B6D4',
    label: 'Data/Excel',
    description: 'Excel spreadsheet creation, data analysis, and manipulation',
  },
};

// ── Skill Slug Constants ──────────────────────────────────────────────────
export const SKILL_SLUGS = {
  // Built-in Anthropic skills
  XLSX: 'xlsx',
  PPTX: 'pptx',
  PDF: 'pdf',
  DOCX: 'docx',
  // Custom skills
  AMIBROKER_AFL: 'amibroker-afl-developer',
  POTOMAC_DOCX: 'potomac-docx-skill',
  POTOMAC_PPTX: 'potomac-pptx',
  AI_ELEMENTS: 'ai-elements',
  BACKTEST_EXPERT: 'backtest-expert',
  BUBBLE_DETECTOR: 'us-market-bubble-detector',
  QUANT_ANALYST: 'quant-analyst',
  FINANCIAL_RESEARCH: 'financial-deep-research',
  BACKTESTING_FRAMEWORKS: 'backtesting-frameworks',
  DOC_INTERPRETER: 'doc-interpreter',
  POTOMAC_XLSX: 'potomac-xlsx',
  DCF_MODEL: 'dcf-model',
  INITIATING_COVERAGE: 'initiating-coverage',
  DATAPACK_BUILDER: 'datapack-builder',
  ARTIFACTS_BUILDER: 'artifacts-builder',
} as const;
