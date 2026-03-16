/**
 * ReactArtifact - Renders React/JSX components in a sandboxed iframe
 * FIXED: Component detection, IIFE scoping, recharts support, error visibility
 */

import React, { useEffect, useRef, useState } from 'react';

interface ReactArtifactProps {
  code: string;
  isDark: boolean;
  onError?: (error: string | null) => void;
}

export function ReactArtifact({ code, isDark, onError }: ReactArtifactProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    setLoading(true);
    setError(null);
    onError?.(null);

    // Clean code: strip imports/exports, preserve component definitions
    let cleanCode = code.trim();
    
    // Remove import statements (all variations)
    cleanCode = cleanCode.replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '');
    cleanCode = cleanCode.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');
    cleanCode = cleanCode.replace(/^import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');
    cleanCode = cleanCode.replace(/^import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
    
    // Convert `export default function App` → `function App`
    // Convert `export default App` → just remove it (handled separately)
    cleanCode = cleanCode.replace(/^export\s+default\s+function\s+/gm, 'function ');
    cleanCode = cleanCode.replace(/^export\s+default\s+class\s+/gm, 'class ');
    cleanCode = cleanCode.replace(/^export\s+default\s+(?!function|class)/gm, '// exported: ');
    cleanCode = cleanCode.replace(/^export\s+/gm, '');
    
    // Convert `const App = () =>` to `var App = () =>` so it's accessible at function scope
    cleanCode = cleanCode.replace(/^const\s+([A-Z]\w*)\s*=/gm, 'var $1 =');
    cleanCode = cleanCode.replace(/^let\s+([A-Z]\w*)\s*=/gm, 'var $1 =');
    
    cleanCode = cleanCode.replace(/^\s*\n/gm, '').trim();

    // Try to detect the component name from the code
    const componentNameMatch = cleanCode.match(/(?:var|function|class)\s+([A-Z]\w*)/);
    const componentName = componentNameMatch ? componentNameMatch[1] : 'App';
    
    // Build iframe HTML with CDN libs including recharts
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin></script>
    <script src="https://cdn.tailwindcss.com" crossorigin></script>
    <script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.min.js" crossorigin></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: ${isDark ? '#121212' : '#ffffff'};
            color: ${isDark ? '#ffffff' : '#212121'};
            padding: 16px;
            min-height: 100vh;
        }
        #root { width: 100%; min-height: calc(100vh - 32px); }
        .artifact-error {
            color: #DC2626; padding: 16px; border: 1px solid #DC2626;
            border-radius: 8px; background: rgba(220, 38, 38, 0.1);
            font-family: monospace; white-space: pre-wrap; word-break: break-word;
            font-size: 13px; line-height: 1.5;
        }
    </style>
</head>
<body class="${isDark ? 'dark' : ''}">
    <div id="root">
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;color:${isDark ? '#666' : '#999'}">
            Loading component...
        </div>
    </div>
    
    <script>
      // Make recharts components available globally (the AI often imports from 'recharts')
      if (window.Recharts) {
        Object.keys(window.Recharts).forEach(function(key) {
          window[key] = window.Recharts[key];
        });
      }
      
      // Make React hooks available globally
      var useState = React.useState;
      var useEffect = React.useEffect;
      var useRef = React.useRef;
      var useMemo = React.useMemo;
      var useCallback = React.useCallback;
      var useContext = React.useContext;
      var useReducer = React.useReducer;
      var createContext = React.createContext;
      var Fragment = React.Fragment;
    </script>

    <script type="text/babel" data-presets="react">
      try {
        // User code — var declarations are function-scoped, so they're accessible below
        ${cleanCode}
        
        // Detect the component
        var _Component = null;
        
        // Check by detected name first
        if (typeof ${componentName} !== 'undefined') {
          _Component = ${componentName};
        }
        // Common names
        else if (typeof App !== 'undefined') _Component = App;
        else if (typeof Main !== 'undefined') _Component = Main;
        else if (typeof Dashboard !== 'undefined') _Component = Dashboard;
        else if (typeof Page !== 'undefined') _Component = Page;
        else if (typeof Component !== 'undefined') _Component = Component;
        else if (typeof Home !== 'undefined') _Component = Home;
        else if (typeof StockDashboard !== 'undefined') _Component = StockDashboard;
        else if (typeof TradingDashboard !== 'undefined') _Component = TradingDashboard;
        else if (typeof Chart !== 'undefined') _Component = Chart;
        
        if (_Component && typeof _Component === 'function') {
          var root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement(_Component));
          window.parent.postMessage({ type: 'REACT_ARTIFACT_LOADED' }, '*');
        } else {
          throw new Error(
            "No React component found. The component should be a function starting with a capital letter (e.g., 'App', 'Dashboard')." +
            "\\n\\nDetected names: " + typeof ${componentName}
          );
        }
      } catch (err) {
        console.error("Artifact Error:", err);
        document.getElementById('root').innerHTML = 
          '<div class="artifact-error">' +
          '<strong>⚠ Render Error</strong>\\n\\n' +
          (err.message || String(err)).replace(/</g, '&lt;') +
          '</div>';
        window.parent.postMessage({ type: 'REACT_ARTIFACT_ERROR', error: err.message || String(err) }, '*');
      }
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'REACT_ARTIFACT_LOADED') {
        setLoading(false);
      } else if (event.data?.type === 'REACT_ARTIFACT_ERROR') {
        setLoading(false);
        setError(event.data.error);
        onError?.(event.data.error);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
    
    const timeout = setTimeout(() => setLoading(false), 8000);

    return () => {
      window.removeEventListener('message', handleMessage);
      URL.revokeObjectURL(url);
      clearTimeout(timeout);
    };
  }, [code, isDark, onError]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor: isDark ? '#121212' : '#ffffff',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {loading && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: isDark ? '#121212' : '#ffffff', zIndex: 10,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: isDark ? '#9E9E9E' : '#757575' }}>
            <div style={{
              width: '32px', height: '32px',
              border: `3px solid ${isDark ? '#424242' : '#e0e0e0'}`,
              borderTopColor: '#FEC00F', borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <span style={{ fontSize: '13px' }}>Loading React component...</span>
          </div>
        </div>
      )}
      {error && !loading && (
        <div style={{
          position: 'absolute', bottom: '8px', left: '8px', right: '8px',
          padding: '8px 12px', backgroundColor: 'rgba(220, 38, 38, 0.9)',
          borderRadius: '8px', color: '#fff', fontSize: '12px', zIndex: 5,
          maxHeight: '80px', overflow: 'auto',
        }}>
          ⚠ {error}
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="React Preview"
        sandbox="allow-scripts allow-same-origin"
        style={{
          width: '100%', height: '100%', border: 'none',
          minHeight: '400px', display: 'block',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default ReactArtifact;
