'use client';

import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Copy, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="copy-code-btn"
      title={copied ? 'Copied!' : 'Copy code'}
      aria-label="Copy code"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span>{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  );
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  let isDark = true;
  try {
    const { resolvedTheme } = useTheme();
    isDark = resolvedTheme === 'dark';
  } catch {
    isDark = true;
  }

  return (
    <div className={`markdown-body ${isDark ? 'markdown-dark' : 'markdown-light'} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Code blocks with copy button and language label
          pre({ children, ...props }) {
            // Extract code text for copy button
            const codeElement = React.Children.toArray(children).find(
              (child) => React.isValidElement(child) && child.type === 'code'
            ) as React.ReactElement | undefined;

            let codeText = '';
            let language = '';

            if (codeElement && React.isValidElement(codeElement)) {
              // Get raw text content
              const extractText = (node: React.ReactNode): string => {
                if (typeof node === 'string') return node;
                if (Array.isArray(node)) return node.map(extractText).join('');
                if (React.isValidElement(node) && node.props) {
                  return extractText((node.props as Record<string, unknown>).children as React.ReactNode);
                }
                return '';
              };
              const codeProps = codeElement.props as Record<string, unknown>;
              codeText = extractText(codeProps.children as React.ReactNode).replace(/\n$/, '');

              // Extract language from className like "hljs language-python"
              const classNames = (codeProps.className as string) || '';
              const langMatch = classNames.match(/language-(\w+)/);
              language = langMatch ? langMatch[1] : '';
            }

            return (
              <div className="code-block-wrapper">
                <div className="code-block-header">
                  <span className="code-block-lang">{language || 'code'}</span>
                  <CopyButton text={codeText} />
                </div>
                <pre {...props}>{children}</pre>
              </div>
            );
          },

          // Inline code
          code({ className, children, ...props }) {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="inline-code" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },

          // Links open in new tab
          a({ href, children, ...props }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },

          // Tables with horizontal scroll
          table({ children, ...props }) {
            return (
              <div className="table-wrapper">
                <table {...props}>{children}</table>
              </div>
            );
          },

          // Images with max-width
          img({ src, alt, ...props }) {
            return (
              <img
                src={src}
                alt={alt || ''}
                loading="lazy"
                style={{ maxWidth: '100%', borderRadius: '8px', margin: '8px 0' }}
                {...props}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
