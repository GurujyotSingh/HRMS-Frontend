import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave,
  faPlay,
  faDownload,
  faPlus,
  faTrash,
  faChartBar,
  faTable,
  faFilePdf,
  faFileExcel,

  faEye,

} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Table from '../../../components/ui/Table';
import Chart from '../../../components/ui/Chart';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import { exportToCSV, exportToPDF } from '../../../utils/exportUtils';

interface ReportField {
  id: string;
  name: string;
  category: string;
  selected: boolean;
}

interface ReportFilter {
  field: string;
  operator: string;
  value: string;
}

const CustomReports: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [reportName, setReportName] = useState('Untitled Report');
  const [reportType, setReportType] = useState<'tabular' | 'chart'>('tabular');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [fields, setFields] = useState<ReportField[]>([
    { id: 'name', name: 'Employee Name', category: 'Employee', selected: true },
    { id: 'department', name: 'Department', category: 'Employee', selected: true },
    { id: 'designation', name: 'Designation', category: 'Employee', selected: false },
    { id: 'joinDate', name: 'Join Date', category: 'Employee', selected: false },
    { id: 'salary', name: 'Salary', category: 'Payroll', selected: false },
    { id: 'leaveBalance', name: 'Leave Balance', category: 'Leave', selected: false },
    { id: 'attendance', name: 'Attendance %', category: 'Attendance', selected: false },
    { id: 'performance', name: 'Performance Rating', category: 'Performance', selected: false },
  ]);

  const [filters, setFilters] = useState<ReportFilter[]>([
    { field: 'department', operator: 'equals', value: '' },
  ]);

  const [previewData, setPreviewData] = useState<any[]>([]);

  const categories = ['Employee', 'Payroll', 'Leave', 'Attendance', 'Performance'];

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greaterThan', label: 'Greater Than' },
    { value: 'lessThan', label: 'Less Than' },
    { value: 'between', label: 'Between' },
    { value: 'in', label: 'In' },
  ];

  const handleGeneratePreview = () => {
    setGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockData = [
        { name: 'John Doe', department: 'CS', salary: 85000, attendance: 95, performance: 4.5 },
        { name: 'Jane Smith', department: 'Math', salary: 75000, attendance: 92, performance: 4.2 },
        { name: 'Rahul Kumar', department: 'Physics', salary: 65000, attendance: 88, performance: 3.8 },
        { name: 'Priya Sharma', department: 'Chemistry', salary: 70000, attendance: 90, performance: 4.0 },
      ];
      setPreviewData(mockData);
      setGenerating(false);
      setShowPreview(true);
      showNotification('Report generated successfully', 'success');
    }, 1500);
  };

  const handleSaveReport = () => {
    const newReport = {
      id: Date.now(),
      name: reportName,
      type: reportType,
      fields: fields.filter(f => f.selected),
      filters: filters,
      createdAt: new Date().toISOString(),
    };
    
    setSavedReports([...savedReports, newReport]);
    setShowSaveModal(false);
    showNotification('Report saved successfully', 'success');
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      exportToCSV(previewData, `${reportName}.csv`);
    } else {
      exportToPDF('report-preview', reportName);
    }
    showNotification(`Report exported as ${format.toUpperCase()}`, 'success');
  };

  const handleAddFilter = () => {
    setFilters([...filters, { field: 'department', operator: 'equals', value: '' }]);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleFieldToggle = (fieldId: string) => {
    setFields(fields.map(f =>
      f.id === fieldId ? { ...f, selected: !f.selected } : f
    ));
  };

  const columns = fields
    .filter(f => f.selected)
    .map(f => ({ key: f.id, title: f.name }));

  return (
    <div className="custom-reports-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Custom Reports</h1>
          <p>Create and customize your own reports</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={handleGeneratePreview} loading={generating}>
            <FontAwesomeIcon icon={faPlay} /> Generate Preview
          </Button>
          <Button variant="secondary" onClick={() => setShowSaveModal(true)}>
            <FontAwesomeIcon icon={faSave} /> Save Report
          </Button>
        </div>
      </div>

      <div className="report-builder">
        {/* Left Panel - Report Configuration */}
        <div className="config-panel">
          <Card className="config-card">
            <h3>Report Settings</h3>
            
            <div className="form-group">
              <label>Report Name</label>
              <input
                type="text"
                className="form-control"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
              />
            </div>

            <div className="form-group">
              <label>Report Type</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="reportType"
                    value="tabular"
                    checked={reportType === 'tabular'}
                    onChange={(e) => setReportType('tabular')}
                  />
                  <FontAwesomeIcon icon={faTable} /> Tabular
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="reportType"
                    value="chart"
                    checked={reportType === 'chart'}
                    onChange={(e) => setReportType('chart')}
                  />
                  <FontAwesomeIcon icon={faChartBar} /> Chart
                </label>
              </div>
            </div>

            {reportType === 'chart' && (
              <div className="form-group">
                <label>Chart Type</label>
                <select
                  className="form-control"
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as any)}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>
            )}
          </Card>

          <Card className="config-card">
            <h3>Select Fields</h3>
            {categories.map(category => (
              <div key={category} className="field-category">
                <h4>{category}</h4>
                {fields
                  .filter(f => f.category === category)
                  .map(field => (
                    <label key={field.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={field.selected}
                        onChange={() => handleFieldToggle(field.id)}
                      />
                      <span>{field.name}</span>
                    </label>
                  ))}
              </div>
            ))}
          </Card>

          <Card className="config-card">
            <div className="card-header">
              <h3>Filters</h3>
              <Button variant="secondary" size="small" onClick={handleAddFilter}>
                <FontAwesomeIcon icon={faPlus} /> Add Filter
              </Button>
            </div>

            {filters.map((filter, index) => (
              <div key={index} className="filter-row">
                <select
                  className="form-control"
                  value={filter.field}
                  onChange={(e) => {
                    const newFilters = [...filters];
                    newFilters[index].field = e.target.value;
                    setFilters(newFilters);
                  }}
                >
                  <option value="department">Department</option>
                  <option value="designation">Designation</option>
                  <option value="status">Status</option>
                  <option value="salary">Salary</option>
                </select>

                <select
                  className="form-control"
                  value={filter.operator}
                  onChange={(e) => {
                    const newFilters = [...filters];
                    newFilters[index].operator = e.target.value;
                    setFilters(newFilters);
                  }}
                >
                  {operators.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>

                <input
                  type="text"
                  className="form-control"
                  value={filter.value}
                  onChange={(e) => {
                    const newFilters = [...filters];
                    newFilters[index].value = e.target.value;
                    setFilters(newFilters);
                  }}
                  placeholder="Value"
                />

                <button
                  className="remove-filter"
                  onClick={() => handleRemoveFilter(index)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </Card>
        </div>

        {/* Right Panel - Preview */}
        <div className="preview-panel">
          <Card className="preview-card">
            <div className="card-header">
              <h3>Preview</h3>
              {showPreview && (
                <div className="preview-actions">
                  <Button variant="secondary" size="small" onClick={() => handleExport('csv')}>
                    <FontAwesomeIcon icon={faFileExcel} /> CSV
                  </Button>
                  <Button variant="secondary" size="small" onClick={() => handleExport('pdf')}>
                    <FontAwesomeIcon icon={faFilePdf} /> PDF
                  </Button>
                </div>
              )}
            </div>

            {showPreview ? (
              <div id="report-preview">
                {reportType === 'tabular' ? (
                  <Table
                    columns={columns}
                    data={previewData}
                  />
                ) : (
                  <Chart
                    type={chartType}
                    data={previewData}
                    xAxisKey="name"
                    dataKeys={['salary']}
                    height={400}
                  />
                )}
              </div>
            ) : (
              <div className="preview-placeholder">
                <FontAwesomeIcon icon={faEye} className="placeholder-icon" />
                <p>Configure your report and click "Generate Preview" to see results</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Save Report Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save Report"
        size="small"
      >
        <div className="save-report-form">
          <div className="form-group">
            <label>Report Name</label>
            <input
              type="text"
              className="form-control"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Enter report description"
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select className="form-control">
              <option value="general">General</option>
              <option value="hr">HR</option>
              <option value="payroll">Payroll</option>
              <option value="attendance">Attendance</option>
            </select>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveReport}>
              <FontAwesomeIcon icon={faSave} /> Save Report
            </Button>
          </div>
        </div>
      </Modal>

      {/* Saved Reports List */}
      {savedReports.length > 0 && (
        <Card className="saved-reports-card" title="Saved Reports">
          <div className="saved-reports-list">
            {savedReports.map(report => (
              <div key={report.id} className="saved-report-item">
                <div>
                  <h4>{report.name}</h4>
                  <p>Created: {new Date(report.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="report-actions">
                  <Button variant="secondary" size="small">
                    <FontAwesomeIcon icon={faEye} /> Load
                  </Button>
                  <Button variant="secondary" size="small">
                    <FontAwesomeIcon icon={faDownload} /> Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CustomReports;