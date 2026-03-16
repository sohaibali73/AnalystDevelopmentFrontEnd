import React from 'react';

interface DocumentArtifactProps {
  code: string;
  isDark: boolean;
}

export function DocumentArtifact({ code, isDark }: DocumentArtifactProps) {
  const colors = {
    background: isDark ? '#0F0F0F' : '#ffffff',
    text: isDark ? '#E8E8E8' : '#1A1A1A',
    textMuted: isDark ? '#B0B0B0' : '#666666',
    border: isDark ? '#333333' : '#e5e5e5',
    headingColor: '#FEC00F',
  };

  return (
    <div style={{
      padding: '32px',
      backgroundColor: colors.background,
      color: colors.text,
      minHeight: '100%',
      fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
      lineHeight: '1.7',
      fontSize: '15px',
    }}>
      <div className="markdown-body" dangerouslySetInnerHTML={{ __html: code }} />
    </div>
  );
}
