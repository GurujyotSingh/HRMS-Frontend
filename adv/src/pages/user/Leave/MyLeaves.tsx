import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faCalendarAlt,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faBan,
  faEye,
  
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { formatDate } from '../../../utils/formatters';

interface LeaveRecord {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled';
  appliedOn: string;
  comments?: string;
  approvedBy?: string;
}

const MyLeaves: React.FC = () => {
  const { showNotification } = useNotification();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockLeaves: LeaveRecord[] = [
        {
          id: '1',
          type: 'Annual Leave',
          startDate: '2024-04-10',
          endDate: '2024-04-15',
          days: 6,
          reason: 'Family vacation',
          status: 'approved',
          appliedOn: '2024-03-01',
          approvedBy: 'Dr. Jane Smith',
        },
        {
          id: '2',
          type: 'Sick Leave',
          startDate: '2024-03-20',
          endDate: '2024-03-22',
          days: 3,
          reason: 'Flu',
          status: 'approved',
          appliedOn: '2024-03-19',
          approvedBy: 'Dr. Jane Smith',
        },
        {
          id: '3',
          type: 'Personal Leave',
          startDate: '2024-04-20',
          endDate: '2024-04-21',
          days: 2,
          reason: 'Personal reasons',
          status: 'pending',
          appliedOn: '2024-03-15',
        },
        {
          id: '4',
          type: 'Annual Leave',
          startDate: '2024-05-01',
          endDate: '2024-05-05',
          days: 5,
          reason: 'Conference attendance',
          status: 'rejected',
          appliedOn: '2024-03-10',
          comments: 'Insufficient team coverage during this period',
          approvedBy: 'Dr. Jane Smith',
        },
        {
          id: '5',
          type: 'Study Leave',
          startDate: '2024-06-01',
          endDate: '2024-06-10',
          days: 10,
          reason: 'Research workshop',
          status: 'cancelled',
          appliedOn: '2024-02-15',
        },
      ];
      setLeaves(mockLeaves);
      setFilteredLeaves(mockLeaves);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = leaves;

    if (searchTerm) {
      filtered = filtered.filter(l =>
        l.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    setFilteredLeaves(filtered);
  }, [searchTerm, statusFilter, leaves]);

  const handleCancelLeave = () => {
    if (!selectedLeave) return;

    // Simulate API call
    setTimeout(() => {
      showNotification('Leave request cancelled successfully', 'success');
      setShowCancelModal(false);
      setSelectedLeave(null);
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return faCheckCircle;
      case 'pending': return faHourglassHalf;
      case 'rejected': return faTimesCircle;
      case 'cancelled': return faBan;
      default: return faClock;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const statuses = ['All', 'pending', 'approved', 'rejected', 'cancelled'];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your leaves...</p>
      </div>
    );
  }

  return (
    <div className="my-leaves-page">
      <div className="page-header">
        <div className="header-left">
          <h1>My Leaves</h1>
          <p>Track and manage your leave requests</p>
        </div>
        <div className="header-actions">
          <Link to="/user/leave/apply">
            <Button variant="primary">
              <FontAwesomeIcon icon={faPlus} /> Apply Leave
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-grid">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search by type or reason..."
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
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Leave Cards */}
      <div className="leaves-list">
        {filteredLeaves.length > 0 ? (
          filteredLeaves.map(leave => (
            <Card key={leave.id} className="leave-card">
              <div className="leave-header">
                <div className="leave-type">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <h3>{leave.type}</h3>
                </div>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: `${getStatusColor(leave.status)}20`,
                    color: getStatusColor(leave.status),
                  }}
                >
                  <FontAwesomeIcon icon={getStatusIcon(leave.status)} />
                  {leave.status}
                </span>
              </div>

              <div className="leave-dates">
                <div className="date-range">
                  <span className="label">From:</span>
                  <span className="date">{formatDate(leave.startDate)}</span>
                </div>
                <div className="date-range">
                  <span className="label">To:</span>
                  <span className="date">{formatDate(leave.endDate)}</span>
                </div>
                <div className="days-badge">{leave.days} days</div>
              </div>

              <div className="leave-reason">
                <p><strong>Reason:</strong> {leave.reason}</p>
              </div>

              <div className="leave-footer">
                <span className="applied-date">Applied: {formatDate(leave.appliedOn)}</span>
                <div className="action-buttons">
                  <button
                    className="action-btn view"
                    onClick={() => {
                      setSelectedLeave(leave);
                      setShowDetailsModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faEye} /> Details
                  </button>
                  {leave.status === 'pending' && (
                    <button
                      className="action-btn cancel"
                      onClick={() => {
                        setSelectedLeave(leave);
                        setShowCancelModal(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faBan} /> Cancel
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="no-results">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <h3>No leave requests found</h3>
            <p>Apply for leave to see them here</p>
            <Link to="/user/leave/apply">
              <Button variant="primary">Apply for Leave</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLeave && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedLeave(null);
          }}
          title="Leave Details"
          size="medium"
        >
          <div className="leave-details-modal">
            <div className="detail-row">
              <span className="label">Leave Type:</span>
              <span className="value">{selectedLeave.type}</span>
            </div>
            <div className="detail-row">
              <span className="label">Duration:</span>
              <span className="value">
                {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Total Days:</span>
              <span className="value">{selectedLeave.days} days</span>
            </div>
            <div className="detail-row">
              <span className="label">Applied On:</span>
              <span className="value">{formatDate(selectedLeave.appliedOn)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Status:</span>
              <span
                className="status-badge"
                style={{
                  backgroundColor: `${getStatusColor(selectedLeave.status)}20`,
                  color: getStatusColor(selectedLeave.status),
                }}
              >
                <FontAwesomeIcon icon={getStatusIcon(selectedLeave.status)} />
                {selectedLeave.status}
              </span>
            </div>

            <div className="detail-section">
              <h4>Reason</h4>
              <p>{selectedLeave.reason}</p>
            </div>

            {selectedLeave.comments && (
              <div className="detail-section">
                <h4>Comments</h4>
                <p>{selectedLeave.comments}</p>
              </div>
            )}

            {selectedLeave.approvedBy && (
              <div className="detail-section">
                <h4>Approved By</h4>
                <p>{selectedLeave.approvedBy}</p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedLeave(null);
        }}
        title="Cancel Leave Request"
        size="small"
      >
        <div className="cancel-confirmation">
          <p>Are you sure you want to cancel this leave request?</p>
          <p className="warning-text">This action cannot be undone.</p>
          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
              No, Keep It
            </Button>
            <Button variant="danger" onClick={handleCancelLeave}>
              Yes, Cancel Leave
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyLeaves;