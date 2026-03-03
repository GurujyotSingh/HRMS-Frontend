import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {

  faDownload,

} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Chart from '../../../components/ui/Chart';
import { useNotification } from '../../../hooks/useNotification';
import { formatDate } from '../../../utils/formatters';
import { exportToCSV } from '../../../utils/exportUtils';

interface AttendanceRecord {
  date: string;
  checkIn: string;
  checkOut: string;
  hours: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'Leave';
  overtime?: number;
}

const MyAttendance: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    totalHours: 0,
    averageHours: 0,
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2024, 2023, 2022, 2021, 2020];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockRecords: AttendanceRecord[] = [
        { date: '2024-03-01', checkIn: '09:00', checkOut: '18:00', hours: 9, status: 'Present' },
        { date: '2024-03-02', checkIn: '08:55', checkOut: '18:05', hours: 9.17, status: 'Present' },
        { date: '2024-03-03', checkIn: '09:15', checkOut: '18:00', hours: 8.75, status: 'Late' },
        { date: '2024-03-04', checkIn: '09:00', checkOut: '17:30', hours: 8.5, status: 'Present' },
        { date: '2024-03-05', checkIn: '09:00', checkOut: '19:00', hours: 10, status: 'Present', overtime: 1 },
        { date: '2024-03-06', checkIn: '08:45', checkOut: '18:00', hours: 9.25, status: 'Present' },
        { date: '2024-03-07', checkIn: '09:30', checkOut: '18:00', hours: 8.5, status: 'Late' },
        { date: '2024-03-08', checkIn: '09:00', checkOut: '18:00', hours: 9, status: 'Present' },
        { date: '2024-03-09', checkIn: '-', checkOut: '-', hours: 0, status: 'Absent' },
        { date: '2024-03-10', checkIn: '-', checkOut: '-', hours: 0, status: 'Leave' },
      ];

      setRecords(mockRecords);
      filterRecords(mockRecords, selectedMonth, selectedYear);
      calculateSummary(mockRecords);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    filterRecords(records, selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, records]);

  const filterRecords = (records: AttendanceRecord[], month: number, year: number) => {
    const filtered = records.filter(record => {
      const date = new Date(record.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      // Add search logic if needed
    }

    setFilteredRecords(filtered);
    calculateSummary(filtered);
  };

  const calculateSummary = (records: AttendanceRecord[]) => {
    const summary = {
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      late: records.filter(r => r.status === 'Late').length,
      leave: records.filter(r => r.status === 'Leave').length,
      totalHours: records.reduce((sum, r) => sum + r.hours, 0),
      averageHours: 0,
    };
    summary.averageHours = records.length > 0 ? summary.totalHours / records.length : 0;
    setSummary(summary);
  };

  const handleExport = () => {
    const exportData = filteredRecords.map(r => ({
      Date: formatDate(r.date),
      'Check In': r.checkIn,
      'Check Out': r.checkOut,
      'Total Hours': r.hours.toFixed(2),
      Status: r.status,
      Overtime: r.overtime || 0,
    }));
    exportToCSV(exportData, `attendance_${months[selectedMonth]}_${selectedYear}.csv`);
    showNotification('Attendance data exported successfully', 'success');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Present: { bg: '#10b98120', color: '#10b981' },
      Absent: { bg: '#ef444420', color: '#ef4444' },
      Late: { bg: '#f59e0b20', color: '#f59e0b' },
      'Half-Day': { bg: '#f59e0b20', color: '#f59e0b' },
      Leave: { bg: '#3b82f620', color: '#3b82f6' },
    };
    const style = styles[status as keyof typeof styles] || styles.Present;

    return (
      <span className="status-badge" style={{ backgroundColor: style.bg, color: style.color }}>
        {status}
      </span>
    );
  };

  const chartData = filteredRecords.map(r => ({
    date: new Date(r.date).getDate(),
    hours: r.hours,
  }));

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading attendance records...</p>
      </div>
    );
  }

  return (
    <div className="my-attendance-page">
      <div className="page-header">
        <h1>My Attendance</h1>
        <p>View and track your attendance history</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <Card className="summary-card">
          <h3>Present</h3>
          <p className="value success">{summary.present}</p>
        </Card>
        <Card className="summary-card">
          <h3>Absent</h3>
          <p className="value danger">{summary.absent}</p>
        </Card>
        <Card className="summary-card">
          <h3>Late</h3>
          <p className="value warning">{summary.late}</p>
        </Card>
        <Card className="summary-card">
          <h3>Leave</h3>
          <p className="value info">{summary.leave}</p>
        </Card>
        <Card className="summary-card">
          <h3>Total Hours</h3>
          <p className="value">{summary.totalHours.toFixed(1)}h</p>
        </Card>
        <Card className="summary-card">
          <h3>Avg Hours</h3>
          <p className="value">{summary.averageHours.toFixed(1)}h</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="filter-select"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Year</label>
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

          <Button variant="secondary" onClick={handleExport} className="export-btn">
            <FontAwesomeIcon icon={faDownload} /> Export
          </Button>
        </div>
      </Card>

      {/* Chart */}
      <Card className="chart-card" title="Daily Hours">
        <Chart
          type="bar"
          data={chartData}
          xAxisKey="date"
          dataKeys={['hours']}
          colors={['#4361ee']}
          height={300}
        />
      </Card>

      {/* Attendance Table */}
      <Card className="table-card" title="Attendance Records">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Total Hours</th>
              <th>Status</th>
              <th>Overtime</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record, index) => (
              <tr key={index}>
                <td>{formatDate(record.date)}</td>
                <td>{record.checkIn}</td>
                <td>{record.checkOut}</td>
                <td>{record.hours.toFixed(2)}h</td>
                <td>{getStatusBadge(record.status)}</td>
                <td>{record.overtime ? `${record.overtime}h` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Statistics */}
      <div className="stats-grid">
        <Card className="stat-card" title="Attendance Rate">
          <div className="stat-circle">
            <svg viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e9ecef"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#4361ee"
                strokeWidth="3"
                strokeDasharray={`${(summary.present / (summary.present + summary.absent + summary.late)) * 100}, 100`}
              />
              <text x="18" y="20.35" className="percentage">
                {((summary.present / (summary.present + summary.absent + summary.late)) * 100).toFixed(0)}%
              </text>
            </svg>
          </div>
        </Card>

        <Card className="stat-card" title="Monthly Comparison">
          <Chart
            type="line"
            data={[
              { month: 'Jan', hours: 175 },
              { month: 'Feb', hours: 168 },
              { month: 'Mar', hours: 182 },
            ]}
            xAxisKey="month"
            dataKeys={['hours']}
            colors={['#f72585']}
            height={200}
          />
        </Card>
      </div>
    </div>
  );
};

export default MyAttendance;