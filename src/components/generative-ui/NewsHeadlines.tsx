'use client';

import React, { useState } from 'react';
import { Newspaper, ExternalLink, Clock, TrendingUp, TrendingDown, Bookmark, ChevronDown, ChevronUp, Tag } from 'lucide-react';

interface NewsArticle {
  title: string;
  source: string;
  url?: string;
  published_at?: string;
  summary?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  category?: string;
  image_url?: string;
  author?: string;
}

interface NewsHeadlinesProps {
  headlines?: NewsArticle[];
  articles?: NewsArticle[];  // Backend may return 'articles' instead of 'headlines'
  query?: string;
  category?: string;
  total_results?: number;
  market_sentiment?: 'bullish' | 'bearish' | 'neutral';
  last_updated?: string;
  [key: string]: any; // Allow extra fields from tool output
}

const sentimentStyles: Record<string, { color: string; bg: string; label: string }> = {
  positive: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', label: 'Bullish' },
  negative: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', label: 'Bearish' },
  neutral: { color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', label: 'Neutral' },
};

const categoryColors: Record<string, string> = {
  earnings: '#FEC00F',
  markets: '#60A5FA',
  crypto: '#A78BFA',
  economy: '#22C55E',
  tech: '#818CF8',
  politics: '#F87171',
  commodities: '#FB923C',
  forex: '#5EEAD4',
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return dateStr;
  }
}

export function NewsHeadlines({
  headlines: headlinesProp,
  articles: articlesProp,
  query,
  category,
  total_results,
  market_sentiment,
  last_updated,
  ...rest
}: NewsHeadlinesProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Normalize: accept both 'headlines' and 'articles', and normalize field names
  const rawItems = headlinesProp || articlesProp || (rest as any).results || [];
  const headlines: NewsArticle[] = rawItems.map((item: any) => ({
    title: item.title || '',
    source: item.source || item.source_name || '',
    url: item.url || item.link || '',
    published_at: item.published_at || item.published || item.publishedAt || item.date || '',
    summary: item.summary || item.description || item.snippet || '',
    sentiment: item.sentiment || 'neutral',
    category: item.category || '',
    image_url: item.image_url || item.imageUrl || item.image || '',
    author: item.author || '',
  }));

  const visibleHeadlines = showAll ? headlines : headlines.slice(0, 5);

  if (!headlines.length) {
    return (
      <div style={{ padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
        <Newspaper size={32} color="rgba(255,255,255,0.3)" style={{ marginBottom: '8px' }} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>No news articles found{query ? ` for "${query}"` : ''}</p>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
      color: '#fff',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      maxWidth: '560px',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Newspaper size={20} color="#FEC00F" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                {query ? `News: ${query}` : category ? `${category} News` : 'Market News'}
              </h3>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                {total_results !== undefined ? `${total_results} articles` : `${headlines.length} articles`}
                {last_updated && ` · Updated ${timeAgo(last_updated)}`}
              </div>
            </div>
          </div>

          {market_sentiment && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', borderRadius: '20px',
              backgroundColor: market_sentiment === 'bullish' ? 'rgba(34,197,94,0.15)' : market_sentiment === 'bearish' ? 'rgba(239,68,68,0.15)' : 'rgba(156,163,175,0.1)',
              color: market_sentiment === 'bullish' ? '#22C55E' : market_sentiment === 'bearish' ? '#EF4444' : '#9CA3AF',
              fontSize: '12px', fontWeight: 700, textTransform: 'uppercase',
            }}>
              {market_sentiment === 'bullish' ? <TrendingUp size={14} /> : market_sentiment === 'bearish' ? <TrendingDown size={14} /> : null}
              {market_sentiment}
            </div>
          )}
        </div>
      </div>

      {/* Articles */}
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {visibleHeadlines.map((article, i) => {
          const isExpanded = expanded === i;
          const sent = sentimentStyles[article.sentiment || 'neutral'];
          const catColor = categoryColors[(article.category || '').toLowerCase()] || '#9CA3AF';

          return (
            <div
              key={i}
              style={{
                padding: '14px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                backgroundColor: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
              }}
              onClick={() => setExpanded(isExpanded ? null : i)}
              onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
              onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {/* Sentiment dot */}
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: sent.color, marginTop: '6px', flexShrink: 0 }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title */}
                  <h4 style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.4, margin: '0 0 6px', color: '#fff' }}>
                    {article.title}
                  </h4>

                  {/* Meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#FEC00F' }}>{article.source}</span>
                    {article.published_at && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={10} />
                        {timeAgo(article.published_at)}
                      </span>
                    )}
                    {article.category && (
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', backgroundColor: `${catColor}15`, color: catColor, textTransform: 'uppercase' }}>
                        {article.category}
                      </span>
                    )}
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '8px', backgroundColor: sent.bg, color: sent.color }}>
                      {sent.label}
                    </span>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && article.summary && (
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '10px 0 8px' }}>
                      {article.summary}
                    </p>
                  )}
                  {isExpanded && article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        fontSize: '12px', color: '#60A5FA', textDecoration: 'none',
                        marginTop: '4px',
                      }}
                    >
                      Read full article <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more */}
      {headlines.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)',
            border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            color: '#FEC00F', fontSize: '12px', fontWeight: 600,
          }}
        >
          {showAll ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Show All {headlines.length} Articles</>}
        </button>
      )}
    </div>
  );
}

export default NewsHeadlines;
