$files = @(
    "aspect-ratio.tsx",
    "avatar.tsx",
    "checkbox.tsx",
    "collapsible.tsx",
    "context-menu.tsx",
    "dropdown-menu.tsx",
    "form.tsx",
    "hover-card.tsx",
    "label.tsx",
    "menubar.tsx",
    "navigation-menu.tsx",
    "popover.tsx",
    "progress.tsx",
    "radio-group.tsx",
    "scroll-area.tsx",
    "select.tsx",
    "separator.tsx",
    "slider.tsx",
    "switch.tsx",
    "toggle-group.tsx",
    "toggle.tsx",
    "tooltip.tsx"
)

$uiPath = "C:\Users\SohaibAli\Documents\Abpfrontend\src\components\ui"

foreach ($file in $files) {
    $filePath = Join-Path $uiPath $file
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        # Remove version numbers from @radix-ui imports
        $content = $content -replace '@radix-ui/([^@"]+)@[0-9.]+', '@radix-ui/$1'
        Set-Content -Path $filePath -Value $content -NoNewline
        Write-Host "Fixed imports in $file"
    }
}

Write-Host "All Radix UI imports have been fixed!"