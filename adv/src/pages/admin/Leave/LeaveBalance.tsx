import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faDownload,
  faFilter,
  faEdit,
  faSave,
  faTimes,
  faHistory,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import { LeaveBalance } from '../../../types/leave';
import { exportToCSV } from '../../../utils/exportUtils';

interface LeaveBalanceWithEmployee extends LeaveBalance {
  employeeName: string;
  department: string;
}

const LeaveBalancePage: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [balances, setBalances] = useState<LeaveBalanceWithEmployee[]>([]);
  const [filteredBalances, setFilteredBalances] = useState<LeaveBalanceWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [selectedEmployee, setSelectedEmployee] = useState<LeaveBalanceWithEmployee | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    leaveType: 'annual',
    days: 0,
    reason: '',
    type: 'add' as 'add' | 'deduct',
  });

  const years = ['2024', '2023', '2022', '2021', '2020'];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockBalances: LeaveBalanceWithEmployee[] = [
        {
          balance_id: 1,
          employee_id: 1,
          employeeName: 'John Doe',
          department: 'Computer Science',
          leave_type_id: 1,
          year: 2024,
          total_days: 20,
          used_days: 8,
          remaining_days: 12,
          carried_forward: 0,
        },
        {
          balance_id: 2,
          employee_id: 1,
          employeeName: 'John Doe',
          department: 'Computer Science',
          leave_type_id: 2,
          year: 2024,
          total_days: 12,
          used_days: 3,
          remaining_days: 9,
          carried_forward: 0,
        },
        {
          balance_id: 3,
          employee_id: 1,
          employeeName: 'John Doe',
          department: 'Computer Science',
          leave_type_id: 3,
          year: 2024,
          total_days: 5,
          used_days: 1,
          remaining_days: 4,
          carried_forward: 0,
        },
        {
          balance_id: 4,
          employee_id: 2,
          employeeName: 'Jane Smith',
          department: 'Mathematics',
          leave_type_id: 1,
          year: 2024,
          total_days: 20,
          used_days: 12,
          remaining_days: 8,
          carried_forward: 0,
        },
        {
          balance_id: 5,
          employee_id: 2,
          employeeName: 'Jane Smith',
          department: 'Mathematics',
          leave_type_id: 2,
          year: 2024,
          total_days: 12,
          used_days: 4,
          remaining_days: 8,
          carried_forward: 0,
        },
      ];
      setBalances(mockBalances);
      setFilteredBalances(mockBalances);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = balances;

    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== 'All') {
      filtered = filtered.filter(b => b.department === departmentFilter);
    }

    if (yearFilter) {
      filtered = filtered.filter(b => b.year.toString() === yearFilter);
    }

    setFilteredBalances(filtered);
  }, [searchTerm, departmentFilter, yearFilter, balances]);

  const handleAdjustBalance = () => {
    if (!selectedEmployee || adjustmentData.days <= 0) return;

    // Simulate API call
    setTimeout(() => {
      showNotification(
        `Leave balance ${adjustmentData.type === 'add' ? 'added' : 'deducted'} successfully`,
        'success'
      );
      setShowAdjustModal(false);
      setSelectedEmployee(null);
      setAdjustmentData({ leaveType: 'annual', days: 0, reason: '', type: 'add' });
    }, 1000);
  };

  const handleExport = () => {
    const exportData = filteredBalances.map(b => ({
      'Employee': b.employeeName,
      'Department': b.department,
      'Leave Type': b.leave_type_id === 1 ? 'Annual' : b.leave_type_id === 2 ? 'Sick' : 'Personal',
      'Year': b.year,
      'Total Days': b.total_days,
      'Used Days': b.used_days,
      'Remaining': b.remaining_days,
      'Carried Forward': b.carried_forward,
    }));
    exportToCSV(exportData, 'leave_balances.csv');
    showNotification('Data exported successfully', 'success');
  };

  const departments = ['All', ...new Set(balances.map(b => b.department))];

  const columns = [
    { key: 'employeeName', title: 'Employee' },
    { key: 'department', title: 'Department' },
    {
      key: 'leaveType',
      title: 'Leave Type',
      render: (row: LeaveBalanceWithEmployee) => {
        const types = ['Annual', 'Sick', 'Personal'];
        return types[row.leave_type_id - 1] || 'Other';
      },
    },
    { key: 'year', title: 'Year' },
    { key: 'total_days', title: 'Total Days' },
    { key: 'used_days', title: 'Used' },
    {
      key: 'remaining_days',
      title: 'Remaining',
      render: (row: LeaveBalanceWithEmployee) => (
        <span className={`remaining-badge ${row.remaining_days < 5 ? 'low' : ''}`}>
          {row.remaining_days}
        </span>
      ),
    },
    { key: 'carried_forward', title: 'Carried Forward' },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: LeaveBalanceWithEmployee) => (
        <button
          className="action-btn edit"
          onClick={() => {
            setSelectedEmployee(row);
            setShowAdjustModal(true);
          }}
          title="Adjust Balance"
        >
          <FontAwesomeIcon icon={faEdit} />
        </button>
      ),
    },
  ];

  return (
    <div className="leave-balance-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Leave Balance</h1>
          <p>Manage employee leave balances</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={handleExport}>
            <FontAwesomeIcon icon={faDownload} /> Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-grid">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search by employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="filter-select"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="filter-select"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setDepartmentFilter('All');
            setYearFilter(new Date().getFullYear().toString());
          }}>
            <FontAwesomeIcon icon={faTimes} /> Clear
          </Button>
        </div>
      </Card>

      {/* Balance Summary */}
      <div className="summary-cards">
        <Card className="summary-card">
          <h3>Total Employees</h3>
          <p className="value">{new Set(balances.map(b => b.employee_id)).size}</p>
        </Card>
        <Card className="summary-card">
          <h3>Average Leave Balance</h3>
          <p className="value">
            {Math.round(balances.reduce((sum, b) => sum + b.remaining_days, 0) / balances.length)}
          </p>
        </Card>
        <Card className="summary-card">
          <h3>Low Balance Alerts</h3>
          <p className="value warning">
            {balances.filter(b => b.remaining_days < 5).length}
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          data={filteredBalances}
          loading={loading}
        />
      </Card>

      {/* Adjust Balance Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={showAdjustModal}
          onClose={() => {
            setShowAdjustModal(false);
            setSelectedEmployee(null);
            setAdjustmentData({ leaveType: 'annual', days: 0, reason: '', type: 'add' });
          }}
          title="Adjust Leave Balance"
          size="medium"
        >
          <div className="adjust-balance-modal">
            <div className="employee-info">
              <h4>{selectedEmployee.employeeName}</h4>
              <p>{selectedEmployee.department}</p>
            </div>

            <div className="current-balance">
              <div className="balance-item">
                <span>Current Annual Balance:</span>
                <strong>12 days</strong>
              </div>
            </div>

            <div className="form-group">
              <label>Adjustment Type</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="adjustType"
                    value="add"
                    checked={adjustmentData.type === 'add'}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, type: 'add' })}
                  />
                  <span>Add Days</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="adjustType"
                    value="deduct"
                    checked={adjustmentData.type === 'deduct'}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, type: 'deduct' })}
                  />
                  <span>Deduct Days</span>
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Leave Type</label>
                <select
                  className="form-control"
                  value={adjustmentData.leaveType}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, leaveType: e.target.value })}
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                </select>
              </div>

              <div className="form-group">
                <label>Number of Days</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="30"
                  value={adjustmentData.days || ''}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, days: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Reason for Adjustment</label>
              <textarea
                className="form-control"
                rows={3}
                value={adjustmentData.reason}
                onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                placeholder="Explain why you're adjusting this balance..."
              />
            </div>

            <div className="modal-footer">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAdjustModal(false);
                  setSelectedEmployee(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAdjustBalance}
                disabled={adjustmentData.days <= 0 || !adjustmentData.reason}
              >
                <FontAwesomeIcon icon={faSave} />
                Adjust Balance
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LeaveBalancePage;