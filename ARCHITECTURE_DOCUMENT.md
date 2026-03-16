# Analyst by Potomac — Architecture & Technical Overview
### For Product Managers | Last Updated: February 2026

---

## 1. Executive Summary

Analyst by Potomac is an AI-powered financial workbench that combines a conversational chat interface with rich, interactive generative UI tools. Users can ask the AI to analyze stocks, generate trading code (AFL), create presentations, run backtests, and more — all rendered as polished, interactive cards inline in the chat, not just plain text.

The platform uses a **Next.js frontend** communicating with a **FastAPI backend** via streaming protocols, with **Claude (Anthropic)** as the AI engine and **Supabase** as the database.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     USER BROWSER                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Next.js Frontend (React)                │   │
│  │  • ChatPage with Generative UI components        │   │
│  │  • AI SDK v6 (useChat + streaming)               │   │
│  │  • AI Elements composable component library       │   │
│  │  • Proxy API routes (/api/chat, /api/presentation)│   │
│  └──────────────┬───────────────────────────────────┘   │
│                 │  SSE / HTTP                            │
└─────────────────┼───────────────────────────────────────┘
                  │
                  ▼
┌──────���──────────────────────────────────────────────────┐
│              FastAPI Backend (Python)                     │
│                                                          │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────┐    │
│  │ Chat Router │ │ AFL Router │ │ Researcher Router│    │
│  │ /chat/*     │ │ /afl/*     │ │ /api/researcher/*│    │
│  └─────┬──────┘ └─────┬──────┘ └────────┬─────────┘    │
│        │              │                  │               │
│  ┌─────▼──────────────▼──────────────────▼───────────┐  │
│  │           Core Engine Layer                         │  │
│  │  • Claude API (Anthropic SDK)                      │  │
│  │  • Tool System (25+ tools in core/tools.py)        │  │
│  │  • Streaming Encoder (Vercel AI Data Stream)       │  │
│  │  • AFL Validator + Code Engine                     │  │
│  │  • python-pptx (Presentation Generation)           │  │
│  └─────────────────────┬─────────────────────────────┘  │
│                        │                                 │
│  ┌─────────────────────▼─────────────────────────────┐  │
│  │              External Services                      │  │
│  │  • Supabase (PostgreSQL) — Auth, Messages, Docs    │  │
│  │  • yfinance — Real-time stock data                 │  │
│  │  • Tavily API — News search                        │  │
│  │  • wttr.in — Weather data                          │  │
│  │  • edge-tts — Text-to-speech                       │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

### Frontend
| Technology | Purpose | Version |
|---|---|---|
| **Next.js** | React framework with App Router, SSR, API routes | 16 |
| **React** | UI library | 19 |
| **AI SDK (@ai-sdk/react)** | `useChat` hook for streaming chat + tool rendering | v6 |
| **Vercel AI (ai package)** | `DefaultChatTransport` for UI Message Stream protocol | v6 |
| **TypeScript** | Type safety | 5.x |
| **Tailwind CSS** | Utility-first styling | 3.x |
| **Lucide React** | Icon library | latest |
| **Sonner** | Toast notifications | latest |
| **AI Elements** | Composable chat UI components (message, reasoning, code blocks, etc.) | Custom |

### Backend
| Technology | Purpose | Version |
|---|---|---|
| **FastAPI** | Python web framework with async support | latest |
| **Uvicorn** | ASGI server | latest |
| **Anthropic SDK** | Claude API client (streaming + tools) | latest |
| **python-pptx** | PowerPoint creation & template cloning | 1.0.2 |
| **yfinance** | Yahoo Finance stock data | latest |
| **Supabase Python** | Database client (PostgreSQL) | latest |
| **edge-tts** | Microsoft Edge text-to-speech | latest |
| **numpy / pandas** | Data analysis for tool execution | latest |
| **PyPDF2 / python-docx / PyMuPDF** | Document processing for knowledge base | latest |

### Infrastructure
| Service | Purpose |
|---|---|
| **Railway** | Backend deployment (FastAPI) |
| **Vercel** | Frontend deployment (Next.js) |
| **Supabase** | PostgreSQL database + Auth + Storage |
| **GitHub** | Source control |

---

## 4. Frontend Architecture

### 4.1 Directory Structure

```
app/                          # Next.js App Router
├── layout.tsx                # Root layout (fonts, providers)
├── page.tsx                  # Landing/redirect
├── (protected)/              # Auth-gated pages
│   ├── chat/page.tsx         # → ChatPage component
│   ├── dashboard/page.tsx    # → DashboardPage
│   ├── knowledge/page.tsx    # → KnowledgeBasePage
│   ├── settings/page.tsx     # → SettingsPage
│   └── ...
├── api/                      # Next.js API proxy routes
│   ├── chat/route.ts         # Proxies to backend /chat/stream
│   ├── presentation/[id]/route.ts  # Downloads .pptx files
│   ├── template/route.ts     # Template upload + listing
│   ├── upload/route.ts       # File uploads
│   └── tts/route.ts          # Text-to-speech proxy

src/
├── page-components/          # Full page components
│   ├── ChatPage.tsx          # ★ Main chat interface (800+ lines)
│   ├── DashboardPage.tsx
│   ├── KnowledgeBasePage.tsx
│   └── ...
├── components/
│   ├── generative-ui/        # ★ 25+ rich tool rendering components
│   │   ├── StockCard.tsx
│   │   ├── LiveStockChart.tsx
│   │   ├── PresentationCard.tsx
│   │   ├── OptionsSnapshot.tsx
│   │   ├── BacktestResults.tsx
│   │   ├── ToolLoading.tsx
│   │   └── index.ts          # Barrel export
│   ├── ai-elements/          # Composable chat UI primitives
│   │   ├── message.tsx       # MessageContent, MessageActions
│   │   ├── reasoning.tsx     # Reasoning accordion
│   │   ├── suggestion.tsx    # Quick suggestion chips
│   │   ├── prompt-input.tsx  # Rich input with attachments
│   │   └── ...
│   └── ui/                   # shadcn/ui base components
├── contexts/                 # React contexts (Auth, Theme, FontSize)
├── hooks/                    # Custom hooks (useAIChat, useResponsive)
├── lib/                      # API client, utilities
│   ├── api.ts                # ★ Full API client class (1000+ lines)
│   └── utils.ts
└── types/                    # TypeScript type definitions
```

### 4.2 Chat Interface Flow

The chat interface (`ChatPage.tsx`) is the core of the product. Here's how a message flows:

```
User types message
       │
       ▼
useChat hook (AI SDK v6)
       │
       ├── DefaultChatTransport sends POST to /api/chat (Next.js proxy)
       │         │
       │         ▼
       │   Next.js API route proxies to backend /chat/stream
       │         │
       │         ▼
       │   Backend streams SSE response (Vercel AI Data Stream Protocol)
       │         │
       │         ├── Text chunks → rendered as markdown (MessageResponse)
       │         ├── Tool calls → rendered as ToolLoading spinner
       │         ├── Tool results → rendered as Generative UI components
       │         └── Finish → message complete
       │
       ▼
renderMessage() switch statement maps tool parts to components:
  • tool-get_stock_data      → <StockCard />
  • tool-create_presentation → <PresentationCard />
  • tool-technical_analysis  → <TechnicalAnalysis />
  • tool-get_stock_chart     → <LiveStockChart />
  • (25+ more mappings...)
```

### 4.3 Generative UI Pattern

This is the key architectural pattern. Instead of the AI returning plain text descriptions, it calls **tools** that return structured JSON data, which the frontend renders as **rich interactive components**.

**Example: "Create a 5-slide pitch deck about AAPL"**

1. AI calls `create_presentation` tool with slides data
2. Backend generates .pptx, stores in memory, returns metadata
3. Frontend receives tool result with slide previews
4. `PresentationCard` component renders:
   - Slide thumbnail carousel
   - Theme/template badge
   - Expandable slide details
   - One-click download button

Each generative UI component follows this pattern:
```typescript
// In ChatPage.tsx renderMessage switch:
case 'tool-create_presentation':
  switch (part.state) {
    case 'input-streaming':
    case 'input-available':
      return <ToolLoading toolName="create_presentation" />;
    case 'output-available':
      return <PresentationCard {...part.output} />;
    case 'output-error':
      return <ErrorDisplay error={part.errorText} />;
  }
```

---

## 5. Backend Architecture

### 5.1 Directory Structure

```
Potomac-Analyst-Workbench/
├── main.py                   # FastAPI app, CORS, router loading
├── config.py                 # Environment config
├── requirements.txt          # Python dependencies
├── api/
│   ├── dependencies.py       # Auth middleware, API key extraction
│   └── routes/
│       ├── chat.py           # ★ Chat/stream/tools/presentation endpoints
│       ├── ai.py             # AI SDK protocol endpoint
│       ├── afl.py            # AFL code generation
│       ├── auth.py           # Login/register/JWT
│       ├── brain.py          # Knowledge base upload/search
│       ├── backtest.py       # Backtest upload/analysis
│       ├── researcher.py     # Company research
│       ├── reverse_engineer.py # Strategy reverse engineering
│       ├── admin.py          # Admin panel
│       ├── train.py          # Training data management
│       └── health.py         # Health checks
├── core/
│   ├── tools.py              # ★ 25+ tool definitions + handlers (2500+ lines)
│   ├── claude_engine.py      # AFL generation engine
│   ├── afl_validator.py      # AFL syntax validation
│   ├── streaming.py          # Vercel AI Stream Protocol encoder
│   ├── artifact_parser.py    # Code artifact extraction
│   ├── prompts.py            # System prompts
│   └── context_manager.py    # Context optimization
├── db/
│   └── supabase_client.py    # Database connection
└── data/                     # Static data files
```

### 5.2 Tool System Architecture

The tool system in `core/tools.py` is the engine that powers all generative UI. It follows a 3-part pattern:

```python
# 1. TOOL DEFINITION (Claude API schema — tells the AI what tools exist)
TOOL_DEFINITIONS = [
    {
        "name": "create_presentation",
        "description": "Create a PowerPoint presentation...",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "slides": {"type": "array"},
                "template_id": {"type": "string"},  # For brand cloning
                ...
            },
            "required": ["title", "slides"]
        }
    },
    # ... 25+ more tools
]

# 2. HANDLER FUNCTION (executes the tool logic)
def create_presentation(title, slides, template_id=None, ...):
    # If template_id → clone brand template 1:1
    # Else → build from scratch with built-in themes
    # Returns: {success, presentation_id, download_url, slides, ...}

# 3. DISPATCHER (routes tool calls to handlers)
def handle_tool_call(tool_name, tool_input, ...):
    if tool_name == "create_presentation":
        return create_presentation(**tool_input)
    elif tool_name == "get_stock_data":
        return get_stock_data(**tool_input)
    # ... etc
```

### 5.3 Complete Tool Inventory (25 tools)

| Tool Name | Category | Frontend Component | Description |
|---|---|---|---|
| `web_search` | Search | `WebSearchResults` | Claude built-in web search |
| `execute_python` | Code | `CodeExecution` | Sandboxed Python execution |
| `search_knowledge_base` | Knowledge | `KnowledgeBaseResults` | Search uploaded documents |
| `get_stock_data` | Finance | `StockCard` | Real-time stock prices |
| `get_stock_chart` | Finance | `LiveStockChart` | OHLCV candlestick charts |
| `technical_analysis` | Finance | `TechnicalAnalysis` | RSI, MACD, Bollinger, ADX |
| `screen_stocks` | Finance | `StockScreener` | Filter stocks by criteria |
| `compare_stocks` | Finance | `StockComparison` | Side-by-side comparison |
| `get_sector_performance` | Finance | `SectorPerformance` | Sector ETF heatmap |
| `calculate_position_size` | Finance | `PositionSizer` | Risk-based position sizing |
| `get_correlation_matrix` | Finance | `CorrelationMatrix` | Portfolio correlation |
| `get_dividend_info` | Finance | `DividendCard` | Dividend yield & history |
| `calculate_risk_metrics` | Finance | `RiskMetrics` | Sharpe, Sortino, VaR, Beta |
| `get_market_overview` | Finance | `MarketOverview` | Indices, commodities, crypto |
| `backtest_quick` | Finance | `BacktestResults` | Quick strategy backtest |
| `get_options_snapshot` | Finance | `OptionsSnapshot` | Options chain analysis |
| `get_weather` | Utility | `WeatherCard` | Weather + forecast |
| `get_news` | Utility | `NewsHeadlines` | News with sentiment analysis |
| `create_chart` | Visualization | `DataChart` | Bar, line, pie, scatter charts |
| `code_sandbox` | Code | `CodeSandbox` | Interactive code editor |
| `generate_afl_code` | AFL | `AFLGenerateCard` | Generate trading formulas |
| `validate_afl` | AFL | `AFLValidateCard` | Validate AFL syntax |
| `debug_afl_code` | AFL | `AFLDebugCard` | Debug & fix AFL code |
| `explain_afl_code` | AFL | `AFLExplainCard` | Explain AFL in English |
| `sanity_check_afl` | AFL | `AFLSanityCheckCard` | Auto-fix AFL issues |
| `create_presentation` | Document | `PresentationCard` | PowerPoint with template cloning |

### 5.4 Streaming Protocol

The backend uses the **Vercel AI Data Stream Protocol** for real-time streaming:

```
Client ←──SSE──── Backend

Text chunk:    0:"Hello, here is your analysis...\n"
Tool call:     9:{"toolCallId":"abc","toolName":"get_stock_data","args":{...}}
Tool result:   a:{"toolCallId":"abc","result":{...}}
Custom data:   2:[{"conversation_id":"...","tools_used":[...]}]
Finish:        d:{"finishReason":"stop","usage":{"promptTokens":1200,...}}
```

This enables:
- **Progressive text rendering** (character by character)
- **Tool loading states** (spinner while tool executes)
- **Instant tool result rendering** (rich UI appears as soon as tool completes)

---

## 6. PowerPoint Feature — Deep Dive

### 6.1 Two Modes

**Mode 1: Built-in Themes (no template)**
- User asks: "Create a presentation about market outlook"
- AI calls `create_presentation` with slides data
- Backend builds .pptx from scratch using one of 4 themes (potomac/dark/light/corporate)
- Each theme has custom colors, accent bars, branded text styles
- Output: Widescreen 13.333" × 7.5" presentation

**Mode 2: Brand Template Cloning (with uploaded .pptx)**
- User uploads their company .pptx template via `/api/template`
- Backend analyzes it: discovers all slide layouts, placeholders (title, body, subtitle), their positions and types
- Returns `template_id` + layout map
- When AI calls `create_presentation` with `template_id`, it:
  1. Opens the template .pptx (preserving ALL branding: slide masters, theme colors, fonts, backgrounds, logos, shapes)
  2. Strips existing sample slides
  3. Adds new slides using the template's layouts
  4. Populates content into placeholder shapes (title → idx 0, body → idx 1+)
  5. Result: Output .pptx is indistinguishable from one made manually in the template

### 6.2 Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `POST /chat/template/upload` | POST | Upload a .pptx brand template |
| `GET /chat/templates` | GET | List uploaded templates |
| `GET /chat/presentation/{id}` | GET | Download generated .pptx |

### 6.3 Frontend Rendering

The `PresentationCard` component renders:
- Presentation icon + title + subtitle
- Mini slide thumbnail carousel (visual preview strip)
- "🎨 BRAND TEMPLATE: filename.pptx" badge (when template used) or theme badge
- Expandable slide details (layout type, bullet count, notes indicator)
- Full-width download button with loading state

---

## 7. Data Flow & Security

### 7.1 Authentication
- JWT-based auth stored in `localStorage`
- Every API call includes `Authorization: Bearer <token>` header
- Backend validates tokens via Supabase Auth
- API keys (Claude, Tavily) stored per-user in Supabase

### 7.2 API Proxy Pattern
The frontend **never** calls the backend directly. All requests go through Next.js API routes that act as proxies:

```
Browser → /api/chat (Next.js) → backend:8000/chat/stream (FastAPI)
Browser → /api/presentation/abc (Next.js) → backend:8000/chat/presentation/abc
Browser → /api/template (Next.js) → backend:8000/chat/template/upload
```

Benefits:
- Backend URL hidden from browser
- Consistent CORS handling
- Can add caching/rate limiting at the proxy layer

### 7.3 Caching Strategy
- **Stock data**: 5-minute in-memory cache (avoids hammering Yahoo Finance)
- **Knowledge base**: 10-minute cache for search results
- **Templates**: In-memory store (max 10 templates)
- **Presentations**: In-memory store (max 20, keyed by UUID)
- **Tool definitions**: `@lru_cache` (computed once)

---

## 8. Performance Optimizations

1. **Streaming**: Text appears character-by-character instead of waiting for full response
2. **Experimental throttle**: UI updates batched every 50ms to prevent jank
3. **Lazy tool execution**: Tools only run when Claude decides to use them
4. **Reduced max_tokens**: 3000 for streaming (faster first-token-time) vs 4096 for non-streaming
5. **Conversation history limit**: Last 10 messages sent to Claude (prevents token bloat)
6. **Stock cache**: Avoids redundant yfinance API calls within 5 minutes

---

## 9. Deployment

### Frontend (Vercel)
- Auto-deploys from `main` branch on GitHub
- Environment variables: `NEXT_PUBLIC_API_URL`
- Edge runtime for API routes

### Backend (Railway)
- Auto-deploys from `main` branch
- Uses `nixpacks.toml` for build config
- Environment variables: `SUPABASE_URL`, `SUPABASE_KEY`, `ENVIRONMENT`
- Health check at `/health`

### Database (Supabase)
- Tables: `users`, `conversations`, `messages`, `brain_documents`, `conversation_files`
- Row-level security (RLS) policies
- Auto-generated REST API

---

## 10. Adding New Tools (Developer Guide)

To add a new generative UI tool (e.g., `get_earnings_calendar`):

1. **Backend `core/tools.py`**: Add tool definition to `TOOL_DEFINITIONS` array
2. **Backend `core/tools.py`**: Write handler function `def get_earnings_calendar(...) -> Dict`
3. **Backend `core/tools.py`**: Add `elif` to `handle_tool_call` dispatcher
4. **Backend `api/routes/chat.py`**: Add tool name to the whitelist
5. **Frontend `src/components/generative-ui/EarningsCalendar.tsx`**: Create React component
6. **Frontend `src/components/generative-ui/index.ts`**: Export it
7. **Frontend `src/page-components/ChatPage.tsx`**: Add `case 'tool-get_earnings_calendar'` to switch

Time estimate: 30-60 minutes per tool.

---

*Document generated February 10, 2026 | Analyst by Potomac v1.2.0*
