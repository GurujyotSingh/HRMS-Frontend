import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faFilePdf,
  faFileExcel,
  faChartBar,
  faChartLine,
  faChartPie,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useNotification } from '../../../hooks/useNotification';
import { formatCurrency } from '../../../utils/formatters';

interface ReportOption {
  id: string;
  name: string;
  description: string;
  icon: any;
  formats: string[];
}

const FinancialReports: React.FC = () => {
  const { showNotification } = useNotification();
  const [selectedReport, setSelectedReport] = useState<string>('payroll-summary');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const reportOptions: ReportOption[] = [
    {
      id: 'payroll-summary',
      name: 'Payroll Summary',
      description: 'Monthly payroll summary by department',
      icon: faChartBar,
      formats: ['pdf', 'excel'],
    },
    {
      id: 'salary-register',
      name: 'Salary Register',
      description: 'Detailed employee-wise salary register',
      icon: faChartLine,
      formats: ['pdf', 'excel'],
    },
    {
      id: 'tax-deduction',
      name: 'Tax Deduction Report',
      description: 'TDS and tax deduction summary',
      icon: faChartPie,
      formats: ['pdf', 'excel'],
    },
    {
      id: 'department-wise',
      name: 'Department-wise Cost',
      description: 'Payroll cost breakdown by department',
      icon: faChartBar,
      formats: ['pdf', 'excel'],
    },
    {
      id: 'annual-summary',
      name: 'Annual Financial Summary',
      description: 'Yearly payroll and tax summary',
      icon: faChartLine,
      formats: ['pdf', 'excel'],
    },
    {
      id: 'bank-statement',
      name: 'Bank Statement Format',
      description: 'Bank transfer file for salary disbursement',
      icon: faFileExcel,
      formats: ['excel'],
    },
  ];

  const handleGenerateReport = () => {
    showNotification(`Generating ${reportOptions.find(r => r.id === selectedReport)?.name}...`, 'info');
    setTimeout(() => {
      showNotification('Report generated successfully', 'success');
    }, 2000);
  };

  const handleExport = (format: string) => {
    showNotification(`Exporting as ${format.toUpperCase()}...`, 'info');
    setTimeout(() => {
      showNotification('Export completed', 'success');
    }, 1500);
  };

  return (
    <div className="financial-reports-page">
      <div className="page-header">
        <h1>Financial Reports</h1>
        <p>Generate and export financial reports</p>
      </div>

      <div className="reports-grid">
        {/* Report Selection */}
        <div className="reports-sidebar">
          <Card className="reports-list-card">
            <h3>Report Types</h3>
            <div className="reports-list">
              {reportOptions.map(report => (
                <button
                  key={report.id}
                  className={`report-item ${selectedReport === report.id ? 'selected' : ''}`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <FontAwesomeIcon icon={report.icon} />
                  <div className="report-info">
                    <h4>{report.name}</h4>
                    <p>{report.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Report Configuration */}
        <div className="reports-main">
          <Card className="config-card">
            <h3>Report Configuration</h3>
            
            <div className="form-section">
              <h4>Date Range</h4>
              <div className="date-range">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Additional Options</h4>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Include employee details</span>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Show department summary</span>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Include tax calculations</span>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Show year-to-date totals</span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <Button variant="primary" onClick={handleGenerateReport}>
                <FontAwesomeIcon icon={faChartBar} /> Generate Report
              </Button>
            </div>
          </Card>

          {/* Preview Card */}
          <Card className="preview-card">
            <h3>Available Formats</h3>
            <div className="format-options">
              {reportOptions
                .find(r => r.id === selectedReport)
                ?.formats.map(format => (
                  <button
                    key={format}
                    className="format-btn"
                    onClick={() => handleExport(format)}
                  >
                    <FontAwesomeIcon icon={format === 'pdf' ? faFilePdf : faFileExcel} />
                    <span>{format.toUpperCase()}</span>
                  </button>
                ))}
            </div>

            <div className="preview-info">
              <p>This report will include:</p>
              <ul>
                <li>Payroll summary for selected period</li>
                <li>Department-wise breakdown</li>
                <li>Employee count and totals</li>
                <li>Tax and deduction summary</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;