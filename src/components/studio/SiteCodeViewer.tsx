'use client';

/**
 * SiteCodeViewer — read-only file tree + Monaco editor for a site artifact.
 * Files prefixed with `b64:` are binary — render a placeholder card.
 */

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  File,
  FileText,
  Folder,
  Image as ImageIcon,
  ChevronRight,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { studioApi, type StudioArtifact } from '@/lib/studioApi';
import { studioTheme as T } from './theme';
import { Spinner } from './StudioPrimitives';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((m) => m.default),
  { ssr: false, loading: () => <CenterSpinner label="Loading editor…" /> },
);

interface Props {
  projectId: string;
  artifact: StudioArtifact;
}

interface FileNode {
  type: 'file' | 'dir';
  name: string;
  path: string;
  children?: FileNode[];
  isBinary?: boolean;
}

export function SiteCodeViewer({ projectId, artifact }: Props) {
  const [files, setFiles] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFiles(null);
    studioApi
      .getSiteFiles(projectId, artifact.id)
      .then((r) => {
        if (cancelled) return;
        setFiles(r.files);
        // Default-select index.html or first file
        const keys = Object.keys(r.files);
        const def =
          keys.find((k) => k.toLowerCase() === 'index.html') ||
          keys.find((k) => k.toLowerCase().endsWith('.html')) ||
          keys[0] ||
          null;
        setSelected(def);
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message || 'Failed to load files');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, artifact.id]);

  const tree = useMemo(() => (files ? buildTree(files) : null), [files]);

  if (loading) {
    return <CenterSpinner label="Loading files…" />;
  }
  if (error) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 10,
          color: T.error,
        }}
      >
        <AlertCircle size={26} />
        <div style={{ fontSize: 13 }}>{error}</div>
      </div>
    );
  }
  if (!files || !tree) return null;

  const selectedContent = selected ? files[selected] : '';
  const isBinary = selectedContent?.startsWith('b64:') ?? false;

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, background: T.bg }}>
      {/* Tree */}
      <div
        className="studio-scroll"
        style={{
          width: 260,
          flexShrink: 0,
          overflow: 'auto',
          borderRight: `1px solid ${T.border}`,
          background: T.bgChat,
          padding: '10px 4px',
        }}
      >
        <FileTreeView nodes={tree} selected={selected} onSelect={setSelected} depth={0} />
      </div>

      {/* Editor */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        {selected ? (
          isBinary ? (
            <BinaryPreview path={selected} content={selectedContent} />
          ) : (
            <MonacoEditor
              height="100%"
              theme="vs-dark"
              language={inferLang(selected)}
              value={selectedContent}
              path={selected}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'DM Mono', ui-monospace, monospace",
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                automaticLayout: true,
              }}
            />
          )
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.textMuted,
              fontSize: 13,
            }}
          >
            Select a file to view its contents
          </div>
        )}
      </div>
    </div>
  );
}

function CenterSpinner({ label }: { label: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <Spinner size={26} />
      <div style={{ color: T.textDim, fontSize: 13 }}>{label}</div>
    </div>
  );
}

function BinaryPreview({ path, content }: { path: string; content: string }) {
  const isImage = /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(path);
  const b64 = content.replace(/^b64:/, '');
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 14,
        padding: 32,
        background: T.bg,
      }}
    >
      {isImage ? (
        <img
          src={`data:image/${(path.split('.').pop() || 'png').toLowerCase()};base64,${b64}`}
          alt={path}
          style={{
            maxWidth: '80%',
            maxHeight: '70%',
            borderRadius: 8,
            boxShadow: T.shadowDeep,
            background: '#fff',
            objectFit: 'contain',
          }}
        />
      ) : (
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 14,
            background: T.bgRaised,
            border: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <File size={36} color={T.textMuted} />
        </div>
      )}
      <div style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textMuted }}>
        {path} · binary file
      </div>
    </div>
  );
}

// ─── Tree ──────────────────────────────────────────────────────────────

function FileTreeView({
  nodes,
  selected,
  onSelect,
  depth,
}: {
  nodes: FileNode[];
  selected: string | null;
  onSelect: (p: string) => void;
  depth: number;
}) {
  return (
    <div>
      {nodes.map((n) => (
        <FileTreeRow
          key={n.path || n.name}
          node={n}
          selected={selected}
          onSelect={onSelect}
          depth={depth}
        />
      ))}
    </div>
  );
}

function FileTreeRow({
  node,
  selected,
  onSelect,
  depth,
}: {
  node: FileNode;
  selected: string | null;
  onSelect: (p: string) => void;
  depth: number;
}) {
  const [open, setOpen] = useState(depth < 1);
  const isSel = node.path === selected;
  const Icon = node.type === 'dir' ? Folder : pickFileIcon(node.name);

  return (
    <div>
      <button
        onClick={() => {
          if (node.type === 'dir') setOpen((v) => !v);
          else onSelect(node.path);
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: `4px 6px 4px ${8 + depth * 14}px`,
          background: isSel ? T.accentDim : 'transparent',
          color: isSel ? T.accent : T.text,
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontFamily: T.fontMono,
          fontSize: 12,
          textAlign: 'left',
          minHeight: 26,
        }}
        onMouseEnter={(e) => {
          if (!isSel) e.currentTarget.style.background = T.bgCardHover;
        }}
        onMouseLeave={(e) => {
          if (!isSel) e.currentTarget.style.background = 'transparent';
        }}
      >
        {node.type === 'dir' ? (
          open ? <ChevronDown size={11} /> : <ChevronRight size={11} />
        ) : (
          <span style={{ width: 11 }} />
        )}
        <Icon size={13} color={node.type === 'dir' ? T.accent : T.textMuted} />
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {node.name}
        </span>
      </button>
      {node.type === 'dir' && open && node.children && (
        <FileTreeView
          nodes={node.children}
          selected={selected}
          onSelect={onSelect}
          depth={depth + 1}
        />
      )}
    </div>
  );
}

function pickFileIcon(name: string): React.ElementType {
  if (/\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(name)) return ImageIcon;
  if (/\.(html?|css|js|ts|tsx|jsx|json|md|txt)$/i.test(name)) return FileText;
  return File;
}

function inferLang(path: string): string {
  const ext = (path.split('.').pop() || '').toLowerCase();
  return (
    {
      html: 'html',
      htm: 'html',
      css: 'css',
      js: 'javascript',
      mjs: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      json: 'json',
      md: 'markdown',
      svg: 'xml',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
    } as Record<string, string>
  )[ext] || 'plaintext';
}

function buildTree(files: Record<string, string>): FileNode[] {
  const root: FileNode = { type: 'dir', name: '', path: '', children: [] };
  const sortedPaths = Object.keys(files).sort();
  for (const p of sortedPaths) {
    const parts = p.split('/').filter(Boolean);
    let cur = root;
    parts.forEach((part, i) => {
      const isLeaf = i === parts.length - 1;
      const childPath = parts.slice(0, i + 1).join('/');
      let next = cur.children!.find((c) => c.name === part);
      if (!next) {
        next = isLeaf
          ? { type: 'file', name: part, path: childPath, isBinary: files[p].startsWith('b64:') }
          : { type: 'dir', name: part, path: childPath, children: [] };
        cur.children!.push(next);
      }
      cur = next;
    });
  }
  // Sort: dirs first, then files, alphabetically
  function sortNode(n: FileNode) {
    if (!n.children) return;
    n.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    n.children.forEach(sortNode);
  }
  sortNode(root);
  return root.children || [];
}
