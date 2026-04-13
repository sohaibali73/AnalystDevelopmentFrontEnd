# Production Deployment Checklist

## ✅ Completed Changes

### 1. Backend Connection
- ✅ Updated `.env` to point to production backend: `https://potomac-analyst-workbench-production.up.railway.app`
- ✅ API client (`src/lib/api.ts`) already configured to use `VITE_API_URL` from environment

### 2. Authentication
- ✅ Updated `AuthContext.tsx` to use real backend authentication
  - Now calls `apiClient.login()` and `apiClient.getCurrentUser()`
  - Properly handles token storage and validation
  - Clears invalid tokens on error

### 3. Registration
- ✅ Updated `RegisterPage.tsx` to use `apiClient.register()`
  - Removed hardcoded API URL
  - Uses centralized API client

### 4. Chat History
- ✅ Removed sample/test data from chat conversations
  - Filters out conversations with "sample" or "test" in title
  - Filters out conversations with IDs starting with "sample-" or "test-"
- ✅ Removed sample/test messages
  - Filters out messages containing "[sample]" or "[test]"
  - Filters out messages with IDs starting with "sample-" or "test-"

### 5. File Upload
- ✅ Disabled file upload API call (not yet implemented in backend)
  - File name still added to input for UX
  - No error thrown when selecting files

## 🔍 Testing Recommendations

### Before Deployment:
1. **Test Authentication Flow**
   - Register a new account with real API keys
   - Login with existing credentials
   - Verify token persistence across page refreshes
   - Test logout functionality

2. **Test Chat Functionality**
   - Create new conversations
   - Send messages and verify responses
   - Check that no sample data appears
   - Verify conversation history loads correctly

3. **Test AFL Generation**
   - Generate AFL code
   - Optimize existing code
   - Debug code with errors
   - Validate AFL syntax

4. **Test Knowledge Base**
   - Upload documents
   - Search knowledge base
   - View document stats

5. **Test Admin Features** (if applicable)
   - Access admin panel
   - Manage training data
   - Review feedback

### Environment Variables:
```env
VITE_API_URL=https://potomac-analyst-workbench-production.up.railway.app
```

## 🚀 Deployment Steps

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Test the build locally:**
   ```bash
   npm run preview
   ```

3. **Deploy to your hosting platform** (Vercel, Netlify, etc.)
   - Ensure environment variable `VITE_API_URL` is set in deployment settings
   - Point to: `https://potomac-analyst-workbench-production.up.railway.app`

4. **Post-Deployment Verification:**
   - Test login/registration
   - Verify API calls are reaching the backend
   - Check browser console for errors
   - Test all major features

## 📝 Notes

- All API calls now go through the centralized `apiClient` in `src/lib/api.ts`
- CORS is enabled in API client with `mode: 'cors'` and `credentials: 'omit'`
- Error handling is in place for network failures
- Sample data is filtered out in production to ensure clean user experience

## ⚠️ Known Limitations

- File upload in chat is disabled (backend endpoint not yet implemented)
- Users will need valid Claude API keys to register
- Tavily API key is optional for web search features
