// API Client for communicating with the backend
// FULLY CORRECTED VERSION - All streaming fixes applied

import {
  User,
  AuthResponse,
  Message,
  Conversation,
  AFLGenerateRequest,
  AFLCode,
  Document,
  SearchResult,
  BacktestResult,
  Strategy,
  BrainStats,
  TrainingData,
  TrainingCreateRequest,
  QuickTrainRequest,
  CorrectionRequest,
  TrainingStats,
  TrainingCategory,
  TrainingType,
  UserFeedback,
  FeedbackCreateRequest,
  FeedbackReviewRequest,
  FeedbackStatus,
  TrainingSuggestion,
  SuggestionCreateRequest,
  SuggestionReviewRequest,
  SuggestionStatus,
  TrainingTestRequest,
  TrainingTestResult,
  KnowledgeSearchResult,
  KnowledgeCategory,
  TrainingTypeInfo,
  TrainingEffectiveness,
  LearningCurve,
  PopularPattern,
} from '@/types/api';
import { getApiUrl } from './env';
import { storage } from './storage';
import { logger } from './logger';

const API_BASE_URL = getApiUrl();

class APIClient {
  private token: string | null = null;

  constructor() {
    // Initialize in-memory token from storage if available (SSR-safe)
    this.token = storage.getItem('auth_token');
  }

  private setToken(token: string) {
    this.token = token;
    try {
      storage.setItem('auth_token', token);
    } catch (e) {
      // storage may be unavailable in SSR or strict environments; keep in-memory token
      logger.warn('Failed to persist auth token to storage', { error: e instanceof Error ? e.message : String(e) });
    }
  }

  private getToken() {
    // Prefer in-memory token for speed; fall back to storage if not set
    if (this.token) return this.token;
    try {
      const t = storage.getItem('auth_token');
      this.token = t;
      return t;
    } catch (e) {
      logger.warn('Failed to read auth token from storage', { error: e instanceof Error ? e.message : String(e) });
      return this.token;
    }
  }

  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    isFormData: boolean = false
  ): Promise<T> {
    const headers: HeadersInit = {};
    const token = this.getToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData && method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body) {
      if (isFormData) {
        config.body = body;
      } else {
        config.body = JSON.stringify(body);
      }
    }

    try {
      // Auth endpoints are proxied through Next.js API routes to avoid CORS issues
      const AUTH_PROXY_ENDPOINTS: Record<string, string> = {
        '/auth/login': '/api/auth/login',
        '/auth/register': '/api/auth/register',
        '/auth/me': '/api/auth/me',
      };

      let url: string;
      if (AUTH_PROXY_ENDPOINTS[endpoint]) {
        // Use relative URL so it goes through Next.js (same origin, no CORS)
        url = AUTH_PROXY_ENDPOINTS[endpoint];
      } else {
        url = `${API_BASE_URL}${endpoint}`;
      }

      // Debug logs to help track token and header issues
      logger.debug('API Request', { method, url });
      if (token) {
        logger.debug('Using auth token', { hasToken: true });
      } else {
        logger.debug('No auth token present for request', { endpoint });
      }

      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          detail: `Request failed with status ${response.status}`
        }));
        logger.error(`API Error: ${method} ${endpoint}`, error);
        throw new Error(error.detail || error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        logger.error('Network error - API server may be unavailable', error, { url: API_BASE_URL });
        throw new Error(`Cannot connect to API server at ${API_BASE_URL}. Please check your internet connection or try again later.`);
      }
      throw error;
    }
  }

  // ==================== AUTH ENDPOINTS ====================

  async register(email: string, password: string, name: string, claudeApiKey: string, tavilyApiKey?: string) {
    const response = await this.request<AuthResponse>('/auth/register', 'POST', {
      email,
      password,
      name,
      claude_api_key: claudeApiKey,
      tavily_api_key: tavilyApiKey,
    });
    this.setToken(response.access_token);
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<AuthResponse>('/auth/login', 'POST', {
      email,
      password,
    });
    this.setToken(response.access_token);
    return response;
  }

  async getCurrentUser() {
    return this.request<User>('/auth/me');
  }

  async updateProfile(data: { name?: string; nickname?: string; claude_api_key?: string; tavily_api_key?: string }) {
    return this.request<User>('/auth/me', 'PUT', data);
  }

  logout() {
    this.token = null;
    try {
      localStorage.removeItem('auth_token');
    } catch (e) {
      // Silently fail if localStorage is not available
    }
  }

  // ==================== AFL ENDPOINTS ====================

  async generateAFL(request: AFLGenerateRequest) {
    return this.request<AFLCode>('/afl/generate', 'POST', request);
  }

  async optimizeAFL(code: string) {
    return this.request<AFLCode>('/afl/optimize', 'POST', { code });
  }

  async debugAFL(code: string, errorMessage?: string) {
    return this.request<AFLCode>('/afl/debug', 'POST', {
      code,
      error_message: errorMessage,
    });
  }

  async explainAFL(code: string) {
    return this.request<{ explanation: string }>('/afl/explain', 'POST', { code });
  }

  async validateAFL(code: string) {
    return this.request<{ valid: boolean; errors?: string[] }>('/afl/validate', 'POST', { code });
  }

  async getAFLCodes() {
    return this.request<AFLCode[]>('/afl/codes');
  }

  async getAFLCode(codeId: string) {
    return this.request<AFLCode>(`/afl/codes/${codeId}`);
  }

  async deleteAFLCode(codeId: string) {
    return this.request<{ success: boolean }>(`/afl/codes/${codeId}`, 'DELETE');
  }

  // FIXED: Added missing AFL file upload endpoints
  async uploadAflFile(file: File, description?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);

    return this.request<{
      id: string;
      filename: string;
      description?: string;
      size: number;
      content_type: string;
      uploaded_at: string;
    }>('/afl/upload', 'POST', formData, true);
  }

  async getAflFiles() {
    return this.request<{
      id: string;
      filename: string;
      description?: string;
      size: number;
      content_type: string;
      uploaded_at: string;
    }[]>('/afl/files');
  }

  async getAflFile(fileId: string) {
    return this.request<{
      id: string;
      filename: string;
      description?: string;
      size: number;
      content_type: string;
      uploaded_at: string;
      content?: string;
    }>(`/afl/files/${fileId}`);
  }

  async deleteAflFile(fileId: string) {
    return this.request<{ success: boolean }>(`/afl/files/${fileId}`, 'DELETE');
  }

  // FIXED: Added missing AFL settings presets endpoints
  async saveSettingsPreset(preset: {
    name: string;
    description?: string;
    settings: any;
    is_default?: boolean;
  }) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      settings: any;
      is_default: boolean;
      created_at: string;
      updated_at: string;
    }>('/afl/settings/presets', 'POST', preset);
  }

  async getSettingsPresets() {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      settings: any;
      is_default: boolean;
      created_at: string;
      updated_at: string;
    }[]>('/afl/settings/presets');
  }

  async getSettingsPreset(presetId: string) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      settings: any;
      is_default: boolean;
      created_at: string;
      updated_at: string;
    }>(`/afl/settings/presets/${presetId}`);
  }

  async updateSettingsPreset(presetId: string, updates: {
    name?: string;
    description?: string;
    settings?: any;
  }) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      settings: any;
      is_default: boolean;
      created_at: string;
      updated_at: string;
    }>(`/afl/settings/presets/${presetId}`, 'PUT', updates);
  }

  async deleteSettingsPreset(presetId: string) {
    return this.request<{ success: boolean }>(`/afl/settings/presets/${presetId}`, 'DELETE');
  }

  async setDefaultPreset(presetId: string) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      settings: any;
      is_default: boolean;
      created_at: string;
      updated_at: string;
    }>(`/afl/settings/presets/${presetId}/set-default`, 'POST');
  }

  // FIXED: Added missing AFL history endpoints
  async saveAflHistory(entry: {
    prompt: string;
    strategy_type?: string;
    settings?: any;
    generated_code: string;
    success: boolean;
    error_message?: string;
  }) {
    return this.request<{
      id: string;
      prompt: string;
      strategy_type?: string;
      settings?: any;
      generated_code: string;
      success: boolean;
      error_message?: string;
      created_at: string;
    }>('/afl/history', 'POST', entry);
  }

  async getAflHistory(limit: number = 50) {
    return this.request<{
      id: string;
      prompt: string;
      strategy_type?: string;
      settings?: any;
      generated_code: string;
      success: boolean;
      error_message?: string;
      created_at: string;
    }[]>(`/afl/history?limit=${limit}`);
  }

  async deleteAflHistory(historyId: string) {
    return this.request<{ success: boolean }>(`/afl/history/${historyId}`, 'DELETE');
  }

  // ==================== CHAT ENDPOINTS ====================

  async getConversations() {
    return this.request<Conversation[]>('/chat/conversations');
  }

  // FIXED: Added title and conversationType parameters to match backend
  async createConversation(title?: string, conversationType: string = 'agent') {
    return this.request<Conversation>('/chat/conversations', 'POST', {
      title: title || "New Conversation",
      conversation_type: conversationType
    });
  }

  async getMessages(conversationId: string) {
    return this.request<Message[]>(`/chat/conversations/${conversationId}/messages`);
  }

  async renameConversation(conversationId: string, title: string) {
    return this.request<any>(`/chat/conversations/${conversationId}`, 'PATCH', { title });
  }

  async deleteConversation(conversationId: string) {
    return this.request<{ success: boolean }>(`/chat/conversations/${conversationId}`, 'DELETE');
  }

  // FIXED: Correct return type matching backend response
  async sendMessage(content: string, conversationId?: string) {
    return this.request<{
      conversation_id: string;
      response: string;
      parts?: any[];
      tools_used?: any[];
      all_artifacts?: any[];
    }>('/chat/message', 'POST', {
      content,
      conversation_id: conversationId,
    });
  }

  /**
   * Send a message with streaming response using Vercel AI SDK Data Stream Protocol.
   * 
   * FULLY CORRECTED VERSION with proper endpoint and protocol parsing
   */
  async sendMessageStream(
    content: string,
    conversationId?: string,
    options?: {
      signal?: AbortSignal;
      onText?: (text: string) => void;
      onToolCall?: (toolCallId: string, toolName: string, args: any) => void;
      onToolResult?: (toolCallId: string, result: any) => void;
      onData?: (data: any) => void;
      onError?: (error: string) => void;
      onFinish?: (finishReason: string, usage: any) => void;
    }
  ): Promise<{ conversationId: string }> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // CRITICAL FIX: Use correct streaming endpoint
      const url = `${API_BASE_URL}/chat/stream`;
      console.log(`Streaming Request: POST ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        mode: 'cors',
        credentials: 'omit',
        signal: options?.signal,
        body: JSON.stringify({
          content,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          detail: `Request failed with status ${response.status}` 
        }));
        throw new Error(error.detail || error.message || `HTTP ${response.status}`);
      }

      // FIXED: Extract conversation ID from response headers
      const newConversationId = response.headers.get('X-Conversation-Id') || conversationId || '';

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines from buffer
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            // FIXED: Proper Vercel AI SDK protocol parsing
            // Format is "TYPE:JSON_DATA" where TYPE is a single character
            const typeCode = line[0];
            const content = line.substring(2); // Skip "TYPE:" prefix

            if (!content) continue;

            try {
              const parsed = JSON.parse(content);
              
              // FIXED: Route based on Vercel AI SDK protocol type codes
              switch (typeCode) {
                case '0': // Text Part
                  if (typeof parsed === 'string') {
                    options?.onText?.(parsed);
                  } else if (parsed.text) {
                    options?.onText?.(parsed.text);
                  }
                  break;

                case '2': // Data Part (Artifacts) - THIS IS THE KEY ONE
                  options?.onData?.(parsed);
                  break;

                case '3': // Error Part
                  console.error('Stream error:', parsed);
                  options?.onError?.(typeof parsed === 'string' ? parsed : parsed.message || 'Unknown error');
                  break;

                case '9': // Tool Call Part
                  if (parsed.toolCallId && parsed.toolName) {
                    options?.onToolCall?.(parsed.toolCallId, parsed.toolName, parsed.args || {});
                  }
                  break;

                case 'a': // Tool Result Part
                  if (parsed.toolCallId) {
                    options?.onToolResult?.(parsed.toolCallId, parsed.result);
                  }
                  break;

                case 'd': // Finish Message Part
                  if (parsed.finishReason) {
                    options?.onFinish?.(parsed.finishReason, parsed.usage || {});
                  }
                  break;

                case 'e': // Finish Step Part (currently unused)
                  break;

                default:
                  console.warn('Unknown stream type code:', typeCode, 'Content:', content.substring(0, 100));
              }
            } catch (parseError) {
              console.warn('Failed to parse protocol content:', content.substring(0, 100), parseError);
            }
          } catch (error) {
            console.error('Error processing line:', error);
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        try {
          const typeCode = buffer[0];
          const content = buffer.substring(2);
          
          if (content) {
            const parsed = JSON.parse(content);
            
            if (typeCode === 'd' && parsed.finishReason) {
              options?.onFinish?.(parsed.finishReason, parsed.usage || {});
            } else if (typeCode === '2') {
              options?.onData?.(parsed);
            }
          }
        } catch (error) {
          console.error('Error processing final buffer:', error);
        }
      }

      // FIXED: Return conversation ID
      return { conversationId: newConversationId };

    } catch (error) {
      console.error('Stream error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      options?.onError?.(errorMsg);
      throw error;
    }
  }

  /**
   * Upload file to conversation
   */
  async uploadFile(conversationId: string, formData: FormData) {
    const token = this.getToken();
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/upload/conversations/${conversationId}`,
      {
        method: 'POST',
        headers,
        mode: 'cors',
        credentials: 'omit',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        detail: 'Upload failed' 
      }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get the streaming endpoint URL for direct use
   */
  getStreamEndpoint(): string {
    return `${API_BASE_URL}/chat/stream`;
  }

  /**
   * Get the direct AI SDK v6 streaming endpoint URL
   */
  getStreamV6Endpoint(): string {
    return `${API_BASE_URL}/chat/v6`;
  }

  /**
   * Send a message using direct AI SDK Data Stream Protocol (v6 endpoint).
   * Bypasses the protocol translation wrapper for cleaner integration.
   */
  async sendMessageStreamV6(
    content: string,
    conversationId?: string,
    options?: {
      signal?: AbortSignal;
      onText?: (text: string) => void;
      onToolCall?: (toolCallId: string, toolName: string, args: any) => void;
      onToolResult?: (toolCallId: string, result: any) => void;
      onData?: (data: any) => void;
      onError?: (error: string) => void;
      onFinish?: (finishReason: string, usage: any) => void;
    }
  ): Promise<{ conversationId: string }> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // Use direct v6 endpoint (bypasses protocol translation)
      const url = `${API_BASE_URL}/chat/v6`;
      console.log(`Direct V6 Streaming Request: POST ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        mode: 'cors',
        credentials: 'omit',
        signal: options?.signal,
        body: JSON.stringify({
          content,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          detail: `Request failed with status ${response.status}` 
        }));
        throw new Error(error.detail || error.message || `HTTP ${response.status}`);
      }

      // Extract conversation ID from response headers
      const newConversationId = response.headers.get('X-Conversation-Id') || conversationId || '';

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines from buffer
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            // Direct AI SDK Data Stream Protocol parsing
            // Format is "TYPE:JSON_DATA" where TYPE is a single character
            const typeCode = line[0];
            const content = line.substring(2); // Skip "TYPE:" prefix

            if (!content) continue;

            try {
              const parsed = JSON.parse(content);
              
              // Route based on AI SDK Data Stream Protocol type codes
              switch (typeCode) {
                case '0': // Text Part
                  if (typeof parsed === 'string') {
                    options?.onText?.(parsed);
                  } else if (parsed.text) {
                    options?.onText?.(parsed.text);
                  }
                  break;

                case '2': // Data Part (Artifacts)
                  options?.onData?.(parsed);
                  break;

                case '3': // Error Part
                  console.error('Stream error:', parsed);
                  options?.onError?.(typeof parsed === 'string' ? parsed : parsed.message || 'Unknown error');
                  break;

                case '9': // Tool Call Part
                  if (parsed.toolCallId && parsed.toolName) {
                    options?.onToolCall?.(parsed.toolCallId, parsed.toolName, parsed.args || {});
                  }
                  break;

                case 'a': // Tool Result Part
                  if (parsed.toolCallId) {
                    options?.onToolResult?.(parsed.toolCallId, parsed.result);
                  }
                  break;

                case 'd': // Finish Message Part
                  if (parsed.finishReason) {
                    options?.onFinish?.(parsed.finishReason, parsed.usage || {});
                  }
                  break;

                case 'e': // Finish Step Part (currently unused)
                  break;

                default:
                  console.warn('Unknown stream type code:', typeCode, 'Content:', content.substring(0, 100));
              }
            } catch (parseError) {
              console.warn('Failed to parse protocol content:', content.substring(0, 100), parseError);
            }
          } catch (error) {
            console.error('Error processing line:', error);
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        try {
          const typeCode = buffer[0];
          const content = buffer.substring(2);
          
          if (content) {
            const parsed = JSON.parse(content);
            
            if (typeCode === 'd' && parsed.finishReason) {
              options?.onFinish?.(parsed.finishReason, parsed.usage || {});
            } else if (typeCode === '2') {
              options?.onData?.(parsed);
            }
          }
        } catch (error) {
          console.error('Error processing final buffer:', error);
        }
      }

      return { conversationId: newConversationId };

    } catch (error) {
      console.error('V6 Stream error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      options?.onError?.(errorMsg);
      throw error;
    }
  }

  async getChatTools() {
    return this.request<{ tools: any[]; count: number }>('/chat/tools');
  }

  // ==================== BRAIN/KNOWLEDGE BASE ENDPOINTS ====================

  async uploadDocument(file: File, title?: string, category: string = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    formData.append('category', category);

    return this.request<Document>('/brain/upload', 'POST', formData, true);
  }

  async uploadDocumentsBatch(files: File[], category: string = 'general') {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('category', category);

    return this.request<Document[]>('/brain/upload-batch', 'POST', formData, true);
  }

  async uploadText(text: string, title?: string, category: string = 'general') {
    return this.request<Document>('/brain/upload-text', 'POST', {
      text,
      title,
      category,
    });
  }

  async searchKnowledge(query: string, category?: string, limit: number = 10) {
    return this.request<SearchResult[]>('/brain/search', 'POST', {
      query,
      category,
      limit,
    });
  }

  async getDocuments() {
    return this.request<Document[]>('/brain/documents');
  }

  async getBrainStats() {
    return this.request<BrainStats>('/brain/stats');
  }

  async deleteDocument(documentId: string) {
    return this.request<{ success: boolean }>(`/brain/documents/${documentId}`, 'DELETE');
  }

  // ==================== BACKTEST ENDPOINTS ====================

  async uploadBacktest(file: File, strategyId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (strategyId) formData.append('strategy_id', strategyId);

    return this.request<BacktestResult>('/backtest/upload', 'POST', formData, true);
  }

  async getBacktest(backtestId: string) {
    return this.request<BacktestResult>(`/backtest/${backtestId}`);
  }

  async getStrategyBacktests(strategyId: string) {
    return this.request<BacktestResult[]>(`/backtest/strategy/${strategyId}`);
  }

  // ==================== RESEARCHER ENDPOINTS ====================
  // FIXED: Added missing researcher endpoints with correct /api prefix

  async getCompanyResearch(symbol: string) {
    return this.request<{
      symbol: string;
      name: string;
      sector: string;
      industry: string;
      market_cap: number;
      price: number;
      data: any;
    }>(`/researcher/company/${symbol}`);
  }

  async getCompanyNews(symbol: string) {
    return this.request<{
      symbol: string;
      news: any[];
    }>(`/researcher/news/${symbol}`);
  }

  async analyzeStrategyFit(
    symbol: string,
    strategy_type: string,
    timeframe: string,
    additional_context?: string
  ) {
    return this.request<{
      symbol: string;
      strategy_type: string;
      timeframe: string;
      analysis: string;
      recommendations: any[];
    }>('/researcher/strategy-analysis', 'POST', {
      symbol,
      strategy_type,
      timeframe,
      additional_context,
    });
  }

  async getPeerComparison(symbol: string, peers?: string[], sector?: string) {
    return this.request<{
      symbol: string;
      peers: string[];
      comparison: any;
      analysis: string;
    }>('/researcher/comparison', 'POST', {
      symbol,
      peers,
      sector,
    });
  }

  async getMacroContext() {
    return this.request<{
      market_overview: any;
      economic_indicators: any;
      sector_performance: any;
      analysis: string;
    }>('/researcher/macro-context');
  }

  async getSecFilings(symbol: string) {
    return this.request<{
      symbol: string;
      filings: any[];
    }>(`/researcher/sec-filings/${symbol}`);
  }

  async generateResearchReport(
    symbol: string,
    include_peers: boolean = true,
    include_technicals: boolean = true,
    include_fundamentals: boolean = true
  ) {
    return this.request<{
      symbol: string;
      report: string;
      sections: any;
    }>('/researcher/generate-report', 'POST', {
      symbol,
      include_peers,
      include_technicals,
      include_fundamentals,
    });
  }

  async getTrendingResearch() {
    return this.request<{
      trending_stocks: any[];
      sector_trends: any[];
      market_movers: any[];
    }>('/researcher/trending');
  }

  // ==================== REVERSE ENGINEER ENDPOINTS ====================

  async startReverseEngineering(query: string) {
    return this.request<Strategy>('/reverse-engineer/start', 'POST', { query });
  }

  async continueReverseEngineering(strategyId: string, message: string) {
    return this.request<Strategy>('/reverse-engineer/continue', 'POST', {
      strategy_id: strategyId,
      message,
    });
  }

  async researchStrategy(strategyId: string) {
    return this.request<Strategy>(`/reverse-engineer/research/${strategyId}`, 'POST', {});
  }

  async generateStrategySchematic(strategyId: string) {
    return this.request<Strategy>(`/reverse-engineer/schematic/${strategyId}`, 'POST', {});
  }

  async generateStrategyCode(strategyId: string) {
    return this.request<Strategy>(`/reverse-engineer/generate-code/${strategyId}`, 'POST', {});
  }

  async getStrategy(strategyId: string) {
    return this.request<Strategy>(`/reverse-engineer/strategy/${strategyId}`);
  }

  // FIXED: Added missing reverse engineer history endpoints
  async saveReverseEngineerHistory(entry: {
    strategy_id: string;
    query: string;
    phase: string;
    result: any;
  }) {
    return this.request<{ id: string; success: boolean }>('/reverse-engineer/history', 'POST', entry);
  }

  async getReverseEngineerHistory(limit: number = 50) {
    return this.request<{
      id: string;
      strategy_id: string;
      query: string;
      phase: string;
      result: any;
      created_at: string;
    }[]>(`/reverse-engineer/history?limit=${limit}`);
  }

  async deleteReverseEngineerHistory(historyId: string) {
    return this.request<{ success: boolean }>(`/reverse-engineer/history/${historyId}`, 'DELETE');
  }

  // ==================== TRAIN ENDPOINTS ====================

  async submitFeedback(feedback: FeedbackCreateRequest) {
    return this.request<UserFeedback>('/train/feedback', 'POST', feedback);
  }

  async getMyFeedback() {
    return this.request<UserFeedback[]>('/train/feedback/my');
  }

  async getFeedback(feedbackId: string) {
    return this.request<UserFeedback>(`/train/feedback/${feedbackId}`);
  }

  async testTraining(request: TrainingTestRequest) {
    return this.request<TrainingTestResult>('/train/test', 'POST', request);
  }

  async getTrainingEffectiveness() {
    return this.request<TrainingEffectiveness>('/train/effectiveness');
  }

  async suggestTraining(suggestion: SuggestionCreateRequest) {
    return this.request<TrainingSuggestion>('/train/suggest', 'POST', suggestion);
  }

  async getMySuggestions() {
    return this.request<TrainingSuggestion[]>('/train/suggestions/my');
  }

  async getLearningCurve() {
    return this.request<LearningCurve>('/train/analytics/learning-curve');
  }

  async getPopularPatterns() {
    return this.request<PopularPattern[]>('/train/analytics/popular-patterns');
  }

  async searchTrainingKnowledge(query: string, category?: TrainingCategory, limit: number = 10) {
    const params = new URLSearchParams({ query, limit: limit.toString() });
    if (category) params.append('category', category);
    return this.request<KnowledgeSearchResult[]>(`/train/knowledge/search?${params}`);
  }

  async getKnowledgeCategories() {
    return this.request<KnowledgeCategory[]>('/train/knowledge/categories');
  }

  async getTrainingTypes() {
    return this.request<TrainingTypeInfo[]>('/train/knowledge/types');
  }

  async quickLearn(code: string, explanation: string) {
    return this.request<{ success: boolean; message: string }>('/train/quick-learn', 'POST', {
      code,
      explanation,
    });
  }

  async getTrainStats() {
    return this.request<TrainingStats>('/train/stats');
  }

  // ==================== CONTENT ENDPOINTS ====================

  // Articles
  async getArticles(status?: string, limit?: number) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    const qs = params.toString();
    return this.request<any[]>(`/content/articles${qs ? '?' + qs : ''}`);
  }
  async createArticle(data: { title: string; content: string; status?: string; tags?: string[]; metadata?: any }) {
    return this.request<any>('/content/articles', 'POST', data);
  }
  async updateArticle(id: string, data: { title?: string; content?: string; status?: string; tags?: string[]; metadata?: any }) {
    return this.request<any>(`/content/articles/${id}`, 'PUT', data);
  }
  async deleteArticle(id: string) {
    return this.request<{ success: boolean }>(`/content/articles/${id}`, 'DELETE');
  }

  // Documents
  async getDocumentsContent(limit?: number) {
    const qs = limit ? `?limit=${limit}` : '';
    return this.request<any[]>(`/content/documents${qs}`);
  }
  async createDocument(data: { title: string; content: string; status?: string; tags?: string[]; metadata?: any }) {
    return this.request<any>('/content/documents', 'POST', data);
  }
  async updateDocument(id: string, data: { title?: string; content?: string; status?: string; tags?: string[]; metadata?: any }) {
    return this.request<any>(`/content/documents/${id}`, 'PUT', data);
  }
  async deleteContentDocument(id: string) {
    return this.request<{ success: boolean }>(`/content/documents/${id}`, 'DELETE');
  }

  // Slides
  async getSlides(limit?: number) {
    const qs = limit ? `?limit=${limit}` : '';
    return this.request<any[]>(`/content/slides${qs}`);
  }
  async createSlide(data: { title: string; content: string; status?: string; tags?: string[]; metadata?: any }) {
    return this.request<any>('/content/slides', 'POST', data);
  }
  async updateSlide(id: string, data: { title?: string; content?: string; status?: string; tags?: string[]; metadata?: any }) {
    return this.request<any>(`/content/slides/${id}`, 'PUT', data);
  }
  async deleteSlide(id: string) {
    return this.request<{ success: boolean }>(`/content/slides/${id}`, 'DELETE');
  }
  async generateSlides(prompt: string, slideCount?: number, style?: string) {
    return this.request<any>('/content/slides/generate', 'POST', { prompt, slide_count: slideCount, style });
  }

  // Dashboards
  async getDashboards(limit?: number) {
    const qs = limit ? `?limit=${limit}` : '';
    return this.request<any[]>(`/content/dashboards${qs}`);
  }
  async createDashboard(data: { title: string; content: string; status?: string; tags?: string[]; metadata?: any }) {
    return this.request<any>('/content/dashboards', 'POST', data);
  }
  async updateDashboard(id: string, data: { title?: string; content?: string; status?: string; tags?: string[]; metadata?: any }) {
    return this.request<any>(`/content/dashboards/${id}`, 'PUT', data);
  }
  async deleteDashboard(id: string) {
    return this.request<{ success: boolean }>(`/content/dashboards/${id}`, 'DELETE');
  }

  // Content Chat
  async sendContentChat(message: string, context?: string) {
    return this.request<{ response: string; suggestions?: string[] }>('/content/chat', 'POST', { message, context });
  }

  // Writing Styles
  async getWritingStyles() {
    return this.request<any>('/content/styles');
  }
  async updateWritingStyles(styles: any) {
    return this.request<any>('/content/styles', 'PUT', styles);
  }

  // Content Jobs
  async getContentJob(jobId: string) {
    return this.request<any>(`/content/jobs/${jobId}`);
  }

  // All Content
  async getAllContent() {
    return this.request<any>('/content/all');
  }

  // ==================== PRESENTATIONS ENDPOINTS ====================

  async generatePresentation(prompt: string, options?: { slideCount?: number; style?: string; includeCharts?: boolean }) {
    const token = this.getToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/presentations/generate`, {
      method: 'POST',
      headers,
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({ prompt, ...options }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
      throw new Error(err.detail || `HTTP ${response.status}`);
    }
    return response;
  }

  async generateMarketOutlook() {
    return this.request<any>('/presentations/generate-market-outlook', 'POST');
  }

  async listPresentations() {
    return this.request<any[]>('/presentations');
  }

  async downloadPresentation(id: string): Promise<Blob> {
    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/presentations/${id}/download`, { headers, mode: 'cors', credentials: 'omit' });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    return response.blob();
  }

  async deletePresentation(id: string) {
    return this.request<{ success: boolean }>(`/presentations/${id}`, 'DELETE');
  }

  // ==================== UTILITY ENDPOINTS ====================

  async checkHealth() {
    return this.request<{ status: string }>('/health');
  }

  async getRoutes() {
    return this.request<string[]>('/routes');
  }

  async generateContent(prompt: string, contentType: string, title?: string) {
    return this.request<any>('/api/content/generate', 'POST', {
      prompt,
      title,
      content_type: contentType
    });
  }

  async getSkills() {
    return this.request<{ skills: any[] }>('/api/skills');
  }

  async getSkillJobs() {
    return this.request<{ jobs: any[] }>('/api/skills/jobs');
  }
}

export const apiClient = new APIClient();
export default apiClient;

export const api = {
  auth: {
    login: (email: string, password: string) => apiClient.login(email, password),
    register: (data: any) => apiClient.register(data.email, data.password, data.name, data.claude_api_key, data.tavily_api_key),
    getMe: () => apiClient.getCurrentUser(),
  },
  afl: {
    generate: (prompt: string, strategyType?: string, settings?: any) =>
      apiClient.generateAFL({ prompt, strategy_type: strategyType as any, settings }),
    optimize: (code: string) => apiClient.optimizeAFL(code),
    debug: (code: string, errorMessage?: string) => apiClient.debugAFL(code, errorMessage),
    explain: (code: string) => apiClient.explainAFL(code),
    validate: (code: string) => apiClient.validateAFL(code),
    getCodes: () => apiClient.getAFLCodes(),
    getCode: (codeId: string) => apiClient.getAFLCode(codeId),
    deleteCode: (codeId: string) => apiClient.deleteAFLCode(codeId),
    // FIXED: Added missing AFL file upload methods
    uploadFile: (file: File, description?: string) => apiClient.uploadAflFile(file, description),
    getFiles: () => apiClient.getAflFiles(),
    getFile: (fileId: string) => apiClient.getAflFile(fileId),
    deleteFile: (fileId: string) => apiClient.deleteAflFile(fileId),
    // FIXED: Added missing AFL settings preset methods
    savePreset: (preset: any) => apiClient.saveSettingsPreset(preset),
    getPresets: () => apiClient.getSettingsPresets(),
    getPreset: (presetId: string) => apiClient.getSettingsPreset(presetId),
    updatePreset: (presetId: string, updates: any) => apiClient.updateSettingsPreset(presetId, updates),
    deletePreset: (presetId: string) => apiClient.deleteSettingsPreset(presetId),
    setDefaultPreset: (presetId: string) => apiClient.setDefaultPreset(presetId),
    // FIXED: Added missing AFL history methods
    saveHistory: (entry: any) => apiClient.saveAflHistory(entry),
    getHistory: (limit?: number) => apiClient.getAflHistory(limit),
    deleteHistory: (historyId: string) => apiClient.deleteAflHistory(historyId),
  },
  chat: {
    getConversations: () => apiClient.getConversations(),
    createConversation: (title?: string) => apiClient.createConversation(title),
    getMessages: (conversationId: string) => apiClient.getMessages(conversationId),
    deleteConversation: (conversationId: string) => apiClient.deleteConversation(conversationId),
    sendMessage: (content: string, conversationId?: string) => apiClient.sendMessage(content, conversationId),
    sendMessageStream: (content: string, conversationId?: string, options?: any) => apiClient.sendMessageStream(content, conversationId, options),
    sendMessageStreamV6: (content: string, conversationId?: string, options?: any) => apiClient.sendMessageStreamV6(content, conversationId, options),
    uploadFile: (conversationId: string, formData: FormData) => apiClient.uploadFile(conversationId, formData),
    getStreamEndpoint: () => apiClient.getStreamEndpoint(),
    getStreamV6Endpoint: () => apiClient.getStreamV6Endpoint(),
    getTools: () => apiClient.getChatTools(),
  },
  brain: {
    uploadDocument: (file: File, category?: string) => apiClient.uploadDocument(file, undefined, category),
    search: (query: string, category?: string, limit?: number) => apiClient.searchKnowledge(query, category, limit),
    getDocuments: () => apiClient.getDocuments(),
    getStats: () => apiClient.getBrainStats(),
    deleteDocument: (documentId: string) => apiClient.deleteDocument(documentId),
  },
  backtest: {
    upload: (file: File, strategyId?: string) => apiClient.uploadBacktest(file, strategyId),
    getBacktest: (backtestId: string) => apiClient.getBacktest(backtestId),
    getStrategyBacktests: (strategyId: string) => apiClient.getStrategyBacktests(strategyId),
  },
  // FIXED: Added missing researcher endpoints
  researcher: {
    getCompanyResearch: (symbol: string) => apiClient.getCompanyResearch(symbol),
    getCompanyNews: (symbol: string) => apiClient.getCompanyNews(symbol),
    analyzeStrategyFit: (symbol: string, strategy_type: string, timeframe: string, additional_context?: string) =>
      apiClient.analyzeStrategyFit(symbol, strategy_type, timeframe, additional_context),
    getPeerComparison: (symbol: string, peers?: string[], sector?: string) =>
      apiClient.getPeerComparison(symbol, peers, sector),
    getMacroContext: () => apiClient.getMacroContext(),
    getSecFilings: (symbol: string) => apiClient.getSecFilings(symbol),
    generateReport: (symbol: string, include_peers?: boolean, include_technicals?: boolean, include_fundamentals?: boolean) =>
      apiClient.generateResearchReport(symbol, include_peers, include_technicals, include_fundamentals),
    getTrending: () => apiClient.getTrendingResearch(),
  },
  reverseEngineer: {
    startSession: (query: string) => apiClient.startReverseEngineering(query),
    continue: (strategyId: string, message: string) => apiClient.continueReverseEngineering(strategyId, message),
    research: (strategyId: string) => apiClient.researchStrategy(strategyId),
    generateSchematic: (strategyId: string) => apiClient.generateStrategySchematic(strategyId),
    generateCode: (strategyId: string) => apiClient.generateStrategyCode(strategyId),
    getStrategy: (strategyId: string) => apiClient.getStrategy(strategyId),
    // FIXED: Added missing reverse engineer history methods
    saveHistory: (entry: any) => apiClient.saveReverseEngineerHistory(entry),
    getHistory: (limit?: number) => apiClient.getReverseEngineerHistory(limit),
    deleteHistory: (historyId: string) => apiClient.deleteReverseEngineerHistory(historyId),
  },
  train: {
    submitFeedback: (feedback: FeedbackCreateRequest) => apiClient.submitFeedback(feedback),
    getMyFeedback: () => apiClient.getMyFeedback(),
    getFeedback: (feedbackId: string) => apiClient.getFeedback(feedbackId),
    testTraining: (request: TrainingTestRequest) => apiClient.testTraining(request),
    getEffectiveness: () => apiClient.getTrainingEffectiveness(),
    suggest: (suggestion: SuggestionCreateRequest) => apiClient.suggestTraining(suggestion),
    getMySuggestions: () => apiClient.getMySuggestions(),
    getLearningCurve: () => apiClient.getLearningCurve(),
    getPopularPatterns: () => apiClient.getPopularPatterns(),
    searchKnowledge: (query: string, category?: TrainingCategory, limit?: number) =>
      apiClient.searchTrainingKnowledge(query, category, limit),
    getCategories: () => apiClient.getKnowledgeCategories(),
    getTypes: () => apiClient.getTrainingTypes(),
    quickLearn: (code: string, explanation: string) => apiClient.quickLearn(code, explanation),
    getStats: () => apiClient.getTrainStats(),
  },
  content: {
    getArticles: (status?: string, limit?: number) => apiClient.getArticles(status, limit),
    createArticle: (data: any) => apiClient.createArticle(data),
    updateArticle: (id: string, data: any) => apiClient.updateArticle(id, data),
    deleteArticle: (id: string) => apiClient.deleteArticle(id),
    getDocuments: (limit?: number) => apiClient.getDocumentsContent(limit),
    createDocument: (data: any) => apiClient.createDocument(data),
    updateDocument: (id: string, data: any) => apiClient.updateDocument(id, data),
    deleteDocument: (id: string) => apiClient.deleteContentDocument(id),
    getSlides: (limit?: number) => apiClient.getSlides(limit),
    createSlide: (data: any) => apiClient.createSlide(data),
    updateSlide: (id: string, data: any) => apiClient.updateSlide(id, data),
    deleteSlide: (id: string) => apiClient.deleteSlide(id),
    generateSlides: (prompt: string, slideCount?: number, style?: string) => apiClient.generateSlides(prompt, slideCount, style),
    getDashboards: (limit?: number) => apiClient.getDashboards(limit),
    createDashboard: (data: any) => apiClient.createDashboard(data),
    updateDashboard: (id: string, data: any) => apiClient.updateDashboard(id, data),
    deleteDashboard: (id: string) => apiClient.deleteDashboard(id),
    chat: (message: string, context?: string) => apiClient.sendContentChat(message, context),
    getStyles: () => apiClient.getWritingStyles(),
    updateStyles: (styles: any) => apiClient.updateWritingStyles(styles),
    getJob: (jobId: string) => apiClient.getContentJob(jobId),
    getAll: () => apiClient.getAllContent(),
  },
  presentations: {
    generate: (prompt: string, options?: any) => apiClient.generatePresentation(prompt, options),
    generateMarketOutlook: () => apiClient.generateMarketOutlook(),
    list: () => apiClient.listPresentations(),
    download: (id: string) => apiClient.downloadPresentation(id),
    delete: (id: string) => apiClient.deletePresentation(id),
  },
};