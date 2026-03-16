import { NextRequest } from 'next/server';

export const maxDuration = 60;

interface DocumentRequest {
  title: string;
  content: string;
  format?: 'markdown' | 'html' | 'document';
  style?: 'professional' | 'casual' | 'technical' | 'creative';
}

export async function POST(req: NextRequest) {
  try {
    const body: DocumentRequest = await req.json();
    
    if (!body.content || !body.title) {
      return Response.json(
        { error: 'Missing required fields: title and content' },
        { status: 400 }
      );
    }

    const { title, content, format = 'markdown', style = 'professional' } = body;

    // Generate styled HTML from markdown content
    const styledHTML = formatDocument(content, title, style);

    // Return artifact data
    return Response.json({
      success: true,
      artifact: {
        id: `doc-${Date.now()}`,
        type: 'document',
        language: 'markdown',
        title: title,
        code: styledHTML,
        artifactType: 'document',
      },
    });
  } catch (error) {
    console.error('[Generate Document]', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to generate document' },
      { status: 500 }
    );
  }
}

function formatDocument(content: string, title: string, style: string): string {
  // Basic markdown formatting with styling
  const escapedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Convert markdown-style formatting to HTML
  let html = escapedContent
    // Headers
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap in paragraphs if not already
  if (!html.startsWith('<p>')) {
    html = `<p>${html}</p>`;
  }
  html = html.replace(/<\/p><p>/g, '</p><p>').replace(/<p><\/p>/g, '');

  // Lists
  html = html
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    .replace(/(<li>.*?<\/li>)/gs, (match) => `<ul>${match}</ul>`)
    .replace(/<\/li>\n<li>/g, '</li><li>');

  const styleClasses = {
    professional:
      'font-family: "Quicksand", sans-serif; color: #1a1a1a; line-height: 1.7;',
    casual:
      'font-family: "Quicksand", sans-serif; color: #2a2a2a; line-height: 1.8;',
    technical:
      'font-family: "Monaco", "Courier New", monospace; color: #212121; line-height: 1.6;',
    creative:
      'font-family: "Quicksand", sans-serif; color: #1f2937; line-height: 1.9;',
  };

  const styles = styleClasses[style as keyof typeof styleClasses] || styleClasses.professional;

  return `
<div style="padding: 2rem; max-width: 900px; margin: 0 auto;">
  <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #FEC00F; text-transform: uppercase; letter-spacing: 0.5px;">
    ${title}
  </h1>
  <div style="${styles} max-width: 100%; overflow-wrap: break-word;">
    ${html}
  </div>
</div>
  `;
}
