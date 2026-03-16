'use client';

import React, { useState } from 'react';
import { Copy, ExternalLink, ThumbsUp, MessageCircle, Repeat2, Send, CheckCircle, Globe, Briefcase } from 'lucide-react';

interface LinkedInPostProps {
  author_name?: string;
  author_headline?: string;
  author_avatar?: string;
  content?: string;
  post_text?: string;
  hashtags?: string[];
  likes?: number;
  comments?: number;
  shares?: number;
  reposts?: number;
  impressions?: number;
  post_url?: string;
  url?: string;
  visibility?: string;
  image_url?: string;
  created_at?: string;
  error?: string;
  success?: boolean;
  [key: string]: any;
}

function formatNumber(n?: number) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function highlightHashtags(text: string) {
  const parts = text.split(/(#\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('#') ? (
      <span key={i} style={{ color: '#3B82F6', fontWeight: 600 }}>{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function LinkedInPost(props: LinkedInPostProps) {
  const [copied, setCopied] = useState(false);
  const content = props.content || props.post_text || '';
  const authorName = props.author_name || 'LinkedIn User';
  const authorHeadline = props.author_headline || '';
  const likes = props.likes ?? 0;
  const comments = props.comments ?? 0;
  const shares = props.shares ?? props.reposts ?? 0;
  const postUrl = props.post_url || props.url || '';

  if (props.success === false && props.error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '14px', maxWidth: '520px' }}>
        <strong>LinkedIn Error:</strong> {props.error}
      </div>
    );
  }

  const handleCopy = () => {
    const fullText = content + (props.hashtags?.length ? '\n\n' + props.hashtags.map(h => `#${h}`).join(' ') : '');
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const initials = authorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

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
      {/* LinkedIn-style header bar */}
      <div style={{
        padding: '4px 20px', background: 'linear-gradient(90deg, #0077B5, #0A66C2)',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <Briefcase size={10} color="#fff" />
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', letterSpacing: '1px', textTransform: 'uppercase' }}>LinkedIn Post Preview</span>
      </div>

      {/* Author */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {props.author_avatar ? (
          <img src={props.author_avatar} alt={authorName} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #0077B5, #0A66C2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 800, color: '#fff',
          }}>
            {initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{authorName}</div>
          {authorHeadline && (
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {authorHeadline}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            {props.created_at && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{props.created_at}</span>}
            <Globe size={10} color="rgba(255,255,255,0.3)" />
          </div>
        </div>
      </div>

      {/* Post content */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.85)',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {highlightHashtags(content)}
        </div>

        {/* Extra hashtags */}
        {props.hashtags && props.hashtags.length > 0 && (
          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {props.hashtags.map((tag, i) => (
              <span key={i} style={{
                fontSize: '11px', fontWeight: 600, color: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                padding: '3px 8px', borderRadius: '6px',
              }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Image preview */}
        {props.image_url && (
          <div style={{
            marginTop: '12px', borderRadius: '8px', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <img
              src={props.image_url} alt="Post image"
              style={{ width: '100%', maxHeight: '260px', objectFit: 'cover' }}
              crossOrigin="anonymous"
            />
          </div>
        )}
      </div>

      {/* Engagement stats */}
      <div style={{
        padding: '8px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'linear-gradient(135deg, #0077B5, #E7A33E)',
            borderRadius: '10px', padding: '2px',
          }}>
            <ThumbsUp size={10} color="#fff" />
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{formatNumber(likes)}</span>
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', display: 'flex', gap: '10px' }}>
          {comments > 0 && <span>{formatNumber(comments)} comments</span>}
          {shares > 0 && <span>{formatNumber(shares)} reposts</span>}
          {props.impressions && props.impressions > 0 && <span>{formatNumber(props.impressions)} views</span>}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{
        padding: '8px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', gap: '4px',
      }}>
        {[
          { icon: <ThumbsUp size={14} />, label: 'Like' },
          { icon: <MessageCircle size={14} />, label: 'Comment' },
          { icon: <Repeat2 size={14} />, label: 'Repost' },
          { icon: <Send size={14} />, label: 'Send' },
        ].map((action, i) => (
          <div key={i} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '8px', borderRadius: '8px',
            color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600,
            cursor: 'default',
            transition: 'background-color 0.2s ease',
          }}>
            {action.icon}
            <span style={{ display: 'none' }}>{action.label}</span>
          </div>
        ))}
      </div>

      {/* Copy / Open actions */}
      <div style={{
        padding: '10px 20px 14px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', gap: '8px',
      }}>
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
          {copied ? 'Copied!' : 'Copy Text'}
        </button>
        {postUrl && (
          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '8px 12px', borderRadius: '8px',
              backgroundColor: 'rgba(0, 119, 181, 0.15)',
              border: '1px solid rgba(0, 119, 181, 0.3)',
              color: '#0077B5',
              fontSize: '12px', fontWeight: 600, textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <ExternalLink size={14} />
            Open on LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}

export default LinkedInPost;
