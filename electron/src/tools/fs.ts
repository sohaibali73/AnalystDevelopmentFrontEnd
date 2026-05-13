/**
 * Filesystem tools — exposed to the renderer via IPC, executed in the main
 * process with full Node `fs` access (gated by sandbox.ts).
 */
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { dialog, BrowserWindow } from 'electron';
import { guardPath } from './sandbox';
import { getStore } from '../settings/store';

const MAX_READ_BYTES = 50 * 1024 * 1024; // 50 MB per-call cap

export async function readFile(rawPath: string, opts?: { encoding?: BufferEncoding | 'base64' }): Promise<{ path: string; content: string; encoding: string; size: number }> {
  const p = await guardPath(rawPath, 'read');
  const stat = await fs.stat(p);
  if (stat.size > MAX_READ_BYTES) {
    throw new Error(`File too large (${stat.size} bytes; cap is ${MAX_READ_BYTES}).`);
  }
  const encoding = opts?.encoding || 'utf-8';
  const content = encoding === 'base64'
    ? (await fs.readFile(p)).toString('base64')
    : await fs.readFile(p, encoding as BufferEncoding);
  return { path: p, content: content as string, encoding, size: stat.size };
}

export async function writeFile(rawPath: string, content: string, opts?: { encoding?: BufferEncoding | 'base64'; createDirs?: boolean }): Promise<{ path: string; bytesWritten: number }> {
  const p = await guardPath(rawPath, 'write');
  if (opts?.createDirs !== false) {
    await fs.mkdir(path.dirname(p), { recursive: true });
  }
  if (opts?.encoding === 'base64') {
    const buf = Buffer.from(content, 'base64');
    await fs.writeFile(p, buf);
    return { path: p, bytesWritten: buf.byteLength };
  }
  await fs.writeFile(p, content, opts?.encoding || 'utf-8');
  return { path: p, bytesWritten: Buffer.byteLength(content, opts?.encoding || 'utf-8') };
}

export async function appendFile(rawPath: string, content: string): Promise<{ path: string; bytesAppended: number }> {
  const p = await guardPath(rawPath, 'write');
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.appendFile(p, content, 'utf-8');
  return { path: p, bytesAppended: Buffer.byteLength(content, 'utf-8') };
}

export async function deletePath(rawPath: string): Promise<{ path: string; deleted: boolean }> {
  const p = await guardPath(rawPath, 'delete');
  await fs.rm(p, { recursive: true, force: true });
  return { path: p, deleted: true };
}

export async function listDir(rawPath: string, opts?: { recursive?: boolean; maxEntries?: number }): Promise<{ path: string; entries: Array<{ name: string; path: string; type: 'file' | 'dir' | 'symlink' | 'other'; size?: number }>}> {
  const p = await guardPath(rawPath, 'list');
  const max = Math.min(opts?.maxEntries ?? 1000, 5000);
  const entries: Array<{ name: string; path: string; type: 'file' | 'dir' | 'symlink' | 'other'; size?: number }> = [];

  async function walk(dir: string): Promise<void> {
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const it of items) {
      if (entries.length >= max) return;
      const full = path.join(dir, it.name);
      let type: 'file' | 'dir' | 'symlink' | 'other' = 'other';
      if (it.isFile()) type = 'file';
      else if (it.isDirectory()) type = 'dir';
      else if (it.isSymbolicLink()) type = 'symlink';
      let size: number | undefined;
      try { if (type === 'file') size = (await fs.stat(full)).size; } catch { /* ignore */ }
      entries.push({ name: it.name, path: full, type, size });
      if (opts?.recursive && type === 'dir') await walk(full);
    }
  }
  await walk(p);
  return { path: p, entries };
}

export async function stat(rawPath: string): Promise<{ path: string; exists: boolean; size?: number; isFile?: boolean; isDir?: boolean; modifiedAt?: number; createdAt?: number }> {
  const p = await guardPath(rawPath, 'read');
  try {
    const s = await fs.stat(p);
    return {
      path: p,
      exists: true,
      size: s.size,
      isFile: s.isFile(),
      isDir: s.isDirectory(),
      modifiedAt: s.mtimeMs,
      createdAt: s.ctimeMs,
    };
  } catch {
    return { path: p, exists: false };
  }
}

export async function move(src: string, dest: string): Promise<{ src: string; dest: string }> {
  const s = await guardPath(src, 'delete');   // we're removing it from the source
  const d = await guardPath(dest, 'write');
  await fs.mkdir(path.dirname(d), { recursive: true });
  await fs.rename(s, d);
  return { src: s, dest: d };
}

export async function copy(src: string, dest: string): Promise<{ src: string; dest: string }> {
  const s = await guardPath(src, 'read');
  const d = await guardPath(dest, 'write');
  await fs.mkdir(path.dirname(d), { recursive: true });
  await fs.cp(s, d, { recursive: true, force: true });
  return { src: s, dest: d };
}

export async function mkdir(rawPath: string): Promise<{ path: string; created: boolean }> {
  const p = await guardPath(rawPath, 'write');
  await fs.mkdir(p, { recursive: true });
  return { path: p, created: true };
}

export async function pickFile(opts?: { multi?: boolean; filters?: Electron.FileFilter[] }): Promise<{ paths: string[] }> {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  const props: Array<'openFile' | 'multiSelections'> = ['openFile'];
  if (opts?.multi) props.push('multiSelections');
  const { canceled, filePaths } = await dialog.showOpenDialog(win!, {
    title: 'Choose a file for the AI to read',
    properties: props,
    filters: opts?.filters,
  });
  if (canceled) return { paths: [] };
  return { paths: filePaths };
}

export async function pickFolder(): Promise<{ path: string | null; addedToAllowlist: boolean }> {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  const { canceled, filePaths } = await dialog.showOpenDialog(win!, {
    title: 'Choose a folder for the AI to access',
    properties: ['openDirectory'],
  });
  if (canceled || filePaths.length === 0) return { path: null, addedToAllowlist: false };
  const chosen = filePaths[0];
  // Persist it as an extra allowlisted root (the user just picked it, so consent is implicit).
  const cur = getStore().get();
  if (!cur.extraRoots.includes(chosen)) {
    getStore().patch({ extraRoots: [...cur.extraRoots, chosen] });
  }
  return { path: chosen, addedToAllowlist: true };
}

export function ensureWorkspace(): string {
  const root = getStore().get().workspaceRoot;
  try {
    if (!fsSync.existsSync(root)) fsSync.mkdirSync(root, { recursive: true });
    // Drop a README on first creation.
    const readme = path.join(root, 'README.md');
    if (!fsSync.existsSync(readme)) {
      fsSync.writeFileSync(readme,
        '# Potomac Workspace\n\nThe AI assistant in the Potomac desktop app can read and write files inside this folder without asking for permission each time. Anything outside this folder will prompt you for consent.\n\nDelete this folder to reset the workspace.\n',
        'utf-8',
      );
    }
  } catch {
    /* ignore */
  }
  return root;
}
