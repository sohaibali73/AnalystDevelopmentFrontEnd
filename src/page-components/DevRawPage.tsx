'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/env'
import { storage } from '@/lib/storage'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Role = 'user' | 'assistant'

interface Msg {
  role: Role
  content: string
}

interface UsageInfo {
  input_tokens: number
  output_tokens: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MODELS = [
  'claude-opus-4-7',
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'claude-opus-4-5',
  'claude-sonnet-4-5',
  'claude-haiku-4-5-20251001',
]

const ENDPOINT = '/chat/dev/raw'

// ─── Page ──────────────────────────────────────────────────────────────────────

export function DevRawPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [model, setModel] = useState(MODELS[0])
  const [maxTokens, setMaxTokens] = useState(4096)
  const [temperature, setTemperature] = useState<string>('')
  const [topP, setTopP] = useState<string>('')
  const [streaming, setStreaming] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUsage, setLastUsage] = useState<UsageInfo | null>(null)
  const [stopReason, setStopReason] = useState<string | null>(null)
  const [streamMs, setStreamMs] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  // Auth gate — pull token from storage; bounce to /login if missing.
  useEffect(() => {
    const t = storage.getItem('auth_token')
    if (!t) {
      router.replace('/login')
      return
    }
    setToken(t)
  }, [router])

  // Auto-scroll to bottom as content streams in.
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight
    }
  }, [messages])

  const send = useCallback(async () => {
    if (!input.trim() || busy || !token) return
    setError(null)
    setLastUsage(null)
    setStopReason(null)
    setStreamMs(null)

    const next: Msg[] = [...messages, { role: 'user', content: input }]
    setMessages(next)
    setInput('')
    setBusy(true)

    const body: Record<string, unknown> = {
      messages: next,
      model,
      max_tokens: maxTokens,
      stream: streaming,
    }
    if (temperature.trim() !== '') body.temperature = Number(temperature)
    if (topP.trim() !== '') body.top_p = Number(topP)

    const ctrl = new AbortController()
    abortRef.current = ctrl
    const t0 = performance.now()

    try {
      const res = await fetch(`${getApiUrl()}${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText)
        throw new Error(`HTTP ${res.status}: ${txt.slice(0, 400)}`)
      }

      if (streaming && res.body) {
        // Add an empty assistant message we will append to as bytes arrive.
        setMessages((m) => [...m, { role: 'assistant', content: '' }])
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          setMessages((m) => {
            const copy = [...m]
            copy[copy.length - 1] = { role: 'assistant', content: buf }
            return copy
          })
        }
      } else {
        const json = await res.json()
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: json.content || '' },
        ])
        if (json.usage) setLastUsage(json.usage)
        if (json.stop_reason) setStopReason(json.stop_reason)
      }
      setStreamMs(Math.round(performance.now() - t0))
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        setError('aborted')
      } else {
        setError((e as Error).message || String(e))
      }
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }, [busy, input, maxTokens, messages, model, streaming, temperature, token, topP])

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    setMessages([])
    setError(null)
    setLastUsage(null)
    setStopReason(null)
    setStreamMs(null)
    setInput('')
  }, [])

  const popLast = useCallback(() => {
    setMessages((m) => m.slice(0, -1))
  }, [])

  // ─── Styles (inline, terminal aesthetic) ────────────────────────────────────
  const styles = {
    root: {
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#e4e4e4',
      fontFamily:
        'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      borderBottom: '1px solid #1f1f1f',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      background: '#0d0d0d',
      flexWrap: 'wrap' as const,
    },
    title: {
      fontSize: '12px',
      letterSpacing: '2px',
      color: '#ff6b6b',
      fontWeight: 700,
    },
    badge: {
      fontSize: '10px',
      padding: '2px 8px',
      border: '1px solid #ff6b6b',
      color: '#ff6b6b',
      borderRadius: '2px',
      letterSpacing: '1px',
    },
    label: { fontSize: '10px', color: '#888', letterSpacing: '1px' },
    input: {
      background: '#0a0a0a',
      border: '1px solid #2a2a2a',
      color: '#e4e4e4',
      padding: '4px 8px',
      fontSize: '12px',
      fontFamily: 'inherit',
      outline: 'none',
      borderRadius: '2px',
    },
    select: {
      background: '#0a0a0a',
      border: '1px solid #2a2a2a',
      color: '#e4e4e4',
      padding: '4px 8px',
      fontSize: '12px',
      fontFamily: 'inherit',
      outline: 'none',
      borderRadius: '2px',
    },
    btn: {
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      color: '#e4e4e4',
      padding: '6px 14px',
      fontSize: '11px',
      letterSpacing: '1px',
      fontFamily: 'inherit',
      cursor: 'pointer',
      borderRadius: '2px',
    },
    btnPrimary: {
      background: '#ff6b6b',
      border: '1px solid #ff6b6b',
      color: '#0a0a0a',
      padding: '6px 14px',
      fontSize: '11px',
      letterSpacing: '1px',
      fontFamily: 'inherit',
      cursor: 'pointer',
      borderRadius: '2px',
      fontWeight: 700,
    },
    scroller: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '20px',
    },
    msg: (role: Role) => ({
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-word' as const,
      marginBottom: '16px',
      padding: '12px 14px',
      borderRadius: '4px',
      borderLeft: `2px solid ${role === 'user' ? '#5eead4' : '#ff6b6b'}`,
      background: role === 'user' ? '#0f1a18' : '#1a0f0f',
      fontSize: '13px',
      lineHeight: 1.55,
    }),
    roleTag: (role: Role) => ({
      fontSize: '10px',
      letterSpacing: '2px',
      color: role === 'user' ? '#5eead4' : '#ff6b6b',
      marginBottom: '6px',
      fontWeight: 700,
    }),
    composer: {
      borderTop: '1px solid #1f1f1f',
      padding: '12px 20px',
      background: '#0d0d0d',
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-end',
    },
    textarea: {
      flex: 1,
      minHeight: '60px',
      maxHeight: '240px',
      background: '#0a0a0a',
      border: '1px solid #2a2a2a',
      color: '#e4e4e4',
      padding: '8px 10px',
      fontSize: '13px',
      fontFamily: 'inherit',
      outline: 'none',
      borderRadius: '2px',
      resize: 'vertical' as const,
    },
    statusBar: {
      borderTop: '1px solid #1f1f1f',
      padding: '6px 20px',
      background: '#0a0a0a',
      fontSize: '10px',
      color: '#666',
      letterSpacing: '1px',
      display: 'flex',
      gap: '20px',
      flexWrap: 'wrap' as const,
    },
  }

  if (!token) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0a',
          color: '#666',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '12px',
        }}
      >
        verifying auth…
      </div>
    )
  }

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.title}>DEV/RAW</div>
        <span style={styles.badge}>NO SYSTEM PROMPT</span>

        <span style={styles.label}>MODEL</span>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={styles.select}
          disabled={busy}
        >
          {MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <span style={styles.label}>MAX_TOK</span>
        <input
          type="number"
          value={maxTokens}
          onChange={(e) => setMaxTokens(Number(e.target.value) || 0)}
          style={{ ...styles.input, width: 80 }}
          disabled={busy}
        />

        <span style={styles.label}>TEMP</span>
        <input
          type="text"
          value={temperature}
          placeholder="default"
          onChange={(e) => setTemperature(e.target.value)}
          style={{ ...styles.input, width: 70 }}
          disabled={busy}
        />

        <span style={styles.label}>TOP_P</span>
        <input
          type="text"
          value={topP}
          placeholder="default"
          onChange={(e) => setTopP(e.target.value)}
          style={{ ...styles.input, width: 70 }}
          disabled={busy}
        />

        <label
          style={{
            ...styles.label,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={streaming}
            onChange={(e) => setStreaming(e.target.checked)}
            disabled={busy}
          />
          STREAM
        </label>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={popLast} style={styles.btn} disabled={busy || messages.length === 0}>
            POP
          </button>
          <button onClick={reset} style={styles.btn} disabled={busy}>
            CLEAR
          </button>
        </div>
      </div>

      <div ref={scrollerRef} style={styles.scroller}>
        {messages.length === 0 && (
          <div style={{ color: '#444', fontSize: 12, textAlign: 'center', marginTop: 60 }}>
            POST {ENDPOINT} — raw Claude, no system prompt, no tools, not persisted.
            <br />
            type below to begin.
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={styles.msg(m.role)}>
            <div style={styles.roleTag(m.role)}>{m.role.toUpperCase()}</div>
            {m.content || (busy && i === messages.length - 1 ? '▌' : '')}
          </div>
        ))}

        {error && (
          <div
            style={{
              ...styles.msg('assistant'),
              borderLeft: '2px solid #fbbf24',
              background: '#1a1408',
              color: '#fbbf24',
            }}
          >
            <div style={{ ...styles.roleTag('assistant'), color: '#fbbf24' }}>ERROR</div>
            {error}
          </div>
        )}
      </div>

      <div style={styles.composer}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="user message…  (Ctrl/Cmd+Enter to send)"
          style={styles.textarea}
          disabled={busy}
        />
        {busy ? (
          <button onClick={stop} style={styles.btn}>
            STOP
          </button>
        ) : (
          <button onClick={send} style={styles.btnPrimary} disabled={!input.trim()}>
            SEND
          </button>
        )}
      </div>

      <div style={styles.statusBar}>
        <span>turns: {messages.length}</span>
        {streamMs !== null && <span>{streamMs}ms</span>}
        {lastUsage && (
          <span>
            in: {lastUsage.input_tokens} · out: {lastUsage.output_tokens}
          </span>
        )}
        {stopReason && <span>stop: {stopReason}</span>}
        <span style={{ marginLeft: 'auto' }}>endpoint: {ENDPOINT}</span>
      </div>
    </div>
  )
}

export default DevRawPage
