'use client';

/**
 * Client SDK for the user-uploaded skills feature.
 * Reads the auth token from localStorage (same place AuthContext writes it).
 */

import type {
  SkillDefinition,
  SkillUploadResponse,
} from '@/types/skills';

function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem('auth_token') || '';
  } catch {
    return '';
  }
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { detail: { code: 'UNKNOWN', error: text } };
  }
}

export async function listSkills(opts?: {
  owned?: 'me';
  category?: string;
  include_builtins?: boolean;
}): Promise<{ skills: SkillDefinition[]; count: number }> {
  const qs = new URLSearchParams();
  if (opts?.owned) qs.set('owned', opts.owned);
  if (opts?.category) qs.set('category', opts.category);
  if (opts?.include_builtins !== undefined)
    qs.set('include_builtins', String(opts.include_builtins));
  const res = await fetch(
    `/api/skills${qs.toString() ? `?${qs.toString()}` : ''}`,
    { headers: authHeaders() }
  );
  const body = await readJson(res);
  if (!res.ok) throw body || {};
  return body;
}

export async function getSkill(slug: string): Promise<SkillDefinition> {
  const res = await fetch(`/api/skills/${encodeURIComponent(slug)}`, {
    headers: authHeaders(),
  });
  const body = await readJson(res);
  if (!res.ok) throw body || {};
  return body;
}

export async function uploadSkill(
  zip: Blob | File,
  metadata?: Record<string, unknown>
): Promise<SkillUploadResponse> {
  const fd = new FormData();
  const filename =
    (zip as File).name && (zip as File).name.toLowerCase().endsWith('.zip')
      ? (zip as File).name
      : 'skill.zip';
  fd.append('file', zip, filename);
  if (metadata) fd.append('metadata', JSON.stringify(metadata));

  const res = await fetch('/api/skills/upload', {
    method: 'POST',
    headers: authHeaders(),
    body: fd,
  });
  const body = await readJson(res);
  if (!res.ok) throw body || {};
  return body;
}

export async function patchSkill(
  slug: string,
  patch: Partial<{
    name: string;
    description: string;
    category: string;
    tags: string[];
    enabled: boolean;
    system_prompt: string;
  }>
): Promise<{ skill: SkillDefinition }> {
  const res = await fetch(`/api/skills/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const body = await readJson(res);
  if (!res.ok) throw body || {};
  return body;
}

export async function deleteSkill(slug: string): Promise<void> {
  const res = await fetch(`/api/skills/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    const body = await readJson(res);
    throw body || {};
  }
}

export async function duplicateSkill(
  slug: string,
  body: { new_slug?: string; new_name?: string } = {}
): Promise<{ skill: SkillDefinition }> {
  const res = await fetch(
    `/api/skills/${encodeURIComponent(slug)}/duplicate`,
    {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const parsed = await readJson(res);
  if (!res.ok) throw parsed || {};
  return parsed;
}

export function downloadSkillURL(slug: string): string {
  return `/api/skills/${encodeURIComponent(slug)}/download`;
}
