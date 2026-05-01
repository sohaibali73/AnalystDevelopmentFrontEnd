import base64  
import os  
  
# Read base64 data from file  
b64_data = open(r'c:\Users\SohaibAli\Videos\Development\AnalystDevelopmentFrontend\file1_b64.txt').read().strip()  
content = base64.b64decode(b64_data).decode('utf-8')  
out_path = r'c:\Users\SohaibAli\Videos\Development\AnalystDevelopmentFrontend\src\components\knowledge\KBFileViewerModal.tsx'  
open(out_path, 'w', encoding='utf-8').write(content)  
print('File 1 written, size:', os.path.getsize(out_path))  
