'use client';

/**
 * GitHub PR browser & quick-review UI backed by the `gh` CLI.
 */
import { useState } from 'react';
import { isDesktop, getTools } from '@/lib/desktop/bridge';

interface PR { number: number; title: string; author?: { login: string }; state: string; url: string; createdAt: string; headRefName: string; baseRefName: string; }

export default function GithubPanel() {
  const [repo, setRepo] = useState('');
  const [prs, setPrs] = useState<PR[]>([]);
  const [activePr, setActivePr] = useState<PR | null>(null);
  const [diff, setDiff] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!repo.trim()) return;
    setBusy(true); setError(null);
    try {
      const r = await getTools()!.github_list_prs(repo, 'open');
      if (!r.ok) throw new Error(r.error?.message || 'gh failed');
      setPrs(r.result as PR[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }
  async function openPr(pr: PR) {
    setActivePr(pr); setDiff(''); setError(null);
    const r = await getTools()!.github_pr_diff(repo, pr.number);
    if (r.ok && r.result) setDiff((r.result as { diff: string }).diff);
    else setError(r.error?.message || 'failed');
  }
  async function submitComment() {
    if (!activePr || !comment.trim()) return;
    setBusy(true);
    const r = await getTools()!.github_pr_comment(repo, activePr.number, comment);
    setBusy(false);
    if (!r.ok) setError(r.error?.message || 'failed');
    else { setComment(''); }
  }
  async function review(event: 'approve' | 'request_changes' | 'comment') {
    if (!activePr) return;
    setBusy(true);
    const r = await getTools()!.github_pr_review(repo, activePr.number, { event, body: comment });
    setBusy(false);
    if (!r.ok) setError(r.error?.message || 'failed');
    else { setComment(''); }
  }

  if (!isDesktop()) return <div className="p-6 text-sm text-neutral-500">GitHub tools only available in the desktop app.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto text-neutral-100 space-y-4">
      <header>
        <h1 className="text-xl font-semibold">GitHub</h1>
        <p className="text-sm text-neutral-400 mt-1">Browse PRs and leave inline reviews via the <code className="text-xs">gh</code> CLI.</p>
      </header>
      <div className="flex gap-2">
        <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="owner/repo" className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm font-mono" onKeyDown={(e) => { if (e.key === 'Enter') void load(); }} />
        <button onClick={() => void load()} disabled={busy} className="px-3 py-2 text-xs bg-neutral-100 text-neutral-900 rounded-md font-medium hover:bg-white disabled:opacity-50">{busy ? '…' : 'Load PRs'}</button>
      </div>
      {error && <div className="text-xs text-red-400">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-neutral-800 divide-y divide-neutral-900 max-h-[60vh] overflow-y-auto">
          {prs.length === 0 && <div className="px-4 py-4 text-xs text-neutral-500 text-center">No PRs loaded.</div>}
          {prs.map((pr) => (
            <button key={pr.number} onClick={() => void openPr(pr)} className={`w-full text-left px-4 py-3 hover:bg-neutral-900 ${activePr?.number === pr.number ? 'bg-neutral-900' : ''}`}>
              <div className="text-xs text-neutral-500">#{pr.number} · {pr.author?.login}</div>
              <div className="text-sm text-neutral-100 mt-0.5 line-clamp-1">{pr.title}</div>
              <div className="text-[10px] text-neutral-500 mt-1 font-mono">{pr.headRefName} → {pr.baseRefName}</div>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-950 flex flex-col">
          {activePr ? (
            <>
              <div className="px-4 py-2 border-b border-neutral-800 text-xs text-neutral-400 font-mono">#{activePr.number} {activePr.title}</div>
              <pre className="flex-1 overflow-auto text-[10px] p-3 font-mono text-neutral-300 max-h-[42vh]">{diff || 'Loading diff…'}</pre>
              <div className="border-t border-neutral-800 p-3 space-y-2">
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Comment / review body…" className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm resize-none" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => void submitComment()} disabled={busy || !comment.trim()} className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-md hover:bg-neutral-800 disabled:opacity-50">Comment</button>
                  <button onClick={() => void review('request_changes')} disabled={busy} className="px-3 py-1.5 text-xs bg-amber-900 hover:bg-amber-800 text-amber-100 rounded-md disabled:opacity-50">Request changes</button>
                  <button onClick={() => void review('approve')} disabled={busy} className="px-3 py-1.5 text-xs bg-emerald-900 hover:bg-emerald-800 text-emerald-100 rounded-md disabled:opacity-50">Approve</button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-neutral-500">Select a PR</div>
          )}
        </div>
      </div>
    </div>
  );
}
