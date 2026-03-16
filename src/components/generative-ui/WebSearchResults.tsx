'use client';

import React from 'react';
import { Globe, ExternalLink, Search } from 'lucide-react';

interface WebSearchResultsProps {
  // Claude's web_search tool returns various formats
  results?: Array<{
    title?: string;
    url?: string;
    snippet?: string;
    content?: string;
  }>;
  query?: string;
  // Raw output from web_search (might be string or object)
  [key: string]: any;
}

export function WebSearchResults(props: WebSearchResultsProps) {
  // Try to extract results from various possible formats
  let results = props.results || [];
  let query = props.query || '';

  // If results is empty, try to find data in other fields
  if (results.length === 0 && typeof props === 'object') {
    // Claude web_search may return content directly
    if (props.content && typeof props.content === 'string') {
      return (
        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(124, 58, 237, 0.3)', maxWidth: '600px', marginTop: '8px' }}>
          <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(124, 58, 237, 0.05) 100%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={16} color="#7c3aed" />
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#7c3aed' }}>Web Search</span>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#0d1117', fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {props.content}
          </div>
        </div>
      );
    }
  }

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(124, 58, 237, 0.3)', maxWidth: '600px', marginTop: '8px' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(124, 58, 237, 0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={16} color="#7c3aed" />
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#7c3aed' }}>Web Search Results</span>
          {results.length > 0 && (
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(124, 58, 237, 0.2)', color: '#7c3aed' }}>
              {results.length} results
            </span>
          )}
        </div>
      </div>

      {query && (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          <Search size={12} /> "{query}"
        </div>
      )}

      <div style={{ backgroundColor: '#0d1117' }}>
        {results.length === 0 ? (
          <div style={{ padding: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            Search completed. Results integrated into the response.
          </div>
        ) : (
          results.map((result, i) => (
            <div key={i} style={{ padding: '12px 16px', borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              {result.title && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#a78bfa' }}>{result.title}</span>
                  {result.url && (
                    <a href={result.url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}
              {result.url && (
                <div style={{ fontSize: '11px', color: 'rgba(124, 58, 237, 0.6)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {result.url}
                </div>
              )}
              {(result.snippet || result.content) && (
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>
                  {result.snippet || result.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default WebSearchResults;
