/**
 * CodeArtifact - Renders code with syntax highlighting
 */

import React from 'react';

interface CodeArtifactProps {
  code: string;
  language: string;
  isDark: boolean;
}

// Simple syntax highlighting for common languages
const syntaxHighlight = (code: string, language: string, isDark: boolean) => {
  const colors = {
    keyword: isDark ? '#FF79C6' : '#D63384',
    string: isDark ? '#F1FA8C' : '#032F62',
    comment: isDark ? '#6272A4' : '#6A737D',
    number: isDark ? '#BD93F9' : '#005CC5',
    function: isDark ? '#50FA7B' : '#6F42C1',
    operator: isDark ? '#FF79C6' : '#D63384',
    variable: isDark ? '#8BE9FD' : '#E36209',
    default: isDark ? '#F8F8F2' : '#24292E',
  };

  // Define keywords for different languages
  const keywords: Record<string, string[]> = {
    afl: [
      'Buy', 'Sell', 'Short', 'Cover', 'Filter', 'PositionSize', 'PositionScore',
      'SetOption', 'SetTradeDelays', 'Param', 'Optimize', 'Plot', 'PlotShapes',
      'MA', 'EMA', 'RSI', 'ATR', 'ADX', 'MACD', 'Cross', 'Ref', 'IIf', 'ExRem',
      'Foreign', 'TimeFrameSet', 'TimeFrameRestore', 'TimeFrameExpand',
      'Close', 'Open', 'High', 'Low', 'Volume', 'True', 'False',
      '_SECTION_BEGIN', '_SECTION_END', 'AddColumn', 'printf', 'StrFormat',
    ],
    javascript: [
      'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
      'class', 'extends', 'import', 'export', 'default', 'from', 'async', 'await',
      'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined',
    ],
    jsx: [
      'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
      'class', 'extends', 'import', 'export', 'default', 'from', 'async', 'await',
      'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined',
      'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'React',
    ],
    python: [
      'def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for',
      'while', 'try', 'except', 'with', 'as', 'yield', 'lambda', 'pass', 'break',
      'continue', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is',
    ],
    html: [
      'html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'table', 'tr', 'td',
      'th', 'form', 'input', 'button', 'select', 'option', 'style', 'script',
    ],
  };

  const langKeywords = keywords[language.toLowerCase()] || keywords.javascript || [];
  
  // Escape HTML
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Highlight strings (single and double quotes)
  highlighted = highlighted.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    `<span style="color: ${colors.string}">$1</span>`
  );

  // Highlight comments (// and /* */ and #)
  highlighted = highlighted.replace(
    /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm,
    `<span style="color: ${colors.comment}">$1</span>`
  );

  // Highlight numbers
  highlighted = highlighted.replace(
    /\b(\d+\.?\d*)\b/g,
    `<span style="color: ${colors.number}">$1</span>`
  );

  // Highlight keywords
  langKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
    highlighted = highlighted.replace(
      regex,
      `<span style="color: ${colors.keyword}; font-weight: 600;">$1</span>`
    );
  });

  return highlighted;
};

export function CodeArtifact({ code, language, isDark }: CodeArtifactProps) {
  const highlightedCode = syntaxHighlight(code, language, isDark);
  
  // Split into lines for line numbers
  const lines = code.split('\n');

  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflow: 'auto',
      backgroundColor: isDark ? '#0D1117' : '#f6f8fa',
    }}>
      <div style={{
        display: 'flex',
        minWidth: '100%',
      }}>
        {/* Line Numbers */}
        <div style={{
          minWidth: '50px',
          padding: '16px 12px',
          backgroundColor: isDark ? '#0D1117' : '#f6f8fa',
          borderRight: `1px solid ${isDark ? '#30363D' : '#e1e4e8'}`,
          textAlign: 'right',
          userSelect: 'none',
          fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
          fontSize: '13px',
          lineHeight: 1.6,
          color: isDark ? '#484F58' : '#6e7681',
          position: 'sticky',
          left: 0,
        }}>
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Content */}
        <pre style={{
          flex: 1,
          margin: 0,
          padding: '16px',
          fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
          fontSize: '13px',
          lineHeight: 1.6,
          color: isDark ? '#C9D1D9' : '#24292E',
          whiteSpace: 'pre',
          overflow: 'visible',
        }}>
          <code
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>
    </div>
  );
}

export default CodeArtifact;
