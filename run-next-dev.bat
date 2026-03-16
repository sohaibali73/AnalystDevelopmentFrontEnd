@echo off
cd /d "C:\Users\SohaibAli\Documents\Abpfrontend"
echo Current directory: %cd%
echo.
echo Listing app directory:
dir app
echo.
echo Starting Next.js development server...
npx next dev