import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave,
 
  faFileInvoice,
  faDownload,
  faChartLine,
  faUsers,
  faClock,
  faCheckCircle,
  faHourglassHalf,
} from '@fortawesome/free-solid-svg-icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useNotification } from '../../hooks/useNotification';
import { usePermissions } from '../../hooks/usePermissions';
import { formatCurrency } from '../../utils/formatters';

interface PayrollSummary {
  totalPayroll: number;
  processedCount: number;
  pendingCount: number;
  averageSalary: number;
  departmentWise: {
    department: string;
    amount: number;
    count: number;
  }[];
  monthlyTrend: {
    month: string;
    amount: number;
  }[];
}

interface PendingFlag {
  id: number;
  employeeName: string;
  employeeId: string;
  month: number;
  year: number;
  amount: number;
  issue: string;
  raisedBy: string;
  raisedOn: string;
}

const AccountantDashboard: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [pendingFlags, setPendingFlags] = useState<PendingFlag[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2024, 2023, 2022, 2021, 2020];

  const COLORS = ['#4361ee', '#f72585', '#4cc9f0', '#f8961e', '#7209b7', '#10b981'];

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  const fetchDashboardData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSummary({
        totalPayroll: 12500000,
        processedCount: 142,
        pendingCount: 23,
        averageSalary: 85000,
        departmentWise: [
          { department: 'Computer Science', amount: 2850000, count: 156 },
          { department: 'Mathematics', amount: 1650000, count: 98 },
          { department: 'Physics', amount: 1520000, count: 87 },
          { department: 'Chemistry', amount: 1380000, count: 76 },
          { department: 'Biology', amount: 1420000, count: 82 },
          { department: 'Administration', amount: 3680000, count: 245 },
        ],
        monthlyTrend: [
          { month: 'Jan', amount: 11800000 },
          { month: 'Feb', amount: 11950000 },
          { month: 'Mar', amount: 12100000 },
          { month: 'Apr', amount: 12250000 },
          { month: 'May', amount: 12400000 },
          { month: 'Jun', amount: 12500000 },
        ],
      });

      setPendingFlags([
        {
          id: 1,
          employeeName: 'John Doe',
          employeeId: 'EMP001',
          month: 2,
          year: 2024,
          amount: 85000,
          issue: 'Overtime calculation mismatch',
          raisedBy: 'HR Admin',
          raisedOn: '2024-03-01',
        },
        {
          id: 2,
          employeeName: 'Jane Smith',
          employeeId: 'EMP002',
          month: 2,
          year: 2024,
          amount: 75000,
          issue: 'Missing tax deduction',
          raisedBy: 'System',
          raisedOn: '2024-03-02',
        },
        {
          id: 3,
          employeeName: 'Rahul Kumar',
          employeeId: 'EMP003',
          month: 2,
          year: 2024,
          amount: 65000,
          issue: 'Duplicate entry',
          raisedBy: 'HR Admin',
          raisedOn: '2024-03-02',
        },
      ]);

      setLoading(false);
    }, 1000);
  };

  const handleProcessPayroll = () => {
    showNotification('Payroll processing started', 'info');
    // Navigate to process payroll page
  };

  const handleExportReport = () => {
    showNotification('Report exported successfully', 'success');
  };

  const handleResolveFlag = (id: number) => {
    setPendingFlags(pendingFlags.filter(flag => flag.id !== id));
    showNotification('Issue resolved', 'success');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading accountant dashboard...</p>
      </div>
    );
  }

  return (
    <div className="accountant-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <h1>Accountant Dashboard</h1>
          <p>Payroll & Financial Overview • {months[selectedMonth - 1]} {selectedYear}</p>
        </div>
        <div className="header-actions">
          <div className="month-selector">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="filter-select"
            >
              {months.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="filter-select"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <Button variant="primary" onClick={handleProcessPayroll}>
            <FontAwesomeIcon icon={faMoneyBillWave} /> Process Payroll
          </Button>
          <Button variant="secondary" onClick={handleExportReport}>
            <FontAwesomeIcon icon={faDownload} /> Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <Card className="metric-card">
          <div className="metric-icon purple">
            <FontAwesomeIcon icon={faMoneyBillWave} />
          </div>
          <div className="metric-content">
            <h3>Total Payroll</h3>
            <div className="metric-value">{formatCurrency(summary?.totalPayroll || 0)}</div>
            <div className="metric-trend">
              <span className="positive">↑ 5.2%</span> from last month
            </div>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon green">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="metric-content">
            <h3>Processed</h3>
            <div className="metric-value">{summary?.processedCount}</div>
            <div className="metric-sub">employees paid</div>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon orange">
            <FontAwesomeIcon icon={faHourglassHalf} />
          </div>
          <div className="metric-content">
            <h3>Pending</h3>
            <div className="metric-value">{summary?.pendingCount}</div>
            <div className="metric-sub">awaiting processing</div>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon blue">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="metric-content">
            <h3>Average Salary</h3>
            <div className="metric-value">{formatCurrency(summary?.averageSalary || 0)}</div>
            <div className="metric-sub">per employee</div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Payroll Trend */}
        <Card className="chart-card" title="Monthly Payroll Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={summary?.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `₹${(value / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#4361ee" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Department-wise Payroll */}
        <Card className="chart-card" title="Payroll by Department">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summary?.departmentWise}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="department" />
              <YAxis tickFormatter={(value) => `₹${(value / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="amount" fill="#4361ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Department Distribution */}
        <Card className="chart-card" title="Payroll Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={summary?.departmentWise}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="amount"
              >
                {summary?.departmentWise.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Quick Stats */}
        <Card className="stats-card" title="Quick Stats">
          <div className="quick-stats">
            <div className="stat-row">
              <span>Highest Payroll Dept:</span>
              <strong>Administration (₹3.68M)</strong>
            </div>
            <div className="stat-row">
              <span>Lowest Payroll Dept:</span>
              <strong>Chemistry (₹1.38M)</strong>
            </div>
            <div className="stat-row">
              <span>Total Employees:</span>
              <strong>744</strong>
            </div>
            <div className="stat-row">
              <span>PF Deductions:</span>
              <strong>₹1,250,000</strong>
            </div>
            <div className="stat-row">
              <span>TDS Deductions:</span>
              <strong>₹875,000</strong>
            </div>
            <div className="stat-row">
              <span>Next Payroll Date:</span>
              <strong>30 Mar 2024</strong>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Flags Section */}
      <Card className="flags-card" title="Pending Issues for Review">
        {pendingFlags.length > 0 ? (
          <div className="flags-list">
            <table className="flags-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Issue</th>
                  <th>Raised By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingFlags.map(flag => (
                  <tr key={flag.id}>
                    <td>
                      <div>
                        <strong>{flag.employeeName}</strong>
                        <br />
                        <small>{flag.employeeId}</small>
                      </div>
                    </td>
                    <td>{months[flag.month - 1]} {flag.year}</td>
                    <td>{formatCurrency(flag.amount)}</td>
                    <td>
                      <span className="issue-tag">{flag.issue}</span>
                    </td>
                    <td>{flag.raisedBy}</td>
                    <td>{new Date(flag.raisedOn).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn view"
                          onClick={() => {/* View details */}}
                          title="View Details"
                        >
                          <FontAwesomeIcon icon={faFileInvoice} />
                        </button>
                        <button
                          className="action-btn approve"
                          onClick={() => handleResolveFlag(flag.id)}
                          title="Resolve"
                        >
                          <FontAwesomeIcon icon={faCheckCircle} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-flags">
            <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
            <p>No pending issues to review</p>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <Link to="/accountant/payroll/process" className="action-card">
            <div className="action-icon blue">
              <FontAwesomeIcon icon={faMoneyBillWave} />
            </div>
            <span>Process Payroll</span>
          </Link>
          <Link to="/accountant/reports" className="action-card">
            <div className="action-icon green">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <span>Generate Reports</span>
          </Link>
          <Link to="/accountant/tax" className="action-card">
            <div className="action-icon orange">
              <FontAwesomeIcon icon={faFileInvoice} />
            </div>
            <span>Tax Management</span>
          </Link>
          <Link to="/accountant/salary-history" className="action-card">
            <div className="action-icon purple">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <span>Salary History</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;