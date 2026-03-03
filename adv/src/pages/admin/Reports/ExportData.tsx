import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faFilePdf,
  faFileExcel,
  faFileCsv,
  faFileArchive,

  faCheck,

} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useNotification } from '../../../hooks/useNotification';
import { formatDate } from '../../../utils/formatters';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: any;
  formats: string[];
  dataSize: string;
}

const ExportData: React.FC = () => {
  const { showNotification } = useNotification();
  const [exporting, setExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('csv');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedExports, setSelectedExports] = useState<string[]>([]);

  const exportOptions: ExportOption[] = [
    {
      id: 'employees',
      name: 'Employee Data',
      description: 'Complete employee profiles including personal info, department, and status',
      icon: faFileExcel,
      formats: ['csv', 'excel', 'pdf'],
      dataSize: '~2.5 MB',
    },
    {
      id: 'payroll',
      name: 'Payroll Records',
      description: 'Salary details, allowances, deductions, and payment history',
      icon: faFileCsv,
      formats: ['csv', 'excel', 'pdf'],
      dataSize: '~1.8 MB',
    },
    {
      id: 'attendance',
      name: 'Attendance Logs',
      description: 'Daily attendance records, clock in/out times, and overtime',
      icon: faFileExcel,
      formats: ['csv', 'excel'],
      dataSize: '~3.2 MB',
    },
    {
      id: 'leave',
      name: 'Leave Applications',
      description: 'Leave requests, approvals, and balance history',
      icon: faFileCsv,
      formats: ['csv', 'excel', 'pdf'],
      dataSize: '~1.2 MB',
    },
    {
      id: 'performance',
      name: 'Performance Reviews',
      description: 'Review scores, feedback, and goals',
      icon: faFilePdf,
      formats: ['csv', 'excel', 'pdf'],
      dataSize: '~2.1 MB',
    },
    {
      id: 'onboarding',
      name: 'Onboarding Tasks',
      description: 'New hire checklists and task completion status',
      icon: faFileExcel,
      formats: ['csv', 'excel'],
      dataSize: '~0.8 MB',
    },
    {
      id: 'resources',
      name: 'Resource Bookings',
      description: 'Room and equipment booking history',
      icon: faFileCsv,
      formats: ['csv', 'excel'],
      dataSize: '~1.5 MB',
    },
    {
      id: 'all',
      name: 'Complete Export (All Data)',
      description: 'All HRMS data in a single archive',
      icon: faFileArchive,
      formats: ['archive'],
      dataSize: '~12.5 MB',
    },
  ];

  const handleExport = () => {
    if (selectedExports.length === 0) {
      showNotification('Please select at least one data type to export', 'warning');
      return;
    }

    setExporting(true);

    // Simulate export process
    setTimeout(() => {
      setExporting(false);
      showNotification(
        `Export completed! ${selectedExports.length} file(s) ready for download`,
        'success'
      );
    }, 3000);
  };

  const handleSelectAll = () => {
    if (selectedExports.length === exportOptions.length) {
      setSelectedExports([]);
    } else {
      setSelectedExports(exportOptions.map(opt => opt.id));
    }
  };

  const handleToggleExport = (id: string) => {
    if (selectedExports.includes(id)) {
      setSelectedExports(selectedExports.filter(e => e !== id));
    } else {
      setSelectedExports([...selectedExports, id]);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return faFileCsv;
      case 'excel': return faFileExcel;
      case 'pdf': return faFilePdf;
      case 'archive': return faFileArchive;
      default: return faFileCsv;
    }
  };

  return (
    <div className="export-data-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Export Data</h1>
          <p>Export HRMS data in various formats</p>
        </div>
      </div>

      {/* Export Settings */}
      <div className="export-settings-grid">
        <Card className="settings-card" title="Date Range">
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
        </Card>

        <Card className="settings-card" title="Format">
          <div className="format-options">
            {['csv', 'excel', 'pdf', 'archive'].map(format => (
              <label key={format} className={`format-option ${selectedFormat === format ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="format"
                  value={format}
                  checked={selectedFormat === format}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                />
                <FontAwesomeIcon icon={getFormatIcon(format)} />
                <span>{format.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="settings-card" title="Additional Options">
          <div className="export-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Include headers</span>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Compress files (ZIP)</span>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Send email when complete</span>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Include historical data</span>
            </label>
          </div>
        </Card>
      </div>

      {/* Export Selection */}
      <Card className="selection-card">
        <div className="selection-header">
          <h2>Select Data to Export</h2>
          <Button variant="secondary" size="small" onClick={handleSelectAll}>
            {selectedExports.length === exportOptions.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        <div className="export-grid">
          {exportOptions.map(option => (
            <div
              key={option.id}
              className={`export-item ${selectedExports.includes(option.id) ? 'selected' : ''}`}
              onClick={() => handleToggleExport(option.id)}
            >
              <div className="export-check">
                {selectedExports.includes(option.id) && (
                  <FontAwesomeIcon icon={faCheck} className="check-icon" />
                )}
              </div>
              <div className="export-icon">
                <FontAwesomeIcon icon={option.icon} />
              </div>
              <div className="export-info">
                <h3>{option.name}</h3>
                <p>{option.description}</p>
                <div className="export-meta">
                  <span className="data-size">{option.dataSize}</span>
                  <div className="format-icons">
                    {option.formats.map(format => (
                      <FontAwesomeIcon
                        key={format}
                        icon={getFormatIcon(format)}
                        className={`format-icon ${selectedFormat === format ? 'active' : ''}`}
                        title={format.toUpperCase()}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Export Summary */}
      <Card className="summary-card">
        <div className="export-summary">
          <div className="summary-stats">
            <div className="stat">
              <span className="label">Selected Items:</span>
              <span className="value">{selectedExports.length}</span>
            </div>
            <div className="stat">
              <span className="label">Total Size:</span>
              <span className="value">
                {selectedExports.includes('all') 
                  ? '~12.5 MB' 
                  : `~${(selectedExports.length * 2).toFixed(1)} MB`}
              </span>
            </div>
            <div className="stat">
              <span className="label">Format:</span>
              <span className="value">{selectedFormat.toUpperCase()}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="large"
            onClick={handleExport}
            loading={exporting}
            disabled={selectedExports.length === 0}
          >
            <FontAwesomeIcon icon={faDownload} />
            {exporting ? 'Exporting...' : 'Start Export'}
          </Button>
        </div>
      </Card>

      {/* Recent Exports */}
      <Card className="recent-exports-card" title="Recent Exports">
        <table className="recent-exports-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Date</th>
              <th>Size</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>employees_2024_03_15.csv</td>
              <td>{formatDate('2024-03-15')}</td>
              <td>2.3 MB</td>
              <td><span className="status-badge completed">Completed</span></td>
              <td>
                <Button variant="secondary" size="small">
                  <FontAwesomeIcon icon={faDownload} /> Download
                </Button>
              </td>
            </tr>
            <tr>
              <td>payroll_march_2024.xlsx</td>
              <td>{formatDate('2024-03-14')}</td>
              <td>1.8 MB</td>
              <td><span className="status-badge completed">Completed</span></td>
              <td>
                <Button variant="secondary" size="small">
                  <FontAwesomeIcon icon={faDownload} /> Download
                </Button>
              </td>
            </tr>
            <tr>
              <td>attendance_q1_2024.pdf</td>
              <td>{formatDate('2024-03-10')}</td>
              <td>3.1 MB</td>
              <td><span className="status-badge completed">Completed</span></td>
              <td>
                <Button variant="secondary" size="small">
                  <FontAwesomeIcon icon={faDownload} /> Download
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default ExportData;