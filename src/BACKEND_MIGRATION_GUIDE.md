# Backend Migration Guide - Aligning Current API with New Frontend

**Version:** 2.0.0  
**Date:** February 1, 2026  
**Purpose:** Comprehensive guide to update the Potomac Analyst Workbench backend to support the new frontend

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Breaking Changes Overview](#breaking-changes-overview)
3. [Authentication - No Changes Needed](#authentication---no-changes-needed)
4. [AFL Routes - Major Updates Required](#afl-routes---major-updates-required)
5. [Knowledge Base - Path Changes & New Endpoints](#knowledge-base---path-changes--new-endpoints)
6. [Chat System - Streaming & New Endpoints](#chat-system---streaming--new-endpoints)
7. [Dashboard - New Feature](#dashboard---new-feature)
8. [Backtest Analysis - Significant Expansion](#backtest-analysis---significant-expansion)
9. [Reverse Engineer - Restructure Required](#reverse-engineer---restructure-required)
10. [Settings - Completely New](#settings---completely-new)
11. [Admin Panel - Restructure Required](#admin-panel---restructure-required)
12. [Training System - Expansion Required](#training-system---expansion-required)
13. [Research Features - Completely New](#research-features---completely-new)
14. [WebSocket Support - New Infrastructure](#websocket-support---new-infrastructure)
15. [Migration Priority Matrix](#migration-priority-matrix)
16. [Implementation Timeline](#implementation-timeline)
17. [Database Schema Changes](#database-schema-changes)
18. [Testing Checklist](#testing-checklist)

---

## Executive Summary

### Current State
Your backend has 24 endpoints across 8 route categories serving a functional but limited API.

### Target State
The new frontend requires **60+ endpoints** with significant new features including:
- Real-time streaming (WebSocket/SSE)
- Comprehensive settings management
- Dashboard analytics
- Enhanced file management
- Research tools (company analysis, peer comparison)
- Training course system

### Migration Effort Estimate
- **Critical (Launch Blocking):** 15 endpoints - 3-4 weeks
- **High Priority:** 20 endpoints - 4-5 weeks
- **Medium Priority:** 15 endpoints - 3-4 weeks
- **Low Priority (Nice-to-Have):** 10 endpoints - 2-3 weeks

**Total Estimated Effort:** 12-16 weeks (3-4 months) for full implementation

---

## Breaking Changes Overview

### ⚠️ CRITICAL BREAKING CHANGES

#### 1. Base Path Structure
**Current:**
```
/auth/*
/afl/*
/brain/*
/chat/*
```

**New (Frontend Expects):**
```
/api/auth/*
/api/afl/*
/api/knowledge-base/*  (was /brain/*)
/api/chat/*
```

**Action Required:**
- Add `/api` prefix to all routes OR
- Update frontend `API_BASE_URL` to include existing paths
- **Recommendation:** Keep current paths, update frontend config

#### 2. Response Format Changes

**Current:** Varies by endpoint

**New Standard:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null,
  "timestamp": "2026-02-01T15:00:00Z"
}
```

**Error Format:**
```json
{
  "success": false,
  "error": "User-friendly message",
  "code": "ERROR_CODE",
  "details": { /* additional info */ },
  "timestamp": "2026-02-01T15:00:00Z"
}
```

#### 3. Authentication Token Format
**Current:** JWT in `Authorization: Bearer <token>`  
**New:** Same format ✅ (No changes needed)

---

## Authentication - No Changes Needed ✅

### Current Implementation
```python
POST /auth/register
POST /auth/login
GET /auth/me
```

### Frontend Expectations
✅ **MATCHES PERFECTLY** - No changes required!

### Optional Enhancements

#### Add Demo Login Endpoint (Low Priority)
```python
@app.post("/auth/demo-login")
async def demo_login():
    """Allow demo access without credentials"""
    demo_user = {
        "id": "demo_user_id",
        "email": "demo@analyst.potomac",
        "name": "Demo User",
        "is_demo": True
    }
    
    token = create_jwt_token(demo_user["id"], is_demo=True)
    
    return {
        "success": True,
        "token": token,
        "user": demo_user
    }
```

#### Add Forgot Password Endpoint (Medium Priority)
```python
@app.post("/auth/forgot-password")
async def forgot_password(email: str):
    """Send password reset email"""
    user = await get_user_by_email(email)
    if not user:
        # Don't reveal if user exists
        return {"success": True, "message": "If email exists, reset link sent"}
    
    reset_token = generate_reset_token(user.id)
    await send_reset_email(email, reset_token)
    
    return {
        "success": True,
        "message": "Password reset link sent to email"
    }
```

---

## AFL Routes - Major Updates Required 🔴

### Current Implementation
```python
POST /afl/generate      ✅ Keep
POST /afl/optimize      ✅ Keep
GET  /afl/codes         ✅ Keep but modify response
```

### Required Changes

#### 1. **CRITICAL:** Modify `/afl/generate` Response Format

**Current Response Structure:**
```json
{
  "code": "...",
  "explanation": "...",
  "stats": { ... },
  "conversation_id": "..."
}
```

**New Required Format:**
```json
{
  "success": true,
  "id": "gen_789",           // ADD: Generation ID
  "afl_code": "...",          // RENAME: code → afl_code
  "explanation": "...",       // KEEP
  "metadata": {               // ADD: Metadata object
    "indicators_used": ["RSI", "MACD"],
    "timeframe": "daily",
    "risk_level": "medium"
  },
  "conversation_id": "..."    // KEEP (optional)
}
```

**Implementation:**
```python
@app.post("/afl/generate")
async def generate_afl(
    request: AFLGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    # Generate code (existing logic)
    code = await generate_afl_code(request.prompt)
    
    # NEW: Save generation with ID
    generation = await db.generations.insert_one({
        "user_id": current_user.id,
        "prompt": request.prompt,
        "code": code,
        "strategy_type": request.strategy_type,
        "created_at": datetime.utcnow(),
        "settings": request.settings
    })
    
    generation_id = str(generation.inserted_id)
    
    # NEW: Extract metadata
    metadata = {
        "indicators_used": extract_indicators(code),
        "timeframe": request.settings.get("timeframe", "daily"),
        "risk_level": calculate_risk_level(code)
    }
    
    return {
        "success": True,
        "id": generation_id,              # NEW
        "afl_code": code,                  # RENAMED
        "explanation": explanation,
        "metadata": metadata,              # NEW
        "conversation_id": request.conversation_id
    }
```

#### 2. **CRITICAL:** Add History Endpoint

**Frontend Needs:**
```
GET /afl/history?limit=20&offset=0
```

**Implementation:**
```python
@app.get("/afl/history")
async def get_afl_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get user's AFL generation history"""
    
    # Query database
    generations = await db.generations.find(
        {"user_id": current_user.id}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(None)
    
    total = await db.generations.count_documents({"user_id": current_user.id})
    
    # Format response
    history_items = []
    for gen in generations:
        history_items.append({
            "id": str(gen["_id"]),
            "title": gen.get("title") or gen["prompt"][:50] + "...",
            "timestamp": gen["created_at"].isoformat(),
            "strategy_type": gen.get("strategy_type", "standalone"),
            "preview": gen["code"][:100] + "..."
        })
    
    return {
        "generations": history_items,
        "total": total,
        "has_more": (offset + limit) < total
    }
```

#### 3. **CRITICAL:** Add Get Single Generation Endpoint

**Frontend Needs:**
```
GET /afl/generation/{id}
```

**Implementation:**
```python
@app.get("/afl/generation/{generation_id}")
async def get_generation(
    generation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Retrieve a specific generation"""
    
    from bson import ObjectId
    
    generation = await db.generations.find_one({
        "_id": ObjectId(generation_id),
        "user_id": current_user.id
    })
    
    if not generation:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    return {
        "id": str(generation["_id"]),
        "request": generation["prompt"],
        "afl_code": generation["code"],
        "strategy_type": generation.get("strategy_type", "standalone"),
        "timestamp": generation["created_at"].isoformat(),
        "backtest_settings": generation.get("settings", {})
    }
```

#### 4. **HIGH PRIORITY:** Add Delete Generation Endpoint

**Frontend Needs:**
```
DELETE /afl/generation/{id}
```

**Implementation:**
```python
@app.delete("/afl/generation/{generation_id}")
async def delete_generation(
    generation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a generation"""
    
    from bson import ObjectId
    
    result = await db.generations.delete_one({
        "_id": ObjectId(generation_id),
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    return {
        "success": True,
        "message": "Generation deleted successfully"
    }
```

#### 5. **HIGH PRIORITY:** Add Feedback Endpoint

**Frontend Needs:**
```
POST /afl/feedback
```

**Implementation:**
```python
class FeedbackRequest(BaseModel):
    generation_id: str
    feedback: str  # "positive" or "negative"
    comment: Optional[str] = None

@app.post("/afl/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    current_user: User = Depends(get_current_user)
):
    """Submit feedback on generated code"""
    
    # Save feedback
    await db.feedback.insert_one({
        "generation_id": request.generation_id,
        "user_id": current_user.id,
        "feedback": request.feedback,
        "comment": request.comment,
        "created_at": datetime.utcnow()
    })
    
    # Update generation with feedback
    from bson import ObjectId
    await db.generations.update_one(
        {"_id": ObjectId(request.generation_id)},
        {"$set": {"feedback": request.feedback}}
    )
    
    return {
        "success": True,
        "message": "Thank you for your feedback!"
    }
```

#### 6. **MEDIUM PRIORITY:** Add Format Code Endpoint

**Frontend Needs:**
```
POST /afl/format
```

**Implementation:**
```python
class FormatRequest(BaseModel):
    code: str

@app.post("/afl/format")
async def format_code(request: FormatRequest):
    """Format AFL code"""
    
    # Simple AFL code formatter
    formatted = format_afl_code(request.code)
    
    return {
        "success": True,
        "formatted_code": formatted
    }

def format_afl_code(code: str) -> str:
    """Basic AFL code formatter"""
    lines = code.split('\n')
    formatted_lines = []
    indent_level = 0
    
    for line in lines:
        stripped = line.strip()
        
        # Decrease indent for closing braces
        if stripped.startswith('}') or stripped.startswith(')'):
            indent_level = max(0, indent_level - 1)
        
        # Add indented line
        formatted_lines.append('  ' * indent_level + stripped)
        
        # Increase indent for opening braces
        if stripped.endswith('{') or stripped.endswith('('):
            indent_level += 1
    
    return '\n'.join(formatted_lines)
```

---

## Knowledge Base - Path Changes & New Endpoints 🔴

### Current Implementation
```python
POST /brain/upload    → Rename to /knowledge-base/upload
POST /brain/search    → Rename to /knowledge-base/search
```

### Required Changes

#### 1. **CRITICAL:** Rename Routes

**Option A: Keep Current Routes, Update Frontend**
```typescript
// In frontend /lib/api.ts
const API_PATHS = {
  knowledgeBase: {
    upload: '/brain/upload',      // Use existing
    search: '/brain/search',       // Use existing
    files: '/brain/files',         // New endpoint
  }
}
```

**Option B: Update Backend Routes (Recommended)**
```python
# Rename all /brain/* routes to /knowledge-base/*
@app.post("/knowledge-base/upload")  # was /brain/upload
@app.post("/knowledge-base/search")  # was /brain/search
```

#### 2. **CRITICAL:** Add List Files Endpoint

**Frontend Needs:**
```
GET /knowledge-base/files?limit=50&offset=0&search=query&tags=tag1,tag2
```

**Implementation:**
```python
@app.get("/knowledge-base/files")
async def list_files(
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None,
    tags: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """List all user's uploaded documents"""
    
    query = {"user_id": current_user.id}
    
    # Add search filter
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Add tags filter
    if tags:
        tag_list = tags.split(',')
        query["tags"] = {"$in": tag_list}
    
    # Get files
    files = await db.documents.find(query).skip(offset).limit(limit).to_list(None)
    total = await db.documents.count_documents(query)
    
    # Format response
    file_list = []
    for file in files:
        file_list.append({
            "id": str(file["_id"]),
            "name": file["name"],
            "size": file["size"],
            "type": file.get("type", "unknown"),
            "upload_date": file["created_at"].isoformat(),
            "tags": file.get("tags", []),
            "description": file.get("description", ""),
            "page_count": file.get("page_count"),
            "thumbnail_url": f"/api/files/{str(file['_id'])}/thumbnail"
        })
    
    return {
        "files": file_list,
        "total": total,
        "has_more": (offset + limit) < total
    }
```

#### 3. **CRITICAL:** Add Get Single File Endpoint

**Frontend Needs:**
```
GET /knowledge-base/files/{file_id}
```

**Implementation:**
```python
@app.get("/knowledge-base/files/{file_id}")
async def get_file_details(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed file information"""
    
    from bson import ObjectId
    
    file = await db.documents.find_one({
        "_id": ObjectId(file_id),
        "user_id": current_user.id
    })
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get usage statistics
    usage_stats = await get_file_usage_stats(file_id)
    
    return {
        "id": str(file["_id"]),
        "name": file["name"],
        "size": file["size"],
        "type": file.get("type"),
        "upload_date": file["created_at"].isoformat(),
        "tags": file.get("tags", []),
        "description": file.get("description", ""),
        "page_count": file.get("page_count"),
        "word_count": file.get("word_count"),
        "metadata": file.get("metadata", {}),
        "usage_stats": usage_stats
    }

async def get_file_usage_stats(file_id: str) -> dict:
    """Calculate file usage statistics"""
    
    # Count references in generations
    generations_count = await db.generations.count_documents({
        "file_ids": file_id
    })
    
    # Count references in chats
    chats_count = await db.messages.count_documents({
        "file_ids": file_id
    })
    
    return {
        "referenced_in_generations": generations_count,
        "referenced_in_chats": chats_count
    }
```

#### 4. **HIGH PRIORITY:** Add Delete File Endpoint

**Frontend Needs:**
```
DELETE /knowledge-base/files/{file_id}
```

**Implementation:**
```python
@app.delete("/knowledge-base/files/{file_id}")
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a file from knowledge base"""
    
    from bson import ObjectId
    
    file = await db.documents.find_one({
        "_id": ObjectId(file_id),
        "user_id": current_user.id
    })
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete from storage
    file_path = file.get("file_path")
    if file_path and os.path.exists(file_path):
        os.remove(file_path)
    
    # Delete from database
    await db.documents.delete_one({"_id": ObjectId(file_id)})
    
    return {
        "success": True,
        "message": "File deleted successfully"
    }
```

#### 5. **HIGH PRIORITY:** Add Download File Endpoint

**Frontend Needs:**
```
GET /knowledge-base/files/{file_id}/download
```

**Implementation:**
```python
from fastapi.responses import FileResponse

@app.get("/knowledge-base/files/{file_id}/download")
async def download_file(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """Download a file"""
    
    from bson import ObjectId
    
    file = await db.documents.find_one({
        "_id": ObjectId(file_id),
        "user_id": current_user.id
    })
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = file.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=file_path,
        filename=file["name"],
        media_type=file.get("mime_type", "application/octet-stream")
    )
```

#### 6. **MEDIUM PRIORITY:** Add Update File Metadata Endpoint

**Frontend Needs:**
```
PATCH /knowledge-base/files/{file_id}
```

**Implementation:**
```python
class UpdateFileRequest(BaseModel):
    tags: Optional[List[str]] = None
    description: Optional[str] = None

@app.patch("/knowledge-base/files/{file_id}")
async def update_file_metadata(
    file_id: str,
    request: UpdateFileRequest,
    current_user: User = Depends(get_current_user)
):
    """Update file tags and description"""
    
    from bson import ObjectId
    
    update_fields = {}
    if request.tags is not None:
        update_fields["tags"] = request.tags
    if request.description is not None:
        update_fields["description"] = request.description
    
    result = await db.documents.update_one(
        {
            "_id": ObjectId(file_id),
            "user_id": current_user.id
        },
        {"$set": update_fields}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Return updated file
    updated_file = await db.documents.find_one({"_id": ObjectId(file_id)})
    
    return {
        "success": True,
        "file": {
            "id": str(updated_file["_id"]),
            "tags": updated_file.get("tags", []),
            "description": updated_file.get("description", "")
        }
    }
```

#### 7. **CRITICAL:** Update Upload Response Format

**Current vs. New Format:**

**Current:**
```json
{
  "document_id": "...",
  "title": "...",
  "category": "...",
  "status": "..."
}
```

**New Required:**
```json
{
  "success": true,
  "file": {
    "id": "file_123",
    "name": "document.pdf",
    "size": 1024567,
    "type": "pdf",
    "upload_date": "2026-02-01T15:30:00Z",
    "url": "/api/files/file_123",
    "tags": ["strategy"],
    "description": "Trading strategy document"
  }
}
```

---

## Chat System - Streaming & New Endpoints 🔴

### Current Implementation
```python
POST /chat/message         ✅ Keep but modify
GET  /chat/conversations   ✅ Keep but modify
```

### Required Changes

#### 1. **CRITICAL:** Add Server-Sent Events (SSE) Streaming

**Current:** Synchronous response  
**New:** Stream response tokens in real-time

**Implementation:**
```python
from fastapi.responses import StreamingResponse
import json
import asyncio

@app.post("/chat/conversations/{conversation_id}/messages")
async def send_message_stream(
    conversation_id: str,
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """Send message and stream AI response"""
    
    # Save user message
    user_msg = await db.messages.insert_one({
        "conversation_id": conversation_id,
        "user_id": current_user.id,
        "role": "user",
        "content": request.content,
        "created_at": datetime.utcnow()
    })
    
    async def generate_stream():
        """Generator for SSE stream"""
        message_id = str(ObjectId())
        
        # Send start event
        yield f"data: {json.dumps({'type': 'start', 'message_id': message_id})}\n\n"
        
        full_content = ""
        
        # Stream AI response (using your Claude integration)
        async for token in stream_ai_response(request.content):
            full_content += token
            yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
            await asyncio.sleep(0.01)  # Small delay for better UX
        
        # Save assistant message
        await db.messages.insert_one({
            "_id": ObjectId(message_id),
            "conversation_id": conversation_id,
            "user_id": current_user.id,
            "role": "assistant",
            "content": full_content,
            "created_at": datetime.utcnow()
        })
        
        # Send completion event
        yield f"data: {json.dumps({'type': 'done', 'message_id': message_id, 'full_content': full_content})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

async def stream_ai_response(prompt: str):
    """Stream tokens from Claude AI"""
    # Use your existing Claude integration
    # This is a placeholder - adapt to your implementation
    
    client = anthropic.AsyncAnthropic(api_key=CLAUDE_API_KEY)
    
    async with client.messages.stream(
        model="claude-3-5-sonnet-20241022",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        async for text in stream.text_stream:
            yield text
```

#### 2. **CRITICAL:** Add Get Messages Endpoint

**Frontend Needs:**
```
GET /chat/conversations/{conversation_id}/messages
```

**Implementation:**
```python
@app.get("/chat/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all messages in a conversation"""
    
    # Verify conversation belongs to user
    conversation = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": current_user.id
    })
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get messages
    messages = await db.messages.find({
        "conversation_id": conversation_id
    }).sort("created_at", 1).to_list(None)
    
    # Format messages
    formatted_messages = []
    for msg in messages:
        formatted_messages.append({
            "id": str(msg["_id"]),
            "conversation_id": conversation_id,
            "role": msg["role"],
            "content": msg["content"],
            "timestamp": msg["created_at"].isoformat(),
            "code_blocks": extract_code_blocks(msg["content"])  # Parse code blocks
        })
    
    return {
        "messages": formatted_messages,
        "has_more": False
    }

def extract_code_blocks(content: str) -> List[dict]:
    """Extract code blocks from markdown content"""
    import re
    
    pattern = r'```(\w+)?\n(.*?)```'
    matches = re.findall(pattern, content, re.DOTALL)
    
    code_blocks = []
    for language, code in matches:
        code_blocks.append({
            "language": language or "text",
            "code": code.strip()
        })
    
    return code_blocks
```

#### 3. **HIGH PRIORITY:** Add Create Conversation Endpoint

**Frontend Needs:**
```
POST /chat/conversations
```

**Implementation:**
```python
class CreateConversationRequest(BaseModel):
    title: str = "New Conversation"

@app.post("/chat/conversations")
async def create_conversation(
    request: CreateConversationRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new conversation"""
    
    conversation = await db.conversations.insert_one({
        "user_id": current_user.id,
        "title": request.title,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    return {
        "id": str(conversation.inserted_id),
        "title": request.title,
        "created_at": datetime.utcnow().isoformat(),
        "messages": []
    }
```

#### 4. **HIGH PRIORITY:** Add Delete Conversation Endpoint

**Frontend Needs:**
```
DELETE /chat/conversations/{conversation_id}
```

**Implementation:**
```python
@app.delete("/chat/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a conversation and all its messages"""
    
    from bson import ObjectId
    
    # Delete conversation
    result = await db.conversations.delete_one({
        "_id": ObjectId(conversation_id),
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Delete all messages in conversation
    await db.messages.delete_many({"conversation_id": conversation_id})
    
    return {
        "success": True,
        "message": "Conversation deleted successfully"
    }
```

#### 5. **MEDIUM PRIORITY:** Add File Attachment Upload

**Frontend Needs:**
```
POST /chat/upload-attachment
```

**Implementation:**
```python
@app.post("/chat/upload-attachment")
async def upload_attachment(
    file: UploadFile = File(...),
    conversation_id: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """Upload file attachment for chat"""
    
    # Save file
    file_id = str(ObjectId())
    file_path = f"uploads/chat/{file_id}_{file.filename}"
    
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Save metadata
    await db.attachments.insert_one({
        "_id": ObjectId(file_id),
        "conversation_id": conversation_id,
        "user_id": current_user.id,
        "filename": file.filename,
        "file_path": file_path,
        "size": len(content),
        "mime_type": file.content_type,
        "created_at": datetime.utcnow()
    })
    
    return {
        "attachment_id": file_id,
        "filename": file.filename,
        "size": len(content),
        "url": f"/api/files/{file_id}"
    }
```

#### 6. **CRITICAL:** Update Conversations List Response

**Current vs. New:**

**Current:**
```json
{
  "conversations": [
    {
      "conversation_id": "...",
      "title": "...",
      "created_at": "...",
      "last_message_at": "...",
      "message_count": 15
    }
  ],
  "total": 10
}
```

**New (ADD these fields):**
```json
{
  "conversations": [
    {
      "id": "conv_123",              // RENAME: conversation_id → id
      "title": "...",
      "created_at": "...",
      "updated_at": "...",            // ADD
      "message_count": 15,
      "preview": "Last message..."    // ADD: First 100 chars of last message
    }
  ],
  "total": 10
}
```

---

## Dashboard - New Feature 🆕

### Current Implementation
**NONE** - This is completely new

### Required Implementation

#### 1. **CRITICAL:** Dashboard Statistics Endpoint

**Frontend Needs:**
```
GET /api/dashboard/stats
```

**Implementation:**
```python
@app.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user)
):
    """Get user's dashboard statistics"""
    
    # Count strategies (generations)
    total_strategies = await db.generations.count_documents({
        "user_id": current_user.id
    })
    
    # Count backtests
    total_backtests = await db.backtests.count_documents({
        "user_id": current_user.id
    })
    
    # Calculate win rate (from backtest data)
    backtest_results = await db.backtests.find({
        "user_id": current_user.id
    }).to_list(None)
    
    if backtest_results:
        total_trades = sum(bt.get("metrics", {}).get("total_trades", 0) for bt in backtest_results)
        winning_trades = sum(bt.get("metrics", {}).get("winning_trades", 0) for bt in backtest_results)
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
    else:
        total_trades = 0
        win_rate = 0
    
    # Calculate changes from last period (30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    prev_strategies = await db.generations.count_documents({
        "user_id": current_user.id,
        "created_at": {"$lt": thirty_days_ago}
    })
    
    strategy_change = calculate_percentage_change(total_strategies, prev_strategies)
    
    return {
        "total_strategies": total_strategies,
        "total_backtests": total_backtests,
        "win_rate": round(win_rate, 1),
        "total_trades": total_trades,
        "change_from_last_period": {
            "strategies": strategy_change,
            "backtests": 8.3,  # Calculate similarly
            "win_rate": -2.1,  # Calculate similarly
            "trades": 15.4     # Calculate similarly
        }
    }

def calculate_percentage_change(current: int, previous: int) -> float:
    """Calculate percentage change"""
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round((current - previous) / previous * 100, 1)
```

#### 2. **HIGH PRIORITY:** Recent Activity Feed

**Frontend Needs:**
```
GET /api/dashboard/activity?limit=10&offset=0
```

**Implementation:**
```python
@app.get("/dashboard/activity")
async def get_recent_activity(
    limit: int = 10,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get user's recent activity"""
    
    activities = []
    
    # Get recent generations
    recent_generations = await db.generations.find({
        "user_id": current_user.id
    }).sort("created_at", -1).limit(limit).to_list(None)
    
    for gen in recent_generations:
        activities.append({
            "id": f"gen_{str(gen['_id'])}",
            "type": "code_generation",
            "title": f"Generated AFL code for {gen['prompt'][:50]}...",
            "timestamp": gen["created_at"].isoformat(),
            "icon": "code",
            "color": "#FEC00F"
        })
    
    # Get recent backtests
    recent_backtests = await db.backtests.find({
        "user_id": current_user.id
    }).sort("created_at", -1).limit(limit).to_list(None)
    
    for bt in recent_backtests:
        activities.append({
            "id": f"bt_{str(bt['_id'])}",
            "type": "backtest",
            "title": f"Completed backtest for {bt.get('strategy_name', 'Strategy')}",
            "timestamp": bt["created_at"].isoformat(),
            "icon": "trending-up",
            "color": "#22C55E"
        })
    
    # Sort all activities by timestamp
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    activities = activities[offset:offset+limit]
    
    return {
        "activities": activities,
        "total": len(activities),
        "has_more": len(activities) == limit
    }
```

---

## Backtest Analysis - Significant Expansion 🔴

### Current Implementation
```python
POST /backtest/upload   ✅ Keep but modify response
```

### Required Changes

#### 1. **CRITICAL:** Update Upload Response Format

**Current:**
```json
{
  "backtest_id": "...",
  "metrics": { ... },
  "analysis": "...",
  "recommendations": [ ... ]
}
```

**New Required:**
```json
{
  "success": true,
  "backtest": {
    "id": "bt_456",
    "strategy_name": "RSI Strategy",
    "upload_date": "2026-02-01T16:00:00Z",
    "status": "processing"
  }
}
```

**Then add separate results endpoint...**

#### 2. **CRITICAL:** Add Get Results Endpoint

**Frontend Needs:**
```
GET /backtest/{backtest_id}/results
```

**Implementation:**
```python
@app.get("/backtest/{backtest_id}/results")
async def get_backtest_results(
    backtest_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed backtest results"""
    
    from bson import ObjectId
    
    backtest = await db.backtests.find_one({
        "_id": ObjectId(backtest_id),
        "user_id": current_user.id
    })
    
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    return {
        "id": str(backtest["_id"]),
        "strategy_name": backtest.get("strategy_name", "Unnamed Strategy"),
        "date_range": {
            "start": backtest.get("start_date"),
            "end": backtest.get("end_date")
        },
        "summary": {
            "total_return": backtest["metrics"]["total_return"],
            "annual_return": backtest["metrics"].get("annual_return", 0),
            "sharpe_ratio": backtest["metrics"]["sharpe_ratio"],
            "max_drawdown": backtest["metrics"]["max_drawdown"],
            "win_rate": backtest["metrics"]["win_rate"],
            "profit_factor": backtest["metrics"].get("profit_factor", 0),
            "total_trades": backtest["metrics"]["total_trades"],
            "winning_trades": backtest["metrics"].get("winning_trades", 0),
            "losing_trades": backtest["metrics"].get("losing_trades", 0)
        },
        "monthly_returns": backtest.get("monthly_returns", []),
        "equity_curve": backtest.get("equity_curve", []),
        "trades": backtest.get("trades", [])
    }
```

#### 3. **HIGH PRIORITY:** Add AI Insights Endpoint

**Frontend Needs:**
```
POST /backtest/{backtest_id}/insights
```

**Implementation:**
```python
@app.post("/backtest/{backtest_id}/insights")
async def generate_backtest_insights(
    backtest_id: str,
    current_user: User = Depends(get_current_user)
):
    """Generate AI insights for backtest results"""
    
    from bson import ObjectId
    
    backtest = await db.backtests.find_one({
        "_id": ObjectId(backtest_id),
        "user_id": current_user.id
    })
    
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    metrics = backtest["metrics"]
    
    insights = []
    
    # Analyze win rate
    if metrics["win_rate"] > 60:
        insights.append({
            "type": "strength",
            "title": "Strong Win Rate",
            "description": f"Your strategy maintains a {metrics['win_rate']:.1f}% win rate, which is excellent.",
            "icon": "trending-up",
            "color": "#22C55E"
        })
    elif metrics["win_rate"] < 45:
        insights.append({
            "type": "warning",
            "title": "Low Win Rate",
            "description": f"Win rate of {metrics['win_rate']:.1f}% may need improvement.",
            "icon": "alert-triangle",
            "color": "#FF9800"
        })
    
    # Analyze drawdown
    if abs(metrics["max_drawdown"]) > 20:
        insights.append({
            "type": "warning",
            "title": "Large Drawdown Risk",
            "description": f"Maximum drawdown of {metrics['max_drawdown']:.1f}% suggests room for improvement in risk management.",
            "icon": "alert-triangle",
            "color": "#FF9800"
        })
    
    # Analyze Sharpe ratio
    if metrics["sharpe_ratio"] > 1.5:
        insights.append({
            "type": "strength",
            "title": "Excellent Risk-Adjusted Returns",
            "description": f"Sharpe ratio of {metrics['sharpe_ratio']:.2f} indicates strong risk-adjusted performance.",
            "icon": "star",
            "color": "#22C55E"
        })
    
    # General recommendation
    insights.append({
        "type": "recommendation",
        "title": "Consider Position Sizing",
        "description": "Implementing Kelly Criterion could optimize your position sizes and reduce drawdown.",
        "icon": "lightbulb",
        "color": "#60A5FA"
    })
    
    # Calculate overall rating
    rating_score = calculate_strategy_rating(metrics)
    overall_rating = "excellent" if rating_score > 8 else "good" if rating_score > 6 else "fair"
    
    return {
        "insights": insights,
        "overall_rating": overall_rating,
        "rating_score": rating_score
    }

def calculate_strategy_rating(metrics: dict) -> float:
    """Calculate overall strategy rating (0-10)"""
    score = 5.0  # Start at 5
    
    # Win rate component
    if metrics["win_rate"] > 60:
        score += 1.5
    elif metrics["win_rate"] > 50:
        score += 0.5
    elif metrics["win_rate"] < 40:
        score -= 1.0
    
    # Sharpe ratio component
    if metrics["sharpe_ratio"] > 2.0:
        score += 2.0
    elif metrics["sharpe_ratio"] > 1.0:
        score += 1.0
    elif metrics["sharpe_ratio"] < 0.5:
        score -= 1.5
    
    # Drawdown component
    max_dd = abs(metrics["max_drawdown"])
    if max_dd < 10:
        score += 1.5
    elif max_dd > 25:
        score -= 1.5
    
    return max(0, min(10, score))  # Clamp between 0-10
```

#### 4. **MEDIUM PRIORITY:** Add Compare Backtests Endpoint

**Frontend Needs:**
```
POST /backtest/compare
```

**Implementation:**
```python
class CompareBacktestsRequest(BaseModel):
    backtest_ids: List[str]

@app.post("/backtest/compare")
async def compare_backtests(
    request: CompareBacktestsRequest,
    current_user: User = Depends(get_current_user)
):
    """Compare multiple backtests"""
    
    if len(request.backtest_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 backtests required")
    
    from bson import ObjectId
    
    backtests = []
    for bt_id in request.backtest_ids:
        bt = await db.backtests.find_one({
            "_id": ObjectId(bt_id),
            "user_id": current_user.id
        })
        if bt:
            backtests.append(bt)
    
    # Format comparison
    comparison_data = []
    for bt in backtests:
        comparison_data.append({
            "id": str(bt["_id"]),
            "name": bt.get("strategy_name", "Unnamed"),
            "total_return": bt["metrics"]["total_return"],
            "sharpe_ratio": bt["metrics"]["sharpe_ratio"],
            "max_drawdown": bt["metrics"]["max_drawdown"],
            "win_rate": bt["metrics"]["win_rate"]
        })
    
    # Determine winners
    best_return = max(comparison_data, key=lambda x: x["total_return"])
    best_sharpe = max(comparison_data, key=lambda x: x["sharpe_ratio"])
    best_drawdown = max(comparison_data, key=lambda x: -abs(x["max_drawdown"]))
    
    return {
        "comparison": {
            "backtests": comparison_data,
            "winner": {
                "by_return": best_return["id"],
                "by_sharpe": best_sharpe["id"],
                "by_drawdown": best_drawdown["id"]
            }
        }
    }
```

#### 5. **MEDIUM PRIORITY:** Add Export Report Endpoint

**Frontend Needs:**
```
GET /backtest/{backtest_id}/export?format=pdf
```

**Implementation:**
```python
from fastapi.responses import StreamingResponse
import io

@app.get("/backtest/{backtest_id}/export")
async def export_backtest_report(
    backtest_id: str,
    format: str = "pdf",
    current_user: User = Depends(get_current_user)
):
    """Export backtest report as PDF or Excel"""
    
    from bson import ObjectId
    
    backtest = await db.backtests.find_one({
        "_id": ObjectId(backtest_id),
        "user_id": current_user.id
    })
    
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    if format == "pdf":
        # Generate PDF report
        pdf_bytes = generate_pdf_report(backtest)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=backtest_{backtest_id}.pdf"}
        )
    elif format == "excel":
        # Generate Excel report
        excel_bytes = generate_excel_report(backtest)
        return StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=backtest_{backtest_id}.xlsx"}
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid format")

def generate_pdf_report(backtest: dict) -> bytes:
    """Generate PDF report (placeholder - use ReportLab or similar)"""
    # TODO: Implement PDF generation
    return b"PDF content here"

def generate_excel_report(backtest: dict) -> bytes:
    """Generate Excel report (placeholder - use openpyxl or pandas)"""
    # TODO: Implement Excel generation
    return b"Excel content here"
```

#### 6. **MEDIUM PRIORITY:** Add Delete Backtest Endpoint

**Frontend Needs:**
```
DELETE /backtest/{backtest_id}
```

**Implementation:**
```python
@app.delete("/backtest/{backtest_id}")
async def delete_backtest(
    backtest_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a backtest"""
    
    from bson import ObjectId
    
    result = await db.backtests.delete_one({
        "_id": ObjectId(backtest_id),
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    return {
        "success": True,
        "message": "Backtest deleted successfully"
    }
```

---

## Reverse Engineer - Restructure Required 🔴

### Current Implementation
```python
POST /reverse-engineer/start
POST /reverse-engineer/generate-code/{strategy_id}
```

### Required Changes

#### 1. **HIGH PRIORITY:** Add Image Upload Endpoint

**Frontend Needs:**
```
POST /reverse-engineer/upload-image
```

**Implementation:**
```python
@app.post("/reverse-engineer/upload-image")
async def upload_chart_image(
    image: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """Upload chart image for analysis"""
    
    # Validate image
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Save image
    analysis_id = str(ObjectId())
    image_path = f"uploads/reverse_engineer/{analysis_id}_{image.filename}"
    
    os.makedirs(os.path.dirname(image_path), exist_ok=True)
    
    with open(image_path, "wb") as f:
        content = await image.read()
        f.write(content)
    
    # Create analysis record
    await db.reverse_analyses.insert_one({
        "_id": ObjectId(analysis_id),
        "user_id": current_user.id,
        "image_path": image_path,
        "description": description,
        "status": "processing",
        "created_at": datetime.utcnow()
    })
    
    # Start background analysis task
    # asyncio.create_task(analyze_chart_image(analysis_id, image_path))
    
    return {
        "success": True,
        "analysis_id": analysis_id,
        "status": "processing",
        "estimated_time": 30
    }
```

#### 2. **HIGH PRIORITY:** Add Get Analysis Results Endpoint

**Frontend Needs:**
```
GET /reverse-engineer/{analysis_id}/results
```

**Implementation:**
```python
@app.get("/reverse-engineer/{analysis_id}/results")
async def get_analysis_results(
    analysis_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get reverse engineering analysis results"""
    
    from bson import ObjectId
    
    analysis = await db.reverse_analyses.find_one({
        "_id": ObjectId(analysis_id),
        "user_id": current_user.id
    })
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    if analysis["status"] == "processing":
        return {
            "analysis_id": analysis_id,
            "status": "processing",
            "progress": analysis.get("progress", 0)
        }
    elif analysis["status"] == "failed":
        return {
            "analysis_id": analysis_id,
            "status": "failed",
            "error": analysis.get("error", "Analysis failed")
        }
    else:
        return {
            "analysis_id": analysis_id,
            "status": "completed",
            "detected_patterns": analysis.get("patterns", []),
            "suggested_strategy": analysis.get("strategy", {}),
            "confidence_score": analysis.get("confidence", 0.0)
        }
```

#### 3. **MEDIUM PRIORITY:** Add Text Description Endpoint

**Frontend Needs:**
```
POST /reverse-engineer/from-description
```

**Implementation:**
```python
class DescriptionRequest(BaseModel):
    description: str

@app.post("/reverse-engineer/from-description")
async def analyze_from_description(
    request: DescriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze strategy from text description"""
    
    # Create analysis record
    analysis_id = str(ObjectId())
    
    await db.reverse_analyses.insert_one({
        "_id": ObjectId(analysis_id),
        "user_id": current_user.id,
        "description": request.description,
        "status": "processing",
        "created_at": datetime.utcnow()
    })
    
    # Analyze with AI
    patterns = await extract_patterns_from_text(request.description)
    strategy = await generate_strategy_from_patterns(patterns)
    
    # Update analysis
    await db.reverse_analyses.update_one(
        {"_id": ObjectId(analysis_id)},
        {
            "$set": {
                "status": "completed",
                "patterns": patterns,
                "strategy": strategy,
                "confidence": 0.85
            }
        }
    )
    
    return {
        "analysis_id": analysis_id,
        "status": "completed",
        "detected_patterns": patterns,
        "suggested_strategy": strategy,
        "confidence_score": 0.85
    }

async def extract_patterns_from_text(description: str) -> List[dict]:
    """Extract trading patterns from text description"""
    # Use AI to analyze description
    # This is a placeholder
    return [
        {
            "type": "support_resistance",
            "confidence": 0.92,
            "description": "Support level mentioned at specific price"
        }
    ]

async def generate_strategy_from_patterns(patterns: List[dict]) -> dict:
    """Generate strategy from detected patterns"""
    # Use AI to generate strategy
    # This is a placeholder
    return {
        "name": "Pattern-Based Strategy",
        "entry_rules": ["Rule 1", "Rule 2"],
        "exit_rules": ["Rule 1", "Rule 2"],
        "afl_code": "// Generated AFL code"
    }
```

---

## Settings - Completely New 🆕

### Current Implementation
**NONE** - Settings are client-side only

### Required Implementation

#### 1. **HIGH PRIORITY:** Update Profile Endpoint

**Frontend Needs:**
```
PATCH /settings/profile
```

**Implementation:**
```python
class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

@app.patch("/settings/profile")
async def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user profile"""
    
    update_fields = {}
    
    if request.name:
        update_fields["name"] = request.name
    
    if request.email:
        # Check if email already exists
        existing = await db.users.find_one({"email": request.email})
        if existing and str(existing["_id"]) != current_user.id:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_fields["email"] = request.email
    
    if update_fields:
        from bson import ObjectId
        await db.users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": update_fields}
        )
    
    # Return updated user
    updated_user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    
    return {
        "success": True,
        "user": {
            "id": str(updated_user["_id"]),
            "name": updated_user["name"],
            "email": updated_user["email"]
        }
    }
```

#### 2. **HIGH PRIORITY:** Change Password Endpoint

**Frontend Needs:**
```
POST /settings/change-password
```

**Implementation:**
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

@app.post("/settings/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    """Change user password"""
    
    # Validate new password matches confirmation
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    # Get current user
    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    
    # Verify current password
    if not pwd_context.verify(request.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    hashed_password = pwd_context.hash(request.new_password)
    
    # Update password
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"password": hashed_password}}
    )
    
    return {
        "success": True,
        "message": "Password changed successfully"
    }
```

#### 3. **MEDIUM PRIORITY:** API Keys Management

**Frontend Needs:**
```
GET    /settings/api-keys
POST   /settings/api-keys
DELETE /settings/api-keys/{key_id}
```

**Implementation:**
```python
import secrets

class CreateAPIKeyRequest(BaseModel):
    name: str
    permissions: List[str] = ["read", "write"]

@app.post("/settings/api-keys")
async def create_api_key(
    request: CreateAPIKeyRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate new API key"""
    
    # Generate secure API key
    api_key = f"pk_live_{secrets.token_urlsafe(32)}"
    
    # Save to database
    key_doc = await db.api_keys.insert_one({
        "user_id": current_user.id,
        "name": request.name,
        "key_hash": pwd_context.hash(api_key),  # Store hashed
        "permissions": request.permissions,
        "created_at": datetime.utcnow(),
        "last_used": None
    })
    
    return {
        "success": True,
        "api_key": {
            "id": str(key_doc.inserted_id),
            "key": api_key,  # Only shown once!
            "name": request.name,
            "created_at": datetime.utcnow().isoformat(),
            "permissions": request.permissions,
            "last_used": None
        },
        "warning": "Store this key securely. It will not be shown again."
    }

@app.get("/settings/api-keys")
async def list_api_keys(
    current_user: User = Depends(get_current_user)
):
    """List user's API keys"""
    
    keys = await db.api_keys.find({
        "user_id": current_user.id
    }).to_list(None)
    
    api_keys = []
    for key in keys:
        api_keys.append({
            "id": str(key["_id"]),
            "key": "pk_live_***" + key["key_hash"][-8:],  # Masked
            "name": key["name"],
            "created_at": key["created_at"].isoformat(),
            "last_used": key.get("last_used"),
            "permissions": key["permissions"]
        })
    
    return {"api_keys": api_keys}

@app.delete("/settings/api-keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user: User = Depends(get_current_user)
):
    """Revoke API key"""
    
    from bson import ObjectId
    
    result = await db.api_keys.delete_one({
        "_id": ObjectId(key_id),
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="API key not found")
    
    return {
        "success": True,
        "message": "API key revoked successfully"
    }
```

#### 4. **MEDIUM PRIORITY:** Appearance Settings

**Frontend Needs:**
```
PATCH /settings/appearance
```

**Implementation:**
```python
class AppearanceSettings(BaseModel):
    theme: str  # "light", "dark", "system"
    accent_color: str
    font_size: str  # "small", "medium", "large"

@app.patch("/settings/appearance")
async def update_appearance(
    settings: AppearanceSettings,
    current_user: User = Depends(get_current_user)
):
    """Update appearance settings"""
    
    from bson import ObjectId
    
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {
            "$set": {
                "settings.appearance": settings.dict()
            }
        }
    )
    
    return {
        "success": True,
        "settings": settings.dict()
    }
```

#### 5. **MEDIUM PRIORITY:** Notification Settings

**Frontend Needs:**
```
PATCH /settings/notifications
```

**Implementation:**
```python
class NotificationSettings(BaseModel):
    email_notifications: bool
    code_gen_complete: bool
    backtest_complete: bool
    system_updates: bool
    marketing_emails: bool

@app.patch("/settings/notifications")
async def update_notifications(
    settings: NotificationSettings,
    current_user: User = Depends(get_current_user)
):
    """Update notification settings"""
    
    from bson import ObjectId
    
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {
            "$set": {
                "settings.notifications": settings.dict()
            }
        }
    )
    
    return {
        "success": True,
        "notifications": settings.dict()
    }
```

#### 6. **LOW PRIORITY:** Delete Account

**Frontend Needs:**
```
DELETE /settings/account
```

**Implementation:**
```python
class DeleteAccountRequest(BaseModel):
    password: str
    confirmation: str

@app.delete("/settings/account")
async def delete_account(
    request: DeleteAccountRequest,
    current_user: User = Depends(get_current_user)
):
    """Delete user account"""
    
    # Verify confirmation
    if request.confirmation != "DELETE":
        raise HTTPException(status_code=400, detail="Invalid confirmation")
    
    # Verify password
    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    
    if not pwd_context.verify(request.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid password")
    
    # Delete all user data
    await db.users.delete_one({"_id": ObjectId(current_user.id)})
    await db.generations.delete_many({"user_id": current_user.id})
    await db.conversations.delete_many({"user_id": current_user.id})
    await db.messages.delete_many({"user_id": current_user.id})
    await db.backtests.delete_many({"user_id": current_user.id})
    await db.documents.delete_many({"user_id": current_user.id})
    
    return {
        "success": True,
        "message": "Account deleted successfully"
    }
```

---

## Admin Panel - Restructure Required 🔴

### Current Implementation
```python
GET  /admin/status      → Modify
POST /admin/train       → Keep
GET  /admin/training    → Keep
```

### Required Changes

#### 1. **HIGH PRIORITY:** Add User Management Endpoint

**Frontend Needs:**
```
GET /admin/users?page=1&limit=50
```

**Implementation:**
```python
@app.get("/admin/users")
async def list_users(
    page: int = 1,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """List all users (admin only)"""
    
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    skip = (page - 1) * limit
    
    users = await db.users.find().skip(skip).limit(limit).to_list(None)
    total = await db.users.count_documents({})
    
    user_list = []
    for user in users:
        # Get usage stats
        gen_count = await db.generations.count_documents({"user_id": str(user["_id"])})
        bt_count = await db.backtests.count_documents({"user_id": str(user["_id"])})
        
        # Calculate storage used
        docs = await db.documents.find({"user_id": str(user["_id"])}).to_list(None)
        storage_used = sum(doc.get("size", 0) for doc in docs) / (1024 * 1024)  # MB
        
        user_list.append({
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": "admin" if user.get("is_admin") else "trader",
            "created_at": user["created_at"].isoformat(),
            "last_login": user.get("last_login"),
            "status": "active",
            "usage_stats": {
                "generations": gen_count,
                "backtests": bt_count,
                "storage_used_mb": round(storage_used, 2)
            }
        })
    
    return {
        "users": user_list,
        "total": total,
        "page": page,
        "per_page": limit,
        "pages": (total + limit - 1) // limit,
        "has_next": page * limit < total,
        "has_prev": page > 1
    }
```

#### 2. **HIGH PRIORITY:** Update User Role Endpoint

**Frontend Needs:**
```
PATCH /admin/users/{user_id}
```

**Implementation:**
```python
class UpdateUserRequest(BaseModel):
    role: str  # "admin" or "trader"

@app.patch("/admin/users/{user_id}")
async def update_user_role(
    user_id: str,
    request: UpdateUserRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user role (admin only)"""
    
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from bson import ObjectId
    
    is_admin = request.role == "admin"
    
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_admin": is_admin}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    return {
        "success": True,
        "user": {
            "id": str(updated_user["_id"]),
            "name": updated_user["name"],
            "email": updated_user["email"],
            "role": "admin" if updated_user.get("is_admin") else "trader"
        }
    }
```

#### 3. **HIGH PRIORITY:** System Stats Endpoint

**Frontend Needs:**
```
GET /admin/system/stats
```

**Implementation:**
```python
@app.get("/admin/system/stats")
async def get_system_stats(
    current_user: User = Depends(get_current_user)
):
    """Get system-wide statistics (admin only)"""
    
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Count users
    total_users = await db.users.count_documents({})
    
    # Count active users today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    active_today = await db.users.count_documents({
        "last_login": {"$gte": today_start}
    })
    
    # Count generations
    total_generations = await db.generations.count_documents({})
    
    # Calculate storage
    all_docs = await db.documents.find().to_list(None)
    total_storage = sum(doc.get("size", 0) for doc in all_docs) / (1024 * 1024 * 1024)  # GB
    
    # API calls today (if you track this)
    api_calls_today = 12456  # Placeholder
    
    # Error rate (if you track this)
    error_rate = 0.23  # Placeholder
    
    # Avg response time (if you track this)
    avg_response_time = 234  # Placeholder
    
    return {
        "total_users": total_users,
        "active_users_today": active_today,
        "total_generations": total_generations,
        "total_storage_gb": round(total_storage, 2),
        "api_calls_today": api_calls_today,
        "error_rate": error_rate,
        "avg_response_time_ms": avg_response_time
    }
```

#### 4. **MEDIUM PRIORITY:** API Logs Endpoint

**Frontend Needs:**
```
GET /admin/logs?type=api&limit=100&start_date=2026-01-01&end_date=2026-02-01
```

**Implementation:**
```python
@app.get("/admin/logs")
async def get_api_logs(
    type: str = "api",
    limit: int = 100,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get API logs (admin only)"""
    
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {"type": type}
    
    if start_date:
        query["timestamp"] = {"$gte": datetime.fromisoformat(start_date)}
    if end_date:
        if "timestamp" not in query:
            query["timestamp"] = {}
        query["timestamp"]["$lte"] = datetime.fromisoformat(end_date)
    
    logs = await db.logs.find(query).sort("timestamp", -1).limit(limit).to_list(None)
    total = await db.logs.count_documents(query)
    
    log_list = []
    for log in logs:
        log_list.append({
            "id": str(log["_id"]),
            "timestamp": log["timestamp"].isoformat(),
            "user_id": log.get("user_id"),
            "endpoint": log.get("endpoint"),
            "method": log.get("method"),
            "status": log.get("status"),
            "response_time_ms": log.get("response_time"),
            "ip_address": log.get("ip_address")
        })
    
    return {
        "logs": log_list,
        "total": total
    }
```

---

## Training System - Expansion Required 🔴

### Current Implementation
```python
POST /train/feedback   ✅ Keep
POST /train/test       ✅ Keep
```

### Required Additions

#### 1. **LOW PRIORITY:** Training Courses Endpoint

**Frontend Needs:**
```
GET /training/courses
```

**Implementation:**
```python
@app.get("/training/courses")
async def list_courses(
    current_user: User = Depends(get_current_user)
):
    """List available training courses"""
    
    courses = await db.courses.find().to_list(None)
    
    # Get user progress
    user_progress = await db.user_progress.find({
        "user_id": current_user.id
    }).to_list(None)
    
    progress_map = {p["course_id"]: p for p in user_progress}
    
    course_list = []
    for course in courses:
        course_id = str(course["_id"])
        progress = progress_map.get(course_id, {})
        
        course_list.append({
            "id": course_id,
            "title": course["title"],
            "description": course["description"],
            "level": course["level"],
            "duration_minutes": course["duration"],
            "lessons_count": len(course["lessons"]),
            "enrolled": course_id in progress_map,
            "progress": progress.get("progress_percent", 0),
            "thumbnail": course.get("thumbnail_url")
        })
    
    return {"courses": course_list}
```

#### 2. **LOW PRIORITY:** Course Lessons Endpoint

**Frontend Needs:**
```
GET /training/courses/{course_id}/lessons
```

**Implementation:**
```python
@app.get("/training/courses/{course_id}/lessons")
async def get_course_lessons(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get lessons for a course"""
    
    from bson import ObjectId
    
    course = await db.courses.find_one({"_id": ObjectId(course_id)})
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get completed lessons
    progress = await db.user_progress.find_one({
        "user_id": current_user.id,
        "course_id": course_id
    })
    
    completed_lessons = progress.get("completed_lessons", []) if progress else []
    
    lessons = []
    for lesson in course["lessons"]:
        lessons.append({
            "id": lesson["id"],
            "title": lesson["title"],
            "type": lesson["type"],
            "duration_minutes": lesson["duration"],
            "content_url": f"/api/training/lessons/{lesson['id']}/content",
            "completed": lesson["id"] in completed_lessons,
            "quiz": lesson.get("quiz")
        })
    
    return {
        "course": {
            "id": course_id,
            "title": course["title"]
        },
        "lessons": lessons
    }
```

#### 3. **LOW PRIORITY:** Mark Lesson Complete

**Frontend Needs:**
```
POST /training/lessons/{lesson_id}/complete
```

**Implementation:**
```python
@app.post("/training/lessons/{lesson_id}/complete")
async def mark_lesson_complete(
    lesson_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark lesson as completed"""
    
    # Find which course this lesson belongs to
    course = await db.courses.find_one({
        "lessons.id": lesson_id
    })
    
    if not course:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    course_id = str(course["_id"])
    
    # Update progress
    await db.user_progress.update_one(
        {
            "user_id": current_user.id,
            "course_id": course_id
        },
        {
            "$addToSet": {"completed_lessons": lesson_id},
            "$set": {"updated_at": datetime.utcnow()}
        },
        upsert=True
    )
    
    # Calculate new progress
    total_lessons = len(course["lessons"])
    progress = await db.user_progress.find_one({
        "user_id": current_user.id,
        "course_id": course_id
    })
    
    completed_count = len(progress.get("completed_lessons", []))
    progress_percent = (completed_count / total_lessons) * 100
    
    # Update progress percent
    await db.user_progress.update_one(
        {
            "user_id": current_user.id,
            "course_id": course_id
        },
        {"$set": {"progress_percent": progress_percent}}
    )
    
    # Find next lesson
    lesson_index = next(i for i, l in enumerate(course["lessons"]) if l["id"] == lesson_id)
    next_lesson_id = course["lessons"][lesson_index + 1]["id"] if lesson_index + 1 < total_lessons else None
    
    return {
        "success": True,
        "next_lesson_id": next_lesson_id,
        "course_progress": progress_percent
    }
```

#### 4. **LOW PRIORITY:** Quiz Submission

**Frontend Needs:**
```
POST /training/quizzes/{quiz_id}/submit
```

**Implementation:**
```python
class QuizSubmission(BaseModel):
    answers: Dict[str, str]

@app.post("/training/quizzes/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: str,
    submission: QuizSubmission,
    current_user: User = Depends(get_current_user)
):
    """Submit quiz answers"""
    
    # Get quiz
    quiz = await db.quizzes.find_one({"_id": ObjectId(quiz_id)})
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Check answers
    correct_count = 0
    feedback = []
    
    for question_id, user_answer in submission.answers.items():
        question = next(q for q in quiz["questions"] if q["id"] == question_id)
        correct_answer = question["correct_answer"]
        
        is_correct = user_answer == correct_answer
        if is_correct:
            correct_count += 1
        
        feedback.append({
            "question_id": question_id,
            "correct": is_correct,
            "correct_answer": correct_answer if not is_correct else None,
            "explanation": question["explanation"]
        })
    
    total_questions = len(quiz["questions"])
    score = (correct_count / total_questions) * 100
    passed = score >= quiz.get("passing_score", 70)
    
    # Save result
    await db.quiz_results.insert_one({
        "user_id": current_user.id,
        "quiz_id": quiz_id,
        "score": score,
        "passed": passed,
        "submitted_at": datetime.utcnow()
    })
    
    return {
        "score": score,
        "total_questions": total_questions,
        "correct_answers": correct_count,
        "passed": passed,
        "feedback": feedback
    }
```

---

## Research Features - Completely New 🆕

### Current Implementation
**NONE** - These are completely new features

### Required Implementation

#### 1. **LOW PRIORITY:** Company Search

**Frontend Needs:**
```
GET /research/company/search?q=AAPL
```

**Implementation:**
```python
@app.get("/research/company/search")
async def search_companies(
    q: str,
    current_user: User = Depends(get_current_user)
):
    """Search for companies by ticker or name"""
    
    # Use external API (Alpha Vantage, Yahoo Finance, etc.)
    # This is a placeholder
    
    results = [
        {
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "exchange": "NASDAQ",
            "sector": "Technology",
            "industry": "Consumer Electronics"
        }
    ]
    
    return {"results": results}
```

#### 2. **LOW PRIORITY:** Company Overview

**Frontend Needs:**
```
GET /research/company/{symbol}
```

**Implementation:**
```python
@app.get("/research/company/{symbol}")
async def get_company_info(
    symbol: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed company information"""
    
    # Fetch from external API
    # This is a placeholder
    
    return {
        "symbol": symbol,
        "name": "Apple Inc.",
        "description": "Apple Inc. designs, manufactures, and markets smartphones...",
        "fundamentals": {
            "market_cap": 2800000000000,
            "pe_ratio": 28.5,
            "eps": 6.15,
            "dividend_yield": 0.52,
            "52_week_high": 198.23,
            "52_week_low": 164.08
        },
        "financials": {
            "revenue": 394328000000,
            "net_income": 96995000000,
            "gross_margin": 43.8,
            "operating_margin": 30.7
        },
        "key_metrics": {
            "roe": 147.3,
            "roa": 27.8,
            "debt_to_equity": 1.73
        }
    }
```

#### 3. **LOW PRIORITY:** Company AI Analysis

**Frontend Needs:**
```
POST /research/company/{symbol}/analyze
```

**Implementation:**
```python
@app.post("/research/company/{symbol}/analyze")
async def analyze_company(
    symbol: str,
    current_user: User = Depends(get_current_user)
):
    """Generate AI analysis of company"""
    
    # Get company data
    company_data = await get_company_info(symbol, current_user)
    
    # Use AI to analyze
    # This is a placeholder using your existing AI integration
    
    analysis = await generate_company_analysis(company_data)
    
    return {
        "summary": "Apple shows strong fundamentals with consistent revenue growth...",
        "strengths": [
            "Strong brand loyalty and ecosystem",
            "High profit margins",
            "Consistent cash flow generation"
        ],
        "weaknesses": [
            "High dependence on iPhone sales",
            "Regulatory challenges in multiple markets"
        ],
        "opportunities": [
            "Services segment growth",
            "Expansion in emerging markets"
        ],
        "threats": [
            "Intense competition in smartphone market",
            "Supply chain disruptions"
        ],
        "recommendation": "buy",
        "target_price": 195.00,
        "confidence": 0.78
    }
```

#### 4. **LOW PRIORITY:** Strategy Analysis

**Frontend Needs:**
```
POST /research/strategy/analyze
```

**Implementation:**
```python
class StrategyAnalysisRequest(BaseModel):
    strategy_name: str
    description: str
    indicators: List[str]
    timeframe: str
    risk_parameters: dict

@app.post("/research/strategy/analyze")
async def analyze_strategy(
    request: StrategyAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze trading strategy viability"""
    
    # Use AI to analyze strategy
    # This is a placeholder
    
    return {
        "analysis_id": "strat_123",
        "viability_score": 7.2,
        "historical_performance": {
            "win_rate": 58.3,
            "avg_return": 2.4,
            "max_drawdown": -18.5,
            "sharpe_ratio": 1.23
        },
        "market_suitability": {
            "best_markets": ["trending", "volatile"],
            "worst_markets": ["range-bound", "low-volume"]
        },
        "recommendations": [
            "Consider adding volume filter to reduce false signals",
            "Tighten stop loss in volatile markets",
            "Test on longer timeframes for smoother signals"
        ],
        "similar_strategies": [
            {
                "name": "MACD Crossover",
                "similarity": 0.82,
                "performance_comparison": "better"
            }
        ]
    }
```

#### 5. **LOW PRIORITY:** Peer Comparison

**Frontend Needs:**
```
POST /research/peer-comparison
```

**Implementation:**
```python
class PeerComparisonRequest(BaseModel):
    symbols: List[str]
    metrics: List[str]

@app.post("/research/peer-comparison")
async def compare_peers(
    request: PeerComparisonRequest,
    current_user: User = Depends(get_current_user)
):
    """Compare multiple companies"""
    
    companies = []
    for symbol in request.symbols:
        company_data = await get_company_info(symbol, current_user)
        companies.append({
            "symbol": symbol,
            "name": company_data["name"],
            "revenue": company_data["financials"]["revenue"],
            "pe_ratio": company_data["fundamentals"]["pe_ratio"],
            "market_cap": company_data["fundamentals"]["market_cap"],
            "profit_margin": company_data["financials"]["gross_margin"]
        })
    
    # Rank companies
    rankings = {
        "by_revenue": sorted(companies, key=lambda x: x["revenue"], reverse=True),
        "by_pe_ratio": sorted(companies, key=lambda x: x["pe_ratio"]),
        "by_profit_margin": sorted(companies, key=lambda x: x["profit_margin"], reverse=True)
    }
    
    return {
        "comparison": {
            "companies": companies,
            "rankings": {
                "by_revenue": [c["symbol"] for c in rankings["by_revenue"]],
                "by_pe_ratio": [c["symbol"] for c in rankings["by_pe_ratio"]],
                "by_profit_margin": [c["symbol"] for c in rankings["by_profit_margin"]]
            },
            "analysis": "Microsoft shows the highest profit margins while Apple leads in revenue..."
        }
    }
```

---

## WebSocket Support - New Infrastructure 🆕

### Current Implementation
**NONE** - No WebSocket support

### Required Implementation

#### 1. **MEDIUM PRIORITY:** WebSocket Connection

**Frontend Needs:**
```
ws://0.0.0.0:8000/ws?token=<jwt-token>
```

**Implementation:**
```python
from fastapi import WebSocket, WebSocketDisconnect
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """WebSocket connection for real-time updates"""
    
    # Verify token
    try:
        user = verify_jwt_token(token)
        user_id = user["user_id"]
    except Exception:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    await manager.connect(user_id, websocket)
    
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_json()
            
            # Handle different message types
            if data["type"] == "ping":
                await websocket.send_json({"type": "pong"})
            
            # Add more message handlers as needed
            
    except WebSocketDisconnect:
        manager.disconnect(user_id)
```

#### 2. **MEDIUM PRIORITY:** Send Progress Updates

**Use Case:** Send generation progress updates

**Implementation:**
```python
async def send_generation_progress(user_id: str, generation_id: str, stage: str, progress: int):
    """Send generation progress via WebSocket"""
    
    message = {
        "type": "generation_progress",
        "payload": {
            "generation_id": generation_id,
            "stage": stage,
            "progress": progress,
            "message": f"{stage.capitalize()}..."
        }
    }
    
    await manager.send_personal_message(message, user_id)

# Use in generation endpoint
@app.post("/afl/generate")
async def generate_afl(...):
    # Start generation
    await send_generation_progress(user_id, gen_id, "analyzing", 25)
    
    # ... generation logic ...
    
    await send_generation_progress(user_id, gen_id, "generating", 75)
    
    # ... more logic ...
    
    await send_generation_progress(user_id, gen_id, "completed", 100)
```

---

## Migration Priority Matrix

### 🔴 CRITICAL (Launch Blocking) - 4 Weeks

Must be completed before frontend can function properly:

| Priority | Endpoint | Effort | Complexity |
|----------|----------|--------|------------|
| 1 | AFL History Endpoints | 2 days | Low |
| 2 | Knowledge Base File Management | 3 days | Medium |
| 3 | Chat SSE Streaming | 4 days | High |
| 4 | Dashboard Stats | 2 days | Low |
| 5 | Backtest Results Retrieval | 3 days | Medium |
| 6 | Response Format Standardization | 3 days | Medium |

**Total Critical:** ~3-4 weeks

### 🟡 HIGH PRIORITY (Core Features) - 5 Weeks

Important for full functionality:

| Priority | Endpoint | Effort | Complexity |
|----------|----------|--------|------------|
| 1 | Feedback System | 2 days | Low |
| 2 | Delete Operations (All) | 2 days | Low |
| 3 | Backtest Insights | 3 days | Medium |
| 4 | Settings Management | 4 days | Medium |
| 5 | Admin User Management | 3 days | Medium |
| 6 | File Metadata Updates | 2 days | Low |

**Total High Priority:** ~4-5 weeks

### 🟢 MEDIUM PRIORITY (Enhanced UX) - 4 Weeks

Nice-to-have features:

| Priority | Endpoint | Effort | Complexity |
|----------|----------|--------|------------|
| 1 | WebSocket Infrastructure | 5 days | High |
| 2 | Backtest Compare | 2 days | Medium |
| 3 | Export Reports | 4 days | High |
| 4 | Reverse Engineer Image Analysis | 5 days | High |
| 5 | API Keys Management | 2 days | Medium |

**Total Medium Priority:** ~3-4 weeks

### ⚪ LOW PRIORITY (Future) - 3 Weeks

Can be implemented later:

| Priority | Endpoint | Effort | Complexity |
|----------|----------|--------|------------|
| 1 | Training Courses | 5 days | Medium |
| 2 | Research Features | 5 days | Medium |
| 3 | Demo Login | 1 day | Low |
| 4 | Forgot Password | 2 days | Medium |

**Total Low Priority:** ~2-3 weeks

---

## Implementation Timeline

### Phase 1: Critical (Weeks 1-4)
**Goal:** Make frontend functional

- Week 1: AFL endpoints + Knowledge Base
- Week 2: Chat streaming + Dashboard
- Week 3: Backtest retrieval
- Week 4: Response format standardization + testing

**Deliverable:** Functional app with core features

### Phase 2: High Priority (Weeks 5-9)
**Goal:** Complete core features

- Week 5: Feedback + Delete operations
- Week 6: Backtest insights
- Week 7-8: Settings management
- Week 9: Admin features

**Deliverable:** Production-ready app

### Phase 3: Medium Priority (Weeks 10-13)
**Goal:** Enhanced user experience

- Week 10-11: WebSocket infrastructure
- Week 12: Backtest compare + Export
- Week 13: Reverse engineer improvements

**Deliverable:** Enhanced app with real-time features

### Phase 4: Low Priority (Weeks 14-16)
**Goal:** Nice-to-have features

- Week 14-15: Training courses
- Week 16: Research features

**Deliverable:** Complete feature set

---

## Database Schema Changes

### New Collections Required

#### 1. **generations** Collection
```javascript
{
  _id: ObjectId,
  user_id: String,
  prompt: String,
  code: String,
  strategy_type: String,
  settings: Object,
  feedback: String,  // "positive" or "negative"
  created_at: Date,
  metadata: {
    indicators_used: [String],
    timeframe: String,
    risk_level: String
  }
}

// Indexes
db.generations.createIndex({ user_id: 1, created_at: -1 })
db.generations.createIndex({ user_id: 1, feedback: 1 })
```

#### 2. **conversations** Collection (Rename from existing or create new)
```javascript
{
  _id: ObjectId,
  user_id: String,
  title: String,
  created_at: Date,
  updated_at: Date,
  last_message: String  // Preview text
}

// Indexes
db.conversations.createIndex({ user_id: 1, updated_at: -1 })
```

#### 3. **messages** Collection (Rename from existing or create new)
```javascript
{
  _id: ObjectId,
  conversation_id: String,
  user_id: String,
  role: String,  // "user" or "assistant"
  content: String,
  created_at: Date,
  attachments: [String]  // File IDs
}

// Indexes
db.messages.createIndex({ conversation_id: 1, created_at: 1 })
db.messages.createIndex({ user_id: 1 })
```

#### 4. **backtests** Collection (Update schema)
```javascript
{
  _id: ObjectId,
  user_id: String,
  strategy_name: String,
  start_date: String,
  end_date: String,
  metrics: {
    total_return: Float,
    annual_return: Float,
    sharpe_ratio: Float,
    max_drawdown: Float,
    win_rate: Float,
    profit_factor: Float,
    total_trades: Int,
    winning_trades: Int,
    losing_trades: Int
  },
  monthly_returns: [{
    month: String,
    return: Float
  }],
  equity_curve: [{
    date: String,
    equity: Float
  }],
  trades: [{
    id: String,
    symbol: String,
    entry_date: String,
    exit_date: String,
    entry_price: Float,
    exit_price: Float,
    quantity: Int,
    profit_loss: Float,
    return_pct: Float
  }],
  created_at: Date
}

// Indexes
db.backtests.createIndex({ user_id: 1, created_at: -1 })
```

#### 5. **api_keys** Collection (New)
```javascript
{
  _id: ObjectId,
  user_id: String,
  name: String,
  key_hash: String,  // Hashed API key
  permissions: [String],
  created_at: Date,
  last_used: Date
}

// Indexes
db.api_keys.createIndex({ user_id: 1 })
db.api_keys.createIndex({ key_hash: 1 }, { unique: true })
```

#### 6. **reverse_analyses** Collection (New)
```javascript
{
  _id: ObjectId,
  user_id: String,
  image_path: String,
  description: String,
  status: String,  // "processing", "completed", "failed"
  progress: Int,
  patterns: [Object],
  strategy: Object,
  confidence: Float,
  created_at: Date
}

// Indexes
db.reverse_analyses.createIndex({ user_id: 1, created_at: -1 })
```

#### 7. **logs** Collection (New - for admin)
```javascript
{
  _id: ObjectId,
  type: String,  // "api", "error", "auth"
  timestamp: Date,
  user_id: String,
  endpoint: String,
  method: String,
  status: Int,
  response_time: Int,
  ip_address: String,
  error: String
}

// Indexes
db.logs.createIndex({ timestamp: -1 })
db.logs.createIndex({ user_id: 1, timestamp: -1 })
db.logs.createIndex({ type: 1, timestamp: -1 })
```

#### 8. **attachments** Collection (New)
```javascript
{
  _id: ObjectId,
  conversation_id: String,
  user_id: String,
  filename: String,
  file_path: String,
  size: Int,
  mime_type: String,
  created_at: Date
}

// Indexes
db.attachments.createIndex({ conversation_id: 1 })
db.attachments.createIndex({ user_id: 1 })
```

#### 9. **courses** Collection (New - for training)
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  level: String,  // "beginner", "intermediate", "advanced"
  duration: Int,  // minutes
  thumbnail_url: String,
  lessons: [{
    id: String,
    title: String,
    type: String,  // "video", "text", "quiz"
    duration: Int,
    content_url: String,
    quiz: {
      id: String,
      questions_count: Int
    }
  }],
  created_at: Date
}
```

#### 10. **user_progress** Collection (New - for training)
```javascript
{
  _id: ObjectId,
  user_id: String,
  course_id: String,
  completed_lessons: [String],
  progress_percent: Float,
  updated_at: Date
}

// Indexes
db.user_progress.createIndex({ user_id: 1, course_id: 1 }, { unique: true })
```

### Schema Updates to Existing Collections

#### **users** Collection - Add fields:
```javascript
{
  // ... existing fields ...
  last_login: Date,
  settings: {
    appearance: {
      theme: String,
      accent_color: String,
      font_size: String
    },
    notifications: {
      email_notifications: Boolean,
      code_gen_complete: Boolean,
      backtest_complete: Boolean,
      system_updates: Boolean,
      marketing_emails: Boolean
    }
  }
}
```

#### **documents** Collection (was brain) - Add fields:
```javascript
{
  // ... existing fields ...
  page_count: Int,
  word_count: Int,
  thumbnail_url: String,
  mime_type: String
}
```

---

## Testing Checklist

### Authentication ✓
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Get current user info
- [ ] Token expiration handling
- [ ] Demo login (if implemented)

### AFL Generator
- [ ] Generate AFL code
- [ ] View generation history
- [ ] Retrieve specific generation
- [ ] Delete generation
- [ ] Submit feedback (thumbs up/down)
- [ ] Format code
- [ ] Response format matches frontend expectations

### Knowledge Base
- [ ] Upload document
- [ ] List all files
- [ ] Search files
- [ ] Get file details
- [ ] Update file metadata (tags, description)
- [ ] Download file
- [ ] Delete file
- [ ] Response format matches frontend expectations

### Chat
- [ ] Create new conversation
- [ ] List conversations
- [ ] Get messages in conversation
- [ ] Send message (non-streaming)
- [ ] Send message (SSE streaming)
- [ ] Upload attachment
- [ ] Delete conversation
- [ ] Code block extraction in messages

### Dashboard
- [ ] Get dashboard statistics
- [ ] Get recent activity feed
- [ ] Verify calculations (win rate, changes)

### Backtest
- [ ] Upload backtest file
- [ ] Get backtest results
- [ ] Generate AI insights
- [ ] Compare multiple backtests
- [ ] Export report (PDF/Excel)
- [ ] Delete backtest

### Reverse Engineer
- [ ] Upload chart image
- [ ] Get analysis results (polling)
- [ ] Analyze from text description
- [ ] Pattern detection accuracy

### Settings
- [ ] Update profile (name, email)
- [ ] Change password
- [ ] Create API key
- [ ] List API keys
- [ ] Revoke API key
- [ ] Update appearance settings
- [ ] Update notification settings
- [ ] Delete account

### Admin
- [ ] List all users (admin only)
- [ ] Update user role (admin only)
- [ ] Get system statistics (admin only)
- [ ] View API logs (admin only)
- [ ] Non-admin cannot access admin endpoints

### Training
- [ ] List courses
- [ ] Get course lessons
- [ ] Mark lesson complete
- [ ] Submit quiz
- [ ] Calculate course progress

### Research
- [ ] Search companies
- [ ] Get company overview
- [ ] Generate company analysis
- [ ] Analyze trading strategy
- [ ] Compare peers

### WebSocket
- [ ] Establish WebSocket connection
- [ ] Authenticate via token
- [ ] Send/receive messages
- [ ] Handle disconnection
- [ ] Progress updates work correctly

### General
- [ ] All endpoints require authentication (except auth routes)
- [ ] Rate limiting works (if implemented)
- [ ] Error responses follow standard format
- [ ] CORS headers set correctly
- [ ] File uploads work with multipart/form-data
- [ ] Pagination works correctly
- [ ] Date/time formats are ISO 8601

---

## Quick Start Migration Script

Here's a Python script to help you get started:

```python
# migration_validator.py
"""
Quick validator to check which endpoints need to be created/updated
"""

import requests
from typing import List, Dict

BASE_URL = "https://potomac-analyst-workbench.up.railway.app"

REQUIRED_ENDPOINTS = {
    "CRITICAL": [
        ("GET", "/afl/history"),
        ("GET", "/afl/generation/{id}"),
        ("DELETE", "/afl/generation/{id}"),
        ("POST", "/afl/feedback"),
        ("GET", "/knowledge-base/files"),
        ("GET", "/knowledge-base/files/{id}"),
        ("DELETE", "/knowledge-base/files/{id}"),
        ("GET", "/chat/conversations/{id}/messages"),
        ("POST", "/chat/conversations"),
        ("DELETE", "/chat/conversations/{id}"),
        ("GET", "/dashboard/stats"),
        ("GET", "/dashboard/activity"),
        ("GET", "/backtest/{id}/results"),
    ],
    "HIGH": [
        ("POST", "/backtest/{id}/insights"),
        ("PATCH", "/settings/profile"),
        ("POST", "/settings/change-password"),
        ("GET", "/admin/users"),
        ("PATCH", "/admin/users/{id}"),
    ],
    "MEDIUM": [
        ("POST", "/backtest/compare"),
        ("GET", "/backtest/{id}/export"),
        ("POST", "/reverse-engineer/upload-image"),
        ("GET", "/reverse-engineer/{id}/results"),
    ],
    "LOW": [
        ("GET", "/training/courses"),
        ("GET", "/research/company/search"),
        ("POST", "/research/company/{symbol}/analyze"),
    ]
}

def check_endpoint(method: str, path: str, token: str = None) -> bool:
    """Check if endpoint exists"""
    url = f"{BASE_URL}{path}".replace("{id}", "test_id").replace("{symbol}", "AAPL")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=5)
        elif method == "POST":
            response = requests.post(url, headers=headers, json={}, timeout=5)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json={}, timeout=5)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=5)
        else:
            return False
        
        # 404 means endpoint doesn't exist
        # Other codes (401, 400, etc.) mean endpoint exists but has other issues
        return response.status_code != 404
    except:
        return False

def validate_migration():
    """Validate which endpoints need to be created"""
    
    print("🔍 Potomac Backend Migration Validator\n")
    print("=" * 60)
    
    token = input("Enter your JWT token (optional, press Enter to skip): ").strip()
    if not token:
        token = None
    
    print("\n")
    
    for priority, endpoints in REQUIRED_ENDPOINTS.items():
        print(f"\n{'='*60}")
        print(f"🔥 {priority} PRIORITY")
        print(f"{'='*60}\n")
        
        missing = []
        existing = []
        
        for method, path in endpoints:
            exists = check_endpoint(method, path, token)
            status = "✅ EXISTS" if exists else "❌ MISSING"
            print(f"{status} - {method:7} {path}")
            
            if exists:
                existing.append((method, path))
            else:
                missing.append((method, path))
        
        print(f"\n📊 Summary: {len(existing)}/{len(endpoints)} endpoints exist")
        
        if missing:
            print(f"⚠️  {len(missing)} endpoints need to be created\n")
    
    print("\n" + "="*60)
    print("✅ Validation Complete!")
    print("="*60)

if __name__ == "__main__":
    validate_migration()
```

Run with:
```bash
pip install requests
python migration_validator.py
```

---

## Summary

### What You Need to Do

1. **Keep Existing Endpoints:**
   - `/auth/*` - Perfect, no changes
   - `/afl/generate` - Modify response format
   - `/brain/upload` - Rename to `/knowledge-base/upload`
   - `/brain/search` - Rename to `/knowledge-base/search`
   - `/chat/message` - Add SSE streaming
   - `/chat/conversations` - Modify response format
   - `/backtest/upload` - Modify response format

2. **Create New Endpoints (Critical):**
   - 13 critical endpoints (AFL history, KB files, chat CRUD, dashboard, backtest results)
   - Estimated: 3-4 weeks

3. **Create New Endpoints (High Priority):**
   - 15 high priority endpoints (settings, admin, feedback)
   - Estimated: 4-5 weeks

4. **Create New Endpoints (Medium/Low Priority):**
   - 25+ nice-to-have endpoints (training, research, websocket)
   - Estimated: 6-7 weeks

### Recommended Approach

**Option A: Minimal Viable Product (4 weeks)**
- Implement only CRITICAL endpoints
- Keep current backend structure
- Update frontend to match existing API where possible
- Get app launched quickly

**Option B: Production Ready (9 weeks)**
- Implement CRITICAL + HIGH priority endpoints
- Full feature parity with frontend
- Professional, scalable solution

**Option C: Complete Implementation (16 weeks)**
- All endpoints implemented
- All nice-to-have features included
- Training courses, research tools, websockets

### Next Steps

1. **Review this document** with your team
2. **Prioritize** which features are must-have vs. nice-to-have
3. **Run the validation script** to see current state
4. **Create implementation tickets** from this guide
5. **Start with Critical phase** (Week 1-4)
6. **Test thoroughly** using the testing checklist

---

## Support

If you have questions about any endpoint implementation:

1. Refer to the detailed implementation sections above
2. Check the `/API_INTEGRATION_GUIDE.md` for frontend perspective
3. Cross-reference with your existing code in the backend
4. Test each endpoint using Postman or the validation script

---

**Document Version:** 2.0.0  
**Last Updated:** February 1, 2026  
**Estimated Implementation Time:** 12-16 weeks for full feature parity  
**Critical Path:** 3-4 weeks for launch-blocking features

Good luck with your migration! 🚀
