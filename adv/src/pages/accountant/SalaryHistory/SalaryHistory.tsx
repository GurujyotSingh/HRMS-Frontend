import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faDownload,
  faEye,
  faHistory,
  faCalendarAlt,
  faChartLine,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Chart from '../../../components/ui/Chart';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { exportToCSV } from '../../../utils/exportUtils';

interface SalaryRecord {
  id: number;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  effectiveDate: string;
  basicSalary: number;
  hra: number;
  da: number;
  travelAllowance: number;
  specialAllowance: number;
  grossPay: number;
  pf: number;
  pt: number;
  tds: number;
  netPay: number;
  reason: string;
}

interface EmployeeSummary {
  employeeId: string;
  employeeName: string;
  department: string;
  currentSalary: number;
  totalRevisions: number;
  lastRevisionDate: string;
  averageSalary: number;
}

const SalaryHistory: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [employeeSummary, setEmployeeSummary] = useState<EmployeeSummary[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<SalaryRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<SalaryRecord[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  const departments = ['All', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Administration'];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockSummary: EmployeeSummary[] = [
        {
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          department: 'Computer Science',
          currentSalary: 108000,
          totalRevisions: 3,
          lastRevisionDate: '2024-01-15',
          averageSalary: 98000,
        },
        {
          employeeId: 'EMP002',
          employeeName: 'Jane Smith',
          department: 'Mathematics',
          currentSalary: 97000,
          totalRevisions: 2,
          lastRevisionDate: '2023-11-10',
          averageSalary: 92000,
        },
        {
          employeeId: 'EMP003',
          employeeName: 'Rahul Kumar',
          department: 'Physics',
          currentSalary: 83000,
          totalRevisions: 1,
          lastRevisionDate: '2023-08-20',
          averageSalary: 83000,
        },
      ];

      const mockHistory: SalaryRecord[] = [
        {
          id: 1,
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          department: 'Computer Science',
          designation: 'Professor',
          effectiveDate: '2024-01-15',
          basicSalary: 85000,
          hra: 25000,
          da: 15000,
          travelAllowance: 5000,
          specialAllowance: 0,
          grossPay: 130000,
          pf: 12000,
          pt: 2000,
          tds: 8000,
          netPay: 108000,
          reason: 'Annual increment',
        },
        {
          id: 2,
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          department: 'Computer Science',
          designation: 'Professor',
          effectiveDate: '2023-07-01',
          basicSalary: 80000,
          hra: 24000,
          da: 14000,
          travelAllowance: 5000,
          specialAllowance: 0,
          grossPay: 123000,
          pf: 11500,
          pt: 2000,
          tds: 7500,
          netPay: 102000,
          reason: 'Promotion',
        },
        {
          id: 3,
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          department: 'Computer Science',
          designation: 'Associate Professor',
          effectiveDate: '2023-01-10',
          basicSalary: 75000,
          hra: 22000,
          da: 13000,
          travelAllowance: 4000,
          specialAllowance: 0,
          grossPay: 114000,
          pf: 10500,
          pt: 2000,
          tds: 6000,
          netPay: 95500,
          reason: 'Annual increment',
        },
        {
          id: 4,
          employeeId: 'EMP002',
          employeeName: 'Jane Smith',
          department: 'Mathematics',
          designation: 'Associate Professor',
          effectiveDate: '2023-11-10',
          basicSalary: 75000,
          hra: 22000,
          da: 13000,
          travelAllowance: 5000,
          specialAllowance: 0,
          grossPay: 115000,
          pf: 10000,
          pt: 2000,
          tds: 6000,
          netPay: 97000,
          reason: 'Annual increment',
        },
      ];

      setEmployeeSummary(mockSummary);
      setSalaryHistory(mockHistory);
      setFilteredHistory(mockHistory.filter(h => h.employeeId === 'EMP001'));
      setSelectedEmployee('EMP001');

      // Generate trend data
      const emp1History = mockHistory.filter(h => h.employeeId === 'EMP001');
      setTrendData(emp1History.map(h => ({
        date: formatDate(h.effectiveDate),
        netPay: h.netPay,
        grossPay: h.grossPay,
      })).reverse());

      setLoading(false);
    }, 1000);
  }, []);

  const handleEmployeeSelect = (empId: string) => {
    setSelectedEmployee(empId);
    const history = salaryHistory.filter(h => h.employeeId === empId);
    setFilteredHistory(history);
    
    const trend = history.map(h => ({
      date: formatDate(h.effectiveDate),
      netPay: h.netPay,
      grossPay: h.grossPay,
    })).reverse();
    setTrendData(trend);
  };

  const handleExport = () => {
    const exportData = filteredHistory.map(h => ({
      'Employee': h.employeeName,
      'Department': h.department,
      'Designation': h.designation,
      'Effective Date': formatDate(h.effectiveDate),
      'Basic Salary': h.basicSalary,
      'HRA': h.hra,
      'DA': h.da,
      'Travel Allowance': h.travelAllowance,
      'Gross Pay': h.grossPay,
      'PF': h.pf,
      'TDS': h.tds,
      'Net Pay': h.netPay,
      'Reason': h.reason,
    }));
    exportToCSV(exportData, `salary_history_${selectedEmployee}.csv`);
    showNotification('Salary history exported', 'success');
  };

  const columns = [
    { key: 'effectiveDate', title: 'Effective Date', render: (row: SalaryRecord) => formatDate(row.effectiveDate) },
    { key: 'basicSalary', title: 'Basic', render: (row: SalaryRecord) => formatCurrency(row.basicSalary) },
    { key: 'hra', title: 'HRA', render: (row: SalaryRecord) => formatCurrency(row.hra) },
    { key: 'da', title: 'DA', render: (row: SalaryRecord) => formatCurrency(row.da) },
    { key: 'grossPay', title: 'Gross', render: (row: SalaryRecord) => formatCurrency(row.grossPay) },
    { key: 'pf', title: 'PF', render: (row: SalaryRecord) => formatCurrency(row.pf) },
    { key: 'tds', title: 'TDS', render: (row: SalaryRecord) => formatCurrency(row.tds) },
    { key: 'netPay', title: 'Net', render: (row: SalaryRecord) => (
      <span className="net-pay">{formatCurrency(row.netPay)}</span>
    )},
    { key: 'reason', title: 'Reason' },
  ];

  return (
    <div className="salary-history-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Salary History</h1>
          <p>View employee salary revision history</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={handleExport}>
            <FontAwesomeIcon icon={faDownload} /> Export
          </Button>
        </div>
      </div>

      {/* Employee Summary Cards */}
      <div className="employee-summary-grid">
        {employeeSummary.map(emp => (
          <Card
            key={emp.employeeId}
            className={`employee-card ${selectedEmployee === emp.employeeId ? 'selected' : ''}`}
            onClick={() => handleEmployeeSelect(emp.employeeId)}
          >
            <div className="card-header">
              <h3>{emp.employeeName}</h3>
              <span className="employee-id">{emp.employeeId}</span>
            </div>
            <div className="card-body">
              <p className="department">{emp.department}</p>
              <div className="salary-info">
                <div className="info-item">
                  <span className="label">Current</span>
                  <span className="value">{formatCurrency(emp.currentSalary)}</span>
                </div>
                <div className="info-item">
                  <span className="label">Revisions</span>
                  <span className="value">{emp.totalRevisions}</span>
                </div>
                <div className="info-item">
                  <span className="label">Last Revised</span>
                  <span className="value">{formatDate(emp.lastRevisionDate)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Salary Trend Chart */}
      {selectedEmployee && (
        <Card className="chart-card" title="Salary Trend">
          <Chart
            type="line"
            data={trendData}
            xAxisKey="date"
            dataKeys={['netPay', 'grossPay']}
            colors={['#10b981', '#4361ee']}
            height={300}
          />
        </Card>
      )}

      {/* Salary History Table */}
      <Card className="table-card" title="Revision History">
        <Table
          columns={columns}
          data={filteredHistory}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default SalaryHistory;