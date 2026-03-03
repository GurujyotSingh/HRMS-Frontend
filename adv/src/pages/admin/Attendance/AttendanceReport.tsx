import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faPrint,
  faChartBar,
  faCalendarAlt,
  faUsers,
  faClock,
  faCheckCircle,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Chart from '../../../components/ui/Chart';
import { useNotification } from '../../../hooks/useNotification';
import { exportToPDF } from '../../../utils/exportUtils';

interface DepartmentStats {
  department: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

const AttendanceReport: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalEmployees: 248,
    totalPresent: 189,
    totalAbsent: 32,
    totalLate: 27,
    averageHours: 7.8,
    attendanceRate: 76.2,
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setDepartmentStats([
        { department: 'Computer Science', present: 142, absent: 8, late: 6, total: 156, percentage: 91.0 },
        { department: 'Mathematics', present: 86, absent: 7, late: 5, total: 98, percentage: 87.8 },
        { department: 'Physics', present: 74, absent: 8, late: 5, total: 87, percentage: 85.1 },
        { department: 'Chemistry', present: 64, absent: 7, late: 5, total: 76, percentage: 84.2 },
        { department: 'Biology', present: 70, absent: 7, late: 5, total: 82, percentage: 85.4 },
        { department: 'Administration', present: 218, absent: 15, late: 12, total: 245, percentage: 89.0 },
      ]);

      setTrendData([
        { month: 'Jan', attendance: 92 },
        { month: 'Feb', attendance: 94 },
        { month: 'Mar', attendance: 93 },
        { month: 'Apr', attendance: 95 },
        { month: 'May', attendance: 96 },
        { month: 'Jun', attendance: 94 },
      ]);

      setLoading(false);
    }, 1500);
  }, []);

  const handleExportPDF = () => {
    exportToPDF('attendance-report', 'Attendance Report');
    showNotification('Report exported as PDF', 'success');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Generating report...</p>
      </div>
    );
  }

  return (
    <div className="attendance-report-page" id="attendance-report">
      <div className="page-header">
        <div className="header-left">
          <h1>Attendance Report</h1>
          <p>Comprehensive attendance analysis</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={handleExportPDF}>
            <FontAwesomeIcon icon={faDownload} /> PDF
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <FontAwesomeIcon icon={faPrint} /> Print
          </Button>
        </div>
      </div>

      {/* Date Range */}
      <Card className="date-range-card">
        <div className="date-range-picker">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              className="form-control"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              className="form-control"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <Button variant="primary" className="generate-btn">
            Generate Report
          </Button>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="summary-cards">
        <Card className="summary-card">
          <div className="card-icon blue">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="card-content">
            <h3>Total Employees</h3>
            <p className="value">{summary.totalEmployees}</p>
          </div>
        </Card>
        <Card className="summary-card">
          <div className="card-icon green">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="card-content">
            <h3>Present</h3>
            <p className="value">{summary.totalPresent}</p>
            <small>{((summary.totalPresent / summary.totalEmployees) * 100).toFixed(1)}%</small>
          </div>
        </Card>
        <Card className="summary-card">
          <div className="card-icon red">
            <FontAwesomeIcon icon={faExclamationTriangle} />
          </div>
          <div className="card-content">
            <h3>Absent</h3>
            <p className="value">{summary.totalAbsent}</p>
            <small>{((summary.totalAbsent / summary.totalEmployees) * 100).toFixed(1)}%</small>
          </div>
        </Card>
        <Card className="summary-card">
          <div className="card-icon orange">
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className="card-content">
            <h3>Late</h3>
            <p className="value">{summary.totalLate}</p>
            <small>{((summary.totalLate / summary.totalEmployees) * 100).toFixed(1)}%</small>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <Card className="chart-card" title="Attendance Trend">
          <Chart
            type="line"
            data={trendData}
            xAxisKey="month"
            dataKeys={['attendance']}
            colors={['#4361ee']}
            height={300}
          />
        </Card>

        <Card className="chart-card" title="Attendance by Department">
          <Chart
            type="bar"
            data={departmentStats}
            xAxisKey="department"
            dataKeys={['present', 'absent', 'late']}
            colors={['#10b981', '#ef4444', '#f59e0b']}
            height={300}
          />
        </Card>
      </div>

      {/* Department-wise Table */}
      <Card className="table-card" title="Department-wise Attendance">
        <table className="report-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Total</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
              <th>Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {departmentStats.map((dept, index) => (
              <tr key={index}>
                <td>{dept.department}</td>
                <td>{dept.total}</td>
                <td className="text-success">{dept.present}</td>
                <td className="text-danger">{dept.absent}</td>
                <td className="text-warning">{dept.late}</td>
                <td>
                  <div className="progress-cell">
                    <span>{dept.percentage}%</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${dept.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default AttendanceReport;