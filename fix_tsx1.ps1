$path = 'c:\Users\SohaibAli\Videos\Development\AnalystDevelopmentFrontend\src\components\knowledge\KBFileViewerModal.tsx' 
$content = Get-Content -Raw $path 
$content = $content -replace "'\^\<'", "'<'" 
