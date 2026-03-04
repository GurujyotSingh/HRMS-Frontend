import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faEdit,
  faSave,
  
  faPrint,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Chart from '../../../components/ui/Chart';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Employee } from '../../../types/employee';
import type { Payroll } from '../../../types/payroll';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const SalaryDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payrollHistory, setPayrollHistory] = useState<Payroll[]>([]);
  const [editing, setEditing] = useState(false);
  const [salaryData, setSalaryData] = useState({
    basic_salary: 0,
    hra: 0,
    da: 0,
    travel_allowance: 0,
    special_allowance: 0,
    pf: 0,
    pt: 0,
    tds: 0,
    other_deductions: 0,
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockEmployee: Employee = {
        emp_id: Number(id),
        name: 'John Doe',
        email: 'john.doe@university.edu',
        department_id: 1,
        department: { dept_id: 1, name: 'Computer Science', code: 'CS', budget: 5000000 },
        academic_rank: 'Professor',
        hire_date: '2018-08-15',
        status: 'Active',
        phone: '+91 98765 43210',
      };

      const mockPayrollHistory: Payroll[] = [
        {
          payroll_id: 1,
          employee_id: Number(id),
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
          employee_id: Number(id),
          month: 2,
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
          payment_date: '2024-02-28',
          payment_method: 'Bank Transfer',
          status: 'Paid',
        },
        {
          payroll_id: 3,
          employee_id: Number(id),
          month: 1,
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
          payment_date: '2024-01-31',
          payment_method: 'Bank Transfer',
          status: 'Paid',
        },
      ];

      setEmployee(mockEmployee);
      setPayrollHistory(mockPayrollHistory);
      setSalaryData({
        basic_salary: 85000,
        hra: 25000,
        da: 15000,
        travel_allowance: 5000,
        special_allowance: 0,
        pf: 12000,
        pt: 2000,
        tds: 8000,
        other_deductions: 0,
      });
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleSave = () => {
    // Calculate totals
    const totalAllowances = salaryData.hra + salaryData.da + salaryData.travel_allowance + salaryData.special_allowance;
    const totalDeductions = salaryData.pf + salaryData.pt + salaryData.tds + salaryData.other_deductions;
    const grossPay = salaryData.basic_salary + totalAllowances;
    const netPay = grossPay - totalDeductions;

    // Simulate API call
    setTimeout(() => {
      showNotification('Salary details updated successfully', 'success');
      setEditing(false);
    }, 1000);
  };

  const chartData = payrollHistory.map(p => ({
    month: `${months[p.month - 1].label} ${p.year}`,
    netPay: p.net_pay,
    grossPay: p.gross_pay,
  })).reverse();

  const months = [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' },
    { value: 5, label: 'May' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Aug' },
    { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dec' },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading salary details...</p>
      </div>
    );
  }

  const totalAllowances = salaryData.hra + salaryData.da + salaryData.travel_allowance + salaryData.special_allowance;
  const totalDeductions = salaryData.pf + salaryData.pt + salaryData.tds + salaryData.other_deductions;
  const grossPay = salaryData.basic_salary + totalAllowances;
  const netPay = grossPay - totalDeductions;

  return (
    <div className="salary-details-page">
      <div className="page-header">
        <div className="header-left">
          <Button variant="outline" onClick={() => navigate('/admin/payroll')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </Button>
          <h1>Salary Details</h1>
        </div>
        <div className="header-actions">
          {!editing && hasPermission('EditSalary') && (
            <Button variant="primary" onClick={() => setEditing(true)}>
              <FontAwesomeIcon icon={faEdit} /> Edit Salary
            </Button>
          )}
          <Button variant="secondary" onClick={() => window.print()}>
            <FontAwesomeIcon icon={faPrint} /> Print
          </Button>
        </div>
      </div>

      {/* Employee Info */}
      <Card className="employee-info-card">
        <div className="employee-info">
          <h2>{employee?.name}</h2>
          <p>{employee?.academic_rank} • {employee?.department?.name}</p>
          <p>Employee ID: {employee?.emp_id} | Joined: {formatDate(employee?.hire_date || '')}</p>
        </div>
      </Card>

      {/* Salary Breakdown */}
      <div className="salary-grid">
        <Card className="salary-card">
          <h3>Earnings</h3>
          <div className="salary-items">
            <div className="salary-item">
              <span>Basic Salary</span>
              {editing ? (
                <input
                  type="number"
                  className="form-control"
                  value={salaryData.basic_salary}
                  onChange={(e) => setSalaryData({ ...salaryData, basic_salary: parseInt(e.target.value) })}
                />
              ) : (
                <span className="amount">{formatCurrency(salaryData.basic_salary)}</span>
              )}
            </div>
            <div className="salary-item">
              <span>HRA</span>
              {editing ? (
                <input
                  type="number"
                  className="form-control"
                  value={salaryData.hra}
                  onChange={(e) => setSalaryData({ ...salaryData, hra: parseInt(e.target.value) })}
                />
              ) : (
                <span className="amount">{formatCurrency(salaryData.hra)}</span>
              )}
            </div>
            <div className="salary-item">
              <span>DA</span>
              {editing ? (
                <input
                  type="number"
                  className="form-control"
                  value={salaryData.da}
                  onChange={(e) => setSalaryData({ ...salaryData, da: parseInt(e.target.value) })}
                />
              ) : (
                <span className="amount">{formatCurrency(salaryData.da)}</span>
              )}
            </div>
            <div className="salary-item">
              <span>Travel Allowance</span>
              {editing ? (
                <input
                  type="number"
                  className="form-control"
                  value={salaryData.travel_allowance}
                  onChange={(e) => setSalaryData({ ...salaryData, travel_allowance: parseInt(e.target.value) })}
                />
              ) : (
                <span className="amount">{formatCurrency(salaryData.travel_allowance)}</span>
              )}
            </div>
            <div className="salary-item">
              <span>Special Allowance</span>
              {editing ? (
                <input
                  type="number"
                  className="form-control"
                  value={salaryData.special_allowance}
                  onChange={(e) => setSalaryData({ ...salaryData, special_allowance: parseInt(e.target.value) })}
                />
              ) : (
                <span className="amount">{formatCurrency(salaryData.special_allowance)}</span>
              )}
            </div>
            <div className="salary-item total">
              <span>Total Earnings</span>
              <span className="amount">{formatCurrency(salaryData.basic_salary + totalAllowances)}</span>
            </div>
          </div>
        </Card>

        <Card className="salary-card">
          <h3>Deductions</h3>
          <div className="salary-items">
            <div className="salary-item">
              <span>PF</span>
              {editing ? (
                <input
                  type="number"
                  className="form-control"
                  value={salaryData.pf}
                  onChange={(e) => setSalaryData({ ...salaryData, pf: parseInt(e.target.value) })}
                />
              ) : (
                <span className="amount">{formatCurrency(salaryData.pf)}</span>
              )}
            </div>
            <div className="salary-item">
              <span>Professional Tax</span>
              {editing ? (
                <input
                  type="number"
                  className="form-control"
                  value={salaryData.pt}
                  onChange={(e) => setSalaryData({ ...salaryData, pt: parseInt(e.target.value) })}
                />
              ) : (
                <span className="amount">{formatCurrency(salaryData.pt)}</span>
              )}
            </div>
            <div className="salary-item">
              <span>TDS</span>
              {editing ? (
                <input
                  type="number"
                  className="form-control"
                  value={salaryData.tds}
                  onChange={(e) => setSalaryData({ ...salaryData, tds: parseInt(e.target.value) })}
                />
              ) : (
                <span className="amount">{formatCurrency(salaryData.tds)}</span>
              )}
            </div>
            <div className="salary-item">
              <span>Other Deductions</span>
              {editing ? (
                <input
                  type="number"
                  className="form-control"
                  value={salaryData.other_deductions}
                  onChange={(e) => setSalaryData({ ...salaryData, other_deductions: parseInt(e.target.value) })}
                />
              ) : (
                <span className="amount">{formatCurrency(salaryData.other_deductions)}</span>
              )}
            </div>
            <div className="salary-item total">
              <span>Total Deductions</span>
              <span className="amount">{formatCurrency(totalDeductions)}</span>
            </div>
          </div>
        </Card>

        <Card className="net-pay-card">
          <h3>Net Pay</h3>
          <div className="net-pay-amount">{formatCurrency(netPay)}</div>
          <div className="net-pay-breakdown">
            <div>Gross Pay: {formatCurrency(grossPay)}</div>
            <div>Total Deductions: {formatCurrency(totalDeductions)}</div>
          </div>
        </Card>
      </div>

      {/* Salary Trend Chart */}
      <Card className="chart-card" title="Salary Trend">
        <Chart
          type="line"
          data={chartData}
          xAxisKey="month"
          dataKeys={['netPay', 'grossPay']}
          colors={['#10b981', '#4361ee']}
          height={300}
        />
      </Card>

      {/* Payroll History */}
      <Card className="history-card" title="Payroll History">
        <table className="history-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Basic</th>
              <th>Allowances</th>
              <th>Deductions</th>
              <th>Gross Pay</th>
              <th>Net Pay</th>
              <th>Status</th>
              <th>Payment Date</th>
            </tr>
          </thead>
          <tbody>
            {payrollHistory.map((payroll, index) => (
              <tr key={index}>
                <td>{months[payroll.month - 1].label} {payroll.year}</td>
                <td>{formatCurrency(payroll.basic_salary)}</td>
                <td>{formatCurrency(payroll.allowances.reduce((sum, a) => sum + a.amount, 0))}</td>
                <td>{formatCurrency(payroll.deductions.reduce((sum, d) => sum + d.amount, 0))}</td>
                <td>{formatCurrency(payroll.gross_pay)}</td>
                <td className="net">{formatCurrency(payroll.net_pay)}</td>
                <td>
                  <span className={`status-badge status-${payroll.status.toLowerCase()}`}>
                    {payroll.status}
                  </span>
                </td>
                <td>{payroll.payment_date ? formatDate(payroll.payment_date) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Edit Actions */}
      {editing && (
        <div className="edit-actions">
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <FontAwesomeIcon icon={faSave} /> Save Changes
          </Button>
        </div>
      )}
    </div>
  );
};

export default SalaryDetails;