// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Papa from 'papaparse';
import {
  faUsers,
  faCalendarTimes,
  faMoneyCheckAlt,
  faChartLine,
  faCalendarAlt,
  faClock,
  faFileInvoiceDollar,
  faExclamationTriangle,
  faDownload,
  faBars,
  faTimes,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const role = 'HRAdmin';
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const attendanceData = [
    { name: 'Jan', attendance: 92 },
    { name: 'Feb', attendance: 94 },
    { name: 'Mar', attendance: 93 },
    { name: 'Apr', attendance: 95 },
    { name: 'May', attendance: 96 },
  ];

  const recentActivities = [
    { employee: 'John Doe', action: 'Applied for Annual Leave', date: 'Today, 10:30 AM' },
    { employee: 'Jane Smith', action: 'Clocked In', date: 'Today, 9:05 AM' },
    { employee: 'Rahul Kumar', action: 'Submitted Expense Claim', date: 'Yesterday, 3:45 PM' },
    { employee: 'Priya Sharma', action: 'Completed Onboarding Task', date: '2 days ago' },
  ];

  const alerts = [
    { type: 'warning', message: '5 pending high-level leaves for Director approval' },
    { type: 'danger', message: 'Overdue onboarding task for John Doe' },
    { type: 'success', message: 'Attendance rate improved by 2% this month' },
  ];

  const pendingTasks = [
    { task: 'Onboarding - Documents', employee: 'Amit Patel', due: '2026-03-05', overdue: false },
    { task: 'Offboarding - Return Assets', employee: 'Neha Gupta', due: '2026-02-28', overdue: true },
  ];

  const filteredActivities = recentActivities.filter(activity =>
    activity.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const turnoverRate = 8.5;

  const csvData = recentActivities.map(act => ({
    Employee: act.employee,
    Action: act.action,
    Date: act.date,
  }));

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;

  return (
    <div className="dashboard-container">
      {/* Mobile Header with Menu Toggle */}
      {isMobile && (
        <div className="mobile-dashboard-header">
          <h2 className="page-title mobile-title">
            {role === 'Director' ? 'University Overview' : 
             role === 'HOD' ? 'Department Dashboard' : 'Admin Dashboard'}
          </h2>
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
          </button>
        </div>
      )}

      {/* Mobile Filter Menu */}
      {isMobile && isMobileMenuOpen && (
        <div className="mobile-filter-menu">
          <div className="mobile-search">
            <FontAwesomeIcon icon={faSearch} className="mobile-search-icon" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mobile-search-input"
            />
          </div>
          <button
            onClick={() => {
              const csv = Papa.unparse(csvData);
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', 'recent_activities.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setIsMobileMenuOpen(false);
            }}
            className="mobile-export-btn"
          >
            <FontAwesomeIcon icon={faDownload} />
            Export CSV
          </button>
        </div>
      )}

      {/* Desktop Title */}
      {!isMobile && (
        <h2 className="page-title desktop-title">
          {role === 'Director' ? 'University Overview' : 
           role === 'HOD' ? 'Department Dashboard' : 'Admin Dashboard'}
        </h2>
      )}

      {/* Alerts Widget - Stack vertically on mobile */}
      <div className="alerts-section">
        {alerts.map((alert, idx) => (
          <div
            key={idx}
            className={`alert alert-${alert.type}`}
          >
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span className="alert-message">{alert.message}</span>
          </div>
        ))}
      </div>

      {/* Stats Grid - Responsive grid */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon purple">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="stat-info">
            <h3>1,248</h3>
            <p>{role === 'HOD' ? 'Department Employees' : 'Total Employees'}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <FontAwesomeIcon icon={faCalendarTimes} />
          </div>
          <div className="stat-info">
            <h3>87</h3>
            <p>Pending Leaves</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon coral">
            <FontAwesomeIcon icon={faMoneyCheckAlt} />
          </div>
          <div className="stat-info">
            <h3>₹12.5 Cr</h3>
            <p>Monthly Payroll</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <FontAwesomeIcon icon={faChartLine} />
          </div>
          <div className="stat-info">
            <h3>{turnoverRate}%</h3>
            <p className={turnoverRate > 10 ? 'text-danger' : 'text-success'}>
              Employee Turnover Rate {turnoverRate > 10 ? '(High)' : '(Stable)'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons - Stack vertically on mobile */}
      <div className="actions-grid">
        
        {role === 'Director' && (
          <button className="btn btn-accent action-btn">
            Approve Strategic Leave
          </button>
        )}
      </div>

      {/* Charts - Full width on mobile */}
      <div className="chart-card">
        <h3>Attendance Trend (Last 5 Months)</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <LineChart data={attendanceData} margin={isMobile ? 
              { top: 10, right: 10, left: 0, bottom: 10 } : 
              { top: 20, right: 30, left: 20, bottom: 20 }
            }>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis 
                dataKey="name" 
                stroke="var(--gray-600)"
                tick={{ fontSize: isMobile ? 12 : 14 }}
              />
              <YAxis 
                stroke="var(--gray-600)"
                tick={{ fontSize: isMobile ? 12 : 14 }}
              />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="attendance" 
                stroke="var(--primary)" 
                strokeWidth={3}
                dot={{ r: isMobile ? 4 : 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Tasks - Horizontal scroll on mobile */}
      <div className="pending-tasks">
        <h3>Pending Tasks</h3>
        <div className="table-container">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Employee</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingTasks.map((task, idx) => (
                <tr key={idx} className={task.overdue ? 'overdue-row' : ''}>
                  <td data-label="Task">{task.task}</td>
                  <td data-label="Employee">{task.employee}</td>
                  <td data-label="Due Date">{task.due}</td>
                  <td data-label="Status" className={task.overdue ? 'status-overdue' : 'status-pending'}>
                    {task.overdue ? 'Overdue' : 'Pending'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activities - Responsive table */}
      <div className="recent-activities">
        <div className="activities-header">
          <h3>Recent Activities</h3>
          {!isMobile && (
            <div className="desktop-search">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          )}
          {!isMobile && (
            <button
              onClick={() => {
                const csv = Papa.unparse(csvData);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'recent_activities.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="btn btn-secondary export-btn"
            >
              <FontAwesomeIcon icon={faDownload} />
              Export CSV
            </button>
          )}
        </div>

        <div className="activity-card">
          <div className="table-container">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Action</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((act, idx) => (
                  <tr key={idx}>
                    <td data-label="Employee">{act.employee}</td>
                    <td data-label="Action">
                      <div className="action-cell">
                        <FontAwesomeIcon
                          icon={
                            act.action.includes('Leave') ? faCalendarAlt :
                            act.action.includes('Clocked') ? faClock :
                            faFileInvoiceDollar
                          }
                          className={`action-icon ${
                            act.action.includes('Leave') ? 'icon-primary' :
                            act.action.includes('Clocked') ? 'icon-success' :
                            'icon-secondary'
                          }`}
                        />
                        <span>{act.action}</span>
                      </div>
                    </td>
                    <td data-label="Date">{act.date}</td>
                  </tr>
                ))}
                {filteredActivities.length === 0 && (
                  <tr>
                    <td colSpan={3} className="no-results">
                      No activities found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;