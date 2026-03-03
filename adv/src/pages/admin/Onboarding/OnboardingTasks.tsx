import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faPlus,
  faEdit,
  faTrash,
  faCheck,
  faTimes,
  faUserPlus,
  faClipboardList,
  faDownload,
  faEye,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import FormInput from '../../../components/ui/FormInput';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import { EmployeeTask } from '../../../types/employeeTask';
import { formatDate } from '../../../utils/formatters';

const OnboardingTasks: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedTask, setSelectedTask] = useState<EmployeeTask | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    task_type: 'Onboarding' as 'Onboarding' | 'Offboarding' | 'Regular',
    task_name: '',
    description: '',
    due_date: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    category: 'Document' as 'Document' | 'Asset' | 'Training' | 'IT' | 'HR' | 'Finance',
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockTasks: EmployeeTask[] = [
        {
          task_id: 1,
          employee_id: 1,
          employee: { emp_id: 1, name: 'John Doe', department: 'Computer Science' },
          task_type: 'Onboarding',
          task_name: 'Submit Identity Proof',
          description: 'Submit PAN card and Aadhaar card for verification',
          due_date: '2024-03-10',
          status: 'Completed',
          assigned_by: 5,
          priority: 'High',
          category: 'Document',
          completed_date: '2024-03-08',
        },
        {
          task_id: 2,
          employee_id: 1,
          employee: { emp_id: 1, name: 'John Doe', department: 'Computer Science' },
          task_type: 'Onboarding',
          task_name: 'Complete HR Induction',
          description: 'Attend HR induction session',
          due_date: '2024-03-15',
          status: 'InProgress',
          assigned_by: 5,
          priority: 'High',
          category: 'Training',
        },
        {
          task_id: 3,
          employee_id: 2,
          employee: { emp_id: 2, name: 'Jane Smith', department: 'Mathematics' },
          task_type: 'Onboarding',
          task_name: 'Setup Email Account',
          description: 'Create university email account',
          due_date: '2024-03-12',
          status: 'Pending',
          assigned_by: 5,
          priority: 'Medium',
          category: 'IT',
        },
        {
          task_id: 4,
          employee_id: 3,
          employee: { emp_id: 3, name: 'Rahul Kumar', department: 'Physics' },
          task_type: 'Offboarding',
          task_name: 'Return Laptop',
          description: 'Return company laptop and accessories',
          due_date: '2024-03-20',
          status: 'Pending',
          assigned_by: 5,
          priority: 'High',
          category: 'Asset',
        },
        {
          task_id: 5,
          employee_id: 3,
          employee: { emp_id: 3, name: 'Rahul Kumar', department: 'Physics' },
          task_type: 'Offboarding',
          task_name: 'Exit Interview',
          description: 'Complete exit interview with HR',
          due_date: '2024-03-18',
          status: 'Pending',
          assigned_by: 5,
          priority: 'Medium',
          category: 'HR',
        },
      ];
      setTasks(mockTasks);
      setFilteredTasks(mockTasks);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.task_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (typeFilter !== 'All') {
      filtered = filtered.filter(t => t.task_type === typeFilter);
    }

    setFilteredTasks(filtered);
  }, [searchTerm, statusFilter, typeFilter, tasks]);

  const handleAddTask = () => {
    // Validate form
    if (!formData.employee_id || !formData.task_name || !formData.due_date) {
      showNotification('Please fill in all required fields', 'warning');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      showNotification('Task added successfully', 'success');
      setShowAddModal(false);
      setFormData({
        employee_id: '',
        task_type: 'Onboarding',
        task_name: '',
        description: '',
        due_date: '',
        priority: 'Medium',
        category: 'Document',
      });
    }, 1000);
  };

  const handleEditTask = () => {
    if (!selectedTask) return;
    // Simulate API call
    setTimeout(() => {
      showNotification('Task updated successfully', 'success');
      setShowEditModal(false);
      setSelectedTask(null);
    }, 1000);
  };

  const handleDeleteTask = () => {
    if (!selectedTask) return;
    // Simulate API call
    setTimeout(() => {
      showNotification('Task deleted successfully', 'success');
      setShowDeleteModal(false);
      setSelectedTask(null);
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: { bg: '#f59e0b20', color: '#f59e0b' },
      InProgress: { bg: '#3b82f620', color: '#3b82f6' },
      Completed: { bg: '#10b98120', color: '#10b981' },
      Overdue: { bg: '#ef444420', color: '#ef4444' },
    };
    const style = styles[status as keyof typeof styles] || styles.Pending;

    return (
      <span className="status-badge" style={{ backgroundColor: style.bg, color: style.color }}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      High: { bg: '#ef444420', color: '#ef4444' },
      Medium: { bg: '#f59e0b20', color: '#f59e0b' },
      Low: { bg: '#10b98120', color: '#10b981' },
    };
    const style = styles[priority as keyof typeof styles] || styles.Medium;

    return (
      <span className="priority-badge" style={{ backgroundColor: style.bg, color: style.color }}>
        {priority}
      </span>
    );
  };

  const columns = [
    {
      key: 'employee',
      title: 'Employee',
      render: (row: EmployeeTask) => (
        <div>
          <div className="employee-name">{row.employee?.name}</div>
          <small>{row.employee?.department}</small>
        </div>
      ),
    },
    {
      key: 'task',
      title: 'Task',
      render: (row: EmployeeTask) => (
        <div>
          <div className="task-name">{row.task_name}</div>
          <small className="task-description">{row.description.substring(0, 50)}...</small>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Type',
      render: (row: EmployeeTask) => (
        <span className={`task-type ${row.task_type.toLowerCase()}`}>
          {row.task_type}
        </span>
      ),
    },
    {
      key: 'category',
      title: 'Category',
      render: (row: EmployeeTask) => row.category,
    },
    {
      key: 'due_date',
      title: 'Due Date',
      render: (row: EmployeeTask) => formatDate(row.due_date),
    },
    {
      key: 'priority',
      title: 'Priority',
      render: (row: EmployeeTask) => getPriorityBadge(row.priority),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: EmployeeTask) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: EmployeeTask) => (
        <div className="action-buttons">
          <button
            className="action-btn view"
            onClick={() => {
              setSelectedTask(row);
              // Show details
            }}
            title="View Details"
          >
            <FontAwesomeIcon icon={faEye} />
          </button>
          <button
            className="action-btn edit"
            onClick={() => {
              setSelectedTask(row);
              setFormData({
                employee_id: row.employee_id.toString(),
                task_type: row.task_type,
                task_name: row.task_name,
                description: row.description,
                due_date: row.due_date,
                priority: row.priority,
                category: row.category,
              });
              setShowEditModal(true);
            }}
            title="Edit"
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button
            className="action-btn delete"
            onClick={() => {
              setSelectedTask(row);
              setShowDeleteModal(true);
            }}
            title="Delete"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      ),
    },
  ];

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'Pending').length,
    inProgress: tasks.filter(t => t.status === 'InProgress').length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    overdue: tasks.filter(t => t.status === 'Overdue').length,
  };

  return (
    <div className="onboarding-tasks-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Onboarding & Offboarding</h1>
          <p>Manage employee onboarding and offboarding tasks</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <FontAwesomeIcon icon={faPlus} /> Add Task
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon blue">
            <FontAwesomeIcon icon={faClipboardList} />
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Tasks</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon orange">
            <FontAwesomeIcon icon={faUserPlus} />
          </div>
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon purple">
            <FontAwesomeIcon icon={faEdit} />
          </div>
          <div className="stat-info">
            <h3>{stats.inProgress}</h3>
            <p>In Progress</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon green">
            <FontAwesomeIcon icon={faCheck} />
          </div>
          <div className="stat-info">
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon red">
            <FontAwesomeIcon icon={faTimes} />
          </div>
          <div className="stat-info">
            <h3>{stats.overdue}</h3>
            <p>Overdue</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-grid">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Types</option>
            <option value="Onboarding">Onboarding</option>
            <option value="Offboarding">Offboarding</option>
            <option value="Regular">Regular</option>
          </select>

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setStatusFilter('All');
            setTypeFilter('All');
          }}>
            <FontAwesomeIcon icon={faTimes} /> Clear
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          data={filteredTasks}
          loading={loading}
        />
      </Card>

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Task"
        size="large"
      >
        <div className="task-form">
          <div className="form-row">
            <div className="form-group">
              <label>Employee *</label>
              <select
                className="form-control"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              >
                <option value="">Select Employee</option>
                <option value="1">John Doe (Computer Science)</option>
                <option value="2">Jane Smith (Mathematics)</option>
                <option value="3">Rahul Kumar (Physics)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Task Type *</label>
              <select
                className="form-control"
                value={formData.task_type}
                onChange={(e) => setFormData({ ...formData, task_type: e.target.value as any })}
              >
                <option value="Onboarding">Onboarding</option>
                <option value="Offboarding">Offboarding</option>
                <option value="Regular">Regular</option>
              </select>
            </div>
          </div>

          <FormInput
            label="Task Name *"
            value={formData.task_name}
            onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
          />

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the task..."
            />
          </div>

          <div className="form-row">
            <FormInput
              label="Due Date *"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />

            <div className="form-group">
              <label>Priority</label>
              <select
                className="form-control"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              >
                <option value="Document">Document</option>
                <option value="Asset">Asset</option>
                <option value="Training">Training</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddTask}>
              Add Task
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTask(null);
        }}
        title="Edit Task"
        size="large"
      >
        <div className="task-form">
          {/* Similar form as add, but with existing data */}
          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditTask}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTask(null);
        }}
        title="Confirm Delete"
        size="small"
      >
        <div className="delete-confirmation">
          <p>Are you sure you want to delete this task?</p>
          <p className="warning-text">This action cannot be undone.</p>
          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteTask}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OnboardingTasks;