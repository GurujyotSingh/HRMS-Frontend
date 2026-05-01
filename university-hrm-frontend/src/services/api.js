import axios from 'axios';

// ─── NestJS backend base URL ──────────────────────────────────────────────
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send httpOnly refresh cookie
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token store (in-memory only — never localStorage) ───────────────────
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

// ─── Request interceptor: attach Bearer token ────────────────────────────
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Response interceptor: silent token refresh on 401 ───────────────────
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
        setAccessToken(data.data?.accessToken || data.accessToken);
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
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

// ─── Helper: unwrap NestJS { success, data } envelope ─────────────────────
function unwrap(promise) {
  return promise.then((res) => {
    // NestJS backend wraps responses as { success: true, data: ... }
    const payload = res.data;
    return { data: payload?.data !== undefined ? payload.data : payload, _raw: res };
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════════════════════════*/
export const authAPI = {
  login: (email, password, rememberMe = false) =>
    api.post('/auth/login', { email, password, rememberMe }),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  me: () => unwrap(api.get('/auth/me')),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword }),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  sessions: () => unwrap(api.get('/auth/sessions')),
  revokeSession: (id) => api.delete(`/auth/sessions/${id}`),
};

/* ══════════════════════════════════════════════════════════════════════════
   USERS / EMPLOYEES
═══════════════════════════════════════════════════════════════════════════*/
export const employeesAPI = {
  list:           (params)    => unwrap(api.get('/users', { params })),
  get:            (id)        => unwrap(api.get(`/users/${id}`)),
  create:         (data)      => unwrap(api.post('/users', data)),
  update:         (id, data)  => unwrap(api.patch(`/users/${id}`, data)),
  changeRole:     (id, role)  => unwrap(api.patch(`/users/${id}/role`, { role })),
  changeStatus:   (id, status, reason) => unwrap(api.patch(`/users/${id}/status`, { status, reason })),
  stats:          (id)        => unwrap(api.get(`/users/${id}/stats`)),
  generateId:     ()          => unwrap(api.get('/users/generate-employee-id')),
  // Aliases kept for backward compat with existing pages
  me:             ()          => authAPI.me(),
  updateMe:       (d)         => employeesAPI.update('me', d),
};

/* ══════════════════════════════════════════════════════════════════════════
   DEPARTMENTS
═══════════════════════════════════════════════════════════════════════════*/
export const deptAPI = {
  list:   ()        => unwrap(api.get('/departments')),
  get:    (id)      => unwrap(api.get(`/departments/${id}`)),
  create: (data)    => unwrap(api.post('/departments', data)),
  update: (id, d)   => unwrap(api.patch(`/departments/${id}`, d)),
  delete: (id)      => api.delete(`/departments/${id}`),
};

/* ══════════════════════════════════════════════════════════════════════════
   LEAVE
═══════════════════════════════════════════════════════════════════════════*/
export const leavesAPI = {
  list:         (params)      => unwrap(api.get('/leave', { params })),
  apply:        (data)        => unwrap(api.post('/leave', data)),
  approve:      (id, remarks) => unwrap(api.patch(`/leave/${id}/approve`, { remarks })),
  reject:       (id, remarks) => unwrap(api.patch(`/leave/${id}/reject`, { remarks })),
  cancel:       (id)          => unwrap(api.patch(`/leave/${id}/cancel`)),
  balance:      (empId, year) => unwrap(api.get(year ? `/leave/balance/${empId}/${year}` : `/leave/balance/${empId}`)),
  // Legacy aliases used in existing pages
  myLeaves:     ()            => leavesAPI.list({ page: 1, limit: 100 }),
  hodPending:   ()            => leavesAPI.list({ status: 'PENDING' }),
  hodApprove:   (id)          => leavesAPI.approve(id),
  hodReject:    (id)          => leavesAPI.reject(id),
  hrAll:        ()            => leavesAPI.list({}),
  hrQueue:      ()            => leavesAPI.list({ status: 'PENDING' }),
  adminQueue:   ()            => leavesAPI.list({ status: 'PENDING' }),
};

export const leaveBalanceAPI = {
  myBalance:      ()        => leavesAPI.balance('me'),
  employeeBalance:(id)      => leavesAPI.balance(id),
};

/* ══════════════════════════════════════════════════════════════════════════
   ATTENDANCE
═══════════════════════════════════════════════════════════════════════════*/
export const attendanceAPI = {
  list:       (params)                  => unwrap(api.get('/attendance', { params })),
  calendar:   (empId, month, year)      => unwrap(api.get(`/attendance/calendar/${empId}`, { params: { month, year } })),
  summary:    (empId, month, year)      => unwrap(api.get(`/attendance/summary/${empId}`, { params: { month, year } })),
  bulkUpsert: (date, records)           => unwrap(api.post('/attendance', { date, records })),
  correct:    (id, data)                => unwrap(api.patch(`/attendance/${id}`, data)),
  
  // Real endpoints for Clock functionality
  today:      ()                        => unwrap(api.get('/attendance/today')),
  clockIn:    ()                        => unwrap(api.post('/attendance/clock-in')),
  clockOut:   ()                        => unwrap(api.post('/attendance/clock-out')),
  hrToday:    ()                        => attendanceAPI.list({ date: new Date().toISOString().split('T')[0] }),
  autoClockOut:()                       => unwrap(api.post('/attendance/auto-clock-out')),

  // Legacy aliases
  myRecords:  (month, year)             => attendanceAPI.list({ month, year, page: 1, limit: 50 }),
  mySummary:  (month, year)             => attendanceAPI.summary('me', month, year),
  hrEmployee: (id, month, year)         => attendanceAPI.list({ employeeId: id, month, year }),
  hrUpdate:   (id, d)                   => attendanceAPI.correct(id, d),
};

/* ══════════════════════════════════════════════════════════════════════════
   PAYROLL
═══════════════════════════════════════════════════════════════════════════*/
export const payrollAPI = {
  list:        (params)   => unwrap(api.get('/payroll', { params })),
  get:         (id)       => unwrap(api.get(`/payroll/${id}`)),
  generate:    (data)     => unwrap(api.post('/payroll/generate', data)),
  publish:     (id)       => unwrap(api.patch(`/payroll/${id}/publish`)),
  // Legacy aliases
  myPayslips:  ()         => payrollAPI.list({ page: 1, limit: 50 }),
  allPayslips: (params)   => payrollAPI.list(params),
};

/* ══════════════════════════════════════════════════════════════════════════
   ONBOARDING
═══════════════════════════════════════════════════════════════════════════*/
export const onboardAPI = {
  list:           (params)              => unwrap(api.get('/onboarding', { params })),
  get:            (id)                  => unwrap(api.get(`/onboarding/${id}`)),
  getByEmployee:  (empId)               => unwrap(api.get(`/onboarding/employee/${empId}`)),
  create:         (data)                => unwrap(api.post('/onboarding', data)),
  addTask:        (id, data)            => unwrap(api.post(`/onboarding/${id}/tasks`, data)),
  updateTask:     (taskId, data)        => unwrap(api.patch(`/onboarding/tasks/${taskId}`, data)),
  reorderTasks:   (taskIds)             => unwrap(api.patch('/onboarding/tasks/reorder', { taskIds })),
  deleteTask:     (taskId)              => api.delete(`/onboarding/tasks/${taskId}`),
  
  // Legacy aliases
  myRecord:       ()                    => onboardAPI.getByEmployee('me'),
  allRecords:     ()                    => onboardAPI.list({}),
  completeTask:   (taskId)              => onboardAPI.updateTask(taskId, { isCompleted: true }),

  // Offboarding endpoints
  offAll:         ()                    => unwrap(api.get('/onboarding/offboarding')),
  offInitiate:    (data)                => unwrap(api.post('/onboarding/offboarding', data)),
  offCompleteTask:(recordId, taskId)    => unwrap(api.patch(`/onboarding/offboarding/${recordId}/tasks/${taskId}`, { isCompleted: true })),
};

/* ══════════════════════════════════════════════════════════════════════════
   RECRUITMENT
═══════════════════════════════════════════════════════════════════════════*/
export const recruitmentAPI = {
  listJobs:       (params)              => unwrap(api.get('/recruitment/jobs', { params })),
  getJob:         (id)                  => unwrap(api.get(`/recruitment/jobs/${id}`)),
  createJob:      (data)                => unwrap(api.post('/recruitment/jobs', data)),
  updateJob:      (id, data)            => unwrap(api.patch(`/recruitment/jobs/${id}`, data)),
  deleteJob:      (id)                  => api.delete(`/recruitment/jobs/${id}`),
  getApplicants:  (jobId, params)       => unwrap(api.get(`/recruitment/jobs/${jobId}/applicants`, { params })),
  addApplicant:   (jobId, data)         => unwrap(api.post(`/recruitment/jobs/${jobId}/applicants`, data)),
  updateApplicant:(id, data)            => unwrap(api.patch(`/recruitment/applicants/${id}`, data)),
  convertToEmp:   (id)                  => unwrap(api.post(`/recruitment/applicants/${id}/convert`)),
};

/* ══════════════════════════════════════════════════════════════════════════
   ANNOUNCEMENTS
═══════════════════════════════════════════════════════════════════════════*/
export const announcementsAPI = {
  list:     (params)  => unwrap(api.get('/announcements', { params })),
  create:   (data)    => unwrap(api.post('/announcements', data)),
  markRead: (id)      => api.patch(`/announcements/${id}/read`),
  delete:   (id)      => api.delete(`/announcements/${id}`),
};

/* ══════════════════════════════════════════════════════════════════════════
   NOTIFICATIONS
═══════════════════════════════════════════════════════════════════════════*/
export const notificationsAPI = {
  list:         (params)  => unwrap(api.get('/notifications', { params })),
  unreadCount:  ()        => unwrap(api.get('/notifications/unread-count')),
  markRead:     (id)      => api.patch(`/notifications/${id}/read`),
  markAllRead:  ()        => api.patch('/notifications/read-all'),
  delete:       (id)      => api.delete(`/notifications/${id}`),
};

/* ══════════════════════════════════════════════════════════════════════════
   HOLIDAYS
═══════════════════════════════════════════════════════════════════════════*/
export const holidaysAPI = {
  list:   (year)    => unwrap(api.get('/holidays', { params: { year } })),
  create: (data)    => unwrap(api.post('/holidays', data)),
  update: (id, d)   => unwrap(api.patch(`/holidays/${id}`, d)),
  delete: (id)      => api.delete(`/holidays/${id}`),
};

/* ══════════════════════════════════════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════════════════════════════════════*/
export const settingsAPI = {
  get:    ()        => unwrap(api.get('/settings')),
  update: (data)    => unwrap(api.patch('/settings', data)),
};

/* ══════════════════════════════════════════════════════════════════════════
   REPORTS
═══════════════════════════════════════════════════════════════════════════*/
export const reportsAPI = {
  attendance:  (params) => unwrap(api.get('/reports/attendance', { params })),
  leave:       (params) => unwrap(api.get('/reports/leave', { params })),
  headcount:   (params) => unwrap(api.get('/reports/headcount', { params })),
  payroll:     (params) => unwrap(api.get('/reports/payroll', { params })),
  // Legacy aliases
  employeesByDeptRole: () => reportsAPI.headcount({}),
  leaveStats:          () => reportsAPI.leave({}),
  attendanceSummary:   (month, year) => reportsAPI.attendance({ month, year }),
  payrollCost:         (month, year) => reportsAPI.payroll({ month, year }),
};

/* ══════════════════════════════════════════════════════════════════════════
   AUDIT
═══════════════════════════════════════════════════════════════════════════*/
export const auditAPI = {
  list: (params) => unwrap(api.get('/audit', { params })),
};

/* ══════════════════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════════════════*/
export const dashboardAPI = {
  get:      ()  => unwrap(api.get('/dashboard')),
  admin:    ()  => unwrap(api.get('/dashboard/admin')),
  director: ()  => unwrap(api.get('/dashboard/director')),
  employee: ()  => unwrap(api.get('/dashboard/employee')),
};

/* ══════════════════════════════════════════════════════════════════════════
   SEARCH
═══════════════════════════════════════════════════════════════════════════*/
export const searchAPI = {
  global: (q) => unwrap(api.get('/search', { params: { q } })),
};

/* ══════════════════════════════════════════════════════════════════════════
   AI / CHAT
═══════════════════════════════════════════════════════════════════════════*/
export const chatAPI = {
  send:           (message, conversationId) =>
    unwrap(api.post('/ai/chat', { message, conversationId })),
  conversations:  ()      => unwrap(api.get('/ai/conversations')),
  conversation:   (id)    => unwrap(api.get(`/ai/conversations/${id}`)),
  deleteSession:  (id)    => api.delete(`/ai/conversations/${id}`),
  // Legacy aliases
  sessions:       ()      => chatAPI.conversations(),
  session:        (id)    => chatAPI.conversation(id),
};

export const aiAPI = chatAPI;

// Legacy alias — kept for backward compat
export const aiAgentsAPI = {
  explainPayslip:  (data) => unwrap(api.post('/ai/chat', { message: `Explain this payslip: ${JSON.stringify(data)}` })),
  recommendLeave:  (data) => unwrap(api.post('/ai/chat', { message: `Recommend leave for: ${JSON.stringify(data)}` })),
  suggestGoals:    (data) => unwrap(api.post('/ai/chat', { message: `Suggest performance goals for: ${JSON.stringify(data)}` })),
  summarizeReport: (data) => unwrap(api.post('/ai/chat', { message: `Summarize this report: ${JSON.stringify(data)}` })),
};

/* ══════════════════════════════════════════════════════════════════════════
   PERFORMANCE / APPRAISAL
═══════════════════════════════════════════════════════════════════════════*/
export const perfAPI = {
  // Cycles
  createCycle:  (data)      => unwrap(api.post('/performance/cycles', data)),
  closeCycle:   (id)        => unwrap(api.patch(`/performance/cycles/${id}/close`)),
  cycles:       ()          => unwrap(api.get('/performance/cycles')),
  activeCycle:  ()          => unwrap(api.get('/performance/cycles/active')),
  // My goals
  myGoals:      ()          => unwrap(api.get('/performance/goals/my')),
  submitGoals:  (data)      => unwrap(api.post('/performance/goals', data)),
  submitGoal:   (id)        => unwrap(api.patch(`/performance/goals/${id}/submit`)),
  selfRate:     (id, d)     => unwrap(api.patch(`/performance/goals/${id}/self-review`, d)),
  // Director
  directorPending: ()       => unwrap(api.get('/performance/goals/director/pending')),
  directorReview: (id, d)   => unwrap(api.patch(`/performance/goals/${id}/director-review`, d)),
  assignGoal:   (d)         => unwrap(api.post('/performance/goals/assign', d)),
  // HR
  allGoals:     (params)    => unwrap(api.get('/performance/goals', { params })),
  hrFinalize:   (id, d)     => unwrap(api.patch(`/performance/goals/${id}/finalize`, d)),
  // Legacy aliases (old Python HOD naming still used in Performance.jsx)
  hodPending:   ()          => perfAPI.directorPending(),
  hodReview:    (id, d)     => perfAPI.directorReview(id, d),
};

/* ══════════════════════════════════════════════════════════════════════════
   SALARY STRUCTURE
═══════════════════════════════════════════════════════════════════════════*/
export const salaryStructureAPI = {
  get:    (empId)       => unwrap(api.get(`/payroll/salary-structure/${empId}`)),
  set:    (empId, data) => unwrap(api.post(`/payroll/salary-structure/${empId}`, data)),
  summary:(month, year) => unwrap(api.get('/payroll/summary', { params: { month, year } })),
};

export default api;
