'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  pptxAi,
  smartRevise,
  type PptxAiResult,
  PPTX_PROMPT_TEMPLATES,
} from '@/lib/pptxIntelligenceApi';

// ─── Action badge colors ──────────────────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  merge:               'bg-blue-500/20 text-blue-400 border-blue-500/30',
  analyze:             'bg-purple-500/20 text-purple-400 border-purple-500/30',
  reconstruct:         'bg-orange-500/20 text-orange-400 border-orange-500/30',
  generate_from_doc:   'bg-green-500/20 text-green-400 border-green-500/30',
  generate_from_brief: 'bg-green-500/20 text-green-400 border-green-500/30',
  export_pdf:          'bg-red-500/20 text-red-400 border-red-500/30',
  export_images:       'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  summarize:           'bg-teal-500/20 text-teal-400 border-teal-500/30',
  compare:             'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  brand_audit:         'bg-pink-500/20 text-pink-400 border-pink-500/30',
  brand_fix:           'bg-pink-500/20 text-pink-400 border-pink-500/30',
  speaker_notes:       'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  revise:              'bg-amber-500/20 text-amber-400 border-amber-500/30',
  plan:                'bg-slate-500/20 text-slate-400 border-slate-500/30',
  preview:             'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

// ─── Quick prompt suggestions ─────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { label: '🔀 Merge Decks',       prompt: 'Take slides 15-19 from the first deck and add them to the second deck' },
  { label: '✨ Generate from Brief', prompt: 'Create a 10-slide investor pitch about Potomac\'s Q2 2026 strategy. Audience: institutional investors.' },
  { label: '📄 Turn Doc → Deck',   prompt: 'Turn this document into a 10-slide branded executive presentation' },
  { label: '📋 Summarize',         prompt: 'What are the 5 most important points in this document? Give me executive bullets.' },
  { label: '🎨 Brand Audit',       prompt: 'Check this deck for Potomac brand compliance and score each slide' },
  { label: '📝 Speaker Notes',     prompt: 'Write 150-250 word speaker notes for every slide' },
  { label: '📑 Export PDF',        prompt: 'Export this presentation to PDF' },
  { label: '✏️ Revise',            prompt: 'Delete slide 7 and change all references from Q1 to Q2' },
];

const ACCEPTED_TYPES = '.pptx,.ppt,.pdf,.docx,.doc,.html,.htm,.txt,.md,.png,.jpg,.jpeg';

export default function PptxIntelligencePage() {
  const [prompt, setPrompt]         = useState('');
  const [files, setFiles]           = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [result, setResult]         = useState<PptxAiResult | null>(null);
  const [revisionPrompt, setRevisionPrompt] = useState('');
  const [revisioning, setRevisioning] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File handling ───────────────────────────────────────────────────────────

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...arr.filter(f => !names.has(f.name))];
    });
  }, []);

  const removeFile = (idx: number) =>
    setFiles(prev => prev.filter((_, i) => i !== idx));

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  // ── Main submission ─────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedSlide(0);

    try {
      const res = await pptxAi({ prompt: trimmed, files });
      setResult(res);
      if (!res.success && res.error) setError(res.error);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ── Revision ────────────────────────────────────────────────────────────────

  const handleRevise = async () => {
    if (!revisionPrompt.trim() || !result?.job_id) return;
    setRevisioning(true);
    setError(null);

    try {
      const revised = await smartRevise({
        jobId: result.job_id,
        instruction: revisionPrompt.trim(),
      });
      setResult(prev => prev ? {
        ...prev,
        job_id:       revised.job_id,
        download_url: revised.download_url,
        preview_urls: revised.preview_urls,
        explanation:  revised.summary || prev.explanation,
      } : prev);
      setRevisionPrompt('');
      setSelectedSlide(0);
    } catch (err: any) {
      setError(err.message || 'Revision failed');
    } finally {
      setRevisioning(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const previewUrls = result?.preview_urls ?? [];
  const hasResult   = result?.success && previewUrls.length > 0;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
      {/* ── Header ── */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <span className="text-2xl">⚡</span>
        <div>
          <h1 className="text-lg font-bold text-white">PPTX Intelligence</h1>
          <p className="text-xs text-white/50">
            Merge · Generate · Analyze · Export · Revise — powered by AI
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel: Input ── */}
        <div className={`flex flex-col gap-4 p-6 overflow-y-auto transition-all ${hasResult ? 'w-[420px] border-r border-white/10' : 'flex-1 max-w-3xl mx-auto w-full'}`}>

          {/* Quick prompts */}
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map(q => (
              <button
                key={q.label}
                onClick={() => setPrompt(q.prompt)}
                className="text-xs px-3 py-1.5 rounded-full border border-white/15 hover:border-[#FEC00F]/60 hover:text-[#FEC00F] transition-colors bg-white/5"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* File drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-[#FEC00F] bg-[#FEC00F]/5'
                : 'border-white/20 hover:border-white/40 bg-white/3'
            }`}
          >
            <div className="text-3xl mb-2">📂</div>
            <p className="text-sm text-white/70">
              Drop files here or <span className="text-[#FEC00F]">browse</span>
            </p>
            <p className="text-xs text-white/40 mt-1">
              PPTX · PDF · DOCX · HTML · images
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={e => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {/* Uploaded files */}
          {files.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm">
                  <span className="text-[#FEC00F]">📎</span>
                  <span className="flex-1 truncate text-white/80">{f.name}</span>
                  <span className="text-white/40 text-xs">{(f.size / 1024).toFixed(0)}KB</span>
                  <button onClick={() => removeFile(i)} className="text-white/30 hover:text-red-400 ml-1">✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Prompt textarea */}
          <div className="flex flex-col gap-2">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
              placeholder="Describe what you want… e.g. 'Take slides 15-19 from the Meet Potomac deck and add them to the Composite Details deck'"
              rows={4}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FEC00F]/50 resize-none"
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !prompt.trim()}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: loading || !prompt.trim()
                  ? 'rgba(254,192,15,0.15)'
                  : 'linear-gradient(135deg,#FEC00F,#f59e0b)',
                color: '#212121',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚙️</span> Processing…
                </span>
              ) : (
                '⚡ Execute with AI  (⌘ Enter)'
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Result summary */}
          {result && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${ACTION_COLORS[result.action] ?? 'bg-white/10 text-white/60 border-white/20'}`}>
                  {result.action.replace(/_/g, ' ')}
                </span>
                {result.slide_count > 0 && (
                  <span className="text-xs text-white/40">{result.slide_count} slides</span>
                )}
                <span className="text-xs text-white/30">{result.elapsed_ms.toFixed(0)}ms</span>
              </div>
              <p className="text-sm text-white/70">{result.explanation}</p>

              {result.download_url && (
                <a
                  href={result.download_url}
                  download
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-[#FEC00F]/40 text-[#FEC00F] text-sm font-medium hover:bg-[#FEC00F]/10 transition-colors"
                >
                  ⬇️ Download {result.action === 'export_pdf' ? 'PDF' : 'PPTX'}
                </a>
              )}

              {/* Summarize result */}
              {result.extra?.summaries && (
                <div className="space-y-2">
                  {(result.extra.summaries as any[]).map((s: any, i: number) => (
                    <div key={i}>
                      <p className="text-xs font-semibold text-[#FEC00F] mb-1">{s.one_liner}</p>
                      <ul className="space-y-1">
                        {(s.bullets as string[]).map((b, j) => (
                          <li key={j} className="text-xs text-white/60 flex gap-2">
                            <span className="text-[#FEC00F] mt-0.5">•</span>{b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Transcript */}
              {result.transcript && (
                <details className="text-xs text-white/50">
                  <summary className="cursor-pointer text-white/60 hover:text-white/80">View extracted text</summary>
                  <pre className="mt-2 whitespace-pre-wrap bg-black/30 rounded p-2 max-h-40 overflow-y-auto">{result.transcript}</pre>
                </details>
              )}

              {/* Audit summary */}
              {result.audit && (
                <div className="text-xs space-y-1">
                  <p className="text-white/60 font-medium">Brand Audit</p>
                  <p className="text-white/50">Avg score: <span className="text-[#FEC00F]">{result.audit.avg_score}/100</span> · Grade: <span className="text-[#FEC00F]">{result.audit.overall_grade}</span></p>
                </div>
              )}

              {/* Session ID */}
              {result.session_id && (
                <p className="text-xs text-white/40">Session: <code className="text-white/60">{result.session_id.slice(0, 8)}…</code></p>
              )}
            </div>
          )}

          {/* Revision panel */}
          {result?.success && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-white/40 font-medium uppercase tracking-wide">Apply Revision</p>
              <div className="flex gap-2">
                <input
                  value={revisionPrompt}
                  onChange={e => setRevisionPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRevise(); }}
                  placeholder="e.g. Move slide 3 to position 2"
                  className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FEC00F]/50"
                />
                <button
                  onClick={handleRevise}
                  disabled={revisioning || !revisionPrompt.trim()}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-sm font-medium disabled:opacity-40 transition-colors"
                >
                  {revisioning ? '…' : '✏️'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel: Slide previews ── */}
        {hasResult && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Large preview */}
            <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0a0a]">
              {previewUrls[selectedSlide] ? (
                <img
                  src={previewUrls[selectedSlide]}
                  alt={`Slide ${selectedSlide + 1}`}
                  className="max-w-full max-h-full rounded-xl shadow-2xl border border-white/10 object-contain"
                  style={{ maxHeight: 'calc(100vh - 280px)' }}
                />
              ) : (
                <div className="text-white/30 text-sm">No preview available</div>
              )}
            </div>

            {/* Slide strip */}
            <div className="border-t border-white/10 bg-[#0f0f0f] px-4 py-3 overflow-x-auto">
              <div className="flex gap-2" style={{ width: 'max-content' }}>
                {previewUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSlide(i)}
                    className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      i === selectedSlide
                        ? 'border-[#FEC00F] shadow-lg shadow-[#FEC00F]/20'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                    style={{ width: 120, height: 68 }}
                  >
                    <img
                      src={url}
                      alt={`Slide ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Slide nav bar */}
            <div className="border-t border-white/10 px-6 py-3 flex items-center justify-between bg-[#0f0f0f]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedSlide(s => Math.max(0, s - 1))}
                  disabled={selectedSlide === 0}
                  className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 disabled:opacity-30 text-sm"
                >
                  ‹
                </button>
                <span className="text-sm text-white/50">
                  {selectedSlide + 1} / {previewUrls.length}
                </span>
                <button
                  onClick={() => setSelectedSlide(s => Math.min(previewUrls.length - 1, s + 1))}
                  disabled={selectedSlide === previewUrls.length - 1}
                  className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 disabled:opacity-30 text-sm"
                >
                  ›
                </button>
              </div>

              {result?.download_url && (
                <a
                  href={result.download_url}
                  download
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: 'linear-gradient(135deg,#FEC00F,#f59e0b)', color: '#212121' }}
                >
                  ⬇️ Download
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
