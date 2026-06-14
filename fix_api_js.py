
import sys
with open(r'd:\SKIPS_PROJECT\HRMS\Devlopment\university-hrm-frontend\src\services\api.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = 'export const publicCareersAPI = {\\n  getJobs: () => unwrap(axios.get(${process.env.REACT_APP_API_URL || \\'http://localhost:8000/api/v1\\'}/public/careers/jobs)),'
replacement = 'export const publicCareersAPI = {\\n  getJobs: () => unwrap(axios.get(${process.env.REACT_APP_API_URL || \\'http://localhost:8000/api/v1\\'}/public/careers/jobs?_t=)),'

if 'export const publicCareersAPI =' in content:
    content = content.replace(target, replacement)
    with open(r'd:\SKIPS_PROJECT\HRMS\Devlopment\university-hrm-frontend\src\services\api.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed')
else:
    print('Not found')

