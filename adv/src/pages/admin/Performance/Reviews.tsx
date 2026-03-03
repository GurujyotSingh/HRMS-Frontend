import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  
  faPlus,
  faStar,
  faStarHalf,
  faEye,
  faEdit,
  
  faCheckCircle,
  faClock,
  
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import { PerformanceReview } from '../../../types/performance';
import { formatDate } from '../../../utils/formatters';

const PerformanceReviews: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [periodFilter, setPeriodFilter] = useState('All');
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockReviews: PerformanceReview[] = [
        {
          review_id: 1,
          employee_id: 1,
          employee: { emp_id: 1, name: 'John Doe', department: 'Computer Science' },
          reviewer_id: 5,
          reviewer: { emp_id: 5, name: 'Dr. Amit Patel' },
          review_period: 'Q1 2024',
          review_date: '2024-03-15',
          overall_rating: 4.5,
          comments: 'Excellent performance this quarter. Completed all projects ahead of schedule.',
          goals: 'Complete research paper, Mentor 2 junior faculty',
          achievements: 'Published paper in top journal, Student feedback improved by 20%',
          areas_for_improvement: 'Could improve time management',
          status: 'Completed',
        },
        {
          review_id: 2,
          employee_id: 2,
          employee: { emp_id: 2, name: 'Jane Smith', department: 'Mathematics' },
          reviewer_id: 6,
          reviewer: { emp_id: 6, name: 'Dr. Neha Gupta' },
          review_period: 'Q1 2024',
          review_date: '2024-03-10',
          overall_rating: 4.0,
          comments: 'Good performance. Needs to work on research output.',
          goals: 'Submit 2 research papers, Develop new course material',
          achievements: 'Student feedback positive, Course evaluations improved',
          areas_for_improvement: 'Research output needs improvement',
          status: 'Completed',
        },
        {
          review_id: 3,
          employee_id: 3,
          employee: { emp_id: 3, name: 'Rahul Kumar', department: 'Physics' },
          reviewer_id: 7,
          reviewer: { emp_id: 7, name: 'Dr. Rajesh Kumar' },
          review_period: 'Q1 2024',
          overall_rating: 3.5,
          status: 'Pending',
        },
        {
          review_id: 4,
          employee_id: 4,
          employee: { emp_id: 4, name: 'Priya Sharma', department: 'Chemistry' },
          reviewer_id: 8,
          reviewer: { emp_id: 8, name: 'Dr. Sunita Reddy' },
          review_period: 'Q1 2024',
          review_date: '2024-03-05',
          overall_rating: 4.8,
          comments: 'Outstanding performance. Exceeded all expectations.',
          goals: 'Lead research project, Apply for grant',
          achievements: 'Secured research grant, Published 2 papers',
          areas_for_improvement: 'None significant',
          status: 'Completed',
        },
        {
          review_id: 5,
          employee_id: 5,
          employee: { emp_id: 5, name: 'Amit Patel', department: 'Computer Science' },
          reviewer_id: 1,
          reviewer: { emp_id: 1, name: 'Dr. John Doe' },
          review_period: 'Q1 2024',
          overall_rating: 4.2,
          status: 'InProgress',
        },
      ];
      setReviews(mockReviews);
      setFilteredReviews(mockReviews);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = reviews;

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employee?.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reviewer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (periodFilter !== 'All') {
      filtered = filtered.filter(r => r.review_period === periodFilter);
    }

    setFilteredReviews(filtered);
  }, [searchTerm, statusFilter, periodFilter, reviews]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FontAwesomeIcon key={i} icon={faStar} className="star-filled" />);
    }
    if (hasHalf) {
      stars.push(<FontAwesomeIcon key="half" icon={faStarHalf} className="star-half" />);
    }
    const remaining = 5 - Math.ceil(rating);
    for (let i = 0; i < remaining; i++) {
      stars.push(<FontAwesomeIcon key={`empty-${i}`} icon={faStar} className="star-empty" />);
    }
    return <div className="star-rating">{stars} ({rating})</div>;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: { bg: '#f59e0b20', color: '#f59e0b', icon: faClock },
      InProgress: { bg: '#3b82f620', color: '#3b82f6', icon: faEdit },
      Completed: { bg: '#10b98120', color: '#10b981', icon: faCheckCircle },
    };
    const style = styles[status as keyof typeof styles] || styles.Pending;

    return (
      <span className="status-badge" style={{ backgroundColor: style.bg, color: style.color }}>
        <FontAwesomeIcon icon={style.icon} />
        {status}
      </span>
    );
  };

  const periods = ['All', ...new Set(reviews.map(r => r.review_period).filter(Boolean))];
  const statuses = ['All', 'Pending', 'InProgress', 'Completed'];

  const columns = [
    {
      key: 'employee',
      title: 'Employee',
      render: (row: PerformanceReview) => (
        <div>
          <div className="employee-name">{row.employee?.name}</div>
          <small>{row.employee?.department}</small>
        </div>
      ),
    },
    {
      key: 'reviewer',
      title: 'Reviewer',
      render: (row: PerformanceReview) => row.reviewer?.name || '-',
    },
    { key: 'review_period', title: 'Period' },
    {
      key: 'review_date',
      title: 'Review Date',
      render: (row: PerformanceReview) => row.review_date ? formatDate(row.review_date) : '-',
    },
    {
      key: 'rating',
      title: 'Rating',
      render: (row: PerformanceReview) => row.overall_rating ? renderStars(row.overall_rating) : '-',
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: PerformanceReview) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: PerformanceReview) => (
        <div className="action-buttons">
          <button
            className="action-btn view"
            onClick={() => {
              setSelectedReview(row);
              setShowDetailsModal(true);
            }}
            title="View Details"
          >
            <FontAwesomeIcon icon={faEye} />
          </button>
          {row.status !== 'Completed' && hasPermission('EditPerformance') && (
            <Link to={`/admin/performance/review/${row.review_id}`}>
              <button className="action-btn edit" title="Edit">
                <FontAwesomeIcon icon={faEdit} />
              </button>
            </Link>
          )}
        </div>
      ),
    },
  ];

  const stats = {
    total: reviews.length,
    completed: reviews.filter(r => r.status === 'Completed').length,
    pending: reviews.filter(r => r.status === 'Pending').length,
    inProgress: reviews.filter(r => r.status === 'InProgress').length,
    averageRating: (
      reviews.filter(r => r.overall_rating).reduce((sum, r) => sum + (r.overall_rating || 0), 0) /
      reviews.filter(r => r.overall_rating).length
    ).toFixed(1),
  };

  return (
    <div className="performance-reviews-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Performance Reviews</h1>
          <p>Manage employee performance evaluations</p>
        </div>
        <div className="header-actions">
          {hasPermission('CreatePerformance') && (
            <Link to="/admin/performance/review/new">
              <Button variant="primary">
                <FontAwesomeIcon icon={faPlus} /> New Review
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon blue">
            <FontAwesomeIcon icon={faStar} />
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Reviews</p>
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
          <div className="stat-icon purple">
            <FontAwesomeIcon icon={faEdit} />
          </div>
          <div className="stat-info">
            <h3>{stats.inProgress}</h3>
            <p>In Progress</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon yellow">
            <FontAwesomeIcon icon={faStar} />
          </div>
          <div className="stat-info">
            <h3>{stats.averageRating}</h3>
            <p>Avg Rating</p>
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
              placeholder="Search by employee, reviewer..."
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
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="filter-select"
          >
            {periods.map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setStatusFilter('All');
            setPeriodFilter('All');
          }}>
            <FontAwesomeIcon icon={faTimes} /> Clear
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          data={filteredReviews}
          loading={loading}
        />
      </Card>

      {/* Details Modal */}
      {selectedReview && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedReview(null);
          }}
          title="Review Details"
          size="large"
        >
          <div className="review-details">
            <div className="review-header">
              <div>
                <h3>{selectedReview.employee?.name}</h3>
                <p>{selectedReview.employee?.department} • {selectedReview.review_period}</p>
              </div>
              {renderStars(selectedReview.overall_rating || 0)}
            </div>

            <div className="review-section">
              <h4>Goals</h4>
              <p>{selectedReview.goals || 'No goals specified'}</p>
            </div>

            <div className="review-section">
              <h4>Achievements</h4>
              <p>{selectedReview.achievements || 'No achievements recorded'}</p>
            </div>

            <div className="review-section">
              <h4>Areas for Improvement</h4>
              <p>{selectedReview.areas_for_improvement || 'None specified'}</p>
            </div>

            <div className="review-section">
              <h4>Reviewer Comments</h4>
              <div className="comments-box">
                {selectedReview.comments || 'No comments added'}
              </div>
            </div>

            <div className="review-meta">
              <span>Reviewed by: {selectedReview.reviewer?.name}</span>
              {selectedReview.review_date && (
                <span>Review Date: {formatDate(selectedReview.review_date)}</span>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            {selectedReview.status !== 'Completed' && (
              <Link to={`/admin/performance/review/${selectedReview.review_id}`}>
                <Button variant="primary">
                  <FontAwesomeIcon icon={faEdit} /> Edit Review
                </Button>
              </Link>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PerformanceReviews;