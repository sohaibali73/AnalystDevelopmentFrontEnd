/**
 * Potomac Analyst Workbench — Full Stress Test Script
 * 
 * Records all interactions start-to-finish and logs all errors.
 * Run with: node scripts/stress-test.js
 * 
 * Outputs: stress-test-results.json + stress-test-report.txt
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = process.env.API_URL || 'https://potomac-analyst-workbench-production.up.railway.app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'sohaib.ali@potomac.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Potomac1234';
const LOG_FILE = path.join(__dirname, '..', 'stress-test-results.json');
const REPORT_FILE = path.join(__dirname, '..', 'stress-test-report.txt');

// Results storage
const results = {
  startTime: new Date().toISOString(),
  config: { BACKEND_URL, FRONTEND_URL },
  tests: [],
  summary: { total: 0, passed: 0, failed: 0, errors: [] },
};

// Logging
function log(msg) {
  const ts = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${ts}] ${msg}`);
}

function logError(msg) {
  const ts = new Date().toISOString().split('T')[1].split('.')[0];
  console.error(`[${ts}] ❌ ${msg}`);
}

// Test runner
async function runTest(name, fn) {
  const test = { name, startTime: Date.now(), status: 'running', response: null, error: null, duration: 0 };
  log(`🔄 Testing: ${name}`);
  
  try {
    const result = await fn();
    test.status = 'passed';
    test.response = typeof result === 'object' ? result : { data: result };
    test.duration = Date.now() - test.startTime;
    log(`✅ PASSED: ${name} (${test.duration}ms)`);
    results.summary.passed++;
  } catch (err) {
    test.status = 'failed';
    test.error = {
      message: err.message,
      status: err.status || null,
      body: err.body || null,
      stack: err.stack?.split('\n').slice(0, 3).join('\n'),
    };
    test.duration = Date.now() - test.startTime;
    logError(`FAILED: ${name} — ${err.message} (${test.duration}ms)`);
    results.summary.failed++;
    results.summary.errors.push({ test: name, error: err.message });
  }
  
  results.tests.push(test);
  results.summary.total++;
  return test;
}

// HTTP helper with full logging
async function fetchWithLog(url, options = {}) {
  const startTime = Date.now();
  let response;
  
  try {
    response = await fetch(url, { 
      ...options, 
      signal: AbortSignal.timeout(30000) // 30s timeout
    });
  } catch (err) {
    const error = new Error(`Network error: ${err.message}`);
    error.status = 0;
    throw error;
  }
  
  const duration = Date.now() - startTime;
  const contentType = response.headers.get('content-type') || '';
  
  let body;
  if (contentType.includes('json')) {
    body = await response.json();
  } else if (contentType.includes('text')) {
    body = await response.text();
  } else {
    body = `[${contentType || 'unknown'} — ${response.headers.get('content-length') || '?'} bytes]`;
  }
  
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${typeof body === 'object' ? (body.detail || JSON.stringify(body)) : body}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  
  return { status: response.status, body, duration, headers: Object.fromEntries(response.headers) };
}

// Auth helpers
let authToken = null;
let testConversationId = null;

async function getAuthHeaders() {
  return authToken ? { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

// ============================================================================
// TEST SUITES
// ============================================================================

async function testBackendHealth() {
  return await runTest('Backend Health Check', async () => {
    const res = await fetchWithLog(`${BACKEND_URL}/health`);
    if (!res.body.status) throw new Error('No status in health response');
    return res;
  });
}

async function testFrontendHealth() {
  return await runTest('Frontend Reachable', async () => {
    const res = await fetchWithLog(FRONTEND_URL);
    return { status: res.status, duration: res.duration };
  });
}

async function testAuth() {
  // Try login
  await runTest('Auth — Login', async () => {
    const res = await fetchWithLog(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    authToken = res.body.access_token;
    if (!authToken) throw new Error('No access_token in login response');
    return { token: authToken.substring(0, 20) + '...', user_id: res.body.user_id };
  });

  // Get current user
  await runTest('Auth — Get Current User', async () => {
    const res = await fetchWithLog(`${BACKEND_URL}/auth/me`, {
      headers: await getAuthHeaders(),
    });
    return res.body;
  });
}

async function testConversationManagement() {
  // Create conversation
  await runTest('Conversations — Create', async () => {
    const res = await fetchWithLog(`${BACKEND_URL}/chat/conversations`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ title: 'Stress Test Conversation', conversation_type: 'agent' }),
    });
    testConversationId = res.body.id;
    if (!testConversationId) throw new Error('No conversation ID returned');
    return res.body;
  });

  // List conversations
  await runTest('Conversations — List', async () => {
    const res = await fetchWithLog(`${BACKEND_URL}/chat/conversations`, {
      headers: await getAuthHeaders(),
    });
    if (!Array.isArray(res.body)) throw new Error('Response is not an array');
    return { count: res.body.length };
  });

  // Get messages (empty)
  await runTest('Conversations — Get Messages (empty)', async () => {
    const res = await fetchWithLog(`${BACKEND_URL}/chat/conversations/${testConversationId}/messages`, {
      headers: await getAuthHeaders(),
    });
    return { count: res.body.length };
  });
}

async function testStreamingChat(message, testName) {
  return await runTest(`Chat Stream — ${testName}`, async () => {
    const startTime = Date.now();
    
    const response = await fetch(`${BACKEND_URL}/chat/stream`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ content: message, conversation_id: testConversationId }),
      signal: AbortSignal.timeout(60000), // 60s for streaming
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
      throw new Error(err.detail || `HTTP ${response.status}`);
    }
    
    const convId = response.headers.get('X-Conversation-Id');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let toolCalls = [];
    let errors = [];
    let chunks = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n').filter(l => l.trim());
      
      for (const line of lines) {
        chunks++;
        const typeCode = line[0];
        const content = line.substring(2);
        
        if (!content) continue;
        
        try {
          const parsed = JSON.parse(content);
          
          switch (typeCode) {
            case '0': // Text
              fullText += typeof parsed === 'string' ? parsed : (parsed.text || '');
              break;
            case '9': // Tool call
              toolCalls.push({ tool: parsed.toolName, id: parsed.toolCallId });
              break;
            case 'a': // Tool result
              const tc = toolCalls.find(t => t.id === parsed.toolCallId);
              if (tc) {
                try {
                  const result = typeof parsed.result === 'string' ? JSON.parse(parsed.result) : parsed.result;
                  tc.success = result.success !== false;
                  tc.error = result.error || null;
                  tc.time_ms = result._tool_time_ms || result.fetch_time_ms || null;
                } catch {
                  tc.success = true;
                }
              }
              break;
            case '3': // Error
              errors.push(typeof parsed === 'string' ? parsed : parsed.message);
              break;
          }
        } catch {}
      }
    }
    
    const duration = Date.now() - startTime;
    
    return {
      duration,
      conversationId: convId,
      textLength: fullText.length,
      textPreview: fullText.substring(0, 200),
      toolCalls: toolCalls.map(t => ({ tool: t.tool, success: t.success, error: t.error, time_ms: t.time_ms })),
      toolCount: toolCalls.length,
      errors,
      chunks,
    };
  });
}

async function testFrontendAPI(message, testName) {
  return await runTest(`Frontend API — ${testName}`, async () => {
    const response = await fetch(`${FRONTEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        messages: [{ id: 'test-1', role: 'user', content: message, parts: [{ type: 'text', text: message }] }],
        conversationId: testConversationId,
      }),
      signal: AbortSignal.timeout(60000),
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }
    
    // Read SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let eventCount = 0;
    let hasUIHeader = response.headers.get('x-vercel-ai-ui-message-stream') === 'v1';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      fullResponse += text;
      eventCount += text.split('\n\n').filter(e => e.trim()).length;
    }
    
    return {
      hasUIMessageStreamHeader: hasUIHeader,
      contentType: response.headers.get('content-type'),
      eventCount,
      responseLength: fullResponse.length,
      responsePreview: fullResponse.substring(0, 300),
    };
  });
}

async function testToolEndpoints() {
  // List tools
  await runTest('Tools — List Available', async () => {
    const res = await fetchWithLog(`${BACKEND_URL}/chat/tools`, {
      headers: await getAuthHeaders(),
    });
    return { count: res.body.count, tools: res.body.tools?.map(t => t.name) };
  });
}

async function testKnowledgeBase() {
  await runTest('Knowledge Base — Get Documents', async () => {
    const res = await fetchWithLog(`${BACKEND_URL}/brain/documents`, {
      headers: await getAuthHeaders(),
    });
    return { count: Array.isArray(res.body) ? res.body.length : 0 };
  });

  await runTest('Knowledge Base — Stats', async () => {
    const res = await fetchWithLog(`${BACKEND_URL}/brain/stats`, {
      headers: await getAuthHeaders(),
    });
    return res.body;
  });
}

async function testCleanup() {
  if (testConversationId) {
    await runTest('Cleanup — Delete Test Conversation', async () => {
      const res = await fetchWithLog(`${BACKEND_URL}/chat/conversations/${testConversationId}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
      });
      return res.body;
    });
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  log('═══════════════════════════════════════════════════');
  log('  POTOMAC ANALYST WORKBENCH — STRESS TEST');
  log('═══════════════════════════════════════════════════');
  log(`Backend:  ${BACKEND_URL}`);
  log(`Frontend: ${FRONTEND_URL}`);
  log(`Time:     ${new Date().toISOString()}`);
  log('');

  // Phase 1: Health checks
  log('── Phase 1: Health Checks ──');
  await testBackendHealth();
  await testFrontendHealth();

  // Phase 2: Auth
  log('\n── Phase 2: Authentication ──');
  await testAuth();
  
  if (!authToken) {
    logError('Cannot proceed without auth token. Skipping remaining tests.');
    writeResults();
    return;
  }

  // Phase 3: Conversation management
  log('\n── Phase 3: Conversation Management ──');
  await testConversationManagement();

  // Phase 4: Tool listing
  log('\n── Phase 4: Available Tools ──');
  await testToolEndpoints();

  // Phase 5: Chat streaming — Original tools
  log('\n── Phase 5: Original Tool Tests (Backend Direct) ──');
  await testStreamingChat("What's AAPL stock price right now?", "Stock Data (AAPL)");
  await testStreamingChat("Show me a chart of MSFT for 3 months", "Stock Chart (MSFT)");
  await testStreamingChat("Do technical analysis on NVDA", "Technical Analysis (NVDA)");
  await testStreamingChat("What's the weather in New York?", "Weather (NYC)");
  await testStreamingChat("Get latest news about AI technology", "News (AI Tech)");
  await testStreamingChat("Calculate 2**100 + sum(range(1000)) in Python", "Python Execution");
  await testStreamingChat("Search my knowledge base for trading strategies", "Knowledge Base Search");
  await testStreamingChat("Generate a simple RSI overbought/oversold AFL trading system", "AFL Generate");
  await testStreamingChat("Create a bar chart with data: AAPL 150, MSFT 380, GOOGL 175", "Chart Create");

  // Phase 6: Chat streaming — NEW tools
  log('\n── Phase 6: NEW Tool Tests (Backend Direct) ──');
  await testStreamingChat("Screen stocks in Technology sector with PE under 30", "Screen Stocks");
  await testStreamingChat("Compare AAPL, MSFT, and GOOGL side by side", "Compare Stocks");
  await testStreamingChat("Show me sector performance for the past month", "Sector Performance");
  await testStreamingChat("I have a $100,000 account. I want to buy AAPL at $200 with a stop loss at $190. How many shares should I buy with 2% risk?", "Position Size");
  await testStreamingChat("Show me the correlation matrix for AAPL, MSFT, GOOGL, AMZN, TSLA", "Correlation Matrix");
  await testStreamingChat("What's the dividend info for KO (Coca-Cola)?", "Dividend Info");
  await testStreamingChat("Calculate risk metrics for TSLA over the past year", "Risk Metrics");
  await testStreamingChat("How's the market doing today? Give me an overview.", "Market Overview");
  await testStreamingChat("Backtest a 20/50 SMA crossover strategy on AAPL for 1 year", "Quick Backtest");
  await testStreamingChat("Show me options data for AAPL", "Options Snapshot");

  // Phase 7: Frontend API proxy test
  log('\n── Phase 7: Frontend API Proxy ──');
  await testFrontendAPI("Hello, what tools do you have?", "Frontend /api/chat Proxy");

  // Phase 8: Knowledge Base
  log('\n── Phase 8: Knowledge Base ──');
  await testKnowledgeBase();

  // Phase 9: Edge cases
  log('\n── Phase 9: Edge Cases ──');
  await testStreamingChat("", "Empty Message");
  await testStreamingChat("a".repeat(5000), "Very Long Message (5000 chars)");
  await testStreamingChat("Get stock data for INVALIDTICKER12345", "Invalid Stock Symbol");

  // Cleanup
  log('\n── Cleanup ──');
  await testCleanup();

  // Write results
  writeResults();
}

function writeResults() {
  results.endTime = new Date().toISOString();
  results.totalDuration = new Date(results.endTime) - new Date(results.startTime);
  
  // Write JSON
  fs.writeFileSync(LOG_FILE, JSON.stringify(results, null, 2));
  log(`\n📄 Full results saved to: ${LOG_FILE}`);
  
  // Write readable report
  let report = '';
  report += '═══════════════════════════════════════════════════\n';
  report += '  STRESS TEST REPORT\n';
  report += `  ${results.startTime}\n`;
  report += '═══════════════════════════════════════════════════\n\n';
  report += `Total Tests: ${results.summary.total}\n`;
  report += `Passed:      ${results.summary.passed} ✅\n`;
  report += `Failed:      ${results.summary.failed} ❌\n`;
  report += `Duration:    ${(results.totalDuration / 1000).toFixed(1)}s\n\n`;
  
  if (results.summary.errors.length > 0) {
    report += '── ERRORS ──\n';
    for (const err of results.summary.errors) {
      report += `  ❌ ${err.test}: ${err.error}\n`;
    }
    report += '\n';
  }
  
  report += '── ALL TESTS ──\n';
  for (const test of results.tests) {
    const icon = test.status === 'passed' ? '✅' : '❌';
    const duration = `${test.duration}ms`;
    report += `  ${icon} ${test.name} (${duration})`;
    
    if (test.response?.body?.toolCalls?.length > 0 || test.response?.toolCalls?.length > 0) {
      const tools = test.response.toolCalls || test.response.body?.toolCalls || [];
      const toolNames = tools.map(t => `${t.tool}${t.success === false ? ' ⚠️' : ''}`).join(', ');
      report += ` → Tools: [${toolNames}]`;
    }
    
    if (test.error) {
      report += `\n     Error: ${test.error.message}`;
    }
    report += '\n';
  }
  
  fs.writeFileSync(REPORT_FILE, report);
  log(`📋 Readable report saved to: ${REPORT_FILE}`);
  
  // Print summary
  log('\n═══════════════════════════════════════════════════');
  log(`  RESULTS: ${results.summary.passed}/${results.summary.total} passed, ${results.summary.failed} failed`);
  log(`  Duration: ${(results.totalDuration / 1000).toFixed(1)}s`);
  log('═══════════════════════════════════════════════════');
  
  if (results.summary.errors.length > 0) {
    log('\n❌ FAILURES:');
    for (const err of results.summary.errors) {
      log(`   • ${err.test}: ${err.error}`);
    }
  }
}

main().catch(err => {
  logError(`Fatal error: ${err.message}`);
  writeResults();
  process.exit(1);
});
