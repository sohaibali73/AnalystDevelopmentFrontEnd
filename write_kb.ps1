$content = @'  
'use client';  
test line  
'@  
Set-Content -Path 'test_out.txt' -Value $content  
