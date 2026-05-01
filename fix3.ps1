$inPath = 'c:\Users\SohaibAli\Videos\Development\AnalystDevelopmentFrontend\src\components\knowledge\KBFileViewerModal.tsx'  
$content = [System.IO.File]::ReadAllText($inPath)  
$caretLt = [char]94 + [char]60  
$caretGt = [char]94 + [char]62  
$caretPipe = [char]94 + [char]124  
$caretAmp = [char]94 + [char]38  
$lt = [char]60  
$gt = [char]62  
$pipe = [char]124  
$amp = [char]38  
$pct = [char]37  
$fixed = $content.Replace($caretLt, $lt).Replace($caretGt, $gt).Replace($caretPipe, $pipe).Replace($caretAmp, $amp).Replace('100%%', '100' + $pct)  
[System.IO.File]::WriteAllText($inPath, $fixed)  
Write-Host 'Done'  
