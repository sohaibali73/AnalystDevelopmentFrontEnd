$content = @'  
'use client';  
  
import React, { useCallback, useEffect, useRef, useState } from 'react';  
import { X, Download, FileText, FileCode, FileSpreadsheet, File, Loader2, AlertCircle, Copy, CheckCircle, ExternalLink } from 'lucide-react';  
import kbApi from '@/lib/kbApi';  
import { parseFileForPreview } from '@/lib/filePreview';  
import type { KBDocument } from '@/types/kb';  
  
function getExt(filename: string): string { return filename.split('.').pop()?.toLowerCase() || ''; }  
  
function getFileIcon(filename: string) {  
  const ext = getExt(filename);  
  switch (ext) {  
    case 'pdf': return { Icon: FileText, color: '#ef4444' };  
    case 'doc': case 'docx': return { Icon: FileText, color: '#3b82f6' };  
    case 'txt': case 'md': return { Icon: FileCode, color: '#22c55e' };  
    case 'csv': case 'xlsx': case 'xls': return { Icon: FileSpreadsheet, color: '#22c55e' };  
    case 'json': case 'xml': case 'html': case 'htm': return { Icon: FileCode, color: '#f59e0b' };  
    default: return { Icon: File, color: '#9ca3af' };  
  }  
} 
  
function formatSize(bytes: number | null | undefined): string {  
  const n = Number(bytes ?? 0);  
  if (n < 1024) return n + ' B';  
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';  
  return (n / (1024 * 1024)).toFixed(2) + ' MB';  
}  
  
const TEXT_EXTS = ['txt', 'md', 'json', 'xml', 'html', 'htm', 'csv'];  
const PARSEABLE_EXTS = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv', 'txt', 'md', 'json', 'html', 'htm', 'xml']; 
  
export interface KBFileViewerModalProps {  
  doc: KBDocument;  
  onClose: () => void;  
  isDark: boolean;  
  colors: Record<string, string>;  
  chunkPreview?: string;  
} 
  
export default function KBFileViewerModal({ doc, onClose, isDark, colors, chunkPreview }: KBFileViewerModalProps) {  
  const [loading, setLoading] = useState(true);  
  const [error, setError] = useState<string | null>(null);  
  const [contentType, setContentType] = useState<'html' | 'text' | 'table' | 'json' | 'unsupported'>('text');  
  const [content, setContent] = useState<string | null>(null);  
  const [tables, setTables] = useState<{ headers: string[]; rows: string[][]; name?: string }[] | undefined>(undefined);  
  const [copied, setCopied] = useState(false);  
  const [showRawFallback, setShowRawFallback] = useState(false);  
  const contentRef = useRef<HTMLDivElement>(null); 
  
  const ext = getExt(doc.filename);  
  const { Icon: FIcon, color: fColor } = getFileIcon(doc.filename);  
  const downloadUrl = kbApi.getDownloadUrl(doc.id);  
  const attachmentUrl = kbApi.getAttachmentUrl(doc.id); 
  
  const loadContent = useCallback(async () => {  
    setLoading(true); setError(null); setContent(null); setTables(undefined);  
    try {  
      if (PARSEABLE_EXTS.includes(ext)) {  
        const blob = await kbApi.fetchBlob(doc.id);  
        if (blob.size > 0) {  
          const parsed = await parseFileForPreview(blob, doc.filename);  
          if (parsed.type !== 'unsupported') {  
            setContentType(parsed.type as any); setContent(parsed.content); setTables(parsed.tables);  
            setLoading(false); return;  
          }  
        }  
      } 
      try {  
        const raw = await kbApi.getRawDocument(doc.id);  
        if (raw.raw_content) {  
          setContentType('text'); setContent(raw.raw_content); setShowRawFallback(true);  
          setLoading(false); return;  
        }  
      } catch { /* ignore */ }  
      setContentType('unsupported'); setContent(null);  
    } catch (err) {  
      setError(err instanceof Error ? err.message : 'Failed to load document');  
    } finally { setLoading(false); }  
  }, [doc.id, doc.filename, ext]); 
  
  useEffect(() => { loadContent(); }, [loadContent]);  
  
  useEffect(() => {  
    if (!chunkPreview || !content || !contentRef.current) return;  
    const needle = chunkPreview.slice(0, 80).toLowerCase();  
    const text = contentRef.current.innerText?.toLowerCase() ?? '';  
    const idx = text.indexOf(needle);  
    if (idx > -1) {  
      const ratio = idx / text.length;  
      const el = contentRef.current;  
      el.scrollTop = ratio * el.scrollHeight;  
    }  
  }, [chunkPreview, content]); 
  
  const handleCopy = () => {  
    if (content) { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }  
  }; 
  
  return (  
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>  
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} /> 
The syntax of the command is incorrect.
test line with backtick 
test with dollar sign ${colors.border} 
test with percent 100%%  
test with percent 100%%  
The syntax of the command is incorrect.
The syntax of the command is incorrect.
test line  
      <div style={{ position: 'relative' }}> 
