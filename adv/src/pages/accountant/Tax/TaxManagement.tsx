import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faSearch,
  faFilter,
  faCalculator,
  faFileInvoice,
  faChartLine,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Chart from '../../../components/ui/Chart';
import { useNotification } from '../../../hooks/useNotification';
import { formatCurrency } from '../../../utils/formatters';
import { exportToCSV } from '../../../utils/exportUtils';

interface TaxRecord {
  employeeId: string;
  employeeName: string;
  department: string;
  panNumber: string;
  totalIncome: number;
  taxableIncome: number;
  taxAmount: number;
  rebate: number;
  netTax: number;
  tdsDeducted: number;
  balanceTax: number;
}

interface TaxSummary {
  financialYear: string;
  totalEmployees: number;
  totalTaxLiability: number;
  totalTDSDeducted: number;
  totalBalanceTax: number;
  averageTaxRate: number;
}

const TaxManagement: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<TaxRecord[]>([]);
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  const financialYears = ['2024-25', '2023-24', '2022-23', '2021-22', '2020-21'];
  const departments = ['All', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Administration'];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockRecords: TaxRecord[] = [
        {
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          department: 'Computer Science',
          panNumber: 'ABCDE1234F',
          totalIncome: 1300000,
          taxableIncome: 1150000,
          taxAmount: 135000,
          rebate: 0,
          netTax: 135000,
          tdsDeducted: 11250,
          balanceTax: 123750,
        },
        {
          employeeId: 'EMP002',
          employeeName: 'Jane Smith',
          department: 'Mathematics',
          panNumber: 'FGHIJ5678K',
          totalIncome: 1150000,
          taxableIncome: 1020000,
          taxAmount: 108000,
          rebate: 0,
          netTax: 108000,
          tdsDeducted: 9000,
          balanceTax: 99000,
        },
        {
          employeeId: 'EMP003',
          employeeName: 'Rahul Kumar',
          department: 'Physics',
          panNumber: 'KLMNO9012P',
          totalIncome: 940000,
          taxableIncome: 820000,
          taxAmount: 76000,
          rebate: 0,
          netTax: 76000,
          tdsDeducted: 6333,
          balanceTax: 69667,
        },
      ];

      setTaxRecords(mockRecords);
      setFilteredRecords(mockRecords);

      const totalTax = mockRecords.reduce((sum, r) => sum + r.netTax, 0);
      const totalTDS = mockRecords.reduce((sum, r) => sum + r.tdsDeducted, 0);
      
      setSummary({
        financialYear: '2024-25',
        totalEmployees: mockRecords.length,
        totalTaxLiability: totalTax,
        totalTDSDeducted: totalTDS,
        totalBalanceTax: totalTax - totalTDS,
        averageTaxRate: (totalTax / mockRecords.reduce((sum, r) => sum + r.totalIncome, 0)) * 100,
      });

      setChartData([
        { name: 'Tax Liability', value: totalTax },
        { name: 'TDS Deducted', value: totalTDS },
        { name: 'Balance Tax', value: totalTax - totalTDS },
      ]);

      setLoading(false);
    }, 1000);
  }, [financialYear]);

  useEffect(() => {
    let filtered = taxRecords;

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.panNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== 'All') {
      filtered = filtered.filter(r => r.department === departmentFilter);
    }

    setFilteredRecords(filtered);
  }, [searchTerm, departmentFilter, taxRecords]);

  const handleExport = () => {
    const exportData = filteredRecords.map(r => ({
      'Employee ID': r.employeeId,
      'Employee Name': r.employeeName,
      'Department': r.department,
      'PAN Number': r.panNumber,
      'Total Income': r.totalIncome,
      'Taxable Income': r.taxableIncome,
      'Tax Amount': r.taxAmount,
      'Rebate': r.rebate,
      'Net Tax': r.netTax,
      'TDS Deducted': r.tdsDeducted,
      'Balance Tax': r.balanceTax,
    }));
    exportToCSV(exportData, `tax_${financialYear}.csv`);
    showNotification('Tax data exported successfully', 'success');
  };

  const columns = [
    { key: 'employeeId', title: 'Employee ID' },
    { key: 'employeeName', title: 'Employee Name' },
    { key: 'department', title: 'Department' },
    { key: 'panNumber', title: 'PAN Number' },
    {
      key: 'totalIncome',
      title: 'Total Income',
      render: (row: TaxRecord) => formatCurrency(row.totalIncome),
    },
    {
      key: 'taxableIncome',
      title: 'Taxable Income',
      render: (row: TaxRecord) => formatCurrency(row.taxableIncome),
    },
    {
      key: 'taxAmount',
      title: 'Tax Amount',
      render: (row: TaxRecord) => formatCurrency(row.taxAmount),
    },
    {
      key: 'tdsDeducted',
      title: 'TDS Deducted',
      render: (row: TaxRecord) => formatCurrency(row.tdsDeducted),
    },
    {
      key: 'balanceTax',
      title: 'Balance Tax',
      render: (row: TaxRecord) => (
        <span className={row.balanceTax > 0 ? 'text-warning' : 'text-success'}>
          {formatCurrency(row.balanceTax)}
        </span>
      ),
    },
  ];

  return (
    <div className="tax-management-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Tax Management</h1>
          <p>View employee tax calculations and TDS</p>
        </div>
        <div className="header-actions">
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            className="filter-select"
          >
            {financialYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <Button variant="secondary" onClick={handleExport}>
            <FontAwesomeIcon icon={faDownload} /> Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <Card className="summary-card">
            <h3>Total Tax Liability</h3>
            <p className="value">{formatCurrency(summary.totalTaxLiability)}</p>
          </Card>
          <Card className="summary-card">
            <h3>TDS Deducted</h3>
            <p className="value success">{formatCurrency(summary.totalTDSDeducted)}</p>
          </Card>
          <Card className="summary-card">
            <h3>Balance Tax</h3>
            <p className="value warning">{formatCurrency(summary.totalBalanceTax)}</p>
          </Card>
          <Card className="summary-card">
            <h3>Avg Tax Rate</h3>
            <p className="value info">{summary.averageTaxRate.toFixed(1)}%</p>
          </Card>
        </div>
      )}

      {/* Chart */}
      <Card className="chart-card" title="Tax Summary">
        <Chart
          type="pie"
          data={chartData}
          dataKeys={['value']}
          colors={['#4361ee', '#10b981', '#f59e0b']}
          height={300}
        />
      </Card>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-grid">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search by employee or PAN..."
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

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setDepartmentFilter('All');
          }}>
            <FontAwesomeIcon icon={faTimes} /> Clear
          </Button>
        </div>
      </Card>

      {/* Tax Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          data={filteredRecords}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default TaxManagement;