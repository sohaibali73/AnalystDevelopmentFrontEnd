/**
 * Append-only JSONL audit log for every tool invocation. Retained forever
 * by design (per project requirement) — there is no rotation. Stored at
 * `userData/tool-audit.log.jsonl`.
 *
 * Each entry:
 *   { ts, tool, status: 'start'|'success'|'error'|'denied',
 *     args?: object, result_summary?: string, error?: string, durationMs? }
 */
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

let _filePath: string | null = null;
function filePath(): string {
  if (!_filePath) {
    _filePath = path.join(app.getPath('userData'), 'tool-audit.log.jsonl');
  }
  return _filePath;
}

/** Truncate possibly-large fields before writing. */
function redact(args: unknown): unknown {
  if (args === null || args === undefined) return args;
  if (typeof args === 'string') {
    return args.length > 512 ? args.slice(0, 512) + `…[+${args.length - 512} chars]` : args;
  }
  if (Array.isArray(args)) return args.map(redact);
  if (typeof args === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(args as Record<string, unknown>)) {
      // Never log file contents in plaintext — keep length only.
      if (k === 'content' && typeof v === 'string') {
        out[k] = `<${v.length} chars>`;
      } else {
        out[k] = redact(v);
      }
    }
    return out;
  }
  return args;
}

export interface AuditEntry {
  ts: number;
  tool: string;
  status: 'start' | 'success' | 'error' | 'denied';
  args?: unknown;
  resultSummary?: string;
  error?: string;
  durationMs?: number;
}

export function append(entry: AuditEntry): void {
  try {
    const safe: AuditEntry = {
      ...entry,
      args: entry.args !== undefined ? redact(entry.args) : undefined,
    };
    fs.mkdirSync(path.dirname(filePath()), { recursive: true });
    fs.appendFileSync(filePath(), JSON.stringify(safe) + '\n', 'utf-8');
  } catch {
    /* never throw from audit */
  }
}

/** Read the last N entries (cheap because we read the whole file then tail). */
export function tail(limit = 200): AuditEntry[] {
  try {
    const raw = fs.readFileSync(filePath(), 'utf-8');
    const lines = raw.split('\n').filter((l) => l.trim().length > 0);
    const slice = lines.slice(-limit);
    return slice
      .map((l) => {
        try {
          return JSON.parse(l) as AuditEntry;
        } catch {
          return null;
        }
      })
      .filter((x): x is AuditEntry => x !== null);
  } catch {
    return [];
  }
}

export function getLogPath(): string {
  return filePath();
}
