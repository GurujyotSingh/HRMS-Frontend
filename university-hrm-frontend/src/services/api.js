import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hrm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hrm_token');
      localStorage.removeItem('hrm_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

/** Backend uses JSON login (UserLogin), not OAuth2 form. */
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const employeesAPI = {
  list: (params) => api.get('/employees', { params }),
  get: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  me: () => api.get('/employees/me'),
  updateMe: (data) => api.patch('/employees/me', data),
};

export const deptAPI = {
  list: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
};

export const leavesAPI = {
  myLeaves: () => api.get('/leaves/my'),
  apply: (data) => api.post('/leaves/apply', data),
  cancel: (id) => api.post(`/leaves/my/${id}/cancel`),
  hodPending: () => api.get('/leaves/hod/pending'),
  hodApprove: (id) => api.post(`/leaves/hod/${id}/approve`),
  hodReject: (id) => api.post(`/leaves/hod/${id}/reject`),
  hrAll: () => api.get('/leaves/hr/all'),
  hrQueue: () => api.get('/leaves/hr/queue'),
  hrProcess: (id, action) => api.post(`/leaves/hr/${id}/process`, { action }),
  adminQueue: () => api.get('/leaves/admin/queue'),
  adminProcess: (id, action) => api.post(`/leaves/admin/${id}/process`, { action }),
};

export const leaveBalanceAPI = {
  myBalance: () => api.get('/leave-balances/my'),
};

export const attendanceAPI = {
  clockIn: () => api.post('/attendance/clock-in'),
  clockOut: () => api.post('/attendance/clock-out'),
  today: () => api.get('/attendance/today'),
  myRecords: (month, year) => api.get('/attendance/my', { params: { month, year } }),
  hrToday: () => api.get('/attendance/hr/today'),
  hrEmployeeMonth: (employeeId, month, year) =>
    api.get(`/attendance/hr/employee/${employeeId}`, { params: { month, year } }),
};

export const payrollAPI = {
  myPayslips: () => api.get('/payroll/my/payslips'),
  allPayslips: (params) => api.get('/payroll/hr/payslips', { params }),
  generate: (data) => api.post('/payroll/payslips/generate', data),
  finalize: (id) => api.post(`/payroll/payslips/${id}/finalize`),
  getSalary: (empId) => api.get(`/payroll/salary-structure/${empId}`),
  setSalary: (empId, data) => api.post(`/payroll/salary-structure/${empId}`, data),
};

export const reportsAPI = {
  leaveStats: () => api.get('/reports/leaves/stats'),
  employeesByDeptRole: () => api.get('/reports/employees/by-dept-role'),
  attendanceSummary: (month, year) =>
    api.get('/reports/attendance/summary', { params: { month, year } }),
};

export const onboardAPI = {
  myRecord: () => api.get('/onboarding/my'),
  allRecords: () => api.get('/onboarding/hr/all'),
  completeTask: (taskId) => api.post(`/onboarding/my/tasks/${taskId}/complete`),
  offAll: () => api.get('/onboarding/offboarding/all'),
  offInitiate: (data) => api.post('/onboarding/offboarding/initiate', data),
  offCompleteTask: (recordId, taskId) =>
    api.post(`/onboarding/offboarding/${recordId}/tasks/${taskId}/complete`),
};

export const perfAPI = {
  cycles: () => api.get('/performance/cycles'),
  activeCycle: () => api.get('/performance/cycles/active'),
  myGoals: () => api.get('/performance/goals/my'),
  submitGoals: (data) => api.post('/performance/goals', data),
  submitGoal: (id) => api.post(`/performance/goals/${id}/submit`),
  selfRate: (id, data) => api.post(`/performance/goals/${id}/self-review`, data),
  hodReview: (id, data) => api.post(`/performance/goals/${id}/hod-review`, data),
  hrFinalize: (id, data) => api.post(`/performance/goals/${id}/finalize`, data),
  hodPending: () => api.get('/performance/goals/hod/pending'),
  allGoals: (params) => api.get('/performance/goals/hr/all', { params }),
};

export const chatAPI = {
  send: (message, sessionId, confirm = false) =>
    api.post('/ai/chat', { message, session_id: sessionId ?? null, confirm }),
  sessions: () => api.get('/ai/chat/sessions'),
  session: (sid) => api.get(`/ai/chat/sessions/${sid}`),
  deleteSession: (sid) => api.delete(`/ai/chat/sessions/${sid}`),
};

export const auditAPI = {
  list: (params) => api.get('/audit/logs', { params }),
};

export default api;
