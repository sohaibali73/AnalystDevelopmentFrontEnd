# PowerShell script to fix all page components

$pageDir = "C:\Users\SohaibAli\Documents\Abpfrontend\src\page-components"
$files = @(
    "RegisterPage.tsx",
    "Researcher.tsx",
    "ChatPage.tsx",
    "DashboardPage.tsx",
    "KnowledgeBasePage.tsx",
    "ReverseEngineerPage.tsx",
    "TrainingPage.tsx",
    "AFLGeneratorPage.tsx",
    "CompanyResearchPage.tsx",
    "ForgotPasswordPage.tsx",
    "PeerComparison.tsx",
    "SettingsPage.tsx",
    "StrategyAnalysis.tsx"
)

foreach ($file in $files) {
    $filePath = Join-Path $pageDir $file
    
    if (Test-Path $filePath) {
        Write-Host "Processing $file..." -ForegroundColor Green
        
        $content = Get-Content $filePath -Raw
        
        # Replace react-router-dom imports
        $content = $content -replace "import \{ useNavigate.*?\} from 'react-router-dom';", "import { useRouter } from 'next/navigation';"
        $content = $content -replace "import \{ Link.*?\} from 'react-router-dom';", "import Link from 'next/link';"
        $content = $content -replace "import \{ .*?Link.*? \} from 'react-router-dom';", "import Link from 'next/link';"
        $content = $content -replace "import .*? from 'react-router-dom';", "import { useRouter } from 'next/navigation';"
        
        # Replace useNavigate with useRouter
        $content = $content -replace "\bconst navigate = useNavigate\(\);", "const router = useRouter();"
        $content = $content -replace "\bnavigate\('", "router.push('"
        $content = $content -replace "\bnavigate\(``", "router.push(``"
        $content = $content -replace "\bnavigate\(", "router.push("
        
        # Replace Link to with Link href
        $content = $content -replace '\bto="', 'href="'
        $content = $content -replace "\bto='", "href='"
        $content = $content -replace "\bto=\{", "href={"
        
        # Add default export if missing
        $functionName = ""
        if ($content -match "export function (\w+)") {
            $functionName = $matches[1]
            if ($content -notmatch "export default $functionName") {
                if ($content -notmatch "export default \w+") {
                    $content = $content + "`n`nexport default $functionName;"
                }
            }
        }
        
        # Write back to file
        Set-Content -Path $filePath -Value $content -Encoding UTF8
        Write-Host "Fixed $file" -ForegroundColor Cyan
    }
}

Write-Host "`nAll page components have been processed!" -ForegroundColor Yellow