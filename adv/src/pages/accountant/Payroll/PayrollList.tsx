import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  
  faDownload,
  faEye,
  faFlag,
  faCheckCircle,
  faHourglassHalf,
  faMoneyBillWave,
  
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import { formatCurrency } from '../../../utils/formatters';
import { exportToCSV } from '../../../utils/exportUtils';

interface PayrollRecord {
  id: number;
  employeeId: string;
  employeeName: string;
  department: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: 'Pending' | 'Processed' | 'Paid' | 'Flagged';
  paymentDate?: string;
}

interface PayrollSummary {
  totalEmployees: number;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
}

const PayrollList: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2024, 2023, 2022, 2021, 2020];
  const departments = ['All', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Administration'];
  const statuses = ['All', 'Pending', 'Processed', 'Paid', 'Flagged'];

  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth, selectedYear]);

  const fetchPayrollData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockPayrolls: PayrollRecord[] = [
        {
          id: 1,
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          department: 'Computer Science',
          month: selectedMonth,
          year: selectedYear,
          basicSalary: 85000,
          allowances: 45000,
          deductions: 22000,
          netPay: 108000,
          status: 'Paid',
          paymentDate: '2024-03-05',
        },
        {
          id: 2,
          employeeId: 'EMP002',
          employeeName: 'Jane Smith',
          department: 'Mathematics',
          month: selectedMonth,
          year: selectedYear,
          basicSalary: 75000,
          allowances: 40000,
          deductions: 18000,
          netPay: 97000,
          status: 'Processed',
        },
        {
          id: 3,
          employeeId: 'EMP003',
          employeeName: 'Rahul Kumar',
          department: 'Physics',
          month: selectedMonth,
          year: selectedYear,
          basicSalary: 65000,
          allowances: 29000,
          deductions: 16000,
          netPay: 78000,
          status: 'Pending',
        },
        {
          id: 4,
          employeeId: 'EMP004',
          employeeName: 'Priya Sharma',
          department: 'Chemistry',
          month: selectedMonth,
          year: selectedYear,
          basicSalary: 70000,
          allowances: 32000,
          deductions: 17000,
          netPay: 85000,
          status: 'Flagged',
        },
        {
          id: 5,
          employeeId: 'EMP005',
          employeeName: 'Amit Patel',
          department: 'Administration',
          month: selectedMonth,
          year: selectedYear,
          basicSalary: 90000,
          allowances: 50000,
          deductions: 23000,
          netPay: 117000,
          status: 'Processed',
        },
      ];

      setPayrolls(mockPayrolls);
      filterPayrolls(mockPayrolls);

      const totalGross = mockPayrolls.reduce((sum, p) => sum + p.basicSalary + p.allowances, 0);
      const totalNet = mockPayrolls.reduce((sum, p) => sum + p.netPay, 0);
      const totalDeductions = mockPayrolls.reduce((sum, p) => sum + p.deductions, 0);

      setSummary({
        totalEmployees: mockPayrolls.length,
        totalGross,
        totalNet,
        totalDeductions,
      });

      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    filterPayrolls(payrolls);
  }, [searchTerm, statusFilter, departmentFilter]);

  const filterPayrolls = (data: PayrollRecord[]) => {
    let filtered = [...data];

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (departmentFilter !== 'All') {
      filtered = filtered.filter(p => p.department === departmentFilter);
    }

    setFilteredPayrolls(filtered);
  };

  const handleExport = () => {
    const exportData = filteredPayrolls.map(p => ({
      'Employee ID': p.employeeId,
      'Employee Name': p.employeeName,
      'Department': p.department,
      'Month': months[p.month - 1],
      'Year': p.year,
      'Basic Salary': p.basicSalary,
      'Allowances': p.allowances,
      'Deductions': p.deductions,
      'Net Pay': p.netPay,
      'Status': p.status,
      'Payment Date': p.paymentDate || '-',
    }));
    exportToCSV(exportData, `payroll_${months[selectedMonth - 1]}_${selectedYear}.csv`);
    showNotification('Payroll data exported successfully', 'success');
  };

  const handleFlagIssue = () => {
    if (!flagReason.trim()) {
      showNotification('Please provide a reason', 'warning');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      showNotification('Issue flagged for HR review', 'success');
      setShowFlagModal(false);
      setSelectedPayroll(null);
      setFlagReason('');
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: { bg: '#f59e0b20', color: '#f59e0b', icon: faHourglassHalf },
      Processed: { bg: '#3b82f620', color: '#3b82f6', icon: faCheckCircle },
      Paid: { bg: '#10b98120', color: '#10b981', icon: faMoneyBillWave },
      Flagged: { bg: '#ef444420', color: '#ef4444', icon: faFlag },
    };
    const style = styles[status as keyof typeof styles] || styles.Pending;

    return (
      <span className="status-badge" style={{ backgroundColor: style.bg, color: style.color }}>
        <FontAwesomeIcon icon={style.icon} />
        {status}
      </span>
    );
  };

  const columns = [
    {
      key: 'employee',
      title: 'Employee',
      render: (row: PayrollRecord) => (
        <div>
          <div className="employee-name">{row.employeeName}</div>
          <small>{row.employeeId} • {row.department}</small>
        </div>
      ),
    },
    {
      key: 'period',
      title: 'Period',
      render: (row: PayrollRecord) => (
        <div>
          <div>{months[row.month - 1]} {row.year}</div>
        </div>
      ),
    },
    {
      key: 'basic',
      title: 'Basic',
      render: (row: PayrollRecord) => formatCurrency(row.basicSalary),
    },
    {
      key: 'allowances',
      title: 'Allowances',
      render: (row: PayrollRecord) => formatCurrency(row.allowances),
    },
    {
      key: 'deductions',
      title: 'Deductions',
      render: (row: PayrollRecord) => (
        <span className="text-danger">{formatCurrency(row.deductions)}</span>
      ),
    },
    {
      key: 'netPay',
      title: 'Net Pay',
      render: (row: PayrollRecord) => (
        <span className="net-pay">{formatCurrency(row.netPay)}</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: PayrollRecord) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: PayrollRecord) => (
        <div className="action-buttons">
          <Link to={`/accountant/payroll/${row.id}`}>
            <button className="action-btn view" title="View Details">
              <FontAwesomeIcon icon={faEye} />
            </button>
          </Link>
          {row.status !== 'Flagged' && (
            <button
              className="action-btn warning"
              onClick={() => {
                setSelectedPayroll(row);
                setShowFlagModal(true);
              }}
              title="Flag Issue"
            >
              <FontAwesomeIcon icon={faFlag} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="payroll-list-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Payroll Management</h1>
          <p>View and manage employee payroll</p>
        </div>
        <div className="header-actions">
          <div className="month-selector">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="filter-select"
            >
              {months.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="filter-select"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <Button variant="secondary" onClick={handleExport}>
            <FontAwesomeIcon icon={faDownload} /> Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <Card className="summary-card">
            <h3>Total Employees</h3>
            <p className="value">{summary.totalEmployees}</p>
          </Card>
          <Card className="summary-card">
            <h3>Gross Payroll</h3>
            <p className="value">{formatCurrency(summary.totalGross)}</p>
          </Card>
          <Card className="summary-card">
            <h3>Net Payroll</h3>
            <p className="value success">{formatCurrency(summary.totalNet)}</p>
          </Card>
          <Card className="summary-card">
            <h3>Total Deductions</h3>
            <p className="value warning">{formatCurrency(summary.totalDeductions)}</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-grid">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search by employee name or ID..."
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
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="filter-select"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setStatusFilter('All');
            setDepartmentFilter('All');
          }}>
            <FontAwesomeIcon icon={faTimes} /> Clear
          </Button>
        </div>
      </Card>

      {/* Payroll Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          data={filteredPayrolls}
          loading={loading}
        />
      </Card>

      {/* Flag Modal */}
      <Modal
        isOpen={showFlagModal}
        onClose={() => {
          setShowFlagModal(false);
          setSelectedPayroll(null);
          setFlagReason('');
        }}
        title="Flag Payroll Issue"
        size="small"
      >
        <div className="flag-modal">
          {selectedPayroll && (
            <>
              <p>
                Flag issue for <strong>{selectedPayroll.employeeName}</strong> ({selectedPayroll.employeeId})
              </p>
              <p className="period">
                {months[selectedPayroll.month - 1]} {selectedPayroll.year}
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
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PayrollList;