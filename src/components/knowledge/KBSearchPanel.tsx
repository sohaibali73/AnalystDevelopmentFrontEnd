'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Clock,
  Loader2,
  ChevronDown,
  FileText,
  SlidersHorizontal,
  Tag,
  Calendar,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import { SearchResult } from '@/types/api';

interface KBSearchPanelProps {
  onSearch: (query: string, category?: string) => Promise<SearchResult[]>;
  categories: string[];
  isDark: boolean;
  colors: Record<string, string>;
  isMobile: boolean;
  onResultClick?: (result: SearchResult) => void;
}

type SortOption = 'relevance' | 'newest' | 'filename';
type FileTypeFilter = 'all' | 'pdf' | 'txt' | 'doc' | 'csv' | 'md';

const FILE_TYPE_FILTERS: { value: FileTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'pdf', label: 'PDF' },
  { value: 'txt', label: 'Text' },
  { value: 'doc', label: 'Word' },
  { value: 'csv', label: 'CSV' },
  { value: 'md', label: 'Markdown' },
];

export default function KBSearchPanel({
  onSearch,
  categories,
  isDark,
  colors,
  isMobile,
  onResultClick,
}: KBSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (recentRef.current && !recentRef.current.contains(e.target as Node)) {
        setShowRecent(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      setShowRecent(false);
      setHasSearched(true);
      try {
        const category = selectedCategory !== 'all' ? selectedCategory : undefined;
        const res = await onSearch(query, category);
        let filtered = res;
        if (fileTypeFilter !== 'all') {
          filtered = filtered.filter((r) =>
            r.filename.toLowerCase().endsWith(`.${fileTypeFilter}`)
          );
        }
        if (activeTags.length > 0) {
          filtered = filtered.filter((r) =>
            activeTags.some(
              (tag) =>
                r.filename.toLowerCase().includes(tag.toLowerCase()) ||
                r.content.toLowerCase().includes(tag.toLowerCase())
            )
          );
        }
        if (sortBy === 'filename') {
          filtered.sort((a, b) => a.filename.localeCompare(b.filename));
        }
        setResults(filtered);
        setRecentSearches((prev) => {
          const updated = [query, ...prev.filter((s) => s !== query)].slice(0, 8);
          return updated;
        });
      } catch {
        // handled upstream
      } finally {
        setSearching(false);
      }
    },
    [query, selectedCategory, onSearch, fileTypeFilter, activeTags, sortBy]
  );

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (fileTypeFilter !== 'all' ? 1 : 0) +
    activeTags.length;

  const getRelevanceBadge = (score: number) => {
    if (score > 0.8) return { label: 'Excellent', bg: 'rgba(34,197,94,0.1)', color: '#22c55e' };
    if (score > 0.6) return { label: 'Good', bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' };
    if (score > 0.4) return { label: 'Fair', bg: 'rgba(254,192,15,0.1)', color: '#FEC00F' };
    return { label: 'Low', bg: 'rgba(156,163,175,0.1)', color: '#9ca3af' };
  };

  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Search Header */}
      <div
        style={{
          padding: isMobile ? '20px 16px' : '24px',
          borderBottom: results.length > 0 || hasSearched ? `1px solid ${colors.border}` : 'none',
        }}
      >
        {/* Title Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: `${colors.accent}14`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Search size={16} color={colors.accent} />
            </div>
            <div>
              <h3
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '15px',
                  fontWeight: 700,
                  color: colors.text,
                  letterSpacing: '1px',
                  margin: 0,
                }}
              >
                SEARCH KNOWLEDGE BASE
              </h3>
              <p style={{ color: colors.textMuted, fontSize: '11px', margin: '2px 0 0 0' }}>
                Find documents, topics, and insights
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: `1px solid ${showFilters || activeFilterCount > 0 ? colors.accent : colors.border}`,
              backgroundColor: showFilters || activeFilterCount > 0 ? `${colors.accent}14` : 'transparent',
              color: showFilters || activeFilterCount > 0 ? colors.accent : colors.textMuted,
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: '0.5px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            <SlidersHorizontal size={14} />
            FILTERS
            {activeFilterCount > 0 && (
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: colors.accent,
                  color: '#212121',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch}>
          <div style={{ position: 'relative' }} ref={recentRef}>
            <Search
              size={18}
              color={colors.textMuted}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
              }}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => recentSearches.length > 0 && setShowRecent(true)}
              placeholder="Search documents, topics, keywords..."
              style={{
                width: '100%',
                height: '48px',
                paddingLeft: '44px',
                paddingRight: query ? '110px' : '16px',
                backgroundColor: colors.inputBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: "'Quicksand', sans-serif",
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowRecent(false);
                  inputRef.current?.blur();
                }
              }}
            />
            {query && (
              <div
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  gap: '4px',
                }}
              >
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.textMuted,
                  }}
                >
                  <X size={16} />
                </button>
                <button
                  type="submit"
                  disabled={searching}
                  style={{
                    height: '32px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: colors.accent,
                    color: '#212121',
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '0.5px',
                    cursor: searching ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {searching ? (
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    'SEARCH'
                  )}
                </button>
              </div>
            )}

            {/* Recent Searches Dropdown */}
            {showRecent && recentSearches.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: colors.textMuted,
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.5px',
                    }}
                  >
                    RECENT SEARCHES
                  </span>
                  <button
                    onClick={() => {
                      setRecentSearches([]);
                      setShowRecent(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.textMuted,
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    Clear All
                  </button>
                </div>
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(term);
                      setShowRecent(false);
                      setTimeout(() => handleSearch(), 0);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: colors.text,
                      fontSize: '13px',
                      textAlign: 'left',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = colors.hoverBg)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <Clock size={13} color={colors.textMuted} />
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div
            style={{
              marginTop: '16px',
              padding: '18px',
              backgroundColor: isDark ? '#161616' : '#FAFAFA',
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Category Filter */}
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: colors.textMuted,
                  marginBottom: '8px',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Tag size={11} />
                CATEGORY
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${
                        selectedCategory === cat ? colors.accent : colors.border
                      }`,
                      backgroundColor:
                        selectedCategory === cat ? `${colors.accent}14` : 'transparent',
                      color: selectedCategory === cat ? colors.accent : colors.textMuted,
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.3px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase',
                    }}
                  >
                    {cat === 'all' ? 'All Categories' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* File Type Filter */}
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: colors.textMuted,
                  marginBottom: '8px',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FileText size={11} />
                FILE TYPE
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {FILE_TYPE_FILTERS.map((ft) => (
                  <button
                    key={ft.value}
                    onClick={() => setFileTypeFilter(ft.value)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${
                        fileTypeFilter === ft.value ? '#3b82f6' : colors.border
                      }`,
                      backgroundColor:
                        fileTypeFilter === ft.value ? 'rgba(59,130,246,0.1)' : 'transparent',
                      color: fileTypeFilter === ft.value ? '#3b82f6' : colors.textMuted,
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.3px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {ft.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: colors.textMuted,
                  marginBottom: '8px',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={11} />
                SORT RESULTS BY
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { value: 'relevance' as SortOption, label: 'Relevance' },
                  { value: 'newest' as SortOption, label: 'Newest' },
                  { value: 'filename' as SortOption, label: 'Name' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${
                        sortBy === opt.value ? '#22c55e' : colors.border
                      }`,
                      backgroundColor:
                        sortBy === opt.value ? 'rgba(34,197,94,0.1)' : 'transparent',
                      color: sortBy === opt.value ? '#22c55e' : colors.textMuted,
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.3px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Inputs */}
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: colors.textMuted,
                  marginBottom: '8px',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Tag size={11} />
                KEYWORD TAGS
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                {activeTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: `${colors.accent}14`,
                      color: colors.accent,
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: "'Rajdhani', sans-serif",
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => toggleTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: colors.accent,
                        padding: '0',
                        display: 'flex',
                      }}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={activeTags.length === 0 ? 'Add tags to narrow results...' : 'Add tag...'}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    height: '30px',
                    padding: '0 10px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    color: colors.text,
                    fontSize: '12px',
                    fontFamily: "'Quicksand', sans-serif",
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !activeTags.includes(val)) {
                        toggleTag(val);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setFileTypeFilter('all');
                  setSortBy('relevance');
                  setActiveTags([]);
                }}
                style={{
                  alignSelf: 'flex-start',
                  padding: '5px 14px',
                  borderRadius: '6px',
                  border: `1px solid rgba(220,38,38,0.3)`,
                  backgroundColor: 'rgba(220,38,38,0.06)',
                  color: '#DC2626',
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.3px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <X size={10} />
                CLEAR ALL FILTERS
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div>
          <div
            style={{
              padding: '12px 24px',
              borderBottom: results.length > 0 ? `1px solid ${colors.border}` : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: colors.textMuted, fontSize: '12px', fontWeight: 600 }}>
              {results.length} result{results.length !== 1 ? 's' : ''} found
              {selectedCategory !== 'all' && (
                <span style={{ marginLeft: '6px', color: colors.accent }}>
                  in {selectedCategory}
                </span>
              )}
            </span>
            {activeTags.length > 0 && (
              <div style={{ display: 'flex', gap: '4px' }}>
                {activeTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: `${colors.accent}14`,
                      color: colors.accent,
                      fontWeight: 600,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {results.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
              }}
            >
              <Search
                size={36}
                color={colors.textMuted}
                style={{ opacity: 0.3, marginBottom: '12px' }}
              />
              <p style={{ color: colors.textMuted, fontSize: '14px', margin: '0 0 4px 0' }}>
                No results found for &ldquo;{query}&rdquo;
              </p>
              <p style={{ color: colors.textMuted, fontSize: '12px', margin: 0, opacity: 0.7 }}>
                Try different keywords or adjust your filters
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: '440px', overflow: 'auto' }}>
              {results.map((result, idx) => {
                const badge = getRelevanceBadge(result.relevance_score);
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '16px 24px',
                      borderBottom:
                        idx < results.length - 1
                          ? `1px solid ${colors.border}`
                          : 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                    onClick={() => {
                      if (onResultClick) {
                        onResultClick(result);
                      } else {
                        setExpandedResult(expandedResult === idx ? null : idx);
                      }
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = colors.hoverBg)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <FileText size={16} color={colors.accent} />
                        </div>
                        <span
                          style={{
                            color: colors.text,
                            fontSize: '14px',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {result.filename}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            fontWeight: 700,
                            fontFamily: "'Rajdhani', sans-serif",
                            letterSpacing: '0.3px',
                          }}
                        >
                          {badge.label} ({(result.relevance_score * 100).toFixed(0)}%)
                        </span>
                        <ChevronDown
                          size={14}
                          color={colors.textMuted}
                          style={{
                            transition: 'transform 0.2s',
                            transform:
                              expandedResult === idx
                                ? 'rotate(180deg)'
                                : 'rotate(0deg)',
                          }}
                        />
                      </div>
                    </div>
                    {/* Content preview */}
                    <p
                      style={{
                        color: isDark ? '#B0B0B0' : '#666',
                        fontSize: '13px',
                        lineHeight: 1.7,
                        margin: '0 0 0 42px',
                        display: expandedResult === idx ? 'block' : '-webkit-box',
                        WebkitLineClamp: expandedResult === idx ? undefined : 2,
                        WebkitBoxOrient:
                          expandedResult === idx ? undefined : ('vertical' as const),
                        overflow: expandedResult === idx ? 'visible' : 'hidden',
                      }}
                    >
                      {result.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
