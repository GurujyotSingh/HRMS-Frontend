
with open(r'd:\SKIPS_PROJECT\HRMS\Devlopment\university-hrm-frontend\src\services\api.js', 'a', encoding='utf-8') as f:
    f.write('''

/* --------------------------------------------------------------------------
   PUBLIC CAREERS — FastAPI prefix: /public/careers
--------------------------------------------------------------------------*/
export const publicCareersAPI = {
  getJobs: () => unwrap(axios.get(${process.env.REACT_APP_API_URL || \\'http://localhost:8000/api/v1\\'}/public/careers/jobs, { params: { _t: Date.now() } })),
  getJob: (id) => unwrap(axios.get(${process.env.REACT_APP_API_URL || \\'http://localhost:8000/api/v1\\'}/public/careers/jobs/, { params: { _t: Date.now() } })),
  apply: (id, formData) => unwrap(axios.post(${process.env.REACT_APP_API_URL || \\'http://localhost:8000/api/v1\\'}/public/careers/jobs//apply, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }))
};
''')

