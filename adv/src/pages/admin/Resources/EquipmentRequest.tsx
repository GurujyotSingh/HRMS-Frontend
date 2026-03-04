import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,

  faPlus,

  faCheck,
  faTimes,
  faLaptop,
  faDesktop,
  faTablet,
  faMobile,
    
  faWrench,
  faClock,

} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Equipment } from '../../../types/resource';
import { formatDate } from '../../../utils/formatters';

interface EquipmentRequest {
  request_id: number;
  equipment_id: number;
  equipment?: Equipment;
  requested_by: number;
  employee?: { emp_id: number; name: string; department: string };
  request_date: string;
  required_from: string;
  required_to: string;
  purpose: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Issued' | 'Returned';
  issued_date?: string;
  returned_date?: string;
  comments?: string;
}

const EquipmentRequestPage: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<EquipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EquipmentRequest | null>(null);
  const [formData, setFormData] = useState({
    equipment_id: '',
    required_from: '',
    required_to: '',
    purpose: '',
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockEquipment: Equipment[] = [
        {
          equipment_id: 1,
          name: 'Dell XPS Laptop',
          type: 'Laptop',
          serial_number: 'XPS-2024-001',
          condition: 'Good',
          location: 'IT Store Room',
          is_available: true,
        },
        {
          equipment_id: 2,
          name: 'HP LaserJet Printer',
          type: 'Printer',
          serial_number: 'HP-2023-045',
          condition: 'Good',
          location: 'CS Department',
          is_available: true,
        },
        {
          equipment_id: 3,
          name: 'iPad Pro',
          type: 'Tablet',
          serial_number: 'IPAD-2024-012',
          condition: 'New',
          location: 'IT Store Room',
          is_available: true,
        },
        {
          equipment_id: 4,
          name: 'Lenovo ThinkPad',
          type: 'Laptop',
          serial_number: 'LEN-2023-089',
          condition: 'Fair',
          location: 'Physics Department',
          is_available: false,
        },
      ];

      const mockRequests: EquipmentRequest[] = [
        {
          request_id: 1,
          equipment_id: 1,
          equipment: mockEquipment[0],
          requested_by: 1,
          employee: { emp_id: 1, name: 'John Doe', department: 'Computer Science' },
          request_date: '2024-03-10',
          required_from: '2024-03-15',
          required_to: '2024-03-20',
          purpose: 'Conference presentation',
          status: 'Approved',
          issued_date: '2024-03-14',
        },
        {
          request_id: 2,
          equipment_id: 3,
          equipment: mockEquipment[2],
          requested_by: 2,
          employee: { emp_id: 2, name: 'Jane Smith', department: 'Mathematics' },
          request_date: '2024-03-12',
          required_from: '2024-03-18',
          required_to: '2024-03-25',
          purpose: 'Research work',
          status: 'Pending',
        },
        {
          request_id: 3,
          equipment_id: 2,
          equipment: mockEquipment[1],
          requested_by: 3,
          employee: { emp_id: 3, name: 'Rahul Kumar', department: 'Physics' },
          request_date: '2024-03-08',
          required_from: '2024-03-10',
          required_to: '2024-03-12',
          purpose: 'Printing project reports',
          status: 'Returned',
          issued_date: '2024-03-10',
          returned_date: '2024-03-12',
        },
      ];

      setEquipment(mockEquipment);
      setRequests(mockRequests);
      setFilteredRequests(mockRequests);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (typeFilter !== 'All') {
      filtered = filtered.filter(r => r.equipment?.type === typeFilter);
    }

    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, typeFilter, requests]);

  const handleRequest = () => {
    if (!formData.equipment_id || !formData.required_from || !formData.required_to || !formData.purpose) {
      showNotification('Please fill in all fields', 'warning');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      showNotification('Equipment request submitted successfully', 'success');
      setShowRequestModal(false);
      setFormData({
        equipment_id: '',
        required_from: '',
        required_to: '',
        purpose: '',
      });
    }, 1000);
  };

  const handleApprove = (requestId: number) => {
    // Simulate API call
    setTimeout(() => {
      showNotification('Request approved', 'success');
    }, 500);
  };

  const handleIssue = (requestId: number) => {
    // Simulate API call
    setTimeout(() => {
      showNotification('Equipment issued', 'success');
    }, 500);
  };

  const handleReturn = (requestId: number) => {
    // Simulate API call
    setTimeout(() => {
      showNotification('Equipment returned', 'success');
    }, 500);
  };

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'Laptop': return faLaptop;
      case 'Desktop': return faDesktop;
      case 'Tablet': return faTablet;
      case 'Mobile': return faMobile;
      case 'Printer': return faPrinter;
      default: return faWrench;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: { bg: '#f59e0b20', color: '#f59e0b' },
      Approved: { bg: '#3b82f620', color: '#3b82f6' },
      Rejected: { bg: '#ef444420', color: '#ef4444' },
      Issued: { bg: '#10b98120', color: '#10b981' },
      Returned: { bg: '#6b728020', color: '#6b7280' },
    };
    const style = styles[status as keyof typeof styles] || styles.Pending;

    return (
      <span className="status-badge" style={{ backgroundColor: style.bg, color: style.color }}>
        {status}
      </span>
    );
  };

  const columns = [
    {
      key: 'equipment',
      title: 'Equipment',
      render: (row: EquipmentRequest) => (
        <div className="equipment-cell">
          <FontAwesomeIcon icon={getEquipmentIcon(row.equipment?.type || '')} />
          <div>
            <div>{row.equipment?.name}</div>
            <small>SN: {row.equipment?.serial_number}</small>
          </div>
        </div>
      ),
    },
    {
      key: 'requester',
      title: 'Requested By',
      render: (row: EquipmentRequest) => (
        <div>
          <div>{row.employee?.name}</div>
          <small>{row.employee?.department}</small>
        </div>
      ),
    },
    {
      key: 'duration',
      title: 'Duration',
      render: (row: EquipmentRequest) => (
        <div>
          <div>{formatDate(row.required_from)} - {formatDate(row.required_to)}</div>
        </div>
      ),
    },
    {
      key: 'purpose',
      title: 'Purpose',
      render: (row: EquipmentRequest) => row.purpose,
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: EquipmentRequest) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: EquipmentRequest) => (
        <div className="action-buttons">
          {row.status === 'Pending' && hasPermission('ApproveResource') && (
            <>
              <button
                className="action-btn approve"
                onClick={() => handleApprove(row.request_id)}
                title="Approve"
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                className="action-btn reject"
                onClick={() => handleReject(row.request_id)}
                title="Reject"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </>
          )}
          {row.status === 'Approved' && (
            <button
              className="action-btn success"
              onClick={() => handleIssue(row.request_id)}
              title="Issue Equipment"
            >
              <FontAwesomeIcon icon={faCheck} /> Issue
            </button>
          )}
          {row.status === 'Issued' && (
            <button
              className="action-btn warning"
              onClick={() => handleReturn(row.request_id)}
              title="Return Equipment"
            >
              <FontAwesomeIcon icon={faClock} /> Return
            </button>
          )}
        </div>
      ),
    },
  ];

  const equipmentTypes = ['All', ...new Set(equipment.map(e => e.type))];
  const statuses = ['All', 'Pending', 'Approved', 'Rejected', 'Issued', 'Returned'];

  return (
    <div className="equipment-request-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Equipment Requests</h1>
          <p>Manage equipment borrowing and returns</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={() => setShowRequestModal(true)}>
            <FontAwesomeIcon icon={faPlus} /> New Request
          </Button>
        </div>
      </div>

      {/* Equipment Availability */}
      <div className="equipment-grid">
        {equipment.filter(e => e.is_available).map(item => (
          <Card key={item.equipment_id} className="equipment-card">
            <div className="equipment-icon">
              <FontAwesomeIcon icon={getEquipmentIcon(item.type)} />
            </div>
            <div className="equipment-info">
              <h3>{item.name}</h3>
              <p>{item.type} • SN: {item.serial_number}</p>
              <p className="location">{item.location}</p>
              <span className="condition-badge">{item.condition}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-grid">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search requests..."
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

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            {equipmentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setStatusFilter('All');
            setTypeFilter('All');
          }}>
            <FontAwesomeIcon icon={faTimes} /> Clear
          </Button>
        </div>
      </Card>

      {/* Requests Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          data={filteredRequests}
          loading={loading}
        />
      </Card>

      {/* Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="New Equipment Request"
        size="medium"
      >
        <div className="request-form">
          <div className="form-group">
            <label>Select Equipment *</label>
            <select
              className="form-control"
              value={formData.equipment_id}
              onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
            >
              <option value="">Choose equipment</option>
              {equipment.filter(e => e.is_available).map(item => (
                <option key={item.equipment_id} value={item.equipment_id}>
                  {item.name} ({item.type})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Required From *</label>
              <input
                type="date"
                className="form-control"
                value={formData.required_from}
                onChange={(e) => setFormData({ ...formData, required_from: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>Required To *</label>
              <input
                type="date"
                className="form-control"
                value={formData.required_to}
                onChange={(e) => setFormData({ ...formData, required_to: e.target.value })}
                min={formData.required_from}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Purpose *</label>
            <textarea
              className="form-control"
              rows={3}
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="Explain why you need this equipment..."
            />
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowRequestModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRequest}>
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EquipmentRequestPage;