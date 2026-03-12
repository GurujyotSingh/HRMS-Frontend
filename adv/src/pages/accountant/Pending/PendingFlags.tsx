import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFlag,
  faCheckCircle,
  faTimesCircle,
  faEye,
  faCalendarAlt,
  faUser,
  faMoneyBillWave,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface FlaggedIssue {
  id: number;
  payrollId: number;
  employeeId: string;
  employeeName: string;
  department: string;
  month: number;
  year: number;
  amount: number;
  issue: string;
  description: string;
  raisedBy: string;
  raisedOn: string;
  status: 'Pending' | 'In Review' | 'Resolved' | 'Rejected';
  priority: 'High' | 'Medium' | 'Low';
  assignedTo?: string;
  resolution?: string;
  resolvedOn?: string;
  resolvedBy?: string;
}

const PendingFlags: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<FlaggedIssue[]>([]);
  const [filteredFlags, setFilteredFlags] = useState<FlaggedIssue[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<FlaggedIssue | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockFlags: FlaggedIssue[] = [
        {
          id: 1,
          payrollId: 101,
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          department: 'Computer Science',
          month: 2,
          year: 2024,
          amount: 108000,
          issue: 'Overtime calculation mismatch',
          description: 'Overtime hours recorded as 45 but calculated for 40 hours only',
          raisedBy: 'HR Admin',
          raisedOn: '2024-03-01T10:30:00',
          status: 'Pending',
          priority: 'High',
        },
        {
          id: 2,
          payrollId: 102,
          employeeId: 'EMP002',
          employeeName: 'Jane Smith',
          department: 'Mathematics',
          month: 2,
          year: 2024,
          amount: 97000,
          issue: 'Missing tax deduction',
          description: 'TDS deduction not applied for this employee',
          raisedBy: 'System',
          raisedOn: '2024-03-02T09:15:00',
          status: 'In Review',
          priority: 'Medium',
          assignedTo: 'Senior Accountant',
        },
        {
          id: 3,
          payrollId: 103,
          employeeId: 'EMP004',
          employeeName: 'Priya Sharma',
          department: 'Chemistry',
          month: 2,
          year: 2024,
          amount: 85000,
          issue: 'Duplicate entry',
          description: 'Employee appears twice in payroll list',
          raisedBy: 'HR Admin',
          raisedOn: '2024-03-02T14:20:00',
          status: 'Resolved',
          priority: 'High',
          resolution: 'Removed duplicate entry',
          resolvedOn: '2024-03-03T11:30:00',
          resolvedBy: 'Accountant',
        },
      ];

      setFlags(mockFlags);
      setFilteredFlags(mockFlags);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredFlags(flags);
    } else {
      setFilteredFlags(flags.filter(f => f.status === filter));
    }
  }, [filter, flags]);

  const handleResolve = (flagId: number) => {
    setFlags(flags.map(f => 
      f.id === flagId 
        ? { ...f, status: 'Resolved', resolvedOn: new Date().toISOString(), resolvedBy: 'Accountant' }
        : f
    ));
    showNotification('Issue marked as resolved', 'success');
  };

  const handleReject = (flagId: number) => {
    setFlags(flags.map(f => 
      f.id === flagId 
        ? { ...f, status: 'Rejected' }
        : f
    ));
    showNotification('Issue rejected', 'info');
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      High: { bg: '#ef444420', color: '#ef4444' },
      Medium: { bg: '#f59e0b20', color: '#f59e0b' },
      Low: { bg: '#10b98120', color: '#10b981' },
    };
    const style = styles[priority as keyof typeof styles] || styles.Medium;

    return (
      <span className="priority-badge" style={{ backgroundColor: style.bg, color: style.color }}>
        {priority}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: { bg: '#f59e0b20', color: '#f59e0b' },
      'In Review': { bg: '#3b82f620', color: '#3b82f6' },
      Resolved: { bg: '#10b98120', color: '#10b981' },
      Rejected: { bg: '#ef444420', color: '#ef4444' },
    };
    const style = styles[status as keyof typeof styles] || styles.Pending;

    return (
      <span className="status-badge" style={{ backgroundColor: style.bg, color: style.color }}>
        {status}
      </span>
    );
  };

  const filters = ['all', 'Pending', 'In Review', 'Resolved', 'Rejected'];

  return (
    <div className="pending-flags-page">
      <div className="page-header">
        <h1>Pending Issues</h1>
        <p>Review and resolve flagged payroll issues</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <Card className="summary-card">
          <h3>Total Issues</h3>
          <p className="value">{flags.length}</p>
        </Card>
        <Card className="summary-card">
          <h3>Pending</h3>
          <p className="value warning">{flags.filter(f => f.status === 'Pending').length}</p>
        </Card>
        <Card className="summary-card">
          <h3>In Review</h3>
          <p className="value info">{flags.filter(f => f.status === 'In Review').length}</p>
        </Card>
        <Card className="summary-card">
          <h3>Resolved</h3>
          <p className="value success">{flags.filter(f => f.status === 'Resolved').length}</p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card className="filters-card">
        <div className="filter-tabs">
          {filters.map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {/* Flags List */}
      <div className="flags-list">
        {filteredFlags.length > 0 ? (
          filteredFlags.map(flag => (
            <Card key={flag.id} className="flag-card">
              <div className="flag-header">
                <div className="flag-title">
                  <FontAwesomeIcon icon={faFlag} className="flag-icon" />
                  <h3>{flag.issue}</h3>
                </div>
                <div className="flag-badges">
                  {getPriorityBadge(flag.priority)}
                  {getStatusBadge(flag.status)}
                </div>
              </div>

              <div className="flag-details">
                <div className="detail-row">
                  <FontAwesomeIcon icon={faUser} />
                  <span>{flag.employeeName} ({flag.employeeId})</span>
                </div>
                <div className="detail-row">
                  <FontAwesomeIcon icon={faMoneyBillWave} />
                  <span>Amount: {formatCurrency(flag.amount)}</span>
                </div>
                <div className="detail-row">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span>{months[flag.month - 1]} {flag.year}</span>
                </div>
              </div>

              <p className="flag-description">{flag.description}</p>

              <div className="flag-meta">
                <span className="raised-by">Raised by: {flag.raisedBy}</span>
                <span className="raised-date">{new Date(flag.raisedOn).toLocaleDateString()}</span>
              </div>

              {flag.resolution && (
                <div className="flag-resolution">
                  <strong>Resolution:</strong> {flag.resolution}
                </div>
              )}

              <div className="flag-actions">
                <button
                  className="action-btn view"
                  onClick={() => {
                    setSelectedFlag(flag);
                    setShowDetailsModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faEye} /> View Details
                </button>
                {flag.status === 'Pending' && (
                  <>
                    <button
                      className="action-btn approve"
                      onClick={() => handleResolve(flag.id)}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} /> Resolve
                    </button>
                    <button
                      className="action-btn reject"
                      onClick={() => handleReject(flag.id)}
                    >
                      <FontAwesomeIcon icon={faTimesCircle} /> Reject
                    </button>
                  </>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="no-flags">
            <FontAwesomeIcon icon={faFlag} className="empty-icon" />
            <h3>No issues found</h3>
            <p>All payroll issues have been resolved</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedFlag && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedFlag(null);
          }}
          title="Issue Details"
          size="medium"
        >
          <div className="flag-details-modal">
            <div className="detail-section">
              <h4>Issue Information</h4>
              <div className="detail-row">
                <span className="label">Issue:</span>
                <span className="value">{selectedFlag.issue}</span>
              </div>
              <div className="detail-row">
                <span className="label">Description:</span>
                <span className="value">{selectedFlag.description}</span>
              </div>
              <div className="detail-row">
                <span className="label">Priority:</span>
                <span className="value">{getPriorityBadge(selectedFlag.priority)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className="value">{getStatusBadge(selectedFlag.status)}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Employee Information</h4>
              <div className="detail-row">
                <span className="label">Name:</span>
                <span className="value">{selectedFlag.employeeName}</span>
              </div>
              <div className="detail-row">
                <span className="label">Employee ID:</span>
                <span className="value">{selectedFlag.employeeId}</span>
              </div>
              <div className="detail-row">
                <span className="label">Department:</span>
                <span className="value">{selectedFlag.department}</span>
              </div>
              <div className="detail-row">
                <span className="label">Period:</span>
                <span className="value">{months[selectedFlag.month - 1]} {selectedFlag.year}</span>
              </div>
              <div className="detail-row">
                <span className="label">Amount:</span>
                <span className="value">{formatCurrency(selectedFlag.amount)}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Audit Information</h4>
              <div className="detail-row">
                <span className="label">Raised By:</span>
                <span className="value">{selectedFlag.raisedBy}</span>
              </div>
              <div className="detail-row">
                <span className="label">Raised On:</span>
                <span className="value">{new Date(selectedFlag.raisedOn).toLocaleString()}</span>
              </div>
              {selectedFlag.assignedTo && (
                <div className="detail-row">
                  <span className="label">Assigned To:</span>
                  <span className="value">{selectedFlag.assignedTo}</span>
                </div>
              )}
              {selectedFlag.resolvedBy && (
                <div className="detail-row">
                  <span className="label">Resolved By:</span>
                  <span className="value">{selectedFlag.resolvedBy}</span>
                </div>
              )}
              {selectedFlag.resolvedOn && (
                <div className="detail-row">
                  <span className="label">Resolved On:</span>
                  <span className="value">{new Date(selectedFlag.resolvedOn).toLocaleString()}</span>
                </div>
              )}
            </div>

            {selectedFlag.resolution && (
              <div className="detail-section">
                <h4>Resolution</h4>
                <p className="resolution-text">{selectedFlag.resolution}</p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            {selectedFlag.status === 'Pending' && (
              <>
                <Button
                  variant="success"
                  onClick={() => {
                    handleResolve(selectedFlag.id);
                    setShowDetailsModal(false);
                  }}
                >
                  <FontAwesomeIcon icon={faCheckCircle} /> Resolve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    handleReject(selectedFlag.id);
                    setShowDetailsModal(false);
                  }}
                >
                  <FontAwesomeIcon icon={faTimesCircle} /> Reject
                </Button>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PendingFlags;