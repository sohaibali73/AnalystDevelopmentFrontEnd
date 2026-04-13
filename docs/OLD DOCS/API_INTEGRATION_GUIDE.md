# Analyst by Potomac - Complete API Integration Guide

**Version:** 1.0  
**Last Updated:** February 1, 2026  
**Author:** Potomac Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [API Client Configuration](#api-client-configuration)
3. [Authentication System](#authentication-system)
4. [Dashboard Page](#dashboard-page)
5. [AFL Generator Page](#afl-generator-page)
6. [Chat Page](#chat-page)
7. [Knowledge Base Page](#knowledge-base-page)
8. [Backtest Analysis Page](#backtest-analysis-page)
9. [Reverse Engineer Page](#reverse-engineer-page)
10. [Training Page](#training-page)
11. [Researcher Pages](#researcher-pages)
12. [Admin Page](#admin-page)
13. [Settings Page](#settings-page)
14. [Error Handling](#error-handling)
15. [WebSocket Integration](#websocket-integration)
16. [File Upload Handling](#file-upload-handling)
17. [Response Formats](#response-formats)
18. [Security Considerations](#security-considerations)

---

## Overview

This document provides a comprehensive guide to integrating the Analyst by Potomac frontend with your backend API. Every UI element that requires API interaction is documented with:

- **UI Element Description**: What the element does
- **API Endpoint**: The endpoint to call
- **Request Format**: Expected request structure
- **Response Format**: Expected response structure
- **Error Handling**: How errors should be handled
- **Code Location**: Where to find the implementation

**Current API Base URL:** `http://0.0.0.0:8000`  
**API Client Location:** `/lib/api.ts`

---

## API Client Configuration

### File: `/lib/api.ts`

The centralized API client handles all HTTP requests with automatic token management, error handling, and request/response formatting.

### Base Configuration

```typescript
const API_BASE_URL = 'http://0.0.0.0:8000';

class APIClient {
  private baseURL: string;
  private getAuthToken(): string | null;
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T>;
}
```

### Authentication Token Management

**How it works:**
- Tokens stored in localStorage under key: `auth_token`
- Automatically included in all requests via `Authorization: Bearer <token>` header
- Token retrieved via `getAuthToken()` method

**Integration Steps:**

1. **Set Token After Login:**
```typescript
// After successful login
localStorage.setItem('auth_token', response.token);
```

2. **Remove Token on Logout:**
```typescript
// On logout
localStorage.removeItem('auth_token');
```

3. **Backend Should Validate:**
```python
# Python/FastAPI example
from fastapi import Header, HTTPException

async def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    # Validate token here
    return token
```

### Request/Response Interceptors

**Automatic Error Handling:**
```typescript
// Status codes handled automatically:
- 401: Redirects to login, clears token
- 403: Shows "Access forbidden" error
- 404: Shows "Resource not found"
- 500: Shows "Server error"
- Network errors: Shows "Network error"
```

---

## Authentication System

### 1. Login Page (`/pages/LoginPage.tsx`)

#### UI Elements & API Integration

##### **Login Form**

**UI Elements:**
- Email input field
- Password input field (with show/hide toggle)
- "Login" button
- "Demo Login" button

**API Endpoint:** `POST /api/auth/login`

**Request Format:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response Format:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "trader"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Frontend Code Location:**
```typescript
// File: /pages/LoginPage.tsx
// Function: handleSubmit()

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await login(email, password);
    navigate('/dashboard');
  } catch (err) {
    setError(err.message);
  }
};
```

**Backend Implementation Example:**
```python
@app.post("/api/auth/login")
async def login(request: LoginRequest):
    user = await authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user.id)
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }
```

---

##### **Demo Login Button**

**Functionality:** Allows users to bypass authentication for demonstration purposes.

**API Endpoint:** `POST /api/auth/demo-login`

**Request Format:**
```json
{}
```

**Response Format:**
```json
{
  "success": true,
  "token": "demo_token_xyz",
  "user": {
    "id": "demo_user",
    "name": "Demo User",
    "email": "demo@analyst.potomac",
    "role": "demo"
  }
}
```

**Frontend Implementation:**
```typescript
// File: /pages/LoginPage.tsx
// Currently bypasses API, but can be hooked up

const handleDemoLogin = async () => {
  try {
    const response = await apiClient.demoLogin();
    login(response.user.email, ''); // Sets auth context
    navigate('/dashboard');
  } catch (err) {
    setError('Demo login failed');
  }
};
```

---

### 2. Register Page (`/pages/RegisterPage.tsx`)

#### UI Elements & API Integration

##### **Registration Form**

**UI Elements:**
- Full Name input
- Email input
- Password input (with strength indicator)
- Confirm Password input
- "Create Account" button

**API Endpoint:** `POST /api/auth/register`

**Request Format:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirm_password": "SecurePass123!"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_456",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "trader"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Email already exists"
}
```

**Validation Requirements:**
- Name: Minimum 2 characters
- Email: Valid email format
- Password: Minimum 8 characters, contains uppercase, lowercase, number
- Passwords must match

---

### 3. Forgot Password Page (`/pages/ForgotPasswordPage.tsx`)

**API Endpoint:** `POST /api/auth/forgot-password`

**Request Format:**
```json
{
  "email": "user@example.com"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Password reset link sent to email"
}
```

---

## Dashboard Page

### File: `/pages/DashboardPage.tsx`

The dashboard displays user statistics, recent activity, and quick action cards.

---

#### 1. **Statistics Cards**

**UI Elements:** Four stat cards showing:
- Total Strategies
- Total Backtests
- Win Rate
- Total Trades

**API Endpoint:** `GET /api/dashboard/stats`

**Request:** None (uses auth token)

**Response Format:**
```json
{
  "total_strategies": 24,
  "total_backtests": 156,
  "win_rate": 67.8,
  "total_trades": 1248,
  "change_from_last_period": {
    "strategies": 12.5,
    "backtests": 8.3,
    "win_rate": -2.1,
    "trades": 15.4
  }
}
```

**Frontend Code:**
```typescript
// File: /pages/DashboardPage.tsx
// Location: useEffect hook on mount

useEffect(() => {
  const fetchStats = async () => {
    try {
      const data = await apiClient.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };
  fetchStats();
}, []);
```

**Backend Implementation:**
```python
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    stats = await calculate_user_stats(current_user.id)
    return stats
```

---

#### 2. **Recent Activity Feed**

**UI Elements:** List of recent user activities with timestamps

**API Endpoint:** `GET /api/dashboard/activity?limit=10`

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 10)
- `offset` (optional): Pagination offset (default: 0)

**Response Format:**
```json
{
  "activities": [
    {
      "id": "activity_1",
      "type": "code_generation",
      "title": "Generated AFL code for Moving Average strategy",
      "timestamp": "2026-02-01T14:30:00Z",
      "icon": "code",
      "color": "#FEC00F"
    },
    {
      "id": "activity_2",
      "type": "backtest",
      "title": "Completed backtest for RSI Strategy",
      "timestamp": "2026-02-01T12:15:00Z",
      "icon": "trending-up",
      "color": "#22C55E"
    }
  ],
  "total": 156,
  "has_more": true
}
```

---

#### 3. **Feature Cards**

**UI Elements:** Six action cards:
- Generate AFL Code
- AI Chat Assistant
- Knowledge Base
- Backtest Analysis
- Strategy Comparison
- Reverse Engineer

**Action:** Each card navigates to its respective page. No API call needed, but can track analytics:

**API Endpoint:** `POST /api/analytics/feature-click`

**Request Format:**
```json
{
  "feature": "afl_generator",
  "timestamp": "2026-02-01T14:30:00Z",
  "source": "dashboard"
}
```

---

## AFL Generator Page

### File: `/pages/AFLGeneratorPage.tsx`

The core feature for generating AFL (AmiBroker Formula Language) code using AI.

---

#### 1. **Prompt Input**

**UI Element:** Large textarea for user to describe their strategy

**Placeholder Text:** "Describe your trading strategy in detail..."

**Character Limit:** 5000 characters (configurable)

---

#### 2. **Strategy Type Toggle**

**UI Element:** Two-button toggle switch
- Option 1: "Standalone"
- Option 2: "Composite Model"

**Value Mapping:**
- Standalone → `"standalone"`
- Composite Model → `"composite"`

**State Variable:** `strategyType`

---

#### 3. **Backtest Settings Dropdown**

**UI Element:** Collapsible section with backtest configuration

**Settings Available:**
- Initial Capital (number input)
- Position Sizing (dropdown: Fixed, Percentage, Risk-Based)
- Max Position Size (percentage slider)
- Commission (number input)
- Slippage (number input)

**State Object:**
```typescript
interface BacktestSettings {
  initial_capital: number;
  position_sizing: 'fixed' | 'percentage' | 'risk_based';
  max_position_size: number;
  commission: number;
  slippage: number;
}
```

---

#### 4. **File Upload (Knowledge Base)**

**UI Element:** File selector that shows available documents from Knowledge Base

**API Endpoint:** `GET /api/knowledge-base/files`

**Response Format:**
```json
{
  "files": [
    {
      "id": "file_123",
      "name": "Trading_Strategy_Guide.pdf",
      "size": 2456789,
      "upload_date": "2026-01-15T10:30:00Z",
      "type": "pdf"
    }
  ]
}
```

**Selection:** User can select multiple files. Selected file IDs are sent with generation request.

---

#### 5. **Generate Button**

**UI Element:** Large yellow button with "Generate AFL Code" text and Zap icon

**API Endpoint:** `POST /api/afl/generate`

**Request Format:**
```json
{
  "request": "Create a strategy that buys when RSI crosses above 30 and sells when it crosses below 70. Use a 14-period RSI and include stop loss at 5%.",
  "strategy_type": "standalone",
  "backtest_settings": {
    "initial_capital": 100000,
    "position_sizing": "percentage",
    "max_position_size": 20,
    "commission": 0.1,
    "slippage": 0.05
  },
  "uploaded_file_ids": ["file_123", "file_456"]
}
```

**Response Format:**
```json
{
  "success": true,
  "id": "gen_789",
  "afl_code": "// RSI Crossover Strategy\n_SECTION_BEGIN(\"RSI Strategy\");\n\nperiod = 14;\nrsi = RSI(period);\n\nBuy = Cross(rsi, 30);\nSell = Cross(70, rsi);\n\nApplyStop(stopTypeLoss, stopModePercent, 5);\n\n_SECTION_END();",
  "explanation": "This strategy implements an RSI crossover system...",
  "metadata": {
    "indicators_used": ["RSI"],
    "timeframe": "daily",
    "risk_level": "medium"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to generate code: Invalid strategy description",
  "code": "GENERATION_ERROR"
}
```

**Frontend Implementation:**
```typescript
// File: /pages/AFLGeneratorPage.tsx
// Function: handleGenerate()

const handleGenerate = async () => {
  if (!prompt.trim()) {
    setError('Please describe your trading strategy');
    return;
  }
  
  setLoading(true);
  setError('');
  
  try {
    const result = await apiClient.generateAFL({
      request: prompt,
      strategy_type: strategyType,
      backtest_settings: backtestSettings,
      uploaded_file_ids: selectedFileIds,
    });
    
    setGeneratedCode(result.afl_code);
    setCodeId(result.id);
  } catch (err) {
    setError('Failed to generate code. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

**Backend Implementation:**
```python
@app.post("/api/afl/generate")
async def generate_afl(
    request: AFLGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    # Validate request
    if not request.request or len(request.request) < 10:
        raise HTTPException(status_code=400, detail="Strategy description too short")
    
    # Load context from uploaded files
    context = await load_file_context(request.uploaded_file_ids)
    
    # Call AI model
    afl_code = await ai_model.generate_afl(
        prompt=request.request,
        strategy_type=request.strategy_type,
        context=context
    )
    
    # Save generation
    generation = await save_generation(
        user_id=current_user.id,
        code=afl_code,
        settings=request.backtest_settings
    )
    
    return {
        "success": True,
        "id": generation.id,
        "afl_code": afl_code,
        "explanation": generation.explanation
    }
```

---

#### 6. **Code Display Area**

**UI Element:** Syntax-highlighted code editor with line numbers

**Features:**
- Syntax highlighting for AFL language
- Line numbers
- Copy to clipboard button
- Download as .afl file button
- Format code button

---

#### 7. **Copy Code Button**

**UI Element:** Button with Copy icon (changes to Check icon on success)

**Functionality:** Copies generated code to clipboard

**No API call needed** - uses browser Clipboard API:

```typescript
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};
```

---

#### 8. **Download Code Button**

**UI Element:** Button with Download icon

**Functionality:** Downloads code as `.afl` file

**No API call needed** - uses browser download:

```typescript
const handleDownload = () => {
  const blob = new Blob([generatedCode], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `strategy_${Date.now()}.afl`;
  a.click();
  URL.revokeObjectURL(url);
};
```

---

#### 9. **Format Code Button**

**UI Element:** Button with "Format" text

**API Endpoint:** `POST /api/afl/format`

**Request Format:**
```json
{
  "code": "// Unformatted AFL code\nBuy=Cross(MA(C,20),MA(C,50));Sell=Cross(MA(C,50),MA(C,20));"
}
```

**Response Format:**
```json
{
  "success": true,
  "formatted_code": "// Formatted AFL code\nBuy = Cross(MA(C, 20), MA(C, 50));\nSell = Cross(MA(C, 50), MA(C, 20));"
}
```

---

#### 10. **Thumbs Up/Down Feedback**

**UI Element:** Two icon buttons for user feedback

**API Endpoint:** `POST /api/afl/feedback`

**Request Format:**
```json
{
  "generation_id": "gen_789",
  "feedback": "positive",
  "comment": "Great code! Works perfectly."
}
```

**Values:**
- `feedback`: "positive" or "negative"
- `comment` (optional): User's text feedback

**Response Format:**
```json
{
  "success": true,
  "message": "Thank you for your feedback!"
}
```

---

#### 11. **History Sidebar**

**UI Element:** Collapsible sidebar showing generation history

**API Endpoint:** `GET /api/afl/history?limit=20`

**Query Parameters:**
- `limit`: Number of items (default: 20)
- `offset`: Pagination offset

**Response Format:**
```json
{
  "generations": [
    {
      "id": "gen_789",
      "title": "RSI Crossover Strategy",
      "timestamp": "2026-02-01T14:30:00Z",
      "strategy_type": "standalone",
      "preview": "// RSI Crossover Strategy..."
    }
  ],
  "total": 45,
  "has_more": true
}
```

**Load Previous Generation:**

**API Endpoint:** `GET /api/afl/generation/{id}`

**Response Format:**
```json
{
  "id": "gen_789",
  "request": "Original user prompt...",
  "afl_code": "// Full AFL code...",
  "strategy_type": "standalone",
  "timestamp": "2026-02-01T14:30:00Z",
  "backtest_settings": { /* settings object */ }
}
```

---

#### 12. **Delete Generation**

**UI Element:** Trash icon button on history items

**API Endpoint:** `DELETE /api/afl/generation/{id}`

**Response Format:**
```json
{
  "success": true,
  "message": "Generation deleted successfully"
}
```

---

## Chat Page

### File: `/pages/ChatPage.tsx`

AI-powered chat interface for trading strategy discussions and AFL code help.

---

#### 1. **Conversation List (Sidebar)**

**UI Element:** Left sidebar showing all chat conversations

**API Endpoint:** `GET /api/chat/conversations`

**Response Format:**
```json
{
  "conversations": [
    {
      "id": "conv_123",
      "title": "RSI Strategy Discussion",
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-01T14:30:00Z",
      "message_count": 12,
      "preview": "How do I implement RSI divergence..."
    }
  ],
  "total": 15
}
```

**Frontend Implementation:**
```typescript
const loadConversations = async () => {
  try {
    const data = await apiClient.getConversations();
    setConversations(data);
  } catch (error) {
    console.error('Failed to load conversations:', error);
  }
};
```

---

#### 2. **New Chat Button**

**UI Element:** Button with Plus icon and "New Chat" text

**API Endpoint:** `POST /api/chat/conversations`

**Request Format:**
```json
{
  "title": "New Conversation"
}
```

**Response Format:**
```json
{
  "id": "conv_456",
  "title": "New Conversation",
  "created_at": "2026-02-01T15:00:00Z",
  "messages": []
}
```

**Frontend:**
```typescript
const handleNewChat = async () => {
  try {
    const newConv = await apiClient.createConversation({ title: 'New Conversation' });
    setSelectedConversation(newConv);
    setMessages([]);
  } catch (error) {
    console.error('Failed to create conversation:', error);
  }
};
```

---

#### 3. **Message Display**

**UI Element:** Chat bubble interface showing user and AI messages

**API Endpoint:** `GET /api/chat/conversations/{conversation_id}/messages`

**Response Format:**
```json
{
  "messages": [
    {
      "id": "msg_001",
      "conversation_id": "conv_123",
      "role": "user",
      "content": "How do I implement a MACD crossover strategy in AFL?",
      "timestamp": "2026-02-01T14:25:00Z"
    },
    {
      "id": "msg_002",
      "conversation_id": "conv_123",
      "role": "assistant",
      "content": "Here's how to implement a MACD crossover strategy:\n\n```afl\n// MACD Crossover\nMACD_Line = MACD();\nSignal_Line = Signal();\n\nBuy = Cross(MACD_Line, Signal_Line);\nSell = Cross(Signal_Line, MACD_Line);\n```",
      "timestamp": "2026-02-01T14:25:05Z",
      "code_blocks": [
        {
          "language": "afl",
          "code": "MACD_Line = MACD();\nSignal_Line = Signal();\n\nBuy = Cross(MACD_Line, Signal_Line);\nSell = Cross(Signal_Line, MACD_Line);"
        }
      ]
    }
  ],
  "has_more": false
}
```

---

#### 4. **Send Message**

**UI Element:** Bottom input area with textarea and send button

**API Endpoint:** `POST /api/chat/conversations/{conversation_id}/messages`

**Request Format:**
```json
{
  "content": "How do I add a stop loss to this strategy?",
  "attachments": []
}
```

**Response Format (Streaming):**

The API should support **Server-Sent Events (SSE)** for streaming responses:

**Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**SSE Stream Format:**
```
data: {"type": "start", "message_id": "msg_003"}

data: {"type": "token", "content": "To"}

data: {"type": "token", "content": " add"}

data: {"type": "token", "content": " a"}

data: {"type": "token", "content": " stop"}

data: {"type": "done", "message_id": "msg_003", "full_content": "To add a stop loss..."}
```

**Frontend Implementation:**
```typescript
const handleSendMessage = async () => {
  if (!input.trim()) return;
  
  // Add user message to UI
  const userMessage: Message = {
    id: `temp_${Date.now()}`,
    role: 'user',
    content: input,
    timestamp: new Date().toISOString(),
  };
  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setLoading(true);
  
  try {
    // Send message and stream response
    const response = await apiClient.sendMessage(
      selectedConversation.id,
      { content: input }
    );
    
    // Add assistant message to UI
    setMessages(prev => [...prev, response]);
  } catch (error) {
    console.error('Failed to send message:', error);
  } finally {
    setLoading(false);
  }
};
```

**Backend Implementation (with streaming):**
```python
@app.post("/api/chat/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user)
):
    # Save user message
    user_msg = await save_message(
        conversation_id=conversation_id,
        role="user",
        content=request.content
    )
    
    # Stream AI response
    async def generate():
        message_id = str(uuid.uuid4())
        yield f"data: {json.dumps({'type': 'start', 'message_id': message_id})}\n\n"
        
        full_content = ""
        async for token in ai_model.stream_response(request.content):
            full_content += token
            yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
        
        # Save assistant message
        await save_message(
            conversation_id=conversation_id,
            role="assistant",
            content=full_content,
            id=message_id
        )
        
        yield f"data: {json.dumps({'type': 'done', 'message_id': message_id, 'full_content': full_content})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

---

#### 5. **File Attachment**

**UI Element:** Paperclip icon button to attach files

**API Endpoint:** `POST /api/chat/upload-attachment`

**Request Format:** `multipart/form-data`

**Form Fields:**
- `file`: The file to upload
- `conversation_id`: The conversation ID

**Response Format:**
```json
{
  "attachment_id": "att_789",
  "filename": "strategy_data.csv",
  "size": 45678,
  "url": "/api/files/att_789"
}
```

**Send Message with Attachment:**
```json
{
  "content": "Can you analyze this data?",
  "attachments": ["att_789"]
}
```

---

#### 6. **Copy Message Code Block**

**UI Element:** Copy button on code blocks within messages

**Functionality:** Same as AFL Generator copy (no API needed)

---

#### 7. **Delete Conversation**

**UI Element:** Trash icon on conversation items in sidebar

**API Endpoint:** `DELETE /api/chat/conversations/{conversation_id}`

**Response Format:**
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

---

#### 8. **Suggested Prompts (Empty State)**

**UI Element:** Four colorful prompt cards shown when no conversation is active

**Action:** Clicking a card creates new conversation with that prompt

**No dedicated API** - Uses "New Chat" + "Send Message" endpoints

---

## Knowledge Base Page

### File: `/pages/KnowledgeBasePage.tsx`

Document management system for uploading trading strategy documents, PDFs, and research papers.

---

#### 1. **Upload Files (Drag & Drop)**

**UI Element:** Large drag-and-drop area with upload button

**Accepted File Types:**
- PDF (`.pdf`)
- Word Documents (`.doc`, `.docx`)
- Text Files (`.txt`)
- CSV (`.csv`)
- Excel (`.xlsx`, `.xls`)

**API Endpoint:** `POST /api/knowledge-base/upload`

**Request Format:** `multipart/form-data`

**Form Fields:**
- `file`: The file to upload (required)
- `tags`: Comma-separated tags (optional)
- `description`: File description (optional)

**Response Format:**
```json
{
  "success": true,
  "file": {
    "id": "file_123",
    "name": "Trading_Strategy_2026.pdf",
    "size": 3456789,
    "type": "pdf",
    "upload_date": "2026-02-01T15:30:00Z",
    "url": "/api/files/file_123",
    "tags": ["strategy", "2026"],
    "description": "Q1 2026 trading strategies"
  }
}
```

**Frontend Implementation:**
```typescript
const handleFileUpload = async (files: FileList) => {
  const formData = new FormData();
  
  Array.from(files).forEach(file => {
    formData.append('file', file);
  });
  
  setUploading(true);
  
  try {
    const result = await apiClient.uploadFile(formData);
    setUploadedFiles(prev => [...prev, result.file]);
    showToast('File uploaded successfully', 'success');
  } catch (error) {
    showToast('Upload failed', 'error');
  } finally {
    setUploading(false);
  }
};
```

**Backend Implementation:**
```python
@app.post("/api/knowledge-base/upload")
async def upload_file(
    file: UploadFile = File(...),
    tags: str = Form(None),
    description: str = Form(None),
    current_user: User = Depends(get_current_user)
):
    # Validate file size (max 100MB)
    if file.size > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Save file to storage
    file_id = str(uuid.uuid4())
    file_path = await save_file(file, file_id)
    
    # Extract text content for search
    content = await extract_text(file_path, file.content_type)
    
    # Save to database
    db_file = await save_file_metadata(
        id=file_id,
        user_id=current_user.id,
        name=file.filename,
        size=file.size,
        type=file.content_type,
        content=content,
        tags=tags.split(',') if tags else [],
        description=description
    )
    
    return {
        "success": True,
        "file": db_file.to_dict()
    }
```

---

#### 2. **File List Display**

**UI Element:** Grid of file cards showing uploaded documents

**API Endpoint:** `GET /api/knowledge-base/files`

**Query Parameters:**
- `limit` (optional): Number of files (default: 50)
- `offset` (optional): Pagination offset
- `search` (optional): Search query
- `tags` (optional): Filter by tags

**Response Format:**
```json
{
  "files": [
    {
      "id": "file_123",
      "name": "Trading_Strategy_2026.pdf",
      "size": 3456789,
      "type": "pdf",
      "upload_date": "2026-02-01T15:30:00Z",
      "tags": ["strategy", "2026"],
      "description": "Q1 2026 trading strategies",
      "page_count": 45,
      "thumbnail_url": "/api/files/file_123/thumbnail"
    }
  ],
  "total": 128,
  "has_more": true
}
```

---

#### 3. **Search Documents**

**UI Element:** Search bar with magnifying glass icon

**API Endpoint:** `GET /api/knowledge-base/search?q={query}`

**Query Parameters:**
- `q`: Search query (required)
- `limit`: Number of results (default: 20)
- `min_relevance`: Minimum relevance score (default: 0.5)

**Response Format:**
```json
{
  "results": [
    {
      "file_id": "file_123",
      "file_name": "Trading_Strategy_2026.pdf",
      "relevance_score": 0.89,
      "matches": [
        {
          "page": 12,
          "content": "...moving average crossover strategy...",
          "highlight": "moving average <mark>crossover</mark> strategy"
        }
      ]
    }
  ],
  "total_results": 5,
  "query": "crossover strategy"
}
```

**Frontend:**
```typescript
const handleSearch = async (query: string) => {
  if (query.length < 3) return;
  
  setSearching(true);
  try {
    const results = await apiClient.searchKnowledgeBase(query);
    setSearchResults(results);
  } catch (error) {
    console.error('Search failed:', error);
  } finally {
    setSearching(false);
  }
};
```

---

#### 4. **Delete File**

**UI Element:** Trash icon button on file cards

**API Endpoint:** `DELETE /api/knowledge-base/files/{file_id}`

**Response Format:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

#### 5. **Download File**

**UI Element:** Download icon button on file cards

**API Endpoint:** `GET /api/knowledge-base/files/{file_id}/download`

**Response:** File binary data with appropriate headers

**Headers:**
```
Content-Type: application/pdf (or appropriate MIME type)
Content-Disposition: attachment; filename="Trading_Strategy_2026.pdf"
```

---

#### 6. **View File Details**

**UI Element:** Clicking on a file card opens detail modal

**API Endpoint:** `GET /api/knowledge-base/files/{file_id}`

**Response Format:**
```json
{
  "id": "file_123",
  "name": "Trading_Strategy_2026.pdf",
  "size": 3456789,
  "type": "pdf",
  "upload_date": "2026-02-01T15:30:00Z",
  "tags": ["strategy", "2026"],
  "description": "Q1 2026 trading strategies",
  "page_count": 45,
  "word_count": 12500,
  "metadata": {
    "author": "John Doe",
    "created_date": "2026-01-15",
    "modified_date": "2026-01-28"
  },
  "usage_stats": {
    "referenced_in_generations": 12,
    "referenced_in_chats": 8
  }
}
```

---

#### 7. **Update File Tags**

**UI Element:** Tag input field in file details modal

**API Endpoint:** `PATCH /api/knowledge-base/files/{file_id}`

**Request Format:**
```json
{
  "tags": ["strategy", "2026", "updated"],
  "description": "Updated description"
}
```

**Response Format:**
```json
{
  "success": true,
  "file": { /* updated file object */ }
}
```

---

## Backtest Analysis Page

### File: `/pages/BacktestPage.tsx`

Upload and analyze trading strategy backtest results.

---

#### 1. **Upload Backtest Results**

**UI Element:** File upload area for backtest CSV/JSON files

**API Endpoint:** `POST /api/backtest/upload`

**Request Format:** `multipart/form-data`

**Form Fields:**
- `file`: Backtest results file
- `strategy_name`: Name of the strategy
- `description`: Optional description

**Response Format:**
```json
{
  "success": true,
  "backtest": {
    "id": "bt_456",
    "strategy_name": "RSI Mean Reversion",
    "upload_date": "2026-02-01T16:00:00Z",
    "status": "processing"
  }
}
```

---

#### 2. **Backtest Results Display**

**UI Element:** Multiple result cards and charts

**API Endpoint:** `GET /api/backtest/{backtest_id}/results`

**Response Format:**
```json
{
  "id": "bt_456",
  "strategy_name": "RSI Mean Reversion",
  "date_range": {
    "start": "2020-01-01",
    "end": "2025-12-31"
  },
  "summary": {
    "total_return": 245.67,
    "annual_return": 18.4,
    "sharpe_ratio": 1.85,
    "max_drawdown": -15.2,
    "win_rate": 67.8,
    "profit_factor": 2.34,
    "total_trades": 432,
    "winning_trades": 293,
    "losing_trades": 139
  },
  "monthly_returns": [
    {"month": "2025-01", "return": 3.2},
    {"month": "2025-02", "return": -1.5}
  ],
  "equity_curve": [
    {"date": "2020-01-01", "equity": 100000},
    {"date": "2020-01-02", "equity": 100500}
  ],
  "trades": [
    {
      "id": "trade_001",
      "symbol": "AAPL",
      "entry_date": "2025-01-15",
      "exit_date": "2025-02-10",
      "entry_price": 150.00,
      "exit_price": 165.00,
      "quantity": 100,
      "profit_loss": 1500.00,
      "return_pct": 10.0
    }
  ]
}
```

**Frontend Implementation:**
```typescript
const loadBacktestResults = async (backtestId: string) => {
  try {
    const results = await apiClient.getBacktestResults(backtestId);
    setBacktestData(results);
    renderCharts(results);
  } catch (error) {
    console.error('Failed to load backtest results:', error);
  }
};
```

---

#### 3. **AI Insights**

**UI Element:** Card showing AI-generated analysis of backtest results

**API Endpoint:** `POST /api/backtest/{backtest_id}/insights`

**Request:** None (uses backtest data)

**Response Format:**
```json
{
  "insights": [
    {
      "type": "strength",
      "title": "Strong Win Rate",
      "description": "Your strategy maintains a 67.8% win rate, which is excellent for mean reversion strategies.",
      "icon": "trending-up",
      "color": "#22C55E"
    },
    {
      "type": "warning",
      "title": "Large Drawdown Risk",
      "description": "Maximum drawdown of 15.2% suggests room for improvement in risk management.",
      "icon": "alert-triangle",
      "color": "#FF9800"
    },
    {
      "type": "recommendation",
      "title": "Consider Position Sizing",
      "description": "Implementing Kelly Criterion could optimize your position sizes and reduce drawdown.",
      "icon": "lightbulb",
      "color": "#60A5FA"
    }
  ],
  "overall_rating": "good",
  "rating_score": 7.5
}
```

---

#### 4. **Compare Backtests**

**UI Element:** Dropdown to select multiple backtests for comparison

**API Endpoint:** `POST /api/backtest/compare`

**Request Format:**
```json
{
  "backtest_ids": ["bt_456", "bt_789", "bt_012"]
}
```

**Response Format:**
```json
{
  "comparison": {
    "backtests": [
      {
        "id": "bt_456",
        "name": "RSI Mean Reversion",
        "total_return": 245.67,
        "sharpe_ratio": 1.85,
        "max_drawdown": -15.2
      },
      {
        "id": "bt_789",
        "name": "MACD Momentum",
        "total_return": 189.34,
        "sharpe_ratio": 1.62,
        "max_drawdown": -12.8
      }
    ],
    "winner": {
      "by_return": "bt_456",
      "by_sharpe": "bt_456",
      "by_drawdown": "bt_789"
    }
  }
}
```

---

#### 5. **Export Backtest Report**

**UI Element:** Export button to download PDF report

**API Endpoint:** `GET /api/backtest/{backtest_id}/export?format=pdf`

**Query Parameters:**
- `format`: "pdf" or "excel"

**Response:** PDF or Excel file

---

#### 6. **Delete Backtest**

**UI Element:** Delete button on backtest cards

**API Endpoint:** `DELETE /api/backtest/{backtest_id}`

**Response Format:**
```json
{
  "success": true,
  "message": "Backtest deleted successfully"
}
```

---

## Reverse Engineer Page

### File: `/pages/ReverseEngineerPage.tsx`

Upload chart images or describe patterns to reverse engineer trading strategies.

---

#### 1. **Upload Chart Image**

**UI Element:** Image upload area with drag-and-drop

**API Endpoint:** `POST /api/reverse-engineer/upload-image`

**Request Format:** `multipart/form-data`

**Form Fields:**
- `image`: Chart image file (PNG, JPG)
- `description`: Optional description of what to analyze

**Response Format:**
```json
{
  "success": true,
  "analysis_id": "rev_123",
  "status": "processing",
  "estimated_time": 30
}
```

---

#### 2. **Get Analysis Results**

**UI Element:** Results display showing detected patterns and strategy

**API Endpoint:** `GET /api/reverse-engineer/{analysis_id}/results`

**Response Format:**
```json
{
  "analysis_id": "rev_123",
  "status": "completed",
  "detected_patterns": [
    {
      "type": "support_resistance",
      "confidence": 0.92,
      "description": "Clear support level at $150",
      "locations": [
        {"x": 120, "y": 340},
        {"x": 280, "y": 342}
      ]
    },
    {
      "type": "trend_line",
      "confidence": 0.87,
      "description": "Upward trend from June to December",
      "slope": 0.0042
    }
  ],
  "suggested_strategy": {
    "name": "Support Bounce with Trend Confirmation",
    "entry_rules": [
      "Price touches support level ($150)",
      "RSI below 40",
      "Upward trend intact"
    ],
    "exit_rules": [
      "Price reaches resistance ($180)",
      "Trend broken",
      "Stop loss at 5% below entry"
    ],
    "afl_code": "// Generated AFL code based on analysis\n..."
  },
  "confidence_score": 0.89
}
```

**Polling Implementation:**
```typescript
const pollAnalysisResults = async (analysisId: string) => {
  const maxAttempts = 30;
  let attempts = 0;
  
  const poll = async () => {
    try {
      const results = await apiClient.getReverseEngineerResults(analysisId);
      
      if (results.status === 'completed') {
        setAnalysisResults(results);
        return;
      }
      
      if (results.status === 'failed') {
        setError('Analysis failed');
        return;
      }
      
      if (attempts < maxAttempts) {
        attempts++;
        setTimeout(poll, 2000); // Poll every 2 seconds
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  };
  
  poll();
};
```

---

#### 3. **Text Description Input**

**UI Element:** Large textarea to describe chart patterns

**API Endpoint:** `POST /api/reverse-engineer/from-description`

**Request Format:**
```json
{
  "description": "The chart shows a double bottom pattern at $150 support, followed by a breakout above $165 resistance. Volume increased significantly during the breakout."
}
```

**Response:** Same as image analysis

---

## Training Page

### File: `/pages/TrainingPage.tsx`

Educational content and tutorials for learning AFL coding.

---

#### 1. **Course List**

**UI Element:** Grid of course cards

**API Endpoint:** `GET /api/training/courses`

**Response Format:**
```json
{
  "courses": [
    {
      "id": "course_001",
      "title": "AFL Basics",
      "description": "Learn the fundamentals of AmiBroker Formula Language",
      "level": "beginner",
      "duration_minutes": 120,
      "lessons_count": 8,
      "enrolled": true,
      "progress": 45,
      "thumbnail": "/api/training/courses/course_001/thumbnail"
    }
  ]
}
```

---

#### 2. **Course Content**

**UI Element:** Lesson viewer with video/text content

**API Endpoint:** `GET /api/training/courses/{course_id}/lessons`

**Response Format:**
```json
{
  "course": {
    "id": "course_001",
    "title": "AFL Basics"
  },
  "lessons": [
    {
      "id": "lesson_001",
      "title": "Introduction to AFL",
      "type": "video",
      "duration_minutes": 15,
      "content_url": "/api/training/lessons/lesson_001/content",
      "completed": true,
      "quiz": {
        "id": "quiz_001",
        "questions_count": 5
      }
    }
  ]
}
```

---

#### 3. **Mark Lesson Complete**

**UI Element:** Checkbox or "Mark Complete" button

**API Endpoint:** `POST /api/training/lessons/{lesson_id}/complete`

**Response Format:**
```json
{
  "success": true,
  "next_lesson_id": "lesson_002",
  "course_progress": 50
}
```

---

#### 4. **Quiz Submission**

**UI Element:** Multiple choice quiz interface

**API Endpoint:** `POST /api/training/quizzes/{quiz_id}/submit`

**Request Format:**
```json
{
  "answers": {
    "question_1": "answer_b",
    "question_2": "answer_c",
    "question_3": "answer_a"
  }
}
```

**Response Format:**
```json
{
  "score": 80,
  "total_questions": 5,
  "correct_answers": 4,
  "passed": true,
  "feedback": [
    {
      "question_id": "question_1",
      "correct": true,
      "explanation": "Correct! Arrays in AFL are automatically sized."
    },
    {
      "question_id": "question_2",
      "correct": false,
      "correct_answer": "answer_b",
      "explanation": "The Close array represents closing prices."
    }
  ]
}
```

---

## Researcher Pages

### Files: `/pages/Researcher.tsx`, `/pages/CompanyResearchPage.tsx`, `/pages/StrategyAnalysis.tsx`, `/pages/PeerComparison.tsx`

Research tools for company analysis, strategy evaluation, and peer comparison.

---

### Company Research Page

#### 1. **Search Company**

**UI Element:** Search bar for company ticker/name

**API Endpoint:** `GET /api/research/company/search?q={query}`

**Response Format:**
```json
{
  "results": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "exchange": "NASDAQ",
      "sector": "Technology",
      "industry": "Consumer Electronics"
    }
  ]
}
```

---

#### 2. **Company Overview**

**UI Element:** Detailed company information display

**API Endpoint:** `GET /api/research/company/{symbol}`

**Response Format:**
```json
{
  "symbol": "AAPL",
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

---

#### 3. **AI-Generated Analysis**

**UI Element:** AI insights card

**API Endpoint:** `POST /api/research/company/{symbol}/analyze`

**Response Format:**
```json
{
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

---

### Strategy Analysis Page

#### 1. **Strategy Input**

**UI Element:** Form to describe trading strategy

**API Endpoint:** `POST /api/research/strategy/analyze`

**Request Format:**
```json
{
  "strategy_name": "Moving Average Crossover",
  "description": "Buy when 20 MA crosses above 50 MA, sell when it crosses below",
  "indicators": ["SMA20", "SMA50"],
  "timeframe": "daily",
  "risk_parameters": {
    "max_position_size": 20,
    "stop_loss": 5,
    "take_profit": 15
  }
}
```

**Response Format:**
```json
{
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

---

### Peer Comparison Page

#### 1. **Select Companies**

**UI Element:** Multi-select dropdown for company symbols

**API Endpoint:** `POST /api/research/peer-comparison`

**Request Format:**
```json
{
  "symbols": ["AAPL", "MSFT", "GOOGL"],
  "metrics": ["revenue", "pe_ratio", "market_cap", "profit_margin"]
}
```

**Response Format:**
```json
{
  "comparison": {
    "companies": [
      {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "revenue": 394328000000,
        "pe_ratio": 28.5,
        "market_cap": 2800000000000,
        "profit_margin": 24.6
      },
      {
        "symbol": "MSFT",
        "name": "Microsoft Corporation",
        "revenue": 211915000000,
        "pe_ratio": 32.1,
        "market_cap": 2750000000000,
        "profit_margin": 34.8
      }
    ],
    "rankings": {
      "by_revenue": ["AAPL", "MSFT", "GOOGL"],
      "by_pe_ratio": ["AAPL", "GOOGL", "MSFT"],
      "by_profit_margin": ["MSFT", "GOOGL", "AAPL"]
    },
    "analysis": "Microsoft shows the highest profit margins while Apple leads in revenue..."
  }
}
```

---

## Admin Page

### File: `/pages/AdminPage.tsx`

Administrative dashboard for user management and system monitoring.

---

#### 1. **User Management**

**UI Element:** Table of all users with actions

**API Endpoint:** `GET /api/admin/users?page=1&limit=50`

**Response Format:**
```json
{
  "users": [
    {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "trader",
      "created_at": "2025-06-15T10:00:00Z",
      "last_login": "2026-02-01T14:30:00Z",
      "status": "active",
      "usage_stats": {
        "generations": 45,
        "backtests": 12,
        "storage_used_mb": 156
      }
    }
  ],
  "total": 1248,
  "page": 1,
  "pages": 25
}
```

---

#### 2. **Update User Role**

**UI Element:** Role dropdown on user rows

**API Endpoint:** `PATCH /api/admin/users/{user_id}`

**Request Format:**
```json
{
  "role": "admin"
}
```

**Response Format:**
```json
{
  "success": true,
  "user": { /* updated user object */ }
}
```

---

#### 3. **System Stats**

**UI Element:** Dashboard cards showing system metrics

**API Endpoint:** `GET /api/admin/system/stats`

**Response Format:**
```json
{
  "total_users": 1248,
  "active_users_today": 342,
  "total_generations": 45678,
  "total_storage_gb": 456.7,
  "api_calls_today": 12456,
  "error_rate": 0.23,
  "avg_response_time_ms": 234
}
```

---

#### 4. **API Usage Logs**

**UI Element:** Filterable log table

**API Endpoint:** `GET /api/admin/logs?type=api&limit=100`

**Query Parameters:**
- `type`: Log type (api, error, auth)
- `limit`: Number of logs
- `start_date`: Filter start date
- `end_date`: Filter end date

**Response Format:**
```json
{
  "logs": [
    {
      "id": "log_001",
      "timestamp": "2026-02-01T14:30:00Z",
      "user_id": "user_123",
      "endpoint": "/api/afl/generate",
      "method": "POST",
      "status": 200,
      "response_time_ms": 1234,
      "ip_address": "192.168.1.100"
    }
  ],
  "total": 45678
}
```

---

## Settings Page

### File: `/pages/SettingsPage.tsx`

User settings and preferences management.

---

#### 1. **Update Profile**

**UI Element:** Profile form with name, email fields

**API Endpoint:** `PATCH /api/settings/profile`

**Request Format:**
```json
{
  "name": "John Updated Doe",
  "email": "john.new@example.com"
}
```

**Response Format:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "name": "John Updated Doe",
    "email": "john.new@example.com"
  }
}
```

---

#### 2. **Change Password**

**UI Element:** Password change form

**API Endpoint:** `POST /api/settings/change-password`

**Request Format:**
```json
{
  "current_password": "oldpassword123",
  "new_password": "newSecurePass456!",
  "confirm_password": "newSecurePass456!"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

---

#### 3. **API Keys Management**

**UI Element:** API keys list with generate/revoke buttons

##### Generate New API Key

**API Endpoint:** `POST /api/settings/api-keys`

**Request Format:**
```json
{
  "name": "Production Key",
  "permissions": ["read", "write"]
}
```

**Response Format:**
```json
{
  "success": true,
  "api_key": {
    "id": "key_123",
    "key": "pk_live_abc123def456ghi789",
    "name": "Production Key",
    "created_at": "2026-02-01T15:00:00Z",
    "permissions": ["read", "write"],
    "last_used": null
  },
  "warning": "Store this key securely. It will not be shown again."
}
```

##### Revoke API Key

**API Endpoint:** `DELETE /api/settings/api-keys/{key_id}`

**Response Format:**
```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

##### List API Keys

**API Endpoint:** `GET /api/settings/api-keys`

**Response Format:**
```json
{
  "api_keys": [
    {
      "id": "key_123",
      "key": "pk_live_abc...789",
      "name": "Production Key",
      "created_at": "2026-02-01T15:00:00Z",
      "last_used": "2026-02-01T16:30:00Z",
      "permissions": ["read", "write"]
    }
  ]
}
```

---

#### 4. **Appearance Settings (Theme, Font Size)**

**Note:** Theme and font size are currently stored in **localStorage only**. To persist across devices:

**API Endpoint:** `PATCH /api/settings/appearance`

**Request Format:**
```json
{
  "theme": "dark",
  "accent_color": "#FEC00F",
  "font_size": "medium"
}
```

**Response Format:**
```json
{
  "success": true,
  "settings": {
    "theme": "dark",
    "accent_color": "#FEC00F",
    "font_size": "medium"
  }
}
```

---

#### 5. **Notification Settings**

**UI Element:** Toggle switches for various notifications

**API Endpoint:** `PATCH /api/settings/notifications`

**Request Format:**
```json
{
  "email_notifications": true,
  "code_gen_complete": true,
  "backtest_complete": true,
  "system_updates": false,
  "marketing_emails": false
}
```

**Response Format:**
```json
{
  "success": true,
  "notifications": { /* updated settings */ }
}
```

---

#### 6. **Delete Account**

**UI Element:** Danger zone with delete account button

**API Endpoint:** `DELETE /api/settings/account`

**Request Format:**
```json
{
  "password": "confirmpassword123",
  "confirmation": "DELETE"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

## Error Handling

### Standard Error Response Format

All API errors should follow this format:

```json
{
  "success": false,
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "email",
    "reason": "Email already exists"
  },
  "timestamp": "2026-02-01T15:00:00Z"
}
```

### HTTP Status Codes

- **200**: Success
- **201**: Created successfully
- **400**: Bad request (validation error)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not found
- **409**: Conflict (duplicate resource)
- **422**: Unprocessable entity (validation failed)
- **429**: Too many requests (rate limit)
- **500**: Internal server error
- **503**: Service unavailable

### Frontend Error Handling Pattern

```typescript
try {
  const result = await apiClient.someEndpoint();
  // Handle success
} catch (error) {
  if (error.status === 401) {
    // Redirect to login
    logout();
    navigate('/login');
  } else if (error.status === 403) {
    showToast('You do not have permission to perform this action', 'error');
  } else if (error.status === 429) {
    showToast('Rate limit exceeded. Please try again later.', 'warning');
  } else {
    showToast(error.message || 'An error occurred', 'error');
  }
}
```

---

## WebSocket Integration

### Real-Time Updates

For real-time features like chat streaming and backtest progress, implement WebSocket connections:

**WebSocket URL:** `ws://0.0.0.0:8000/ws`

#### Connection Setup

```typescript
// File: /lib/websocket.ts

class WebSocketClient {
  private ws: WebSocket | null = null;
  private token: string;
  
  connect(token: string) {
    this.token = token;
    this.ws = new WebSocket(`ws://0.0.0.0:8000/ws?token=${token}`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket closed');
      // Reconnect logic
      setTimeout(() => this.connect(this.token), 3000);
    };
  }
  
  send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }
  
  handleMessage(data: any) {
    // Route to appropriate handler
    switch (data.type) {
      case 'chat_message':
        // Handle chat message
        break;
      case 'generation_progress':
        // Handle generation progress
        break;
      case 'backtest_update':
        // Handle backtest update
        break;
    }
  }
}
```

#### Message Types

**Chat Message Streaming:**
```json
{
  "type": "chat_token",
  "payload": {
    "conversation_id": "conv_123",
    "message_id": "msg_456",
    "token": " generating",
    "done": false
  }
}
```

**Generation Progress:**
```json
{
  "type": "generation_progress",
  "payload": {
    "generation_id": "gen_789",
    "stage": "analyzing",
    "progress": 45,
    "message": "Analyzing strategy components..."
  }
}
```

**Backtest Progress:**
```json
{
  "type": "backtest_progress",
  "payload": {
    "backtest_id": "bt_456",
    "trades_processed": 234,
    "total_trades": 432,
    "progress": 54,
    "current_date": "2024-06-15"
  }
}
```

---

## File Upload Handling

### Multipart Form Data

All file uploads use `multipart/form-data` encoding.

**Frontend Implementation:**

```typescript
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify({ tags: ['example'] }));
  
  const response = await fetch('http://0.0.0.0:8000/api/knowledge-base/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Do NOT set Content-Type header - browser sets it automatically with boundary
    },
    body: formData,
  });
  
  return await response.json();
};
```

**Backend Implementation (Python/FastAPI):**

```python
@app.post("/api/knowledge-base/upload")
async def upload_file(
    file: UploadFile = File(...),
    metadata: str = Form(None)
):
    # Read file
    contents = await file.read()
    
    # Process file
    file_id = await save_file(file.filename, contents)
    
    return {"file_id": file_id, "filename": file.filename}
```

### File Size Limits

**Recommended Limits:**
- Images: 10 MB
- Documents (PDF, DOCX): 50 MB
- Backtest CSV: 20 MB
- General uploads: 100 MB

**Validation:**

```python
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB

async def validate_file_size(file: UploadFile):
    file.file.seek(0, 2)  # Seek to end
    size = file.file.tell()
    file.file.seek(0)  # Reset
    
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
```

---

## Response Formats

### Pagination

**Standard Pagination Format:**

```json
{
  "items": [ /* array of items */ ],
  "total": 1248,
  "page": 1,
  "per_page": 50,
  "pages": 25,
  "has_next": true,
  "has_prev": false
}
```

**Query Parameters:**
- `page`: Page number (1-indexed)
- `limit` or `per_page`: Items per page
- `offset`: Alternative to page (0-indexed offset)

### Timestamps

All timestamps should use **ISO 8601 format with timezone**:

```
2026-02-01T14:30:00Z
```

**Frontend Formatting:**

```typescript
// Parse ISO timestamp
const date = new Date('2026-02-01T14:30:00Z');

// Format for display
const formatted = date.toLocaleString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
// Output: "Feb 1, 2026, 2:30 PM"
```

### Nullable Fields

Use `null` for missing/unset values, not empty strings:

```json
{
  "name": "John Doe",
  "middle_name": null,  // Correct
  "suffix": ""          // Incorrect - use null instead
}
```

---

## Security Considerations

### 1. **JWT Token Storage**

**Current Implementation:** Tokens stored in `localStorage`

**Security Improvement:** Consider using `httpOnly` cookies:

```python
# Backend sets httpOnly cookie
response.set_cookie(
    key="auth_token",
    value=token,
    httponly=True,
    secure=True,  # HTTPS only
    samesite="strict",
    max_age=86400  # 24 hours
)
```

### 2. **CORS Configuration**

**Backend CORS Setup:**

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. **Rate Limiting**

Implement rate limiting on expensive endpoints:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/afl/generate")
@limiter.limit("10/minute")  # Max 10 generations per minute
async def generate_afl(request: Request, ...):
    pass
```

### 4. **Input Validation**

Always validate and sanitize inputs:

```python
from pydantic import BaseModel, validator

class AFLGenerationRequest(BaseModel):
    request: str
    strategy_type: str
    
    @validator('request')
    def validate_request(cls, v):
        if len(v) < 10:
            raise ValueError('Request too short')
        if len(v) > 5000:
            raise ValueError('Request too long')
        return v
    
    @validator('strategy_type')
    def validate_strategy_type(cls, v):
        if v not in ['standalone', 'composite']:
            raise ValueError('Invalid strategy type')
        return v
```

### 5. **SQL Injection Prevention**

Use parameterized queries:

```python
# Bad - SQL injection vulnerable
query = f"SELECT * FROM users WHERE email = '{email}'"

# Good - parameterized
query = "SELECT * FROM users WHERE email = %s"
cursor.execute(query, (email,))
```

### 6. **File Upload Security**

```python
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt', 'csv', 'xlsx'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.post("/api/knowledge-base/upload")
async def upload_file(file: UploadFile = File(...)):
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Scan for malware
    await scan_file_for_viruses(file)
    
    # Continue with upload
```

---

## API Testing

### Postman Collection

Create a Postman collection with all endpoints for testing:

**Example Request:**

```
POST http://0.0.0.0:8000/api/afl/generate
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
Body:
{
  "request": "Create a moving average crossover strategy",
  "strategy_type": "standalone",
  "backtest_settings": {
    "initial_capital": 100000
  }
}
```

### cURL Examples

**Login:**
```bash
curl -X POST http://0.0.0.0:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

**Generate AFL:**
```bash
curl -X POST http://0.0.0.0:8000/api/afl/generate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "request": "Create RSI strategy",
    "strategy_type": "standalone"
  }'
```

**Upload File:**
```bash
curl -X POST http://0.0.0.0:8000/api/knowledge-base/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/document.pdf" \
  -F "tags=strategy,2026"
```

---

## Summary

This document covers **every UI element** in the Analyst by Potomac application and how to integrate it with your backend API. Each section includes:

✅ Exact API endpoints  
✅ Request/response formats  
✅ Frontend code locations  
✅ Backend implementation examples  
✅ Error handling patterns  
✅ Security considerations  

**Next Steps:**

1. Implement backend endpoints matching the specifications
2. Test each endpoint using Postman or cURL
3. Update API base URL in `/lib/api.ts` to your production server
4. Implement WebSocket server for real-time features
5. Add rate limiting and security measures
6. Set up monitoring and logging

**Questions or Issues?**

Refer to:
- `/lib/api.ts` - API client implementation
- Individual page files for frontend logic
- This document for complete API specifications

---

**Document Version:** 1.0  
**Total Pages:** 45+  
**Total Endpoints Documented:** 60+  
**Last Updated:** February 1, 2026
