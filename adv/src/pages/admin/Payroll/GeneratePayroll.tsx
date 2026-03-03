import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faSave,
  faCalculator,
  faUsers,

  faCheckCircle,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import { formatCurrency } from '../../../utils/formatters';

interface EmployeePayrollData {
  emp_id: number;
  name: string;
  department: string;
  basic_salary: number;
  allowances: {
    hra: number;
    da: number;
    travel: number;
    other: number;
  };
  deductions: {
    pf: number;
    pt: number;
    tds: number;
    other: number;
  };
  gross_pay: number;
  net_pay: number;
  selected: boolean;
}

const GeneratePayroll: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [employees, setEmployees] = useState<EmployeePayrollData[]>([]);
  const [selectAll, setSelectAll] = useState(false);

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
    // Simulate API call to fetch employee data
    setTimeout(() => {
      const mockEmployees: EmployeePayrollData[] = [
        {
          emp_id: 1,
          name: 'John Doe',
          department: 'Computer Science',
          basic_salary: 85000,
          allowances: { hra: 25000, da: 15000, travel: 5000, other: 0 },
          deductions: { pf: 12000, pt: 2000, tds: 8000, other: 0 },
          gross_pay: 130000,
          net_pay: 108000,
          selected: true,
        },
        {
          emp_id: 2,
          name: 'Jane Smith',
          department: 'Mathematics',
          basic_salary: 75000,
          allowances: { hra: 22000, da: 13000, travel: 5000, other: 0 },
          deductions: { pf: 10000, pt: 2000, tds: 6000, other: 0 },
          gross_pay: 115000,
          net_pay: 97000,
          selected: true,
        },
        {
          emp_id: 3,
          name: 'Rahul Kumar',
          department: 'Physics',
          basic_salary: 65000,
          allowances: { hra: 18000, da: 11000, travel: 0, other: 0 },
          deductions: { pf: 9000, pt: 2000, tds: 0, other: 0 },
          gross_pay: 94000,
          net_pay: 83000,
          selected: true,
        },
        {
          emp_id: 4,
          name: 'Priya Sharma',
          department: 'Chemistry',
          basic_salary: 70000,
          allowances: { hra: 20000, da: 12000, travel: 0, other: 0 },
          deductions: { pf: 9500, pt: 2000, tds: 0, other: 0 },
          gross_pay: 102000,
          net_pay: 90500,
          selected: true,
        },
        {
          emp_id: 5,
          name: 'Amit Patel',
          department: 'Computer Science',
          basic_salary: 90000,
          allowances: { hra: 27000, da: 16000, travel: 5000, other: 2000 },
          deductions: { pf: 13000, pt: 2000, tds: 10000, other: 1000 },
          gross_pay: 140000,
          net_pay: 114000,
          selected: true,
        },
      ];
      setEmployees(mockEmployees);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setEmployees(employees.map(emp => ({ ...emp, selected: !selectAll })));
  };

  const handleSelectEmployee = (empId: number) => {
    setEmployees(employees.map(emp =>
      emp.emp_id === empId ? { ...emp, selected: !emp.selected } : emp
    ));
  };

  const calculateTotals = () => {
    const selected = employees.filter(e => e.selected);
    return {
      totalEmployees: selected.length,
      totalBasic: selected.reduce((sum, e) => sum + e.basic_salary, 0),
      totalAllowances: selected.reduce((sum, e) => 
        sum + Object.values(e.allowances).reduce((a, b) => a + b, 0), 0
      ),
      totalDeductions: selected.reduce((sum, e) => 
        sum + Object.values(e.deductions).reduce((a, b) => a + b, 0), 0
      ),
      totalGross: selected.reduce((sum, e) => sum + e.gross_pay, 0),
      totalNet: selected.reduce((sum, e) => sum + e.net_pay, 0),
    };
  };

  const handleGeneratePayroll = () => {
    const selected = employees.filter(e => e.selected);
    if (selected.length === 0) {
      showNotification('Please select at least one employee', 'warning');
      return;
    }

    setGenerating(true);
    // Simulate API call
    setTimeout(() => {
      showNotification(`Payroll generated for ${selected.length} employees`, 'success');
      setGenerating(false);
      navigate('/admin/payroll');
    }, 2000);
  };

  const totals = calculateTotals();

  const columns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectAll}
          onChange={handleSelectAll}
        />
      ),
      render: (row: EmployeePayrollData) => (
        <input
          type="checkbox"
          checked={row.selected}
          onChange={() => handleSelectEmployee(row.emp_id)}
        />
      ),
    },
    { key: 'name', title: 'Employee Name' },
    { key: 'department', title: 'Department' },
    { key: 'basic_salary', title: 'Basic', render: (row: EmployeePayrollData) => formatCurrency(row.basic_salary) },
    {
      key: 'allowances',
      title: 'Allowances',
      render: (row: EmployeePayrollData) => formatCurrency(
        Object.values(row.allowances).reduce((a, b) => a + b, 0)
      ),
    },
    {
      key: 'deductions',
      title: 'Deductions',
      render: (row: EmployeePayrollData) => formatCurrency(
        Object.values(row.deductions).reduce((a, b) => a + b, 0)
      ),
    },
    { key: 'gross_pay', title: 'Gross', render: (row: EmployeePayrollData) => formatCurrency(row.gross_pay) },
    { key: 'net_pay', title: 'Net', render: (row: EmployeePayrollData) => (
      <span className="net-pay">{formatCurrency(row.net_pay)}</span>
    )},
  ];

  if (!hasPermission('ProcessPayroll')) {
    return (
      <div className="unauthorized">
        <h2>Unauthorized Access</h2>
        <p>You don't have permission to access this page.</p>
        <Button variant="primary" onClick={() => navigate('/admin/payroll')}>
          Back to Payroll
        </Button>
      </div>
    );
  }

  return (
    <div className="generate-payroll-page">
      <div className="page-header">
        <div className="header-left">
          <Button variant="outline" onClick={() => navigate('/admin/payroll')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </Button>
          <h1>Generate Payroll</h1>
        </div>
      </div>

      {/* Period Selection */}
      <Card className="period-card">
        <div className="period-selector">
          <div className="form-group">
            <label>Month</label>
            <select
              className="form-control"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Year</label>
            <select
              className="form-control"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="summary-cards">
        <Card className="summary-card">
          <div className="card-icon blue">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="card-content">
            <h3>Selected Employees</h3>
            <p className="value">{totals.totalEmployees}</p>
          </div>
        </Card>
        <Card className="summary-card">
          <div className="card-icon green">
            <FontAwesomeIcon icon={faCalculator} />
          </div>
          <div className="card-content">
            <h3>Total Gross Pay</h3>
            <p className="value">{formatCurrency(totals.totalGross)}</p>
          </div>
        </Card>
        <Card className="summary-card">
          <div className="card-icon orange">
            <FontAwesomeIcon icon={faExclamationTriangle} />
          </div>
          <div className="card-content">
            <h3>Total Deductions</h3>
            <p className="value warning">{formatCurrency(totals.totalDeductions)}</p>
          </div>
        </Card>
        <Card className="summary-card">
          <div className="card-icon purple">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="card-content">
            <h3>Total Net Pay</h3>
            <p className="value success">{formatCurrency(totals.totalNet)}</p>
          </div>
        </Card>
      </div>

      {/* Employee List */}
      <Card className="table-card" title="Select Employees for Payroll">
        <Table
          columns={columns}
          data={employees}
          loading={loading}
        />
      </Card>

      {/* Action Buttons */}
      <div className="form-actions">
        <Button variant="secondary" onClick={() => navigate('/admin/payroll')}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="large"
          loading={generating}
          onClick={handleGeneratePayroll}
        >
          <FontAwesomeIcon icon={faSave} /> Generate Payroll
        </Button>
      </div>
    </div>
  );
};

export default GeneratePayroll;