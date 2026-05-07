'use client';

/**
 * SitePreviewPane — right-pane of the workspace for kind='site'.
 *
 * Tabs: Preview · Code · Publications.
 * Renders an iframe pointing at the authenticated preview endpoint.
 * On new artifacts, auto-selects latest version + bumps iframeKey.
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  Rocket,
  Download,
  ExternalLink,
  Code as CodeIcon,
  Eye,
  Globe,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  studioApi,
  emitStudioRefresh,
  type StudioProject,
  type StudioArtifact,
  type SitePublication,
  STUDIO_API_BASE,
} from '@/lib/studioApi';
import { studioTheme as T, formatBytes, relativeTime } from './theme';
import { Spinner, StudioBadge, StudioButton } from './StudioPrimitives';
import { PublishModal } from './PublishModal';
import { SiteCodeViewer } from './SiteCodeViewer';

type Device = 'desktop' | 'tablet' | 'mobile';
type Tab = 'preview' | 'code' | 'pubs';

interface Props {
  project: StudioProject;
  artifacts: StudioArtifact[];
  onArtifactsChanged?: () => void;
}

const DEVICE_WIDTHS: Record<Device, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 375,
};

export function SitePreviewPane({ project, artifacts, onArtifactsChanged }: Props) {
  const siteArtifacts = useMemo(
    () => [...artifacts.filter((a) => a.kind === 'site')].sort((a, b) => b.version - a.version),
    [artifacts],
  );
  const latestVersion = siteArtifacts[0]?.version ?? null;

  const [tab, setTab] = useState<Tab>('preview');
  const [device, setDevice] = useState<Device>('desktop');
  const [selectedVersion, setSelectedVersion] = useState<number | null>(latestVersion);
  const [iframeKey, setIframeKey] = useState(0);
  const [showPublish, setShowPublish] = useState(false);
  const [publications, setPublications] = useState<SitePublication[]>([]);
  const lastSeenLatest = useRef<number | null>(latestVersion);

  // Auto-pin to latest when new artifact arrives
  useEffect(() => {
    if (latestVersion === null) return;
    if (lastSeenLatest.current === null) {
      lastSeenLatest.current = latestVersion;
      setSelectedVersion(latestVersion);
      return;
    }
    if (latestVersion > (lastSeenLatest.current ?? 0)) {
      lastSeenLatest.current = latestVersion;
      setSelectedVersion(latestVersion);
      setIframeKey((k) => k + 1);
      toast.success(`Site updated to v${latestVersion}`);
    }
  }, [latestVersion]);

  // Initial pubs load
  const loadPubs = useCallback(async () => {
    try {
      const r = await studioApi.listSitePublications(project.id);
      setPublications(r.publications);
    } catch {
      /* ignore */
    }
  }, [project.id]);

  useEffect(() => {
    loadPubs();
  }, [loadPubs]);

  // Keyboard shortcuts (right-pane scope)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (isTyping) return;
      const cmd = e.metaKey || e.ctrlKey;

      if (cmd && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowPublish(true);
        return;
      }
      if (e.key === '[') {
        e.preventDefault();
        cycleVersion(-1);
      } else if (e.key === ']') {
        e.preventDefault();
        cycleVersion(+1);
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setDevice((d) => (d === 'desktop' ? 'tablet' : d === 'tablet' ? 'mobile' : 'desktop'));
      }
    }
    function cycleVersion(dir: number) {
      if (siteArtifacts.length === 0 || selectedVersion === null) return;
      const idx = siteArtifacts.findIndex((a) => a.version === selectedVersion);
      const next = siteArtifacts[Math.min(siteArtifacts.length - 1, Math.max(0, idx + dir))];
      if (next) setSelectedVersion(next.version);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [siteArtifacts, selectedVersion]);

  const currentArtifact =
    siteArtifacts.find((a) => a.version === selectedVersion) ?? siteArtifacts[0] ?? null;

  const activePublication = publications.find((p) => p.is_active) ?? null;

  function handleRefresh() {
    setIframeKey((k) => k + 1);
  }

  function handleOpenInNewTab() {
    if (!currentArtifact || selectedVersion == null) return;
    const url = studioApi.sitePreviewUrl(project.id, selectedVersion, '');
    window.open(url, '_blank', 'noopener');
  }

  async function handleDownload() {
    if (!currentArtifact) return;
    try {
      const blob = await studioApi.downloadArtifact(project.id, currentArtifact.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentArtifact.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      toast.error(e?.message || 'Download failed');
    }
  }

  if (siteArtifacts.length === 0) {
    return <SiteEmptyState />;
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
        position: 'relative',
      }}
    >
      {/* Top tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '8px 12px',
          borderBottom: `1px solid ${T.border}`,
          background: T.bgChat,
          flexShrink: 0,
        }}
      >
        <TabBtn active={tab === 'preview'} onClick={() => setTab('preview')} icon={<Eye size={12} />}>
          Preview
        </TabBtn>
        <TabBtn active={tab === 'code'} onClick={() => setTab('code')} icon={<CodeIcon size={12} />}>
          Code
        </TabBtn>
        <TabBtn active={tab === 'pubs'} onClick={() => setTab('pubs')} icon={<Globe size={12} />}>
          Publications
          {publications.length > 0 && (
            <span style={{ marginLeft: 4 }}>
              <StudioBadge color={activePublication ? 'green' : 'gray'}>
                {publications.filter((p) => p.is_active).length}
              </StudioBadge>
            </span>
          )}
        </TabBtn>

        <div style={{ flex: 1 }} />

        {activePublication && (
          <a
            href={`${STUDIO_API_BASE}/s/${activePublication.subdomain}/`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              fontFamily: T.fontMono,
              color: T.success,
              textDecoration: 'none',
              padding: '4px 10px',
              borderRadius: 999,
              background: T.successDim,
              border: `1px solid ${T.successBorder}`,
            }}
            title="Open live site"
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: T.success,
                boxShadow: `0 0 8px ${T.success}`,
                animation: 'studio-pulse 1.6s ease-in-out infinite',
              }}
            />
            {activePublication.subdomain}
            <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Body */}
      {tab === 'preview' && (
        <PreviewBody
          project={project}
          artifact={currentArtifact}
          version={selectedVersion ?? 0}
          device={device}
          iframeKey={iframeKey}
        />
      )}

      {tab === 'code' && currentArtifact && (
        <SiteCodeViewer projectId={project.id} artifact={currentArtifact} />
      )}

      {tab === 'pubs' && (
        <ProjectPublicationsList
          publications={publications}
          projectId={project.id}
          onChange={loadPubs}
          onUpdateClick={(pub) => {
            setShowPublish(true);
          }}
        />
      )}

      {/* Footer toolbar */}
      {tab === 'preview' && currentArtifact && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderTop: `1px solid ${T.border}`,
            background: T.bgChat,
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          <FooterBtn onClick={handleRefresh} title="Reload (⌘R)">
            <RefreshCw size={13} />
          </FooterBtn>
          <DeviceToggle device={device} onChange={setDevice} />
          <VersionPicker
            artifacts={siteArtifacts}
            value={selectedVersion}
            onChange={(v) => {
              setSelectedVersion(v);
              setIframeKey((k) => k + 1);
            }}
          />
          <div style={{ flex: 1 }} />
          <FooterBtn onClick={handleOpenInNewTab} title="Open in new tab">
            <ExternalLink size={13} />
          </FooterBtn>
          <FooterBtn onClick={handleDownload} title="Download zip">
            <Download size={13} />
          </FooterBtn>
          <StudioButton
            iconLeft={<Rocket size={13} />}
            onClick={() => setShowPublish(true)}
            size="sm"
          >
            {activePublication ? 'Update live' : 'Publish'}
          </StudioButton>
        </div>
      )}

      <PublishModal
        open={showPublish}
        onClose={() => {
          setShowPublish(false);
          loadPubs();
        }}
        projectId={project.id}
        artifacts={artifacts}
        defaultArtifactId={currentArtifact?.id ?? null}
        existingPublication={activePublication}
        onPublished={() => {
          loadPubs();
          emitStudioRefresh('project', project.id);
        }}
      />
    </div>
  );
}

// ─── Preview body (iframe) ─────────────────────────────────────────────

function PreviewBody({
  project,
  artifact,
  version,
  device,
  iframeKey,
}: {
  project: StudioProject;
  artifact: StudioArtifact | null;
  version: number;
  device: Device;
  iframeKey: number;
}) {
  if (!artifact) return <SiteEmptyState />;

  // Desktop: iframe fills the entire pane (no centering, no padding).
  if (device === 'desktop') {
    return (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          position: 'relative',
          display: 'flex',
          background: '#fff',
        }}
      >
        <SiteIframe
          key={iframeKey}
          projectId={project.id}
          version={version}
          title={`Live preview of ${project.title || 'site'}, version ${version}`}
        />
      </div>
    );
  }

  // Tablet / mobile: centered device frame on a backdrop.
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 24,
        background:
          'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.06), rgba(245,158,11,0.04) 40%, transparent 70%), #0A0A0B',
        overflow: 'auto',
      }}
      className="studio-scroll"
    >
      <DeviceFrame device={device}>
        <SiteIframe
          key={iframeKey}
          projectId={project.id}
          version={version}
          title={`Live preview of ${project.title || 'site'}, version ${version}`}
        />
      </DeviceFrame>
    </div>
  );
}

function DeviceFrame({
  device,
  children,
}: {
  device: Device;
  children: React.ReactNode;
}) {
  const w = DEVICE_WIDTHS[device];
  const h = device === 'mobile' ? 667 : 1024;
  return (
    <div
      style={{
        width: w,
        height: h,
        maxWidth: '100%',
        background: '#000',
        border: '12px solid #18181B',
        borderRadius: device === 'mobile' ? 32 : 22,
        boxShadow: '0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
      }}
    >
      {children}
    </div>
  );
}

function SiteIframe({
  projectId,
  version,
  title,
}: {
  projectId: string;
  version: number;
  title: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  // The strategy: fetch the preview HTML first (with Authorization header) —
  // the proxy mirrors that bearer into a short-lived cookie. Then set the
  // iframe's `src` to the same proxy URL; the cookie now authenticates the
  // browser-initiated load AND every relative asset request (CSS, JS, ESM
  // module imports, etc.). Using `src` instead of `srcDoc` gives the iframe
  // a real same-origin URL, which is required for `<script type="importmap">`
  // and `<script type="module">` to resolve correctly — both are emitted by
  // the backend's React site sandbox engine.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setIframeSrc(null);
    studioApi
      .fetchPreviewHtml(projectId, version)
      .then(() => {
        if (cancelled) return;
        // Add a cache-busting param so changing versions remounts cleanly.
        const url = studioApi.sitePreviewUrl(projectId, version, '');
        setIframeSrc(`${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message || 'Failed to load preview');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, version]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', flex: 1, minHeight: 0 }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
            background: T.bg,
            zIndex: 2,
          }}
        >
          <Spinner size={28} />
          <span style={{ color: T.textDim, fontSize: 13 }}>Loading preview…</span>
        </div>
      )}
      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
            color: T.error,
            background: T.bg,
            padding: 24,
            textAlign: 'center',
            zIndex: 2,
          }}
        >
          <AlertCircle size={28} />
          <div style={{ fontSize: 13 }}>{error}</div>
          <a
            href={studioApi.sitePreviewUrl(projectId, version, '')}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: T.accent, fontSize: 12 }}
          >
            Open in new tab →
          </a>
        </div>
      )}
      {!error && iframeSrc && (
        <iframe
          src={iframeSrc}
          title={title}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setLoading(false)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: '#fff',
            display: 'block',
          }}
        />
      )}
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────

function SiteEmptyState() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 18,
        color: T.textDim,
        padding: 32,
        textAlign: 'center',
        background:
          'radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.08) 0%, transparent 70%), #0A0A0B',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 104,
          height: 104,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(99,102,241,0.18), rgba(99,102,241,0.04) 70%)',
          border: '1px dashed rgba(99,102,241,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 60px rgba(99,102,241,0.20)',
        }}
      >
        <Globe size={42} color={T.accent2} style={{ opacity: 0.85 }} />
      </div>
      <div style={{ maxWidth: 380 }}>
        <h3
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: T.text,
            marginBottom: 8,
          }}
        >
          Start a chat to build your site
        </h3>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: T.textSoft }}>
          Describe the website you want — a landing page, a portfolio, a résumé — and YANG
          will generate it. New versions appear here automatically.
        </p>
      </div>
    </div>
  );
}

// ─── Per-project publications list ─────────────────────────────────────

function ProjectPublicationsList({
  publications,
  projectId,
  onChange,
  onUpdateClick,
}: {
  publications: SitePublication[];
  projectId: string;
  onChange: () => void;
  onUpdateClick: (p: SitePublication) => void;
}) {
  if (publications.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: T.textDim,
          padding: 40,
          textAlign: 'center',
        }}
      >
        No publications yet. Click <strong style={{ color: T.accent, margin: '0 4px' }}>Publish</strong>{' '}
        to make this site live.
      </div>
    );
  }

  async function handleUnpublish(p: SitePublication) {
    if (!confirm(`Unpublish ${p.subdomain}? The public URL will return 404.`)) return;
    try {
      await studioApi.unpublishSite(projectId, p.id);
      toast.success('Unpublished');
      onChange();
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    }
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 18 }} className="studio-scroll">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {publications.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: 14,
              background: T.bgCard,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: p.is_active ? T.successDim : T.bgRaised,
                border: `1px solid ${p.is_active ? T.successBorder : T.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Globe size={18} color={p.is_active ? T.success : T.textMuted} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: T.fontDisplay,
                  fontSize: 14,
                  fontWeight: 700,
                  color: T.text,
                }}
              >
                {p.subdomain}
              </div>
              <div style={{ fontSize: 11.5, color: T.textMuted, fontFamily: T.fontMono }}>
                {p.is_active ? 'Active' : 'Inactive'} · {p.request_count} requests ·{' '}
                {relativeTime(p.published_at)}
              </div>
            </div>
            <a
              href={`${STUDIO_API_BASE}/s/${p.subdomain}/`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open"
              style={iconLinkStyle}
            >
              <ExternalLink size={14} />
            </a>
            <button
              title="Update version"
              onClick={() => onUpdateClick(p)}
              style={iconBtnSm()}
            >
              <RefreshCw size={14} />
            </button>
            {p.is_active && (
              <button
                title="Unpublish"
                onClick={() => handleUnpublish(p)}
                style={iconBtnSm(T.error)}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Small UI bits ─────────────────────────────────────────────────────

function TabBtn({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 12px',
        background: active ? T.accentDim : 'transparent',
        color: active ? T.accent : T.textMuted,
        border: active ? `1px solid ${T.accentBorder}` : '1px solid transparent',
        borderRadius: 8,
        cursor: 'pointer',
        fontFamily: T.fontDisplay,
        fontSize: 11.5,
        letterSpacing: '0.06em',
        fontWeight: 700,
        textTransform: 'uppercase',
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function FooterBtn({
  onClick,
  children,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: T.bgRaised,
        color: T.text,
        border: `1px solid ${T.border}`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = T.accentBorder;
        e.currentTarget.style.color = T.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.color = T.text;
      }}
    >
      {children}
    </button>
  );
}

function DeviceToggle({
  device,
  onChange,
}: {
  device: Device;
  onChange: (d: Device) => void;
}) {
  const items: Array<{ id: Device; icon: React.ReactNode; label: string }> = [
    { id: 'desktop', icon: <Monitor size={13} />, label: 'Desktop' },
    { id: 'tablet', icon: <Tablet size={13} />, label: 'Tablet' },
    { id: 'mobile', icon: <Smartphone size={13} />, label: 'Mobile' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        padding: 3,
        background: T.bgRaised,
        border: `1px solid ${T.border}`,
        borderRadius: 9,
      }}
    >
      {items.map((it) => {
        const active = device === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            title={it.label}
            style={{
              padding: '5px 9px',
              background: active ? T.accentDim : 'transparent',
              color: active ? T.accent : T.textMuted,
              border: active ? `1px solid ${T.accentBorder}` : '1px solid transparent',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {it.icon}
          </button>
        );
      })}
    </div>
  );
}

function VersionPicker({
  artifacts,
  value,
  onChange,
}: {
  artifacts: StudioArtifact[];
  value: number | null;
  onChange: (v: number) => void;
}) {
  const latest = artifacts[0]?.version;
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(parseInt(e.target.value))}
      style={{
        padding: '6px 26px 6px 10px',
        background: T.bgRaised,
        color: T.text,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        fontSize: 12,
        fontFamily: T.fontMono,
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage:
          'url("data:image/svg+xml,%3Csvg width=\'10\' height=\'6\' viewBox=\'0 0 10 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1L5 5L9 1\' stroke=\'%23606068\' stroke-width=\'1.5\' stroke-linecap=\'round\' fill=\'none\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
      }}
    >
      {artifacts.map((a) => (
        <option key={a.id} value={a.version} style={{ background: T.bgRaised }}>
          v{a.version}
          {a.version === latest ? ' · latest' : ''}
          {a.file_count ? ` · ${a.file_count} files` : ''}
          {a.size_bytes ? ` · ${formatBytes(a.size_bytes)}` : ''}
        </option>
      ))}
    </select>
  );
}

const iconLinkStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: `1px solid ${T.border}`,
  color: T.textMuted,
  textDecoration: 'none',
};

function iconBtnSm(color: string = T.textMuted): React.CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'transparent',
    border: `1px solid ${T.border}`,
    cursor: 'pointer',
    color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}
