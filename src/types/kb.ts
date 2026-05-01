// Knowledge Base types
// These types represent what the user sees in the file browser & viewer.
// The model-facing types (RagChunk, etc.) live in src/types/stacks.ts

export interface KBDocument {
  id: string;
  title?: string | null;
  name?: string | null;
  filename: string;
  file_type?: string | null;
  file_size?: number | null;
  size?: number | null;
  chunk_count?: number | null;
  is_processed?: boolean;
  category?: string;
  tags?: string[] | null;
  description?: string | null;
  page_count?: number | null;
  upload_date?: string | null;
  created_at: string;
  updated_at?: string | null;
  stack_id?: string | null;
  raw_content_preview?: string | null;
}

export interface KBStats {
  total_documents: number;
  total_size: number;
  categories: Record<string, number>;
  total_chunks?: number;
}

export interface KBUploadResult {
  document_id: string;
  status: 'processing' | 'ready' | 'error';
  ready?: boolean;
  filename?: string;
  message?: string;
}

export interface KBBatchUploadResult {
  total: number;
  queued: number;
  errors: number;
  results: Array<{
    filename: string;
    status: 'processing' | 'error';
    document_id?: string;
    error?: string;
  }>;
}

export interface KBDocumentStatus {
  document_id: string;
  status: 'processing' | 'ready' | 'error';
  ready: boolean;
  chunk_count?: number;
  error?: string;
}

export interface KBSearchResult {
  document_id: string;
  content: string;
  similarity?: number;
  relevance_score?: number;
  filename?: string;
  chunk_index?: number;
}