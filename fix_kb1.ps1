$lines = Get-Content 'c:\Users\SohaibAli\Videos\Development\AnalystDevelopmentFrontend\write_kb1.ps1'  
$cutIdx = -1  
for ($i = 0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match 'The syntax') { $cutIdx = $i; break } }  
if ($cutIdx -gt 0) { $lines = $lines[0..($cutIdx-1)] }  
$lines += "'@"  
$lines += "Set-Content -Path 'c:\Users\SohaibAli\Videos\Development\AnalystDevelopmentFrontend\src\components\knowledge\KBFileViewerModal.tsx' -Value $content -Encoding UTF8"  
$lines += "Write-Host 'File written'"  
Set-Content -Path 'c:\Users\SohaibAli\Videos\Development\AnalystDevelopmentFrontend\write_kb1_fixed.ps1' -Value $lines -Encoding UTF8  
Write-Host 'Fixed script written'  
