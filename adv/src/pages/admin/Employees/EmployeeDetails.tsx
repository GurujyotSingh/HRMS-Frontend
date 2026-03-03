import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faTrash,
  faArrowLeft,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faBriefcase,
  faCalendarAlt,
  faGraduationCap,
  faUserTie,
  faDownload,
  faPrint,
  faHistory,
  faFileAlt,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Tabs from '../../../components/ui/Tabs';
import Table from '../../../components/ui/Table';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import { Employee } from '../../../types/employee';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setEmployee({
        emp_id: Number(id),
        name: 'Dr. John Doe',
        email: 'john.doe@university.edu',
        department_id: 1,
        department: { dept_id: 1, name: 'Computer Science', code: 'CS', budget: 5000000 },
        manager_id: 5,
        manager: { emp_id: 5, name: 'Dr. Jane Smith' },
        academic_rank: 'Professor',
        hire_date: '2018-08-15',
        status: 'Active',
        phone: '+91 98765 43210',
        address: '123 Faculty Housing, University Campus',
        emergency_contact: 'Jane Doe: +91 98765 43211',
        skills: ['Machine Learning', 'Data Science', 'Python', 'AI'],
        competencies: ['Research', 'Teaching', 'Mentoring', 'Leadership'],
      });
      setLoading(false);
    }, 1000);
  }, [id]);

  const tabs = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'employment', label: 'Employment' },
    { id: 'leave', label: 'Leave History' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'documents', label: 'Documents' },
  ];

  const leaveHistoryColumns = [
    { key: 'type', title: 'Leave Type' },
    { key: 'startDate', title: 'Start Date' },
    { key: 'endDate', title: 'End Date' },
    { key: 'days', title: 'Days' },
    { key: 'status', title: 'Status' },
  ];

  const leaveHistoryData = [
    { type: 'Annual Leave', startDate: '2024-03-15', endDate: '2024-03-20', days: 6, status: 'Approved' },
    { type: 'Sick Leave', startDate: '2024-02-10', endDate: '2024-02-12', days: 3, status: 'Approved' },
    { type: 'Personal Leave', startDate: '2024-01-05', endDate: '2024-01-06', days: 2, status: 'Approved' },
  ];

  const attendanceColumns = [
    { key: 'date', title: 'Date' },
    { key: 'clockIn', title: 'Clock In' },
    { key: 'clockOut', title: 'Clock Out' },
    { key: 'hours', title: 'Hours' },
    { key: 'status', title: 'Status' },
  ];

  const payrollColumns = [
    { key: 'month', title: 'Month' },
    { key: 'basic', title: 'Basic' },
    { key: 'allowances', title: 'Allowances' },
    { key: 'deductions', title: 'Deductions' },
    { key: 'netPay', title: 'Net Pay' },
    { key: 'status', title: 'Status' },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading employee details...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="not-found">
        <h2>Employee Not Found</h2>
        <p>The employee you're looking for doesn't exist.</p>
        <Button variant="primary" onClick={() => navigate('/admin/employees')}>
          Back to Employees
        </Button>
      </div>
    );
  }

  return (
    <div className="employee-details-page">
      {/* Header */}
      <div className="details-header">
        <div className="header-left">
          <Button variant="outline" onClick={() => navigate('/admin/employees')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </Button>
          <h1>Employee Details</h1>
        </div>
        <div className="header-actions">
          {hasPermission('EditEmployee') && (
            <Link to={`/admin/employees/edit/${id}`}>
              <Button variant="primary">
                <FontAwesomeIcon icon={faEdit} /> Edit
              </Button>
            </Link>
          )}
          {hasPermission('DeleteEmployee') && (
            <Button variant="danger">
              <FontAwesomeIcon icon={faTrash} /> Delete
            </Button>
          )}
          <Button variant="secondary">
            <FontAwesomeIcon icon={faDownload} /> Export
          </Button>
          <Button variant="secondary">
            <FontAwesomeIcon icon={faPrint} /> Print
          </Button>
        </div>
      </div>

      {/* Employee Profile Card */}
      <Card className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <span>{employee.name.charAt(0)}</span>
          </div>
          <div className="profile-info">
            <h2>{employee.name}</h2>
            <p className="designation">{employee.academic_rank}, {employee.department?.name}</p>
            <div className="profile-meta">
              <span>
                <FontAwesomeIcon icon={faUserTie} /> Employee ID: {employee.emp_id}
              </span>
              <span>
                <FontAwesomeIcon icon={faCalendarAlt} /> Joined: {formatDate(employee.hire_date)}
              </span>
              <span className={`status-badge status-${employee.status.toLowerCase()}`}>
                {employee.status}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat">
            <span className="label">Leave Balance</span>
            <span className="value">15 days</span>
          </div>
          <div className="stat">
            <span className="label">Attendance</span>
            <span className="value">95%</span>
          </div>
          <div className="stat">
            <span className="label">Performance</span>
            <span className="value">4.5/5</span>
          </div>
          <div className="stat">
            <span className="label">Projects</span>
            <span className="value">3</span>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <Card className="tab-content">
        {activeTab === 'personal' && (
          <div className="personal-info">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Full Name</span>
                <span className="value">{employee.name}</span>
              </div>
              <div className="info-item">
                <span className="label">Email Address</span>
                <span className="value">
                  <FontAwesomeIcon icon={faEnvelope} /> {employee.email}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Phone Number</span>
                <span className="value">
                  <FontAwesomeIcon icon={faPhone} /> {employee.phone}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Emergency Contact</span>
                <span className="value">{employee.emergency_contact}</span>
              </div>
              <div className="info-item full-width">
                <span className="label">Address</span>
                <span className="value">
                  <FontAwesomeIcon icon={faMapMarkerAlt} /> {employee.address}
                </span>
              </div>
            </div>

            <div className="skills-section">
              <h3>
                <FontAwesomeIcon icon={faGraduationCap} /> Skills
              </h3>
              <div className="skills-list">
                {employee.skills?.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>

            <div className="competencies-section">
              <h3>Competencies</h3>
              <div className="competencies-list">
                {employee.competencies?.map((comp, index) => (
                  <span key={index} className="competency-tag">{comp}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'employment' && (
          <div className="employment-info">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Department</span>
                <span className="value">{employee.department?.name}</span>
              </div>
              <div className="info-item">
                <span className="label">Academic Rank</span>
                <span className="value">{employee.academic_rank}</span>
              </div>
              <div className="info-item">
                <span className="label">Reporting Manager</span>
                <span className="value">{employee.manager?.name || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Hire Date</span>
                <span className="value">{formatDate(employee.hire_date)}</span>
              </div>
              <div className="info-item">
                <span className="label">Employment Type</span>
                <span className="value">Full-time</span>
              </div>
              <div className="info-item">
                <span className="label">Years of Service</span>
                <span className="value">
                  {new Date().getFullYear() - new Date(employee.hire_date).getFullYear()} years
                </span>
              </div>
            </div>

            <div className="employment-history">
              <h3>
                <FontAwesomeIcon icon={faHistory} /> Employment History
              </h3>
              <Table
                columns={[
                  { key: 'position', title: 'Position' },
                  { key: 'department', title: 'Department' },
                  { key: 'from', title: 'From' },
                  { key: 'to', title: 'To' },
                ]}
                data={[
                  {
                    position: 'Associate Professor',
                    department: 'Computer Science',
                    from: '2018',
                    to: 'Present',
                  },
                  {
                    position: 'Assistant Professor',
                    department: 'Computer Science',
                    from: '2014',
                    to: '2018',
                  },
                ]}
              />
            </div>
          </div>
        )}

        {activeTab === 'leave' && (
          <div className="leave-history">
            <div className="leave-summary">
              <div className="summary-card">
                <span className="label">Annual Leave</span>
                <span className="value">12/20</span>
                <span className="progress">60%</span>
              </div>
              <div className="summary-card">
                <span className="label">Sick Leave</span>
                <span className="value">8/12</span>
                <span className="progress">66%</span>
              </div>
              <div className="summary-card">
                <span className="label">Personal Leave</span>
                <span className="value">3/5</span>
                <span className="progress">60%</span>
              </div>
            </div>
            <Table
              columns={leaveHistoryColumns}
              data={leaveHistoryData}
            />
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="attendance-history">
            <div className="attendance-summary">
              <div className="summary-card">
                <span className="label">Present</span>
                <span className="value">18</span>
              </div>
              <div className="summary-card">
                <span className="label">Absent</span>
                <span className="value">2</span>
              </div>
              <div className="summary-card">
                <span className="label">Late</span>
                <span className="value">1</span>
              </div>
              <div className="summary-card">
                <span className="label">Leave</span>
                <span className="value">3</span>
              </div>
            </div>
            <Table
              columns={attendanceColumns}
              data={[
                { date: '2024-03-01', clockIn: '09:00', clockOut: '18:00', hours: '9', status: 'Present' },
                { date: '2024-03-02', clockIn: '09:15', clockOut: '18:00', hours: '8.75', status: 'Late' },
                { date: '2024-03-03', clockIn: '-', clockOut: '-', hours: '-', status: 'Leave' },
              ]}
            />
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="payroll-history">
            <div className="payroll-summary">
              <div className="summary-card">
                <span className="label">Current CTC</span>
                <span className="value">{formatCurrency(1200000)}</span>
              </div>
              <div className="summary-card">
                <span className="label">Monthly Basic</span>
                <span className="value">{formatCurrency(85000)}</span>
              </div>
              <div className="summary-card">
                <span className="label">YTD Earnings</span>
                <span className="value">{formatCurrency(765000)}</span>
              </div>
            </div>
            <Table
              columns={payrollColumns}
              data={[
                { month: 'Mar 2024', basic: '85,000', allowances: '25,000', deductions: '15,000', netPay: '95,000', status: 'Processed' },
                { month: 'Feb 2024', basic: '85,000', allowances: '25,000', deductions: '15,000', netPay: '95,000', status: 'Paid' },
              ]}
            />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="documents-section">
            <div className="document-categories">
              <div className="category">
                <h4>
                  <FontAwesomeIcon icon={faFileAlt} /> Personal Documents
                </h4>
                <ul>
                  <li>ID Proof - Uploaded</li>
                  <li>Address Proof - Uploaded</li>
                  <li>Educational Certificates - Pending</li>
                </ul>
              </div>
              <div className="category">
                <h4>
                  <FontAwesomeIcon icon={faBriefcase} /> Employment Documents
                </h4>
                <ul>
                  <li>Employment Contract - Uploaded</li>
                  <li>Offer Letter - Uploaded</li>
                  <li>NDA - Uploaded</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmployeeDetails;