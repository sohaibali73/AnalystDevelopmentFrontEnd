/**
 * Sandbox Session Manager - Handles persistence of sandbox sessions
 * Stores sessions, artifacts, and execution history in localStorage
 */

import type {
  SandboxSession,
  LocalSandboxArtifact,
  ExecutionHistoryItem,
  SandboxLanguage,
  SandboxFile,
} from './types';

const STORAGE_KEY = 'potomac_sandbox_sessions';
const ACTIVE_SESSION_KEY = 'potomac_sandbox_active_session';
const FILES_STORAGE_KEY = 'potomac_sandbox_files';
const MAX_SESSIONS = 500;
const MAX_HISTORY_PER_SESSION = 1000;

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Session Manager class
 */
class SessionManager {
  private sessions: Map<string, SandboxSession> = new Map();
  private files: Map<string, SandboxFile> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load sessions from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SandboxSession[];
        parsed.forEach((session) => {
          this.sessions.set(session.id, session);
        });
      }

      const storedFiles = localStorage.getItem(FILES_STORAGE_KEY);
      if (storedFiles) {
        const parsedFiles = JSON.parse(storedFiles) as SandboxFile[];
        parsedFiles.forEach((file) => {
          this.files.set(file.id, file);
        });
      }
    } catch (error) {
      console.error('[SessionManager] Failed to load from storage:', error);
    }
  }

  /**
   * Save sessions to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const sessions = Array.from(this.sessions.values())
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_SESSIONS);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));

      const files = Array.from(this.files.values());
      localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(files));

      this.notifyListeners();
    } catch (error) {
      console.error('[SessionManager] Failed to save to storage:', error);
    }
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Subscribe to session changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Create a new session
   */
  createSession(name?: string): SandboxSession {
    const id = generateId();
    const now = Date.now();

    const session: SandboxSession = {
      id,
      name: name || `Session ${this.sessions.size + 1}`,
      createdAt: now,
      updatedAt: now,
      artifacts: [],
      executionHistory: [],
      variables: {},
      activeLanguage: 'python',
    };

    this.sessions.set(id, session);
    this.setActiveSessionId(id);
    this.saveToStorage();

    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(id: string): SandboxSession | undefined {
    return this.sessions.get(id);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): SandboxSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
  }

  /**
   * Update a session
   */
  updateSession(id: string, updates: Partial<SandboxSession>): void {
    const session = this.sessions.get(id);
    if (!session) return;

    const updated = {
      ...session,
      ...updates,
      updatedAt: Date.now(),
    };

    this.sessions.set(id, updated);
    this.saveToStorage();
  }

  /**
   * Delete a session
   */
  deleteSession(id: string): void {
    this.sessions.delete(id);

    // Clean up associated files
    this.files.forEach((file, fileId) => {
      // Files don't have session reference currently, but could be extended
      // For now, we keep files independent
    });

    const activeId = this.getActiveSessionId();
    if (activeId === id) {
      const remaining = this.getAllSessions();
      if (remaining.length > 0) {
        this.setActiveSessionId(remaining[0].id);
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    }

    this.saveToStorage();
  }

  /**
   * Get the active session ID
   */
  getActiveSessionId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACTIVE_SESSION_KEY);
  }

  /**
   * Set the active session ID
   */
  setActiveSessionId(id: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
    this.notifyListeners();
  }

  /**
   * Get the active session
   */
  getActiveSession(): SandboxSession | undefined {
    const id = this.getActiveSessionId();
    return id ? this.sessions.get(id) : undefined;
  }

  /**
   * Get or create an active session
   */
  getOrCreateActiveSession(): SandboxSession {
    const active = this.getActiveSession();
    if (active) return active;
    return this.createSession();
  }

  /**
   * Add an artifact to a session
   */
  addArtifact(
    sessionId: string,
    artifact: Omit<LocalSandboxArtifact, 'id' | 'createdAt' | 'updatedAt'>
  ): LocalSandboxArtifact {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const now = Date.now();
    const newArtifact: LocalSandboxArtifact = {
      ...artifact,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    session.artifacts.push(newArtifact);
    session.updatedAt = now;
    this.saveToStorage();

    return newArtifact;
  }

  /**
   * Update an artifact
   */
  updateArtifact(
    sessionId: string,
    artifactId: string,
    updates: Partial<LocalSandboxArtifact>
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const index = session.artifacts.findIndex((a) => a.id === artifactId);
    if (index === -1) return;

    session.artifacts[index] = {
      ...session.artifacts[index],
      ...updates,
      updatedAt: Date.now(),
    };
    session.updatedAt = Date.now();
    this.saveToStorage();
  }

  /**
   * Delete an artifact
   */
  deleteArtifact(sessionId: string, artifactId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.artifacts = session.artifacts.filter((a) => a.id !== artifactId);
    session.updatedAt = Date.now();
    this.saveToStorage();
  }

  /**
   * Add execution to history
   */
  addExecution(
    sessionId: string,
    execution: Omit<ExecutionHistoryItem, 'id' | 'timestamp'>
  ): ExecutionHistoryItem {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const newExecution: ExecutionHistoryItem = {
      ...execution,
      id: generateId(),
      timestamp: Date.now(),
    };

    session.executionHistory.push(newExecution);

    // Trim history if too long
    if (session.executionHistory.length > MAX_HISTORY_PER_SESSION) {
      session.executionHistory = session.executionHistory.slice(
        -MAX_HISTORY_PER_SESSION
      );
    }

    session.updatedAt = Date.now();
    this.saveToStorage();

    return newExecution;
  }

  /**
   * Clear execution history
   */
  clearHistory(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.executionHistory = [];
    session.updatedAt = Date.now();
    this.saveToStorage();
  }

  /**
   * Set session variables
   */
  setVariables(sessionId: string, variables: Record<string, unknown>): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.variables = { ...session.variables, ...variables };
    session.updatedAt = Date.now();
    this.saveToStorage();
  }

  /**
   * Add a file
   */
  addFile(file: Omit<SandboxFile, 'id' | 'createdAt'>): SandboxFile {
    const newFile: SandboxFile = {
      ...file,
      id: generateId(),
      createdAt: Date.now(),
    };

    this.files.set(newFile.id, newFile);
    this.saveToStorage();

    return newFile;
  }

  /**
   * Get a file by ID
   */
  getFile(id: string): SandboxFile | undefined {
    return this.files.get(id);
  }

  /**
   * Get all files
   */
  getAllFiles(): SandboxFile[] {
    return Array.from(this.files.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  /**
   * Delete a file
   */
  deleteFile(id: string): void {
    this.files.delete(id);
    this.saveToStorage();
  }

  /**
   * Export session as JSON
   */
  exportSession(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    return JSON.stringify(session, null, 2);
  }

  /**
   * Import session from JSON
   */
  importSession(json: string): SandboxSession {
    const parsed = JSON.parse(json) as SandboxSession;
    const id = generateId();
    const now = Date.now();

    const session: SandboxSession = {
      ...parsed,
      id,
      name: `${parsed.name} (Imported)`,
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(id, session);
    this.saveToStorage();

    return session;
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.sessions.clear();
    this.files.clear();

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      localStorage.removeItem(FILES_STORAGE_KEY);
    }

    this.notifyListeners();
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

// Export class for testing
export { SessionManager };
