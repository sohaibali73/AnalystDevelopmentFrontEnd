/**
 * Sandbox Service - API client for the sandbox execution backend
 * Provides methods for executing code, managing packages, and session persistence
 */

import type {
  ExecuteCodeRequest,
  ExecutionResult,
  InstallPackagesRequest,
  InstallPackagesResponse,
  AllPackagesResponse,
  LLMSandboxStatus,
  SandboxLanguage,
} from './types';

// Default API base URL - can be overridden via environment variable
const SANDBOX_API_BASE = process.env.NEXT_PUBLIC_SANDBOX_API_URL || 'http://localhost:8000';

class SandboxService {
  private baseUrl: string;
  private defaultTimeout: number = 30000; // 30 seconds

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || SANDBOX_API_BASE;
  }

  /**
   * Execute code in the sandbox
   */
  async execute(request: ExecuteCodeRequest): Promise<ExecutionResult> {
    const response = await this.fetch('/sandbox/execute', {
      method: 'POST',
      body: JSON.stringify({
        code: request.code,
        language: request.language || 'python',
        timeout: request.timeout || 30,
        context: request.context || {},
      }),
    });

    return response as ExecutionResult;
  }

  /**
   * Execute code in the LLM Sandbox (Docker-isolated)
   */
  async executeLLM(request: ExecuteCodeRequest): Promise<ExecutionResult> {
    const response = await this.fetch('/sandbox/llm/execute', {
      method: 'POST',
      body: JSON.stringify({
        code: request.code,
        language: request.language || 'python',
        timeout: request.timeout || 60,
        context: request.context || {},
      }),
    });

    return response as ExecutionResult;
  }

  /**
   * Get list of supported languages
   */
  async getLanguages(): Promise<{ languages: SandboxLanguage[] }> {
    return this.fetch('/sandbox/languages') as Promise<{ languages: SandboxLanguage[] }>;
  }

  /**
   * Get pre-approved packages for a language
   */
  async getPackages(language: SandboxLanguage): Promise<{ language: string; packages: string[] }> {
    return this.fetch(`/sandbox/packages/${language}`);
  }

  /**
   * Get all packages (preinstalled, cached, user-installed)
   */
  async getAllPackages(language: SandboxLanguage, userId?: string): Promise<AllPackagesResponse> {
    const params = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    return this.fetch(`/sandbox/packages/${language}/all${params}`);
  }

  /**
   * Install packages
   */
  async installPackages(request: InstallPackagesRequest): Promise<InstallPackagesResponse> {
    return this.fetch('/sandbox/packages/install', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Clear package cache
   */
  async clearPackageCache(): Promise<{ success: boolean; message: string }> {
    return this.fetch('/sandbox/packages/cache/clear', {
      method: 'POST',
    });
  }

  /**
   * Check LLM Sandbox availability
   */
  async getLLMStatus(): Promise<LLMSandboxStatus> {
    return this.fetch('/sandbox/llm/status');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.fetch('/sandbox/languages', { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  }

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
