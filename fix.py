
import sys
with open(r'd:\SKIPS_PROJECT\HRMS\Devlopment\university-hrm-frontend\src\pages\Recruitment.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = '''const variants = { 'OPEN': 'success', 'CLOSED': 'danger', 'PAUSED': 'warning' };'''
target2 = '''const normalizedStatus = j.status?.toUpperCase() || 'OPEN';'''

if target1 in content and target2 in content:
    content = content.replace(target2, '''let normalizedStatus = j.status?.toUpperCase() || 'OPEN';
        if (j.closing_date && new Date(j.closing_date).getTime() < new Date().setHours(0,0,0,0) && normalizedStatus === 'OPEN') {
          normalizedStatus = 'CLOSED';
        }''')
    with open(r'd:\SKIPS_PROJECT\HRMS\Devlopment\university-hrm-frontend\src\pages\Recruitment.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed')
else:
    print('Not found')

