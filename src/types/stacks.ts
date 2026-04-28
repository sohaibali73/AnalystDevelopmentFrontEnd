// Knowledge Stacks types — mirrors the backend /stacks/* API
// See DevBackend/Documentation/KNOWLEDGE_STACKS_GUIDE.md

export type StackLoadMode = 'static' | 'dynamic' | 'sync';

export interface StackSettings {
  chunk_size: number;            // 200 – 8000, default 1500
  chunk_count: number;           // 1 – 100, default 20
  overlap: number;               // 0 – 2000, default 150
  load_mode: StackLoadMode;      // default 'static'
  generate_embeddings: boolean;  // default true
}

export interface KnowledgeStack {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  settings: StackSettings;
  document_count: number;
  total_chunks: number;
  total_size_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface StackDocument {
  id: string;
  title?: string | null;
  filename: string;
  file_type?: string | null;
  file_size?: number | null;
  summary?: string | null;
  tags?: string[] | null;
  chunk_count?: number | null;
  is_processed?: boolean;
  processed_at?: string | null;
  created_at: string;
  // status is inferred / fetched separately, but useful to keep optional
  status?: 'processing' | 'ready' | 'error';
}

export interface StackUploadResult {
  status: 'processing' | 'duplicate' | 'error';
  document_id?: string;
  stack_id: string;
  ready?: boolean;
  message?: string;
  filename?: string;
  error?: string;
}

export interface StackBatchUploadResult {
  stack_id: string;
  total: number;
  queued: number;
  duplicates: number;
  errors: number;
  results: Array<{
    filename: string;
    status: 'processing' | 'duplicate' | 'error';
    document_id?: string;
    error?: string;
  }>;
}

export interface StackSearchChunk {
  chunk_id: string;
  document_id: string;
  document_title?: string;
  document_filename?: string;
  chunk_index: number;
  content: string;
  similarity?: number;
  search_type: 'vector' | 'text';
}

export interface StackSearchResponse {
  stack_id: string;
  query: string;
  search_type: 'vector' | 'text';
  count: number;
  results: StackSearchChunk[];
}

export interface StackContextRagResponse {
  stack_id: string;
  stack_name: string;
  mode: 'rag' | 'first_chunks';
  query?: string;
  search_type?: 'vector' | 'text';
  chunk_count: number;
  chunks: StackSearchChunk[];
}

export interface StackContextFullResponse {
  stack_id: string;
  stack_name: string;
  mode: 'full_content';
  document_count: number;
  total_chars: number;
  documents: Array<{
    document_id: string;
    title?: string;
    filename: string;
    content: string;
    char_count: number;
  }>;
}

export type StackContextResponse =
  | StackContextRagResponse
  | StackContextFullResponse;

export interface DocumentStatus {
  document_id: string;
  status: 'processing' | 'ready' | 'error';
  ready: boolean;
  chunk_count?: number;
  error?: string;
}

export const DEFAULT_STACK_SETTINGS: StackSettings = {
  chunk_size: 1500,
  chunk_count: 20,
  overlap: 150,
  load_mode: 'static',
  generate_embeddings: true,
};

export const STACK_ICON_CHOICES = [
  '📊', '📈', '📉', '📚', '📁', '📂', '📄', '🗂️', '📒', '📕', '📗', '📘', '📙',
  '🧠', '💡', '🔬', '⚖️', '🏛️', '🏦', '💼', '🧪', '🧾', '🔖', '⭐', '🚀',
];

export const STACK_COLOR_CHOICES = [
  '#FEC00F', // accent
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#EF4444', // red
  '#F59E0B', // amber
  '#06B6D4', // cyan
  '#A78BFA', // light purple
  '#9CA3AF', // gray
];
