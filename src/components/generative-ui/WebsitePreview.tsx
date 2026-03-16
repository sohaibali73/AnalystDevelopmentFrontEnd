'use client';

import React, { useState } from 'react';
import { ExternalLink, Globe, Shield, Clock, Monitor, Smartphone, Copy, CheckCircle } from 'lucide-react';

interface WebsitePreviewProps {
  url?: string;
  title?: string;
  description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  screenshot_url?: string;
  image?: string;
  favicon?: string;
  domain?: string;
  status_code?: number;
  load_time?: string | number;
  ssl?: boolean;
  tech_stack?: string[];
  technologies?: string[];
  meta_tags?: Record<string, string>;
  mobile_friendly?: boolean;
  error?: string;
  success?: boolean;
  [key: string]: any;
}

const techColors: Record<string, string> = {
  react: '#61DAFB',
  'next.js': '#fff',
  nextjs: '#fff',
  vue: '#42B883',
  angular: '#DD0031',
  svelte: '#FF3E00',
  tailwind: '#38BDF8',
  tailwindcss: '#38BDF8',
  typescript: '#3178C6',
  wordpress: '#21759B',
  python: '#3776AB',
  node: '#339933',
  'node.js': '#339933',
  django: '#092E20',
  shopify: '#7AB55C',
  vercel: '#fff',
  cloudflare: '#F38020',
  aws: '#FF9900',
  default: '#9CA3AF',
};

function getTechColor(tech: string) {
  return techColors[tech.toLowerCase()] || techColors.default;
}

export function WebsitePreview(props: WebsitePreviewProps) {
  const [copied, setCopied] = useState(false);
  const url = props.url || '';
  const title = props.title || props.og_title || '';
  const description = props.description || props.og_description || '';
  const image = props.og_image || props.screenshot_url || props.image || '';
  const domain = props.domain || (() => { try { return url ? new URL(url).hostname : ''; } catch { return ''; } })();
  const techs = props.tech_stack || props.technologies || [];

  if (props.success === false && props.error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '14px', maxWidth: '520px' }}>
        <strong>Preview Error:</strong> {props.error}
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f172a 100%)',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      maxWidth: '520px',
      marginTop: '8px',
    }}>
      {/* Browser chrome bar */}
      <div style={{
        padding: '10px 16px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', gap: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FF5F56' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27C93F' }} />
        </div>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderRadius: '6px', padding: '5px 10px',
        }}>
          {props.ssl !== false && <Shield size={10} color="#22C55E" />}
          {props.favicon && <img src={props.favicon} alt="" style={{ width: '12px', height: '12px', borderRadius: '2px' }} crossOrigin="anonymous" />}
          <span style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.5)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {domain || url}
          </span>
        </div>
      </div>

      {/* Preview image */}
      {image && (
        <div style={{
          position: 'relative',
          height: '180px', overflow: 'hidden',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <img
            src={image} alt={title || 'Website preview'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            crossOrigin="anonymous"
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '60px',
            background: 'linear-gradient(transparent, rgba(26,26,46,1))',
          }} />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
          {props.favicon && !image && (
            <img src={props.favicon} alt="" style={{ width: '24px', height: '24px', borderRadius: '4px', marginTop: '2px' }} crossOrigin="anonymous" />
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 4px',
              lineHeight: '1.3',
            }}>
              {title || domain || 'Website'}
            </h3>
            {description && (
              <p style={{
                fontSize: '12px', color: 'rgba(255,255,255,0.5)',
                margin: 0, lineHeight: '1.5',
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Meta badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
          {props.status_code && (
            <span style={{
              fontSize: '10px', fontWeight: 700,
              color: props.status_code === 200 ? '#22C55E' : '#EF4444',
              backgroundColor: props.status_code === 200 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              padding: '3px 8px', borderRadius: '6px',
            }}>
              HTTP {props.status_code}
            </span>
          )}
          {props.ssl !== undefined && (
            <span style={{
              fontSize: '10px', fontWeight: 700,
              color: props.ssl ? '#22C55E' : '#F59E0B',
              backgroundColor: props.ssl ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
              padding: '3px 8px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', gap: '3px',
            }}>
              <Shield size={8} /> {props.ssl ? 'SSL' : 'No SSL'}
            </span>
          )}
          {props.load_time && (
            <span style={{
              fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.5)',
              backgroundColor: 'rgba(255,255,255,0.06)',
              padding: '3px 8px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', gap: '3px',
            }}>
              <Clock size={8} /> {props.load_time}{typeof props.load_time === 'number' ? 's' : ''}
            </span>
          )}
          {props.mobile_friendly !== undefined && (
            <span style={{
              fontSize: '10px', fontWeight: 700,
              color: props.mobile_friendly ? '#22C55E' : '#9CA3AF',
              backgroundColor: props.mobile_friendly ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
              padding: '3px 8px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', gap: '3px',
            }}>
              {props.mobile_friendly ? <Smartphone size={8} /> : <Monitor size={8} />}
              {props.mobile_friendly ? 'Mobile Friendly' : 'Desktop Only'}
            </span>
          )}
        </div>

        {/* Tech stack */}
        {techs.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              Tech Stack
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {techs.map((tech, i) => (
                <span key={i} style={{
                  fontSize: '10px', fontWeight: 700,
                  color: getTechColor(tech),
                  backgroundColor: `${getTechColor(tech)}15`,
                  padding: '3px 8px', borderRadius: '6px',
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        padding: '10px 20px 14px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', gap: '8px',
      }}>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '8px 12px', borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#3B82F6',
              fontSize: '12px', fontWeight: 600, textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <ExternalLink size={14} />
            Visit Site
          </a>
        )}
        {url && (
          <button
            onClick={handleCopy}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '8px 12px', borderRadius: '8px',
              backgroundColor: copied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${copied ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: copied ? '#22C55E' : 'rgba(255,255,255,0.7)',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
        )}
      </div>
    </div>
  );
}

export default WebsitePreview;
