$fixes = @(
    @{Path="C:\Users\SohaibAli\Documents\Abpfrontend\src\components\ui\carousel.tsx"; From='embla-carousel-react@8.6.0'; To='embla-carousel-react'},
    @{Path="C:\Users\SohaibAli\Documents\Abpfrontend\src\components\ui\chart.tsx"; From='recharts@2.15.2'; To='recharts'},
    @{Path="C:\Users\SohaibAli\Documents\Abpfrontend\src\components\ui\command.tsx"; From='cmdk@1.1.1'; To='cmdk'},
    @{Path="C:\Users\SohaibAli\Documents\Abpfrontend\src\components\ui\drawer.tsx"; From='vaul@1.1.2'; To='vaul'},
    @{Path="C:\Users\SohaibAli\Documents\Abpfrontend\src\components\ui\form.tsx"; From='react-hook-form@7.55.0'; To='react-hook-form'},
    @{Path="C:\Users\SohaibAli\Documents\Abpfrontend\src\components\ui\input-otp.tsx"; From='input-otp@1.4.2'; To='input-otp'},
    @{Path="C:\Users\SohaibAli\Documents\Abpfrontend\src\components\ui\resizable.tsx"; From='react-resizable-panels@2.1.7'; To='react-resizable-panels'},
    @{Path="C:\Users\SohaibAli\Documents\Abpfrontend\src\components\ui\sonner.tsx"; From='next-themes@0.4.6'; To='next-themes'},
    @{Path="C:\Users\SohaibAli\Documents\Abpfrontend\src\components\ui\sonner.tsx"; From='sonner@2.0.3'; To='sonner'}
)

foreach ($fix in $fixes) {
    if (Test-Path $fix.Path) {
        $content = Get-Content $fix.Path -Raw
        $content = $content -replace [regex]::Escape($fix.From), $fix.To
        Set-Content -Path $fix.Path -Value $content -NoNewline
        Write-Host "Fixed import in $($fix.Path.Split('\')[-1]): $($fix.From) -> $($fix.To)"
    }
}

Write-Host "`nAll imports with version numbers have been fixed!"