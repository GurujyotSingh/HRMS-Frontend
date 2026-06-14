import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './context/AuthContext';
import { ToastContainer } from './components/ui';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './components/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Leaves from './pages/Leaves';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import Onboarding from './pages/Onboarding';
import Performance from './pages/Performance';
import Chat from './pages/Chat';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import Recruitment from './pages/Recruitment';
import Announcements from './pages/Announcements';

import PublicLayout from './components/layout/PublicLayout';
import Careers from './pages/Careers';
import JobApply from './pages/JobApply';

// Fixed for 1M+ rows scalability: React Query global client
// staleTime: 60s means cached data is reused for 60s before a background refetch
// retry: 1 means failed queries retry once before showing an error
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // 60 seconds — prevents hammering DB on tab-switch
      cacheTime: 5 * 60 * 1000, // 5 minutes — keep unused cache in memory
      retry: 1,
      refetchOnWindowFocus: false, // don't re-fetch on every tab focus
    },
  },
});

// Redirect if already logged in
function LoginRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

// Role constants — use DIRECTOR instead of HOD/department_head
const MANAGE_ROLES = ['admin', 'hr'];
const REPORT_ROLES = ['admin', 'hr', 'director'];
const ADMIN_ONLY   = ['admin'];

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer />
      <Routes>
        <Route path="/careers" element={<PublicLayout><Careers /></PublicLayout>} />
        <Route path="/careers/:id" element={<PublicLayout><JobApply /></PublicLayout>} />

        {/* ── Public ─────────────────────────────────────────── */}
        <Route
          path="/login"
          element={<LoginRoute><Login /></LoginRoute>}
        />

        {/* ── Dashboard (all authenticated users) ────────────── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Employees & Departments (HR + Admin) ────────────── */}
        <Route
          path="/employees"
          element={
            <ProtectedRoute roles={MANAGE_ROLES}>
              <AppLayout><Employees /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments"
          element={
            <ProtectedRoute roles={MANAGE_ROLES}>
              <AppLayout><Departments /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruitment"
          element={
            <ProtectedRoute roles={MANAGE_ROLES}>
              <AppLayout><Recruitment /></AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Leave (all) ─────────────────────────────────────── */}
        <Route
          path="/leaves"
          element={
            <ProtectedRoute>
              <AppLayout><Leaves /></AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Attendance (all) ────────────────────────────────── */}
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <AppLayout><Attendance /></AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Payroll ─────────────────────────────────────────── */}
        <Route
          path="/payroll"
          element={
            <ProtectedRoute>
              <AppLayout><Payroll /></AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Onboarding ──────────────────────────────────────── */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <AppLayout><Onboarding /></AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Announcements ───────────────────────────────────── */}
        <Route
          path="/announcements"
          element={
            <ProtectedRoute>
              <AppLayout><Announcements /></AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Performance / Appraisals ─────────────────────────── */}
        <Route
          path="/performance"
          element={
            <ProtectedRoute>
              <AppLayout><Performance /></AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ── AI Assistant (all) ──────────────────────────────── */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <AppLayout><Chat /></AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Reports (HR + Director) ─────────────────────────── */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={REPORT_ROLES}>
              <AppLayout><Reports /></AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Audit Logs (Admin only) ──────────────────────────── */}
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute roles={ADMIN_ONLY}>
              <AppLayout><AuditLogs /></AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Fallbacks ───────────────────────────────────────── */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </QueryClientProvider>
  );
}
