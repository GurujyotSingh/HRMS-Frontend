import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faCheck,
  faTimes,
  faEye,
  faDownload,
  faCalendarAlt,
  faUser,
  faClock,
  faCheckCircle,
  faHourglassHalf,
  faBan,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import type { LeaveApplication } from '../../../types/leave';
import { formatDate } from '../../../utils/formatters';
import { exportToCSV } from '../../../utils/exportUtils';

const LeaveRequests: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();
  
  const [requests, setRequests] = useState<LeaveApplication[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedRequest, setSelectedRequest] = useState<LeaveApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockRequests: LeaveApplication[] = [
        {
          leave_id: 1,
          employee_id: 1,
          employee: { emp_id: 1, name: 'John Doe', department: 'Computer Science' },
          leave_type_id: 1,
          leave_type: { type_id: 1, name: 'Annual Leave', days_allowed: 20 },
          start_date: '2024-03-15',
          end_date: '2024-03-20',
          days_applied: 6,
          reason: 'Family vacation',
          status: 'Pending',
          applied_on: '2024-03-01',
        },
        {
          leave_id: 2,
          employee_id: 2,
          employee: { emp_id: 2, name: 'Jane Smith', department: 'Mathematics' },
          leave_type_id: 2,
          leave_type: { type_id: 2, name: 'Sick Leave', days_allowed: 12 },
          start_date: '2024-03-10',
          end_date: '2024-03-12',
          days_applied: 3,
          reason: 'Flu',
          status: 'Approved',
          applied_on: '2024-03-05',
          approved_by: 5,
          approved_on: '2024-03-06',
        },
        {
          leave_id: 3,
          employee_id: 3,
          employee: { emp_id: 3, name: 'Rahul Kumar', department: 'Physics' },
          leave_type_id: 3,
          leave_type: { type_id: 3, name: 'Personal Leave', days_allowed: 5 },
          start_date: '2024-03-18',
          end_date: '2024-03-19',
          days_applied: 2,
          reason: 'Personal reasons',
          status: 'Rejected',
          applied_on: '2024-03-07',
          approved_by: 5,
          approved_on: '2024-03-08',
          comments: 'Insufficient team coverage',
        },
        {
          leave_id: 4,
          employee_id: 4,
          employee: { emp_id: 4, name: 'Priya Sharma', department: 'Chemistry' },
          leave_type_id: 4,
          leave_type: { type_id: 4, name: 'Maternity Leave', days_allowed: 90 },
          start_date: '2024-04-01',
          end_date: '2024-07-01',
          days_applied: 90,
          reason: 'Maternity leave',
          status: 'Approved',
          applied_on: '2024-02-15',
          approved_by: 5,
          approved_on: '2024-02-20',
        },
        {
          leave_id: 5,
          employee_id: 5,
          employee: { emp_id: 5, name: 'Amit Patel', department: 'Computer Science' },
          leave_type_id: 5,
          leave_type: { type_id: 5, name: 'Study Leave', days_allowed: 10 },
          start_date: '2024-03-25',
          end_date: '2024-04-05',
          days_applied: 10,
          reason: 'Conference attendance',
          status: 'Pending',
          applied_on: '2024-03-10',
        },
      ];
      setRequests(mockRequests);
      setFilteredRequests(mockRequests);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.employee?.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    if (typeFilter !== 'All') {
      filtered = filtered.filter(req => req.leave_type?.name === typeFilter);
    }

    if (dateRange.start) {
      filtered = filtered.filter(req => req.start_date >= dateRange.start);
    }

    if (dateRange.end) {
      filtered = filtered.filter(req => req.end_date <= dateRange.end);
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, dateRange, requests]);

  const handleAction = () => {
    if (!selectedRequest || !actionType) return;

    const updatedRequests = requests.map(req => {
      if (req.leave_id === selectedRequest.leave_id) {
        return {
          ...req,
          status: actionType === 'approve' ? 'Approved' : 'Rejected',
          approved_by: 1,
          approved_on: new Date().toISOString().split('T')[0],
          comments: actionComment || req.comments,
        };
      }
      return req;
    });

    setRequests(updatedRequests);
    setShowActionModal(false);
    setSelectedRequest(null);
    setActionType(null);
    setActionComment('');
    showNotification(
      `Leave request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`,
      'success'
    );
  };

  const handleExport = () => {
    const exportData = filteredRequests.map(req => ({
      'Employee': req.employee?.name,
      'Department': req.employee?.department,
      'Leave Type': req.leave_type?.name,
      'Start Date': req.start_date,
      'End Date': req.end_date,
      'Days': req.days_applied,
      'Status': req.status,
      'Applied On': req.applied_on,
    }));
    exportToCSV(exportData, 'leave_requests.csv');
    showNotification('Data exported successfully', 'success');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: { bg: '#f59e0b20', color: '#f59e0b', icon: faHourglassHalf },
      Approved: { bg: '#10b98120', color: '#10b981', icon: faCheckCircle },
      Rejected: { bg: '#ef444420', color: '#ef4444', icon: faBan },
      Cancelled: { bg: '#6b728020', color: '#6b7280', icon: faTimes },
    };
    const style = styles[status as keyof typeof styles] || styles.Pending;
    
    return (
      <span className="status-badge" style={{ backgroundColor: style.bg, color: style.color }}>
        <FontAwesomeIcon icon={style.icon} />
        {status}
      </span>
    );
  };

  const columns = [
    {
      key: 'employee',
      title: 'Employee',
      render: (row: LeaveApplication) => (
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
      key: 'leave_type',
      title: 'Leave Type',
      render: (row: LeaveApplication) => row.leave_type?.name,
    },
    {
      key: 'duration',
      title: 'Duration',
      render: (row: LeaveApplication) => (
        <div className="duration-cell">
          <div>{formatDate(row.start_date)} - {formatDate(row.end_date)}</div>
          <small>{row.days_applied} days</small>
        </div>
      ),
    },
    {
      key: 'reason',
      title: 'Reason',
      render: (row: LeaveApplication) => (
        <div className="reason-cell" title={row.reason}>
          {row.reason.length > 30 ? `${row.reason.substring(0, 30)}...` : row.reason}
        </div>
      ),
    },
    {
      key: 'applied_on',
      title: 'Applied On',
      render: (row: LeaveApplication) => formatDate(row.applied_on),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: LeaveApplication) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: LeaveApplication) => (
        <div className="action-buttons">
          <button
            className="action-btn view"
            onClick={() => {
              setSelectedRequest(row);
              setShowDetailsModal(true);
            }}
            title="View Details"
          >
            <FontAwesomeIcon icon={faEye} />
          </button>
          {row.status === 'Pending' && hasPermission('ApproveLeave') && (
            <>
              <button
                className="action-btn approve"
                onClick={() => {
                  setSelectedRequest(row);
                  setActionType('approve');
                  setShowActionModal(true);
                }}
                title="Approve"
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                className="action-btn reject"
                onClick={() => {
                  setSelectedRequest(row);
                  setActionType('reject');
                  setShowActionModal(true);
                }}
                title="Reject"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    rejected: requests.filter(r => r.status === 'Rejected').length,
    totalDays: requests.reduce((sum, r) => sum + r.days_applied, 0),
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  return (
    <div className="leave-requests-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Leave Requests</h1>
          <p>Manage employee leave applications</p>
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
          <div className="stat-icon blue">
            <FontAwesomeIcon icon={faCalendarAlt} />
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Requests</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon orange">
            <FontAwesomeIcon icon={faHourglassHalf} />
          </div>
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon green">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="stat-info">
            <h3>{stats.approved}</h3>
            <p>Approved</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon red">
            <FontAwesomeIcon icon={faBan} />
          </div>
          <div className="stat-info">
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon purple">
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalDays}</h3>
            <p>Total Days</p>
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
              placeholder="Search by employee, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Types</option>
            <option value="Annual Leave">Annual Leave</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Personal Leave">Personal Leave</option>
            <option value="Maternity Leave">Maternity Leave</option>
            <option value="Study Leave">Study Leave</option>
          </select>

          <div className="date-range">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="date-input"
              placeholder="Start Date"
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="date-input"
              placeholder="End Date"
            />
          </div>

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setStatusFilter('All');
            setTypeFilter('All');
            setDateRange({ start: '', end: '' });
          }}>
            <FontAwesomeIcon icon={faTimes} /> Clear
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          data={currentItems}
          loading={loading}
        />

        {/* Pagination */}
        {!loading && filteredRequests.length > 0 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {selectedRequest && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Leave Request Details"
          size="large"
        >
          <div className="details-modal">
            <div className="details-section">
              <h3>Employee Information</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Name:</span>
                  <span className="value">{selectedRequest.employee?.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Department:</span>
                  <span className="value">{selectedRequest.employee?.department}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Employee ID:</span>
                  <span className="value">{selectedRequest.employee_id}</span>
                </div>
              </div>
            </div>

            <div className="details-section">
              <h3>Leave Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Leave Type:</span>
                  <span className="value">{selectedRequest.leave_type?.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Duration:</span>
                  <span className="value">
                    {formatDate(selectedRequest.start_date)} - {formatDate(selectedRequest.end_date)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Days Applied:</span>
                  <span className="value">{selectedRequest.days_applied} days</span>
                </div>
                <div className="detail-item">
                  <span className="label">Applied On:</span>
                  <span className="value">{formatDate(selectedRequest.applied_on)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className="value">{getStatusBadge(selectedRequest.status)}</span>
                </div>
              </div>
            </div>

            <div className="details-section">
              <h3>Reason</h3>
              <div className="reason-box">
                {selectedRequest.reason}
              </div>
            </div>

            {selectedRequest.comments && (
              <div className="details-section">
                <h3>Comments</h3>
                <div className="comments-box">
                  {selectedRequest.comments}
                </div>
              </div>
            )}

            {selectedRequest.approved_by && (
              <div className="details-section">
                <h3>Approval Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="label">Approved By:</span>
                    <span className="value">Admin</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Approved On:</span>
                    <span className="value">{formatDate(selectedRequest.approved_on)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            {selectedRequest.status === 'Pending' && hasPermission('ApproveLeave') && (
              <>
                <Button
                  variant="success"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setActionType('approve');
                    setShowActionModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faCheck} /> Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setActionType('reject');
                    setShowActionModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} /> Reject
                </Button>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Action Modal */}
      {selectedRequest && actionType && (
        <Modal
          isOpen={showActionModal}
          onClose={() => {
            setShowActionModal(false);
            setActionType(null);
            setActionComment('');
          }}
          title={actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
          size="small"
        >
          <div className="action-modal">
            <p>
              Are you sure you want to {actionType} leave request for{' '}
              <strong>{selectedRequest.employee?.name}</strong>?
            </p>

            <div className="form-group">
              <label>Comments (Optional)</label>
              <textarea
                className="form-control"
                rows={3}
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                placeholder="Add any comments..."
              />
            </div>

            {actionType === 'reject' && (
              <div className="warning-message">
                <FontAwesomeIcon icon={faBan} />
                This action cannot be undone.
              </div>
            )}
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => {
              setShowActionModal(false);
              setActionType(null);
              setActionComment('');
            }}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'success' : 'danger'}
              onClick={handleAction}
            >
              <FontAwesomeIcon icon={actionType === 'approve' ? faCheck : faTimes} />
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LeaveRequests;