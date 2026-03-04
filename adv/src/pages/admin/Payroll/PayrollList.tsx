import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  
  faPlus,
  faEye,
  faEdit,
  faDownload,
  faMoneyBill,
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faFilePdf,
  faFileExcel,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Payroll } from '../../../types/payroll';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import { exportToCSV, exportToPDF } from '../../../utils/exportUtils';

const PayrollList: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = [2024, 2023, 2022, 2021, 2020];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockPayrolls: Payroll[] = [
        {
          payroll_id: 1,
          employee_id: 1,
          employee: { emp_id: 1, name: 'John Doe', department: 'Computer Science' },
          month: 3,
          year: 2024,
          basic_salary: 85000,
          allowances: [
            { allowance_id: 1, name: 'HRA', amount: 25000, is_taxable: true },
            { allowance_id: 2, name: 'DA', amount: 15000, is_taxable: true },
            { allowance_id: 3, name: 'Travel Allowance', amount: 5000, is_taxable: false },
          ],
          deductions: [
            { deduction_id: 1, name: 'PF', amount: 12000, is_mandatory: true },
            { deduction_id: 2, name: 'Professional Tax', amount: 2000, is_mandatory: true },
            { deduction_id: 3, name: 'TDS', amount: 8000, is_mandatory: true },
          ],
          gross_pay: 130000,
          net_pay: 108000,
          payment_date: '2024-03-31',
          payment_method: 'Bank Transfer',
          status: 'Paid',
        },
        {
          payroll_id: 2,
          employee_id: 2,
          employee: { emp_id: 2, name: 'Jane Smith', department: 'Mathematics' },
          month: 3,
          year: 2024,
          basic_salary: 75000,
          allowances: [
            { allowance_id: 1, name: 'HRA', amount: 22000, is_taxable: true },
            { allowance_id: 2, name: 'DA', amount: 13000, is_taxable: true },
            { allowance_id: 3, name: 'Travel Allowance', amount: 5000, is_taxable: false },
          ],
          deductions: [
            { deduction_id: 1, name: 'PF', amount: 10000, is_mandatory: true },
            { deduction_id: 2, name: 'Professional Tax', amount: 2000, is_mandatory: true },
            { deduction_id: 3, name: 'TDS', amount: 6000, is_mandatory: true },
          ],
          gross_pay: 115000,
          net_pay: 97000,
          status: 'Processed',
        },
        {
          payroll_id: 3,
          employee_id: 3,
          employee: { emp_id: 3, name: 'Rahul Kumar', department: 'Physics' },
          month: 3,
          year: 2024,
          basic_salary: 65000,
          allowances: [
            { allowance_id: 1, name: 'HRA', amount: 18000, is_taxable: true },
            { allowance_id: 2, name: 'DA', amount: 11000, is_taxable: true },
          ],
          deductions: [
            { deduction_id: 1, name: 'PF', amount: 9000, is_mandatory: true },
            { deduction_id: 2, name: 'Professional Tax', amount: 2000, is_mandatory: true },
          ],
          gross_pay: 94000,
          net_pay: 83000,
          status: 'Pending',
        },
        {
          payroll_id: 4,
          employee_id: 4,
          employee: { emp_id: 4, name: 'Priya Sharma', department: 'Chemistry' },
          month: 2,
          year: 2024,
          basic_salary: 70000,
          allowances: [
            { allowance_id: 1, name: 'HRA', amount: 20000, is_taxable: true },
            { allowance_id: 2, name: 'DA', amount: 12000, is_taxable: true },
          ],
          deductions: [
            { deduction_id: 1, name: 'PF', amount: 9500, is_mandatory: true },
            { deduction_id: 2, name: 'Professional Tax', amount: 2000, is_mandatory: true },
          ],
          gross_pay: 102000,
          net_pay: 90500,
          payment_date: '2024-02-29',
          payment_method: 'Bank Transfer',
          status: 'Paid',
        },
      ];
      setPayrolls(mockPayrolls);
      setFilteredPayrolls(mockPayrolls);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = payrolls;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.employee?.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered = filtered.filter(p => p.month === monthFilter && p.year === yearFilter);

    if (statusFilter !== 'All') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    setFilteredPayrolls(filtered);
  }, [searchTerm, monthFilter, yearFilter, statusFilter, payrolls]);

  const handleProcessPayroll = () => {
    // Simulate API call
    setTimeout(() => {
      showNotification('Payroll processed successfully', 'success');
      setShowProcessModal(false);
    }, 1500);
  };

  const handleExportCSV = () => {
    const exportData = filteredPayrolls.map(p => ({
      'Employee': p.employee?.name,
      'Department': p.employee?.department,
      'Basic Salary': p.basic_salary,
      'Gross Pay': p.gross_pay,
      'Net Pay': p.net_pay,
      'Status': p.status,
    }));
    exportToCSV(exportData, `payroll_${monthFilter}_${yearFilter}.csv`);
    showNotification('Data exported to CSV', 'success');
  };

  const handleExportPDF = () => {
    exportToPDF('payroll-report', `Payroll Report - ${monthFilter}/${yearFilter}`);
    showNotification('Report exported to PDF', 'success');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: { bg: '#f59e0b20', color: '#f59e0b', icon: faClock },
      Processed: { bg: '#3b82f620', color: '#3b82f6', icon: faCheckCircle },
      Paid: { bg: '#10b98120', color: '#10b981', icon: faMoneyBill },
      Cancelled: { bg: '#ef444420', color: '#ef4444', icon: faExclamationTriangle },
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
      render: (row: Payroll) => (
        <div>
          <div className="employee-name">{row.employee?.name}</div>
          <small>{row.employee?.department}</small>
        </div>
      ),
    },
    {
      key: 'basic',
      title: 'Basic Salary',
      render: (row: Payroll) => formatCurrency(row.basic_salary),
    },
    {
      key: 'gross',
      title: 'Gross Pay',
      render: (row: Payroll) => formatCurrency(row.gross_pay),
    },
    {
      key: 'net',
      title: 'Net Pay',
      render: (row: Payroll) => (
        <span className="net-pay">{formatCurrency(row.net_pay)}</span>
      ),
    },
    {
      key: 'payment',
      title: 'Payment',
      render: (row: Payroll) => (
        <div>
          {row.payment_date ? formatDate(row.payment_date) : '-'}
          {row.payment_method && <div><small>{row.payment_method}</small></div>}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: Payroll) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: Payroll) => (
        <div className="action-buttons">
          <button
            className="action-btn view"
            onClick={() => {
              setSelectedPayroll(row);
              setShowDetailsModal(true);
            }}
            title="View Details"
          >
            <FontAwesomeIcon icon={faEye} />
          </button>
          {row.status === 'Pending' && hasPermission('ProcessPayroll') && (
            <button
              className="action-btn edit"
              onClick={() => {
                setSelectedPayroll(row);
                setShowProcessModal(true);
              }}
              title="Process Payroll"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
          )}
          {row.status === 'Paid' && (
            <button
              className="action-btn download"
              onClick={() => window.open(`/api/payslips/${row.payroll_id}`, '_blank')}
              title="Download Payslip"
            >
              <FontAwesomeIcon icon={faDownload} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const totalNetPay = filteredPayrolls.reduce((sum, p) => sum + p.net_pay, 0);
  const totalGrossPay = filteredPayrolls.reduce((sum, p) => sum + p.gross_pay, 0);

  return (
    <div className="payroll-list-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Payroll Management</h1>
          <p>Manage employee salaries and payments</p>
        </div>
        <div className="header-actions">
          {hasPermission('ProcessPayroll') && (
            <Link to="/admin/payroll/generate">
              <Button variant="primary">
                <FontAwesomeIcon icon={faPlus} /> Generate Payroll
              </Button>
            </Link>
          )}
          <Button variant="secondary" onClick={handleExportCSV}>
            <FontAwesomeIcon icon={faFileExcel} /> CSV
          </Button>
          <Button variant="secondary" onClick={handleExportPDF}>
            <FontAwesomeIcon icon={faFilePdf} /> PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <Card className="summary-card">
          <h3>Total Employees</h3>
          <p className="value">{filteredPayrolls.length}</p>
        </Card>
        <Card className="summary-card">
          <h3>Gross Payroll</h3>
          <p className="value">{formatCurrency(totalGrossPay)}</p>
        </Card>
        <Card className="summary-card">
          <h3>Net Payroll</h3>
          <p className="value success">{formatCurrency(totalNetPay)}</p>
        </Card>
        <Card className="summary-card">
          <h3>Total Deductions</h3>
          <p className="value warning">{formatCurrency(totalGrossPay - totalNetPay)}</p>
        </Card>
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
            value={monthFilter}
            onChange={(e) => setMonthFilter(parseInt(e.target.value))}
            className="filter-select"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(parseInt(e.target.value))}
            className="filter-select"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Processed">Processed</option>
            <option value="Paid">Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setStatusFilter('All');
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

      {/* Details Modal */}
      {selectedPayroll && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPayroll(null);
          }}
          title="Payroll Details"
          size="large"
        >
          <div className="payroll-details">
            <div className="employee-summary">
              <h3>{selectedPayroll.employee?.name}</h3>
              <p>{selectedPayroll.employee?.department}</p>
              <p className="period">
                {months.find(m => m.value === selectedPayroll.month)?.label} {selectedPayroll.year}
              </p>
            </div>

            <div className="salary-breakdown">
              <div className="breakdown-section">
                <h4>Earnings</h4>
                <table className="breakdown-table">
                  <tbody>
                    <tr>
                      <td>Basic Salary</td>
                      <td className="amount">{formatCurrency(selectedPayroll.basic_salary)}</td>
                    </tr>
                    {selectedPayroll.allowances.map((allowance, index) => (
                      <tr key={index}>
                        <td>{allowance.name}</td>
                        <td className="amount">{formatCurrency(allowance.amount)}</td>
                      </tr>
                    ))}
                    <tr className="total">
                      <td>Gross Pay</td>
                      <td className="amount">{formatCurrency(selectedPayroll.gross_pay)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="breakdown-section">
                <h4>Deductions</h4>
                <table className="breakdown-table">
                  <tbody>
                    {selectedPayroll.deductions.map((deduction, index) => (
                      <tr key={index}>
                        <td>{deduction.name}</td>
                        <td className="amount">- {formatCurrency(deduction.amount)}</td>
                      </tr>
                    ))}
                    <tr className="total">
                      <td>Net Pay</td>
                      <td className="amount net">{formatCurrency(selectedPayroll.net_pay)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {selectedPayroll.payment_date && (
              <div className="payment-info">
                <p>
                  <strong>Payment Date:</strong> {formatDate(selectedPayroll.payment_date)}
                </p>
                <p>
                  <strong>Payment Method:</strong> {selectedPayroll.payment_method}
                </p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            {selectedPayroll.status === 'Paid' && (
              <Button variant="primary">
                <FontAwesomeIcon icon={faDownload} /> Download Payslip
              </Button>
            )}
          </div>
        </Modal>
      )}

      {/* Process Payroll Modal */}
      <Modal
        isOpen={showProcessModal}
        onClose={() => {
          setShowProcessModal(false);
          setSelectedPayroll(null);
        }}
        title="Process Payroll"
        size="small"
      >
        <div className="process-payroll">
          <p>Are you sure you want to process payroll for:</p>
          <p className="employee-name">{selectedPayroll?.employee?.name}</p>
          <p className="period">
            {months.find(m => m.value === selectedPayroll?.month)?.label} {selectedPayroll?.year}
          </p>
          <p className="amount">Net Pay: {selectedPayroll && formatCurrency(selectedPayroll.net_pay)}</p>

          <div className="form-group">
            <label>Payment Method</label>
            <select className="form-control">
              <option value="bank">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowProcessModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleProcessPayroll}>
              Process Payroll
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PayrollList;