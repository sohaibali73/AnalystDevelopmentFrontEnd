/**
 * MermaidArtifact - Renders Mermaid diagrams (flowcharts, sequence diagrams, etc.)
 */

import React, { useEffect, useRef, useState } from 'react';

interface MermaidArtifactProps {
  code: string;
  isDark: boolean;
  onError?: (error: string | null) => void;
}

export function MermaidArtifact({ code, isDark, onError }: MermaidArtifactProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const renderMermaid = async () => {
      try {
        setLoading(true);
        onError?.(null);
        
        // Dynamically import mermaid
        const mermaid = (await import('mermaid')).default;
        
        // Initialize mermaid with theme
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: "'Quicksand', sans-serif",
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
          },
          themeVariables: isDark ? {
            primaryColor: '#FEC00F',
            primaryTextColor: '#121212',
            primaryBorderColor: '#424242',
            lineColor: '#9E9E9E',
            secondaryColor: '#2A2A2A',
            tertiaryColor: '#1E1E1E',
            textColor: '#FFFFFF',
            mainBkg: '#1E1E1E',
            nodeBorder: '#FEC00F',
          } : {
            primaryColor: '#FEC00F',
            primaryTextColor: '#212121',
            primaryBorderColor: '#e0e0e0',
            lineColor: '#757575',
            secondaryColor: '#f5f5f5',
            tertiaryColor: '#ffffff',
          },
        });

        // Generate unique ID for this render
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(id, code);
        
        if (isMounted) {
          setSvg(renderedSvg);
          setLoading(false);
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        if (isMounted) {
          setLoading(false);
          onError?.(`Failed to render diagram: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    };

    renderMermaid();

    return () => {
      isMounted = false;
    };
  }, [code, isDark, onError]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        color: isDark ? '#9E9E9E' : '#757575',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: `3px solid ${isDark ? '#424242' : '#e0e0e0'}`,
            borderTopColor: '#FEC00F',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <span style={{ fontSize: '13px' }}>Rendering diagram...</span>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'auto',
        backgroundColor: isDark ? '#1E1E1E' : '#ffffff',
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default MermaidArtifact;
