import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCheckCircle,
  faClock,
  
  faUser,
  faCalendarAlt,
  faFileAlt,
  faDownload,
  faUpload,
  faComment,
  faCheck,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { formatDate, formatDateTime } from '../../../utils/formatters';

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'InProgress' | 'Completed' | 'Overdue';
  assignedBy: {
    name: string;
    designation: string;
    email: string;
  };
  assignedDate: string;
  completedDate?: string;
  attachments?: {
    name: string;
    size: string;
    url: string;
  }[];
  comments?: {
    id: number;
    user: string;
    text: string;
    date: string;
  }[];
  checklist?: {
    id: number;
    item: string;
    completed: boolean;
  }[];
}

const TaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockTask: TaskDetail = {
        id: id || '1',
        title: 'Submit Quarterly Report',
        description: 'Prepare and submit Q1 2024 performance report including research output, teaching evaluations, and departmental contributions. The report should be in PDF format and include all supporting documents.',
        category: 'Regular',
        dueDate: '2024-03-30',
        priority: 'High',
        status: 'InProgress',
        assignedBy: {
          name: 'Dr. Jane Smith',
          designation: 'Department Head',
          email: 'jane.smith@university.edu',
        },
        assignedDate: '2024-03-01',
        attachments: [
          { name: 'Report_Template.docx', size: '245 KB', url: '#' },
          { name: 'Guidelines.pdf', size: '1.2 MB', url: '#' },
        ],
        comments: [
          {
            id: 1,
            user: 'Dr. Jane Smith',
            text: 'Please ensure to include the student feedback metrics.',
            date: '2024-03-05T10:30:00',
          },
          {
            id: 2,
            user: 'You',
            text: 'I will include the metrics from the latest survey.',
            date: '2024-03-06T14:20:00',
          },
        ],
        checklist: [
          { id: 1, item: 'Complete research output section', completed: true },
          { id: 2, item: 'Add teaching evaluations', completed: true },
          { id: 3, item: 'Include departmental contributions', completed: false },
          { id: 4, item: 'Format as PDF', completed: false },
        ],
      };
      setTask(mockTask);
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleComplete = () => {
    if (!comment.trim()) {
      showNotification('Please add a completion comment', 'warning');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      showNotification('Task marked as complete', 'success');
      setShowCompleteModal(false);
      navigate('/user/tasks');
    }, 1000);
  };

  const handleReject = () => {
    if (!comment.trim()) {
      showNotification('Please provide a reason for rejection', 'warning');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      showNotification('Task rejected and returned for revision', 'success');
      setShowRejectModal(false);
      navigate('/user/tasks');
    }, 1000);
  };

  const handleChecklistToggle = (itemId: number) => {
    if (!task) return;
    const updatedChecklist = task.checklist?.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setTask({ ...task, checklist: updatedChecklist });
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading task details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="not-found">
        <h2>Task Not Found</h2>
        <Button variant="primary" onClick={() => navigate('/user/tasks')}>
          Back to Tasks
        </Button>
      </div>
    );
  }

  const progress = task.checklist
    ? (task.checklist.filter(i => i.completed).length / task.checklist.length) * 100
    : 0;

  return (
    <div className="task-details-page">
      <div className="page-header">
        <div className="header-left">
          <Button variant="outline" onClick={() => navigate('/user/tasks')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </Button>
          <h1>Task Details</h1>
        </div>
        <div className="header-actions">
          {task.status !== 'Completed' && (
            <>
              <Button variant="success" onClick={() => setShowCompleteModal(true)}>
                <FontAwesomeIcon icon={faCheck} /> Mark Complete
              </Button>
              <Button variant="danger" onClick={() => setShowRejectModal(true)}>
                <FontAwesomeIcon icon={faTimes} /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="task-details-grid">
        {/* Main Content */}
        <div className="task-main">
          <Card className="task-info-card">
            <div className="task-header">
              <h2>{task.title}</h2>
              <div className="task-badges">
                <span
                  className="priority-badge"
                  style={{ backgroundColor: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority) }}
                >
                  {task.priority} Priority
                </span>
                <span
                  className="status-badge"
                  style={{ backgroundColor: `${getStatusColor(task.status)}20`, color: getStatusColor(task.status) }}
                >
                  {task.status}
                </span>
              </div>
            </div>

            <div className="task-description">
              <h3>Description</h3>
              <p>{task.description}</p>
            </div>

            <div className="task-meta-grid">
              <div className="meta-item">
                <FontAwesomeIcon icon={faUser} />
                <div>
                  <span className="label">Assigned By</span>
                  <span className="value">{task.assignedBy.name}</span>
                  <small>{task.assignedBy.designation}</small>
                </div>
              </div>

              <div className="meta-item">
                <FontAwesomeIcon icon={faCalendarAlt} />
                <div>
                  <span className="label">Due Date</span>
                  <span className={`value ${task.status === 'Overdue' ? 'overdue' : ''}`}>
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              </div>

              <div className="meta-item">
                <FontAwesomeIcon icon={faClock} />
                <div>
                  <span className="label">Assigned Date</span>
                  <span className="value">{formatDate(task.assignedDate)}</span>
                </div>
              </div>

              {task.completedDate && (
                <div className="meta-item">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <div>
                    <span className="label">Completed Date</span>
                    <span className="value">{formatDate(task.completedDate)}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {task.checklist && task.checklist.length > 0 && (
            <Card className="checklist-card" title="Checklist">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="checklist-items">
                {task.checklist.map(item => (
                  <label key={item.id} className="checklist-item">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleChecklistToggle(item.id)}
                    />
                    <span className={item.completed ? 'completed' : ''}>{item.item}</span>
                  </label>
                ))}
              </div>
            </Card>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <Card className="attachments-card" title="Attachments">
              <div className="attachments-list">
                {task.attachments.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <FontAwesomeIcon icon={faFileAlt} />
                    <div className="attachment-info">
                      <span className="name">{file.name}</span>
                      <span className="size">{file.size}</span>
                    </div>
                    <a href={file.url} className="download-btn">
                      <FontAwesomeIcon icon={faDownload} />
                    </a>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="comments-card" title="Comments">
            <div className="comments-list">
              {task.comments?.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-user">{comment.user}</span>
                    <span className="comment-date">{formatDateTime(comment.date)}</span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              ))}
            </div>

            <div className="add-comment">
              <textarea
                className="form-control"
                rows={2}
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button variant="primary" size="small">
                <FontAwesomeIcon icon={faComment} /> Post Comment
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="task-sidebar">
          <Card className="progress-card" title="Progress">
            <div className="progress-circle">
              <svg viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e9ecef"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#4361ee"
                  strokeWidth="3"
                  strokeDasharray={`${progress}, 100`}
                />
                <text x="18" y="20.35" className="percentage">
                  {progress.toFixed(0)}%
                </text>
              </svg>
            </div>
          </Card>

          <Card className="actions-card" title="Quick Actions">
            <div className="quick-actions">
              <Button variant="secondary" fullWidth>
                <FontAwesomeIcon icon={faUpload} /> Upload Document
              </Button>
              <Button variant="secondary" fullWidth>
                <FontAwesomeIcon icon={faComment} /> Add Note
              </Button>
              <Button variant="secondary" fullWidth>
                <FontAwesomeIcon icon={faUser} /> Contact Assigner
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Complete Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Complete Task"
        size="small"
      >
        <div className="complete-task-modal">
          <p>Are you sure you want to mark this task as complete?</p>
          <div className="form-group">
            <label>Completion Comments *</label>
            <textarea
              className="form-control"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add any final comments or notes..."
            />
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleComplete}>
              <FontAwesomeIcon icon={faCheck} /> Complete Task
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Task"
        size="small"
      >
        <div className="reject-task-modal">
          <p>Please provide a reason for rejecting this task:</p>
          <div className="form-group">
            <label>Rejection Reason *</label>
            <textarea
              className="form-control"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Explain why this task is being rejected..."
            />
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject}>
              <FontAwesomeIcon icon={faTimes} /> Reject Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TaskDetails;