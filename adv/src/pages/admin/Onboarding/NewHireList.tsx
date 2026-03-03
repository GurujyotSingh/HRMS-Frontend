import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faUserPlus,
  faCalendarAlt,
  faCheckCircle,
  faExclamationTriangle,
  faEye,
  faEdit,
  faDownload,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import { useNotification } from '../../../hooks/useNotification';
import { formatDate } from '../../../utils/formatters';

interface NewHire {
  id: number;
  name: string;
  position: string;
  department: string;
  startDate: string;
  status: 'Pending' | 'InProgress' | 'Completed';
  tasksCompleted: number;
  totalTasks: number;
  documents: {
    id: number;
    name: string;
    status: 'Pending' | 'Uploaded' | 'Verified';
  }[];
}

const NewHireList: React.FC = () => {
  const { showNotification } = useNotification();
  const [hires, setHires] = useState<NewHire[]>([]);
  const [filteredHires, setFilteredHires] = useState<NewHire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockHires: NewHire[] = [
        {
          id: 1,
          name: 'Amit Kumar',
          position: 'Assistant Professor',
          department: 'Computer Science',
          startDate: '2024-04-01',
          status: 'InProgress',
          tasksCompleted: 3,
          totalTasks: 8,
          documents: [
            { id: 1, name: 'ID Proof', status: 'Uploaded' },
            { id: 2, name: 'Educational Certificates', status: 'Pending' },
            { id: 3, name: 'Employment Contract', status: 'Pending' },
          ],
        },
        {
          id: 2,
          name: 'Priya Singh',
          position: 'Lab Assistant',
          department: 'Physics',
          startDate: '2024-04-15',
          status: 'Pending',
          tasksCompleted: 0,
          totalTasks: 8,
          documents: [
            { id: 1, name: 'ID Proof', status: 'Pending' },
            { id: 2, name: 'Educational Certificates', status: 'Pending' },
          ],
        },
        {
          id: 3,
          name: 'Rajesh Verma',
          position: 'Administrative Officer',
          department: 'Administration',
          startDate: '2024-03-20',
          status: 'Completed',
          tasksCompleted: 8,
          totalTasks: 8,
          documents: [
            { id: 1, name: 'ID Proof', status: 'Verified' },
            { id: 2, name: 'Educational Certificates', status: 'Verified' },
            { id: 3, name: 'Employment Contract', status: 'Signed' },
          ],
        },
      ];
      setHires(mockHires);
      setFilteredHires(mockHires);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = hires;

    if (searchTerm) {
      filtered = filtered.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== 'All') {
      filtered = filtered.filter(h => h.department === departmentFilter);
    }

    setFilteredHires(filtered);
  }, [searchTerm, departmentFilter, hires]);

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: { bg: '#f59e0b20', color: '#f59e0b' },
      InProgress: { bg: '#3b82f620', color: '#3b82f6' },
      Completed: { bg: '#10b98120', color: '#10b981' },
    };
    const style = styles[status as keyof typeof styles] || styles.Pending;

    return (
      <span className="status-badge" style={{ backgroundColor: style.bg, color: style.color }}>
        {status}
      </span>
    );
  };

  const departments = ['All', ...new Set(hires.map(h => h.department))];

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'position', title: 'Position' },
    { key: 'department', title: 'Department' },
    {
      key: 'startDate',
      title: 'Start Date',
      render: (row: NewHire) => formatDate(row.startDate),
    },
    {
      key: 'progress',
      title: 'Progress',
      render: (row: NewHire) => (
        <div className="progress-cell">
          <span>{row.tasksCompleted}/{row.totalTasks} tasks</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(row.tasksCompleted / row.totalTasks) * 100}%` }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: NewHire) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: NewHire) => (
        <div className="action-buttons">
          <Link to={`/admin/onboarding/checklist/${row.id}`}>
            <button className="action-btn view" title="View Details">
              <FontAwesomeIcon icon={faEye} />
            </button>
          </Link>
          <button className="action-btn edit" title="Edit">
            <FontAwesomeIcon icon={faEdit} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="new-hire-page">
      <div className="page-header">
        <div className="header-left">
          <h1>New Hires</h1>
          <p>Manage upcoming and recent new employees</p>
        </div>
        <div className="header-actions">
          <Button variant="primary">
            <FontAwesomeIcon icon={faUserPlus} /> Add New Hire
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <Card className="summary-card">
          <h3>Total New Hires</h3>
          <p className="value">{hires.length}</p>
        </Card>
        <Card className="summary-card">
          <h3>Starting This Month</h3>
          <p className="value">3</p>
        </Card>
        <Card className="summary-card">
          <h3>Pending Tasks</h3>
          <p className="value warning">12</p>
        </Card>
        <Card className="summary-card">
          <h3>Completed</h3>
          <p className="value success">1</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-grid">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, position..."
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

      {/* Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          data={filteredHires}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default NewHireList;