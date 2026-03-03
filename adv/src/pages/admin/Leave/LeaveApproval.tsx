import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faTimes,
  faUser,
  faCalendarAlt,
  faClock,
  faComment,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import { LeaveApplication } from '../../../types/leave';
import { formatDate } from '../../../utils/formatters';

const LeaveApproval: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [request, setRequest] = useState<LeaveApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRequest({
        leave_id: Number(id),
        employee_id: 1,
        employee: { 
          emp_id: 1, 
          name: 'John Doe', 
          department: 'Computer Science',
          academic_rank: 'Professor',
        },
        leave_type_id: 1,
        leave_type: { type_id: 1, name: 'Annual Leave', days_allowed: 20 },
        start_date: '2024-03-15',
        end_date: '2024-03-20',
        days_applied: 6,
        reason: 'Family vacation - Planning to visit family in another city after a long time. Need to take this time off to spend quality time with family members.',
        status: 'Pending',
        applied_on: '2024-03-01',
      });
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleApprove = async () => {
    setProcessing(true);
    // Simulate API call
    setTimeout(() => {
      showNotification('Leave request approved successfully', 'success');
      setProcessing(false);
      navigate('/admin/leave');
    }, 1500);
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      showNotification('Please provide a reason for rejection', 'warning');
      return;
    }
    setProcessing(true);
    // Simulate API call
    setTimeout(() => {
      showNotification('Leave request rejected', 'success');
      setProcessing(false);
      navigate('/admin/leave');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading leave request...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="not-found">
        <h2>Request Not Found</h2>
        <Button variant="primary" onClick={() => navigate('/admin/leave')}>
          Back to Leave Requests
        </Button>
      </div>
    );
  }

  return (
    <div className="leave-approval-page">
      <div className="page-header">
        <div className="header-left">
          <Button variant="outline" onClick={() => navigate('/admin/leave')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </Button>
          <h1>Leave Approval</h1>
        </div>
      </div>

      <div className="approval-grid">
        {/* Left Column - Request Details */}
        <div className="details-column">
          <Card className="details-card">
            <div className="card-header">
              <h2>Request Details</h2>
              <span className={`status-badge status-${request.status.toLowerCase()}`}>
                {request.status}
              </span>
            </div>

            <div className="employee-summary">
              <div className="employee-avatar">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <div className="employee-info">
                <h3>{request.employee?.name}</h3>
                <p>{request.employee?.academic_rank} • {request.employee?.department}</p>
                <p className="employee-id">Employee ID: {request.employee_id}</p>
              </div>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="label">
                  <FontAwesomeIcon icon={faCalendarAlt} /> Leave Type
                </span>
                <span className="value">{request.leave_type?.name}</span>
              </div>

              <div className="detail-item">
                <span className="label">
                  <FontAwesomeIcon icon={faClock} /> Duration
                </span>
                <span className="value">
                  {formatDate(request.start_date)} - {formatDate(request.end_date)}
                </span>
              </div>

              <div className="detail-item">
                <span className="label">Days Applied</span>
                <span className="value days">{request.days_applied} days</span>
              </div>

              <div className="detail-item">
                <span className="label">Applied On</span>
                <span className="value">{formatDate(request.applied_on)}</span>
              </div>
            </div>

            <div className="reason-section">
              <h3>Reason for Leave</h3>
              <div className="reason-box">
                {request.reason}
              </div>
            </div>

            {request.comments && (
              <div className="comments-section">
                <h3>Previous Comments</h3>
                <div className="comments-box">
                  {request.comments}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Approval Actions */}
        <div className="actions-column">
          <Card className="actions-card">
            <h2>Approval Decision</h2>

            {request.status === 'Pending' && hasPermission('ApproveLeave') ? (
              <>
                {/* Approve Section */}
                <div className="action-section approve">
                  <h3>
                    <FontAwesomeIcon icon={faCheck} /> Approve Request
                  </h3>
                  <p>Approve this leave request. The employee will be notified.</p>
                  <Button
                    variant="success"
                    fullWidth
                    size="large"
                    loading={processing}
                    onClick={handleApprove}
                  >
                    <FontAwesomeIcon icon={faCheck} /> Approve Leave
                  </Button>
                </div>

                <div className="divider">
                  <span>OR</span>
                </div>

                {/* Reject Section */}
                <div className="action-section reject">
                  <h3>
                    <FontAwesomeIcon icon={faTimes} /> Reject Request
                  </h3>
                  <p>Reject this leave request. Please provide a reason.</p>

                  <div className="form-group">
                    <label>Reason for Rejection *</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Explain why this leave request is being rejected..."
                    />
                  </div>

                  <Button
                    variant="danger"
                    fullWidth
                    size="large"
                    loading={processing}
                    onClick={handleReject}
                    disabled={!comment.trim()}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Reject Leave
                  </Button>

                  {!comment.trim() && (
                    <p className="field-hint">
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      Reason is required for rejection
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="already-processed">
                <p>This leave request has already been {request.status.toLowerCase()}.</p>
                {request.approved_by && (
                  <p>
                    Processed by Admin on {formatDate(request.approved_on)}
                  </p>
                )}
                <Button
                  variant="primary"
                  onClick={() => navigate('/admin/leave')}
                >
                  Back to Leave Requests
                </Button>
              </div>
            )}
          </Card>

          {/* Leave Balance Card */}
          <Card className="balance-card">
            <h3>Employee Leave Balance</h3>
            <div className="balance-items">
              <div className="balance-item">
                <span className="label">Annual Leave</span>
                <span className="value">12 / 20</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div className="balance-item">
                <span className="label">Sick Leave</span>
                <span className="value">8 / 12</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '66%' }}></div>
                </div>
              </div>
              <div className="balance-item">
                <span className="label">Personal Leave</span>
                <span className="value">3 / 5</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeaveApproval;