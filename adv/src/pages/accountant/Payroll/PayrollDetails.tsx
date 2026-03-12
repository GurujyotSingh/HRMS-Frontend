import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faDownload,
  faFlag,
  faPrint,
  
  faHistory,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface PayrollDetail {
  id: number;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: {
    hra: number;
    da: number;
    travel: number;
    special: number;
    other: number;
  };
  deductions: {
    pf: number;
    pt: number;
    tds: number;
    insurance: number;
    other: number;
  };
  grossPay: number;
  netPay: number;
  status: 'Pending' | 'Processed' | 'Paid' | 'Flagged';
  paymentDate?: string;
  paymentMethod?: string;
  bankAccount?: string;
  panNumber?: string;
  notes?: string;
  history?: {
    date: string;
    action: string;
    by: string;
  }[];
}

const PayrollDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState<PayrollDetail | null>(null);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockPayroll: PayrollDetail = {
        id: Number(id),
        employeeId: 'EMP001',
        employeeName: 'John Doe',
        department: 'Computer Science',
        designation: 'Professor',
        month: 2,
        year: 2024,
        basicSalary: 85000,
        allowances: {
          hra: 25000,
          da: 15000,
          travel: 5000,
          special: 0,
          other: 0,
        },
        deductions: {
          pf: 12000,
          pt: 2000,
          tds: 8000,
          insurance: 1500,
          other: 0,
        },
        grossPay: 130000,
        netPay: 108000,
        status: 'Paid',
        paymentDate: '2024-03-05',
        paymentMethod: 'Bank Transfer',
        bankAccount: '**** **** **** 1234',
        panNumber: 'ABCDE1234F',
        notes: 'Regular monthly payroll',
        history: [
          {
            date: '2024-03-01T10:30:00',
            action: 'Payroll processed',
            by: 'Accountant',
          },
          {
            date: '2024-03-05T09:15:00',
            action: 'Payment initiated',
            by: 'System',
          },
          {
            date: '2024-03-05T14:20:00',
            action: 'Payment completed',
            by: 'Bank',
          },
        ],
      };
      setPayroll(mockPayroll);
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleFlagIssue = () => {
    if (!flagReason.trim()) {
      showNotification('Please provide a reason', 'warning');
      return;
    }

    setTimeout(() => {
      showNotification('Issue flagged for HR review', 'success');
      setShowFlagModal(false);
      setFlagReason('');
    }, 1000);
  };

  const handleDownloadPayslip = () => {
    showNotification('Payslip downloaded', 'success');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading payroll details...</p>
      </div>
    );
  }

  if (!payroll) {
    return (
      <div className="not-found">
        <h2>Payroll Record Not Found</h2>
        <Button variant="primary" onClick={() => navigate('/accountant/payroll')}>
          Back to Payroll
        </Button>
      </div>
    );
  }

  return (
    <div className="payroll-details-page">
      <div className="page-header">
        <div className="header-left">
          <Button variant="outline" onClick={() => navigate('/accountant/payroll')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </Button>
          <h1>Payroll Details</h1>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={handleDownloadPayslip}>
            <FontAwesomeIcon icon={faDownload} /> Download Payslip
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <FontAwesomeIcon icon={faPrint} /> Print
          </Button>
          {payroll.status !== 'Flagged' && (
            <Button variant="warning" onClick={() => setShowFlagModal(true)}>
              <FontAwesomeIcon icon={faFlag} /> Flag Issue
            </Button>
          )}
        </div>
      </div>

      <div className="details-grid">
        {/* Employee Info */}
        <Card className="info-card">
          <h3>Employee Information</h3>
          <div className="info-row">
            <span className="label">Name:</span>
            <span className="value">{payroll.employeeName}</span>
          </div>
          <div className="info-row">
            <span className="label">Employee ID:</span>
            <span className="value">{payroll.employeeId}</span>
          </div>
          <div className="info-row">
            <span className="label">Department:</span>
            <span className="value">{payroll.department}</span>
          </div>
          <div className="info-row">
            <span className="label">Designation:</span>
            <span className="value">{payroll.designation}</span>
          </div>
          <div className="info-row">
            <span className="label">PAN Number:</span>
            <span className="value">{payroll.panNumber}</span>
          </div>
        </Card>

        {/* Payroll Info */}
        <Card className="info-card">
          <h3>Payroll Information</h3>
          <div className="info-row">
            <span className="label">Period:</span>
            <span className="value">{months[payroll.month - 1]} {payroll.year}</span>
          </div>
          <div className="info-row">
            <span className="label">Status:</span>
            <span className={`status-badge status-${payroll.status.toLowerCase()}`}>
              {payroll.status}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Payment Date:</span>
            <span className="value">{payroll.paymentDate ? formatDate(payroll.paymentDate) : '-'}</span>
          </div>
          <div className="info-row">
            <span className="label">Payment Method:</span>
            <span className="value">{payroll.paymentMethod || '-'}</span>
          </div>
          <div className="info-row">
            <span className="label">Bank Account:</span>
            <span className="value">{payroll.bankAccount || '-'}</span>
          </div>
        </Card>
      </div>

      {/* Salary Breakdown */}
      <div className="salary-grid">
        <Card className="salary-card">
          <h3>Earnings</h3>
          <div className="salary-items">
            <div className="salary-item">
              <span>Basic Salary</span>
              <span className="amount">{formatCurrency(payroll.basicSalary)}</span>
            </div>
            <div className="salary-item">
              <span>HRA</span>
              <span className="amount">{formatCurrency(payroll.allowances.hra)}</span>
            </div>
            <div className="salary-item">
              <span>DA</span>
              <span className="amount">{formatCurrency(payroll.allowances.da)}</span>
            </div>
            <div className="salary-item">
              <span>Travel Allowance</span>
              <span className="amount">{formatCurrency(payroll.allowances.travel)}</span>
            </div>
            {payroll.allowances.special > 0 && (
              <div className="salary-item">
                <span>Special Allowance</span>
                <span className="amount">{formatCurrency(payroll.allowances.special)}</span>
              </div>
            )}
            {payroll.allowances.other > 0 && (
              <div className="salary-item">
                <span>Other Allowances</span>
                <span className="amount">{formatCurrency(payroll.allowances.other)}</span>
              </div>
            )}
            <div className="salary-item total">
              <span>Gross Pay</span>
              <span className="amount">{formatCurrency(payroll.grossPay)}</span>
            </div>
          </div>
        </Card>

        <Card className="salary-card">
          <h3>Deductions</h3>
          <div className="salary-items">
            <div className="salary-item">
              <span>PF</span>
              <span className="amount">- {formatCurrency(payroll.deductions.pf)}</span>
            </div>
            <div className="salary-item">
              <span>Professional Tax</span>
              <span className="amount">- {formatCurrency(payroll.deductions.pt)}</span>
            </div>
            <div className="salary-item">
              <span>TDS</span>
              <span className="amount">- {formatCurrency(payroll.deductions.tds)}</span>
            </div>
            <div className="salary-item">
              <span>Insurance</span>
              <span className="amount">- {formatCurrency(payroll.deductions.insurance)}</span>
            </div>
            {payroll.deductions.other > 0 && (
              <div className="salary-item">
                <span>Other Deductions</span>
                <span className="amount">- {formatCurrency(payroll.deductions.other)}</span>
              </div>
            )}
            <div className="salary-item total">
              <span>Net Pay</span>
              <span className="amount net">{formatCurrency(payroll.netPay)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Notes */}
      {payroll.notes && (
        <Card className="notes-card">
          <h3>Notes</h3>
          <p>{payroll.notes}</p>
        </Card>
      )}

      {/* History */}
      <Card className="history-card" title="Payment History">
        <div className="timeline">
          {payroll.history?.map((item, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-icon">
                <FontAwesomeIcon icon={faHistory} />
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="action">{item.action}</span>
                  <span className="date">{new Date(item.date).toLocaleString()}</span>
                </div>
                <span className="actor">By: {item.by}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Flag Modal */}
      <Modal
        isOpen={showFlagModal}
        onClose={() => {
          setShowFlagModal(false);
          setFlagReason('');
        }}
        title="Flag Payroll Issue"
        size="small"
      >
        <div className="flag-modal">
          <p>
            Flag issue for <strong>{payroll.employeeName}</strong> ({months[payroll.month - 1]} {payroll.year})
          </p>

          <div className="form-group">
            <label>Issue Description *</label>
            <textarea
              className="form-control"
              rows={4}
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Describe the issue with this payroll entry..."
            />
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowFlagModal(false)}>
              Cancel
            </Button>
            <Button variant="warning" onClick={handleFlagIssue}>
              <FontAwesomeIcon icon={faFlag} /> Flag Issue
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PayrollDetails;