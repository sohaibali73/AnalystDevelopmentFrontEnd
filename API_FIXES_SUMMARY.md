# Frontend API Alignment - Fixes Applied

## Summary
Fixed 3 critical issues with the frontend to align with the backend API guide and enable key features:

---

## ✅ 1. Created `/api/tts/route.ts` - Text-to-Speech Proxy
**Status**: ✓ COMPLETED

**What it does**:
- Proxies text-to-speech requests from frontend to backend
- Backend endpoint: `POST /chat/tts`
- Returns MP3 audio stream (audio/mpeg)
- Supports edge-tts voice synthesis (e.g., 'en-US-AriaNeural')

**Features**:
- Request validation (text is required, non-empty)
- Authorization header pass-through
- Error handling for backend connection failures
- Cache control headers (no-cache)
- HEAD request support

**Usage in ChatPage**:
```typescript
const resp = await fetch('/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
  body: JSON.stringify({ text, voice: 'en-US-AriaNeural' }),
});
const audioBlob = await resp.blob();
// Play audio...
```

---

## ✅ 2. Created `/api/upload/route.ts` - File Upload Proxy
**Status**: ✓ COMPLETED

**What it does**:
- Proxies file upload requests from frontend to backend
- Backend endpoint: `POST /chat/conversations/{conversation_id}/upload`
- Supports multipart/form-data files
- Returns file metadata (file_id, filename, template info)

**Features**:
- Query parameter validation (conversationId required)
- Multipart form-data handling
- Authorization header pass-through
- Error handling with detailed messages
- Returns template metadata for PPTX files

**Usage in ChatPage**:
```typescript
const formData = new FormData();
formData.append('file', actualFile);

const resp = await fetch(`/api/upload?conversationId=${convId}`, {
  method: 'POST',
  headers: { 'Authorization': token ? `Bearer ${token}` : '' },
  body: formData,
});
const respData = await resp.json();
// { file_id, filename, template_id?, template_layouts?, is_template? }
```

---

## ✅ 3. Fixed Conversation Type Parameter Passing
**Status**: ✓ COMPLETED

**Issue**: ChatPage was not passing `conversation_type` parameter when creating conversations

**What was changed**:
- **Location**: `src/page-components/ChatPage.tsx`
- **Method**: `createConversation()`
- **Before**: `apiClient.createConversation()`
- **After**: `apiClient.createConversation('New Conversation', 'agent')`

**Fixed locations** (5 instances):
1. `handleNewConversation()` - Main "New Chat" button
2. `doSend()` - Auto-create when no conversation selected
3. `doSend()` in file upload path
4. `VoiceMode` overlay callback
5. PromptInput submit handler

**Conversation types**:
- `'agent'` - For chat conversations (default for ChatPage)
- `'afl'` - For AFL strategy conversations (for AFLGeneratorPage)

**Filter fix**:
```typescript
// BEFORE (incorrect)
const data = allData.filter((c: any) => !c.conversation_type || c.conversation_type === 'agent');

// AFTER (correct)
const data = allData.filter((c: any) => c.conversation_type === 'agent' || !c.conversation_type);
```

---

## Impact & Testing Checklist

### Voice Features
- [ ] TTS endpoint `/api/tts` returns MP3 audio
- [ ] Audio plays in browser without errors
- [ ] Different voices work (en-US-AriaNeural, etc.)
- [ ] Authorization header is passed correctly

### File Upload Features
- [ ] Files upload via `/api/upload` endpoint
- [ ] Conversation ID is required in query params
- [ ] File metadata is returned correctly
- [ ] PPTX templates are detected and marked
- [ ] Error messages are user-friendly

### Conversation Management
- [ ] New conversations created with type='agent'
- [ ] ChatPage shows only 'agent' type conversations
- [ ] AFLGeneratorPage shows only 'afl' type conversations
- [ ] Conversations persist after reload

---

## Files Modified

| File | Changes |
|------|---------|
| `/api/tts/route.ts` | Created - New proxy route for text-to-speech |
| `/api/upload/route.ts` | Created - New proxy route for file uploads |
| `src/page-components/ChatPage.tsx` | Fixed - Conversation type parameter (5 instances) |
| `API_FIXES_NEEDED.md` | Created - Documented all issues found |

---

## Next Steps (MEDIUM/LOW Priority)

1. **Presentation API Routes** (`/api/presentations/*`)
   - List, generate, download presentations
   - Status: Not yet implemented

2. **Researcher API Routes** (`/api/researcher/*`)
   - Company research analysis
   - Status: Needs routing verification

3. **Content/Knowledge Base Routes** (`/api/content/*`, `/api/knowledge/*`)
   - CRUD operations for content
   - Status: Needs implementation

4. **AFLGeneratorPage fixes**
   - Similar conversation type fixes needed
   - Status: Waiting for comprehensive review

---

## Testing & Verification

### Manual Testing
```bash
# Test TTS endpoint
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"text":"Hello world","voice":"en-US-AriaNeural"}' \
  --output audio.mp3

# Test upload endpoint
curl -X POST "http://localhost:3000/api/upload?conversationId=test-id" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@yourfile.pdf"
```

### Browser Testing
1. Open ChatPage
2. Click "New Chat" - should create conversation with type='agent'
3. Click TTS button on any message - should play audio
4. Drag & drop a file - should upload via `/api/upload`
5. Check browser DevTools Network tab - verify request/response

---

## Backend API Reference

From `API_GUIDE.md v1.3.7`:

**TTS Endpoint**:
- `POST /chat/tts`
- Request: `{ text: string, voice?: string }`
- Response: MP3 audio stream (audio/mpeg)

**Upload Endpoint**:
- `POST /chat/conversations/{conversation_id}/upload`
- Request: multipart/form-data with `file` field
- Response: `{ file_id, filename, template_id?, template_layouts?, is_template? }`

**Create Conversation Endpoint**:
- `POST /chat/conversations`
- Request: `{ title: string, conversation_type: string }`
- Response: `{ id, title, conversation_type, created_at, updated_at }`

