import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { ToastContainer } from './components/ui';

// Pages
import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import Employees   from './pages/Employees';
import Departments from './pages/Departments';
import Leaves      from './pages/Leaves';
import Attendance  from './pages/Attendance';
import Payroll     from './pages/Payroll';
import Onboarding  from './pages/Onboarding';
import Performance from './pages/Performance';
import Chat        from './pages/Chat';
import AuditLogs   from './pages/AuditLogs';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />

      <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />

      <Route path="/employees" element={
        <ProtectedRoute roles={['admin','hr']}>
          <AppLayout><Employees /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/departments" element={
        <ProtectedRoute roles={['admin','hr']}>
          <AppLayout><Departments /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/leaves"      element={<ProtectedRoute><AppLayout><Leaves /></AppLayout></ProtectedRoute>} />
      <Route path="/attendance"  element={<ProtectedRoute><AppLayout><Attendance /></AppLayout></ProtectedRoute>} />

      <Route path="/payroll" element={
        <ProtectedRoute roles={['admin','hr','accountant']}>
          <AppLayout><Payroll /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/onboarding"  element={<ProtectedRoute><AppLayout><Onboarding /></AppLayout></ProtectedRoute>} />
      <Route path="/performance" element={<ProtectedRoute><AppLayout><Performance /></AppLayout></ProtectedRoute>} />
      <Route path="/chat"        element={<ProtectedRoute><AppLayout><Chat /></AppLayout></ProtectedRoute>} />

      <Route path="/audit" element={
        <ProtectedRoute roles={['admin']}>
          <AppLayout><AuditLogs /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}