'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, ExternalLink } from 'lucide-react';
import { CodeBlock, CodeBlockHeader, CodeBlockTitle, CodeBlockActions, CodeBlockCopyButton } from '@/components/ai-elements/code-block';
import {
  WebPreview, WebPreviewNavigation, WebPreviewBody, WebPreviewConsole,
} from '@/components/ai-elements/web-preview';

interface HTMLArtifactPreviewProps {
  blobUrl: string;
  code: string;
  language: string;
  title: string;
  isDark: boolean;
}

export function HTMLArtifactPreview({ blobUrl, code, language, title, isDark }: HTMLArtifactPreviewProps) {
  const [showCode, setShowCode] = useState(false);

  const T = {
    text: isDark ? '#EFEFEF' : '#0A0A0B',
    muted: isDark ? '#606068' : '#808088',
    border: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    card: isDark ? '#0D0D10' : '#FFFFFF',
    bg: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    hoverBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    accent: '#60A5FA',
  };

  return (
    <div style={{
      borderRadius: '12px',
      border: `1px solid ${T.border}`,
      overflow: 'hidden',
      background: T.card,
    }}>
      {/* Interactive Preview - Full Width */}
      <div style={{ position: 'relative' }}>
        <WebPreview defaultUrl={blobUrl} style={{ height: '450px', width: '100%' }}>
          <WebPreviewNavigation>
            <span style={{
              fontSize: '11px',
              color: T.muted,
              padding: '0 8px',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: "'DM Mono', monospace",
            }}>
              {title} Preview
            </span>
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                color: T.accent,
                textDecoration: 'none',
                transition: 'background .15s',
                fontFamily: "'DM Mono', monospace",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.hoverBg; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <ExternalLink size={10} />
              Open
            </a>
          </WebPreviewNavigation>
          <WebPreviewBody />
          <WebPreviewConsole />
        </WebPreview>
      </div>

      {/* Code Toggle - Collapsible */}
      <div style={{ borderTop: `1px solid ${T.border}` }}>
        <button
          onClick={() => setShowCode(!showCode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '10px 14px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: T.muted,
            fontSize: '11px',
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            transition: 'background .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.hoverBg; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          {showCode ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>{language.toUpperCase()} Code</span>
          <span style={{
            marginLeft: 'auto',
            fontSize: '10px',
            color: T.muted,
            opacity: 0.7,
          }}>
            {code.split('\n').length} lines
          </span>
        </button>

        {showCode && (
          <div style={{ borderTop: `1px solid ${T.border}` }}>
            <CodeBlock
              code={code}
              language={language as any}
              showLineNumbers
            >
              <CodeBlockHeader>
                <CodeBlockTitle>{title}</CodeBlockTitle>
                <CodeBlockActions>
                  <CodeBlockCopyButton />
                </CodeBlockActions>
              </CodeBlockHeader>
            </CodeBlock>
          </div>
        )}
      </div>
    </div>
  );
}

export default HTMLArtifactPreview;