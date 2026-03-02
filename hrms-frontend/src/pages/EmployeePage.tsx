// src/pages/EmployeePage.tsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserPlus,
  faSearch,
  faFilter,
  faDownload,
  faUpload,
  faEdit,
  faTrash,
  faEye,
  faUserCircle,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faBriefcase,
  faCalendarAlt,
  faToggleOn,
  faToggleOff,
  faChevronLeft,
  faChevronRight,
  faTimes,
  faCheck,
  faExclamationTriangle,
  faFileExport,
  faFileImport,
  faPrint,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joinDate: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  status: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
  avatar?: string;
  address?: string;
  emergencyContact?: string;
  salary?: number;
}

const EmployeePage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<keyof Employee>('firstName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Form state for add/edit
  const [formData, setFormData] = useState<Partial<Employee>>({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    joinDate: '',
    employmentType: 'Full-time',
    status: 'Active',
  });

  // Mock data
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockEmployees: Employee[] = [
        {
          id: '1',
          employeeId: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@skips.edu',
          phone: '+91 98765 43210',
          department: 'Computer Science',
          designation: 'Professor',
          joinDate: '2020-01-15',
          employmentType: 'Full-time',
          status: 'Active',
          address: '123 Academic Street, Mumbai',
          emergencyContact: 'Jane Doe: +91 98765 43211',
          salary: 120000,
        },
        {
          id: '2',
          employeeId: 'EMP002',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@skips.edu',
          phone: '+91 98765 43212',
          department: 'Mathematics',
          designation: 'Associate Professor',
          joinDate: '2019-03-20',
          employmentType: 'Full-time',
          status: 'Active',
          address: '456 College Road, Delhi',
          emergencyContact: 'John Smith: +91 98765 43213',
          salary: 100000,
        },
        {
          id: '3',
          employeeId: 'EMP003',
          firstName: 'Rahul',
          lastName: 'Kumar',
          email: 'rahul.kumar@skips.edu',
          phone: '+91 98765 43214',
          department: 'Physics',
          designation: 'Assistant Professor',
          joinDate: '2021-06-10',
          employmentType: 'Full-time',
          status: 'On Leave',
          address: '789 Science Avenue, Bangalore',
          emergencyContact: 'Priya Kumar: +91 98765 43215',
          salary: 80000,
        },
        {
          id: '4',
          employeeId: 'EMP004',
          firstName: 'Priya',
          lastName: 'Sharma',
          email: 'priya.sharma@skips.edu',
          phone: '+91 98765 43216',
          department: 'Chemistry',
          designation: 'Lab Assistant',
          joinDate: '2022-09-01',
          employmentType: 'Part-time',
          status: 'Active',
          address: '321 Research Park, Chennai',
          emergencyContact: 'Amit Sharma: +91 98765 43217',
          salary: 40000,
        },
        {
          id: '5',
          employeeId: 'EMP005',
          firstName: 'Amit',
          lastName: 'Patel',
          email: 'amit.patel@skips.edu',
          phone: '+91 98765 43218',
          department: 'Computer Science',
          designation: 'Teaching Assistant',
          joinDate: '2023-01-15',
          employmentType: 'Intern',
          status: 'Active',
          address: '654 Tech Hub, Pune',
          emergencyContact: 'Neha Patel: +91 98765 43219',
          salary: 25000,
        },
        {
          id: '6',
          employeeId: 'EMP006',
          firstName: 'Neha',
          lastName: 'Gupta',
          email: 'neha.gupta@skips.edu',
          phone: '+91 98765 43220',
          department: 'Mathematics',
          designation: 'Professor',
          joinDate: '2018-11-05',
          employmentType: 'Full-time',
          status: 'Inactive',
          address: '147 Numbers Street, Hyderabad',
          emergencyContact: 'Raj Gupta: +91 98765 43221',
          salary: 130000,
        },
      ];
      setEmployees(mockEmployees);
      setFilteredEmployees(mockEmployees);
      setLoading(false);
    }, 1000);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 768) {
        setViewMode('table');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter employees
  useEffect(() => {
    let filtered = employees;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (selectedDepartment !== 'All') {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }

    // Status filter
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(emp => emp.status === selectedStatus);
    }

    // Employment type filter
    if (selectedEmploymentType !== 'All') {
      filtered = filtered.filter(emp => emp.employmentType === selectedEmploymentType);
    }

    // Sorting
    filtered = [...filtered].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedStatus, selectedEmploymentType, employees, sortBy, sortOrder]);

  // Get unique departments for filter
  const departments = ['All', ...new Set(employees.map(emp => emp.department))];
  const statuses = ['All', ...new Set(employees.map(emp => emp.status))];
  const employmentTypes = ['All', ...new Set(employees.map(emp => emp.employmentType))];

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // Handle sort
  const handleSort = (column: keyof Employee) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Handle add/edit employee
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployee) {
      // Edit existing employee
      const updatedEmployees = employees.map(emp =>
        emp.id === selectedEmployee.id ? { ...emp, ...formData } : emp
      );
      setEmployees(updatedEmployees);
    } else {
      // Add new employee
      const newEmployee: Employee = {
        id: Date.now().toString(),
        employeeId: formData.employeeId || `EMP${String(employees.length + 1).padStart(3, '0')}`,
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        email: formData.email || '',
        phone: formData.phone || '',
        department: formData.department || '',
        designation: formData.designation || '',
        joinDate: formData.joinDate || '',
        employmentType: formData.employmentType as any || 'Full-time',
        status: formData.status as any || 'Active',
      };
      setEmployees([...employees, newEmployee]);
    }
    setShowAddModal(false);
    setSelectedEmployee(null);
    setFormData({});
  };

  // Handle delete
  const handleDelete = () => {
    if (selectedEmployee) {
      const updatedEmployees = employees.filter(emp => emp.id !== selectedEmployee.id);
      setEmployees(updatedEmployees);
      setShowDeleteModal(false);
      setSelectedEmployee(null);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Department', 'Designation', 'Join Date', 'Employment Type', 'Status'];
    const csvData = filteredEmployees.map(emp => [
      emp.employeeId,
      emp.firstName,
      emp.lastName,
      emp.email,
      emp.phone,
      emp.department,
      emp.designation,
      emp.joinDate,
      emp.employmentType,
      emp.status,
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;

  return (
    <div className="employee-page">
      {/* Header */}
      <div className="employee-header">
        <div className="employee-title-section">
          <h1 className="employee-title">Employee Management</h1>
          <p className="employee-subtitle">
            Total Employees: {filteredEmployees.length} | Active: {employees.filter(e => e.status === 'Active').length}
          </p>
        </div>
        <div className="employee-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedEmployee(null);
              setFormData({});
              setShowAddModal(true);
            }}
          >
            <FontAwesomeIcon icon={faUserPlus} />
            {!isMobile && ' Add Employee'}
          </button>
          <button className="btn btn-secondary" onClick={exportToCSV}>
            <FontAwesomeIcon icon={faDownload} />
            {!isMobile && ' Export'}
          </button>
          {!isMobile && (
            <button className="btn btn-secondary">
              <FontAwesomeIcon icon={faUpload} />
              Import
            </button>
          )}
          {!isMobile && (
            <button className="btn btn-secondary" onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}>
              <FontAwesomeIcon icon={viewMode === 'table' ? faFilter : faFilter} />
              {viewMode === 'table' ? ' Grid View' : ' Table View'}
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="employee-filters">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, ID, email, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {!isMobile ? (
          <div className="filter-controls">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="filter-select"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept === 'All' ? 'All Departments' : dept}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status === 'All' ? 'All Status' : status}</option>
              ))}
            </select>

            <select
              value={selectedEmploymentType}
              onChange={(e) => setSelectedEmploymentType(e.target.value)}
              className="filter-select"
            >
              {employmentTypes.map(type => (
                <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
              ))}
            </select>

            <button className="btn-filter" onClick={() => setShowFilterModal(true)}>
              <FontAwesomeIcon icon={faFilter} />
              More Filters
            </button>
          </div>
        ) : (
          <button className="btn-filter mobile-filter-btn" onClick={() => setShowFilterModal(true)}>
            <FontAwesomeIcon icon={faFilter} />
            Filters
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="employee-stats">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{employees.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>{employees.filter(e => e.status === 'Active').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">On Leave</span>
          <span className="stat-value" style={{ color: 'var(--warning)' }}>{employees.filter(e => e.status === 'On Leave').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Inactive</span>
          <span className="stat-value" style={{ color: 'var(--danger)' }}>{employees.filter(e => e.status === 'Inactive').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Full-time</span>
          <span className="stat-value">{employees.filter(e => e.employmentType === 'Full-time').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Part-time</span>
          <span className="stat-value">{employees.filter(e => e.employmentType === 'Part-time').length}</span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading employees...</p>
        </div>
      )}

      {/* Employee List */}
      {!loading && (
        <>
          {viewMode === 'table' && !isMobile ? (
            <div className="table-container">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('employeeId')}>
                      Employee ID {sortBy === 'employeeId' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('firstName')}>
                      Name {sortBy === 'firstName' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('department')}>
                      Department {sortBy === 'department' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('designation')}>
                      Designation {sortBy === 'designation' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Contact</th>
                    <th onClick={() => handleSort('employmentType')}>
                      Type {sortBy === 'employmentType' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('status')}>
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(emp => (
                    <tr key={emp.id}>
                      <td>{emp.employeeId}</td>
                      <td>
                        <div className="employee-name-cell">
                          <FontAwesomeIcon icon={faUserCircle} className="employee-avatar" />
                          <div>
                            <div>{emp.firstName} {emp.lastName}</div>
                            <small>{emp.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>{emp.department}</td>
                      <td>{emp.designation}</td>
                      <td>
                        <div className="employee-contact">
                          <div><FontAwesomeIcon icon={faPhone} /> {emp.phone}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${emp.employmentType.toLowerCase().replace(' ', '-')}`}>
                          {emp.employmentType}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${emp.status.toLowerCase().replace(' ', '-')}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn view" onClick={() => alert(`View employee: ${emp.firstName}`)}>
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button className="action-btn edit" onClick={() => {
                            setSelectedEmployee(emp);
                            setFormData(emp);
                            setShowAddModal(true);
                          }}>
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button className="action-btn delete" onClick={() => {
                            setSelectedEmployee(emp);
                            setShowDeleteModal(true);
                          }}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="employee-grid">
              {currentItems.map(emp => (
                <div key={emp.id} className="employee-card">
                  <div className="employee-card-header">
                    <div className="employee-card-avatar">
                      <FontAwesomeIcon icon={faUserCircle} />
                    </div>
                    <div className="employee-card-info">
                      <h3>{emp.firstName} {emp.lastName}</h3>
                      <p>{emp.employeeId}</p>
                    </div>
                    <span className={`status-badge status-${emp.status.toLowerCase().replace(' ', '-')}`}>
                      {emp.status}
                    </span>
                  </div>
                  
                  <div className="employee-card-body">
                    <div className="employee-detail">
                      <FontAwesomeIcon icon={faBriefcase} />
                      <span>{emp.designation} • {emp.department}</span>
                    </div>
                    <div className="employee-detail">
                      <FontAwesomeIcon icon={faEnvelope} />
                      <span>{emp.email}</span>
                    </div>
                    <div className="employee-detail">
                      <FontAwesomeIcon icon={faPhone} />
                      <span>{emp.phone}</span>
                    </div>
                    <div className="employee-detail">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      <span>Joined: {new Date(emp.joinDate).toLocaleDateString()}</span>
                    </div>
                    <div className="employee-detail">
                      <span className={`badge badge-${emp.employmentType.toLowerCase().replace(' ', '-')}`}>
                        {emp.employmentType}
                      </span>
                    </div>
                  </div>

                  <div className="employee-card-footer">
                    <button className="card-action-btn edit" onClick={() => {
                      setSelectedEmployee(emp);
                      setFormData(emp);
                      setShowAddModal(true);
                    }}>
                      <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>
                    <button className="card-action-btn view" onClick={() => alert(`View employee: ${emp.firstName}`)}>
                      <FontAwesomeIcon icon={faEye} /> View
                    </button>
                    <button className="card-action-btn delete" onClick={() => {
                      setSelectedEmployee(emp);
                      setShowDeleteModal(true);
                    }}>
                      <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!loading && filteredEmployees.length > 0 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <button
                  key={i}
                  className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
              return <span key={i} className="pagination-ellipsis">...</span>;
            }
            return null;
          })}
          
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}

      {/* No Results */}
      {!loading && filteredEmployees.length === 0 && (
        <div className="no-results">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>No employees found matching your criteria</p>
          <button className="btn btn-primary" onClick={() => {
            setSearchTerm('');
            setSelectedDepartment('All');
            setSelectedStatus('All');
            setSelectedEmploymentType('All');
          }}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.firstName || ''}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.lastName || ''}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Employee ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.employeeId || ''}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Department *</label>
                    <select
                      className="form-control"
                      value={formData.department || ''}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Designation *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.designation || ''}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Join Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.joinDate || ''}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Employment Type</label>
                    <select
                      className="form-control"
                      value={formData.employmentType || 'Full-time'}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      className="form-control"
                      value={formData.status || 'Active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <FontAwesomeIcon icon={faCheck} />
                  {selectedEmployee ? ' Update Employee' : ' Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to delete employee <strong>{selectedEmployee.firstName} {selectedEmployee.lastName}</strong>?</p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <FontAwesomeIcon icon={faTrash} />
                Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal for Mobile */}
      {showFilterModal && isMobile && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-content filter-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Filter Employees</h2>
              <button className="modal-close" onClick={() => setShowFilterModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Department</label>
                <select
                  className="form-control"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-control"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Employment Type</label>
                <select
                  className="form-control"
                  value={selectedEmploymentType}
                  onChange={(e) => setSelectedEmploymentType(e.target.value)}
                >
                  {employmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => {
                setSelectedDepartment('All');
                setSelectedStatus('All');
                setSelectedEmploymentType('All');
              }}>
                Clear All
              </button>
              <button className="btn btn-primary" onClick={() => setShowFilterModal(false)}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePage;