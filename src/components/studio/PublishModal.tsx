'use client';

/**
 * PublishModal — pick a subdomain + version → POST publish.
 * Debounces availability checks against /studio/sites/check/{sub}.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Globe, ExternalLink, Copy, Check, Rocket, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  studioApi,
  type StudioArtifact,
  type SitePublication,
  type SitePublishResponse,
} from '@/lib/studioApi';
import { studioTheme as T } from './theme';
import {
  StudioModal,
  StudioButton,
  StudioInput,
  StudioSelect,
  Spinner,
  StudioBadge,
} from './StudioPrimitives';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  artifacts: StudioArtifact[];
  defaultArtifactId?: string | null;
  /** If editing/updating an existing publication, pre-fill its subdomain. */
  existingPublication?: SitePublication | null;
  onPublished?: (resp: SitePublishResponse) => void;
}

const RESERVED_HINT = 'Letters, numbers and hyphens only. 3-63 chars.';

export function PublishModal({
  open,
  onClose,
  projectId,
  artifacts,
  defaultArtifactId,
  existingPublication,
  onPublished,
}: Props) {
  const siteArtifacts = useMemo(
    () =>
      [...artifacts.filter((a) => a.kind === 'site')].sort((a, b) => b.version - a.version),
    [artifacts],
  );

  const [subdomain, setSubdomain] = useState('');
  const [artifactId, setArtifactId] = useState<string>('');
  const [check, setCheck] = useState<{ status: 'idle' | 'checking' | 'ok' | 'bad'; reason?: string }>(
    { status: 'idle' },
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SitePublishResponse | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setSubmitting(false);
    setCheck({ status: 'idle' });
    setSubdomain(existingPublication?.subdomain ?? '');
    setArtifactId(
      defaultArtifactId ||
        existingPublication?.artifact_id ||
        siteArtifacts[0]?.id ||
        '',
    );
  }, [open, defaultArtifactId, existingPublication, siteArtifacts]);

  // Client-side normalization (defence in depth)
  function normalizeSub(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 63);
  }

  function localValidate(v: string): string | null {
    if (!v) return 'Subdomain is required';
    if (v.length < 3) return 'Must be at least 3 characters';
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(v))
      return 'Cannot start/end with a hyphen';
    return null;
  }

  // Debounced availability check
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!subdomain) {
      setCheck({ status: 'idle' });
      return;
    }
    const localErr = localValidate(subdomain);
    if (localErr) {
      setCheck({ status: 'bad', reason: localErr });
      return;
    }
    // If unchanged from existing, treat as OK without hitting API
    if (existingPublication && existingPublication.subdomain === subdomain) {
      setCheck({ status: 'ok' });
      return;
    }
    setCheck({ status: 'checking' });
    debounceRef.current = window.setTimeout(async () => {
      try {
        const r = await studioApi.checkSubdomain(subdomain);
        if (r.available) setCheck({ status: 'ok' });
        else setCheck({ status: 'bad', reason: r.reason || 'Unavailable' });
      } catch (e: any) {
        setCheck({ status: 'bad', reason: e?.message || 'Check failed' });
      }
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [subdomain, open, existingPublication]);

  const isUpdate =
    existingPublication && existingPublication.subdomain === subdomain;

  const canSubmit =
    !submitting && !!artifactId && (check.status === 'ok' || isUpdate);

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const r = await studioApi.publishSite(projectId, {
        artifact_id: artifactId,
        subdomain,
      });
      setResult(r);
      onPublished?.(r);
      toast.success(isUpdate ? 'Site updated' : 'Published live!');
    } catch (e: any) {
      toast.error(e?.message || 'Publish failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StudioModal
      open={open}
      onClose={onClose}
      title={result ? 'Site is live' : isUpdate ? 'Update live site' : 'Publish website'}
      width={560}
    >
      {!result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Field label="Version">
            <StudioSelect<string>
              value={artifactId}
              onChange={setArtifactId}
              options={siteArtifacts.map((a) => ({
                value: a.id,
                label: `v${a.version} · ${a.filename}`,
              }))}
              style={{ width: '100%' }}
            />
          </Field>

          <Field label="Subdomain">
            <div style={{ position: 'relative' }}>
              <StudioInput
                value={subdomain}
                onChange={(v) => setSubdomain(normalizeSub(v))}
                placeholder="my-portfolio"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSubmit) handleSubmit();
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {check.status === 'checking' && <Spinner size={14} />}
                {check.status === 'ok' && <Check size={16} color={T.success} />}
                {check.status === 'bad' && <AlertCircle size={16} color={T.error} />}
              </div>
            </div>
            <Hint
              kind={
                check.status === 'bad'
                  ? 'error'
                  : check.status === 'ok'
                  ? 'ok'
                  : 'muted'
              }
            >
              {check.status === 'bad'
                ? check.reason || 'Unavailable'
                : check.status === 'ok'
                ? isUpdate
                  ? 'This is your current subdomain — submitting will update it to the selected version.'
                  : 'Available!'
                : RESERVED_HINT}
            </Hint>
          </Field>

          <div
            style={{
              padding: 12,
              background: T.bgRaised,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              fontSize: 12,
              color: T.textMuted,
              lineHeight: 1.55,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <Globe size={14} color={T.accent} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ color: T.text }}>Publishing makes your site public.</strong>
              <br />
              Anyone with the URL will be able to view it. You can unpublish at any time.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <StudioButton variant="ghost" onClick={onClose}>
              Cancel
            </StudioButton>
            <StudioButton
              onClick={handleSubmit}
              disabled={!canSubmit}
              iconLeft={
                submitting ? <Spinner size={13} color="#0a0a0a" /> : <Rocket size={14} />
              }
            >
              {isUpdate ? 'Update live site' : 'Publish'}
            </StudioButton>
          </div>
        </div>
      ) : (
        <SuccessState result={result} onClose={onClose} />
      )}
    </StudioModal>
  );
}

function SuccessState({
  result,
  onClose,
}: {
  result: SitePublishResponse;
  onClose: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 14,
          background: T.successDim,
          border: `1px solid ${T.successBorder}`,
          borderRadius: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(16,185,129,0.20)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Rocket size={18} color={T.success} />
        </div>
        <div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 700, color: T.text }}>
            Your site is live
          </div>
          <div style={{ fontSize: 12, color: T.textMuted }}>
            Subdomain <code>{result.publication.subdomain}</code> · v
            {result.publication.artifact_id ? '' : ''}
          </div>
        </div>
      </div>

      <UrlChip label="Public URL (works now)" url={result.urls.path_url} primary />
      <UrlChip label="Subdomain URL" url={result.urls.subdomain_url} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
        <StudioButton variant="ghost" onClick={onClose}>
          Close
        </StudioButton>
        <StudioButton
          iconLeft={<ExternalLink size={14} />}
          onClick={() => window.open(result.urls.path_url, '_blank', 'noopener')}
        >
          Open site
        </StudioButton>
      </div>
    </div>
  );
}

function UrlChip({ label, url, primary }: { label: string; url: string; primary?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: T.textMuted,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          background: primary ? T.accentDim : T.bgRaised,
          border: `1px solid ${primary ? T.accentBorder : T.border}`,
          borderRadius: 10,
          fontSize: 13,
          fontFamily: T.fontMono,
          color: T.text,
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {url}
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          title="Copy"
          style={iconBtnStyle}
        >
          {copied ? <Check size={13} color={T.success} /> : <Copy size={13} />}
        </button>
        <button
          onClick={() => window.open(url, '_blank', 'noopener')}
          title="Open"
          style={iconBtnStyle}
        >
          <ExternalLink size={13} />
        </button>
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  color: T.textMuted,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: T.textMuted,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Hint({ children, kind }: { children: React.ReactNode; kind: 'ok' | 'error' | 'muted' }) {
  const color =
    kind === 'ok' ? T.success : kind === 'error' ? T.error : T.textMuted;
  return (
    <div style={{ fontSize: 11.5, color, marginTop: 6, fontFamily: T.font }}>{children}</div>
  );
}
