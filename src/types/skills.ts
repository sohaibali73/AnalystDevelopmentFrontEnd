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

// ── Source / storage discriminators (added for user-uploaded skills) ──────
export type SkillSource = 'system' | 'portal' | 'upload' | 'inline';
export type SkillStorageKind = 'portal' | 'lightweight' | 'bundle';

// ── Skill Definition (matches backend SkillDefinition.to_dict()) ──────────
export interface SkillDefinition {
  skill_id?: string;
  name: string;
  slug: string;
  description: string;
  category: SkillCategory | string;
  max_tokens: number;
  tags: string[];
  enabled: boolean;
  supports_streaming: boolean;
  is_builtin: boolean;
  // Extended fields for user-uploaded skills
  source?: SkillSource;
  storage_kind?: SkillStorageKind;
  created_by?: string | null;
  created_at?: string | null;
  system_prompt?: string;
  tools?: string[];
}

// ── Upload / error envelope ───────────────────────────────────────────────
export interface SkillUploadResponse {
  skill: SkillDefinition;
  warnings: string[];
  archived: boolean;
  storage_kind: SkillStorageKind;
  storage_path: string;
}

export interface SkillErrorPayload {
  detail: { code: string; error: string };
}

export const SKILL_ERROR_MESSAGES: Record<string, string> = {
  INVALID_ZIP: "That file isn't a valid .zip.",
  EMPTY_UPLOAD: 'The bundle is empty.',
  BUNDLE_TOO_LARGE: 'Bundle exceeds 25 MB compressed / 50 MB extracted.',
  TOO_MANY_FILES: 'Bundle contains too many files (max 500).',
  UNSAFE_PATH: 'Bundle contains an unsafe path.',
  MISSING_SKILL_MD: 'Bundle must contain SKILL.md (or skill.json + prompt.md).',
  MISSING_NAME: 'Skill is missing a name.',
  MISSING_DESCRIPTION: 'Skill is missing a description.',
  MISSING_PROMPT: 'System prompt is required.',
  BAD_SLUG:
    'Slug must be kebab-case (3-64 chars, lowercase, start with a letter).',
  SLUG_TAKEN: 'That slug is already taken — pick another.',
  INVALID_SKILL_JSON: 'skill.json is not valid JSON.',
  FORBIDDEN: "You don't have permission to modify this skill.",
  NOT_FOUND: 'Skill not found.',
  MATERIALIZE_FAILED: 'Server error — please try again.',
  DB_INSERT_FAILED: 'Server error — please try again.',
  DB_UPDATE_FAILED: 'Server error — please try again.',
  DB_DELETE_FAILED: 'Server error — please try again.',
};

export function explainSkillError(payload: unknown): string {
  const code = (payload as SkillErrorPayload | undefined)?.detail?.code;
  const fallback =
    (payload as SkillErrorPayload | undefined)?.detail?.error ||
    (payload as { error?: string } | undefined)?.error;
  return (code && SKILL_ERROR_MESSAGES[code]) || fallback || 'Unknown error';
}

export const KEBAB_SLUG_RE = /^[a-z][a-z0-9-]{2,63}$/;

export const SKILL_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'research', label: 'Research' },
  { value: 'document', label: 'Document' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'data', label: 'Data' },
  { value: 'ui', label: 'UI' },
  { value: 'backtest', label: 'Backtest' },
  { value: 'market_analysis', label: 'Market Analysis' },
  { value: 'quant', label: 'Quant' },
  { value: 'financial_modeling', label: 'Financial Modeling' },
  { value: 'afl', label: 'AFL' },
  { value: 'code', label: 'Code' },
] as const;

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
