import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faDownload,
  faCheck,
  faTimes,
  faClock,
  faUser,
  faExclamationTriangle,
  faEdit,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Attendance } from '../../../types/attendance';
import { formatDate, formatTime } from '../../../utils/formatters';
import { exportToCSV } from '../../../utils/exportUtils';

const AttendanceLogs: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    clockIn: '',
    clockOut: '',
    notes: '',
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockAttendance: Attendance[] = [
        {
          attendance_id: 1,
          employee_id: 1,
          employee: { emp_id: 1, name: 'John Doe', department: 'Computer Science' },
          date: '2024-03-01',
          clock_in: '09:00',
          clock_out: '18:00',
          total_hours: 9,
          status: 'Present',
        },
        {
          attendance_id: 2,
          employee_id: 2,
          employee: { emp_id: 2, name: 'Jane Smith', department: 'Mathematics' },
          date: '2024-03-01',
          clock_in: '09:15',
          clock_out: '18:00',
          total_hours: 8.75,
          status: 'Late',
        },
        {
          attendance_id: 3,
          employee_id: 3,
          employee: { emp_id: 3, name: 'Rahul Kumar', department: 'Physics' },
          date: '2024-03-01',
          clock_in: '08:45',
          clock_out: '17:30',
          total_hours: 8.75,
          status: 'Present',
        },
        {
          attendance_id: 4,
          employee_id: 4,
          employee: { emp_id: 4, name: 'Priya Sharma', department: 'Chemistry' },
          date: '2024-03-01',
          clock_in: null,
          clock_out: null,
          total_hours: 0,
          status: 'Absent',
        },
        {
          attendance_id: 5,
          employee_id: 1,
          employee: { emp_id: 1, name: 'John Doe', department: 'Computer Science' },
          date: '2024-03-02',
          clock_in: '09:00',
          clock_out: '18:30',
          total_hours: 9.5,
          status: 'Present',
          overtime_hours: 0.5,
        },
      ];
      setAttendance(mockAttendance);
      setFilteredAttendance(mockAttendance);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = attendance;

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employee?.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(a => a.date === dateFilter);
    }

    if (departmentFilter !== 'All') {
      filtered = filtered.filter(a => a.employee?.department === departmentFilter);
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    setFilteredAttendance(filtered);
  }, [searchTerm, dateFilter, departmentFilter, statusFilter, attendance]);

  const handleEdit = () => {
    if (!selectedRecord) return;

    // Simulate API call
    setTimeout(() => {
      showNotification('Attendance record updated successfully', 'success');
      setShowEditModal(false);
      setSelectedRecord(null);
    }, 1000);
  };

  const handleExport = () => {
    const exportData = filteredAttendance.map(a => ({
      'Employee': a.employee?.name,
      'Department': a.employee?.department,
      'Date': a.date,
      'Clock In': a.clock_in || '-',
      'Clock Out': a.clock_out || '-',
      'Total Hours': a.total_hours,
      'Status': a.status,
      'Overtime': a.overtime_hours || 0,
    }));
    exportToCSV(exportData, `attendance_${dateFilter}.csv`);
    showNotification('Data exported successfully', 'success');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Present: { bg: '#10b98120', color: '#10b981' },
      Absent: { bg: '#ef444420', color: '#ef4444' },
      Late: { bg: '#f59e0b20', color: '#f59e0b' },
      'Half-Day': { bg: '#f59e0b20', color: '#f59e0b' },
      Holiday: { bg: '#3b82f620', color: '#3b82f6' },
      Leave: { bg: '#8b5cf620', color: '#8b5cf6' },
    };
    const style = styles[status as keyof typeof styles] || styles.Present;

    return (
      <span className="status-badge" style={{ backgroundColor: style.bg, color: style.color }}>
        {status}
      </span>
    );
  };

  const departments = ['All', ...new Set(attendance.map(a => a.employee?.department).filter(Boolean))];
  const statuses = ['All', 'Present', 'Absent', 'Late', 'Half-Day', 'Holiday', 'Leave'];

  const columns = [
    {
      key: 'employee',
      title: 'Employee',
      render: (row: Attendance) => (
        <div className="employee-cell">
          <div className="employee-avatar">
            <FontAwesomeIcon icon={faUser} />
          </div>
          <div>
            <div className="employee-name">{row.employee?.name}</div>
            <small>{row.employee?.department}</small>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      title: 'Date',
      render: (row: Attendance) => formatDate(row.date),
    },
    {
      key: 'clockIn',
      title: 'Clock In',
      render: (row: Attendance) => row.clock_in ? formatTime(row.clock_in) : '-',
    },
    {
      key: 'clockOut',
      title: 'Clock Out',
      render: (row: Attendance) => row.clock_out ? formatTime(row.clock_out) : '-',
    },
    {
      key: 'totalHours',
      title: 'Total Hours',
      render: (row: Attendance) => row.total_hours ? `${row.total_hours}h` : '-',
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: Attendance) => getStatusBadge(row.status),
    },
    {
      key: 'overtime',
      title: 'Overtime',
      render: (row: Attendance) => row.overtime_hours ? `${row.overtime_hours}h` : '-',
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: Attendance) => (
        <button
          className="action-btn edit"
          onClick={() => {
            setSelectedRecord(row);
            setEditForm({
              clockIn: row.clock_in || '',
              clockOut: row.clock_out || '',
              notes: row.notes || '',
            });
            setShowEditModal(true);
          }}
          title="Edit"
        >
          <FontAwesomeIcon icon={faEdit} />
        </button>
      ),
    },
  ];

  const stats = {
    present: attendance.filter(a => a.status === 'Present').length,
    absent: attendance.filter(a => a.status === 'Absent').length,
    late: attendance.filter(a => a.status === 'Late').length,
    totalHours: attendance.reduce((sum, a) => sum + (a.total_hours || 0), 0),
  };

  return (
    <div className="attendance-logs-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Attendance Logs</h1>
          <p>Track employee attendance and working hours</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={handleExport}>
            <FontAwesomeIcon icon={faDownload} /> Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon green">
            <FontAwesomeIcon icon={faCheck} />
          </div>
          <div className="stat-info">
            <h3>{stats.present}</h3>
            <p>Present Today</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon red">
            <FontAwesomeIcon icon={faTimes} />
          </div>
          <div className="stat-info">
            <h3>{stats.absent}</h3>
            <p>Absent Today</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon orange">
            <FontAwesomeIcon icon={faExclamationTriangle} />
          </div>
          <div className="stat-info">
            <h3>{stats.late}</h3>
            <p>Late Today</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon blue">
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalHours.toFixed(1)}h</h3>
            <p>Total Hours</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-grid">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search by employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-date"
          />

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="filter-select"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setDateFilter(new Date().toISOString().split('T')[0]);
            setDepartmentFilter('All');
            setStatusFilter('All');
          }}>
            <FontAwesomeIcon icon={faTimes} /> Clear
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          data={filteredAttendance}
          loading={loading}
        />
      </Card>

      {/* Edit Modal */}
      {selectedRecord && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRecord(null);
          }}
          title="Edit Attendance Record"
          size="medium"
        >
          <div className="edit-attendance-modal">
            <div className="employee-info">
              <h4>{selectedRecord.employee?.name}</h4>
              <p>{selectedRecord.employee?.department} • {formatDate(selectedRecord.date)}</p>
            </div>

            <div className="form-group">
              <label>Clock In Time</label>
              <input
                type="time"
                className="form-control"
                value={editForm.clockIn}
                onChange={(e) => setEditForm({ ...editForm, clockIn: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Clock Out Time</label>
              <input
                type="time"
                className="form-control"
                value={editForm.clockOut}
                onChange={(e) => setEditForm({ ...editForm, clockOut: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                className="form-control"
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Add any notes about this attendance record..."
              />
            </div>

            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AttendanceLogs;