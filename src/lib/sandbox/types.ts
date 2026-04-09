/**
 * Sandbox Types - Type definitions for the sandbox execution system
 * Matches the backend API specification for code execution
 * 
 * Based on: SANDBOX_GUIDE.md complete API reference
 */

// Supported programming languages (including react for UI components)
export type SandboxLanguage = 'python' | 'javascript' | 'react';

// Display types returned from sandbox execution
// v3 adds: 'plotly' for interactive charts, 'file' for downloadable files
export type SandboxDisplayType = 'text' | 'image' | 'html' | 'react' | 'json' | 'plotly' | 'file';

// Artifact encoding
export type ArtifactEncoding = 'base64' | 'utf-8';

// Execution request payload - matches POST /sandbox/execute
export interface ExecuteCodeRequest {
  code: string;
  language?: SandboxLanguage;
  timeout?: number;
  context?: Record<string, unknown>;
  session_id?: string; // Pass same ID across turns to share state
}

// File artifact metadata (v3) - for display_type="file"
export interface FileArtifactMetadata {
  filename: string;
  size_bytes: number;
  extension: string;
  downloadable: boolean;
}

// Sandbox artifact returned from execution
export interface SandboxArtifact {
  artifact_id: string;
  type: string; // e.g., 'image/png', 'text/html', 'text/csv', 'application/vnd.openxmlformats-...'
  display_type: SandboxDisplayType;
  data: string; // base64 for images, HTML for react/html/plotly, file content for files
  encoding: ArtifactEncoding;
  metadata?: Record<string, unknown> | FileArtifactMetadata;
  created_at?: number;
}

// Execution result from the API - matches backend SandboxExecuteResponse
export interface ExecutionResult {
  success: boolean;
  output: string | null;
  error: string | null;
  execution_time_ms: number;
  language: SandboxLanguage;
  execution_id: string;
  session_id: string;
  display_type: SandboxDisplayType;
  variables?: Record<string, string>;
  artifacts: SandboxArtifact[];
}

// Session history item from GET /sandbox/session/{session_id}/history
export interface SessionHistoryItem {
  execution_id: string;
  language: SandboxLanguage;
  success: boolean;
  output: string | null;
  exec_time_ms: number;
  created_at: number;
  code_preview: string;
}

// Session history response
export interface SessionHistoryResponse {
  session_id: string;
  executions: SessionHistoryItem[];
  count: number;
}

// Session variables response
export interface SessionVariablesResponse {
  session_id: string;
  variables: Record<string, unknown>;
  count: number;
}

// Package status values
export type PackageStatus = 
  | 'preinstalled' 
  | 'cached' 
  | 'installed' 
  | 'failed' 
  | 'pending' 
  | 'blocked';

// Package information
export interface PackageInfo {
  name: string;
  version?: string | null;
  status: PackageStatus;
  language?: SandboxLanguage;
  install_time_ms?: number;
  install_path?: string;
  installed_at?: number;
}

// Package installation request - matches POST /sandbox/packages/install
export interface InstallPackagesRequest {
  language: SandboxLanguage;
  packages: string[];
  user_id?: string;
}

// Package installation response
export interface InstallPackagesResponse {
  success: boolean;
  message: string;
  packages: PackageInfo[];
  logs: string[];
}

// All packages response - matches GET /sandbox/packages/{language}/all
export interface AllPackagesResponse {
  language: SandboxLanguage;
  preinstalled: PackageInfo[];
  cached: PackageInfo[];
  user_installed: PackageInfo[];
}

// Package status response
export interface PackageStatusResponse {
  installed: boolean;
  status: PackageStatus;
  version?: string;
  install_path?: string;
  installed_at?: number;
}

// LLM Sandbox status
export interface LLMSandboxStatus {
  available: boolean;
  languages: SandboxLanguage[];
}

// Artifacts list response from GET /sandbox/artifacts/{execution_id}
export interface ArtifactsListResponse {
  execution_id: string;
  artifacts: Omit<SandboxArtifact, 'data'>[];
  count: number;
}

// Local session for client-side persistence
export interface LocalSandboxSession {
  id: string;
  conversationId?: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  activeLanguage: SandboxLanguage;
  executionHistory: ExecutionHistoryItem[];
  variables: Record<string, unknown>;
}

// Execution history item (local)
export interface ExecutionHistoryItem {
  id: string;
  code: string;
  language: SandboxLanguage;
  result: ExecutionResult;
  timestamp: number;
}

// Sandbox panel state
export interface SandboxPanelState {
  isOpen: boolean;
  isPinned: boolean;
  activeTab: 'code' | 'output' | 'artifacts' | 'history';
  splitView: boolean;
  currentSessionId: string | null;
}

// File generated during session
export interface SandboxFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string | Blob;
  createdAt: number;
  downloadUrl?: string;
}

// Tool call format for chat integration
export interface SandboxToolCall {
  toolCallId: string;
  toolName: 'executeSandbox' | 'sandbox_execute' | 'react' | 'python' | 'javascript';
  input: {
    code: string;
    language?: SandboxLanguage;
    install_packages?: string[];
  };
  output?: ExecutionResult;
  state: 'pending' | 'running' | 'completed' | 'error';
}
