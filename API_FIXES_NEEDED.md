# Frontend API Routes - Fix Guide

## Issues Found

### 1. **Conversation Type Filtering Mismatch**
**Location**: `ChatPage.tsx` (line 455), `AFLGeneratorPage.tsx` (line 254)

**Problem**:
```typescript
// AFLGeneratorPage filtering by 'afl' type
const data = allData.filter((c: any) => c.conversation_type === 'afl');

// ChatPage filtering by 'agent' type  
const data = allData.filter((c: any) => !c.conversation_type || c.conversation_type === 'agent');
```

**Backend Reality** (API_GUIDE.md shows):
- `conversation_type` can be: `"agent"`, `"afl"`, or other types
- The backend creates conversations with default type during chat operations

**Fix**:
- ChatPage should filter for `conversation_type === 'agent'` OR no type (default)
- AFLGeneratorPage should filter for `conversation_type === 'afl'` 
- When creating conversations, explicitly pass the conversation type

---

### 2. **Conversation Creation Type Parameter**
**Location**: Multiple files

**Problem**:
```typescript
// Current - missing conversation type parameter
await apiClient.createConversation();

// Should specify type
await apiClient.createConversation('Title', 'agent');  // or 'afl'
```

**Backend API** requires: `conversation_type` field

**Fix**: Always pass conversation type when creating conversations
```typescript
// For ChatPage
apiClient.createConversation('New Conversation', 'agent')

// For AFLGeneratorPage  
apiClient.createConversation('New Strategy', 'afl')
```

---

### 3. **Missing Next.js API Routes**

The following backend endpoints are called directly but need Next.js proxy routes:

#### 3.1 **TTS Endpoint**
**Location**: ChatPage.tsx (line 314-322)
```typescript
const resp = await fetch('/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text, voice: 'en-US-AriaNeural' }),
});
```

**Missing Route**: `app/api/tts/route.ts`
**Backend Endpoint**: `POST /chat/tts`

---

#### 3.2 **Upload Endpoint** 
**Location**: ChatPage.tsx (lines 867-882), AFLGeneratorPage.tsx (similar)
```typescript
const resp = await fetch(`/api/upload?conversationId=${convId}`, {
  method: 'POST',
  headers: { 'Authorization': token ? `Bearer ${token}` : '' },
  body: formData,
});
```

**Missing Route**: `app/api/upload/route.ts`
**Backend Endpoint**: `POST /chat/conversations/{conversation_id}/upload`

---

### 4. **Streaming Endpoint Mismatch**
**Location**: ChatPage.tsx, AFLGeneratorPage.tsx

**Current**: Uses `DefaultChatTransport({ api: '/api/chat', ... })`

**Backend Reality** (from API_GUIDE.md):
- Main streaming: `POST /chat/stream` (uses Data Stream Protocol)
- Direct v6: `POST /chat/v6` (direct AI SDK integration)

**Fix**: Ensure `/api/chat` route.ts properly proxies to `/chat/stream` with correct protocol handling.

---

### 5. **Presentation Endpoints Missing**
**Location**: `src/lib/api.ts` (presentations section)

**Methods without corresponding routes**:
- `generatePresentation()` - calls `/presentations/generate`
- `generateMarketOutlook()` - calls `/presentations/generate-market-outlook`
- `listPresentations()` - calls `/presentations`
- `downloadPresentation()` - calls `/presentations/{id}/download`
- `deletePresentation()` - calls `DELETE /presentations/{id}`

**Backend Support**: API guide shows these endpoints exist but may need:
- `app/api/presentations/route.ts` (for list)
- `app/api/presentations/generate/route.ts` (for generation)
- `app/api/presentations/[id]/route.ts` (for get/delete)
- `app/api/presentations/[id]/download/route.ts` (for download)

---

### 6. **Missing API Methods in apiClient**
The `apiClient` has methods but some lack proper implementations:

- `uploadFile()` - implemented ✓
- `getChatTools()` - implemented ✓
- Skills endpoints - implemented ✓
- YFinance endpoints - implemented ✓

**Missing/Incomplete**:
- Researcher endpoints routing (should use `/researcher` prefix, not `/api/researcher`)
- Content endpoints CRUD operations
- Knowledge base endpoints

---

### 7. **Proxy Configuration Missing**
**File**: `next.config.js` may need rewrites for backend endpoints

**Current Setup**:
- Auth routes proxy through Next.js (`/api/auth/*`)
- Chat streams through `/api/chat`
- Direct calls to `API_BASE_URL` from client

**Recommended**:
```javascript
// next.config.js should have:
async rewrites() {
  return {
    beforeFiles: [
      // Proxy all /api/* calls to Next.js routes
      // Everything else goes to backend if needed
    ],
  };
}
```

---

## Summary of Missing Routes

| Route | Backend | Purpose |
|-------|---------|---------|
| `/api/tts` | `POST /chat/tts` | Text-to-speech |
| `/api/upload` | `POST /chat/conversations/{id}/upload` | File upload |
| `/api/chat` | `POST /chat/stream` | Chat streaming |
| `/api/presentations` | Various | Presentation management |
| `/api/researcher/*` | `GET /researcher/*` | Researcher endpoints |
| `/api/content/*` | Various | Content CRUD |
| `/api/knowledge/*` | `/brain/*` | Knowledge base |

---

## Fix Priority

1. **CRITICAL**: Create `/api/tts` route (blocking voice features)
2. **CRITICAL**: Create `/api/upload` route (blocking file uploads)
3. **HIGH**: Fix conversation type parameter passing
4. **HIGH**: Create presentation API routes
5. **MEDIUM**: Add missing knowledge/content routes
6. **LOW**: Optimize existing routes

---

## Testing Checklist

- [ ] Create new conversation with correct type parameter
- [ ] Upload file to conversation
- [ ] Play text-to-speech
- [ ] Generate presentation
- [ ] Stream chat messages
- [ ] Execute skills
- [ ] Fetch YFinance data
- [ ] Search knowledge base
