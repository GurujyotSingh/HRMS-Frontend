import axios from 'axios';

// ─── FastAPI backend base URL ─────────────────────────────────────────────────
const BASE_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000/api/v1`;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token store (in-memory only — never localStorage) ───────────────────────
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

// ─── Request interceptor: attach Bearer token ─────────────────────────────────
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Response interceptor: silent token refresh on 401 ───────────────────────
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (
      err.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.access_token || data.data?.accessToken || data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearAccessToken();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

// ─── Helper: unwrap response data ────────────────────────────────────────────
function unwrap(promise) {
  return promise.then((res) => {
    const payload = res.data;
    return { data: payload, _raw: res };
  });
}

// ─── Helper: make cancellable request — Fixed for 1M+ rows scalability ───────
// Pass a { signal } option to any API call to support AbortController cancellation.
// Usage:
//   const controller = new AbortController();
//   api.get('/employees', { params, signal: controller.signal });
//   controller.abort(); // cancels the in-flight request

/* ══════════════════════════════════════════════════════════════════════════
   AUTH  — FastAPI prefix: /auth
══════════════════════════════════════════════════════════════════════════*/
export const authAPI = {
  login: (email, password, rememberMe = false) => api.post('/auth/login', { email, password, rememberMe }),
  logout: () => api.post('/auth/logout'),
  me: () => unwrap(api.get('/auth/me')),
  refresh: () => api.post('/auth/refresh'),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  changePassword: (data) => unwrap(api.put('/auth/change-password', data))
};

/* ══════════════════════════════════════════════════════════════════════════
   EMPLOYEES  — FastAPI prefix: /employees
   Fixed for 1M+ rows: all list() calls now support pagination params
══════════════════════════════════════════════════════════════════════════*/
export const employeesAPI = {
  // Fixed for 1M+ rows scalability — always pass { skip, limit } to paginate
  list: (params, signal) => unwrap(api.get('/employees', { params, signal })),
  get: (id) => unwrap(api.get(`/employees/${id}`)),
  create: (data) => unwrap(api.post('/employees', data)),
  update: (id, data) => unwrap(api.patch(`/employees/${id}`, data)),
  me: () => unwrap(api.get('/employees/me')),
  updateMe: (data) => unwrap(api.patch('/employees/me', data)),
  bulkAction: (data) => unwrap(api.post('/employees/bulk', data)),
  exportCsv: (params) => api.get('/employees/export/csv', { params, responseType: 'blob' }),
  // Fixed for 1M+ rows: async employee search for dropdowns — returns max 20 results
  search: (q, roleFilter, signal) => unwrap(api.get('/employees', { params: { search: q, limit: 20, skip: 0, role: roleFilter }, signal })),
  resetPassword: (id) => unwrap(api.post(`/employees/${id}/reset-password`)),
  // Aliases
  myProfile: () => employeesAPI.me(),
};

/* ══════════════════════════════════════════════════════════════════════════
   DASHBOARD  — FastAPI prefix: /dashboard
══════════════════════════════════════════════════════════════════════════*/
export const dashboardAPI = {
  admin: () => unwrap(api.get('/dashboard/')),
  employee: () => unwrap(api.get('/dashboard/employee')),
  director: () => unwrap(api.get('/dashboard/')),
};

/* ══════════════════════════════════════════════════════════════════════════
   DEPARTMENTS  — FastAPI prefix: /departments
══════════════════════════════════════════════════════════════════════════*/
export const deptAPI = {
  list: () => unwrap(api.get('/departments')),
  get: (id) => unwrap(api.get(`/departments/${id}`)),
  create: (data) => unwrap(api.post('/departments', data)),
  update: (id, d) => unwrap(api.patch(`/departments/${id}`, d)),
  delete: (id) => api.delete(`/departments/${id}`),
};

/* ══════════════════════════════════════════════════════════════════════════
   LEAVE  — FastAPI prefix: /leaves
   Actual DB table: leave_requests
   Fixed for 1M+ rows: all list calls support pagination
══════════════════════════════════════════════════════════════════════════*/
export const leavesAPI = {
  // Employee — Fixed: my leaves use pagination
  myLeaves: (params) => unwrap(api.get('/leaves/my', { params })),
  apply: (data) => unwrap(api.post('/leaves/apply', data)),
  cancel: (id) => unwrap(api.post(`/leaves/my/${id}/cancel`)),

  // HOD — paginated
  hodPending: (params) => unwrap(api.get('/leaves/hod/pending', { params })),
  hodApprove: (id) => unwrap(api.post(`/leaves/hod/${id}/approve`)),
  hodReject: (id) => unwrap(api.post(`/leaves/hod/${id}/reject`)),

  // HR — Fixed: always paginated, never fetch all at once
  hrAll: (params) => unwrap(api.get('/leaves/hr/all', { params })),
  hrQueue: (params) => unwrap(api.get('/leaves/hr/queue', { params })),
  hrProcess: (id, action) => unwrap(api.post(`/leaves/hr/${id}/process`, { action })),
  hrUpdate: (id, data) => unwrap(api.patch(`/leaves/hr/${id}`, data)),

  // Admin — paginated
  adminQueue: (params) => unwrap(api.get('/leaves/admin/queue', { params })),
  adminProcess: (id, action) => unwrap(api.post(`/leaves/admin/${id}/process`, { action })),

  // Legacy aliases — Fixed: added pagination support
  list: (params) => unwrap(api.get('/leaves/my', { params })),
  balance: () => unwrap(api.get('/leave-balance/my')),
  review: (id, data) => unwrap(api.post(`/leaves/hr/${id}/process`, data)),
  approve: (id) => leavesAPI.hodApprove(id),
  reject: (id) => leavesAPI.hodReject(id),
  aiGenerate: (data) => unwrap(api.post('/leaves/ai-generate', data)),
};

export const leaveBalanceAPI = {
  myBalance: () => unwrap(api.get('/leave-balance/my')),
  employeeBalance: (id) => unwrap(api.get(`/leave-balance/employee/${id}`)),
};

/* ══════════════════════════════════════════════════════════════════════════
   ATTENDANCE  — FastAPI prefix: /attendance
   DB columns: check_in / check_out (not clock_in / clock_out)
   Fixed for 1M+ rows: all list calls now paginated
══════════════════════════════════════════════════════════════════════════*/
export const attendanceAPI = {
  // Fixed: always paginated — pass { page, limit, month, year } etc.
  list: (params, signal) => unwrap(api.get('/attendance/', { params, signal })),
  today: () => unwrap(api.get('/attendance/today')),
  clockIn: () => unwrap(api.post('/attendance/clock-in')),
  clockOut: () => unwrap(api.post('/attendance/clock-out')),
  calendar: (empId, month, year) =>
    unwrap(api.get(`/attendance/calendar/${empId}`, { params: { month, year } })),
  summary: (empId, month, year) =>
    unwrap(api.get(`/attendance/summary/${empId}`, { params: { month, year } })),
  correct: (id, data) => unwrap(api.patch(`/attendance/hr/${id}`, data)),
  autoClockOut: () => unwrap(api.post('/attendance/auto-clock-out')),

  // Fixed: HR view is now always paginated — pass { page, limit, date } etc.
  myRecords: (month, year, params) => attendanceAPI.list({ month, year, ...params }),
  mySummary: (month, year) => attendanceAPI.summary('me', month, year),
  // Fixed: hrToday now requires pagination — use list with date filter
  hrToday: (params) => attendanceAPI.list({
    date: new Date().toISOString().split('T')[0],
    limit: 50,
    skip: 0,
    ...params,
  }),
  hrEmployee: (id, month, year) => attendanceAPI.list({ employee_id: id, month, year }),
  hrUpdate: (id, d) => attendanceAPI.correct(id, d),
};

/* ══════════════════════════════════════════════════════════════════════════
   PAYROLL (Manual / Encrypted) — FastAPI prefix: /payroll
══════════════════════════════════════════════════════════════════════════*/
export const payrollAPI = {
  list: (params, signal) => unwrap(api.get('/payroll', { params, signal })),
  listEmployee: (empId, params, signal) => unwrap(api.get(`/payroll/employee/${empId}`, { params, signal })),
  get: (id) => unwrap(api.get(`/payroll/${id}`)),
  create: (data) => unwrap(api.post('/payroll', data)),
  update: (id, data) => unwrap(api.put(`/payroll/${id}`, data)),
  submit: (id, data) => unwrap(api.post(`/payroll/${id}/submit`, data)),
  approve: (id, data) => unwrap(api.post(`/payroll/${id}/approve`, data)),
  reject: (id, data) => unwrap(api.post(`/payroll/${id}/reject`, data)),
  markPaid: (id, data) => unwrap(api.post(`/payroll/${id}/mark-paid`, data)),
  generatePayslip: (id) => unwrap(api.post(`/payroll/${id}/generate-payslip`)),
  downloadPayslip: (id) => unwrap(api.get(`/payroll/${id}/download-payslip`)),
};

/* ══════════════════════════════════════════════════════════════════════════
   ONBOARDING  — FastAPI prefix: /onboarding
   DB table: onboarding_employees (not onboarding_records)
══════════════════════════════════════════════════════════════════════════*/
export const onboardAPI = {
  list: (params) => unwrap(api.get('/onboarding/hr/all', { params })),
  get: (id) => unwrap(api.get(`/onboarding/hr/employee/${id}`)),
  getByEmployee: (empId) => {
    if (empId === 'me') return unwrap(api.get('/onboarding/my'));
    return unwrap(api.get(`/onboarding/hr/employee/${empId}`));
  },
  create: (data) => unwrap(api.post(`/onboarding/hr/employee/${data.employee_id}`, data)),
  addTask: (empId, data) => unwrap(api.post(`/onboarding/hr/employee/${empId}/tasks`, data)),
  completeTask: (taskId) => unwrap(api.post(`/onboarding/my/tasks/${taskId}/complete`)),
  hrCompleteTask: (taskId) => unwrap(api.post(`/onboarding/hr/tasks/${taskId}/complete`)),
  deleteTask: (taskId) => api.delete(`/onboarding/tasks/${taskId}`), // Not used in UI but kept for completeness

  // Offboarding
  offAll: () => unwrap(api.get('/onboarding/offboarding/all')),
  getOffboardingTemplate: (empId) => unwrap(api.get(`/onboarding/offboarding/templates/${empId}`)),
  offInitiate: (data) => unwrap(api.post('/onboarding/offboarding/initiate', data)),
  offCompleteTask: (recordId, taskId) =>
    unwrap(api.post(`/onboarding/offboarding/${recordId}/tasks/${taskId}/complete`)),
  analyzeOffboarding: (recordId) => unwrap(api.post(`/onboarding/offboarding/${recordId}/analyze`)),

  // Legacy aliases
  myRecord: () => onboardAPI.getByEmployee('me'),
  allRecords: () => onboardAPI.list({}),
  completeTask: (taskId) => onboardAPI.updateTask(taskId, { is_completed: true }),
};

/* ══════════════════════════════════════════════════════════════════════════
   RECRUITMENT  — FastAPI prefix: /recruitment
   Fixed for 1M+ rows: paginated job listing and applicants
══════════════════════════════════════════════════════════════════════════*/
export const recruitmentAPI = {
  // Fixed: paginated — pass { page, limit, status } etc.
  listJobs: (params, signal) => unwrap(api.get('/recruitment/jobs', { params, signal })),
  getJob: (id) => unwrap(api.get(`/recruitment/jobs/${id}`)),
  createJob: (data) => unwrap(api.post('/recruitment/jobs', data)),
  updateJob: (id, data) => unwrap(api.patch(`/recruitment/jobs/${id}`, data)),
  deleteJob: (id) => api.delete(`/recruitment/jobs/${id}`),
  // Fixed: applicants are paginated per job
  getApplicants: (jobId, params) =>
    unwrap(api.get(`/recruitment/jobs/${jobId}/applicants`, { params })),
  addApplicant: (jobId, data) =>
    unwrap(api.post(`/recruitment/jobs/${jobId}/applicants`, data)),
  updateApplicant: (id, data) => unwrap(api.patch(`/recruitment/applicants/${id}`, data)),
  generateAiDescription: (data) => unwrap(api.post('/recruitment/jobs/generate-ai', data)),
};

/* ══════════════════════════════════════════════════════════════════════════
   ANNOUNCEMENTS  — FastAPI prefix: /announcements
   DB columns: body (not content)
══════════════════════════════════════════════════════════════════════════*/
export const announcementsAPI = {
  list: (params) => unwrap(api.get('/announcements', { params })),
  create: (data) => unwrap(api.post('/announcements', data)),
  markRead: (id) => api.patch(`/announcements/${id}/read`),
  delete: (id) => api.delete(`/announcements/${id}`),
};

/* ══════════════════════════════════════════════════════════════════════════
   NOTIFICATIONS  — FastAPI prefix: /notifications
══════════════════════════════════════════════════════════════════════════*/
export const notificationsAPI = {
  list: (params) => unwrap(api.get('/notifications', { params })),
  unreadCount: () => unwrap(api.get('/notifications/unread-count')),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

/* ══════════════════════════════════════════════════════════════════════════
   HOLIDAYS  — FastAPI prefix: /holidays
   DB columns: name, date, type, is_optional
══════════════════════════════════════════════════════════════════════════*/
export const holidaysAPI = {
  list: (year) => unwrap(api.get('/holidays', { params: { year } })),
  create: (data) => unwrap(api.post('/holidays', data)),
  update: (id, d) => unwrap(api.patch(`/holidays/${id}`, d)),
  delete: (id) => api.delete(`/holidays/${id}`),
};

/* ══════════════════════════════════════════════════════════════════════════
   SETTINGS  — FastAPI prefix: /settings
   DB table: system_settings
══════════════════════════════════════════════════════════════════════════*/
export const settingsAPI = {
  get: () => unwrap(api.get('/settings')),
  update: (data) => unwrap(api.patch('/settings', data)),
};

/* ══════════════════════════════════════════════════════════════════════════
   REPORTS  — FastAPI prefix: /reports
══════════════════════════════════════════════════════════════════════════*/
export const reportsAPI = {
  headcount: (params) => unwrap(api.get('/reports/employees/by-dept-role', { params })),
  leaveStats: (params) => unwrap(api.get('/reports/leaves/stats', { params })),
  attendance: (month, year) =>
    unwrap(api.get('/reports/attendance/summary', { params: { month, year } })),
  attendanceWeekly: () => unwrap(api.get('/reports/attendance/weekly')),
  payroll: (month, year) =>
    unwrap(api.get('/reports/payroll/cost', { params: { month, year } })),
  onboarding: () => unwrap(api.get('/reports/onboarding/completion')),

  // Legacy aliases
  employeesByDeptRole: () => reportsAPI.headcount({}),
  leaveStatsAll: () => reportsAPI.leaveStats({}),
  attendanceSummary: (month, year) => reportsAPI.attendance(month, year),
  payrollCost: (month, year) => reportsAPI.payroll(month, year),
};

/* ══════════════════════════════════════════════════════════════════════════
   AUDIT  — FastAPI prefix: /audit
══════════════════════════════════════════════════════════════════════════*/
export const auditAPI = {
  list: (params) => unwrap(api.get('/audit', { params })),
  logs: (params) => unwrap(api.get('/audit/logs', { params })),
  analytics: () => unwrap(api.get('/audit/analytics')),
};


/* ══════════════════════════════════════════════════════════════════════════
   AI / CHAT  — FastAPI prefix: /ai
══════════════════════════════════════════════════════════════════════════*/
export const chatAPI = {
  send: (message, conversationId) =>
    unwrap(api.post('/ai/chat', { message, conversationId })),
  conversations: () => unwrap(api.get('/ai/conversations')),
  conversation: (id) => unwrap(api.get(`/ai/conversations/${id}`)),
  deleteSession: (id) => api.delete(`/ai/conversations/${id}`),
  sessions: () => chatAPI.conversations(),
  session: (id) => chatAPI.conversation(id),
  // Fixed for 1M+ rows: AI explain takes ID only — backend fetches data
  explainPayslip: (payslipId) =>
    unwrap(api.post('/ai/chat', { message: `Explain payslip ID: ${payslipId}` })),
  chat: (message, conversationId) => chatAPI.send(message, conversationId),
};

export const aiAPI = chatAPI;

export const aiAgentsAPI = {
  // Fixed for 1M+ rows: send only IDs/minimal data, not entire objects
  explainPayslip: (payslipId) => chatAPI.explainPayslip(payslipId),
  recommendLeave: (data) =>
    unwrap(api.post('/ai/recommend-leave', data)),
  suggestGoals: (data) =>
    unwrap(api.post('/ai/suggest-goals', data)),
  summarizeReport: (data) =>
    unwrap(api.post('/ai/summarize-report', data)),
};

/* ══════════════════════════════════════════════════════════════════════════
   PERFORMANCE / APPRAISAL  — FastAPI prefix: /performance
   DB columns: director_rating / director_comments (not hod_rating/hod_comments)
══════════════════════════════════════════════════════════════════════════*/
export const perfAPI = {
  // Cycles
  createCycle: (data) => unwrap(api.post('/performance/cycles', data)),
  closeCycle: (id) => unwrap(api.patch(`/performance/cycles/${id}/close`)),
  cycles: () => unwrap(api.get('/performance/cycles')),
  activeCycle: () => unwrap(api.get('/performance/cycles/active')),

  // Employee goals — Fixed: paginated
  myGoals: (params) => unwrap(api.get('/performance/goals/my', { params })),
  submitGoals: (data) => unwrap(api.post('/performance/goals', data)),
  submitGoal: (id) => unwrap(api.patch(`/performance/goals/${id}/submit`)),
  selfRate: (id, d) => unwrap(api.patch(`/performance/goals/${id}/self-review`, d)),

  // Director (HOD) review
  directorPending: (params) => unwrap(api.get('/performance/goals/director/pending', { params })),
  directorReview: (id, d) => unwrap(api.patch(`/performance/goals/${id}/director-review`, d)),
  assignGoal: (d) => unwrap(api.post('/performance/goals/assign', d)),

  // HR finalize — Fixed: paginated
  allGoals: (params) => unwrap(api.get('/performance/goals', { params })),
  hrFinalize: (id, d) => unwrap(api.patch(`/performance/goals/${id}/finalize`, d)),

  // Legacy aliases
  hodPending: () => perfAPI.directorPending(),
  hodReview: (id, d) => perfAPI.directorReview(id, d),
};



/* ══════════════════════════════════════════════════════════════════════════
   PUBLIC CAREERS — FastAPI prefix: /public/careers
══════════════════════════════════════════════════════════════════════════*/
export const publicCareersAPI = {
  getJobs: async () => (await unwrap(axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/public/careers/jobs`, { params: { _t: Date.now() } }))).data,
  getJob: async (id) => (await unwrap(axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/public/careers/jobs/${id}`, { params: { _t: Date.now() } }))).data,
  apply: async (id, formData) => (await unwrap(axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/public/careers/jobs/${id}/apply`, formData))).data
};

export default api;

