/**
 * Next.js API Route: /api/chat/v6
 * 
 * Direct proxy to backend's /chat/v6 endpoint using AI SDK Data Stream Protocol.
 * Bypasses protocol translation for cleaner AI SDK integration.
 */

import { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8080' 
    : 'https://developer-potomaac.up.railway.app//');

// Edge runtime: CPU-time billing prevents wall-clock timeouts during long streams.
export const runtime = 'edge';
// 300s for Vercel Pro (skills/tool calls can take 60-120s)
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages || [];
    const data = body.data || {};
    
    // Get the latest user message
    const lastUserMessage = messages
      .filter((m: any) => m.role === 'user')
      .pop();
    
    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({ error: 'No user message found' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract text content from parts-based or content-based message
    // AI SDK v6 sends messages with `parts` array, but also may have `content`
    let messageText = '';
    if (lastUserMessage.parts && Array.isArray(lastUserMessage.parts)) {
      messageText = lastUserMessage.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text || '')
        .join('');
    }
    // Fallback to content/text fields
    if (!messageText) {
      messageText = lastUserMessage.content || lastUserMessage.text || '';
    }
    
    if (!messageText.trim()) {
      return new Response(
        JSON.stringify({ error: 'Empty message content' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authToken = req.headers.get('authorization') || '';
    // conversationId comes from:
    // 1. sendMessage options body (request-level, merged at top level by DefaultChatTransport)
    // 2. transport-level body() callback (also merged at top level)
    const conversationId = body.conversationId || data.conversationId || null;

    // Append formatting instructions (same as /api/chat route)
    const formattingInstruction = '\n\n[FORMATTING: Do not use any emojis whatsoever in your response. Use clear, professional formatting with proper markdown headings, bullet points, and structured sections. Keep responses concise and data-driven.]';
    const enhancedMessage = messageText + formattingInstruction;

    // Forward directly to backend's new v6 endpoint (no protocol translation)
    const backendResponse = await fetch(`${API_BASE_URL}/chat/v6`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify({
        content: enhancedMessage,
        conversation_id: conversationId,
      }),
    });

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ 
        detail: `Backend error: ${backendResponse.status}` 
      }));
      return new Response(
        JSON.stringify({ error: error.detail || `HTTP ${backendResponse.status}` }), 
        { status: backendResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Pass through the response directly
    // NOTE: Backend sends old Data Stream Protocol (0:, 9:, a:, d:), NOT UI Message Stream SSE.
    // DefaultChatTransport expects UI Message Stream format. Use /api/chat instead for proper
    // protocol translation, or update the backend to send UI Message Stream format.
    const headers: Record<string, string> = {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    };

    // Forward conversation ID header if present
    const newConversationId = backendResponse.headers.get('X-Conversation-Id');
    if (newConversationId) {
      headers['X-Conversation-Id'] = newConversationId;
    }

    return new Response(backendResponse.body, { 
      status: 200, 
      headers 
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}