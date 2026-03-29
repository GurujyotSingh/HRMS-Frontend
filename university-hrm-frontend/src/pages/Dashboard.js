import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Users, CalendarClock, UserCheck, TrendingUp, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, reportsAPI } from '../services/api';
import { PageHeader, StatCard, toast } from '../components/ui';

const weekData = [
  { name: 'Mon', present: 42, absent: 3 },
  { name: 'Tue', present: 44, absent: 2 },
  { name: 'Wed', present: 41, absent: 4 },
  { name: 'Thu', present: 43, absent: 2 },
  { name: 'Fri', present: 40, absent: 5 },
];

const leavePie = [
  { name: 'Casual', value: 12 },
  { name: 'Sick', value: 8 },
  { name: 'Earned', value: 15 },
  { name: 'Unpaid', value: 4 },
  { name: 'Other', value: 6 },
];

const payrollLine = [
  { m: 'Oct', net: 4200000 },
  { m: 'Nov', net: 4350000 },
  { m: 'Dec', net: 4280000 },
  { m: 'Jan', net: 4410000 },
  { m: 'Feb', net: 4380000 },
  { m: 'Mar', net: 4520000 },
];

const PIE_COLORS = ['#C4622D', '#6B7C5C', '#8C8070', '#2D6A8C', '#C4922D'];

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState({
    employees: '—',
    pendingLeaves: '—',
    presentToday: '—',
    openAppraisals: '—',
    departments: '—',
  });

  const load = useCallback(async () => {
    if (!hasRole('admin', 'hr')) return;
    try {
      const [leaveStats, byDept, today] = await Promise.all([
        reportsAPI.leaveStats().then((r) => r.data).catch(() => null),
        reportsAPI.employeesByDeptRole().then((r) => r.data).catch(() => null),
        attendanceAPI.hrToday().then((r) => r.data).catch(() => null),
      ]);
      const deptNames = new Set();
      (byDept || []).forEach((r) => {
        if (r.department) deptNames.add(r.department);
      });
      setStats({
        employees: byDept ? String(byDept.reduce((s, r) => s + (r.count || 0), 0)) : '—',
        pendingLeaves: leaveStats ? String(leaveStats.pending ?? 0) : '—',
        presentToday: Array.isArray(today) ? String(today.length) : '—',
        openAppraisals: '—',
        departments: String(deptNames.size || '—'),
      });
    } catch (e) {
      toast('Could not load all dashboard metrics', 'warning');
    }
  }, [hasRole]);

  useEffect(() => {
    load();
  }, [load]);

  const name = user?.first_name || user?.email?.split('@')[0] || 'there';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <PageHeader title={`Hello, ${name}`} subtitle={today} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {hasRole('admin', 'hr') && (
          <>
            <StatCard label="Total employees" value={stats.employees} icon={<Users size={22} />} color="var(--terracotta)" />
            <StatCard
              label="Pending leaves"
              value={stats.pendingLeaves}
              icon={<CalendarClock size={22} />}
              color="var(--warning)"
            />
            <StatCard
              label="Present today"
              value={stats.presentToday}
              icon={<UserCheck size={22} />}
              color="var(--sage)"
            />
            <StatCard
              label="Departments"
              value={stats.departments}
              icon={<Building2 size={22} />}
              color="var(--info)"
            />
          </>
        )}
        <StatCard
          label="Open appraisals"
          value={stats.openAppraisals}
          icon={<TrendingUp size={22} />}
          color="var(--clay)"
          sub="Set by HR in Performance"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Weekly attendance</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#6B7C5C" name="Present" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="#D4845A" name="Absent" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Leave distribution</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leavePie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={88}
                  paddingAngle={2}
                >
                  {leavePie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Payroll trend</h3>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={payrollLine}>
              <XAxis dataKey="m" />
              <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Net pay']} />
              <Line type="monotone" dataKey="net" stroke="#C4622D" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
