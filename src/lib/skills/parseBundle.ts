'use client';

/**
 * Client-side parser for uploaded skill .zip bundles. Used to render a live
 * preview before posting to the backend. Also synthesizes a 1-file SKILL.md
 * bundle from inline form fields.
 */

import JSZip from 'jszip';
import yaml from 'js-yaml';
import { KEBAB_SLUG_RE } from '@/types/skills';

export interface ParsedFrontmatter {
  name?: string;
  description?: string;
  slug?: string;
  category?: string;
  tags?: string[];
  [k: string]: unknown;
}

export interface ParsedBundlePreview {
  ok: boolean;
  errors: string[];
  warnings: string[];
  frontmatter: ParsedFrontmatter;
  body: string;
  fileTree: { path: string; size: number }[];
  storageKindGuess: 'lightweight' | 'bundle';
}

const ALLOWED_EXTS = new Set([
  '.md', '.txt', '.json', '.yaml', '.yml',
  '.py', '.js', '.ts', '.tsx', '.jsx', '.mjs',
  '.csv', '.tsv',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
  '.pdf',
  '.html', '.htm', '.css', '.xml',
]);

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;

export async function parseBundle(file: File): Promise<ParsedBundlePreview> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (file.size > 25 * 1024 * 1024) {
    return {
      ok: false,
      errors: ['Bundle exceeds 25 MB.'],
      warnings: [],
      frontmatter: {},
      body: '',
      fileTree: [],
      storageKindGuess: 'lightweight',
    };
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    return {
      ok: false,
      errors: ['Not a valid .zip.'],
      warnings: [],
      frontmatter: {},
      body: '',
      fileTree: [],
      storageKindGuess: 'lightweight',
    };
  }

  const allPaths = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
  const tops = new Set(allPaths.map((p) => p.split('/')[0]));
  const rootFiles = allPaths.filter((p) => !p.includes('/'));
  const stripPrefix =
    tops.size === 1 && rootFiles.length === 0 ? `${[...tops][0]}/` : '';

  const fileTree: { path: string; size: number }[] = [];
  let skillMdRaw: string | null = null;
  let skillJsonRaw: string | null = null;
  let promptMdRaw: string | null = null;
  let totalUncompressed = 0;

  for (const path of allPaths) {
    const norm =
      stripPrefix && path.startsWith(stripPrefix)
        ? path.slice(stripPrefix.length)
        : path;
    const ext = (norm.match(/\.[^./]+$/)?.[0] || '').toLowerCase();
    if (ext && !ALLOWED_EXTS.has(ext)) {
      warnings.push(`Skipped: ${norm}`);
      continue;
    }
    const entry = zip.files[path];
    const data = await entry.async('uint8array');
    totalUncompressed += data.byteLength;
    if (totalUncompressed > 50 * 1024 * 1024) {
      errors.push('Bundle exceeds 50 MB extracted.');
      break;
    }
    fileTree.push({ path: norm, size: data.byteLength });
    const text = new TextDecoder().decode(data);
    if (norm === 'SKILL.md') skillMdRaw = text;
    else if (norm === 'skill.json') skillJsonRaw = text;
    else if (norm === 'prompt.md') promptMdRaw = text;
  }

  let frontmatter: ParsedFrontmatter = {};
  let body = '';

  if (skillMdRaw) {
    const m = skillMdRaw.match(FRONTMATTER_RE);
    if (m) {
      try {
        frontmatter = (yaml.load(m[1]) as ParsedFrontmatter) || {};
      } catch {
        warnings.push('YAML frontmatter could not be parsed.');
      }
      body = m[2];
    } else {
      body = skillMdRaw;
      warnings.push('SKILL.md has no YAML frontmatter.');
    }
  } else if (skillJsonRaw) {
    try {
      frontmatter = JSON.parse(skillJsonRaw) as ParsedFrontmatter;
    } catch {
      errors.push('skill.json is not valid JSON.');
    }
    if (promptMdRaw) body = promptMdRaw;
  } else {
    errors.push('Missing SKILL.md (or skill.json + prompt.md) at root.');
  }

  if (!frontmatter.name) errors.push('name is required');
  if (!frontmatter.description) errors.push('description is required');
  if (frontmatter.slug && !KEBAB_SLUG_RE.test(String(frontmatter.slug))) {
    errors.push('slug must be kebab-case (3-64 chars).');
  }

  const hasNested = fileTree.some((f) => f.path.includes('/'));
  const storageKindGuess: 'lightweight' | 'bundle' = hasNested
    ? 'bundle'
    : 'lightweight';

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    frontmatter,
    body,
    fileTree,
    storageKindGuess,
  };
}

/** Build a 1-file SKILL.md bundle from inline form fields. */
export async function buildInlineBundle(opts: {
  name: string;
  description: string;
  systemPrompt: string;
  slug?: string;
  category?: string;
  tags?: string[];
}): Promise<Blob> {
  const slug = (opts.slug || slugify(opts.name)).toLowerCase();
  // Emit the human `name` and the kebab `slug` as SEPARATE fields. The backend
  // loader reads the display name straight from `name`, so writing the slug
  // there made uploaded skills show their slug as their name.
  const lines: (string | null)[] = [
    '---',
    `name: ${yamlDoubleQuote(opts.name)}`,
    `slug: ${slug}`,
    'description: >',
    ...wrapBlock(opts.description, 2),
    `category: ${opts.category || 'general'}`,
    opts.tags && opts.tags.length ? `tags: [${opts.tags.join(', ')}]` : null,
    '---',
    '',
    `# ${opts.name}`,
    '',
    opts.systemPrompt.trim(),
    '',
  ];
  const frontmatter = lines.filter((l) => l !== null).join('\n');

  const zip = new JSZip();
  zip.file('SKILL.md', frontmatter);
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/** Render a string as a YAML double-quoted scalar (handles names with colons,
 *  quotes, etc.) so the synthesized frontmatter round-trips safely. */
function yamlDoubleQuote(s: string): string {
  return `"${(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function slugify(name: string): string {
  let s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!s) return '';
  if (!/^[a-z]/.test(s)) s = 's-' + s;
  return s.slice(0, 64);
}

function wrapBlock(text: string, indent = 2, width = 80): string[] {
  const pad = ' '.repeat(indent);
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line: string[] = [];
  let len = 0;
  for (const w of words) {
    if (len + w.length + 1 > width && line.length) {
      out.push(pad + line.join(' '));
      line = [w];
      len = w.length;
    } else {
      line.push(w);
      len += w.length + 1;
    }
  }
  if (line.length) out.push(pad + line.join(' '));
  return out;
}
