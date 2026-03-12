import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedRoute from './components/auth/RoleBasedRoute';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import UserLayout from './components/layout/UserLayout';
import PublicLayout from './components/layout/PublicLayout';
import Layout from './components/Layout';

// Auth Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';

// Employee Management
import EmployeeList from './pages/admin/Employees/EmployeeList';
import EmployeeDetails from './pages/admin/Employees/EmployeeDetails';
import AddEmployee from './pages/admin/Employees/AddEmployee';
import EditEmployee from './pages/admin/Employees/EditEmployee';

// Leave Management
import LeaveRequests from './pages/admin/Leave/LeaveRequests';
import LeaveApproval from './pages/admin/Leave/LeaveApproval';
import LeaveBalance from './pages/admin/Leave/LeaveBalance';

// Attendance
import AttendanceLogs from './pages/admin/Attendance/AttendanceLogs';
import AttendanceReport from './pages/admin/Attendance/AttendanceReport';
import AttendanceSettings from './pages/admin/Attendance/AttendanceSettings';

// Onboarding
import OnboardingTasks from './pages/admin/Onboarding/OnboardingTasks';
import NewHireList from './pages/admin/Onboarding/NewHireList';
import TaskChecklist from './pages/admin/Onboarding/TaskChecklist';

// Performance
import PerformanceReviews from './pages/admin/Performance/Reviews';
import ReviewForm from './pages/admin/Performance/ReviewForm';
import Ratings from './pages/admin/Performance/Ratings';

// Resources
import RoomBooking from './pages/admin/Resources/RoomBooking';
import EquipmentRequest from './pages/admin/Resources/EquipmentRequest';
import TravelClaims from './pages/admin/Resources/TravelClaims';

// Payroll
import PayrollList from './pages/admin/Payroll/PayrollList';
import GeneratePayroll from './pages/admin/Payroll/GeneratePayroll';
import SalaryDetails from './pages/admin/Payroll/SalaryDetails';

// Calendar
import EventCalendar from './pages/admin/Calendar/EventCalendar';
import Holidays from './pages/admin/Calendar/Holidays';
import Notifications from './pages/admin/Calendar/Notifications';

// Reports
import Analytics from './pages/admin/Reports/Analytics';
import CustomReports from './pages/admin/Reports/CustomReports';
import ExportData from './pages/admin/Reports/ExportData';

// User Pages
import UserDashboard from './pages/user/Dashboard';
import UserProfile from './pages/user/Profile';

// User Leave
import ApplyLeave from './pages/user/Leave/ApplyLeave';
import MyLeaves from './pages/user/Leave/MyLeaves';
import UserLeaveBalance from './pages/user/Leave/LeaveBalance';

// User Attendance
import ClockInOut from './pages/user/Attendance/ClockInOut';
import MyAttendance from './pages/user/Attendance/MyAttendance';

// User Tasks
import MyTasks from './pages/user/Tasks/MyTasks';
import TaskDetails from './pages/user/Tasks/TaskDetails';

// User Performance
import MyReviews from './pages/user/Performance/MyReviews';
import Feedback from './pages/user/Performance/Feedback';

// User Resources
import BookResource from './pages/user/Resources/BookResource';
import MyBookings from './pages/user/Resources/MyBookings';

// User Payroll
import MyPayslips from './pages/user/Payroll/MyPayslips';
import TaxDetails from './pages/user/Payroll/TaxDetails';

// User Calendar
import MyCalendar from './pages/user/Calendar/MyCalendar';

// Accountant Pages
import AccountantDashboard from './pages/accountant/Dashboard';
import PayrollDetails from './pages/accountant/Payroll/PayrollDetails';
import ProcessPayroll from './pages/accountant/Payroll/ProcessPayroll';
import AccountantPayrollList from './pages/accountant/Payroll/PayrollList';
import SalaryHistory from './pages/accountant/SalaryHistory/SalaryHistory';
import TaxManagement from './pages/accountant/Tax/TaxManagement';
import FinancialReports from './pages/accountant/Reports/FinancialReports';
import PendingFlags from './pages/accountant/Pending/PendingFlags';

// Common Pages
import NotFound from './pages/common/NotFound';
import Unauthorized from './pages/common/Unauthorized';
import Maintenance from './pages/common/Maintenance';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              {/* Admin Routes */}
              <Route element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['HRAdmin', 'Director']}>
                    <AdminLayout />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }>
                {/* Dashboard */}
                <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />

                {/* Employee Management */}
                <Route path="/admin/employees" element={<EmployeeList />} />
                <Route path="/admin/employees/:id" element={<EmployeeDetails />} />
                <Route path="/admin/employees/add" element={<AddEmployee />} />
                <Route path="/admin/employees/edit/:id" element={<EditEmployee />} />

                {/* Leave Management */}
                <Route path="/admin/leave" element={<LeaveRequests />} />
                <Route path="/admin/leave/approval/:id" element={<LeaveApproval />} />
                <Route path="/admin/leave/balance" element={<LeaveBalance />} />

                {/* Attendance */}
                <Route path="/admin/attendance" element={<AttendanceLogs />} />
                <Route path="/admin/attendance/report" element={<AttendanceReport />} />
                <Route path="/admin/attendance/settings" element={<AttendanceSettings />} />

                {/* Onboarding */}
                <Route path="/admin/onboarding" element={<OnboardingTasks />} />
                <Route path="/admin/onboarding/new-hires" element={<NewHireList />} />
                <Route path="/admin/onboarding/checklist/:id" element={<TaskChecklist />} />

                {/* Performance */}
                <Route path="/admin/performance" element={<PerformanceReviews />} />
                <Route path="/admin/performance/review/:id" element={<ReviewForm />} />
                <Route path="/admin/performance/ratings" element={<Ratings />} />

                {/* Resources */}
                <Route path="/admin/resources/rooms" element={<RoomBooking />} />
                <Route path="/admin/resources/equipment" element={<EquipmentRequest />} />
                <Route path="/admin/resources/travel" element={<TravelClaims />} />

                {/* Payroll */}
                <Route path="/admin/payroll" element={<PayrollList />} />
                <Route path="/admin/payroll/generate" element={<GeneratePayroll />} />
                <Route path="/admin/payroll/salary/:id" element={<SalaryDetails />} />

                {/* Calendar */}
                <Route path="/admin/calendar" element={<EventCalendar />} />
                <Route path="/admin/calendar/holidays" element={<Holidays />} />
                <Route path="/admin/notifications" element={<Notifications />} />

                {/* Reports */}
                <Route path="/admin/reports" element={<Analytics />} />
                <Route path="/admin/reports/custom" element={<CustomReports />} />
                <Route path="/admin/reports/export" element={<ExportData />} />
              </Route>

              {/* HOD Routes */}
              <Route element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['HOD']}>
                    <AdminLayout />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }>
                <Route path="/hod" element={<Navigate to="/hod/dashboard" />} />
                <Route path="/hod/dashboard" element={<AdminDashboard />} />
                <Route path="/hod/leave" element={<LeaveRequests />} />
                <Route path="/hod/leave/approval/:id" element={<LeaveApproval />} />
                <Route path="/hod/attendance" element={<AttendanceLogs />} />
                <Route path="/hod/performance" element={<PerformanceReviews />} />
              </Route>

              {/* Accountant Routes */}
              <Route element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['Accountant', 'HRAdmin', 'Director']}>
                    <Layout title="Accountant Dashboard" />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }>
                <Route path="/accountant" element={<Navigate to="/accountant/dashboard" />} />
                <Route path="/accountant/dashboard" element={<AccountantDashboard />} />
                <Route path="/accountant/payroll" element={<AccountantPayrollList />} />
                <Route path="/accountant/payroll/:id" element={<PayrollDetails />} />
                <Route path="/accountant/payroll/process" element={<ProcessPayroll />} />
                <Route path="/accountant/salary-history" element={<SalaryHistory />} />
                <Route path="/accountant/tax" element={<TaxManagement />} />
                <Route path="/accountant/reports" element={<FinancialReports />} />
                <Route path="/accountant/pending" element={<PendingFlags />} />
              </Route>

              {/* User Routes */}
              <Route element={
                <ProtectedRoute>
                  <UserLayout />
                </ProtectedRoute>
              }>
                <Route path="/user" element={<Navigate to="/user/dashboard" />} />
                <Route path="/user/dashboard" element={<UserDashboard />} />
                <Route path="/user/profile" element={<UserProfile />} />

                {/* User Leave */}
                <Route path="/user/leave/apply" element={<ApplyLeave />} />
                <Route path="/user/leave/my-leaves" element={<MyLeaves />} />
                <Route path="/user/leave/balance" element={<UserLeaveBalance />} />

                {/* User Attendance */}
                <Route path="/user/attendance" element={<MyAttendance />} />
                <Route path="/user/attendance/clock" element={<ClockInOut />} />

                {/* User Tasks */}
                <Route path="/user/tasks" element={<MyTasks />} />
                <Route path="/user/tasks/:id" element={<TaskDetails />} />

                {/* User Performance */}
                <Route path="/user/performance" element={<MyReviews />} />
                <Route path="/user/performance/feedback" element={<Feedback />} />

                {/* User Resources */}
                <Route path="/user/resources" element={<MyBookings />} />
                <Route path="/user/resources/book" element={<BookResource />} />

                {/* User Payroll */}
                <Route path="/user/payroll" element={<MyPayslips />} />
                <Route path="/user/payroll/tax" element={<TaxDetails />} />

                {/* User Calendar */}
                <Route path="/user/calendar" element={<MyCalendar />} />
              </Route>

              {/* Error Routes */}
              <Route path="/401" element={<Unauthorized />} />
              <Route path="/503" element={<Maintenance />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;