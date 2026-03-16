/**
 * HTMLArtifact - Renders HTML content in a sandboxed iframe
 */

import React, { useEffect, useRef } from 'react';

interface HTMLArtifactProps {
  code: string;
  isDark: boolean;
}

export function HTMLArtifact({ code, isDark }: HTMLArtifactProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const cleanCode = code.trim();
    let htmlContent = cleanCode;
    
    // If it's not a complete HTML document, wrap it
    if (!cleanCode.startsWith('<!DOCTYPE html>') && !cleanCode.startsWith('<html')) {
      htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Quicksand', sans-serif;
            background: ${isDark ? '#121212' : '#ffffff'};
            color: ${isDark ? '#ffffff' : '#212121'};
            padding: 16px;
            line-height: 1.6;
        }
        a {
            color: #FEC00F;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-bottom: 0.5em;
        }
        p {
            margin-bottom: 1em;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1em;
        }
        th, td {
            border: 1px solid ${isDark ? '#424242' : '#e0e0e0'};
            padding: 8px 12px;
            text-align: left;
        }
        th {
            background: ${isDark ? '#2A2A2A' : '#f5f5f5'};
        }
        code {
            background: ${isDark ? '#2A2A2A' : '#f5f5f5'};
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Fira Code', monospace;
        }
        pre {
            background: ${isDark ? '#0D1117' : '#f5f5f5'};
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            margin-bottom: 1em;
        }
        pre code {
            background: none;
            padding: 0;
        }
    </style>
</head>
<body>
    ${cleanCode}
</body>
</html>`;
    }

    // Create blob URL for the iframe
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    iframeRef.current.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [code, isDark]);

  return (
    <iframe
      ref={iframeRef}
      title="HTML Preview"
      sandbox="allow-scripts"
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        minHeight: '300px',
        backgroundColor: isDark ? '#121212' : '#ffffff',
      }}
    />
  );
}

export default HTMLArtifact;
