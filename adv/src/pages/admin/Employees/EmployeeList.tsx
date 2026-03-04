// src/pages/admin/Employees/EmployeeList.tsx (Continued)
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faDownload,
  faUpload,
  faUserGraduate,
  faUserTie,
  faUser,
  faSync,
  faChevronLeft,
  faChevronRight,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Employee } from '../../../types/employee';
import { exportToCSV } from '../../../utils/exportUtils';
import { validateEmail, validatePhone } from '../../../utils/validators';

const EmployeeList: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedRank, setSelectedRank] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<keyof Employee>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Mock data - replace with API call
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockEmployees: Employee[] = [
        {
          emp_id: 1,
          name: 'Dr. John Doe',
          email: 'john.doe@university.edu',
          department_id: 1,
          department: { dept_id: 1, name: 'Computer Science', code: 'CS', budget: 5000000 },
          manager_id: 5,
          academic_rank: 'Professor',
          hire_date: '2018-08-15',
          status: 'Active',
          phone: '+91 98765 43210',
          address: '123 Faculty Housing, University Campus',
          emergency_contact: 'Jane Doe: +91 98765 43211',
          skills: ['Machine Learning', 'Data Science', 'Python'],
          competencies: ['Research', 'Teaching', 'Mentoring'],
        },
        {
          emp_id: 2,
          name: 'Dr. Jane Smith',
          email: 'jane.smith@university.edu',
          department_id: 2,
          department: { dept_id: 2, name: 'Mathematics', code: 'MATH', budget: 3500000 },
          manager_id: 6,
          academic_rank: 'Associate Professor',
          hire_date: '2019-01-10',
          status: 'Active',
          phone: '+91 98765 43212',
          address: '456 Faculty Housing, University Campus',
          emergency_contact: 'John Smith: +91 98765 43213',
          skills: ['Algebra', 'Calculus', 'Statistics'],
          competencies: ['Research', 'Curriculum Development'],
        },
        {
          emp_id: 3,
          name: 'Dr. Rahul Kumar',
          email: 'rahul.kumar@university.edu',
          department_id: 3,
          department: { dept_id: 3, name: 'Physics', code: 'PHY', budget: 4200000 },
          manager_id: 7,
          academic_rank: 'Assistant Professor',
          hire_date: '2020-06-20',
          status: 'OnLeave',
          phone: '+91 98765 43214',
          address: '789 Faculty Housing, University Campus',
          emergency_contact: 'Priya Kumar: +91 98765 43215',
          skills: ['Quantum Mechanics', 'Astrophysics'],
          competencies: ['Research', 'Lab Management'],
        },
        {
          emp_id: 4,
          name: 'Dr. Priya Sharma',
          email: 'priya.sharma@university.edu',
          department_id: 4,
          department: { dept_id: 4, name: 'Chemistry', code: 'CHEM', budget: 3800000 },
          manager_id: 8,
          academic_rank: 'Lecturer',
          hire_date: '2021-09-01',
          status: 'Active',
          phone: '+91 98765 43216',
          address: '321 Faculty Housing, University Campus',
          emergency_contact: 'Amit Sharma: +91 98765 43217',
          skills: ['Organic Chemistry', 'Lab Techniques'],
          competencies: ['Teaching', 'Lab Safety'],
        },
        {
          emp_id: 5,
          name: 'Dr. Amit Patel',
          email: 'amit.patel@university.edu',
          department_id: 1,
          department: { dept_id: 1, name: 'Computer Science', code: 'CS', budget: 5000000 },
          academic_rank: 'Professor',
          hire_date: '2015-03-12',
          status: 'Active',
          phone: '+91 98765 43218',
          address: '654 Faculty Housing, University Campus',
          emergency_contact: 'Neha Patel: +91 98765 43219',
          skills: ['AI', 'Robotics', 'Embedded Systems'],
          competencies: ['Research', 'Department Head'],
        },
        {
          emp_id: 6,
          name: 'Dr. Neha Gupta',
          email: 'neha.gupta@university.edu',
          department_id: 2,
          department: { dept_id: 2, name: 'Mathematics', code: 'MATH', budget: 3500000 },
          academic_rank: 'Professor',
          hire_date: '2014-11-05',
          status: 'Active',
          phone: '+91 98765 43220',
          address: '147 Faculty Housing, University Campus',
          emergency_contact: 'Raj Gupta: +91 98765 43221',
          skills: ['Topology', 'Number Theory'],
          competencies: ['Research', 'Department Head'],
        },
      ];
      setEmployees(mockEmployees);
      setFilteredEmployees(mockEmployees);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter employees
  useEffect(() => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.academic_rank.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDepartment !== 'All') {
      filtered = filtered.filter(emp => emp.department?.name === selectedDepartment);
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(emp => emp.status === selectedStatus);
    }

    if (selectedRank !== 'All') {
      filtered = filtered.filter(emp => emp.academic_rank === selectedRank);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[sortBy]?.toString() || '';
      const bVal = b[sortBy]?.toString() || '';
      if (sortOrder === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedStatus, selectedRank, employees, sortBy, sortOrder]);

  // Get unique departments, statuses, ranks for filters
  const departments = ['All', ...new Set(employees.map(emp => emp.department?.name).filter(Boolean))];
  const statuses = ['All', ...new Set(employees.map(emp => emp.status))];
  const ranks = ['All', ...new Set(employees.map(emp => emp.academic_rank))];

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const handleSort = (column: keyof Employee) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleDelete = () => {
    if (selectedEmployee) {
      const updatedEmployees = employees.filter(emp => emp.emp_id !== selectedEmployee.emp_id);
      setEmployees(updatedEmployees);
      setShowDeleteModal(false);
      setSelectedEmployee(null);
      showNotification(`Employee ${selectedEmployee.name} has been deleted`, 'success');
    }
  };

  const handleExport = () => {
    const exportData = filteredEmployees.map(emp => ({
      'Employee ID': emp.emp_id,
      'Name': emp.name,
      'Email': emp.email,
      'Department': emp.department?.name,
      'Academic Rank': emp.academic_rank,
      'Status': emp.status,
      'Hire Date': emp.hire_date,
      'Phone': emp.phone,
    }));
    exportToCSV(exportData, 'employees_export.csv');
    showNotification('Employee data exported successfully', 'success');
  };

  const handleBulkUpload = () => {
    // Implement bulk upload logic
    showNotification('Bulk upload feature coming soon', 'info');
  };

  const getRankIcon = (rank: string) => {
    switch(rank) {
      case 'Professor': return faUserGraduate;
      case 'Associate Professor': return faUserTie;
      case 'Assistant Professor': return faUserTie;
      default: return faUser;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'Active': return 'badge-success';
      case 'Inactive': return 'badge-secondary';
      case 'OnLeave': return 'badge-warning';
      case 'Terminated': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading employees...</p>
      </div>
    );
  }

  return (
    <div className="employee-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Employee Management</h1>
          <p>Total Employees: {employees.length} | Active: {employees.filter(e => e.status === 'Active').length}</p>
        </div>
        <div className="header-actions">
          {hasPermission('AddEmployee') && (
            <Link to="/admin/employees/add">
              <Button variant="primary">
                <FontAwesomeIcon icon={faPlus} /> Add Employee
              </Button>
            </Link>
          )}
          <Button variant="secondary" onClick={handleExport}>
            <FontAwesomeIcon icon={faDownload} /> Export
          </Button>
          <Button variant="secondary" onClick={handleBulkUpload}>
            <FontAwesomeIcon icon={faUpload} /> Bulk Upload
          </Button>
          <Button variant="secondary" onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}>
            <FontAwesomeIcon icon={viewMode === 'table' ? faUser : faUserGraduate} />
            {viewMode === 'table' ? ' Grid View' : ' Table View'}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
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
            value={selectedRank}
            onChange={(e) => setSelectedRank(e.target.value)}
            className="filter-select"
          >
            {ranks.map(rank => (
              <option key={rank} value={rank}>{rank === 'All' ? 'All Ranks' : rank}</option>
            ))}
          </select>
          <Button variant="outline" onClick={() => setShowFilterModal(true)}>
            <FontAwesomeIcon icon={faFilter} /> More Filters
          </Button>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setSelectedDepartment('All');
            setSelectedStatus('All');
            setSelectedRank('All');
          }}>
            <FontAwesomeIcon icon={faSync} /> Clear
          </Button>
        </div>
      </div>

      {/* Employee Count Stats */}
      <div className="stats-row">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{employees.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Professors</span>
          <span className="stat-value">{employees.filter(e => e.academic_rank === 'Professor').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Associate Professors</span>
          <span className="stat-value">{employees.filter(e => e.academic_rank === 'Associate Professor').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Assistant Professors</span>
          <span className="stat-value">{employees.filter(e => e.academic_rank === 'Assistant Professor').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Lecturers</span>
          <span className="stat-value">{employees.filter(e => e.academic_rank === 'Lecturer').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Staff</span>
          <span className="stat-value">{employees.filter(e => e.academic_rank === 'Staff').length}</span>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('emp_id')}>ID {sortBy === 'emp_id' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('name')}>Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th>Department</th>
                <th onClick={() => handleSort('academic_rank')}>Rank {sortBy === 'academic_rank' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th>Contact</th>
                <th onClick={() => handleSort('status')}>Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(emp => (
                <tr key={emp.emp_id}>
                  <td>{emp.emp_id}</td>
                  <td>
                    <div className="employee-name-cell">
                      <FontAwesomeIcon icon={getRankIcon(emp.academic_rank)} className="rank-icon" />
                      <div>
                        <div className="employee-name">{emp.name}</div>
                        <small>{emp.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{emp.department?.name}</td>
                  <td>{emp.academic_rank}</td>
                  <td>
                    <div className="contact-info">
                      <div>{emp.phone}</div>
                      <small>{emp.emergency_contact}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(emp.status)}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/admin/employees/${emp.emp_id}`}>
                        <button className="action-btn view" title="View">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </Link>
                      {hasPermission('EditEmployee') && (
                        <Link to={`/admin/employees/edit/${emp.emp_id}`}>
                          <button className="action-btn edit" title="Edit">
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                        </Link>
                      )}
                      {hasPermission('DeleteEmployee') && (
                        <button 
                          className="action-btn delete" 
                          title="Delete"
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setShowDeleteModal(true);
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="employee-grid">
          {currentItems.map(emp => (
            <div key={emp.emp_id} className="employee-card">
              <div className="card-header">
                <div className="employee-avatar">
                  <FontAwesomeIcon icon={getRankIcon(emp.academic_rank)} />
                </div>
                <div className="employee-header-info">
                  <h3>{emp.name}</h3>
                  <p>{emp.academic_rank}</p>
                </div>
                <span className={`badge ${getStatusBadgeClass(emp.status)}`}>
                  {emp.status}
                </span>
              </div>
              <div className="card-body">
                <div className="info-row">
                  <span className="label">Department:</span>
                  <span className="value">{emp.department?.name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{emp.email}</span>
                </div>
                <div className="info-row">
                  <span className="label">Phone:</span>
                  <span className="value">{emp.phone}</span>
                </div>
                <div className="info-row">
                  <span className="label">Hire Date:</span>
                  <span className="value">{new Date(emp.hire_date).toLocaleDateString()}</span>
                </div>
                {emp.skills && emp.skills.length > 0 && (
                  <div className="skills-section">
                    <span className="label">Skills:</span>
                    <div className="skills-tags">
                      {emp.skills.map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="card-footer">
                <Link to={`/admin/employees/${emp.emp_id}`}>
                  <Button variant="secondary" size="small">View Details</Button>
                </Link>
                {hasPermission('EditEmployee') && (
                  <Link to={`/admin/employees/edit/${emp.emp_id}`}>
                    <Button variant="primary" size="small">Edit</Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredEmployees.length > 0 && (
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
              (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
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
            } else if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
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
      {filteredEmployees.length === 0 && (
        <div className="no-results">
          <FontAwesomeIcon icon={faUser} />
          <h3>No employees found</h3>
          <p>Try adjusting your search or filter criteria</p>
          <Button variant="primary" onClick={() => {
            setSearchTerm('');
            setSelectedDepartment('All');
            setSelectedStatus('All');
            setSelectedRank('All');
          }}>
            Clear Filters
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete"
        size="small"
      >
        <div className="delete-confirmation">
          <p>Are you sure you want to delete <strong>{selectedEmployee?.name}</strong>?</p>
          <p className="warning-text">This action cannot be undone. All associated data including leave records, attendance, and payroll history will also be deleted.</p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <FontAwesomeIcon icon={faTrash} /> Delete Employee
            </Button>
          </div>
        </div>
      </Modal>

      {/* Filter Modal for Mobile */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Advanced Filters"
        size="small"
      >
        <div className="filter-form">
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
            <label>Academic Rank</label>
            <select
              className="form-control"
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
            >
              {ranks.map(rank => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setShowFilterModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setShowFilterModal(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeList;