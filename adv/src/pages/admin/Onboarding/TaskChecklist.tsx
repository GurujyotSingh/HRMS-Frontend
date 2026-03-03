import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faTimes,
  faDownload,
  faUpload,
  faFilePdf,
  faFileImage,
  faFileWord,
  faFileExcel,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useNotification } from '../../../hooks/useNotification';
import { formatDate } from '../../../utils/formatters';

interface Task {
  id: number;
  name: string;
  category: string;
  description: string;
  status: 'Pending' | 'InProgress' | 'Completed';
  dueDate: string;
  assignedTo: string;
  documents?: {
    name: string;
    url: string;
    type: string;
  }[];
}

const TaskChecklist: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState({
    name: 'Amit Kumar',
    position: 'Assistant Professor',
    department: 'Computer Science',
    startDate: '2024-04-01',
  });

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      name: 'Submit Identity Proof',
      category: 'Document',
      description: 'Upload PAN card and Aadhaar card for verification',
      status: 'Completed',
      dueDate: '2024-03-10',
      assignedTo: 'HR Department',
      documents: [
        { name: 'PAN_Card.pdf', url: '#', type: 'pdf' },
        { name: 'Aadhaar_Card.jpg', url: '#', type: 'image' },
      ],
    },
    {
      id: 2,
      name: 'Educational Certificates',
      category: 'Document',
      description: 'Upload all educational degree certificates',
      status: 'Pending',
      dueDate: '2024-03-15',
      assignedTo: 'HR Department',
    },
    {
      id: 3,
      name: 'HR Induction Session',
      category: 'Training',
      description: 'Attend HR induction session (virtual)',
      status: 'InProgress',
      dueDate: '2024-03-12',
      assignedTo: 'HR Department',
    },
    {
      id: 4,
      name: 'IT Setup',
      category: 'IT',
      description: 'Setup email account and provide laptop',
      status: 'Pending',
      dueDate: '2024-03-14',
      assignedTo: 'IT Department',
    },
    {
      id: 5,
      name: 'Sign Employment Contract',
      category: 'Document',
      description: 'Review and sign employment contract',
      status: 'Pending',
      dueDate: '2024-03-13',
      assignedTo: 'HR Department',
    },
  ]);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleTaskStatusChange = (taskId: number, newStatus: Task['status']) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
    showNotification('Task status updated', 'success');
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return faFilePdf;
      case 'image': return faFileImage;
      case 'word': return faFileWord;
      case 'excel': return faFileExcel;
      default: return faFilePdf;
    }
  };

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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading checklist...</p>
      </div>
    );
  }

  const progress = {
    completed: tasks.filter(t => t.status === 'Completed').length,
    total: tasks.length,
    percentage: (tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100,
  };

  return (
    <div className="task-checklist-page">
      <div className="page-header">
        <div className="header-left">
          <Button variant="outline" onClick={() => navigate('/admin/onboarding/new-hires')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </Button>
          <h1>Onboarding Checklist</h1>
        </div>
      </div>

      {/* Employee Summary */}
      <Card className="employee-summary">
        <div className="summary-header">
          <h2>{employee.name}</h2>
          <span className="employee-position">{employee.position}</span>
        </div>
        <div className="summary-details">
          <div className="detail">
            <span className="label">Department:</span>
            <span className="value">{employee.department}</span>
          </div>
          <div className="detail">
            <span className="label">Start Date:</span>
            <span className="value">{formatDate(employee.startDate)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-header">
            <span>Overall Progress</span>
            <span>{progress.completed}/{progress.total} tasks completed</span>
          </div>
          <div className="progress-bar large">
            <div
              className="progress-fill"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Tasks by Category */}
      {['Document', 'Training', 'IT', 'HR', 'Finance'].map(category => {
        const categoryTasks = tasks.filter(t => t.category === category);
        if (categoryTasks.length === 0) return null;

        return (
          <Card key={category} className="category-card" title={`${category} Tasks`}>
            <div className="tasks-list">
              {categoryTasks.map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-header">
                    <div className="task-title">
                      <h4>{task.name}</h4>
                      {getStatusBadge(task.status)}
                    </div>
                    <div className="task-meta">
                      <span className="due-date">Due: {formatDate(task.dueDate)}</span>
                      <span className="assigned-to">Assigned to: {task.assignedTo}</span>
                    </div>
                  </div>

                  <p className="task-description">{task.description}</p>

                  {task.documents && task.documents.length > 0 && (
                    <div className="task-documents">
                      <h5>Documents:</h5>
                      <div className="document-list">
                        {task.documents.map((doc, index) => (
                          <a key={index} href={doc.url} className="document-link">
                            <FontAwesomeIcon icon={getFileIcon(doc.type)} />
                            {doc.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="task-actions">
                    {task.status !== 'Completed' && (
                      <>
                        <Button
                          variant="success"
                          size="small"
                          onClick={() => handleTaskStatusChange(task.id, 'Completed')}
                        >
                          <FontAwesomeIcon icon={faCheck} /> Mark Complete
                        </Button>
                        {task.category === 'Document' && (
                          <Button variant="secondary" size="small">
                            <FontAwesomeIcon icon={faUpload} /> Upload Document
                          </Button>
                        )}
                      </>
                    )}
                    {task.status === 'Completed' && (
                      <Button variant="outline" size="small">
                        <FontAwesomeIcon icon={faDownload} /> Download Documents
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default TaskChecklist;