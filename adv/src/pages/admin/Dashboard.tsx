// src/pages/admin/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faUserPlus,
  faUserMinus,
  faCalendarCheck,
  faClock,
  faMoneyBillWave,
  faChartLine,
  faExclamationTriangle,
  faFileExport,
  faBell,
  faBriefcase,
  faGraduationCap,
} from '@fortawesome/free-solid-svg-icons';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useNotification } from '../../hooks/useNotification';
import { usePermissions } from '../../hooks/usePermissions';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

const AdminDashboard: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    employeeStats: {
      total: 1248,
      active: 1185,
      newHires: 45,
      turnover: 8.5,
      byDepartment: [
        { name: 'Computer Science', count: 156 },
        { name: 'Mathematics', count: 98 },
        { name: 'Physics', count: 87 },
        { name: 'Chemistry', count: 76 },
        { name: 'Biology', count: 82 },
        { name: 'Administration', count: 245 },
      ],
      byRank: [
        { name: 'Professor', count: 124 },
        { name: 'Associate Professor', count: 187 },
        { name: 'Assistant Professor', count: 256 },
        { name: 'Lecturer', count: 342 },
        { name: 'Staff', count: 339 },
      ]
    },
    leaveStats: {
      pending: 87,
      approved: 156,
      rejected: 23,
      byType: [
        { type: 'Annual', count: 89 },
        { type: 'Sick', count: 67 },
        { type: 'Personal', count: 45 },
        { type: 'Sabbatical', count: 12 },
        { type: 'Study', count: 23 },
      ],
      byMonth: [
        { month: 'Jan', leaves: 45 },
        { month: 'Feb', leaves: 52 },
        { month: 'Mar', leaves: 78 },
        { month: 'Apr', leaves: 89 },
        { month: 'May', leaves: 94 },
        { month: 'Jun', leaves: 67 },
      ]
    },
    attendanceStats: {
      present: 945,
      absent: 78,
      late: 34,
      onLeave: 128,
      averageHours: 7.8,
      byDepartment: [
        { dept: 'CS', rate: 96 },
        { dept: 'Math', rate: 94 },
        { dept: 'Physics', rate: 92 },
        { dept: 'Chemistry', rate: 93 },
      ]
    },
    payrollStats: {
      monthlyTotal: 12500000,
      averageSalary: 85000,
      pendingPayments: 23,
      byDepartment: [
        { dept: 'Computer Science', amount: 2850000 },
        { dept: 'Mathematics', amount: 1650000 },
        { dept: 'Physics', amount: 1520000 },
      ]
    },
    upcomingEvents: [
      { id: 1, title: 'Faculty Meeting', date: '2024-04-15', type: 'Meeting' },
      { id: 2, title: 'Holiday - Eid', date: '2024-04-10', type: 'Holiday' },
      { id: 3, title: 'Payroll Processing', date: '2024-04-25', type: 'Deadline' },
      { id: 4, title: 'New Hire Orientation', date: '2024-04-05', type: 'Training' },
    ],
    pendingTasks: [
      { id: 1, task: 'Onboarding - John Doe', due: '2024-03-25', priority: 'High' },
      { id: 2, task: 'Leave Approval - 5 requests', due: '2024-03-24', priority: 'Medium' },
      { id: 3, task: 'Payroll Review', due: '2024-03-30', priority: 'High' },
    ],
    alerts: [
      { type: 'warning', message: '5 high-level leaves pending for Director approval' },
      { type: 'danger', message: '3 employees exceeded leave balance' },
      { type: 'info', message: 'Monthly attendance report due in 3 days' },
    ]
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    // Refresh data
    setTimeout(() => {
      setLoading(false);
      showNotification('Dashboard data refreshed', 'success');
    }, 1000);
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    const data = [
      ['Metric', 'Value'],
      ['Total Employees', dashboardData.employeeStats.total],
      ['Active Employees', dashboardData.employeeStats.active],
      ['New Hires', dashboardData.employeeStats.newHires],
      ['Turnover Rate', `${dashboardData.employeeStats.turnover}%`],
      ['Pending Leaves', dashboardData.leaveStats.pending],
      ['Monthly Payroll', `₹${dashboardData.payrollStats.monthlyTotal}`],
    ];

    if (format === 'csv') {
      exportToCSV(data, 'dashboard_report.csv');
    } else {
      exportToPDF('dashboard_report', 'Dashboard Report');
    }
    showNotification(`Report exported as ${format.toUpperCase()}`, 'success');
  };

  const COLORS = ['#4361ee', '#f72585', '#4cc9f0', '#f8961e', '#7209b7'];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-title">
          <h1>University HRMS Dashboard</h1>
          <p>Welcome back, Admin • Last updated: {new Date().toLocaleString()}</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={handleRefresh}>
            <FontAwesomeIcon icon={faChartLine} /> Refresh
          </Button>
          <Button variant="secondary" onClick={() => handleExport('csv')}>
            <FontAwesomeIcon icon={faFileExport} /> Export CSV
          </Button>
          <Button variant="secondary" onClick={() => handleExport('pdf')}>
            <FontAwesomeIcon icon={faFileExport} /> Export PDF
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="alerts-section">
        {dashboardData.alerts.map((alert, index) => (
          <div key={index} className={`alert alert-${alert.type}`}>
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span>{alert.message}</span>
          </div>
        ))}
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <Card className="metric-card">
          <div className="metric-icon blue">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="metric-content">
            <h3>Total Employees</h3>
            <div className="metric-value">{dashboardData.employeeStats.total}</div>
            <div className="metric-trend positive">
              <span>↑ 12%</span> from last month
            </div>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon green">
            <FontAwesomeIcon icon={faUserPlus} />
          </div>
          <div className="metric-content">
            <h3>New Hires</h3>
            <div className="metric-value">{dashboardData.employeeStats.newHires}</div>
            <div className="metric-trend positive">
              <span>↑ 5</span> this month
            </div>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon orange">
            <FontAwesomeIcon icon={faCalendarCheck} />
          </div>
          <div className="metric-content">
            <h3>Pending Leaves</h3>
            <div className="metric-value">{dashboardData.leaveStats.pending}</div>
            <div className="metric-trend neutral">
              <span>{dashboardData.leaveStats.approved}</span> approved
            </div>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon purple">
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className="metric-content">
            <h3>Avg Attendance</h3>
            <div className="metric-value">{dashboardData.attendanceStats.averageHours}h</div>
            <div className="metric-trend positive">
              <span>{dashboardData.attendanceStats.present}</span> present today
            </div>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon coral">
            <FontAwesomeIcon icon={faMoneyBillWave} />
          </div>
          <div className="metric-content">
            <h3>Monthly Payroll</h3>
            <div className="metric-value">₹{(dashboardData.payrollStats.monthlyTotal / 10000000).toFixed(2)}Cr</div>
            <div className="metric-trend neutral">
              <span>₹{(dashboardData.payrollStats.averageSalary / 1000).toFixed(0)}K</span> avg salary
            </div>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon teal">
            <FontAwesomeIcon icon={faGraduationCap} />
          </div>
          <div className="metric-content">
            <h3>Faculty</h3>
            <div className="metric-value">909</div>
            <div className="metric-trend">
              <span>339 staff</span> support
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Employee Distribution by Department */}
        <Card className="chart-card" title="Employee Distribution by Department">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.employeeStats.byDepartment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#4361ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Leave Trends */}
        <Card className="chart-card" title="Leave Trends (Last 6 Months)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.leaveStats.byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="leaves" stroke="#f72585" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Leave Types Distribution */}
        <Card className="chart-card" title="Leave Types Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.leaveStats.byType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {dashboardData.leaveStats.byType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Employee by Rank */}
        <Card className="chart-card" title="Employee by Academic Rank">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.employeeStats.byRank}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {dashboardData.employeeStats.byRank.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom Grid - Tasks and Events */}
      <div className="bottom-grid">
        {/* Pending Tasks */}
        <Card className="tasks-card" title="Pending Tasks">
          <div className="tasks-list">
            {dashboardData.pendingTasks.map(task => (
              <div key={task.id} className="task-item">
                <div className="task-info">
                  <h4>{task.task}</h4>
                  <p>Due: {new Date(task.due).toLocaleDateString()}</p>
                </div>
                <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
          {hasPermission('ViewAllTasks') && (
            <Button variant="link" className="view-all">
              View All Tasks <FontAwesomeIcon icon={faBriefcase} />
            </Button>
          )}
        </Card>

        {/* Upcoming Events */}
        <Card className="events-card" title="Upcoming Events">
          <div className="events-list">
            {dashboardData.upcomingEvents.map(event => (
              <div key={event.id} className="event-item">
                <div className="event-date">
                  <span className="day">{new Date(event.date).getDate()}</span>
                  <span className="month">
                    {new Date(event.date).toLocaleString('default', { month: 'short' })}
                  </span>
                </div>
                <div className="event-info">
                  <h4>{event.title}</h4>
                  <p>{event.type}</p>
                </div>
                <span className={`event-type ${event.type.toLowerCase()}`}>
                  {event.type}
                </span>
              </div>
            ))}
          </div>
          <Button variant="link" className="view-all">
            View Calendar <FontAwesomeIcon icon={faBell} />
          </Button>
        </Card>

        {/* Recent Notifications */}
        <Card className="notifications-card" title="Recent Notifications">
          <div className="notifications-list">
            <div className="notification-item unread">
              <FontAwesomeIcon icon={faBell} className="icon" />
              <div className="notification-content">
                <p>5 new leave requests pending</p>
                <small>5 minutes ago</small>
              </div>
            </div>
            <div className="notification-item">
              <FontAwesomeIcon icon={faUserPlus} className="icon" />
              <div className="notification-content">
                <p>New employee onboarding completed</p>
                <small>1 hour ago</small>
              </div>
            </div>
            <div className="notification-item">
              <FontAwesomeIcon icon={faMoneyBillWave} className="icon" />
              <div className="notification-content">
                <p>Payroll for March processed</p>
                <small>3 hours ago</small>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;