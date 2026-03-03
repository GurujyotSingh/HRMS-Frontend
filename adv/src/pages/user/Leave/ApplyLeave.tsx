import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {

  faInfoCircle,
  faPaperPlane,
  faTimes,
  faFileUpload,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import FormInput from '../../../components/ui/FormInput';
import { useNotification } from '../../../hooks/useNotification';
import { useAuth } from '../../../hooks/useAuth';

const ApplyLeave: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
    contactDuringLeave: '',
    handoverNotes: '',
    documents: [] as File[],
  });

  const [leaveBalances] = useState({
    annual: { total: 20, used: 5, remaining: 15 },
    sick: { total: 12, used: 2, remaining: 10 },
    personal: { total: 5, used: 1, remaining: 4 },
    unpaid: { total: 30, used: 0, remaining: 30 },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        documents: [...formData.documents, ...Array.from(e.target.files)],
      });
    }
  };

  const removeFile = (index: number) => {
    setFormData({
      ...formData,
      documents: formData.documents.filter((_, i) => i !== index),
    });
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      showNotification('Please fill in all required fields', 'warning');
      return;
    }

    const days = calculateDays();
    const selectedBalance = leaveBalances[formData.leaveType as keyof typeof leaveBalances];
    
    if (days > selectedBalance.remaining) {
      showNotification(`Insufficient leave balance. Available: ${selectedBalance.remaining} days`, 'error');
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      showNotification('Leave application submitted successfully!', 'success');
      setLoading(false);
      navigate('/user/leave/my-leaves');
    }, 1500);
  };

  return (
    <div className="apply-leave-page">
      <div className="page-header">
        <h1>Apply for Leave</h1>
        <p>Submit a new leave request</p>
      </div>

      <div className="leave-apply-grid">
        {/* Main Form */}
        <div className="form-column">
          <Card className="form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Leave Details</h3>
                
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
                  <FormInput
                    label="Start Date *"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <FormInput
                    label="End Date *"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {formData.startDate && formData.endDate && (
                  <div className="leave-days-info">
                    <FontAwesomeIcon icon={faClock} />
                    <span>Total Days: {calculateDays()} days</span>
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
              </div>

              <div className="form-section">
                <h3>Contact Information</h3>
                
                <FormInput
                  label="Contact During Leave"
                  value={formData.contactDuringLeave}
                  onChange={(e) => setFormData({ ...formData, contactDuringLeave: e.target.value })}
                  placeholder="Phone number or email where you can be reached"
                />

                <div className="form-group">
                  <label>Work Handover Notes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.handoverNotes}
                    onChange={(e) => setFormData({ ...formData, handoverNotes: e.target.value })}
                    placeholder="Any important tasks or information to handover..."
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Supporting Documents</h3>
                
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    <FontAwesomeIcon icon={faFileUpload} />
                    <span>Click to upload files</span>
                    <small>PDF, DOC, Images (Max 5MB each)</small>
                  </label>
                </div>

                {formData.documents.length > 0 && (
                  <div className="file-list">
                    {formData.documents.map((file, index) => (
                      <div key={index} className="file-item">
                        <span>{file.name}</span>
                        <button type="button" onClick={() => removeFile(index)}>
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={() => navigate('/user/leave/my-leaves')}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={loading}>
                  <FontAwesomeIcon icon={faPaperPlane} /> Submit Application
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar - Leave Balance & Info */}
        <div className="sidebar-column">
          <Card className="balance-card" title="Your Leave Balance">
            <div className="balance-items">
              <div className="balance-item">
                <div className="balance-header">
                  <span>Annual Leave</span>
                  <span className="balance-numbers">
                    {leaveBalances.annual.remaining} / {leaveBalances.annual.total}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(leaveBalances.annual.used / leaveBalances.annual.total) * 100}%` }}
                  ></div>
                </div>
                <small>Used: {leaveBalances.annual.used} days</small>
              </div>

              <div className="balance-item">
                <div className="balance-header">
                  <span>Sick Leave</span>
                  <span className="balance-numbers">
                    {leaveBalances.sick.remaining} / {leaveBalances.sick.total}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill sick"
                    style={{ width: `${(leaveBalances.sick.used / leaveBalances.sick.total) * 100}%` }}
                  ></div>
                </div>
                <small>Used: {leaveBalances.sick.used} days</small>
              </div>

              <div className="balance-item">
                <div className="balance-header">
                  <span>Personal Leave</span>
                  <span className="balance-numbers">
                    {leaveBalances.personal.remaining} / {leaveBalances.personal.total}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill personal"
                    style={{ width: `${(leaveBalances.personal.used / leaveBalances.personal.total) * 100}%` }}
                  ></div>
                </div>
                <small>Used: {leaveBalances.personal.used} days</small>
              </div>
            </div>
          </Card>

          <Card className="info-card" title="Leave Policy">
            <div className="policy-items">
              <div className="policy-item">
                <FontAwesomeIcon icon={faInfoCircle} />
                <div>
                  <h4>Advance Notice</h4>
                  <p>Annual leave requests must be submitted at least 5 working days in advance.</p>
                </div>
              </div>
              <div className="policy-item">
                <FontAwesomeIcon icon={faInfoCircle} />
                <div>
                  <h4>Sick Leave</h4>
                  <p>Medical certificate required for leave of 3 or more consecutive days.</p>
                </div>
              </div>
              <div className="policy-item">
                <FontAwesomeIcon icon={faInfoCircle} />
                <div>
                  <h4>Emergency Contact</h4>
                  <p>For urgent leave, please also inform your reporting manager via phone.</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="holiday-card" title="Upcoming Holidays">
            <div className="holiday-list">
              <div className="holiday-item">
                <span className="date">26 Jan</span>
                <span className="name">Republic Day</span>
              </div>
              <div className="holiday-item">
                <span className="date">25 Mar</span>
                <span className="name">Holi</span>
              </div>
              <div className="holiday-item">
                <span className="date">15 Aug</span>
                <span className="name">Independence Day</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;