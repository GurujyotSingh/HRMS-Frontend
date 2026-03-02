// src/pages/LeavePage.tsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faCalendarCheck,
  faCalendarTimes,
  faClock,
  faUser,
  faFilter,
  faSearch,
  faDownload,
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faCheck,
  faTimes,
  faBan,
  faUndo,
  faChevronLeft,
  faChevronRight,
  faExclamationTriangle,
  faInfoCircle,
  faChartLine,
  faUsers,
  faCheckCircle,
  faHourglassHalf,
  faFileExport,
} from '@fortawesome/free-solid-svg-icons';

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: 'Annual' | 'Sick' | 'Personal' | 'Maternity' | 'Paternity' | 'Study' | 'Unpaid';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'In-Progress';
  appliedOn: string;
  approvedBy?: string;
  approvedOn?: string;
  comments?: string;
  documents?: string[];
}

interface LeaveBalance {
  employeeId: string;
  employeeName: string;
  annual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
  personal: { total: number; used: number; remaining: number };
  maternity: { total: number; used: number; remaining: number };
  paternity: { total: number; used: number; remaining: number };
  study: { total: number; used: number; remaining: number };
  unpaid: { total: number; used: number; remaining: number };
}

const LeavePage: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'analytics'>('list');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'cancel' | null>(null);
  const [actionComment, setActionComment] = useState('');

  // Form state for applying leave
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveType: 'Annual' as LeaveRequest['leaveType'],
    startDate: '',
    endDate: '',
    reason: '',
    documents: [] as File[],
  });

  // Mock data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      // Mock leave requests
      const mockLeaveRequests: LeaveRequest[] = [
        {
          id: '1',
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          department: 'Computer Science',
          leaveType: 'Annual',
          startDate: '2024-03-15',
          endDate: '2024-03-20',
          days: 6,
          reason: 'Family vacation',
          status: 'Pending',
          appliedOn: '2024-03-01',
        },
        {
          id: '2',
          employeeId: 'EMP002',
          employeeName: 'Jane Smith',
          department: 'Mathematics',
          leaveType: 'Sick',
          startDate: '2024-03-10',
          endDate: '2024-03-12',
          days: 3,
          reason: 'Flu recovery',
          status: 'Approved',
          appliedOn: '2024-03-05',
          approvedBy: 'Admin User',
          approvedOn: '2024-03-06',
        },
        {
          id: '3',
          employeeId: 'EMP003',
          employeeName: 'Rahul Kumar',
          department: 'Physics',
          leaveType: 'Personal',
          startDate: '2024-03-18',
          endDate: '2024-03-19',
          days: 2,
          reason: 'Personal reasons',
          status: 'Rejected',
          appliedOn: '2024-03-07',
          approvedBy: 'Admin User',
          approvedOn: '2024-03-08',
          comments: 'Insufficient team coverage',
        },
        {
          id: '4',
          employeeId: 'EMP004',
          employeeName: 'Priya Sharma',
          department: 'Chemistry',
          leaveType: 'Maternity',
          startDate: '2024-04-01',
          endDate: '2024-07-01',
          days: 90,
          reason: 'Maternity leave',
          status: 'Approved',
          appliedOn: '2024-02-15',
          approvedBy: 'Admin User',
          approvedOn: '2024-02-20',
        },
        {
          id: '5',
          employeeId: 'EMP005',
          employeeName: 'Amit Patel',
          department: 'Computer Science',
          leaveType: 'Study',
          startDate: '2024-03-25',
          endDate: '2024-04-05',
          days: 10,
          reason: 'Conference attendance',
          status: 'Pending',
          appliedOn: '2024-03-10',
        },
        {
          id: '6',
          employeeId: 'EMP006',
          employeeName: 'Neha Gupta',
          department: 'Mathematics',
          leaveType: 'Sick',
          startDate: '2024-03-08',
          endDate: '2024-03-09',
          days: 2,
          reason: 'Medical appointment',
          status: 'Approved',
          appliedOn: '2024-03-07',
          approvedBy: 'Admin User',
          approvedOn: '2024-03-07',
        },
        {
          id: '7',
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          department: 'Computer Science',
          leaveType: 'Personal',
          startDate: '2024-03-22',
          endDate: '2024-03-23',
          days: 2,
          reason: 'Family function',
          status: 'Cancelled',
          appliedOn: '2024-03-15',
        },
      ];

      // Mock leave balances
      const mockLeaveBalances: LeaveBalance[] = [
        {
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          annual: { total: 20, used: 8, remaining: 12 },
          sick: { total: 12, used: 3, remaining: 9 },
          personal: { total: 5, used: 2, remaining: 3 },
          maternity: { total: 0, used: 0, remaining: 0 },
          paternity: { total: 10, used: 0, remaining: 10 },
          study: { total: 10, used: 0, remaining: 10 },
          unpaid: { total: 30, used: 0, remaining: 30 },
        },
        {
          employeeId: 'EMP002',
          employeeName: 'Jane Smith',
          annual: { total: 20, used: 12, remaining: 8 },
          sick: { total: 12, used: 4, remaining: 8 },
          personal: { total: 5, used: 1, remaining: 4 },
          maternity: { total: 0, used: 0, remaining: 0 },
          paternity: { total: 0, used: 0, remaining: 0 },
          study: { total: 10, used: 5, remaining: 5 },
          unpaid: { total: 30, used: 0, remaining: 30 },
        },
        {
          employeeId: 'EMP003',
          employeeName: 'Rahul Kumar',
          annual: { total: 20, used: 15, remaining: 5 },
          sick: { total: 12, used: 6, remaining: 6 },
          personal: { total: 5, used: 3, remaining: 2 },
          maternity: { total: 0, used: 0, remaining: 0 },
          paternity: { total: 10, used: 0, remaining: 10 },
          study: { total: 10, used: 0, remaining: 10 },
          unpaid: { total: 30, used: 0, remaining: 30 },
        },
      ];

      setLeaveRequests(mockLeaveRequests);
      setLeaveBalances(mockLeaveBalances);
      setFilteredRequests(mockLeaveRequests);
      setLoading(false);
    }, 1000);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter leave requests
  useEffect(() => {
    let filtered = leaveRequests;

    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(req => req.status === selectedStatus);
    }

    if (selectedType !== 'All') {
      filtered = filtered.filter(req => req.leaveType === selectedType);
    }

    if (selectedDepartment !== 'All') {
      filtered = filtered.filter(req => req.department === selectedDepartment);
    }

    if (dateRange.start) {
      filtered = filtered.filter(req => req.startDate >= dateRange.start);
    }

    if (dateRange.end) {
      filtered = filtered.filter(req => req.endDate <= dateRange.end);
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedType, selectedDepartment, dateRange, leaveRequests]);

  // Get unique values for filters
  const departments = ['All', ...new Set(leaveRequests.map(req => req.department))];
  const leaveTypes = ['All', 'Annual', 'Sick', 'Personal', 'Maternity', 'Paternity', 'Study', 'Unpaid'];
  const statuses = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'In-Progress'];

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  // Calculate statistics
  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter(r => r.status === 'Pending').length,
    approved: leaveRequests.filter(r => r.status === 'Approved').length,
    rejected: leaveRequests.filter(r => r.status === 'Rejected').length,
    totalDays: leaveRequests.reduce((sum, r) => sum + r.days, 0),
    approvedDays: leaveRequests.filter(r => r.status === 'Approved').reduce((sum, r) => sum + r.days, 0),
  };

  // Handle apply leave
  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const newRequest: LeaveRequest = {
      id: Date.now().toString(),
      employeeId: 'EMP001', // Should come from logged in user
      employeeName: 'John Doe', // Should come from logged in user
      department: 'Computer Science', // Should come from logged in user
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      days: days,
      reason: leaveForm.reason,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0],
    };

    setLeaveRequests([newRequest, ...leaveRequests]);
    setShowApplyModal(false);
    setLeaveForm({
      employeeId: '',
      leaveType: 'Annual',
      startDate: '',
      endDate: '',
      reason: '',
      documents: [],
    });
  };

  // Handle approve/reject/cancel
  const handleAction = () => {
    if (!selectedRequest || !actionType) return;

    const updatedRequests = leaveRequests.map(req => {
      if (req.id === selectedRequest.id) {
        return {
          ...req,
          status: actionType === 'approve' ? 'Approved' : 
                  actionType === 'reject' ? 'Rejected' : 'Cancelled',
          approvedBy: actionType !== 'cancel' ? 'Admin User' : undefined,
          approvedOn: actionType !== 'cancel' ? new Date().toISOString().split('T')[0] : undefined,
          comments: actionComment || req.comments,
        };
      }
      return req;
    });

    setLeaveRequests(updatedRequests);
    setShowActionModal(false);
    setSelectedRequest(null);
    setActionType(null);
    setActionComment('');
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Employee ID', 'Employee Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status', 'Applied On'];
    const csvData = filteredRequests.map(req => [
      req.employeeId,
      req.employeeName,
      req.department,
      req.leaveType,
      req.startDate,
      req.endDate,
      req.days,
      req.reason,
      req.status,
      req.appliedOn,
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leave_requests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Approved': return 'var(--success)';
      case 'Pending': return 'var(--warning)';
      case 'Rejected': return 'var(--danger)';
      case 'Cancelled': return 'var(--gray-500)';
      case 'In-Progress': return 'var(--info)';
      default: return 'var(--gray-600)';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Approved': return faCheckCircle;
      case 'Pending': return faHourglassHalf;
      case 'Rejected': return faTimes;
      case 'Cancelled': return faBan;
      case 'In-Progress': return faClock;
      default: return faInfoCircle;
    }
  };

  const isMobile = windowWidth <= 768;

  return (
    <div className="leave-page">
      {/* Header */}
      <div className="leave-header">
        <div className="leave-title-section">
          <h1 className="leave-title">Leave Management</h1>
          <p className="leave-subtitle">
            Total Requests: {stats.total} | Pending: {stats.pending} | Approved: {stats.approved}
          </p>
        </div>
        <div className="leave-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowApplyModal(true)}
          >
            <FontAwesomeIcon icon={faPlus} />
            {!isMobile && ' Apply Leave'}
          </button>
          <button className="btn btn-secondary" onClick={exportToCSV}>
            <FontAwesomeIcon icon={faDownload} />
            {!isMobile && ' Export'}
          </button>
          {!isMobile && (
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setViewMode('calendar')}
              >
                Calendar
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'analytics' ? 'active' : ''}`}
                onClick={() => setViewMode('analytics')}
              >
                Analytics
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="leave-stats">
        <div className="stat-card">
          <div className="stat-icon purple">
            <FontAwesomeIcon icon={faCalendarAlt} />
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Requests</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <FontAwesomeIcon icon={faHourglassHalf} />
          </div>
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="stat-info">
            <h3>{stats.approved}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon coral">
            <FontAwesomeIcon icon={faCalendarTimes} />
          </div>
          <div className="stat-info">
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <FontAwesomeIcon icon={faCalendarCheck} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalDays}</h3>
            <p>Total Days</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon teal">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="stat-info">
            <h3>{leaveBalances.length}</h3>
            <p>Employees</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="leave-filters">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search by employee, department, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {!isMobile ? (
          <div className="filter-controls">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="filter-select"
            >
              {leaveTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="filter-select"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="filter-date"
              placeholder="Start Date"
            />

            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="filter-date"
              placeholder="End Date"
            />

            <button className="btn-filter" onClick={() => setShowFilterModal(true)}>
              <FontAwesomeIcon icon={faFilter} />
              More
            </button>
          </div>
        ) : (
          <button className="btn-filter mobile-filter-btn" onClick={() => setShowFilterModal(true)}>
            <FontAwesomeIcon icon={faFilter} />
            Filters
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading leave requests...</p>
        </div>
      )}

      {/* Leave Requests List */}
      {!loading && viewMode === 'list' && (
        <>
          <div className="table-container">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(request => (
                  <tr key={request.id}>
                    <td>
                      <div className="employee-cell">
                        <FontAwesomeIcon icon={faUser} className="employee-icon" />
                        <div>
                          <div className="employee-name">{request.employeeName}</div>
                          <small className="employee-id">{request.employeeId}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`leave-type-badge type-${request.leaveType.toLowerCase()}`}>
                        {request.leaveType}
                      </span>
                    </td>
                    <td>
                      <div className="duration">
                        <div>{new Date(request.startDate).toLocaleDateString()}</div>
                        <div>to</div>
                        <div>{new Date(request.endDate).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="days-cell">{request.days} days</td>
                    <td>
                      <div className="reason-cell" title={request.reason}>
                        {request.reason.length > 30 
                          ? `${request.reason.substring(0, 30)}...` 
                          : request.reason}
                      </div>
                    </td>
                    <td>{new Date(request.appliedOn).toLocaleDateString()}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: `${getStatusColor(request.status)}20`,
                          color: getStatusColor(request.status),
                          borderColor: getStatusColor(request.status)
                        }}
                      >
                        <FontAwesomeIcon icon={getStatusIcon(request.status)} />
                        {request.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailsModal(true);
                          }}
                          title="View Details"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        {request.status === 'Pending' && (
                          <>
                            <button 
                              className="action-btn approve"
                              onClick={() => {
                                setSelectedRequest(request);
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
                                setSelectedRequest(request);
                                setActionType('reject');
                                setShowActionModal(true);
                              }}
                              title="Reject"
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </>
                        )}
                        {request.status === 'Approved' && (
                          <button 
                            className="action-btn cancel"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionType('cancel');
                              setShowActionModal(true);
                            }}
                            title="Cancel"
                          >
                            <FontAwesomeIcon icon={faBan} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredRequests.length > 0 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={i}
                      className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={i} className="pagination-ellipsis">...</span>;
                }
                return null;
              })}
              
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Calendar View */}
      {!loading && viewMode === 'calendar' && !isMobile && (
        <div className="calendar-view">
          <div className="calendar-header">
            <h3>Leave Calendar - March 2024</h3>
            <div className="calendar-legend">
              <span><span className="legend-dot approved"></span> Approved</span>
              <span><span className="legend-dot pending"></span> Pending</span>
              <span><span className="legend-dot rejected"></span> Rejected</span>
            </div>
          </div>
          <div className="calendar-grid">
            {/* Calendar days would be rendered here */}
            <div className="calendar-placeholder">
              <p>Calendar view coming soon...</p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics View */}
      {!loading && viewMode === 'analytics' && !isMobile && (
        <div className="analytics-view">
          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>Leave Distribution by Type</h3>
              <div className="chart-placeholder">
                <div className="bar-chart">
                  {leaveTypes.filter(t => t !== 'All').map(type => {
                    const count = leaveRequests.filter(r => r.leaveType === type).length;
                    const max = Math.max(...leaveTypes.filter(t => t !== 'All').map(t => 
                      leaveRequests.filter(r => r.leaveType === t).length
                    ));
                    const percentage = max > 0 ? (count / max) * 100 : 0;
                    
                    return (
                      <div key={type} className="bar-item">
                        <span className="bar-label">{type}</span>
                        <div className="bar-container">
                          <div 
                            className="bar-fill"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: `var(--${type === 'Annual' ? 'primary' : 
                                type === 'Sick' ? 'success' : 
                                type === 'Personal' ? 'warning' : 
                                type === 'Maternity' ? 'accent' : 
                                type === 'Paternity' ? 'info' : 
                                type === 'Study' ? 'secondary' : 'gray-500'})`
                            }}
                          ></div>
                          <span className="bar-value">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <h3>Leave Status Overview</h3>
              <div className="pie-chart-placeholder">
                <div className="pie-stats">
                  {statuses.filter(s => s !== 'All').map(status => {
                    const count = leaveRequests.filter(r => r.status === status).length;
                    const percentage = leaveRequests.length > 0 
                      ? Math.round((count / leaveRequests.length) * 100) 
                      : 0;
                    
                    return (
                      <div key={status} className="pie-stat-item">
                        <span className="stat-color" style={{ backgroundColor: getStatusColor(status) }}></span>
                        <span className="stat-label">{status}</span>
                        <span className="stat-count">{count} ({percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <h3>Monthly Trend</h3>
              <div className="trend-placeholder">
                <p>Monthly trend chart coming soon...</p>
              </div>
            </div>

            <div className="analytics-card">
              <h3>Leave Balance Summary</h3>
              <div className="balance-summary">
                <table className="balance-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Annual</th>
                      <th>Sick</th>
                      <th>Personal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveBalances.slice(0, 5).map(balance => (
                      <tr key={balance.employeeId}>
                        <td>{balance.employeeName}</td>
                        <td>{balance.annual.remaining}/{balance.annual.total}</td>
                        <td>{balance.sick.remaining}/{balance.sick.total}</td>
                        <td>{balance.personal.remaining}/{balance.personal.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && filteredRequests.length === 0 && (
        <div className="no-results">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>No leave requests found matching your criteria</p>
          <button className="btn btn-primary" onClick={() => {
            setSearchTerm('');
            setSelectedStatus('All');
            setSelectedType('All');
            setSelectedDepartment('All');
            setDateRange({ start: '', end: '' });
          }}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-content apply-leave-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Apply for Leave</h2>
              <button className="modal-close" onClick={() => setShowApplyModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleApplyLeave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Leave Type *</label>
                  <select
                    className="form-control"
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as any })}
                    required
                  >
                    <option value="Annual">Annual Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Personal">Personal Leave</option>
                    <option value="Maternity">Maternity Leave</option>
                    <option value="Paternity">Paternity Leave</option>
                    <option value="Study">Study Leave</option>
                    <option value="Unpaid">Unpaid Leave</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      min={leaveForm.startDate || new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                {leaveForm.startDate && leaveForm.endDate && (
                  <div className="leave-days-preview">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>
                      Total Days: {
                        Math.ceil(
                          (new Date(leaveForm.endDate).getTime() - new Date(leaveForm.startDate).getTime()) 
                          / (1000 * 60 * 60 * 24)
                        ) + 1
                      } days
                    </span>
                  </div>
                )}

                <div className="form-group">
                  <label>Reason for Leave *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    placeholder="Please provide detailed reason for your leave request..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Supporting Documents (Optional)</label>
                  <input
                    type="file"
                    className="form-control-file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setLeaveForm({ ...leaveForm, documents: Array.from(e.target.files) });
                      }
                    }}
                  />
                  <small className="form-text">Upload medical certificates, approval letters, etc.</small>
                </div>

                {leaveForm.leaveType === 'Annual' && (
                  <div className="leave-balance-info">
                    <FontAwesomeIcon icon={faInfoCircle} />
                    <span>Available Annual Leave: 12 days</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <FontAwesomeIcon icon={faCheck} />
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Leave Request Details</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div className="details-section">
                <h3>Employee Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedRequest.employeeName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Employee ID:</span>
                    <span className="detail-value">{selectedRequest.employeeId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Department:</span>
                    <span className="detail-value">{selectedRequest.department}</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Leave Details</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Leave Type:</span>
                    <span className="detail-value">
                      <span className={`leave-type-badge type-${selectedRequest.leaveType.toLowerCase()}`}>
                        {selectedRequest.leaveType}
                      </span>
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Start Date:</span>
                    <span className="detail-value">{new Date(selectedRequest.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">End Date:</span>
                    <span className="detail-value">{new Date(selectedRequest.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Days:</span>
                    <span className="detail-value">{selectedRequest.days} days</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Applied On:</span>
                    <span className="detail-value">{new Date(selectedRequest.appliedOn).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: `${getStatusColor(selectedRequest.status)}20`,
                          color: getStatusColor(selectedRequest.status)
                        }}
                      >
                        <FontAwesomeIcon icon={getStatusIcon(selectedRequest.status)} />
                        {selectedRequest.status}
                      </span>
                    </span>
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

              {selectedRequest.approvedBy && (
                <div className="details-section">
                  <h3>Approval Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Approved By:</span>
                      <span className="detail-value">{selectedRequest.approvedBy}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Approved On:</span>
                      <span className="detail-value">
                        {selectedRequest.approvedOn && new Date(selectedRequest.approvedOn).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
              {selectedRequest.status === 'Pending' && (
                <>
                  <button 
                    className="btn btn-success"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setActionType('approve');
                      setShowActionModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faCheck} />
                    Approve
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setActionType('reject');
                      setShowActionModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal (Approve/Reject/Cancel) */}
      {showActionModal && selectedRequest && actionType && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal-content action-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {actionType === 'approve' && 'Approve Leave Request'}
                {actionType === 'reject' && 'Reject Leave Request'}
                {actionType === 'cancel' && 'Cancel Leave Request'}
              </h2>
              <button className="modal-close" onClick={() => setShowActionModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <p>
                {actionType === 'approve' && `Are you sure you want to approve ${selectedRequest.employeeName}'s leave request?`}
                {actionType === 'reject' && `Are you sure you want to reject ${selectedRequest.employeeName}'s leave request?`}
                {actionType === 'cancel' && `Are you sure you want to cancel ${selectedRequest.employeeName}'s approved leave?`}
              </p>

              <div className="form-group">
                <label>Comments (Optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder="Add any comments or reason for this action..."
                />
              </div>

              {actionType === 'reject' && (
                <div className="warning-message">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <span>This action cannot be undone. The employee will be notified.</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowActionModal(false)}>
                Cancel
              </button>
              <button 
                className={`btn btn-${actionType === 'approve' ? 'success' : actionType === 'reject' ? 'danger' : 'warning'}`}
                onClick={handleAction}
              >
                <FontAwesomeIcon icon={
                  actionType === 'approve' ? faCheck : 
                  actionType === 'reject' ? faTimes : 
                  faBan
                } />
                {actionType === 'approve' && ' Approve'}
                {actionType === 'reject' && ' Reject'}
                {actionType === 'cancel' && ' Cancel Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal for Mobile */}
      {showFilterModal && isMobile && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-content filter-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Filter Leave Requests</h2>
              <button className="modal-close" onClick={() => setShowFilterModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-control"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Leave Type</label>
                <select
                  className="form-control"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  {leaveTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  className="form-control"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

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
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => {
                setSelectedStatus('All');
                setSelectedType('All');
                setSelectedDepartment('All');
                setDateRange({ start: '', end: '' });
              }}>
                Clear All
              </button>
              <button className="btn btn-primary" onClick={() => setShowFilterModal(false)}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavePage;