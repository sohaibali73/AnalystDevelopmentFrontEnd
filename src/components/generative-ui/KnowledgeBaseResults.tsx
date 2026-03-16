'use client';

import React from 'react';
import { Database, FileText, Tag, Clock, Search, ChevronRight } from 'lucide-react';

interface KBDocument {
  id: string;
  title: string;
  category?: string;
  summary?: string;
  tags?: string[];
  content_snippet?: string;
}

interface KnowledgeBaseResultsProps {
  success?: boolean;
  query?: string;
  category_filter?: string;
  results_count?: number;
  search_time_ms?: number;
  results?: KBDocument[];
  error?: string;
  _tool_time_ms?: number;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  afl: { bg: 'rgba(254, 192, 15, 0.12)', text: '#FEC00F' },
  strategy: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e' },
  indicator: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },
  general: { bg: 'rgba(156, 163, 175, 0.12)', text: '#9ca3af' },
  documentation: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' },
};

function getCategoryStyle(category: string): React.CSSProperties {
  const colors = categoryColors[category] || categoryColors.general;
  return { backgroundColor: colors.bg, color: colors.text };
}

export function KnowledgeBaseResults(props: KnowledgeBaseResultsProps) {
  if (!props.success && props.error) {
    return (
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: 'rgba(220, 38, 38, 0.08)',
          border: '1px solid rgba(220, 38, 38, 0.25)',
          borderRadius: '12px',
          color: '#ef4444',
          fontSize: '14px',
          marginTop: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Database size={16} />
        <span>
          <strong>Knowledge Base Error:</strong> {props.error}
        </span>
      </div>
    );
  }

  const results = props.results || [];

  return (
    <div
      style={{
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid rgba(254, 192, 15, 0.2)',
        maxWidth: '640px',
        marginTop: '8px',
        backgroundColor: '#0d1117',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          background: 'linear-gradient(135deg, rgba(254, 192, 15, 0.1) 0%, rgba(254, 192, 15, 0.03) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(254, 192, 15, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database size={16} color="#FEC00F" />
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#FEC00F', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px' }}>
            KNOWLEDGE BASE
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(254, 192, 15, 0.15)',
              color: '#FEC00F',
              fontWeight: 600,
            }}
          >
            {props.results_count || results.length} found
          </span>
        </div>
        {props.search_time_ms && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
            <Clock size={10} /> {props.search_time_ms}ms
          </span>
        )}
      </div>

      {/* Query */}
      {props.query && (
        <div
          style={{
            padding: '10px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          <Search size={12} />
          <span>{'"'}{props.query}{'"'}</span>
          {props.category_filter && (
            <span
              style={{
                ...getCategoryStyle(props.category_filter),
                padding: '2px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: "'Rajdhani', sans-serif",
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
              }}
            >
              {props.category_filter}
            </span>
          )}
        </div>
      )}

      {/* Results */}
      <div>
        {results.length === 0 ? (
          <div style={{ padding: '32px 18px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
            No documents found matching your query.
          </div>
        ) : (
          results.map((doc, i) => (
            <div
              key={doc.id || i}
              style={{
                padding: '14px 18px',
                borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                transition: 'background-color 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <FileText size={14} color="rgba(255,255,255,0.45)" />
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#e6edf3' }}>{doc.title}</span>
                {doc.category && (
                  <span
                    style={{
                      ...getCategoryStyle(doc.category),
                      padding: '2px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {doc.category}
                  </span>
                )}
              </div>
              {doc.summary && (
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '0 0 6px 22px' }}>
                  {doc.summary}
                </p>
              )}
              {doc.content_snippet && (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.4)',
                    lineHeight: 1.5,
                    margin: '0 0 6px 22px',
                    fontStyle: 'italic',
                    borderLeft: '2px solid rgba(254, 192, 15, 0.25)',
                    paddingLeft: '10px',
                  }}
                >
                  {doc.content_snippet}
                </div>
              )}
              {doc.tags && doc.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginLeft: '22px' }}>
                  {doc.tags.map((tag, j) => (
                    <span
                      key={j}
                      style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '5px',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Tag size={8} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default KnowledgeBaseResults;
