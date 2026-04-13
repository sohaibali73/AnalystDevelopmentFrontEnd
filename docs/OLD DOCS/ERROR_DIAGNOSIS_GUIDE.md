# Error Diagnosis Guide: Frontend vs Backend

## Common Frontend Issues (Client-Side)

### 1. **CORS Errors**
**Error Message**: 
```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Cause**: Backend API doesn't allow requests from your frontend domain
**Solution**: 
- Check if backend has CORS enabled for `http://localhost:3000`
- Backend should include: `Access-Control-Allow-Origin: http://localhost:3000`

### 2. **Network Connection Errors**
**Error Message**:
```
Failed to fetch
TypeError: fetch failed
```

**Cause**: Backend server not running or unreachable
**Solution**:
- Start backend server on `http://localhost:8000`
- Check if port 8000 is accessible
- Verify network connectivity

### 3. **Authentication Errors**
**Error Message**:
```
401 Unauthorized
403 Forbidden
```

**Cause**: Missing or invalid authentication token
**Solution**:
- Check if user is logged in
- Verify token is being sent in Authorization header
- Check token expiration

### 4. **TypeScript/React Errors**
**Error Message**:
```
TypeError: Cannot read property 'map' of undefined
ReferenceError: React is not defined
```

**Cause**: Frontend code issues
**Solution**:
- Check component state initialization
- Verify data fetching logic
- Fix TypeScript type errors

## Common Backend Issues (Server-Side)

### 1. **API Endpoint Not Found**
**Error Message**:
```
404 Not Found
```

**Cause**: Wrong API endpoint URL or backend route missing
**Solution**:
- Verify API endpoint URLs match backend routes
- Check if backend server is running
- Verify route definitions in backend

### 2. **Server Errors**
**Error Message**:
```
500 Internal Server Error
```

**Cause**: Backend server crash or database issues
**Solution**:
- Check backend server logs
- Verify database connection
- Check environment variables

### 3. **Database Connection Errors**
**Error Message**:
```
Connection refused
Database not found
```

**Cause**: Database server issues
**Solution**:
- Check database server status
- Verify database credentials
- Check database connection string

## How to Identify Your Error

### Check Browser Console (Frontend)
1. Open your app in browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for red error messages

### Check Network Tab (API Issues)
1. Open Developer Tools (F12)
2. Go to Network tab
3. Make API requests
4. Look for failed requests (red status codes)

### Check Backend Logs
1. Look at your backend server terminal
2. Check for error messages
3. Look for stack traces

## Quick Diagnostic Commands

### Test Backend Health
```bash
# Test if backend is running
curl http://localhost:8000/health

# Test specific endpoints
curl http://localhost:8000/auth/me
```

### Test Frontend
```bash
# Check if frontend is running
npm run dev

# Check for TypeScript errors
npx tsc --noEmit
```

## Most Likely Issues Based on Your Setup

### 1. **Backend Not Running** (Most Common)
- Backend server not started on `http://localhost:8000`
- Port 8000 blocked or in use

### 2. **CORS Configuration**
- Backend doesn't allow requests from `http://localhost:3000`
- Need to configure CORS in backend

### 3. **Environment Variables**
- Missing API keys or configuration
- Wrong database connection strings

### 4. **Authentication Issues**
- Token not being stored properly
- Login flow not working

## Next Steps

1. **Check Browser Console** for specific error messages
2. **Check Network Tab** for failed API requests
3. **Check Backend Logs** for server-side errors
4. **Run Health Checks**:
   ```bash
   npm run check-health
   curl http://localhost:8000/health
   ```

Please share what you find in the browser console or network tab, and I can provide the exact solution!