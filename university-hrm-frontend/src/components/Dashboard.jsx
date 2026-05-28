import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './dashboards/AdminDashboard';
import HRDashboard from './dashboards/HRDashboard';
import DirectorDashboard from './dashboards/DirectorDashboard';
import EmployeeDashboard from './dashboards/EmployeeDashboard';

/**
 * Role-based dashboard router.
 * Maps SystemRole → normalized internal role → dashboard component.
 *
 * DIRECTOR replaces all HOD/department_head references.
 * hr_staff uses HR dashboard. Accountant role is dropped (no matching backend role).
 */
export default function Dashboard() {
  const { hasRole } = useAuth();

  if (hasRole('admin'))    return <AdminDashboard />;
  if (hasRole('hr'))       return <HRDashboard />;
  if (hasRole('hr_staff')) return <HRDashboard />;
  // DIRECTOR — handles all department director checks (replaces HOD / department_head)
  if (hasRole('director')) return <DirectorDashboard />;

  // Faculty and Staff → employee dashboard
  return <EmployeeDashboard />;
}
