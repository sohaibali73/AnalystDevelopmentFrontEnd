@echo off
echo Starting Next.js Development Server with Persistent Cache Configuration...

REM Set environment variables for better Windows cache persistence
set TURBOPACK_BUILD_CACHE_DIR=.next/cache/turbopack
set NEXT_CACHE_DIR=.next/cache
set NODE_OPTIONS=--max-old-space-size=4096
set TURBOPACK_DISABLE_FILESYSTEM_CACHE=false
set NEXT_BUILD_CACHE_ENABLED=true

REM Create cache directories if they don't exist
if not exist ".next\cache" mkdir ".next\cache"
if not exist ".next\cache\turbopack" mkdir ".next\cache\turbopack"
if not exist ".next\cache\webpack" mkdir ".next\cache\webpack"

REM Set proper permissions for cache directories (Windows)
icacls ".next\cache" /grant:r "%USERNAME%:(OI)(CI)F" /T >nul 2>&1

REM Clear any existing node processes
taskkill /f /im node.exe >nul 2>&1

echo Cache directories prepared with proper permissions
echo Starting development server...

REM Start the development server
npm run dev