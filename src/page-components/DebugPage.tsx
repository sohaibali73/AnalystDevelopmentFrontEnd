'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Bug,
  RefreshCw,
  Trash2,
  Download,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Clock,
  Cpu,
  Layers,
  Terminal,
  Scissors,
  Eye,
  EyeOff,
  Database,
  Zap,
} from 'lucide-react'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TranscriptMeta {
  request_id: string
  user_id: string
  conversation_id: string
  started_at: string
  finished_at: string
  duration_ms: number
  model: string
  event_count: number
  has_error: boolean
  json_path: string
  txt_path: string
}

type ViewTab = 'text' | 'json'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function shortId(id: string): string {
  return id.length > 24 ? id.substring(0, 24) + '…' : id
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '1px',
        fontFamily: "'Rajdhani', sans-serif",
        backgroundColor: enabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        border: `1px solid ${enabled ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
        color: enabled ? '#22C55E' : '#EF4444',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: enabled ? '#22C55E' : '#EF4444',
          boxShadow: enabled ? '0 0 6px rgba(34, 197, 94, 0.8)' : '0 0 6px rgba(239, 68, 68, 0.8)',
        }}
      />
      {enabled ? 'ENABLED' : 'DISABLED'}
    </span>
  )
}

// ─── Error Badge ──────────────────────────────────────────────────────────────

function ErrorBadge({ hasError }: { hasError: boolean }) {
  if (!hasError) return null
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '10px',
        fontWeight: 700,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        color: '#EF4444',
        flexShrink: 0,
      }}
    >
      <AlertTriangle size={9} />
      ERR
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DebugPage() {
  // Status
  const [statusEnabled, setStatusEnabled] = useState<boolean | null>(null)
  const [storageRoot, setStorageRoot] = useState<string>('')
  const [statusLoading, setStatusLoading] = useState(true)
  const [statusError, setStatusError] = useState<string | null>(null)

  // Filters
  const [filterUserId, setFilterUserId] = useState('')
  const [filterConvId, setFilterConvId] = useState('')
  const [filterLimit, setFilterLimit] = useState(50)

  // Transcript list
  const [transcripts, setTranscripts] = useState<TranscriptMeta[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  // Selected transcript
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewTab, setViewTab] = useState<ViewTab>('text')
  const [transcriptText, setTranscriptText] = useState<string>('')
  const [transcriptJson, setTranscriptJson] = useState<any>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState<string | null>(null)

  // Search within viewer
  const [searchQuery, setSearchQuery] = useState('')

  // Copy feedback
  const [copied, setCopied] = useState(false)

  // Prune dialog
  const [pruneOpen, setPruneOpen] = useState(false)
  const [pruneDays, setPruneDays] = useState(7)
  const [pruneLoading, setPruneLoading] = useState(false)

  // Delete all dialog
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [deleteAllLoading, setDeleteAllLoading] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setToast(null), 3500)
  }, [])

  // ── Load status ────────────────────────────────────────────────────────────

  const loadStatus = useCallback(async () => {
    setStatusLoading(true)
    setStatusError(null)
    try {
      const res = await api.debug.getStatus()
      setStatusEnabled(res.enabled)
      setStorageRoot(res.storage_root)
    } catch (e: any) {
      setStatusError(e?.message ?? 'Failed to load status')
      setStatusEnabled(false)
    } finally {
      setStatusLoading(false)
    }
  }, [])

  // ── Load transcripts ──────────────────────────────────────────────────────

  const loadTranscripts = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    try {
      const params: { user_id?: string; conversation_id?: string; limit?: number } = { limit: filterLimit }
      if (filterUserId.trim()) params.user_id = filterUserId.trim()
      if (filterConvId.trim()) params.conversation_id = filterConvId.trim()
      const res = await api.debug.listTranscripts(params)
      setTranscripts(res.transcripts)
    } catch (e: any) {
      setListError(e?.message ?? 'Failed to load transcripts')
    } finally {
      setListLoading(false)
    }
  }, [filterUserId, filterConvId, filterLimit])

  // ── Select transcript ─────────────────────────────────────────────────────

  const selectTranscript = useCallback(async (id: string) => {
    setSelectedId(id)
    setViewError(null)
    setTranscriptText('')
    setTranscriptJson(null)
    setSearchQuery('')
    setViewLoading(true)
    try {
      const [text, json] = await Promise.all([
        api.debug.getTranscriptText(id),
        api.debug.getTranscript(id),
      ])
      setTranscriptText(text)
      setTranscriptJson(json)
    } catch (e: any) {
      setViewError(e?.message ?? 'Failed to load transcript')
    } finally {
      setViewLoading(false)
    }
  }, [])

  // ── Delete one ────────────────────────────────────────────────────────────

  const deleteOne = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete transcript ${shortId(id)}?`)) return
    try {
      await api.debug.deleteTranscript(id)
      setTranscripts(prev => prev.filter(t => t.request_id !== id))
      if (selectedId === id) {
        setSelectedId(null)
        setTranscriptText('')
        setTranscriptJson(null)
      }
      showToast('Transcript deleted')
    } catch (e: any) {
      showToast(e?.message ?? 'Delete failed', 'error')
    }
  }, [selectedId, showToast])

  // ── Download one ──────────────────────────────────────────────────────────

  const downloadOne = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.debug.download(id)
      showToast('Download started')
    } catch (e: any) {
      showToast(e?.message ?? 'Download failed', 'error')
    }
  }, [showToast])

  // ── Delete all ────────────────────────────────────────────────────────────

  const deleteAll = useCallback(async () => {
    setDeleteAllLoading(true)
    try {
      const params: { user_id?: string; conversation_id?: string } = {}
      if (filterUserId.trim()) params.user_id = filterUserId.trim()
      if (filterConvId.trim()) params.conversation_id = filterConvId.trim()
      const res = await api.debug.deleteAll(params)
      showToast(`Deleted ${res.deleted} transcript(s)`)
      setTranscripts([])
      setSelectedId(null)
      setTranscriptText('')
      setTranscriptJson(null)
      setDeleteAllOpen(false)
    } catch (e: any) {
      showToast(e?.message ?? 'Delete failed', 'error')
    } finally {
      setDeleteAllLoading(false)
    }
  }, [filterUserId, filterConvId, showToast])

  // ── Prune ─────────────────────────────────────────────────────────────────

  const prune = useCallback(async () => {
    setPruneLoading(true)
    try {
      const res = await api.debug.prune(pruneDays)
      showToast(`Pruned ${res.deleted} transcript(s) older than ${pruneDays} days`)
      setPruneOpen(false)
      loadTranscripts()
    } catch (e: any) {
      showToast(e?.message ?? 'Prune failed', 'error')
    } finally {
      setPruneLoading(false)
    }
  }, [pruneDays, showToast, loadTranscripts])

  // ── Copy to clipboard ─────────────────────────────────────────────────────

  const copyToClipboard = useCallback(() => {
    const content = viewTab === 'text' ? transcriptText : JSON.stringify(transcriptJson, null, 2)
    if (!content) return
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [viewTab, transcriptText, transcriptJson])

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  useEffect(() => {
    loadTranscripts()
  }, []) // load on mount only; refresh via button

  // ── Filtered text for search highlighting ────────────────────────────────

  const highlightedText = useCallback((): React.ReactNode => {
    if (!transcriptText) return null
    if (!searchQuery.trim()) return transcriptText

    const parts = transcriptText.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} style={{ backgroundColor: 'rgba(254, 192, 15, 0.35)', color: '#fff', borderRadius: '2px' }}>
          {part}
        </mark>
      ) : (
        part
      )
    )
  }, [transcriptText, searchQuery])

  const selectedMeta = selectedId ? transcripts.find(t => t.request_id === selectedId) : null

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0A0B',
        color: '#E8E8E8',
        fontFamily: "'Rajdhani', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            backgroundColor: toast.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
            color: toast.type === 'success' ? '#22C55E' : '#EF4444',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {toast.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          padding: '24px 32px 16px',
          borderBottom: '1px solid rgba(212, 169, 68, 0.1)',
          background: 'rgba(212, 169, 68, 0.03)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'rgba(254, 192, 15, 0.1)',
                border: '1px solid rgba(254, 192, 15, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bug size={20} color="#FEC00F" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '2px', color: '#fff' }}>
                DEBUG TRANSCRIPTS
              </h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', letterSpacing: '0.5px', marginTop: '2px' }}>
                Inspect backend request traces
              </p>
            </div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {statusLoading ? (
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Checking…</span>
            ) : statusError ? (
              <span style={{ fontSize: '11px', color: '#EF4444' }}>{statusError}</span>
            ) : (
              <>
                <StatusBadge enabled={statusEnabled ?? false} />
                {storageRoot && (
                  <span style={{ fontSize: '10px', color: '#6B7280', fontFamily: 'monospace' }}>{storageRoot}</span>
                )}
              </>
            )}

            <button
              onClick={() => { loadStatus(); loadTranscripts() }}
              style={btnStyle}
              onMouseEnter={btnHover}
              onMouseLeave={btnLeave}
              title="Refresh"
            >
              <RefreshCw size={14} />
              REFRESH
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <FilterInput
            label="USER ID"
            placeholder="filter by user_id"
            value={filterUserId}
            onChange={setFilterUserId}
          />
          <FilterInput
            label="CONVERSATION ID"
            placeholder="filter by conversation_id"
            value={filterConvId}
            onChange={setFilterConvId}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '9px', color: '#6B7280', fontWeight: 700, letterSpacing: '1px' }}>LIMIT</span>
            <select
              value={filterLimit}
              onChange={e => setFilterLimit(Number(e.target.value))}
              style={selectStyle}
            >
              {[10, 20, 50, 100, 200].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <button
            onClick={loadTranscripts}
            style={{ ...btnStyle, alignSelf: 'flex-end' }}
            onMouseEnter={btnHover}
            onMouseLeave={btnLeave}
          >
            <Filter size={13} />
            APPLY
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
            <button
              onClick={() => setPruneOpen(true)}
              style={{ ...btnStyle, ...btnWarning }}
              onMouseEnter={btnWarnHover}
              onMouseLeave={btnWarnLeave}
            >
              <Scissors size={13} />
              PRUNE
            </button>
            <button
              onClick={() => setDeleteAllOpen(true)}
              style={{ ...btnStyle, ...btnDanger }}
              onMouseEnter={btnDangerHover}
              onMouseLeave={btnDangerLeave}
            >
              <Trash2 size={13} />
              DELETE ALL
            </button>
          </div>
        </div>
      </div>

      {/* Body — two panes */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* ── Left pane: transcript list ── */}
        <div
          style={{
            width: '380px',
            minWidth: '280px',
            borderRight: '1px solid rgba(212, 169, 68, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {/* List header */}
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '1px' }}>
              TRANSCRIPTS
            </span>
            <span
              style={{
                fontSize: '10px',
                color: '#FEC00F',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '8px',
                backgroundColor: 'rgba(254, 192, 15, 0.1)',
                border: '1px solid rgba(254, 192, 15, 0.2)',
              }}
            >
              {transcripts.length}
            </span>
          </div>

          {/* List content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {listLoading && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                Loading…
              </div>
            )}
            {listError && (
              <div
                style={{
                  margin: '8px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  fontSize: '12px',
                }}
              >
                {listError}
              </div>
            )}
            {!listLoading && !listError && transcripts.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#4B5563', fontSize: '13px' }}>
                No transcripts found
              </div>
            )}
            {transcripts.map(t => (
              <TranscriptRow
                key={t.request_id}
                t={t}
                isSelected={t.request_id === selectedId}
                onClick={() => selectTranscript(t.request_id)}
                onDelete={deleteOne}
                onDownload={downloadOne}
              />
            ))}
          </div>
        </div>

        {/* ── Right pane: viewer ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {selectedId ? (
            <>
              {/* Viewer header */}
              <div
                style={{
                  padding: '10px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                  flexShrink: 0,
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {/* Meta info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        color: '#FEC00F',
                        backgroundColor: 'rgba(254, 192, 15, 0.08)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(254, 192, 15, 0.2)',
                      }}
                    >
                      {shortId(selectedId)}
                    </span>
                    {selectedMeta && (
                      <>
                        <span style={{ fontSize: '10px', color: '#6B7280' }}>
                          {fmtDate(selectedMeta.started_at)}
                        </span>
                        <span style={{ fontSize: '10px', color: '#9CA3AF' }}>
                          {selectedMeta.model}
                        </span>
                        <span style={{ fontSize: '10px', color: '#FEC00F' }}>
                          {fmt(selectedMeta.duration_ms)}
                        </span>
                        <span style={{ fontSize: '10px', color: '#6B7280' }}>
                          {selectedMeta.event_count} events
                        </span>
                        <ErrorBadge hasError={selectedMeta.has_error} />
                      </>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  {(['text', 'json'] as ViewTab[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setViewTab(tab)}
                      style={{
                        padding: '5px 14px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: "'Rajdhani', sans-serif",
                        letterSpacing: '0.5px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: viewTab === tab ? 'rgba(254, 192, 15, 0.15)' : 'transparent',
                        border: viewTab === tab ? '1px solid rgba(254, 192, 15, 0.35)' : '1px solid rgba(255,255,255,0.08)',
                        color: viewTab === tab ? '#FEC00F' : '#6B7280',
                      }}
                    >
                      {tab === 'text' ? <><Terminal size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />TEXT</> : <><Database size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />JSON</>}
                    </button>
                  ))}
                </div>

                {/* Search box */}
                {viewTab === 'text' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#1A1A1A',
                      border: '1px solid rgba(255,255,255,0.08)',
                      flexShrink: 0,
                    }}
                  >
                    <Search size={11} color="#6B7280" />
                    <input
                      type="text"
                      placeholder="Search…"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#E8E8E8',
                        fontSize: '11px',
                        width: '120px',
                        fontFamily: "'Rajdhani', sans-serif",
                      }}
                    />
                  </div>
                )}

                {/* Actions */}
                <button
                  onClick={copyToClipboard}
                  style={{ ...btnStyle, flexShrink: 0 }}
                  onMouseEnter={btnHover}
                  onMouseLeave={btnLeave}
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={13} color="#22C55E" /> : <Copy size={13} />}
                  {copied ? 'COPIED' : 'COPY'}
                </button>
                <button
                  onClick={e => downloadOne(selectedId, e)}
                  style={{ ...btnStyle, flexShrink: 0 }}
                  onMouseEnter={btnHover}
                  onMouseLeave={btnLeave}
                  title="Download .txt"
                >
                  <Download size={13} />
                  DOWNLOAD
                </button>
              </div>

              {/* Viewer body */}
              <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', minHeight: 0 }}>
                {viewLoading && (
                  <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '13px', padding: '40px' }}>
                    Loading transcript…
                  </div>
                )}
                {viewError && (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#EF4444',
                      fontSize: '12px',
                    }}
                  >
                    {viewError}
                  </div>
                )}
                {!viewLoading && !viewError && viewTab === 'text' && (
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                      fontSize: '12px',
                      lineHeight: 1.7,
                      color: '#D4D4D4',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {highlightedText()}
                  </pre>
                )}
                {!viewLoading && !viewError && viewTab === 'json' && transcriptJson && (
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                      fontSize: '12px',
                      lineHeight: 1.7,
                      color: '#D4D4D4',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {JSON.stringify(transcriptJson, null, 2)}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4B5563',
                gap: '12px',
              }}
            >
              <Bug size={48} color="#2A2A2A" />
              <span style={{ fontSize: '14px', letterSpacing: '1px' }}>SELECT A TRANSCRIPT TO VIEW</span>
              <span style={{ fontSize: '11px', color: '#374151' }}>Click any row on the left</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Prune dialog ── */}
      {pruneOpen && (
        <DialogOverlay onClose={() => !pruneLoading && setPruneOpen(false)}>
          <div style={dialogStyle}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, letterSpacing: '1px', color: '#fff' }}>
              PRUNE OLD TRANSCRIPTS
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#9CA3AF', lineHeight: 1.5 }}>
              Delete all transcripts older than the specified number of days.
            </p>
            <label style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 700, letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
              MAX AGE (DAYS)
            </label>
            <input
              type="number"
              min={1}
              value={pruneDays}
              onChange={e => setPruneDays(Number(e.target.value))}
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => setPruneOpen(false)} style={{ ...btnStyle, ...btnGhost }} onMouseEnter={btnGhostHover} onMouseLeave={btnGhostLeave}>
                CANCEL
              </button>
              <button
                onClick={prune}
                disabled={pruneLoading}
                style={{ ...btnStyle, ...btnWarning, opacity: pruneLoading ? 0.6 : 1 }}
                onMouseEnter={btnWarnHover}
                onMouseLeave={btnWarnLeave}
              >
                <Scissors size={13} />
                {pruneLoading ? 'PRUNING…' : 'PRUNE'}
              </button>
            </div>
          </div>
        </DialogOverlay>
      )}

      {/* ── Delete all dialog ── */}
      {deleteAllOpen && (
        <DialogOverlay onClose={() => !deleteAllLoading && setDeleteAllOpen(false)}>
          <div style={dialogStyle}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, letterSpacing: '1px', color: '#fff' }}>
              DELETE ALL TRANSCRIPTS
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#9CA3AF', lineHeight: 1.5 }}>
              {filterUserId || filterConvId
                ? `Delete all transcripts matching the current filters (user: ${filterUserId || 'any'}, conv: ${filterConvId || 'any'}).`
                : 'Delete ALL transcripts for ALL users. This cannot be undone.'}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteAllOpen(false)} style={{ ...btnStyle, ...btnGhost }} onMouseEnter={btnGhostHover} onMouseLeave={btnGhostLeave}>
                CANCEL
              </button>
              <button
                onClick={deleteAll}
                disabled={deleteAllLoading}
                style={{ ...btnStyle, ...btnDanger, opacity: deleteAllLoading ? 0.6 : 1 }}
                onMouseEnter={btnDangerHover}
                onMouseLeave={btnDangerLeave}
              >
                <Trash2 size={13} />
                {deleteAllLoading ? 'DELETING…' : 'DELETE ALL'}
              </button>
            </div>
          </div>
        </DialogOverlay>
      )}
    </div>
  )
}

// ─── TranscriptRow ─────────────────────────────────────────────────────────

function TranscriptRow({
  t,
  isSelected,
  onClick,
  onDelete,
  onDownload,
}: {
  t: TranscriptMeta
  isSelected: boolean
  onClick: () => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onDownload: (id: string, e: React.MouseEvent) => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 12px',
        borderRadius: '8px',
        marginBottom: '4px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        backgroundColor: isSelected
          ? 'rgba(254, 192, 15, 0.1)'
          : hovered
          ? 'rgba(255,255,255,0.04)'
          : 'transparent',
        border: isSelected
          ? '1px solid rgba(254, 192, 15, 0.3)'
          : hovered
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid transparent',
      }}
    >
      {/* Row top: request_id + error badge + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
        <span
          style={{
            flex: 1,
            fontSize: '10px',
            fontFamily: 'monospace',
            color: isSelected ? '#FEC00F' : '#9CA3AF',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {shortId(t.request_id)}
        </span>
        <ErrorBadge hasError={t.has_error} />
        {(hovered || isSelected) && (
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <IconBtn title="Download" onClick={e => onDownload(t.request_id, e)}>
              <Download size={11} />
            </IconBtn>
            <IconBtn title="Delete" onClick={e => onDelete(t.request_id, e)} danger>
              <Trash2 size={11} />
            </IconBtn>
          </div>
        )}
      </div>

      {/* Row meta */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <MetaChip icon={<Clock size={9} />} label={fmtDate(t.started_at)} />
        <MetaChip icon={<Zap size={9} />} label={fmt(t.duration_ms)} highlight />
        <MetaChip icon={<Cpu size={9} />} label={t.model} />
        <MetaChip icon={<Layers size={9} />} label={`${t.event_count} events`} />
      </div>

      {/* Conv ID */}
      <div style={{ marginTop: '4px', fontSize: '9px', color: '#4B5563', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        conv: {t.conversation_id}
      </div>
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function MetaChip({ icon, label, highlight }: { icon: React.ReactNode; label: string; highlight?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '9px',
        color: highlight ? '#FEC00F' : '#6B7280',
      }}
    >
      {icon}
      {label}
    </span>
  )
}

function IconBtn({
  children,
  title,
  onClick,
  danger,
}: {
  children: React.ReactNode
  title: string
  onClick: (e: React.MouseEvent) => void
  danger?: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '22px',
        height: '22px',
        borderRadius: '5px',
        border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
        backgroundColor: hov
          ? danger
            ? 'rgba(239,68,68,0.2)'
            : 'rgba(255,255,255,0.08)'
          : 'transparent',
        color: danger ? '#EF4444' : '#9CA3AF',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
        padding: 0,
      }}
    >
      {children}
    </button>
  )
}

function FilterInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '9px', color: '#6B7280', fontWeight: 700, letterSpacing: '1px' }}>{label}</span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  )
}

function DialogOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '7px 14px',
  borderRadius: '8px',
  fontSize: '11px',
  fontWeight: 700,
  fontFamily: "'Rajdhani', sans-serif",
  letterSpacing: '0.5px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: 'rgba(255,255,255,0.05)',
  color: '#9CA3AF',
}
const btnHover = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
  e.currentTarget.style.color = '#fff'
}
const btnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
  e.currentTarget.style.color = '#9CA3AF'
}
const btnWarning: React.CSSProperties = {
  border: '1px solid rgba(251, 191, 36, 0.3)',
  backgroundColor: 'rgba(251, 191, 36, 0.1)',
  color: '#FBBF24',
}
const btnWarnHover = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.2)'
  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)'
}
const btnWarnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.1)'
  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)'
}
const btnDanger: React.CSSProperties = {
  border: '1px solid rgba(239, 68, 68, 0.3)',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  color: '#EF4444',
}
const btnDangerHover = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'
  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
}
const btnDangerLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
}
const btnGhost: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.12)',
  backgroundColor: 'transparent',
  color: '#6B7280',
}
const btnGhostHover = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
  e.currentTarget.style.color = '#9CA3AF'
}
const btnGhostLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.backgroundColor = 'transparent'
  e.currentTarget.style.color = '#6B7280'
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: '#1A1A1A',
  color: '#E8E8E8',
  fontSize: '11px',
  fontFamily: "'Rajdhani', sans-serif",
  outline: 'none',
  width: '180px',
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: '#1A1A1A',
  color: '#E8E8E8',
  fontSize: '11px',
  fontFamily: "'Rajdhani', sans-serif",
  outline: 'none',
  cursor: 'pointer',
  width: '80px',
}

const dialogStyle: React.CSSProperties = {
  backgroundColor: '#161616',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  padding: '24px',
  width: '360px',
  maxWidth: '100%',
  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
}
