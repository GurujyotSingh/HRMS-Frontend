import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  
  faUsers,
  faMoneyBill,
  faChartLine,
  faChartBar,
  faChartPie,
  faFilePdf,
  faFileExcel,
  faPrint,
  
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Chart from '../../../components/ui/Chart';
import { useNotification } from '../../../hooks/useNotification';

import type { AnalyticsData } from '../../../types/report';
import { formatCurrency, formatNumber } from '../../../utils/formatters';
import { exportToCSV, exportToPDF } from '../../../utils/exportUtils';

const Analytics: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockData: AnalyticsData = {
        total_employees: 1248,
        active_employees: 1185,
        new_hires: 45,
        turnover_rate: 8.5,
        leave_utilization: {
          annual: 156,
          sick: 89,
          personal: 45,
          maternity: 12,
          paternity: 8,
          study: 23,
        },
        attendance_rate: 94.2,
        payroll_total: 12500000,
        department_stats: {
          'Computer Science': { employees: 156, budget: 5000000, utilization: 92 },
          'Mathematics': { employees: 98, budget: 3500000, utilization: 88 },
          'Physics': { employees: 87, budget: 4200000, utilization: 85 },
          'Chemistry': { employees: 76, budget: 3800000, utilization: 87 },
          'Biology': { employees: 82, budget: 4000000, utilization: 86 },
          'Administration': { employees: 245, budget: 8500000, utilization: 94 },
        },
        trends: [
          { period: 'Jan', metric: 'attendance', value: 92 },
          { period: 'Feb', metric: 'attendance', value: 94 },
          { period: 'Mar', metric: 'attendance', value: 93 },
          { period: 'Apr', metric: 'attendance', value: 95 },
          { period: 'May', metric: 'attendance', value: 96 },
          { period: 'Jun', metric: 'attendance', value: 94 },
        ],
      };
      setAnalyticsData(mockData);
      setLoading(false);
    }, 1500);
  }, [dateRange]);

  const handleExportPDF = () => {
    exportToPDF('analytics-report', 'HR Analytics Report');
    showNotification('Report exported as PDF', 'success');
  };

  const handleExportCSV = () => {
    if (!analyticsData) return;
    
    const data = [
      ['Metric', 'Value'],
      ['Total Employees', analyticsData.total_employees],
      ['Active Employees', analyticsData.active_employees],
      ['New Hires', analyticsData.new_hires],
      ['Turnover Rate', `${analyticsData.turnover_rate}%`],
      ['Attendance Rate', `${analyticsData.attendance_rate}%`],
      ['Total Payroll', formatCurrency(analyticsData.payroll_total)],
    ];
    
    exportToCSV(data, 'analytics_data.csv');
    showNotification('Data exported as CSV', 'success');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (!analyticsData) return null;

  // Prepare chart data
  const departmentData = Object.entries(analyticsData.department_stats).map(([name, stats]) => ({
    department: name,
    employees: stats.employees,
    budget: stats.budget / 1000000, // Convert to millions
    utilization: stats.utilization,
  }));

  const leaveData = Object.entries(analyticsData.leave_utilization).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count,
  }));

  return (
    <div className="analytics-page" id="analytics-report">
      <div className="page-header">
        <div className="header-left">
          <h1>HR Analytics</h1>
          <p>Comprehensive insights and metrics</p>
        </div>
        <div className="header-actions">
          <div className="date-range">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="date-input"
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="date-input"
            />
          </div>
          <Button variant="secondary" onClick={handleExportCSV}>
            <FontAwesomeIcon icon={faFileExcel} /> CSV
          </Button>
          <Button variant="secondary" onClick={handleExportPDF}>
            <FontAwesomeIcon icon={faFilePdf} /> PDF
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <FontAwesomeIcon icon={faPrint} /> Print
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <Card className="metric-card">
          <div className="metric-icon blue">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="metric-content">
            <h3>Total Employees</h3>
            <p className="metric-value">{formatNumber(analyticsData.total_employees)}</p>
            <p className="metric-sub">{analyticsData.active_employees} active</p>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon green">
            <FontAwesomeIcon icon={faChartLine} />
          </div>
          <div className="metric-content">
            <h3>New Hires</h3>
            <p className="metric-value">{formatNumber(analyticsData.new_hires)}</p>
            <p className="metric-sub">This period</p>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon orange">
            <FontAwesomeIcon icon={faChartBar} />
          </div>
          <div className="metric-content">
            <h3>Turnover Rate</h3>
            <p className="metric-value">{analyticsData.turnover_rate}%</p>
            <p className="metric-sub">Annual rate</p>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon purple">
            <FontAwesomeIcon icon={faMoneyBill} />
          </div>
          <div className="metric-content">
            <h3>Total Payroll</h3>
            <p className="metric-value">{formatCurrency(analyticsData.payroll_total / 10000000)}Cr</p>
            <p className="metric-sub">Monthly</p>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon teal">
            <FontAwesomeIcon icon={faChartPie} />
          </div>
          <div className="metric-content">
            <h3>Attendance Rate</h3>
            <p className="metric-value">{analyticsData.attendance_rate}%</p>
            <p className="metric-sub">Average</p>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <Card className="chart-card" title="Attendance Trend">
          <Chart
            type="line"
            data={analyticsData.trends}
            xAxisKey="period"
            dataKeys={['value']}
            colors={['#4361ee']}
            height={300}
          />
        </Card>

        <Card className="chart-card" title="Department-wise Employees">
          <Chart
            type="bar"
            data={departmentData}
            xAxisKey="department"
            dataKeys={['employees']}
            colors={['#f72585']}
            height={300}
          />
        </Card>

        <Card className="chart-card" title="Leave Utilization">
          <Chart
            type="pie"
            data={leaveData}
            dataKeys={['count']}
            colors={['#4361ee', '#f72585', '#4cc9f0', '#f8961e', '#7209b7', '#10b981']}
            height={300}
          />
        </Card>

        <Card className="chart-card" title="Department Budget (in Millions)">
          <Chart
            type="bar"
            data={departmentData}
            xAxisKey="department"
            dataKeys={['budget']}
            colors={['#4cc9f0']}
            height={300}
          />
        </Card>
      </div>

      {/* Department Performance Table */}
      <Card className="table-card" title="Department Performance">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Employees</th>
              <th>Budget (₹)</th>
              <th>Utilization</th>
              <th>Attendance</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            {departmentData.map((dept, index) => (
              <tr key={index}>
                <td>{dept.department}</td>
                <td>{formatNumber(dept.employees)}</td>
                <td>{formatCurrency(dept.budget * 1000000)}</td>
                <td>
                  <div className="progress-cell">
                    <span>{dept.utilization}%</span>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${dept.utilization}%` }}></div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${dept.utilization > 90 ? 'success' : dept.utilization > 80 ? 'warning' : 'danger'}`}>
                    {dept.utilization > 90 ? 'Excellent' : dept.utilization > 80 ? 'Good' : 'Needs Improvement'}
                  </span>
                </td>
                <td>
                  <span className="rating">
                    {[...Array(5)].map((_, i) => (
                      <FontAwesomeIcon
                        key={i}
                        icon={faStar}
                        className={i < Math.floor(dept.utilization / 20) ? 'star-filled' : 'star-empty'}
                      />
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Summary Cards */}
      <div className="summary-section">
        <Card className="summary-card" title="Key Insights">
          <ul className="insights-list">
            <li className="insight positive">
              <FontAwesomeIcon icon={faChartLine} />
              <div>
                <strong>Attendance improved by 2.3%</strong>
                <p>Compared to last month</p>
              </div>
            </li>
            <li className="insight warning">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <div>
                <strong>High turnover in Physics department</strong>
                <p>12% turnover rate this quarter</p>
              </div>
            </li>
            <li className="insight info">
              <FontAwesomeIcon icon={faUsers} />
              <div>
                <strong>5 new hires in Computer Science</strong>
                <p>Department growing rapidly</p>
              </div>
            </li>
            <li className="insight success">
              <FontAwesomeIcon icon={faMoneyBill} />
              <div>
                <strong>Payroll budget utilization at 94%</strong>
                <p>Within target range</p>
              </div>
            </li>
          </ul>
        </Card>

        <Card className="summary-card" title="Quick Stats">
          <div className="quick-stats">
            <div className="stat-row">
              <span>Average Salary</span>
              <strong>{formatCurrency(analyticsData.payroll_total / analyticsData.total_employees)}</strong>
            </div>
            <div className="stat-row">
              <span>Male/Female Ratio</span>
              <strong>58:42</strong>
            </div>
            <div className="stat-row">
              <span>Average Tenure</span>
              <strong>4.5 years</strong>
            </div>
            <div className="stat-row">
              <span>Promotions This Year</span>
              <strong>45</strong>
            </div>
            <div className="stat-row">
              <span>Open Positions</span>
              <strong>23</strong>
            </div>
            <div className="stat-row">
              <span>Training Completion</span>
              <strong>87%</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;