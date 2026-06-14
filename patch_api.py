import sys
file_path = r"d:\SKIPS_PROJECT\HRMS\Devlopment\university-hrm-frontend\src\services\api.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_content = """

/* ══════════════════════════════════════════════════════════════════════════
   PUBLIC CAREERS — FastAPI prefix: /public/careers
══════════════════════════════════════════════════════════════════════════*/
export const publicCareersAPI = {
  getJobs: () => unwrap(axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/public/careers/jobs`, { params: { _t: Date.now() } })),
  getJob: (id) => unwrap(axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/public/careers/jobs/${id}`, { params: { _t: Date.now() } })),
  apply: (id, formData) => unwrap(axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/public/careers/jobs/${id}/apply`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }))
};
"""

content = content.replace("export default api;", new_content + "\nexport default api;\n")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched successfully")
