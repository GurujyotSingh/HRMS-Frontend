import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Briefcase, Key } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { reportsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Spinner } from '../../components/ui';

export default function HRDashboard() {
  const { hasRole, user } = useAuth();
  const isPrivileged = hasRole('admin', 'hr');
  const isHOD = hasRole('department_head');
  const isEmployee = hasRole('employee');
  const isAccountant = hasRole('accountant');

  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(isPrivileged);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isPrivileged) return;
      try {
        const [deptData, attData] = await Promise.all([
          reportsAPI.employeesByDeptRole(),
          reportsAPI.attendanceWeekly()
        ]);
        setStats(deptData.data);
        setAttendance(attData.data);
      } catch (e) {
        console.error('Failed to load stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isPrivileged]);

  // Aggregate stats from real data if available
  let totalEmployees = 0;
  let totalDepartments = 0;
  if (stats && Array.isArray(stats)) {
    totalEmployees = stats.reduce((sum, item) => sum + item.employee_count, 0);
    totalDepartments = stats.length;
  }

  const displayStats = [
    { label: "Total Employees", value: totalEmployees || "—", icon: <Users size={24} />, colorClass: "purple" },
    { label: "Departments", value: totalDepartments || "—", icon: <Briefcase size={24} />, colorClass: "orange" },
    { label: "System Roles", value: "4 Active", icon: <Key size={24} />, colorClass: "coral" }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--white)', padding: 12, border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: 'var(--shadow)' }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-dark)' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ margin: 0, color: entry.color, fontSize: 13 }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      <h1 className="page-title" style={{ marginBottom: '24px' }}>
        Welcome back, {user?.email.split('@')[0]}
      </h1>

      {isPrivileged && (
        <>
          {/* Stats Grid */}
          <div className="dashboard-grid" style={{ marginTop: 0 }}>
            {displayStats.map((stat, i) => (
              <div className="stat-card" key={i}>
                <div className={`stat-icon ${stat.colorClass || 'purple'}`}>
                  {stat.icon}
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>

              {/* Chart 1: Department Distribution */}
              <Card style={{ padding: '24px' }}>
                <h3 style={{ fontSize: 16, marginBottom: 20 }}>Employee Distribution by Department</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-200)" />
                      <XAxis dataKey="department_name" tick={{ fill: 'var(--gray-500)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--gray-500)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--gray-100)' }} />
                      <Bar dataKey="employee_count" name="Employees" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Chart 2: Weekly Attendance Trend */}
              <Card style={{ padding: '24px' }}>
                <h3 style={{ fontSize: 16, marginBottom: 20 }}>Weekly Attendance Trends</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendance || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-200)" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--gray-500)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--gray-500)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="present_count" name="Present" stroke="var(--success)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="absent_count" name="Absent" stroke="var(--danger)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}
        </>
      )}




      {/* HOD View */}
      {isHOD && !isPrivileged && (
        <Card style={{ padding: '24px', marginTop: 24 }}>
          <h2 style={{ fontSize: 20, color: 'var(--text-dark)', marginBottom: 16 }}>Department Head Portal</h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>
            Overview of your academic or administrative division. You have pending approvals requiring your attention workflow elements.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>Team Size</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>14</div>
            </div>
            <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>Pending Leaves</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--warning)' }}>3</div>
            </div>
            <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>Goal Reviews</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--info)' }}>Pending</div>
            </div>
          </div>
        </Card>
      )}

      {/* Employee & Base View */}
      {(!isPrivileged && !isHOD) && (
        <Card style={{ padding: '40px', textAlign: 'center', marginTop: 24 }}>
          <BookOpen size={48} color="var(--primary)" style={{ opacity: 0.2, marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, color: 'var(--text-dark)' }}>Employee Portal</h2>
          <p style={{ color: 'var(--gray-500)', maxWidth: 400, margin: '10px auto 0' }}>
            Use the sidebar to view your attendance, request leaves, or complete your onboarding and performance goals.
          </p>
        </Card>
      )}

      {/* Peer Kudos Widget (Universally Visible) */}
      <Card style={{ marginTop: 24, padding: '24px' }}>
        <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          🎉 Recent Team Kudos
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {[
            { to: 'Neha (IT)', from: 'Rahul', msg: 'Huge thanks for helping me debug the networking issue today!' },
            { to: 'Dr. Bhavin', from: 'Priya', msg: 'Great presentation on the new curriculum changes.' },
            { to: 'Finance Team', from: 'Bhavya(HR)', msg: 'Appreciate the quick turnaround on the payroll reports.' }
          ].map((kudo, idx) => (
            <div key={idx} style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-box)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>@{kudo.to}</span>
                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>from {kudo.from}</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-dark)', fontStyle: 'italic' }}>"{kudo.msg}"</p>
            </div>
          ))}
        </div>
      </Card>
    </div>

  );
}
