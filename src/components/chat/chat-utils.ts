/**
 * Chat utility functions — extracted from ChatPage.tsx for reuse and testability.
 */

import {
  FileText as FileTextIcon,
  FileCode as FileCodeIcon,
  FileSpreadsheet as FileSpreadsheetIcon,
  File as FileIconLucide,
} from 'lucide-react';
import type { ProcessType } from '@/contexts/ProcessManager';

// ─── API Configuration ──────────────────────────────────────────────────────

export const API_BASE_URL_CHAT = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://developer-potomaac.up.railway.app'
).replace(/\/+$/, '');

// ─── Auth ────────────────────────────────────────────────────────────────────

export function getAuthToken(): string {
  try {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('auth_token') || '';
  } catch {
    return '';
  }
}

// ─── Text Processing ─────────────────────────────────────────────────────────

/**
 * Strip hidden system instructions from user messages (e.g., [FORMATTING: ...]).
 * These are injected for the AI but should never be visible to end users.
 */
export function stripSystemInstructions(text: string): string {
  return text
    .replace(/\[FORMATTING:[^\]]*\]/gi, '')
    .replace(/\[SYSTEM:[^\]]*\]/gi, '')
    .replace(/\[INSTRUCTIONS:[^\]]*\]/gi, '')
    .replace(/\[CONTEXT:[^\]]*\]/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── File Utilities ──────────────────────────────────────────────────────────

export type FileIconComponent = typeof FileTextIcon;

const FILE_EXT_ICON_MAP: Record<string, FileIconComponent> = {
  pdf: FileTextIcon,
  doc: FileTextIcon,
  docx: FileTextIcon,
  rtf: FileTextIcon,
  csv: FileSpreadsheetIcon,
  xlsx: FileSpreadsheetIcon,
  xls: FileSpreadsheetIcon,
  md: FileCodeIcon,
  json: FileCodeIcon,
  xml: FileCodeIcon,
  html: FileCodeIcon,
  js: FileCodeIcon,
  ts: FileCodeIcon,
  afl: FileCodeIcon,
  py: FileCodeIcon,
};

export function getChatFileIcon(filename: string): FileIconComponent {
  const ext = (filename || '').split('.').pop()?.toLowerCase() || '';
  return FILE_EXT_ICON_MAP[ext] || FileIconLucide;
}

export function getFileExtension(filename: string): string {
  return (filename || '').split('.').pop()?.toLowerCase() || '';
}

export function formatChatFileSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Get a brand color for a file extension — used for chips and badges.
 */
export function getFileChipColor(ext: string): string {
  if (ext === 'pdf') return '#ef4444';
  if (['doc', 'docx'].includes(ext)) return '#3b82f6';
  if (['xls', 'xlsx'].includes(ext)) return '#22c55e';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return '#a855f7';
  if (['csv', 'json', 'xml'].includes(ext)) return '#f59e0b';
  return '#FEC00F';
}

// ─── Process Manager Utilities ───────────────────────────────────────────────

/**
 * Map a tool name to a ProcessType for the Task Manager widget.
 */
export function getProcessType(toolName: string, input?: Record<string, any>): ProcessType {
  // For invoke_skill, derive type from the skill slug
  if (toolName === 'invoke_skill' && input?.skill_slug) {
    const slug = input.skill_slug;
    if (/pptx|presentation|powerpoint|slide/.test(slug)) return 'slide';
    if (/docx|word|document/.test(slug)) return 'document';
    if (/xlsx|excel|spreadsheet/.test(slug)) return 'dashboard';
    if (/afl|amibroker/.test(slug)) return 'afl';
  }
  if (/pptx|presentation|powerpoint|slide/.test(toolName)) return 'slide';
  if (/document|docx|word/.test(toolName)) return 'document';
  if (/afl|code/.test(toolName)) return 'afl';
  if (/chart|stock|market|backtest|sector|risk|dividend|options|correlation|position|screener|compare/.test(toolName)) return 'dashboard';
  if (/research|article|linkedin/.test(toolName)) return 'article';
  return 'general';
}

/**
 * Get a readable title from a tool name and its input.
 */
const SKILL_SLUG_LABELS: Record<string, string> = {
  'potomac-pptx':        'Creating PowerPoint',
  'potomac-pptx-skill':  'Creating PowerPoint',
  'potomac-docx-skill':  'Creating Word Document',
  'potomac-xlsx':        'Creating Excel Spreadsheet',
  'dcf-model':           'Building DCF Model',
  'doc-interpreter':     'Reading Document',
  'amibroker-afl-developer': 'Generating AFL Code',
  'backtest-expert':     'Backtest Analysis',
  'quant-analyst':       'Quant Analysis',
  'us-market-bubble-detector': 'Bubble Detection',
};

export function getToolTitle(toolName: string, input?: Record<string, any>): string {
  const readable = toolName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  // For invoke_skill, use the slug to get a human-readable label
  if (toolName === 'invoke_skill' && input?.skill_slug) {
    return SKILL_SLUG_LABELS[input.skill_slug] || input.skill_slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  }
  if (input?.title) return input.title;
  if (input?.symbol) return `${readable} (${input.symbol})`;
  if (input?.topic) return String(input.topic).slice(0, 40);
  if (input?.query) return String(input.query).slice(0, 40);
  return readable;
}

// ─── Chat Preview File ──────────────────────────────────────────────────────

export interface ChatPreviewFile {
  url?: string;
  fileId?: string;
  filename: string;
  mediaType?: string;
  size?: number;
}

// ─── Theme Colors ────────────────────────────────────────────────────────────

export interface ChatColors {
  background: string;
  sidebar: string;
  cardBg: string;
  inputBg: string;
  border: string;
  text: string;
  textMuted: string;
  primaryYellow: string;
  darkGray: string;
  accentYellow: string;
}

export function getChatColors(isDark: boolean): ChatColors {
  return {
    background: isDark ? '#0F0F0F' : '#ffffff',
    sidebar: isDark ? '#1A1A1A' : '#ffffff',
    cardBg: isDark ? '#1A1A1A' : '#ffffff',
    inputBg: isDark ? '#262626' : '#f8f8f8',
    border: isDark ? '#333333' : '#e5e5e5',
    text: isDark ? '#E8E8E8' : '#1A1A1A',
    textMuted: isDark ? '#B0B0B0' : '#666666',
    primaryYellow: '#FEC00F',
    darkGray: '#212121',
    accentYellow: '#FFD700',
  };
}
