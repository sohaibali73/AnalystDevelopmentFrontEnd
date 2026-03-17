'use client';

/**
 * KnowledgeBasePanel — Floating document picker for referencing KB docs in chat.
 * Extracted from ChatPage.tsx for separation of concerns.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Loader2, X, Check, Database, BookOpen,
  FileText as FileTextIcon,
} from 'lucide-react';
import { getAuthToken, getFileExtension, getFileChipColor } from './chat-utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface KBDocument {
  id: string;
  title?: string;
  filename: string;
  category: string;
  file_size?: number;
}

interface KnowledgeBasePanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocIds: Set<string>;
  onSelectedDocIdsChange: (ids: Set<string>) => void;
  isDark: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function KnowledgeBasePanel({
  isOpen,
  onClose,
  selectedDocIds,
  onSelectedDocIdsChange,
  isDark,
}: KnowledgeBasePanelProps) {
  const [docs, setDocs] = useState<KBDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch documents when panel opens
  const fetchDocs = useCallback(async () => {
    if (docs.length > 0) return; // already loaded
    setLoading(true);
    try {
      const token = getAuthToken();
      const baseUrl = (
        process.env.NEXT_PUBLIC_API_URL ||
        'https://developer-potomaac.up.railway.app'
      ).replace(/\/+$/, '');
      const resp = await fetch(`${baseUrl}/brain/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        setDocs((await resp.json()) || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [docs.length]);

  useEffect(() => {
    if (isOpen) fetchDocs();
  }, [isOpen, fetchDocs]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  const toggleDoc = (id: string) => {
    const next = new Set(selectedDocIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedDocIdsChange(next);
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '360px',
        maxWidth: 'calc(100vw - 48px)',
        maxHeight: '420px',
        backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
        border: `1px solid ${isDark ? '#3A3A3A' : '#E0E0E0'}`,
        borderRadius: '16px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 9998,
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3.5 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: `1px solid ${isDark ? '#2E2E2E' : '#E5E5E5'}` }}
      >
        <div className="flex items-center gap-2">
          <Database size={15} color="#FEC00F" />
          <span
            className="text-[13px] font-bold tracking-wider"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              color: isDark ? '#FFFFFF' : '#212121',
            }}
          >
            KNOWLEDGE BASE
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          {selectedDocIds.size > 0 && (
            <button
              onClick={() => onSelectedDocIdsChange(new Set())}
              className="bg-transparent border-none cursor-pointer text-[11px] font-semibold tracking-wide"
              style={{
                color: isDark ? '#9E9E9E' : '#666',
                fontFamily: "'Rajdhani', sans-serif",
              }}
            >
              CLEAR
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer p-0.5 flex items-center"
            style={{ color: isDark ? '#9E9E9E' : '#666' }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Selection count */}
      {selectedDocIds.size > 0 && (
        <div
          className="px-4 py-2 flex-shrink-0"
          style={{
            backgroundColor: 'rgba(254,192,15,0.08)',
            borderBottom: '1px solid rgba(254,192,15,0.2)',
          }}
        >
          <span
            className="text-xs font-semibold"
            style={{
              color: '#FEC00F',
              fontFamily: "'Quicksand', sans-serif",
            }}
          >
            {selectedDocIds.size} document{selectedDocIds.size !== 1 ? 's' : ''} selected — will be
            added to your message
          </span>
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center p-10 gap-2.5">
            <Loader2 size={18} color="#FEC00F" className="animate-spin" />
            <span className="text-[13px]" style={{ color: isDark ? '#9E9E9E' : '#666' }}>
              Loading documents...
            </span>
          </div>
        ) : docs.length === 0 ? (
          <div className="p-10 text-center">
            <BookOpen
              size={28}
              color={isDark ? '#333' : '#ccc'}
              className="mx-auto mb-2.5 block"
            />
            <p
              className="text-[13px] mb-1.5"
              style={{ color: isDark ? '#9E9E9E' : '#666', margin: '0 0 6px' }}
            >
              No documents in Knowledge Base
            </p>
            <p className="text-[11px]" style={{ color: isDark ? '#666' : '#999', margin: 0 }}>
              Upload documents in the Knowledge Base section
            </p>
          </div>
        ) : (
          docs.map((doc) => {
            const isSelected = selectedDocIds.has(doc.id);
            const ext = getFileExtension(doc.filename);
            const docColor = getFileChipColor(ext);

            return (
              <button
                key={doc.id}
                onClick={() => toggleDoc(doc.id)}
                className="w-full flex items-center gap-2.5 rounded-[9px] cursor-pointer text-left transition-all mb-0.5"
                style={{
                  padding: '9px 10px',
                  border: `1px solid ${isSelected ? 'rgba(254,192,15,0.5)' : 'transparent'}`,
                  backgroundColor: isSelected ? 'rgba(254,192,15,0.08)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = isDark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(0,0,0,0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div
                  className="w-[34px] h-[34px] rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${docColor}18` }}
                >
                  <FileTextIcon size={16} color={docColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="m-0 mb-0.5 text-[13px] font-semibold truncate"
                    style={{ color: isDark ? '#E8E8E8' : '#1A1A1A' }}
                  >
                    {doc.title || doc.filename}
                  </p>
                  <div className="flex gap-1.5 items-center">
                    <span
                      className="text-[10px] px-1.5 py-px rounded font-bold uppercase"
                      style={{
                        backgroundColor: `${docColor}14`,
                        color: docColor,
                        fontFamily: "'Rajdhani', sans-serif",
                      }}
                    >
                      {doc.category}
                    </span>
                    <span className="text-[11px]" style={{ color: isDark ? '#666' : '#999' }}>
                      {ext.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    border: `2px solid ${isSelected ? '#FEC00F' : isDark ? '#444' : '#ddd'}`,
                    backgroundColor: isSelected ? '#FEC00F' : 'transparent',
                  }}
                >
                  {isSelected && <Check size={11} color="#000" strokeWidth={3} />}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      {selectedDocIds.size > 0 && (
        <div
          className="px-3 py-2.5 flex-shrink-0"
          style={{ borderTop: `1px solid ${isDark ? '#2E2E2E' : '#E5E5E5'}` }}
        >
          <button
            onClick={onClose}
            className="w-full py-2.5 border-none rounded-[9px] cursor-pointer text-[13px] font-bold tracking-wider"
            style={{
              backgroundColor: '#FEC00F',
              fontFamily: "'Rajdhani', sans-serif",
              color: '#000',
            }}
          >
            ADD TO MESSAGE
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
