'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/env'
import { storage } from '@/lib/storage'

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────

type Role = 'user' | 'assistant'

interface Message {
  role: Role
  content: string
}

interface UsageInfo {
  input_tokens: number
  output_tokens: number
}

interface ChatResponse {
  content?: string
  usage?: UsageInfo
  stop_reason?: string
}

// ────────────────────────────────────────────────────────────────────────────────
// Config
// ────────────────────────────────────────────────────────────────────────────────

const ENDPOINT = '/chat/dev/raw'

const MODELS = [
  'claude-opus-4-7',
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'claude-opus-4-5',
  'claude-sonnet-4-5',
  'claude-haiku-4-5-20251001',
] as const

const DEFAULT_MODEL = MODELS[0]

// ────────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────────

export default function DevRawPage() {
  const router = useRouter()

  const [token, setToken] = useState<string | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  const [model, setModel] = useState(DEFAULT_MODEL)
  const [maxTokens, setMaxTokens] = useState(4096)

  const [temperature, setTemperature] = useState('')
  const [topP, setTopP] = useState('')

  const [stream, setStream] = useState(true)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [stopReason, setStopReason] = useState<string | null>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // ────────────────────────────────────────────────────────────────────────────
  // Auth
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const authToken = storage.getItem('auth_token')

    if (!authToken) {
      router.replace('/login')
      return
    }

    setToken(authToken)
  }, [router])

  // ────────────────────────────────────────────────────────────────────────────
  // Auto Scroll
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const el = scrollRef.current

    if (!el) return

    el.scrollTop = el.scrollHeight
  }, [messages])

  // ────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────────

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const updateLastAssistantMessage = useCallback((content: string) => {
    setMessages((prev) => {
      if (!prev.length) return prev

      const next = [...prev]

      next[next.length - 1] = {
        role: 'assistant',
        content,
      }

      return next
    })
  }, [])

  const resetState = useCallback(() => {
    setError(null)
    setUsage(null)
    setStopReason(null)
    setLatencyMs(null)
  }, [])

  // ────────────────────────────────────────────────────────────────────────────
  // Send
  // ────────────────────────────────────────────────────────────────────────────

  const send = useCallback(async () => {
    if (!input.trim() || !token || busy) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    }

    const nextMessages = [...messages, userMessage]

    appendMessage(userMessage)

    setInput('')
    setBusy(true)

    resetState()

    const body: Record<string, unknown> = {
      model,
      messages: nextMessages,
      max_tokens: maxTokens,
      stream,
    }

    if (temperature.trim()) {
      body.temperature = Number(temperature)
    }

    if (topP.trim()) {
      body.top_p = Number(topP)
    }

    const controller = new AbortController()

    abortRef.current = controller

    const startedAt = performance.now()

    try {
      const response = await fetch(`${getApiUrl()}${ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!response.ok) {
        const text = await response
          .text()
          .catch(() => response.statusText)

        throw new Error(`HTTP ${response.status}: ${text.slice(0, 400)}`)
      }

      // ────────────────────────────────────────────────────────────────────────
      // Streaming
      // ────────────────────────────────────────────────────────────────────────

      if (stream && response.body) {
        appendMessage({
          role: 'assistant',
          content: '',
        })

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          accumulated += decoder.decode(value, {
            stream: true,
          })

          updateLastAssistantMessage(accumulated)
        }
      } else {
        // ──────────────────────────────────────────────────────────────────────
        // JSON
        // ──────────────────────────────────────────────────────────────────────

        const json: ChatResponse = await response.json()

        appendMessage({
          role: 'assistant',
          content: json.content || '',
        })

        if (json.usage) {
          setUsage(json.usage)
        }

        if (json.stop_reason) {
          setStopReason(json.stop_reason)
        }
      }

      setLatencyMs(Math.round(performance.now() - startedAt))
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setError('request aborted')
      } else {
        setError((err as Error).message)
      }
    } finally {
      abortRef.current = null
      setBusy(false)
    }
  }, [
    appendMessage,
    busy,
    input,
    maxTokens,
    messages,
    model,
    resetState,
    stream,
    temperature,
    token,
    topP,
    updateLastAssistantMessage,
  ])

  // ────────────────────────────────────────────────────────────────────────────
  // Actions
  // ────────────────────────────────────────────────────────────────────────────

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clear = useCallback(() => {
    setMessages([])
    setInput('')
    resetState()
  }, [resetState])

  const pop = useCallback(() => {
    setMessages((prev) => prev.slice(0, -1))
  }, [])

  // ────────────────────────────────────────────────────────────────────────────
  // Derived
  // ────────────────────────────────────────────────────────────────────────────

  const statusText = useMemo(() => {
    if (busy) return 'streaming'
    if (error) return 'error'
    return 'idle'
  }, [busy, error])

  // ────────────────────────────────────────────────────────────────────────────
  // Loading Gate
  // ────────────────────────────────────────────────────────────────────────────

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-xs text-zinc-500">
        verifying auth...
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col bg-black text-zinc-100">
      {/* Header */}

      <header className="flex flex-wrap items-center gap-4 border-b border-zinc-900 bg-zinc-950 px-5 py-3">
        <div className="text-xs font-bold tracking-[0.3em] text-red-400">
          DEV/RAW
        </div>

        <div className="rounded border border-red-500 px-2 py-1 text-[10px] tracking-[0.2em] text-red-400">
          NO SYSTEM PROMPT
        </div>

        {/* Model */}

        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.2em] text-zinc-500">
            MODEL
          </span>

          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={busy}
            className="rounded border border-zinc-800 bg-black px-2 py-1 text-xs outline-none"
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Max Tokens */}

        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.2em] text-zinc-500">
            MAX TOK
          </span>

          <input
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value) || 0)}
            disabled={busy}
            className="w-20 rounded border border-zinc-800 bg-black px-2 py-1 text-xs outline-none"
          />
        </div>

        {/* Temp */}

        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.2em] text-zinc-500">
            TEMP
          </span>

          <input
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            placeholder="default"
            disabled={busy}
            className="w-16 rounded border border-zinc-800 bg-black px-2 py-1 text-xs outline-none"
          />
        </div>

        {/* Top P */}

        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.2em] text-zinc-500">
            TOP_P
          </span>

          <input
            value={topP}
            onChange={(e) => setTopP(e.target.value)}
            placeholder="default"
            disabled={busy}
            className="w-16 rounded border border-zinc-800 bg-black px-2 py-1 text-xs outline-none"
          />
        </div>

        {/* Stream */}

        <label className="flex cursor-pointer items-center gap-2 text-[10px] tracking-[0.2em] text-zinc-500">
          <input
            type="checkbox"
            checked={stream}
            onChange={(e) => setStream(e.target.checked)}
            disabled={busy}
          />
          STREAM
        </label>

        {/* Actions */}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={pop}
            disabled={busy || messages.length === 0}
            className="rounded border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[11px] tracking-[0.2em] transition hover:border-zinc-700 disabled:opacity-40"
          >
            POP
          </button>

          <button
            onClick={clear}
            disabled={busy}
            className="rounded border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[11px] tracking-[0.2em] transition hover:border-zinc-700 disabled:opacity-40"
          >
            CLEAR
          </button>
        </div>
      </header>

      {/* Messages */}

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-5"
      >
        {messages.length === 0 && (
          <div className="mt-24 text-center text-xs text-zinc-600">
            <div>POST {ENDPOINT}</div>
            <div className="mt-2">
              raw claude • no system prompt • no tools • not persisted
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message, index) => {
            const isUser = message.role === 'user'

            return (
              <div
                key={index}
                className={[
                  'rounded-md border-l-2 p-4 text-sm leading-7 whitespace-pre-wrap break-words',
                  isUser
                    ? 'border-teal-300 bg-teal-950/20'
                    : 'border-red-400 bg-red-950/20',
                ].join(' ')}
              >
                <div
                  className={[
                    'mb-2 text-[10px] font-bold tracking-[0.25em]',
                    isUser ? 'text-teal-300' : 'text-red-400',
                  ].join(' ')}
                >
                  {message.role.toUpperCase()}
                </div>

                {message.content ||
                  (busy && index === messages.length - 1 ? '▌' : '')}
              </div>
            )
          })}

          {error && (
            <div className="rounded-md border-l-2 border-yellow-400 bg-yellow-950/20 p-4 text-sm text-yellow-300">
              <div className="mb-2 text-[10px] font-bold tracking-[0.25em]">
                ERROR
              </div>

              {error}
            </div>
          )}
        </div>
      </main>

      {/* Composer */}

      <footer className="border-t border-zinc-900 bg-zinc-950 p-4">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            placeholder="user message... (Ctrl/Cmd + Enter to send)"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                send()
              }
            }}
            className="min-h-[72px] flex-1 resize-y rounded border border-zinc-800 bg-black px-3 py-2 text-sm outline-none"
          />

          {busy ? (
            <button
              onClick={stop}
              className="rounded border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold tracking-[0.2em]"
            >
              STOP
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!input.trim()}
              className="rounded bg-red-400 px-4 py-2 text-xs font-bold tracking-[0.2em] text-black disabled:opacity-40"
            >
              SEND
            </button>
          )}
        </div>
      </footer>

      {/* Status */}

      <div className="flex flex-wrap gap-5 border-t border-zinc-900 bg-black px-5 py-2 text-[10px] tracking-[0.15em] text-zinc-500">
        <span>status: {statusText}</span>

        <span>turns: {messages.length}</span>

        {latencyMs !== null && <span>{latencyMs}ms</span>}

        {usage && (
          <span>
            in: {usage.input_tokens} · out: {usage.output_tokens}
          </span>
        )}

        {stopReason && <span>stop: {stopReason}</span>}

        <span className="ml-auto">endpoint: {ENDPOINT}</span>
      </div>
    </div>
  )
}
