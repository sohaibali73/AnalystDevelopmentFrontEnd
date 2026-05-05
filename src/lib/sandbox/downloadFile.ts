/**
 * downloadSandboxFile — unified download helper for sandbox file artifacts (v3.1)
 *
 * Strategy:
 *   1. Preferred: GET `${API_BASE}${metadata.download_url}` with Bearer JWT,
 *      stream response into a Blob, trigger browser save.
 *      → Hits the Railway-volume-backed `/files/{file_id}/download` endpoint.
 *      → File is permanent, link doesn't expire.
 *
 *   2. Fallback: If `download_url` is missing (Railway+Supabase persistence
 *      both failed, very rare) OR the auth fetch fails, decode the inline
 *      base64 `artifact.data` and save it directly. No auth, instant.
 *
 * This is the ONLY place in the app that should construct a sandbox download.
 * All UI components (currently `FileArtifactDisplay` in
 * `SandboxArtifactRenderer.tsx`) should call this and surface its errors.
 */

import { getApiUrl } from '@/lib/env';
import { storage } from '@/lib/storage';
import type { SandboxArtifact, FileArtifactMetadata } from './types';

const API_BASE = getApiUrl();

function getJwt(): string | null {
  try {
    return (
      storage.getItem('auth_token') ??
      (typeof window !== 'undefined'
        ? (() => {
            try {
              return window.localStorage.getItem('auth_token');
            } catch {
              return null;
            }
          })()
        : null)
    );
  } catch {
    return null;
  }
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Defer revoke so Safari/Firefox have time to start the save
  setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
}

function base64ToBlob(b64: string, mime: string): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Download a sandbox file artifact, preferring the persistent backend URL
 * and falling back to inline base64 data if needed.
 *
 * @throws Error if neither path can produce a file.
 */
export async function downloadSandboxFile(artifact: SandboxArtifact): Promise<void> {
  const meta = (artifact.metadata ?? {}) as Partial<FileArtifactMetadata>;
  const filename = meta.filename ?? `download${meta.extension ?? ''}`;
  const mime = artifact.type || 'application/octet-stream';

  // ── Path A: persistent backend URL with Bearer auth (preferred) ───────────
  if (meta.download_url) {
    try {
      const absUrl = meta.download_url.startsWith('/')
        ? `${API_BASE}${meta.download_url}`
        : meta.download_url;
      const token = getJwt();
      const res = await fetch(absUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const blob = await res.blob();
        triggerBrowserDownload(blob, filename);
        return;
      }
      // Non-OK → fall through to base64 fallback if we have it
      console.warn(
        `[sandbox] Backend download failed (${res.status}) for ${filename}; ` +
          `falling back to inline data.`
      );
    } catch (err) {
      console.warn(
        `[sandbox] Backend download threw for ${filename}; falling back to inline data.`,
        err
      );
    }
  }

  // ── Path B: inline base64 fallback ────────────────────────────────────────
  if (artifact.data) {
    const blob =
      artifact.encoding === 'base64'
        ? base64ToBlob(artifact.data, mime)
        : new Blob([artifact.data], { type: mime });
    triggerBrowserDownload(blob, filename);
    return;
  }

  throw new Error(
    `Unable to download "${filename}": no download_url succeeded and no inline data is available.`
  );
}
