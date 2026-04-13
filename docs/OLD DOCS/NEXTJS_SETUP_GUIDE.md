# Next.js Setup Guide & Troubleshooting

This guide covers the fixes applied to your Next.js setup and common issues to watch out for.

## Issues Fixed

### 1. TypeScript Configuration
**Problem**: Target was set to ES5, which is outdated and causes compatibility issues with modern libraries.
**Fix**: Updated `tsconfig.json` to target ES2020 for better compatibility.

### 2. API Configuration
**Problem**: No development API URL configured, causing API calls to fail during development.
**Fix**: 
- Added development API URL fallback (`http://localhost:8000`)
- Updated both `src/lib/api.ts` and `next.config.js` to use the same logic
- Created `.env.development` file for local development

### 3. Authentication Context
**Problem**: Inconsistent API response handling in login/register methods.
**Fix**: Added fallback logic to fetch user data if not included in login response.

### 4. Next.js Configuration
**Problem**: Turbopack warning and outdated webpack configuration.
**Fix**: Removed turbopack configuration and updated API URL logic.

### 5. Mobile Components Styling
**Problem**: Inconsistent styling using inline styles instead of Tailwind classes.
**Fix**: Converted all mobile components to use Tailwind classes for consistency.

### 6. Font Configuration
**Problem**: Missing custom font imports for mobile components.
**Fix**: Added Google Fonts imports and custom font classes to `globals.css`.

## Development Setup

### 1. Environment Variables
Create a `.env.development` file with your API configuration:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

### 2. API Server
Make sure your backend API server is running on the configured port (default: `http://localhost:8000`).

### 3. Starting Development
```bash
# Check setup health
npm run check-health

# Start development server
npm run dev
```

## Common Issues & Solutions

### Port Conflicts
If you see "Port 3000 is in use", another process is using the port:
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID [PID] /F

# Or use a different port
npm run dev -- --port 3002
```

### API Connection Issues
1. **Check API server is running**: Visit `http://localhost:8000/health` in your browser
2. **Verify CORS settings**: Ensure your API allows requests from `http://localhost:3000` or `http://localhost:3001`
3. **Check environment variables**: Verify `.env.development` exists and has correct API URL

### TypeScript Errors
1. **Clear TypeScript cache**:
   ```bash
   rm -rf .next/
   npm run dev
   ```

2. **Check TypeScript configuration**: Ensure `tsconfig.json` has `target: "ES2020"`

### Styling Issues
1. **Tailwind classes not working**: Check that `globals.css` is imported in `app/layout.tsx`
2. **Custom fonts not loading**: Verify internet connection and Google Fonts accessibility

### Authentication Issues
1. **Login fails**: Check API response structure matches expected format
2. **Token not persisting**: Verify localStorage access is not blocked by browser settings

## Health Check Script

Run the health check script to verify your setup:
```bash
npm run check-health
```

This script checks:
- Required files exist
- Dependencies are installed
- Environment configuration
- TypeScript configuration
- Next.js configuration

## Performance Optimizations

### 1. Image Optimization
- Use Next.js Image component for all images
- Configure `next.config.js` image domains properly

### 2. Bundle Size
- Use dynamic imports for heavy components
- Enable tree shaking in `next.config.js`

### 3. Caching
- Implement proper caching strategies for API calls
- Use memoization for expensive calculations

## Debugging Tips

### 1. Browser Developer Tools
- Check Console for JavaScript errors
- Monitor Network tab for API request issues
- Use React DevTools for component debugging

### 2. Next.js Debug Mode
```bash
# Enable debug logging
NEXT_DEBUG=1 npm run dev
```

### 3. API Debugging
- Add console.log statements in `src/lib/api.ts`
- Check browser Network tab for request/response details
- Verify API endpoints are accessible

## Getting Help

If you encounter issues not covered here:

1. **Run health check**: `npm run check-health`
2. **Check browser console** for specific error messages
3. **Verify API server** is running and accessible
4. **Review environment configuration** in `.env.development`

## Next Steps

After fixing these issues:
1. Test all major functionality (login, API calls, routing)
2. Verify mobile responsiveness
3. Check performance with Lighthouse
4. Consider adding error boundaries for better error handling
5. Implement proper loading states for async operations