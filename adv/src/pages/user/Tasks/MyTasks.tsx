import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTasks,
  faCheckCircle,
  faClock,
  faExclamationTriangle,

  faSearch,
  faEye,
  faCheck,

} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useNotification } from '../../../hooks/useNotification';
import { formatDate } from '../../../utils/formatters';

interface Task {
  id: string;
  title: string;
  description: string;
  category: 'Onboarding' | 'Offboarding' | 'Regular' | 'Compliance';
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'InProgress' | 'Completed' | 'Overdue';
  assignedBy: string;
  completedDate?: string;
}

const MyTasks: React.FC = () => {
  const { showNotification } = useNotification();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Submit Quarterly Report',
          description: 'Prepare and submit Q1 2024 performance report',
          category: 'Regular',
          dueDate: '2024-03-30',
          priority: 'High',
          status: 'InProgress',
          assignedBy: 'Dr. Jane Smith',
        },
        {
          id: '2',
          title: 'Complete Onboarding Documents',
          description: 'Submit identity proof and educational certificates',
          category: 'Onboarding',
          dueDate: '2024-03-25',
          priority: 'High',
          status: 'Pending',
          assignedBy: 'HR Department',
        },
        {
          id: '3',
          title: 'Review Student Applications',
          description: 'Review PhD applications for Fall 2024',
          category: 'Regular',
          dueDate: '2024-04-05',
          priority: 'Medium',
          status: 'Pending',
          assignedBy: 'Dr. Jane Smith',
        },
        {
          id: '4',
          title: 'Safety Training Module',
          description: 'Complete online lab safety training',
          category: 'Compliance',
          dueDate: '2024-03-20',
          priority: 'Medium',
          status: 'Overdue',
          assignedBy: 'Safety Office',
        },
        {
          id: '5',
          title: 'Return Laptop',
          description: 'Return company laptop and accessories',
          category: 'Offboarding',
          dueDate: '2024-03-28',
          priority: 'High',
          status: 'Pending',
          assignedBy: 'IT Department',
        },
        {
          id: '6',
          title: 'Update Research Profile',
          description: 'Update profile on university research portal',
          category: 'Regular',
          dueDate: '2024-03-15',
          priority: 'Low',
          status: 'Completed',
          assignedBy: 'Research Office',
          completedDate: '2024-03-14',
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
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filter !== 'all') {
      filtered = filtered.filter(t => t.status === filter);
    }

    setFilteredTasks(filtered);
  }, [searchTerm, filter, tasks]);

  const handleMarkComplete = (taskId: string) => {
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, status: 'Completed', completedDate: new Date().toISOString().split('T')[0] } : t
    ));
    showNotification('Task marked as complete', 'success');
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Completed': return faCheckCircle;
      case 'InProgress': return faClock;
      case 'Overdue': return faExclamationTriangle;
      default: return faClock;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return '#10b981';
      case 'InProgress': return '#3b82f6';
      case 'Overdue': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const filters = ['all', 'Pending', 'InProgress', 'Completed', 'Overdue'];

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    pending: tasks.filter(t => t.status === 'Pending').length,
    overdue: tasks.filter(t => t.status === 'Overdue').length,
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your tasks...</p>
      </div>
    );
  }

  return (
    <div className="my-tasks-page">
      <div className="page-header">
        <h1>My Tasks</h1>
        <p>Manage and track your assigned tasks</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon blue">
            <FontAwesomeIcon icon={faTasks} />
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Tasks</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon green">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="stat-info">
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon orange">
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon red">
            <FontAwesomeIcon icon={faExclamationTriangle} />
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
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            {filters.map(f => (
              <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Tasks List */}
      <div className="tasks-list">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <Card key={task.id} className="task-card">
              <div className="task-header">
                <div className="task-title">
                  <h3>{task.title}</h3>
                  <span className="task-category">{task.category}</span>
                </div>
                <span
                  className="priority-badge"
                  style={{ backgroundColor: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority) }}
                >
                  {task.priority}
                </span>
              </div>

              <p className="task-description">{task.description}</p>

              <div className="task-meta">
                <div className="meta-item">
                  <span className="label">Due Date:</span>
                  <span className={`value ${task.status === 'Overdue' ? 'overdue' : ''}`}>
                    {formatDate(task.dueDate)}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="label">Assigned By:</span>
                  <span className="value">{task.assignedBy}</span>
                </div>
                {task.completedDate && (
                  <div className="meta-item">
                    <span className="label">Completed:</span>
                    <span className="value">{formatDate(task.completedDate)}</span>
                  </div>
                )}
              </div>

              <div className="task-footer">
                <div className="task-status">
                  <FontAwesomeIcon
                    icon={getStatusIcon(task.status)}
                    style={{ color: getStatusColor(task.status) }}
                  />
                  <span style={{ color: getStatusColor(task.status) }}>{task.status}</span>
                </div>

                <div className="task-actions">
                  <Link to={`/user/tasks/${task.id}`}>
                    <Button variant="secondary" size="small">
                      <FontAwesomeIcon icon={faEye} /> View Details
                    </Button>
                  </Link>
                  {task.status !== 'Completed' && task.status !== 'Overdue' && (
                    <Button
                      variant="success"
                      size="small"
                      onClick={() => handleMarkComplete(task.id)}
                    >
                      <FontAwesomeIcon icon={faCheck} /> Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="no-results">
            <FontAwesomeIcon icon={faTasks} />
            <h3>No tasks found</h3>
            <p>You don't have any tasks matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasks;