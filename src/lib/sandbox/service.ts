/**
 * Sandbox Service - API client for the sandbox execution backend
 * Provides methods for executing code, managing packages, and session persistence
 * 
 * Based on: SANDBOX_GUIDE.md complete API reference
 * Backend URL: https://developer-potomaac.up.railway.app
 */

import type {
  ExecuteCodeRequest,
  ExecutionResult,
  InstallPackagesRequest,
  InstallPackagesResponse,
  AllPackagesResponse,
  LLMSandboxStatus,
  SandboxLanguage,
  SessionHistoryResponse,
  SessionVariablesResponse,
  ArtifactsListResponse,
  SandboxArtifact,
  PackageStatusResponse,
} from './types';

// Default API base URL - uses the same backend as the rest of the app
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return (process.env.NEXT_PUBLIC_API_URL || 'https://developer-potomaac.up.railway.app').replace(/\/+$/, '');
  }
  return (process.env.NEXT_PUBLIC_API_URL || 'https://developer-potomaac.up.railway.app').replace(/\/+$/, '');
};

class SandboxService {
  private baseUrl: string;
  private defaultTimeout: number = 60000; // 60 seconds for long-running code

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getApiBaseUrl();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Code Execution
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Execute code in the sandbox
   * POST /sandbox/execute
   */
  async execute(request: ExecuteCodeRequest): Promise<ExecutionResult> {
    const response = await this.fetch('/sandbox/execute', {
      method: 'POST',
      body: JSON.stringify({
        code: request.code,
        language: request.language || 'python',
        timeout: request.timeout || 30,
        context: request.context || {},
        session_id: request.session_id, // Pass session_id for state persistence
      }),
    });

    return response as ExecutionResult;
  }

  /**
   * Execute React code (convenience wrapper)
   * POST /sandbox/react/execute
   */
  async executeReact(code: string, sessionId?: string): Promise<ExecutionResult> {
    const response = await this.fetch('/sandbox/react/execute', {
      method: 'POST',
      body: JSON.stringify({
        code,
        session_id: sessionId,
      }),
    });

    return response as ExecutionResult;
  }

  /**
   * Execute code in the LLM Sandbox (Docker-isolated)
   * POST /sandbox/llm/execute
   */
  async executeLLM(request: ExecuteCodeRequest): Promise<ExecutionResult> {
    const response = await this.fetch('/sandbox/llm/execute', {
      method: 'POST',
      body: JSON.stringify({
        code: request.code,
        language: request.language || 'python',
        timeout: request.timeout || 60,
        context: request.context || {},
        session_id: request.session_id,
      }),
    });

    return response as ExecutionResult;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Languages
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get list of supported languages
   * GET /sandbox/languages
   */
  async getLanguages(): Promise<{ languages: SandboxLanguage[] }> {
    return this.fetch('/sandbox/languages') as Promise<{ languages: SandboxLanguage[] }>;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Packages
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get pre-approved packages for a language
   * GET /sandbox/packages/{language}
   */
  async getPackages(language: SandboxLanguage): Promise<{ language: string; packages: string[] }> {
    return this.fetch(`/sandbox/packages/${language}`);
  }

  /**
   * Get all packages (preinstalled, cached, user-installed)
   * GET /sandbox/packages/{language}/all?user_id=optional
   */
  async getAllPackages(language: SandboxLanguage, userId?: string): Promise<AllPackagesResponse> {
    const params = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    return this.fetch(`/sandbox/packages/${language}/all${params}`);
  }

  /**
   * Install packages
   * POST /sandbox/packages/install
   */
  async installPackages(request: InstallPackagesRequest): Promise<InstallPackagesResponse> {
    return this.fetch('/sandbox/packages/install', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get package status
   * GET /sandbox/packages/{language}/status/{name}
   */
  async getPackageStatus(language: SandboxLanguage, packageName: string): Promise<PackageStatusResponse> {
    return this.fetch(`/sandbox/packages/${language}/status/${encodeURIComponent(packageName)}`);
  }

  /**
   * Clear package cache
   * POST /sandbox/packages/cache/clear
   */
  async clearPackageCache(): Promise<{ success: boolean; message: string }> {
    return this.fetch('/sandbox/packages/cache/clear', {
      method: 'POST',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Sessions
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get session execution history
   * GET /sandbox/session/{session_id}/history?limit=20
   */
  async getSessionHistory(sessionId: string, limit: number = 20): Promise<SessionHistoryResponse> {
    return this.fetch(`/sandbox/session/${sessionId}/history?limit=${limit}`);
  }

  /**
   * Get session variables
   * GET /sandbox/session/{session_id}/variables
   */
  async getSessionVariables(sessionId: string): Promise<SessionVariablesResponse> {
    return this.fetch(`/sandbox/session/${sessionId}/variables`);
  }

  /**
   * Delete a session (clears all state, executions, artifacts)
   * DELETE /sandbox/session/{session_id}
   */
  async deleteSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    return this.fetch(`/sandbox/session/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Artifacts
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get artifacts for an execution
   * GET /sandbox/artifacts/{execution_id}
   */
  async getArtifacts(executionId: string): Promise<ArtifactsListResponse> {
    return this.fetch(`/sandbox/artifacts/${executionId}`);
  }

  /**
   * Get raw artifact data (for direct display)
   * Returns the artifact URL for img src or iframe src
   * GET /sandbox/artifacts/{artifact_id}/raw
   */
  getArtifactUrl(artifactId: string): string {
    return `${this.baseUrl}/sandbox/artifacts/${artifactId}/raw`;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LLM Sandbox (Docker)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Check LLM Sandbox availability
   * GET /sandbox/llm/status
   */
  async getLLMStatus(): Promise<LLMSandboxStatus> {
    return this.fetch('/sandbox/llm/status');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Health Check
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Health check - verifies sandbox is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.fetch('/sandbox/languages', { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Internal Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Internal fetch wrapper with timeout and error handling
   */
  private async fetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SandboxError(
          errorData.detail || errorData.error || `HTTP ${response.status}`,
          response.status
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof SandboxError) {
        throw error;
      }
      
      if ((error as Error).name === 'AbortError') {
        throw new SandboxError('Request timed out', 408);
      }
      
      throw new SandboxError(
        `Failed to connect to sandbox: ${(error as Error).message}`,
        0
      );
    }
  }

  /**
   * Set the base URL
   */
  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  /**
   * Get the current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Set the default timeout
   */
  setTimeout(ms: number) {
    this.defaultTimeout = ms;
  }
}

/**
 * Custom error class for sandbox errors
 */
export class SandboxError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'SandboxError';
    this.statusCode = statusCode;
  }
}

// Singleton instance
export const sandboxService = new SandboxService();

// Export class for custom instances
export { SandboxService };
