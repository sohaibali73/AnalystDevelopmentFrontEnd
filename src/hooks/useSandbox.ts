'use client';

/**
 * useSandbox - React hook for sandbox integration
 * Provides easy access to sandbox functionality with state management
 */

import { useState, useCallback, useEffect } from 'react';
import {
  sandboxService,
  sessionManager,
  SandboxError,
  type SandboxSession,
  type SandboxArtifact,
  type SandboxLanguage,
  type ExecutionResult,
  type ExecuteCodeRequest,
} from '@/lib/sandbox';

export interface UseSandboxOptions {
  autoCreateSession?: boolean;
  defaultLanguage?: SandboxLanguage;
}

export interface UseSandboxReturn {
  // State
  session: SandboxSession | null;
  sessions: SandboxSession[];
  isConnected: boolean | null;
  isExecuting: boolean;
  lastResult: ExecutionResult | null;
  error: string | null;
  
  // Actions
  execute: (request: ExecuteCodeRequest) => Promise<ExecutionResult>;
  executeLLM: (request: ExecuteCodeRequest) => Promise<ExecutionResult>;
  createSession: (name?: string) => SandboxSession;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  addArtifact: (artifact: Omit<SandboxArtifact, 'id' | 'createdAt' | 'updatedAt'>) => SandboxArtifact | null;
  clearHistory: () => void;
  checkConnection: () => Promise<boolean>;
  
  // Utilities
  getPackages: (language: SandboxLanguage) => Promise<string[]>;
  installPackages: (language: SandboxLanguage, packages: string[]) => Promise<boolean>;
}

export function useSandbox(options: UseSandboxOptions = {}): UseSandboxReturn {
  const { autoCreateSession = true, defaultLanguage = 'python' } = options;

  // State
  const [session, setSession] = useState<SandboxSession | null>(null);
  const [sessions, setSessions] = useState<SandboxSession[]>([]);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    // Load sessions
    const allSessions = sessionManager.getAllSessions();
    setSessions(allSessions);

    // Get or create active session
    if (autoCreateSession) {
      const activeSession = sessionManager.getOrCreateActiveSession();
      setSession(activeSession);
    } else {
      const activeSession = sessionManager.getActiveSession();
      setSession(activeSession || null);
    }

    // Check connection
    sandboxService.healthCheck().then(setIsConnected).catch(() => setIsConnected(false));

    // Subscribe to changes
    const unsubscribe = sessionManager.subscribe(() => {
      setSessions(sessionManager.getAllSessions());
      const active = sessionManager.getActiveSession();
      setSession(active || null);
    });

    return unsubscribe;
  }, [autoCreateSession]);

  // Execute code
  const execute = useCallback(async (request: ExecuteCodeRequest): Promise<ExecutionResult> => {
    setIsExecuting(true);
    setError(null);

    try {
      const result = await sandboxService.execute(request);
      setLastResult(result);

      // Add to session history
      if (session) {
        sessionManager.addExecution(session.id, {
          code: request.code,
          language: request.language || 'python',
          result,
        });
      }

      return result;
    } catch (err) {
      const message = err instanceof SandboxError ? err.message : 'Execution failed';
      setError(message);
      
      const errorResult: ExecutionResult = {
        success: false,
        output: '',
        error: message,
        execution_time_ms: 0,
        language: request.language || 'python',
      };
      setLastResult(errorResult);
      
      return errorResult;
    } finally {
      setIsExecuting(false);
    }
  }, [session]);

  // Execute in LLM sandbox (Docker)
  const executeLLM = useCallback(async (request: ExecuteCodeRequest): Promise<ExecutionResult> => {
    setIsExecuting(true);
    setError(null);

    try {
      const result = await sandboxService.executeLLM(request);
      setLastResult(result);

      // Add to session history
      if (session) {
        sessionManager.addExecution(session.id, {
          code: request.code,
          language: request.language || 'python',
          result,
        });
      }

      return result;
    } catch (err) {
      const message = err instanceof SandboxError ? err.message : 'Execution failed';
      setError(message);
      
      const errorResult: ExecutionResult = {
        success: false,
        output: '',
        error: message,
        execution_time_ms: 0,
        language: request.language || 'python',
      };
      setLastResult(errorResult);
      
      return errorResult;
    } finally {
      setIsExecuting(false);
    }
  }, [session]);

  // Create session
  const createSession = useCallback((name?: string): SandboxSession => {
    const newSession = sessionManager.createSession(name);
    setSession(newSession);
    return newSession;
  }, []);

  // Switch session
  const switchSession = useCallback((sessionId: string): void => {
    sessionManager.setActiveSessionId(sessionId);
    const switched = sessionManager.getSession(sessionId);
    if (switched) {
      setSession(switched);
    }
  }, []);

  // Delete session
  const deleteSession = useCallback((sessionId: string): void => {
    sessionManager.deleteSession(sessionId);
    
    // If deleted current session, switch to another
    if (session?.id === sessionId) {
      const remaining = sessionManager.getAllSessions();
      if (remaining.length > 0) {
        switchSession(remaining[0].id);
      } else if (autoCreateSession) {
        createSession();
      } else {
        setSession(null);
      }
    }
  }, [session, switchSession, createSession, autoCreateSession]);

  // Add artifact
  const addArtifact = useCallback(
    (artifact: Omit<SandboxArtifact, 'id' | 'createdAt' | 'updatedAt'>): SandboxArtifact | null => {
      if (!session) return null;
      return sessionManager.addArtifact(session.id, artifact);
    },
    [session]
  );

  // Clear history
  const clearHistory = useCallback((): void => {
    if (!session) return;
    sessionManager.clearHistory(session.id);
  }, [session]);

  // Check connection
  const checkConnection = useCallback(async (): Promise<boolean> => {
    const connected = await sandboxService.healthCheck();
    setIsConnected(connected);
    return connected;
  }, []);

  // Get packages
  const getPackages = useCallback(async (language: SandboxLanguage): Promise<string[]> => {
    try {
      const result = await sandboxService.getPackages(language);
      return result.packages;
    } catch {
      return [];
    }
  }, []);

  // Install packages
  const installPackages = useCallback(
    async (language: SandboxLanguage, packages: string[]): Promise<boolean> => {
      try {
        const result = await sandboxService.installPackages({
          language,
          packages,
          user_id: session?.id,
        });
        return result.success;
      } catch {
        return false;
      }
    },
    [session]
  );

  return {
    session,
    sessions,
    isConnected,
    isExecuting,
    lastResult,
    error,
    execute,
    executeLLM,
    createSession,
    switchSession,
    deleteSession,
    addArtifact,
    clearHistory,
    checkConnection,
    getPackages,
    installPackages,
  };
}

export default useSandbox;
