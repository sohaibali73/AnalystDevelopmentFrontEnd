'use client';

/**
 * PublicationsPage — /studio/sites/publications
 * Lists all live sites across the user's projects with Open/Unpublish/Update actions.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Globe,
  ExternalLink,
  RefreshCw,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  studioApi,
  type SitePublication,
  type StudioProject,
  type StudioArtifact,
  STUDIO_API_BASE,
} from '@/lib/studioApi';
import { studioTheme as T, relativeTime } from '@/components/studio/theme';
import {
  StudioButton,
  StudioBadge,
  Spinner,
} from '@/components/studio/StudioPrimitives';
import { PublishModal } from '@/components/studio/PublishModal';

export default function PublicationsPage() {
  const router = useRouter();
  const [pubs, setPubs] = useState<SitePublication[]>([]);
  const [projects, setProjects] = useState<Record<string, StudioProject>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [updateTarget, setUpdateTarget] = useState<{
    pub: SitePublication;
    artifacts: StudioArtifact[];
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await studioApi.listAllPublications();
      setPubs(r.publications);

      // Fetch all projects once (single request) instead of N parallel calls,
      // which avoids backend rate limits.
      try {
        const pr = await studioApi.listProjects({ limit: 200, include_archived: true });
        const map: Record<string, StudioProject> = {};
        for (const proj of pr.projects) map[proj.id] = proj;
        setProjects(map);
      } catch {
        /* projects map is best-effort */
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUnpublish(p: SitePublication) {
    if (!confirm(`Unpublish ${p.subdomain}? The public URL will return 404.`)) return;
    try {
      await studioApi.unpublishSite(p.project_id, p.id);
      toast.success('Unpublished');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    }
  }

  async function openUpdate(p: SitePublication) {
    try {
      const ar = await studioApi.listArtifacts(p.project_id);
      setUpdateTarget({ pub: p, artifacts: ar.artifacts });
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load project');
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.text,
        fontFamily: T.font,
        padding: '40px 32px 80px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <button
          onClick={() => router.push('/studio')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            marginBottom: 20,
            background: 'transparent',
            color: T.textDim,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          <ArrowLeft size={14} /> Studio
        </button>

        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 4,
                height: 16,
                background: T.success,
                borderRadius: 2,
                boxShadow: `0 0 12px ${T.success}`,
              }}
            />
            <span
              style={{
                fontFamily: T.fontMono,
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: T.textMuted,
              }}
            >
              Sites · Publications
            </span>
          </div>
          <h1
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Live sites
          </h1>
          <p style={{ marginTop: 8, color: T.textMuted, fontSize: 13.5 }}>
            All sites you've published, across every project.
          </p>
        </div>

        {loading ? (
          <div
            style={{
              padding: 60,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              color: T.textDim,
            }}
          >
            <Spinner size={28} />
            <span style={{ fontSize: 13 }}>Loading publications…</span>
          </div>
        ) : error ? (
          <div
            style={{
              padding: 24,
              background: T.errorDim,
              border: `1px solid ${T.errorBorder}`,
              borderRadius: 12,
              color: T.error,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <AlertCircle size={18} />
              {error}
            </div>
            <StudioButton variant="outline" onClick={load}>
              Retry
            </StudioButton>
          </div>
        ) : pubs.length === 0 ? (
          <div
            style={{
              padding: '60px 24px',
              background: 'rgba(245,158,11,0.03)',
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              textAlign: 'center',
            }}
          >
            <Globe size={36} color={T.textMuted} style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontFamily: T.fontDisplay, fontSize: 22, marginBottom: 8 }}>
              You haven't published any sites yet
            </h3>
            <p style={{ color: T.textDim, marginBottom: 20 }}>
              Build a website project, then click Publish to make it live.
            </p>
            <StudioButton onClick={() => router.push('/studio')}>
              Browse projects
            </StudioButton>
          </div>
        ) : (
          <div
            style={{
              background: T.bgCard,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: T.font,
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: T.bgRaised,
                    fontFamily: T.fontMono,
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: T.textMuted,
                  }}
                >
                  <Th>Subdomain</Th>
                  <Th>Project</Th>
                  <Th>Status</Th>
                  <Th align="right">Requests</Th>
                  <Th>Published</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {pubs.map((p) => {
                  const proj = projects[p.project_id];
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderTop: `1px solid ${T.border}`,
                      }}
                    >
                      <Td>
                        <a
                          href={`${STUDIO_API_BASE}/s/${p.subdomain}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: T.text,
                            textDecoration: 'none',
                            fontFamily: T.fontMono,
                            fontWeight: 600,
                          }}
                        >
                          {p.subdomain}
                        </a>
                      </Td>
                      <Td>
                        <button
                          onClick={() => router.push(`/studio/projects/${p.project_id}`)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: T.textSoft,
                            padding: 0,
                            fontFamily: T.font,
                            fontSize: 13,
                            textAlign: 'left',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = T.accent)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = T.textSoft)
                          }
                        >
                          {proj?.title || '—'}
                        </button>
                      </Td>
                      <Td>
                        {p.is_active ? (
                          <StudioBadge color="green">Active</StudioBadge>
                        ) : (
                          <StudioBadge color="gray">Inactive</StudioBadge>
                        )}
                      </Td>
                      <Td align="right">
                        <span
                          style={{
                            fontFamily: T.fontMono,
                            color: T.textSoft,
                          }}
                        >
                          {p.request_count.toLocaleString()}
                        </span>
                      </Td>
                      <Td>
                        <span style={{ color: T.textMuted, fontSize: 12 }}>
                          {relativeTime(p.published_at)}
                        </span>
                      </Td>
                      <Td align="right">
                        <div
                          style={{
                            display: 'inline-flex',
                            gap: 6,
                            justifyContent: 'flex-end',
                          }}
                        >
                          <a
                            href={`${STUDIO_API_BASE}/s/${p.subdomain}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open"
                            style={iconBtnLink}
                          >
                            <ExternalLink size={13} />
                          </a>
                          <button
                            title="Update version"
                            onClick={() => openUpdate(p)}
                            style={iconBtnSm()}
                          >
                            <RefreshCw size={13} />
                          </button>
                          {p.is_active && (
                            <button
                              title="Unpublish"
                              onClick={() => handleUnpublish(p)}
                              style={iconBtnSm(T.error)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {updateTarget && (
        <PublishModal
          open
          onClose={() => {
            setUpdateTarget(null);
            load();
          }}
          projectId={updateTarget.pub.project_id}
          artifacts={updateTarget.artifacts}
          existingPublication={updateTarget.pub}
          defaultArtifactId={updateTarget.pub.artifact_id}
          onPublished={() => load()}
        />
      )}
    </div>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      style={{
        textAlign: align,
        padding: '12px 16px',
        fontWeight: 600,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <td
      style={{
        padding: '14px 16px',
        verticalAlign: 'middle',
        textAlign: align,
      }}
    >
      {children}
    </td>
  );
}

const iconBtnLink: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 7,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: `1px solid ${T.border}`,
  color: T.textMuted,
  textDecoration: 'none',
};

function iconBtnSm(color: string = T.textMuted): React.CSSProperties {
  return {
    width: 30,
    height: 30,
    borderRadius: 7,
    background: 'transparent',
    border: `1px solid ${T.border}`,
    cursor: 'pointer',
    color,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}
