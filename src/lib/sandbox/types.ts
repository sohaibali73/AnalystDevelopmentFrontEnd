/**
 * Sandbox Types - Type definitions for the sandbox execution system
 * Matches the backend API specification for code execution
 */

// Supported programming languages
export type SandboxLanguage = 'python' | 'javascript';

// Execution request payload
export interface ExecuteCodeRequest {
  code: string;
  language?: SandboxLanguage;
  timeout?: number;
  context?: Record<string, unknown>;
}

// Execution result from the API
export interface ExecutionResult {
  success: boolean;
  output: string;
  error: string | null;
  execution_time_ms: number;
  language: SandboxLanguage;
  variables?: Record<string, string>;
  artifacts?: string[];
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
  version?: string;
  status: PackageStatus;
  language?: SandboxLanguage;
  install_time_ms?: number;
  size_kb?: number;
}

// Package installation request
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

// All packages response
export interface AllPackagesResponse {
  language: SandboxLanguage;
  preinstalled: PackageInfo[];
  cached: PackageInfo[];
  user_installed: PackageInfo[];
}

// LLM Sandbox status
export interface LLMSandboxStatus {
  available: boolean;
  languages: SandboxLanguage[];
}

// Sandbox artifact - a piece of generated content (code, chart, etc.)
export interface SandboxArtifact {
  id: string;
  type: 'code' | 'chart' | 'html' | 'react' | 'image' | 'file' | 'data';
  title: string;
  content: string;
  language?: SandboxLanguage;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

// Sandbox session - persisted conversation state
export interface SandboxSession {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  artifacts: SandboxArtifact[];
  executionHistory: ExecutionHistoryItem[];
  variables: Record<string, unknown>;
  activeLanguage: SandboxLanguage;
}

// Execution history item
export interface ExecutionHistoryItem {
  id: string;
  code: string;
  language: SandboxLanguage;
  result: ExecutionResult;
  timestamp: number;
  artifactId?: string;
}

// Sandbox panel state
export interface SandboxPanelState {
  isOpen: boolean;
  isPinned: boolean;
  activeTab: 'code' | 'output' | 'artifacts' | 'files';
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
