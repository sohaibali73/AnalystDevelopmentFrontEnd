Write-Host "Fixing SSR window errors in page components..." -ForegroundColor Cyan

# Get all TypeScript/React files in src directory
$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $changed = $false
    
    # Pattern 1: useState(window.innerWidth...) - replace with useState(false) or useState(0)
    if ($content -match 'useState\s*\(\s*window\.') {
        Write-Host "Fixing window reference in useState in: $($file.Name)" -ForegroundColor Yellow
        
        # Fix window.innerWidth checks
        $content = $content -replace 'useState\s*\(\s*window\.innerWidth\s*<\s*\d+\s*\)', 'useState(false)'
        $content = $content -replace 'useState\s*\(\s*window\.innerWidth\s*>\s*\d+\s*\)', 'useState(false)'
        $content = $content -replace 'useState\s*\(\s*window\.innerWidth\s*\)', 'useState(0)'
        $content = $content -replace 'useState\s*\(\s*window\.innerHeight\s*\)', 'useState(0)'
        
        # Fix any other window properties
        $content = $content -replace 'useState\s*\(\s*window\.[^\)]+\)', 'useState(undefined)'
        
        $changed = $true
    }
    
    # Pattern 2: Direct window access outside useEffect
    if ($content -match '^[^/]*window\.' -and $content -notmatch 'useEffect|addEventListener|removeEventListener|typeof window') {
        # Check if file has proper client directive
        if ($content -notmatch "^'use client'") {
            Write-Host "Adding 'use client' directive to: $($file.Name)" -ForegroundColor Yellow
            $content = "'use client'`n`n" + $content
            $changed = $true
        }
    }
    
    # Save if changed
    if ($changed) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`nSSR error fixes complete!" -ForegroundColor Green
Write-Host "The dev server will hot reload the changes automatically." -ForegroundColor Cyan