'use client';

/**
 * useSandbox - React hook for sandbox integration
 * Provides easy access to sandbox functionality with state management
 * 
 * Supports conversation-based session management where each conversation
 * maintains its own sandbox_session_id for persistent Python state.
 * 
 * Based on: SANDBOX_GUIDE.md Section 6 - Session Management Across Turns
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  sandboxService,
  SandboxError,
  type SandboxLanguage,
  type ExecutionResult,
  type ExecuteCodeRequest,
  type SessionHistoryResponse,
  type SessionVariablesResponse,
} from '@/lib/sandbox';

export interface UseSandboxOptions {
  /** Conversation ID to associate sandbox session with */
  conversationId?: string;
  /** Default programming language */
  defaultLanguage?: SandboxLanguage;
  /** Auto-check backend connection on mount */
  autoConnect?: boolean;
}

export interface UseSandboxReturn {
  // State
  sessionId: string | null;
  isConnected: boolean | null;
  isExecuting: boolean;
  lastResult: ExecutionResult | null;
  error: string | null;
  history: SessionHistoryResponse | null;
  variables: Record<string, unknown>;
  
  // Actions
  execute: (code: string, language?: SandboxLanguage, options?: Partial<ExecuteCodeRequest>) => Promise<ExecutionResult>;
  executeReact: (code: string) => Promise<ExecutionResult>;
  executeLLM: (code: string, language?: SandboxLanguage) => Promise<ExecutionResult>;
  checkConnection: () => Promise<boolean>;
  loadHistory: () => Promise<SessionHistoryResponse | null>;
  loadVariables: () => Promise<SessionVariablesResponse | null>;
  clearSession: () => Promise<boolean>;
  setSessionId: (id: string) => void;
  
  // Package management
  getPackages: (language: SandboxLanguage) => Promise<string[]>;
  installPackages: (language: SandboxLanguage, packages: string[]) => Promise<boolean>;
  getPackageStatus: (language: SandboxLanguage, packageName: string) => Promise<boolean>;
}

/**
 * Generate a UUID for new sessions
 */
function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Local storage key for session mapping
 */
const SESSION_STORAGE_KEY = 'sandbox_sessions';

/**
 * Get or create session ID for a conversation
 */
function getOrCreateSessionForConversation(conversationId?: string): string {
  if (typeof window === 'undefined') {
    return generateSessionId();
  }

  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    const sessions: Record<string, string> = stored ? JSON.parse(stored) : {};
    
    if (conversationId) {
      if (sessions[conversationId]) {
        return sessions[conversationId];
      }
      // Create new session for this conversation
      const newId = generateSessionId();
      sessions[conversationId] = newId;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
      return newId;
    }
    
    // No conversation ID - use a global session
    if (sessions['__global__']) {
      return sessions['__global__'];
    }
    const globalId = generateSessionId();
    sessions['__global__'] = globalId;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
    return globalId;
  } catch {
    return generateSessionId();
  }
}

export function useSandbox(options: UseSandboxOptions = {}): UseSandboxReturn {
  const { 
    conversationId, 
    defaultLanguage = 'python',
    autoConnect = true,
  } = options;

  // State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SessionHistoryResponse | null>(null);
  const [variables, setVariables] = useState<Record<string, unknown>>({});
  
  // Track if component is mounted
  const mountedRef = useRef(true);

  // Initialize session ID based on conversation
  useEffect(() => {
    const sid = getOrCreateSessionForConversation(conversationId);
    setSessionId(sid);
  }, [conversationId]);

  // Check connection on mount
  useEffect(() => {
    mountedRef.current = true;
    
    if (autoConnect) {
      sandboxService.healthCheck()
        .then(connected => {
          if (mountedRef.current) {
            setIsConnected(connected);
          }
        })
        .catch(() => {
          if (mountedRef.current) {
            setIsConnected(false);
          }
        });
    }

    return () => {
      mountedRef.current = false;
    };
  }, [autoConnect]);

  // Execute code
  const execute = useCallback(async (
    code: string, 
    language: SandboxLanguage = defaultLanguage,
    options: Partial<ExecuteCodeRequest> = {}
  ): Promise<ExecutionResult> => {
    if (!sessionId) {
      const errorResult: ExecutionResult = {
        success: false,
        output: null,
        error: 'No session ID available',
        execution_time_ms: 0,
        language,
        execution_id: '',
        session_id: '',
        display_type: 'text',
        artifacts: [],
      };
      setLastResult(errorResult);
      return errorResult;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const result = await sandboxService.execute({
        code,
        language,
        session_id: sessionId, // Key: pass session for persistence
        timeout: options.timeout || 30,
        context: options.context,
      });

      if (mountedRef.current) {
        setLastResult(result);
        // Update variables if returned
        if (result.variables) {
          setVariables(prev => ({ ...prev, ...result.variables }));
        }
      }

      return result;
    } catch (err) {
      const message = err instanceof SandboxError ? err.message : 'Execution failed';
      if (mountedRef.current) {
        setError(message);
      }
      
      const errorResult: ExecutionResult = {
        success: false,
        output: null,
        error: message,
        execution_time_ms: 0,
        language,
        execution_id: '',
        session_id: sessionId,
        display_type: 'text',
        artifacts: [],
      };
      
      if (mountedRef.current) {
        setLastResult(errorResult);
      }
      
      return errorResult;
    } finally {
      if (mountedRef.current) {
        setIsExecuting(false);
      }
    }
  }, [sessionId, defaultLanguage]);

  // Execute React code (convenience wrapper)
  const executeReact = useCallback(async (code: string): Promise<ExecutionResult> => {
    if (!sessionId) {
      const errorResult: ExecutionResult = {
        success: false,
        output: null,
        error: 'No session ID available',
        execution_time_ms: 0,
        language: 'react',
        execution_id: '',
        session_id: '',
        display_type: 'text',
        artifacts: [],
      };
      setLastResult(errorResult);
      return errorResult;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const result = await sandboxService.executeReact(code, sessionId);
      
      if (mountedRef.current) {
        setLastResult(result);
      }

      return result;
    } catch (err) {
      const message = err instanceof SandboxError ? err.message : 'React execution failed';
      if (mountedRef.current) {
        setError(message);
      }
      
      const errorResult: ExecutionResult = {
        success: false,
        output: null,
        error: message,
        execution_time_ms: 0,
        language: 'react',
        execution_id: '',
        session_id: sessionId,
        display_type: 'react',
        artifacts: [],
      };
      
      if (mountedRef.current) {
        setLastResult(errorResult);
      }
      
      return errorResult;
    } finally {
      if (mountedRef.current) {
        setIsExecuting(false);
      }
    }
  }, [sessionId]);

  // Execute in LLM sandbox (Docker)
  const executeLLM = useCallback(async (
    code: string, 
    language: SandboxLanguage = defaultLanguage
  ): Promise<ExecutionResult> => {
    if (!sessionId) {
      const errorResult: ExecutionResult = {
        success: false,
        output: null,
        error: 'No session ID available',
        execution_time_ms: 0,
        language,
        execution_id: '',
        session_id: '',
        display_type: 'text',
        artifacts: [],
      };
      setLastResult(errorResult);
      return errorResult;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const result = await sandboxService.executeLLM({
        code,
        language,
        session_id: sessionId,
        timeout: 60,
      });

      if (mountedRef.current) {
        setLastResult(result);
        if (result.variables) {
          setVariables(prev => ({ ...prev, ...result.variables }));
        }
      }

      return result;
    } catch (err) {
      const message = err instanceof SandboxError ? err.message : 'LLM execution failed';
      if (mountedRef.current) {
        setError(message);
      }
      
      const errorResult: ExecutionResult = {
        success: false,
        output: null,
        error: message,
        execution_time_ms: 0,
        language,
        execution_id: '',
        session_id: sessionId,
        display_type: 'text',
        artifacts: [],
      };
      
      if (mountedRef.current) {
        setLastResult(errorResult);
      }
      
      return errorResult;
    } finally {
      if (mountedRef.current) {
        setIsExecuting(false);
      }
    }
  }, [sessionId, defaultLanguage]);

  // Check connection
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const connected = await sandboxService.healthCheck();
      if (mountedRef.current) {
        setIsConnected(connected);
      }
      return connected;
    } catch {
      if (mountedRef.current) {
        setIsConnected(false);
      }
      return false;
    }
  }, []);

  // Load session history
  const loadHistory = useCallback(async (): Promise<SessionHistoryResponse | null> => {
    if (!sessionId) return null;
    
    try {
      const historyData = await sandboxService.getSessionHistory(sessionId);
      if (mountedRef.current) {
        setHistory(historyData);
      }
      return historyData;
    } catch {
      return null;
    }
  }, [sessionId]);

  // Load session variables
  const loadVariables = useCallback(async (): Promise<SessionVariablesResponse | null> => {
    if (!sessionId) return null;
    
    try {
      const varsData = await sandboxService.getSessionVariables(sessionId);
      if (mountedRef.current) {
        setVariables(varsData.variables);
      }
      return varsData;
    } catch {
      return null;
    }
  }, [sessionId]);

  // Clear/delete session
  const clearSession = useCallback(async (): Promise<boolean> => {
    if (!sessionId) return false;
    
    try {
      await sandboxService.deleteSession(sessionId);
      
      // Generate new session ID
      const newId = generateSessionId();
      
      // Update storage
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(SESSION_STORAGE_KEY);
          const sessions: Record<string, string> = stored ? JSON.parse(stored) : {};
          const key = conversationId || '__global__';
          sessions[key] = newId;
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
        } catch { /* ignore */ }
      }
      
      if (mountedRef.current) {
        setSessionId(newId);
        setHistory(null);
        setVariables({});
        setLastResult(null);
        setError(null);
      }
      
      return true;
    } catch {
      return false;
    }
  }, [sessionId, conversationId]);

  // Get packages for language
  const getPackages = useCallback(async (language: SandboxLanguage): Promise<string[]> => {
    try {
      const result = await sandboxService.getPackages(language);
      return result.packages;
    } catch {
      return [];
    }
  }, []);

  // Install packages
  const installPackages = useCallback(async (
    language: SandboxLanguage, 
    packages: string[]
  ): Promise<boolean> => {
    try {
      const result = await sandboxService.installPackages({
        language,
        packages,
        user_id: sessionId || undefined,
      });
      return result.success;
    } catch {
      return false;
    }
  }, [sessionId]);

  // Get package status
  const getPackageStatus = useCallback(async (
    language: SandboxLanguage,
    packageName: string
  ): Promise<boolean> => {
    try {
      const status = await sandboxService.getPackageStatus(language, packageName);
      return status.installed;
    } catch {
      return false;
    }
  }, []);

  // Manual session ID setter (for integration with conversation loading)
  const setSessionIdManually = useCallback((id: string) => {
    setSessionId(id);
    
    // Also update storage
    if (typeof window !== 'undefined' && conversationId) {
      try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        const sessions: Record<string, string> = stored ? JSON.parse(stored) : {};
        sessions[conversationId] = id;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
      } catch { /* ignore */ }
    }
  }, [conversationId]);

  return {
    sessionId,
    isConnected,
    isExecuting,
    lastResult,
    error,
    history,
    variables,
    execute,
    executeReact,
    executeLLM,
    checkConnection,
    loadHistory,
    loadVariables,
    clearSession,
    setSessionId: setSessionIdManually,
    getPackages,
    installPackages,
    getPackageStatus,
  };
}

export default useSandbox;
