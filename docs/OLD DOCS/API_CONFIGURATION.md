# API Configuration Guide

## The Problem

The frontend was configured to use `http://0.0.0.0:8000` as the API base URL, which causes network errors because:
- `0.0.0.0` is only accessible from the server itself, not from browsers
- Browsers block connections to `0.0.0.0` for security reasons
- This resulted in "NetworkError when attempting to fetch resource" errors

## The Solution

The API client now uses the production backend URL by default:
```
https://potomac-analyst-workbench.up.railway.app
```

## Configuration Options

### Option 1: Use Production Backend (Default)

No configuration needed! The app will connect to your deployed Railway backend automatically.

### Option 2: Use Local Development Backend

If you're running the backend locally during development:

1. **Create a `.env` file** in the root directory:
```bash
VITE_API_URL=http://localhost:8000
```

2. **Restart your development server** for changes to take effect

### Option 3: Use Custom Backend URL

Set any backend URL in your `.env` file:
```bash
VITE_API_URL=https://your-custom-backend.com
```

## Environment Variables

The app supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://potomac-analyst-workbench.up.railway.app` |

## Verifying the Configuration

### Check Current API URL

Open your browser console and look for log messages like:
```
API Request: POST https://potomac-analyst-workbench.up.railway.app/chat/message
```

### Test Connection

1. Navigate to the Chat page
2. Send a message
3. Check the browser console for the API request URL
4. If you see errors, verify:
   - The backend is running
   - CORS is configured on the backend
   - Your `.env` file is correct (if using custom URL)

## Backend CORS Configuration

Your backend needs to allow requests from the frontend. Make sure your backend has CORS configured:

```python
# Python/FastAPI example
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "https://your-frontend-domain.com",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Troubleshooting

### "Cannot connect to API server" Error

**Symptoms:**
- Chat messages fail to send
- Login doesn't work
- API requests timeout

**Solutions:**
1. Check if the backend is running: Visit `https://potomac-analyst-workbench.up.railway.app/health`
2. Verify your internet connection
3. Check browser console for detailed error messages
4. Ensure CORS is configured on the backend

### CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Requests are blocked by the browser

**Solutions:**
1. Add your frontend URL to backend CORS allowed origins
2. Ensure backend sends correct CORS headers
3. Check that requests use `mode: 'cors'` (already configured)

### Wrong API URL

**Symptoms:**
- Requests go to wrong server
- 404 errors for all endpoints

**Solutions:**
1. Check your `.env` file
2. Restart development server after changing `.env`
3. Verify `VITE_API_URL` is set correctly

## Development Workflow

### For Frontend Developers

1. **No backend access:** Use default production URL (no `.env` needed)
2. **Local backend:** Create `.env` with `VITE_API_URL=http://localhost:8000`
3. **Custom backend:** Set `VITE_API_URL` to your backend URL

### For Backend Developers

1. **Run backend locally:** `uvicorn main:app --host 0.0.0.0 --port 8000`
2. **Configure CORS:** Allow `http://localhost:5173`
3. **Frontend connects:** Create `.env` with local backend URL

## Production Deployment

### Frontend (Vercel/Netlify/etc.)

Set environment variable:
```
VITE_API_URL=https://potomac-analyst-workbench.up.railway.app
```

### Backend (Railway/Heroku/etc.)

Configure CORS to allow your frontend domain:
```python
allow_origins=["https://your-frontend-domain.com"]
```

## Files Modified

- `/lib/api.ts` - Updated API base URL with environment variable support
- `/.env.example` - Created template for environment configuration
- `/API_CONFIGURATION.md` - This documentation

## Summary

✅ **Fixed:** Changed `http://0.0.0.0:8000` to production Railway URL  
✅ **Added:** Environment variable support for custom backends  
✅ **Improved:** Better error messages for network failures  
✅ **Added:** CORS configuration in fetch requests  

The app now works out-of-the-box with the production backend while still supporting local development!
