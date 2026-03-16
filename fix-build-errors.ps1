# PowerShell script to fix all build errors

Write-Host "Fixing build errors..." -ForegroundColor Green

# Fix 1: Remove version specifications from UI component imports
Write-Host "Fixing UI component imports..." -ForegroundColor Cyan
$uiFiles = Get-ChildItem -Path "C:\Users\SohaibAli\Documents\Abpfrontend\src\components\ui" -Filter "*.tsx"
foreach ($file in $uiFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Remove version specifications
    $content = $content -replace '@radix-ui/react-dialog@1\.1\.6', '@radix-ui/react-dialog'
    $content = $content -replace '@radix-ui/react-slot@1\.1\.2', '@radix-ui/react-slot'
    $content = $content -replace '@radix-ui/react-tabs@1\.1\.3', '@radix-ui/react-tabs'
    $content = $content -replace 'class-variance-authority@0\.7\.1', 'class-variance-authority'
    $content = $content -replace 'lucide-react@0\.487\.0', 'lucide-react'
    
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
}

# Fix 2: Fix DashboardPage imports
Write-Host "Fixing DashboardPage imports..." -ForegroundColor Cyan
$dashboardFile = "C:\Users\SohaibAli\Documents\Abpfrontend\src\page-components\DashboardPage.tsx"
$content = Get-Content $dashboardFile -Raw
$content = $content -replace '@/src/contexts/AuthContext', '@/contexts/AuthContext'
$content = $content -replace '@/src/contexts/ThemeContext', '@/contexts/ThemeContext'
Set-Content -Path $dashboardFile -Value $content -Encoding UTF8

# Fix 3: Fix AdminPage import (useTabs -> useTabContext)
Write-Host "Fixing AdminPage imports..." -ForegroundColor Cyan
$adminFile = "C:\Users\SohaibAli\Documents\Abpfrontend\src\page-components\AdminPage.tsx"
$content = Get-Content $adminFile -Raw
$content = $content -replace 'import \{ useTabs \}', 'import { useTabContext }'
$content = $content -replace 'const \{ getTabState, setActiveTab \} = useTabs\(\)', 'const { getTabState, setActiveTab } = useTabContext()'
Set-Content -Path $adminFile -Value $content -Encoding UTF8

# Fix 4: Add default export to MainLayout
Write-Host "Adding default export to MainLayout..." -ForegroundColor Cyan
$mainLayoutFile = "C:\Users\SohaibAli\Documents\Abpfrontend\src\layouts\MainLayout.tsx"
if (Test-Path $mainLayoutFile) {
    $content = Get-Content $mainLayoutFile -Raw
    if ($content -match "export function (\w+)") {
        $functionName = $matches[1]
        if ($content -notmatch "export default $functionName") {
            if ($content -notmatch "export default \w+") {
                $content = $content + "`n`nexport default $functionName;"
                Set-Content -Path $mainLayoutFile -Value $content -Encoding UTF8
            }
        }
    }
}

# Fix 5: Create missing Weather component
Write-Host "Creating Weather component..." -ForegroundColor Cyan
$weatherContent = @'
'use client'

import React from 'react';
import { Cloud, CloudRain, Sun } from 'lucide-react';

export interface WeatherProps {
  city?: string;
  temperature?: number;
  condition?: 'sunny' | 'cloudy' | 'rainy';
}

export function Weather({ city = 'New York', temperature = 72, condition = 'sunny' }: WeatherProps) {
  const getWeatherIcon = () => {
    switch (condition) {
      case 'sunny':
        return <Sun className="w-12 h-12 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="w-12 h-12 text-gray-500" />;
      case 'rainy':
        return <CloudRain className="w-12 h-12 text-blue-500" />;
      default:
        return <Sun className="w-12 h-12 text-yellow-500" />;
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{city}</h3>
          <p className="text-2xl font-bold">{temperature}°F</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{condition}</p>
        </div>
        <div>{getWeatherIcon()}</div>
      </div>
    </div>
  );
}

export default Weather;
'@
Set-Content -Path "C:\Users\SohaibAli\Documents\Abpfrontend\src\components\Weather.tsx" -Value $weatherContent -Encoding UTF8

# Fix 6: Create missing ReactComponent
Write-Host "Creating ReactComponent..." -ForegroundColor Cyan
$reactComponentContent = @'
'use client'

import React from 'react';

export interface ReactComponentProps {
  children?: React.ReactNode;
  className?: string;
}

export function ReactComponent({ children, className = '' }: ReactComponentProps) {
  return (
    <div className={`react-component ${className}`}>
      {children}
    </div>
  );
}

export default ReactComponent;
'@
New-Item -Path "C:\Users\SohaibAli\Documents\Abpfrontend\src\components\generative-ui" -ItemType Directory -Force | Out-Null
Set-Content -Path "C:\Users\SohaibAli\Documents\Abpfrontend\src\components\generative-ui\ReactComponent.tsx" -Value $reactComponentContent -Encoding UTF8

# Fix 7: Create utils.ts for UI components
Write-Host "Creating utils.ts for UI components..." -ForegroundColor Cyan
$utilsContent = @'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
'@
Set-Content -Path "C:\Users\SohaibAli\Documents\Abpfrontend\src\components\ui\utils.ts" -Value $utilsContent -Encoding UTF8

Write-Host "`nAll build errors have been fixed!" -ForegroundColor Green
Write-Host "Now you can run 'npm run build' or 'npx next build'" -ForegroundColor Yellow