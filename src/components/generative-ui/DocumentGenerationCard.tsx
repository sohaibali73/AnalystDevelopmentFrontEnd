'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { parseFileForPreview, ParsedDocument } from '@/lib/filePreview';

// ─── SVG Icon Components ──────────────────────────────────────────────────────

const IconWord = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="2" width="13" height="17" rx="2" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
    <path d="M7 7h6M7 10h6M7 13h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 15l2 5 2-4 2 4 2-5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconPPTX = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="14" rx="2" fill={color} opacity="0.12" stroke={color} strokeWidth="1.5"/>
    <path d="M8 10h3a1.5 1.5 0 0 1 0 3H8V7h3a1.5 1.5 0 0 1 0 3" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M7 20h10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 17v3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconXLSX = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" fill={color} opacity="0.12" stroke={color} strokeWidth="1.5"/>
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke={color} strokeWidth="1.2" opacity="0.6"/>
    <path d="M6 6l3 3m0-3L6 9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconPDF = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill={color} opacity="0.12" stroke={color} strokeWidth="1.5"/>
    <path d="M14 2v6h6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 13h2a1 1 0 1 1 0 2H8v-4h2a1 1 0 1 1 0 2" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M14 11v4m0-4h1a1.5 1.5 0 0 1 0 3h-1" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IconAFL = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconDatapack = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" fill={color} opacity="0.12" stroke={color} strokeWidth="1.5"/>
    <path d="M3 8l9 5 9-5M12 13v8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconGeneric = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill={color} opacity="0.12" stroke={color} strokeWidth="1.5"/>
    <path d="M14 2v6h6M8 13h8M8 17h5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Potomac-branded document icon with distinctive style
const IconPotomacDoc = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="2" width="13" height="17" rx="2" fill={color} opacity="0.18" stroke={color} strokeWidth="1.5"/>
    <path d="M7 7h6M7 10h6M7 13h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    {/* Potomac "P" mark */}
    <circle cx="17" cy="17" r="5" fill={color} opacity="0.9"/>
    <path d="M15.5 14.5v5M15.5 14.5h2a1.25 1.25 0 1 1 0 2.5h-2" stroke="#111" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Potomac-branded presentation icon
const IconPotomacPPTX = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="3" width="16" height="12" rx="2" fill={color} opacity="0.18" stroke={color} strokeWidth="1.5"/>
    <path d="M6 19h8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 15v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    {/* Potomac "P" mark */}
    <circle cx="18" cy="17" r="5" fill={color} opacity="0.9"/>
    <path d="M16.5 14.5v5M16.5 14.5h2a1.25 1.25 0 1 1 0 2.5h-2" stroke="#111" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Potomac-branded spreadsheet icon
const IconPotomacXLSX = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="15" height="15" rx="2" fill={color} opacity="0.18" stroke={color} strokeWidth="1.5"/>
    <path d="M2 7h15M2 12h15M7 2v15M12 2v15" stroke={color} strokeWidth="1" opacity="0.5"/>
    {/* Potomac "P" mark */}
    <circle cx="18" cy="18" r="5" fill={color} opacity="0.9"/>
    <path d="M16.5 15.5v5M16.5 15.5h2a1.25 1.25 0 1 1 0 2.5h-2" stroke="#111" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Potomac analysis icon (magnifying glass with P badge)
const IconPotomacAnalyze = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="10" cy="10" r="7" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
    <path d="M15 15l5 5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 8h6M7 12h4" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <circle cx="18" cy="18" r="4" fill={color} opacity="0.9"/>
    <path d="M16.8 16v4M16.8 16h1.5a0.9 0.9 0 1 1 0 1.8h-1.5" stroke="#111" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Potomac revision icon (pencil with P badge)
const IconPotomacRevise = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 20h9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
    <circle cx="18" cy="18" r="4" fill={color} opacity="0.9"/>
    <path d="M16.8 16v4M16.8 16h1.5a0.9 0.9 0 1 1 0 1.8h-1.5" stroke="#111" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Potomac transform icon (arrows)
const IconPotomacTransform = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="4" width="8" height="6" rx="1" fill={color} opacity="0.15" stroke={color} strokeWidth="1.3"/>
    <rect x="14" y="14" width="8" height="6" rx="1" fill={color} opacity="0.15" stroke={color} strokeWidth="1.3"/>
    <path d="M6 10v2a2 2 0 0 0 2 2h4M18 14v-2a2 2 0 0 0-2-2h-4" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M10 12l2 2-2 2M14 8l-2 2 2 2" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconDownload = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconCopy = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke={color} strokeWidth="2"/>
  </svg>
);

const IconCheck = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconAlert = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth="1.8"/>
    <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconClock = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <polyline points="12 6 12 12 16 14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ─── File Type Definitions ───────────────────────────────────────────────────

type FileType = 
  | 'docx' | 'pptx' | 'xlsx' | 'pdf' | 'afl' | 'datapack' | 'generic'
  // Potomac generation tools (return downloadable files)
  | 'potomac_docx' | 'potomac_pptx' | 'potomac_xlsx'
  // Potomac analysis tools (return JSON profiles, instant ~50-300ms)
  | 'potomac_analyze_pptx' | 'potomac_analyze_xlsx'
  // Potomac revision/transform tools (return modified files, very fast ~100-500ms)
  | 'potomac_revise_pptx' | 'potomac_transform_xlsx';

interface FileTypeMeta {
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  color: string;
  gradient: string;
  bgLight: string;
  bgDark: string;
  phases: string[];
}

const FILE_TYPES: Record<FileType, FileTypeMeta> = {
  docx: {
    IconComponent: IconWord,
    label: 'Word Document',
    color: '#2B579A',
    gradient: 'linear-gradient(135deg, #2B579A 0%, #3B7DD8 100%)',
    bgLight: 'rgba(43,87,154,0.08)',
    bgDark: 'rgba(43,87,154,0.15)',
    phases: [
      'Analysing content requirements',
      'Structuring document outline',
      'Writing document content',
      'Applying formatting and styles',
      'Generating DOCX file',
      'Finalising document',
    ],
  },
  pptx: {
    IconComponent: IconPPTX,
    label: 'PowerPoint Presentation',
    color: '#D24726',
    gradient: 'linear-gradient(135deg, #D24726 0%, #FF6B47 100%)',
    bgLight: 'rgba(210,71,38,0.08)',
    bgDark: 'rgba(210,71,38,0.15)',
    phases: [
      'Analysing presentation topic',
      'Designing slide structure',
      'Creating slide content',
      'Applying themes and layouts',
      'Generating visual elements',
      'Building PPTX file',
    ],
  },
  xlsx: {
    IconComponent: IconXLSX,
    label: 'Excel Spreadsheet',
    color: '#217346',
    gradient: 'linear-gradient(135deg, #217346 0%, #33A06F 100%)',
    bgLight: 'rgba(33,115,70,0.08)',
    bgDark: 'rgba(33,115,70,0.15)',
    phases: [
      'Analysing data requirements',
      'Structuring worksheets',
      'Populating cells and formulas',
      'Formatting tables and charts',
      'Generating XLSX file',
      'Finalising spreadsheet',
    ],
  },
  pdf: {
    IconComponent: IconPDF,
    label: 'PDF Document',
    color: '#B30B00',
    gradient: 'linear-gradient(135deg, #B30B00 0%, #E8453C 100%)',
    bgLight: 'rgba(179,11,0,0.08)',
    bgDark: 'rgba(179,11,0,0.15)',
    phases: [
      'Analysing content',
      'Structuring layout',
      'Rendering pages',
      'Applying typography',
      'Generating PDF',
      'Finalising document',
    ],
  },
  afl: {
    IconComponent: IconAFL,
    label: 'AFL Code',
    color: '#6366F1',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    bgLight: 'rgba(99,102,241,0.08)',
    bgDark: 'rgba(99,102,241,0.15)',
    phases: [
      'Analysing strategy requirements',
      'Designing signal logic',
      'Writing AFL code',
      'Adding risk management',
      'Validating syntax',
      'Finalising code',
    ],
  },
  datapack: {
    IconComponent: IconDatapack,
    label: 'Data Pack',
    color: '#0EA5E9',
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
    bgLight: 'rgba(14,165,233,0.08)',
    bgDark: 'rgba(14,165,233,0.15)',
    phases: [
      'Gathering data sources',
      'Processing financial data',
      'Building data tables',
      'Formatting output sheets',
      'Generating data pack',
      'Packaging files',
    ],
  },
  potomac_docx: {
    IconComponent: IconPotomacDoc,
    label: 'Potomac Document',
    color: '#FEC00F',  // Potomac yellow
    gradient: 'linear-gradient(135deg, #FEC00F 0%, #FFD54F 100%)',
    bgLight: 'rgba(254,192,15,0.10)',
    bgDark: 'rgba(254,192,15,0.18)',
    phases: [
      'Processing document specification',
      'Structuring sections and content',
      'Applying Potomac branding',
      'Building tables and formatting',
      'Generating DOCX file',
      'Finalising Potomac document',
    ],
  },
  potomac_pptx: {
    IconComponent: IconPotomacPPTX,
    label: 'Potomac Presentation',
    color: '#FEC00F',  // Potomac yellow
    gradient: 'linear-gradient(135deg, #FEC00F 0%, #FFD54F 100%)',
    bgLight: 'rgba(254,192,15,0.10)',
    bgDark: 'rgba(254,192,15,0.18)',
    phases: [
      'Processing slide specification',
      'Building title and section slides',
      'Applying Potomac brand styling',
      'Rendering metrics and content',
      'Generating PPTX file',
      'Finalising Potomac presentation',
    ],
  },
  potomac_xlsx: {
    IconComponent: IconPotomacXLSX,
    label: 'Potomac Workbook',
    color: '#FEC00F',  // Potomac yellow
    gradient: 'linear-gradient(135deg, #FEC00F 0%, #FFD54F 100%)',
    bgLight: 'rgba(254,192,15,0.10)',
    bgDark: 'rgba(254,192,15,0.18)',
    phases: [
      'Processing workbook specification',
      'Building worksheets and tabs',
      'Applying Potomac branding',
      'Formatting cells and formulas',
      'Generating XLSX file',
      'Finalising Potomac workbook',
    ],
  },
  potomac_analyze_pptx: {
    IconComponent: IconPotomacAnalyze,
    label: 'Potomac PPTX Analysis',
    color: '#8B5CF6',  // Purple for analysis
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    bgLight: 'rgba(139,92,246,0.10)',
    bgDark: 'rgba(139,92,246,0.18)',
    phases: [
      'Reading presentation file',
      'Extracting slide structure',
      'Analysing brand compliance',
      'Building profile data',
    ],
  },
  potomac_analyze_xlsx: {
    IconComponent: IconPotomacAnalyze,
    label: 'Potomac Data Analysis',
    color: '#8B5CF6',  // Purple for analysis
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    bgLight: 'rgba(139,92,246,0.10)',
    bgDark: 'rgba(139,92,246,0.18)',
    phases: [
      'Reading spreadsheet file',
      'Profiling columns and types',
      'Computing statistics',
      'Building profile data',
    ],
  },
  potomac_revise_pptx: {
    IconComponent: IconPotomacRevise,
    label: 'Potomac PPTX Revision',
    color: '#10B981',  // Green for revision/success
    gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    bgLight: 'rgba(16,185,129,0.10)',
    bgDark: 'rgba(16,185,129,0.18)',
    phases: [
      'Loading existing presentation',
      'Applying find-replace operations',
      'Updating tables and content',
      'Saving revised PPTX',
    ],
  },
  potomac_transform_xlsx: {
    IconComponent: IconPotomacTransform,
    label: 'Potomac Data Transform',
    color: '#0EA5E9',  // Blue for transform
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
    bgLight: 'rgba(14,165,233,0.10)',
    bgDark: 'rgba(14,165,233,0.18)',
    phases: [
      'Loading source data',
      'Applying transformations',
      'Formatting output',
      'Generating Potomac workbook',
    ],
  },
  generic: {
    IconComponent: IconGeneric,
    label: 'File',
    color: '#6B7280',
    gradient: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
    bgLight: 'rgba(107,114,128,0.08)',
    bgDark: 'rgba(107,114,128,0.15)',
    phases: [
      'Analysing request',
      'Processing content',
      'Generating output',
      'Formatting file',
      'Building file',
      'Finalising',
    ],
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface DocumentGenerationCardProps {
  toolCallId: string;
  toolName: string;
  input: any;
  output?: any;
  externalOutput?: any; // injected by ChatPage from file_download events
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  errorText?: string;
  conversationId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectFileType(toolName: string, input?: any): FileType {
  const name = (toolName || '').toLowerCase();
  const inputStr = JSON.stringify(input || {}).toLowerCase();
  // Check for Potomac's server-side office tools specifically (exact match for speed)
  if (name === 'generate_docx') return 'potomac_docx';
  if (name === 'generate_pptx') return 'potomac_pptx';
  if (name === 'generate_xlsx') return 'potomac_xlsx';
  if (name === 'analyze_pptx') return 'potomac_analyze_pptx';
  if (name === 'analyze_xlsx') return 'potomac_analyze_xlsx';
  if (name === 'revise_pptx') return 'potomac_revise_pptx';
  if (name === 'transform_xlsx') return 'potomac_transform_xlsx';
  // Fallback to generic detection
  if (name.includes('docx') || name.includes('word') || name.includes('document')) return 'docx';
  if (name.includes('pptx') || name.includes('powerpoint') || name.includes('presentation') || name.includes('slide') || name.includes('deck')) return 'pptx';
  if (name.includes('xlsx') || name.includes('excel') || name.includes('spreadsheet')) return 'xlsx';
  if (name.includes('pdf')) return 'pdf';
  if (name.includes('afl') || name.includes('amibroker')) return 'afl';
  if (name.includes('datapack') || name.includes('data_pack')) return 'datapack';
  if (inputStr.includes('.docx') || inputStr.includes('word')) return 'docx';
  if (inputStr.includes('.pptx') || inputStr.includes('powerpoint')) return 'pptx';
  if (inputStr.includes('.xlsx') || inputStr.includes('excel')) return 'xlsx';
  return 'generic';
}

// All Potomac server-side tools (grouped by function)
const POTOMAC_GEN_TYPES = ['potomac_docx', 'potomac_pptx', 'potomac_xlsx'] as const;  // Generation (yellow)
const POTOMAC_ANALYZE_TYPES = ['potomac_analyze_pptx', 'potomac_analyze_xlsx'] as const;  // Analysis (purple)
const POTOMAC_REVISE_TYPES = ['potomac_revise_pptx', 'potomac_transform_xlsx'] as const;  // Revision (green/blue)
const ALL_POTOMAC_TYPES = [...POTOMAC_GEN_TYPES, ...POTOMAC_ANALYZE_TYPES, ...POTOMAC_REVISE_TYPES] as const;

// Check if it's a Potomac generation tool (yellow branding, dark text on buttons)
const isPotomacGenType = (ft: FileType) => POTOMAC_GEN_TYPES.includes(ft as any);
// Check if it's any Potomac tool
const isPotomacType = (ft: FileType) => ALL_POTOMAC_TYPES.includes(ft as any);
// Check if it's an analysis tool (returns JSON profile, no download)
const isAnalysisType = (ft: FileType) => POTOMAC_ANALYZE_TYPES.includes(ft as any);

// Get the actual file extension for all file types
const getFileExtension = (ft: FileType): string => {
  if (ft === 'potomac_docx') return 'docx';
  if (ft === 'potomac_pptx' || ft === 'potomac_revise_pptx' || ft === 'potomac_analyze_pptx') return 'pptx';
  if (ft === 'potomac_xlsx' || ft === 'potomac_transform_xlsx' || ft === 'potomac_analyze_xlsx') return 'xlsx';
  if (ft === 'generic') return 'bin';
  return ft;
};

// Get display label for file type badge
const getDisplayType = (ft: FileType): string => {
  if (ft === 'potomac_docx') return 'DOCX';
  if (ft === 'potomac_pptx' || ft === 'potomac_revise_pptx') return 'PPTX';
  if (ft === 'potomac_xlsx' || ft === 'potomac_transform_xlsx') return 'XLSX';
  if (ft === 'potomac_analyze_pptx') return 'ANALYSIS';
  if (ft === 'potomac_analyze_xlsx') return 'PROFILE';
  return ft.toUpperCase();
};

// Types that support preview (downloadable files)
const supportsPreview = (ft: FileType) => 
  ['docx', 'pptx', 'xlsx', 'pdf', 'potomac_docx', 'potomac_pptx', 'potomac_xlsx', 'potomac_revise_pptx', 'potomac_transform_xlsx'].includes(ft);

// Check if the tool returns a downloadable file (vs JSON profile)
const hasDownloadableFile = (ft: FileType) => !isAnalysisType(ft);

function extractTitle(input: any, toolName: string): string {
  if (!input) return 'Generating file';
  return (
    input.title ||
    input.topic ||
    input.filename ||
    input.name ||
    input.subject ||
    input.prompt?.slice(0, 60) ||
    input.message?.slice(0, 60) ||
    toolName.replace(/_/g, ' ')
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const DocumentGenerationCard: React.FC<DocumentGenerationCardProps> = ({
  toolCallId,
  toolName,
  input,
  output,
  externalOutput,
  state,
  errorText,
  conversationId,
}) => {
  const fileType = detectFileType(toolName, input);
  const meta = FILE_TYPES[fileType];
  const title = extractTitle(input, toolName);
  const FileIcon = meta.IconComponent;

  // Resolve relative backend paths to full Railway URLs
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://developer-potomaac.up.railway.app').replace(/\/+$/, '');
  const resolveUrl = (url: string) => url.startsWith('/') ? `${apiBase}${url}` : url;

  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [outputData, setOutputData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [safetyTimeout, setSafetyTimeout] = useState(false);
  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restoredFromStorage = useRef(false);

  const STORAGE_KEY = `docgen_state_${toolCallId}`;

  const isDark =
    typeof window !== 'undefined' &&
    (document.documentElement.getAttribute('data-theme') === 'dark' ||
      window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  // ── Restore state from localStorage OR from output prop on mount ───────────
  // Priority: output prop (from database) > localStorage > nothing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // If we have output/externalOutput prop and state is output-available, use that as authoritative source
    // This handles the case where data is restored from the database after page refresh
    const effectiveOutput = output || externalOutput;
    if (state === 'output-available' && effectiveOutput) {
      restoredFromStorage.current = true;
      setIsComplete(true);
      setProgress(100);
      setCurrentPhase(meta.phases.length - 1);
      setOutputData(effectiveOutput);
      setDownloadUrl(effectiveOutput.download_url || effectiveOutput.downloadUrl || effectiveOutput.file_url || null);
      setFileId(effectiveOutput.file_id || effectiveOutput.fileId || effectiveOutput.document_id || effectiveOutput.presentation_id || null);
      setSafetyTimeout(false);
      setTimeout(() => setPreviewOpen(true), 500);
      return;
    }
    
    // Fallback: try localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // Only restore if saved within the last 24 hours
        if (Date.now() - (saved.timestamp || 0) < 86400000) {
          if (saved.isComplete) {
            restoredFromStorage.current = true;
            setIsComplete(true);
            setProgress(100);
            setCurrentPhase(meta.phases.length - 1);
            if (saved.downloadUrl)  setDownloadUrl(saved.downloadUrl);
            if (saved.fileId)       setFileId(saved.fileId);
            if (saved.outputData)   setOutputData(saved.outputData);
            if (saved.elapsedTime)  setElapsedTime(saved.elapsedTime);
            setSafetyTimeout(false);
            // Auto-open preview after a short delay
            setTimeout(() => setPreviewOpen(true), 500);
          } else if (saved.isError) {
            restoredFromStorage.current = true;
            setIsError(true);
            if (saved.elapsedTime) setElapsedTime(saved.elapsedTime);
          }
        }
      }
    } catch {
      // localStorage not available or parse error — ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // ── Persist state to localStorage on changes ──────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isComplete && !isError) return; // only persist terminal states
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        isComplete,
        isError,
        downloadUrl,
        fileId,
        outputData,
        elapsedTime,
        timestamp: Date.now(),
      }));
    } catch {
      // Ignore storage quota errors
    }
  }, [STORAGE_KEY, isComplete, isError, downloadUrl, fileId, outputData, elapsedTime]);

  // ── Progress simulation ────────────────────────────────────────────────────
  const startProgressSimulation = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    startTimeRef.current = Date.now();
    setElapsedTime(0);
    setProgress(0);
    setCurrentPhase(0);
    setIsComplete(false);
    setIsError(false);

    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    let currentProgress = 0;
    const totalPhases = meta.phases.length;

    progressIntervalRef.current = setInterval(() => {
      const increment = 0.3 + Math.random() * 1.2;
      currentProgress = Math.min(currentProgress + increment, 88);
      const phaseIndex = Math.min(Math.floor((currentProgress / 85) * totalPhases), totalPhases - 1);
      setProgress(Math.round(currentProgress * 10) / 10);
      setCurrentPhase(phaseIndex);
    }, 800 + Math.random() * 400);
  }, [meta.phases.length]);

  useEffect(() => {
    if (restoredFromStorage.current) return; // skip if we restored a terminal state
    if (state === 'input-streaming' || state === 'input-available') {
      startProgressSimulation();
    }
  }, [state, startProgressSimulation]);

  // ── Safety timeout: if stuck at ~88% for 2 minutes, show a warning ────────
  useEffect(() => {
    if (state !== 'input-streaming' && state !== 'input-available') return;
    const timeout = setTimeout(() => {
      if (!isComplete && !isError) {
        setSafetyTimeout(true);
      }
    }, 120000); // 2 minutes
    return () => clearTimeout(timeout);
  }, [state, isComplete, isError]);

  // ── Wire externalOutput (file_download events) into the card ───────────────
  useEffect(() => {
    if (!externalOutput) return;
    const data = externalOutput;
    setOutputData((prev: any) => ({ ...prev, ...data }));
    setDownloadUrl(data.download_url || data.downloadUrl || data.file_url || downloadUrl);
    setFileId(data.file_id || data.fileId || data.document_id || data.presentation_id || fileId);
    // If we were still generating, snap to complete now
    if (!isComplete && !isError) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setProgress(100);
      setCurrentPhase(meta.phases.length - 1);
      setIsComplete(true);
      setSafetyTimeout(false);
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      // Auto-open preview
      setTimeout(() => setPreviewOpen(true), 600);
    }
  }, [externalOutput]);

  // ── Fix 1: snap to 100% when state === 'output-available' (no && output guard) ──
  useEffect(() => {
    if (state === 'output-available') {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      const snapStart = progress;
      const snapDuration = 600;
      const snapStartTime = Date.now();

      const snapInterval = setInterval(() => {
        const elapsed = Date.now() - snapStartTime;
        const t = Math.min(elapsed / snapDuration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setProgress(Math.round((snapStart + (100 - snapStart) * eased) * 10) / 10);
        if (t >= 1) {
          clearInterval(snapInterval);
          setProgress(100);
          setCurrentPhase(meta.phases.length - 1);
          setIsComplete(true);
          setSafetyTimeout(false);
          // Auto-open preview after completion animation settles
          setTimeout(() => setPreviewOpen(true), 600);
        }
      }, 16);

      if (output) {
        setOutputData(output);
        setDownloadUrl(output.download_url || output.downloadUrl || output.file_url || null);
        setFileId(output.file_id || output.fileId || output.document_id || output.presentation_id || null);
      }
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }
  }, [state, output, meta.phases.length]);

  useEffect(() => {
    if (state === 'output-error') {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsError(true);
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!downloadUrl && !fileId) { toast.error('No download available'); return; }
    try {
      let response: Response;
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (downloadUrl) {
        response = await fetch(resolveUrl(downloadUrl), {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
      } else {
        response = await fetch(`${apiBase}/files/${fileId}/download`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
      }
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = outputData?.filename || outputData?.title || `generated-file.${getFileExtension(fileType)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('File downloaded');
    } catch {
      toast.error('Download failed — please try again');
    }
  };

  const handleCopy = () => {
    const text = outputData?.code || outputData?.content || outputData?.text || '';
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard');
    }
  };

  const formatTime = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  const formatSize = () => {
    if (!outputData) return null;
    const kb = outputData.file_size_kb || outputData.fileSizeKb || outputData.size_kb;
    if (kb) return `${kb} KB`;
    const bytes = outputData.file_size || outputData.size;
    if (bytes) return bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
    return null;
  };

  // ── Fetch and parse file for preview ────────────────────────���────────────
  const loadPreview = useCallback(async () => {
    if (!downloadUrl || !isComplete) return;
    if (!supportsPreview(fileType)) return;

    setPreviewLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch(resolveUrl(downloadUrl), {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const filename = outputData?.filename || `file.${getFileExtension(fileType)}`;
      const parsed = await parseFileForPreview(blob, filename);
      setParsedDoc(parsed);
    } catch (err) {
      console.error('Preview failed:', err);
      setParsedDoc({ type: 'unsupported', content: 'Preview could not be loaded.' });
    } finally {
      setPreviewLoading(false);
    }
  }, [downloadUrl, isComplete, fileType, outputData]);

  useEffect(() => {
    if (previewOpen && isComplete && downloadUrl && supportsPreview(fileType)) {
      loadPreview();
    }
  }, [previewOpen, isComplete, downloadUrl, fileType, loadPreview]);

   // ── Theme tokens ───────────────────────────────────────────────────────────
   const cardBg    = isDark ? 'rgba(17, 17, 20, 0.85)' : 'rgba(250, 250, 250, 0.85)';
   const borderCol = isDark ? `${meta.color}28` : `${meta.color}1A`;
   const textColor = isDark ? '#F0F0F0' : '#111111';
   const mutedCol  = isDark ? '#7A7A88' : '#6B7280';
   const trackCol  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
   const metaBg    = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
   const metaBdr   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

   // ── Render ─────────────────────────────────────────────────────────────────
   return (
     <div style={{
       marginTop: '12px',
       borderRadius: '16px',
       border: `1px solid ${borderCol}`,
       backgroundColor: cardBg,
       overflow: 'hidden',
       fontFamily: "'Instrument Sans', sans-serif",
       boxShadow: isDark ? `0 8px 32px ${meta.color}20` : `0 8px 32px ${meta.color}12`,
       backdropFilter: 'blur(20px) saturate(180%)',
       WebkitBackdropFilter: 'blur(20px) saturate(180%)',
       animation: 'docGenSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
     }}>

      {/* Accent bar */}
      <div style={{
        height: '3px',
        background: isError
          ? 'linear-gradient(90deg, #EF4444, #F97316)'
          : isComplete
            ? `linear-gradient(90deg, ${meta.color}, #10B981)`
            : meta.gradient,
        transition: 'background 0.5s ease',
      }} />

      <div style={{ padding: '16px 18px' }}>

        {/* ── Title row ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>

            {/* Icon badge */}
            <div style={{
              width: '42px', height: '42px',
              borderRadius: '11px',
              background: isDark ? meta.bgDark : meta.bgLight,
              border: `1px solid ${borderCol}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'box-shadow 0.3s ease',
              boxShadow: isComplete ? `0 4px 12px ${meta.color}20` : 'none',
            }}>
              <FileIcon size={20} color={meta.color} />
            </div>

            {/* Title + label */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: '13.5px',
                color: textColor,
                letterSpacing: '0.2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {title}
              </div>
              <div style={{
                fontSize: '11.5px',
                color: mutedCol,
                marginTop: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span>{meta.label}</span>
                <span style={{ opacity: 0.35 }}>·</span>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  backgroundColor: `${meta.color}14`,
                  color: meta.color,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  fontFamily: "'DM Mono', monospace",
                }}>
                  SKILL
                </span>
              </div>
            </div>
          </div>

          {/* Status pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '10.5px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            fontFamily: "'DM Mono', monospace",
            flexShrink: 0,
            ...(isError
              ? { backgroundColor: isDark ? 'rgba(239,68,68,0.14)' : 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }
              : isComplete
                ? { backgroundColor: isDark ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }
                : { backgroundColor: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}20` }),
          }}>
            {isError ? (
              <><IconAlert size={11} color="#EF4444" /> ERROR</>
            ) : isComplete ? (
              <><IconCheck size={11} color="#10B981" /> COMPLETE</>
            ) : (
              <>
                <span style={{
                  width: '7px', height: '7px',
                  borderRadius: '50%',
                  backgroundColor: meta.color,
                  animation: 'docGenPulse 1.5s ease-in-out infinite',
                  display: 'inline-block',
                }} />
                GENERATING
              </>
            )}
          </div>
        </div>

        {/* ── Progress section ──────────────────────────────────────────────── */}
        {!isError && (
          <div style={{ marginBottom: '12px' }}>

            {/* SVG circular ring + phase checklist */}
            {!isComplete && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '20px',
                padding: '16px 4px 12px',
              }}>

                {/* Circular progress ring */}
                <div style={{ flexShrink: 0, position: 'relative', width: '80px', height: '80px' }}>
                  <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Track */}
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke={trackCol}
                      strokeWidth="6"
                    />
                    {/* Progress arc */}
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke={meta.color}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                      style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
                    />
                  </svg>
                  {/* Percentage label */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1px',
                  }}>
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: 700,
                      fontSize: '15px',
                      color: textColor,
                      lineHeight: 1,
                    }}>
                      {Math.round(progress)}%
                    </span>
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '8px',
                      color: mutedCol,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}>
                      {formatTime(elapsedTime)}
                    </span>
                  </div>
                </div>

                {/* Phase checklist */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px', paddingTop: '4px' }}>
                  {meta.phases.map((phase, idx) => {
                    const isDone    = idx < currentPhase;
                    const isActive  = idx === currentPhase;
                    const isPending = idx > currentPhase;
                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: isPending ? 0.38 : 1,
                        transition: 'opacity 0.3s ease',
                      }}>
                        {/* State indicator */}
                        {isDone ? (
                          <div style={{
                            width: '16px', height: '16px', borderRadius: '50%',
                            backgroundColor: meta.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <IconCheck size={9} color="#fff" />
                          </div>
                        ) : isActive ? (
                          <div style={{
                            width: '16px', height: '16px', borderRadius: '50%',
                            border: `2px solid ${meta.color}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <div style={{
                              width: '7px', height: '7px', borderRadius: '50%',
                              backgroundColor: meta.color,
                              animation: 'docGenPulse 1.4s ease-in-out infinite',
                            }} />
                          </div>
                        ) : (
                          <div style={{
                            width: '16px', height: '16px', borderRadius: '50%',
                            border: `1.5px solid ${mutedCol}`,
                            flexShrink: 0,
                            opacity: 0.4,
                          }} />
                        )}
                        {/* Phase label */}
                        <span style={{
                          fontSize: '11.5px',
                          fontWeight: isActive ? 700 : isDone ? 600 : 400,
                          color: isActive ? meta.color : isDone ? textColor : mutedCol,
                          lineHeight: 1.3,
                          transition: 'color 0.3s ease, font-weight 0.2s ease',
                          fontFamily: "'Instrument Sans', sans-serif",
                        }}>
                          {phase}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Do not refresh warning */}
            {!isComplete && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-dim)',
                border: '1px solid var(--border-hover)',
                marginTop: '2px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span style={{
                    fontSize: '11px',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: '0.02em',
                  }}>
                    Do not refresh or leave this page
                  </span>
                </div>
                {/* Shimmer progress bar */}
                <div style={{
                  position: 'relative',
                  width: '90px',
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: trackCol,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0, top: 0, bottom: 0,
                    width: `${progress}%`,
                    borderRadius: '2px',
                    backgroundColor: meta.color,
                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                  {/* Shimmer sweep */}
                  <div style={{
                    position: 'absolute',
                    top: 0, bottom: 0,
                    width: '40px',
                    background: `linear-gradient(90deg, transparent, ${meta.color}80, transparent)`,
                    animation: 'docGenShimmer 1.6s linear infinite',
                  }} />
                </div>
              </div>
            )}

            {/* Phase step dots */}
            {!isComplete && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
                {meta.phases.map((_, idx) => (
                  <div key={idx} style={{
                    flex: 1,
                    height: '3px',
                    borderRadius: '2px',
                    backgroundColor: idx < currentPhase
                      ? meta.color
                      : idx === currentPhase
                        ? `${meta.color}70`
                        : trackCol,
                    transition: 'background-color 0.4s ease',
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Error section ─────────────────────────────���─────────────────��─── */}
        {isError && (
          <div style={{
            padding: '11px 13px',
            borderRadius: '9px',
            backgroundColor: isDark ? 'rgba(239,68,68,0.09)' : '#FEF2F2',
            border: '1px solid rgba(239,68,68,0.18)',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}>
            <IconAlert size={15} color={isDark ? '#FCA5A5' : '#DC2626'} />
            <span style={{ fontSize: '12.5px', color: isDark ? '#FCA5A5' : '#DC2626', lineHeight: 1.5 }}>
              {errorText || 'Generation failed — please try again.'}
            </span>
          </div>
        )}

        {/* ── Complete: file info + actions ─────────────────────────────────── */}
        {isComplete && outputData && (
          <div>

            {/* Prominent download banner */}
            {(downloadUrl || fileId) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '11px',
                background: isDark
                  ? `linear-gradient(135deg, ${meta.color}1A 0%, ${meta.color}0D 100%)`
                  : `linear-gradient(135deg, ${meta.color}0F 0%, ${meta.color}06 100%)`,
                border: `1.5px solid ${meta.color}30`,
                marginBottom: '12px',
              }}>
                {/* File icon + name + size */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '9px',
                    background: isDark ? meta.bgDark : meta.bgLight,
                    border: `1px solid ${meta.color}28`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 2px 8px ${meta.color}20`,
                  }}>
                    <FileIcon size={20} color={meta.color} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: textColor,
                      fontFamily: "'Syne', sans-serif",
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {outputData.filename || `${title}.${fileType}`}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: mutedCol,
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: "'DM Mono', monospace",
                    }}>
                      <span style={{
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: `${meta.color}14`,
                        color: meta.color,
                        fontSize: '9.5px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                      }}>
                        {getDisplayType(fileType)}
                      </span>
                      {formatSize() && <span>{formatSize()}</span>}
                      <span style={{ opacity: 0.35 }}>·</span>
                      <span>{formatTime(elapsedTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Download CTA */}
                <button
                  onClick={handleDownload}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '9px',
                    border: 'none',
                    background: meta.gradient,
                    color: isPotomacGenType(fileType) ? '#111111' : '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: "'Syne', sans-serif",
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: `0 4px 14px ${meta.color}35`,
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = `0 6px 18px ${meta.color}50`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 14px ${meta.color}35`;
                  }}
                >
                  <IconDownload size={13} color={isPotomacGenType(fileType) ? '#111' : '#fff'} />
                  Download {getDisplayType(fileType)}
                </button>
              </div>
            )}
            <div style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '12px',
              padding: '9px 12px',
              borderRadius: '9px',
              backgroundColor: metaBg,
              border: `1px solid ${metaBdr}`,
            }}>
              {outputData.filename && (
                <div style={{ fontSize: '11.5px', color: mutedCol }}>
                  <span style={{ fontWeight: 700, color: textColor }}>File </span>
                  {outputData.filename}
                </div>
              )}
              {formatSize() && (
                <div style={{ fontSize: '11.5px', color: mutedCol }}>
                  <span style={{ fontWeight: 700, color: textColor }}>Size </span>
                  {formatSize()}
                </div>
              )}
              {(outputData.slides || outputData.slide_count || outputData.pages || outputData.page_count) && (
                <div style={{ fontSize: '11.5px', color: mutedCol }}>
                  <span style={{ fontWeight: 700, color: textColor }}>
                    {outputData.slides || outputData.slide_count ? 'Slides ' : 'Pages '}
                  </span>
                  {outputData.slides || outputData.slide_count || outputData.pages || outputData.page_count}
                </div>
              )}
              {(outputData.sheets || outputData.sheet_count) && (
                <div style={{ fontSize: '11.5px', color: mutedCol }}>
                  <span style={{ fontWeight: 700, color: textColor }}>Sheets </span>
                  {outputData.sheets || outputData.sheet_count}
                </div>
              )}
              <div style={{ fontSize: '11.5px', color: mutedCol, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontWeight: 700, color: textColor }}>Time </span>
                {/* Show exec_time_ms from generate_docx response if available, otherwise use elapsed time */}
                {outputData.exec_time_ms
                  ? `${(outputData.exec_time_ms / 1000).toFixed(1)}s`
                  : formatTime(elapsedTime)}
              </div>
              {/* Show Potomac branding for server-side document generators */}
              {isPotomacType(fileType) && (
                <div style={{
                  fontSize: '10px',
                  color: meta.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  fontFamily: "'DM Mono', monospace",
                  marginLeft: 'auto',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill={meta.color} opacity="0.15" stroke={meta.color} strokeWidth="1.5"/>
                    <path d="M9 8v8M9 8h3a2 2 0 1 1 0 4H9" stroke={meta.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  POTOMAC
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
              {(downloadUrl || fileId) && (
                <button
                  onClick={handleDownload}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '9px 18px',
                    borderRadius: '9px',
                    border: 'none',
                    background: meta.gradient,
                    color: isPotomacGenType(fileType) ? '#111111' : '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    fontFamily: "'Syne', sans-serif",
                    letterSpacing: '0.4px',
                    boxShadow: `0 3px 10px ${meta.color}28`,
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = `0 5px 14px ${meta.color}38`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 3px 10px ${meta.color}28`;
                  }}
                >
                  <IconDownload size={13} color={isPotomacGenType(fileType) ? '#111' : '#fff'} />
                  DOWNLOAD {getDisplayType(fileType)}
                </button>
              )}

              {(outputData?.code || outputData?.content || outputData?.text) && (
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: '9px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    background: 'transparent',
                    color: mutedCol,
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    fontFamily: "'Instrument Sans', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = meta.color;
                    e.currentTarget.style.color = meta.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
                    e.currentTarget.style.color = mutedCol;
                  }}
                >
                  {copied ? <><IconCheck size={12} color="#10B981" /> Copied</> : <><IconCopy size={12} /> Copy</>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Safety timeout warning ──────────────────────────────────────────── */}
        {safetyTimeout && !isComplete && !isError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '9px',
            backgroundColor: isDark ? 'rgba(251,191,36,0.08)' : '#FFFBEB',
            border: '1px solid rgba(251,191,36,0.2)',
            marginBottom: '12px',
          }}>
            <IconAlert size={14} color="#F59E0B" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#F59E0B' }}>
                Taking longer than expected
              </div>
              <div style={{ fontSize: '10.5px', color: mutedCol, marginTop: '2px' }}>
                The backend may still be processing. You can wait or check manually.
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(251,191,36,0.3)',
                background: 'rgba(251,191,36,0.1)',
                color: '#F59E0B',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              Refresh
            </button>
          </div>
        )}

        {/* ── Inline live preview panel (JS library-based) ────────────────────── */}
        {isComplete && downloadUrl && previewOpen && supportsPreview(fileType) && (
          <div style={{
            marginTop: '12px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: `1px solid ${metaBdr}`,
          }}>
            {/* Preview header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: metaBg,
              borderBottom: `1px solid ${metaBdr}`,
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <FileIcon size={13} color={meta.color} />
                Preview
              </span>
              <button
                onClick={() => setPreviewOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: mutedCol,
                  fontSize: '10px',
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = textColor; }}
                onMouseLeave={e => { e.currentTarget.style.color = mutedCol; }}
              >
                ▲ Hide Preview
              </button>
            </div>
            {/* Preview content */}
            <div style={{
              position: 'relative',
              width: '100%',
              maxHeight: '400px',
              overflow: 'auto',
              backgroundColor: isDark ? '#0D0D10' : '#FFFFFF',
            }}>
              {previewLoading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  gap: '8px',
                  color: mutedCol,
                  fontSize: '12px',
                }}>
                  <span style={{
                    width: '14px', height: '14px',
                    border: `2px solid ${meta.color}`,
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'docGenSpin 0.8s linear infinite',
                    display: 'inline-block',
                  }} />
                  Loading preview…
                </div>
              ) : fileType === 'pptx' ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  gap: '8px',
                  color: mutedCol,
                  fontSize: '12px',
                }}>
                  <FileIcon size={32} color={meta.color} />
                  <span>PPTX preview is not available in-browser.</span>
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>Use the download button to open the file.</span>
                </div>
              ) : parsedDoc ? (
                <div style={{ padding: '14px 16px' }}>
                  {parsedDoc.type === 'html' && (
                    <div
                      style={{
                        fontSize: '13px',
                        lineHeight: 1.7,
                        color: textColor,
                        fontFamily: "'Instrument Sans', sans-serif",
                      }}
                      dangerouslySetInnerHTML={{ __html: parsedDoc.content }}
                    />
                  )}
                  {parsedDoc.type === 'text' && (
                    <pre style={{
                      margin: 0,
                      fontSize: '12px',
                      lineHeight: 1.6,
                      color: textColor,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: "'DM Mono', monospace",
                    }}>
                      {parsedDoc.content}
                    </pre>
                  )}
                  {parsedDoc.type === 'table' && parsedDoc.tables && (
                    <div>
                      {parsedDoc.tables.map((table, tIdx) => (
                        <div key={tIdx} style={{ marginBottom: tIdx < parsedDoc.tables!.length - 1 ? '20px' : 0 }}>
                          {table.name && (
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: meta.color,
                              marginBottom: '8px',
                              fontFamily: "'Syne', sans-serif",
                            }}>
                              {table.name}
                            </div>
                          )}
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '11.5px',
                              fontFamily: "'Instrument Sans', sans-serif",
                            }}>
                              <thead>
                                <tr>
                                  {table.headers.map((h, hIdx) => (
                                    <th key={hIdx} style={{
                                      padding: '6px 10px',
                                      textAlign: 'left',
                                      fontWeight: 700,
                                      fontSize: '10.5px',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      color: mutedCol,
                                      borderBottom: `1px solid ${metaBdr}`,
                                      backgroundColor: metaBg,
                                      whiteSpace: 'nowrap',
                                    }}>
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {table.rows.slice(0, 100).map((row, rIdx) => (
                                  <tr key={rIdx} style={{
                                    backgroundColor: rIdx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'),
                                  }}>
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} style={{
                                        padding: '5px 10px',
                                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                                        color: textColor,
                                        whiteSpace: 'nowrap',
                                        maxWidth: '200px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}>
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {table.rows.length > 100 && (
                            <div style={{
                              fontSize: '10.5px',
                              color: mutedCol,
                              marginTop: '6px',
                              fontStyle: 'italic',
                            }}>
                              Showing first 100 of {table.rows.length} rows
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {parsedDoc.type === 'unsupported' && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '150px',
                      gap: '6px',
                      color: mutedCol,
                      fontSize: '12px',
                    }}>
                      {parsedDoc.content}
                    </div>
                  )}
                  {parsedDoc.metadata && (
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '8px',
                      borderTop: `1px solid ${metaBdr}`,
                      display: 'flex',
                      gap: '14px',
                      fontSize: '10.5px',
                      color: mutedCol,
                      fontFamily: "'DM Mono', monospace",
                    }}>
                      {parsedDoc.metadata.pages && <span>{parsedDoc.metadata.pages} pages</span>}
                      {parsedDoc.metadata.wordCount && <span>{parsedDoc.metadata.wordCount.toLocaleString()} words</span>}
                      {parsedDoc.metadata.lineCount && <span>{parsedDoc.metadata.lineCount} lines</span>}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '150px',
                  color: mutedCol,
                  fontSize: '12px',
                }}>
                  No preview available
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AFL code preview ──────────────────────────────────────────────── */}
        {isComplete && fileType === 'afl' && outputData?.code && (
          <div style={{
            marginTop: '12px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: `1px solid ${metaBdr}`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: metaBg,
              borderBottom: `1px solid ${metaBdr}`,
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: textColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileIcon size={13} color={meta.color} />
                AFL Code
              </span>
              <button
                onClick={() => setPreviewOpen(!previewOpen)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: mutedCol, fontSize: '10px',
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: '0.04em',
                }}
              >
                {previewOpen ? '▲ Hide' : '▼ Show'}
              </button>
            </div>
            {previewOpen && (
              <pre style={{
                margin: 0,
                padding: '14px 16px',
                fontSize: '12px',
                lineHeight: 1.6,
                color: textColor,
                backgroundColor: isDark ? '#0D0D10' : '#FAFAFA',
                overflow: 'auto',
                maxHeight: '300px',
                fontFamily: "'DM Mono', monospace",
              }}>
                {outputData.code}
              </pre>
            )}
          </div>
        )}

        {/* ── Collapsed preview toggle ──────────────────────────────────────── */}
        {isComplete && downloadUrl && !previewOpen && supportsPreview(fileType) && (
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => setPreviewOpen(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: mutedCol, fontSize: '10.5px', fontWeight: 600,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.04em',
                display: 'flex', alignItems: 'center', gap: '4px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = meta.color; }}
              onMouseLeave={e => { e.currentTarget.style.color = mutedCol; }}
            >
              ▼ Show Preview
            </button>
          </div>
        )}

        {/* ── Open in new tab button (when preview is shown) ────────────────── */}
        {isComplete && downloadUrl && previewOpen && supportsPreview(fileType) && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '7px' }}>
            <button
              onClick={() => window.open(resolveUrl(downloadUrl), '_blank')}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '7px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                background: 'transparent', color: mutedCol,
                fontWeight: 600, fontSize: '11px', cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: "'Instrument Sans', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.color = meta.color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = mutedCol; }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Open in new tab
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(resolveUrl(downloadUrl));
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                toast.success('URL copied');
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '7px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                background: 'transparent', color: mutedCol,
                fontWeight: 600, fontSize: '11px', cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: "'Instrument Sans', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.color = meta.color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = mutedCol; }}
            >
              {copied ? <><IconCheck size={11} color="#10B981" /> Copied</> : <><IconCopy size={11} /> Copy URL</>}
            </button>
          </div>
        )}

        {/* ── Estimated time hint ──────────────────────────��────────────────── */}
        {!isComplete && !isError && progress > 5 && (
          <div style={{
            fontSize: '10.5px',
            color: mutedCol,
            textAlign: 'center',
            marginTop: '6px',
            opacity: 0.65,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.04em',
          }}>
            {progress < 50 ? '30–60 seconds remaining' : progress < 80 ? 'Almost there' : 'Wrapping up'}
          </div>
        )}
      </div>

      <style>{`
        @keyframes docGenPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.82); }
        }
        @keyframes docGenSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes docGenShimmer {
          0% { left: -60px; }
          100% { left: calc(100% + 60px); }
        }
        @keyframes docGenSlideIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default DocumentGenerationCard;
