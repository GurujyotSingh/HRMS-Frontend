// src/pages/user/UserLeavePage.tsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faPlus,
  faInfoCircle,
  faFileAlt,
  faHistory,
  faBan,
} from '@fortawesome/free-solid-svg-icons';

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedOn: string;
  comments?: string;
}

const UserLeavePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'apply' | 'history'>('apply');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: '1',
      type: 'Annual Leave',
      startDate: '2024-04-10',
      endDate: '2024-04-15',
      days: 6,
      reason: 'Family vacation',
      status: 'approved',
      appliedOn: '2024-03-01',
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
  ]);

  const [formData, setFormData] = useState({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const leaveBalances = {
    annual: { total: 20, used: 8, remaining: 12 },
    sick: { total: 12, used: 3, remaining: 9 },
    personal: { total: 5, used: 1, remaining: 4 },
    unpaid: { total: 30, used: 0, remaining: 30 },
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const newRequest: LeaveRequest = {
      id: Date.now().toString(),
      type: formData.leaveType === 'annual' ? 'Annual Leave' :
            formData.leaveType === 'sick' ? 'Sick Leave' :
            formData.leaveType === 'personal' ? 'Personal Leave' : 'Unpaid Leave',
      startDate: formData.startDate,
      endDate: formData.endDate,
      days: days,
      reason: formData.reason,
      status: 'pending',
      appliedOn: new Date().toISOString().split('T')[0],
    };

    setLeaveRequests([newRequest, ...leaveRequests]);
    setShowApplyForm(false);
    setFormData({ leaveType: 'annual', startDate: '', endDate: '', reason: '' });
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
      case 'approved': return 'var(--success)';
      case 'pending': return 'var(--warning)';
      case 'rejected': return 'var(--danger)';
      case 'cancelled': return 'var(--gray-600)';
      default: return 'var(--gray-600)';
    }
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="user-leave-page">
      {/* Header */}
      <div className="page-header">
        <h1>Leave Management</h1>
        <button className="btn btn-primary" onClick={() => setShowApplyForm(true)}>
          <FontAwesomeIcon icon={faPlus} />
          Apply for Leave
        </button>
      </div>

      {/* Leave Balance Cards */}
      <div className="leave-balance-cards">
        <div className="balance-card annual">
          <div className="balance-header">
            <h3>Annual Leave</h3>
            <span className="balance-icon">🏖️</span>
          </div>
          <div className="balance-details">
            <div className="balance-numbers">
              <span className="remaining">{leaveBalances.annual.remaining}</span>
              <span className="total">/{leaveBalances.annual.total}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(leaveBalances.annual.used / leaveBalances.annual.total) * 100}%` }}
              ></div>
            </div>
            <p className="used">Used: {leaveBalances.annual.used} days</p>
          </div>
        </div>

        <div className="balance-card sick">
          <div className="balance-header">
            <h3>Sick Leave</h3>
            <span className="balance-icon">🤒</span>
          </div>
          <div className="balance-details">
            <div className="balance-numbers">
              <span className="remaining">{leaveBalances.sick.remaining}</span>
              <span className="total">/{leaveBalances.sick.total}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(leaveBalances.sick.used / leaveBalances.sick.total) * 100}%` }}
              ></div>
            </div>
            <p className="used">Used: {leaveBalances.sick.used} days</p>
          </div>
        </div>

        <div className="balance-card personal">
          <div className="balance-header">
            <h3>Personal Leave</h3>
            <span className="balance-icon">🎯</span>
          </div>
          <div className="balance-details">
            <div className="balance-numbers">
              <span className="remaining">{leaveBalances.personal.remaining}</span>
              <span className="total">/{leaveBalances.personal.total}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(leaveBalances.personal.used / leaveBalances.personal.total) * 100}%` }}
              ></div>
            </div>
            <p className="used">Used: {leaveBalances.personal.used} days</p>
          </div>
        </div>

        <div className="balance-card unpaid">
          <div className="balance-header">
            <h3>Unpaid Leave</h3>
            <span className="balance-icon">⏳</span>
          </div>
          <div className="balance-details">
            <div className="balance-numbers">
              <span className="remaining">{leaveBalances.unpaid.remaining}</span>
              <span className="total">/{leaveBalances.unpaid.total}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(leaveBalances.unpaid.used / leaveBalances.unpaid.total) * 100}%` }}
              ></div>
            </div>
            <p className="used">Used: {leaveBalances.unpaid.used} days</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="leave-tabs">
        <button 
          className={`tab-btn ${activeTab === 'apply' ? 'active' : ''}`}
          onClick={() => setActiveTab('apply')}
        >
          <FontAwesomeIcon icon={faFileAlt} />
          Apply Leave
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FontAwesomeIcon icon={faHistory} />
          Leave History
        </button>
      </div>

      {/* Apply Leave Form */}
      {activeTab === 'apply' && (
        <div className="apply-leave-section">
          {!showApplyForm ? (
            <div className="quick-apply-card" onClick={() => setShowApplyForm(true)}>
              <FontAwesomeIcon icon={faPlus} className="quick-apply-icon" />
              <p>Click here to apply for leave</p>
            </div>
          ) : (
            <div className="leave-form-container">
              <div className="form-header">
                <h2>Apply for Leave</h2>
                <button className="close-form" onClick={() => setShowApplyForm(false)}>
                  <FontAwesomeIcon icon={faTimesCircle} />
                </button>
              </div>
              <form onSubmit={handleApplyLeave}>
                <div className="form-group">
                  <label>Leave Type *</label>
                  <select 
                    className="form-control"
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    required
                  >
                    <option value="annual">Annual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                {formData.startDate && formData.endDate && (
                  <div className="leave-days-info">
                    <FontAwesomeIcon icon={faInfoCircle} />
                    <span>Total Days: {calculateDays(formData.startDate, formData.endDate)} days</span>
                  </div>
                )}

                <div className="form-group">
                  <label>Reason for Leave *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Please provide detailed reason for your leave request..."
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowApplyForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Leave History */}
      {activeTab === 'history' && (
        <div className="leave-history-section">
          <div className="history-filters">
            <select className="filter-select">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select className="filter-select">
              <option value="all">All Types</option>
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal Leave</option>
            </select>
          </div>

          <div className="leave-history-list">
            {leaveRequests.map(request => (
              <div key={request.id} className="history-card">
                <div className="history-header">
                  <span className="leave-type">{request.type}</span>
                  <span 
                    className="leave-status"
                    style={{ 
                      backgroundColor: `${getStatusColor(request.status)}20`,
                      color: getStatusColor(request.status)
                    }}
                  >
                    <FontAwesomeIcon icon={getStatusIcon(request.status)} />
                    {request.status}
                  </span>
                </div>
                <div className="history-dates">
                  <div className="date-range">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>{new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="days-badge">{request.days} days</div>
                </div>
                <div className="history-reason">
                  <p><strong>Reason:</strong> {request.reason}</p>
                </div>
                <div className="history-footer">
                  <span className="applied-date">Applied on: {new Date(request.appliedOn).toLocaleDateString()}</span>
                  {request.comments && (
                    <span className="comments">{request.comments}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLeavePage;