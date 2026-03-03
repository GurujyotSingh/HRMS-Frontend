import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  
  faPlus,
  faEye,
  faCheck,
  faTimes,
  faDownload,
  faMoneyBill,
  faPlane,
  faTrain,
  faBus,
  
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import { TravelClaim } from '../../../types/resource';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const TravelClaims: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [claims, setClaims] = useState<TravelClaim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<TravelClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<TravelClaim | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formData, setFormData] = useState({
    purpose: '',
    destination: '',
    start_date: '',
    end_date: '',
    estimated_amount: '',
    expenses: [] as {
      type: string;
      date: string;
      amount: number;
      description: string;
      receipt?: File;
    }[],
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockClaims: TravelClaim[] = [
        {
          claim_id: 1,
          employee_id: 1,
          employee: { emp_id: 1, name: 'John Doe', department: 'Computer Science' },
          purpose: 'International Conference on AI',
          destination: 'Singapore',
          start_date: '2024-02-10',
          end_date: '2024-02-15',
          estimated_amount: 150000,
          actual_amount: 145000,
          status: 'Approved',
          approved_by: 5,
          approved_on: '2024-01-20',
        },
        {
          claim_id: 2,
          employee_id: 2,
          employee: { emp_id: 2, name: 'Jane Smith', department: 'Mathematics' },
          purpose: 'Research Collaboration',
          destination: 'Delhi',
          start_date: '2024-03-01',
          end_date: '2024-03-05',
          estimated_amount: 45000,
          status: 'Pending',
        },
        {
          claim_id: 3,
          employee_id: 3,
          employee: { emp_id: 3, name: 'Rahul Kumar', department: 'Physics' },
          purpose: 'Workshop on Quantum Computing',
          destination: 'Mumbai',
          start_date: '2024-02-20',
          end_date: '2024-02-22',
          estimated_amount: 25000,
          actual_amount: 27500,
          status: 'Submitted',
        },
        {
          claim_id: 4,
          employee_id: 4,
          employee: { emp_id: 4, name: 'Priya Sharma', department: 'Chemistry' },
          purpose: 'Lab Equipment Purchase',
          destination: 'Chennai',
          start_date: '2024-01-15',
          end_date: '2024-01-18',
          estimated_amount: 35000,
          actual_amount: 32500,
          status: 'Paid',
          approved_by: 5,
          approved_on: '2024-01-25',
        },
      ];
      setClaims(mockClaims);
      setFilteredClaims(mockClaims);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = claims;

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.destination?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    setFilteredClaims(filtered);
  }, [searchTerm, statusFilter, claims]);

  const handleAddExpense = () => {
    // Add expense to list
  };

  const handleSubmitClaim = () => {
    // Validate
    if (!formData.purpose || !formData.destination || !formData.start_date || !formData.end_date || !formData.estimated_amount) {
      showNotification('Please fill in all fields', 'warning');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      showNotification('Travel claim submitted successfully', 'success');
      setShowClaimModal(false);
      setFormData({
        purpose: '',
        destination: '',
        start_date: '',
        end_date: '',
        estimated_amount: '',
        expenses: [],
      });
    }, 1000);
  };

  const handleApprove = (claimId: number) => {
    // Simulate API call
    setTimeout(() => {
      showNotification('Claim approved', 'success');
    }, 500);
  };

  const handleReject = (claimId: number) => {
    // Simulate API call
    setTimeout(() => {
      showNotification('Claim rejected', 'info');
    }, 500);
  };

  const handleProcessPayment = (claimId: number) => {
    // Simulate API call
    setTimeout(() => {
      showNotification('Payment processed', 'success');
    }, 500);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Draft: { bg: '#6b728020', color: '#6b7280' },
      Submitted: { bg: '#3b82f620', color: '#3b82f6' },
      Approved: { bg: '#10b98120', color: '#10b981' },
      Rejected: { bg: '#ef444420', color: '#ef4444' },
      Paid: { bg: '#8b5cf620', color: '#8b5cf6' },
    };
    const style = styles[status as keyof typeof styles] || styles.Submitted;

    return (
      <span className="status-badge" style={{ backgroundColor: style.bg, color: style.color }}>
        {status}
      </span>
    );
  };

  const getTravelIcon = (destination: string) => {
    // Simple logic - could be enhanced based on distance/type
    if (destination === 'Singapore' || destination === 'International') return faPlane;
    if (destination.includes('Delhi') || destination.includes('Mumbai')) return faTrain;
    return faBus;
  };

  const columns = [
    {
      key: 'employee',
      title: 'Employee',
      render: (row: TravelClaim) => (
        <div>
          <div className="employee-name">{row.employee?.name}</div>
          <small>{row.employee?.department}</small>
        </div>
      ),
    },
    {
      key: 'travel',
      title: 'Travel Details',
      render: (row: TravelClaim) => (
        <div className="travel-cell">
          <FontAwesomeIcon icon={getTravelIcon(row.destination)} />
          <div>
            <div>{row.purpose}</div>
            <small>{row.destination}</small>
          </div>
        </div>
      ),
    },
    {
      key: 'dates',
      title: 'Dates',
      render: (row: TravelClaim) => (
        <div>
          <div>{formatDate(row.start_date)} - {formatDate(row.end_date)}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      title: 'Amount',
      render: (row: TravelClaim) => (
        <div>
          <div className="estimated">{formatCurrency(row.estimated_amount)}</div>
          {row.actual_amount && (
            <small className="actual">Actual: {formatCurrency(row.actual_amount)}</small>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: TravelClaim) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: TravelClaim) => (
        <div className="action-buttons">
          <button
            className="action-btn view"
            onClick={() => {
              setSelectedClaim(row);
              setShowDetailsModal(true);
            }}
            title="View Details"
          >
            <FontAwesomeIcon icon={faEye} />
          </button>
          {row.status === 'Submitted' && hasPermission('ApproveTravel') && (
            <>
              <button
                className="action-btn approve"
                onClick={() => handleApprove(row.claim_id)}
                title="Approve"
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                className="action-btn reject"
                onClick={() => handleReject(row.claim_id)}
                title="Reject"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </>
          )}
          {row.status === 'Approved' && (
            <button
              className="action-btn success"
              onClick={() => handleProcessPayment(row.claim_id)}
              title="Process Payment"
            >
              <FontAwesomeIcon icon={faMoneyBill} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const statuses = ['All', 'Draft', 'Submitted', 'Approved', 'Rejected', 'Paid'];

  return (
    <div className="travel-claims-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Travel Claims</h1>
          <p>Manage employee travel and expense claims</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={() => setShowClaimModal(true)}>
            <FontAwesomeIcon icon={faPlus} /> New Claim
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <Card className="summary-card">
          <h3>Total Claims</h3>
          <p className="value">{claims.length}</p>
        </Card>
        <Card className="summary-card">
          <h3>Pending Approval</h3>
          <p className="value warning">{claims.filter(c => c.status === 'Submitted').length}</p>
        </Card>
        <Card className="summary-card">
          <h3>Total Amount</h3>
          <p className="value">
            {formatCurrency(claims.reduce((sum, c) => sum + (c.actual_amount || c.estimated_amount), 0))}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-grid">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search claims..."
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
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setStatusFilter('All');
          }}>
            <FontAwesomeIcon icon={faTimes} /> Clear
          </Button>
        </div>
      </Card>

      {/* Claims Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          data={filteredClaims}
          loading={loading}
        />
      </Card>

      {/* New Claim Modal */}
      <Modal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        title="New Travel Claim"
        size="large"
      >
        <div className="claim-form">
          <div className="form-row">
            <div className="form-group">
              <label>Purpose of Travel *</label>
              <input
                type="text"
                className="form-control"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="e.g., Conference, Training, Meeting"
              />
            </div>

            <div className="form-group">
              <label>Destination *</label>
              <input
                type="text"
                className="form-control"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="City, Country"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Estimated Amount *</label>
            <input
              type="number"
              className="form-control"
              value={formData.estimated_amount}
              onChange={(e) => setFormData({ ...formData, estimated_amount: e.target.value })}
              placeholder="Enter estimated amount"
            />
          </div>

          <div className="form-section">
            <h3>Expenses</h3>
            <div className="expense-list">
              {formData.expenses.map((expense, index) => (
                <div key={index} className="expense-item">
                  <span>{expense.type} - {formatCurrency(expense.amount)}</span>
                  <button className="remove-btn">
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              ))}
            </div>

            <Button variant="secondary" onClick={handleAddExpense}>
              <FontAwesomeIcon icon={faPlus} /> Add Expense
            </Button>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowClaimModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitClaim}>
              Submit Claim
            </Button>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      {selectedClaim && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedClaim(null);
          }}
          title="Claim Details"
          size="medium"
        >
          <div className="claim-details">
            <div className="detail-row">
              <span className="label">Employee:</span>
              <span className="value">{selectedClaim.employee?.name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Department:</span>
              <span className="value">{selectedClaim.employee?.department}</span>
            </div>
            <div className="detail-row">
              <span className="label">Purpose:</span>
              <span className="value">{selectedClaim.purpose}</span>
            </div>
            <div className="detail-row">
              <span className="label">Destination:</span>
              <span className="value">{selectedClaim.destination}</span>
            </div>
            <div className="detail-row">
              <span className="label">Travel Dates:</span>
              <span className="value">
                {formatDate(selectedClaim.start_date)} - {formatDate(selectedClaim.end_date)}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Estimated Amount:</span>
              <span className="value">{formatCurrency(selectedClaim.estimated_amount)}</span>
            </div>
            {selectedClaim.actual_amount && (
              <div className="detail-row">
                <span className="label">Actual Amount:</span>
                <span className="value">{formatCurrency(selectedClaim.actual_amount)}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="label">Status:</span>
              <span className="value">{getStatusBadge(selectedClaim.status)}</span>
            </div>
            {selectedClaim.approved_by && (
              <>
                <div className="detail-row">
                  <span className="label">Approved By:</span>
                  <span className="value">Admin</span>
                </div>
                <div className="detail-row">
                  <span className="label">Approved On:</span>
                  <span className="value">{formatDate(selectedClaim.approved_on)}</span>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            {selectedClaim.status === 'Paid' && (
              <Button variant="primary">
                <FontAwesomeIcon icon={faDownload} /> Download Receipts
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TravelClaims;