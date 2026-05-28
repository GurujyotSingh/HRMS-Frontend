import axios from 'axios';

// ─── FastAPI backend base URL ─────────────────────────────────────────────────
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

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
    // FastAPI returns data directly (no wrapper envelope)
    return { data: payload, _raw: res };
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   AUTH  — FastAPI prefix: /auth
══════════════════════════════════════════════════════════════════════════*/
export const authAPI = {
  login:           (email, password) =>
    api.post('/auth/login', { email, password }),
  refresh:         () => api.post('/auth/refresh'),
  logout:          () => api.post('/auth/logout'),
  me:              () => unwrap(api.get('/auth/me')),
  register:        (data) => api.post('/auth/register', data),
  forgotPassword:  (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:   (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword }),
  changePassword:  (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

/* ══════════════════════════════════════════════════════════════════════════
   EMPLOYEES  — FastAPI prefix: /employees
══════════════════════════════════════════════════════════════════════════*/
export const employeesAPI = {
  list:         (params)   => unwrap(api.get('/employees', { params })),
  get:          (id)       => unwrap(api.get(`/employees/${id}`)),
  create:       (data)     => unwrap(api.post('/employees', data)),
  update:       (id, data) => unwrap(api.patch(`/employees/${id}`, data)),
  me:           ()         => unwrap(api.get('/employees/me')),
  updateMe:     (data)     => unwrap(api.patch('/employees/me', data)),
  // Aliases
  myProfile:    ()         => employeesAPI.me(),
};

/* ══════════════════════════════════════════════════════════════════════════
   DEPARTMENTS  — FastAPI prefix: /departments
══════════════════════════════════════════════════════════════════════════*/
export const deptAPI = {
  list:   ()        => unwrap(api.get('/departments')),
  get:    (id)      => unwrap(api.get(`/departments/${id}`)),
  create: (data)    => unwrap(api.post('/departments', data)),
  update: (id, d)   => unwrap(api.patch(`/departments/${id}`, d)),
  delete: (id)      => api.delete(`/departments/${id}`),
};

/* ══════════════════════════════════════════════════════════════════════════
   LEAVE  — FastAPI prefix: /leaves
   Actual DB table: leave_requests
══════════════════════════════════════════════════════════════════════════*/
export const leavesAPI = {
  // Employee
  myLeaves:      ()            => unwrap(api.get('/leaves/my')),
  apply:         (data)        => unwrap(api.post('/leaves/apply', data)),
  cancel:        (id)          => unwrap(api.post(`/leaves/my/${id}/cancel`)),

  // HOD
  hodPending:    ()            => unwrap(api.get('/leaves/hod/pending')),
  hodApprove:    (id)          => unwrap(api.post(`/leaves/hod/${id}/approve`)),
  hodReject:     (id)          => unwrap(api.post(`/leaves/hod/${id}/reject`)),

  // HR
  hrAll:         ()            => unwrap(api.get('/leaves/hr/all')),
  hrQueue:       ()            => unwrap(api.get('/leaves/hr/queue')),
  hrProcess:     (id, action)  => unwrap(api.post(`/leaves/hr/${id}/process`, { action })),
  hrUpdate:      (id, data)    => unwrap(api.patch(`/leaves/hr/${id}`, data)),

  // Admin
  adminQueue:    ()            => unwrap(api.get('/leaves/admin/queue')),
  adminProcess:  (id, action)  => unwrap(api.post(`/leaves/admin/${id}/process`, { action })),

  // Legacy aliases (kept for backward compat)
  list:          (params)      => unwrap(api.get('/leaves/my', { params })),
  approve:       (id)          => leavesAPI.hodApprove(id),
  reject:        (id)          => leavesAPI.hodReject(id),
};

export const leaveBalanceAPI = {
  myBalance:       ()   => unwrap(api.get('/leave-balance/my')),
  employeeBalance: (id) => unwrap(api.get(`/leave-balance/employee/${id}`)),
};

/* ══════════════════════════════════════════════════════════════════════════
   ATTENDANCE  — FastAPI prefix: /attendance
   DB columns: check_in / check_out (not clock_in / clock_out)
══════════════════════════════════════════════════════════════════════════*/
export const attendanceAPI = {
  list:          (params)             => unwrap(api.get('/attendance', { params })),
  today:         ()                   => unwrap(api.get('/attendance/today')),
  clockIn:       ()                   => unwrap(api.post('/attendance/clock-in')),
  clockOut:      ()                   => unwrap(api.post('/attendance/clock-out')),
  calendar:      (empId, month, year) =>
    unwrap(api.get(`/attendance/calendar/${empId}`, { params: { month, year } })),
  summary:       (empId, month, year) =>
    unwrap(api.get(`/attendance/summary/${empId}`, { params: { month, year } })),
  correct:       (id, data)           => unwrap(api.patch(`/attendance/${id}`, data)),
  autoClockOut:  ()                   => unwrap(api.post('/attendance/auto-clock-out')),

  // Legacy aliases
  myRecords:     (month, year)        => attendanceAPI.list({ month, year }),
  mySummary:     (month, year)        => attendanceAPI.summary('me', month, year),
  hrToday:       ()                   => attendanceAPI.list({ date: new Date().toISOString().split('T')[0] }),
  hrEmployee:    (id, month, year)    => attendanceAPI.list({ employee_id: id, month, year }),
  hrUpdate:      (id, d)              => attendanceAPI.correct(id, d),
};

/* ══════════════════════════════════════════════════════════════════════════
   PAYROLL  — FastAPI prefix: /payroll
   DB columns: net_salary (not net_pay), published_at (not finalized_at)
══════════════════════════════════════════════════════════════════════════*/
export const payrollAPI = {
  list:             (params)    => unwrap(api.get('/payroll', { params })),
  get:              (id)        => unwrap(api.get(`/payroll/${id}`)),
  generate:         (data)      => unwrap(api.post('/payroll/generate', data)),
  publish:          (id)        => unwrap(api.patch(`/payroll/${id}/publish`)),
  myPayslips:       ()          => unwrap(api.get('/payroll/my')),
  salaryStructure:  (empId)     => unwrap(api.get(`/payroll/salary-structure/${empId}`)),
  setSalaryStructure: (empId, data) => unwrap(api.post(`/payroll/salary-structure/${empId}`, data)),
  summary:          (month, year) => unwrap(api.get('/payroll/summary', { params: { month, year } })),

  // Legacy aliases
  allPayslips:      (params)    => payrollAPI.list(params),
};

export const salaryStructureAPI = {
  get:     (empId)        => payrollAPI.salaryStructure(empId),
  set:     (empId, data)  => payrollAPI.setSalaryStructure(empId, data),
  summary: (month, year)  => payrollAPI.summary(month, year),
};

/* ══════════════════════════════════════════════════════════════════════════
   ONBOARDING  — FastAPI prefix: /onboarding
   DB table: onboarding_employees (not onboarding_records)
══════════════════════════════════════════════════════════════════════════*/
export const onboardAPI = {
  list:           (params)           => unwrap(api.get('/onboarding', { params })),
  get:            (id)               => unwrap(api.get(`/onboarding/${id}`)),
  getByEmployee:  (empId)            => unwrap(api.get(`/onboarding/employee/${empId}`)),
  create:         (data)             => unwrap(api.post('/onboarding', data)),
  addTask:        (id, data)         => unwrap(api.post(`/onboarding/${id}/tasks`, data)),
  updateTask:     (taskId, data)     => unwrap(api.patch(`/onboarding/tasks/${taskId}`, data)),
  deleteTask:     (taskId)           => api.delete(`/onboarding/tasks/${taskId}`),

  // Offboarding
  offAll:          ()                => unwrap(api.get('/onboarding/offboarding')),
  offInitiate:     (data)            => unwrap(api.post('/onboarding/offboarding', data)),
  offCompleteTask: (recordId, taskId) =>
    unwrap(api.patch(`/onboarding/offboarding/${recordId}/tasks/${taskId}`, { isCompleted: true })),

  // Legacy aliases
  myRecord:       ()                 => onboardAPI.getByEmployee('me'),
  allRecords:     ()                 => onboardAPI.list({}),
  completeTask:   (taskId)           => onboardAPI.updateTask(taskId, { is_completed: true }),
};

/* ══════════════════════════════════════════════════════════════════════════
   RECRUITMENT  — FastAPI prefix: /recruitment
══════════════════════════════════════════════════════════════════════════*/
export const recruitmentAPI = {
  listJobs:         (params)         => unwrap(api.get('/recruitment/jobs', { params })),
  getJob:           (id)             => unwrap(api.get(`/recruitment/jobs/${id}`)),
  createJob:        (data)           => unwrap(api.post('/recruitment/jobs', data)),
  updateJob:        (id, data)       => unwrap(api.patch(`/recruitment/jobs/${id}`, data)),
  deleteJob:        (id)             => api.delete(`/recruitment/jobs/${id}`),
  getApplicants:    (jobId, params)  =>
    unwrap(api.get(`/recruitment/jobs/${jobId}/applicants`, { params })),
  addApplicant:     (jobId, data)    =>
    unwrap(api.post(`/recruitment/jobs/${jobId}/applicants`, data)),
  updateApplicant:  (id, data)       => unwrap(api.patch(`/recruitment/applicants/${id}`, data)),
};

/* ══════════════════════════════════════════════════════════════════════════
   ANNOUNCEMENTS  — FastAPI prefix: /announcements
   DB columns: body (not content)
══════════════════════════════════════════════════════════════════════════*/
export const announcementsAPI = {
  list:     (params)  => unwrap(api.get('/announcements', { params })),
  create:   (data)    => unwrap(api.post('/announcements', data)),
  markRead: (id)      => api.patch(`/announcements/${id}/read`),
  delete:   (id)      => api.delete(`/announcements/${id}`),
};

/* ══════════════════════════════════════════════════════════════════════════
   NOTIFICATIONS  — FastAPI prefix: /notifications
══════════════════════════════════════════════════════════════════════════*/
export const notificationsAPI = {
  list:         (params)  => unwrap(api.get('/notifications', { params })),
  unreadCount:  ()        => unwrap(api.get('/notifications/unread-count')),
  markRead:     (id)      => api.patch(`/notifications/${id}/read`),
  markAllRead:  ()        => api.patch('/notifications/read-all'),
  delete:       (id)      => api.delete(`/notifications/${id}`),
};

/* ══════════════════════════════════════════════════════════════════════════
   HOLIDAYS  — FastAPI prefix: /holidays
   DB columns: name, date, type, is_optional
══════════════════════════════════════════════════════════════════════════*/
export const holidaysAPI = {
  list:   (year)    => unwrap(api.get('/holidays', { params: { year } })),
  create: (data)    => unwrap(api.post('/holidays', data)),
  update: (id, d)   => unwrap(api.patch(`/holidays/${id}`, d)),
  delete: (id)      => api.delete(`/holidays/${id}`),
};

/* ══════════════════════════════════════════════════════════════════════════
   SETTINGS  — FastAPI prefix: /settings
   DB table: system_settings
══════════════════════════════════════════════════════════════════════════*/
export const settingsAPI = {
  get:    ()        => unwrap(api.get('/settings')),
  update: (data)    => unwrap(api.patch('/settings', data)),
};

/* ══════════════════════════════════════════════════════════════════════════
   REPORTS  — FastAPI prefix: /reports
══════════════════════════════════════════════════════════════════════════*/
export const reportsAPI = {
  // Correct endpoint paths matching FastAPI router
  headcount:   (params) => unwrap(api.get('/reports/employees/by-dept-role', { params })),
  leaveStats:  (params) => unwrap(api.get('/reports/leaves/stats', { params })),
  attendance:  (month, year) =>
    unwrap(api.get('/reports/attendance/summary', { params: { month, year } })),
  attendanceWeekly: () => unwrap(api.get('/reports/attendance/weekly')),
  payroll:     (month, year) =>
    unwrap(api.get('/reports/payroll/cost', { params: { month, year } })),
  onboarding:  () => unwrap(api.get('/reports/onboarding/completion')),

  // Legacy aliases
  employeesByDeptRole: () => reportsAPI.headcount({}),
  leaveStatsAll:       () => reportsAPI.leaveStats({}),
  attendanceSummary:   (month, year) => reportsAPI.attendance(month, year),
  payrollCost:         (month, year) => reportsAPI.payroll(month, year),
};

/* ══════════════════════════════════════════════════════════════════════════
   AUDIT  — FastAPI prefix: /audit
══════════════════════════════════════════════════════════════════════════*/
export const auditAPI = {
  list: (params) => unwrap(api.get('/audit', { params })),
  logs: (params) => unwrap(api.get('/audit/logs', { params })),
};

/* ══════════════════════════════════════════════════════════════════════════
   DASHBOARD  — FastAPI prefix: /dashboard
══════════════════════════════════════════════════════════════════════════*/
export const dashboardAPI = {
  get:      ()  => unwrap(api.get('/dashboard')),
  employee: ()  => unwrap(api.get('/dashboard/employee')),
};

/* ══════════════════════════════════════════════════════════════════════════
   AI / CHAT  — FastAPI prefix: /ai
══════════════════════════════════════════════════════════════════════════*/
export const chatAPI = {
  send:           (message, conversationId) =>
    unwrap(api.post('/ai/chat', { message, conversationId })),
  conversations:  ()      => unwrap(api.get('/ai/conversations')),
  conversation:   (id)    => unwrap(api.get(`/ai/conversations/${id}`)),
  deleteSession:  (id)    => api.delete(`/ai/conversations/${id}`),
  sessions:       ()      => chatAPI.conversations(),
  session:        (id)    => chatAPI.conversation(id),
};

export const aiAPI = chatAPI;

export const aiAgentsAPI = {
  explainPayslip:  (data) =>
    unwrap(api.post('/ai/chat', { message: `Explain this payslip: ${JSON.stringify(data)}` })),
  recommendLeave:  (data) =>
    unwrap(api.post('/ai/chat', { message: `Recommend leave for: ${JSON.stringify(data)}` })),
  suggestGoals:    (data) =>
    unwrap(api.post('/ai/chat', { message: `Suggest performance goals for: ${JSON.stringify(data)}` })),
  summarizeReport: (data) =>
    unwrap(api.post('/ai/chat', { message: `Summarize this report: ${JSON.stringify(data)}` })),
};

/* ══════════════════════════════════════════════════════════════════════════
   PERFORMANCE / APPRAISAL  — FastAPI prefix: /performance
   DB columns: director_rating / director_comments (not hod_rating/hod_comments)
══════════════════════════════════════════════════════════════════════════*/
export const perfAPI = {
  // Cycles
  createCycle:      (data)      => unwrap(api.post('/performance/cycles', data)),
  closeCycle:       (id)        => unwrap(api.patch(`/performance/cycles/${id}/close`)),
  cycles:           ()          => unwrap(api.get('/performance/cycles')),
  activeCycle:      ()          => unwrap(api.get('/performance/cycles/active')),

  // Employee goals
  myGoals:          ()          => unwrap(api.get('/performance/goals/my')),
  submitGoals:      (data)      => unwrap(api.post('/performance/goals', data)),
  submitGoal:       (id)        => unwrap(api.patch(`/performance/goals/${id}/submit`)),
  selfRate:         (id, d)     => unwrap(api.patch(`/performance/goals/${id}/self-review`, d)),

  // Director (HOD) review
  directorPending:  ()          => unwrap(api.get('/performance/goals/director/pending')),
  directorReview:   (id, d)     => unwrap(api.patch(`/performance/goals/${id}/director-review`, d)),
  assignGoal:       (d)         => unwrap(api.post('/performance/goals/assign', d)),

  // HR finalize
  allGoals:         (params)    => unwrap(api.get('/performance/goals', { params })),
  hrFinalize:       (id, d)     => unwrap(api.patch(`/performance/goals/${id}/finalize`, d)),

  // Legacy aliases
  hodPending:       ()          => perfAPI.directorPending(),
  hodReview:        (id, d)     => perfAPI.directorReview(id, d),
};

export default api;
