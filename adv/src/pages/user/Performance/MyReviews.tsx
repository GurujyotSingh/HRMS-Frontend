import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar,
  faStar as faStarSolid,
  faCalendarAlt,
  faUser,

  faEye,
  faDownload,

  faCheckCircle,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Chart from '../../../components/ui/Chart';
import { useNotification } from '../../../hooks/useNotification';
import { formatDate } from '../../../utils/formatters';

interface Review {
  id: string;
  period: string;
  reviewer: string;
  reviewerDesignation: string;
  date: string;
  overallRating: number;
  status: 'Pending' | 'Completed' | 'Acknowledged';
  goals: string;
  achievements: string;
  improvements: string;
  comments: string;
  ratings: {
    category: string;
    rating: number;
    weight: number;
    comments: string;
  }[];
}

const MyReviews: React.FC = () => {
  const { showNotification } = useNotification();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockReviews: Review[] = [
        {
          id: '1',
          period: 'Q1 2024',
          reviewer: 'Dr. Jane Smith',
          reviewerDesignation: 'Department Head',
          date: '2024-03-15',
          overallRating: 4.5,
          status: 'Completed',
          goals: 'Complete research paper, Mentor 2 junior faculty, Improve student feedback',
          achievements: 'Published paper in top journal, Student feedback improved by 20%',
          improvements: 'Time management, Research collaboration',
          comments: 'Excellent performance this quarter. Research output is outstanding.',
          ratings: [
            { category: 'Teaching Quality', rating: 4, weight: 30, comments: 'Good teaching skills' },
            { category: 'Research Output', rating: 5, weight: 30, comments: 'Excellent research' },
            { category: 'Student Feedback', rating: 4, weight: 20, comments: 'Positive feedback' },
            { category: 'Department Contribution', rating: 5, weight: 10, comments: 'Active participation' },
            { category: 'Professional Development', rating: 4, weight: 10, comments: 'Attended workshops' },
          ],
        },
        {
          id: '2',
          period: 'Q4 2023',
          reviewer: 'Dr. Jane Smith',
          reviewerDesignation: 'Department Head',
          date: '2023-12-10',
          overallRating: 4.2,
          status: 'Acknowledged',
          goals: 'Submit grant proposal, Complete course development',
          achievements: 'Grant proposal submitted, New course material developed',
          improvements: 'Grant writing skills',
          comments: 'Good progress on research. Course development completed on time.',
          ratings: [
            { category: 'Teaching Quality', rating: 4, weight: 30, comments: 'Good' },
            { category: 'Research Output', rating: 4, weight: 30, comments: 'Satisfactory' },
            { category: 'Student Feedback', rating: 4, weight: 20, comments: 'Good' },
            { category: 'Department Contribution', rating: 4, weight: 10, comments: 'Good' },
            { category: 'Professional Development', rating: 5, weight: 10, comments: 'Excellent' },
          ],
        },
        {
          id: '3',
          period: 'Q3 2023',
          reviewer: 'Dr. Jane Smith',
          reviewerDesignation: 'Department Head',
          date: '2023-09-20',
          overallRating: 4.0,
          status: 'Acknowledged',
          goals: 'Complete research paper, Improve teaching evaluations',
          achievements: 'Research paper submitted, Teaching evaluations improved',
          improvements: 'Research output',
          comments: 'Meeting expectations. Focus on research output.',
          ratings: [
            { category: 'Teaching Quality', rating: 4, weight: 30, comments: 'Good' },
            { category: 'Research Output', rating: 3, weight: 30, comments: 'Needs improvement' },
            { category: 'Student Feedback', rating: 4, weight: 20, comments: 'Good' },
            { category: 'Department Contribution', rating: 4, weight: 10, comments: 'Good' },
            { category: 'Professional Development', rating: 4, weight: 10, comments: 'Good' },
          ],
        },
      ];
      setReviews(mockReviews);
      setFilteredReviews(mockReviews);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredReviews(reviews);
    } else {
      setFilteredReviews(reviews.filter(r => r.status === filter));
    }
  }, [filter, reviews]);

  const handleAcknowledge = (reviewId: string) => {
    // Simulate API call
    setTimeout(() => {
      showNotification('Review acknowledged successfully', 'success');
    }, 500);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FontAwesomeIcon key={i} icon={faStarSolid} className="star-filled" />);
    }
    if (hasHalf) {
      stars.push(<FontAwesomeIcon key="half" icon={faStarSolid} className="star-half" />);
    }
    const remaining = 5 - Math.ceil(rating);
    for (let i = 0; i < remaining; i++) {
      stars.push(<FontAwesomeIcon key={`empty-${i}`} icon={faStar} className="star-empty" />);
    }
    return <div className="star-rating">{stars}</div>;
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Completed': return faCheckCircle;
      case 'Pending': return faClock;
      default: return faCheckCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return '#f59e0b';
      case 'Acknowledged': return '#10b981';
      default: return '#6b7280';
    }
  };

  const chartData = reviews.map(r => ({
    period: r.period,
    rating: r.overallRating,
  })).reverse();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading performance reviews...</p>
      </div>
    );
  }

  return (
    <div className="my-reviews-page">
      <div className="page-header">
        <h1>Performance Reviews</h1>
        <p>View your performance evaluations and feedback</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <Card className="summary-card">
          <h3>Total Reviews</h3>
          <p className="value">{reviews.length}</p>
        </Card>
        <Card className="summary-card">
          <h3>Average Rating</h3>
          <p className="value">
            {(reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length).toFixed(1)}
          </p>
        </Card>
        <Card className="summary-card">
          <h3>Last Review</h3>
          <p className="value">{reviews[0]?.period}</p>
        </Card>
      </div>

      {/* Chart */}
      <Card className="chart-card" title="Performance Trend">
        <Chart
          type="line"
          data={chartData}
          xAxisKey="period"
          dataKeys={['rating']}
          colors={['#4361ee']}
          height={300}
        />
      </Card>

      {/* Filter */}
      <Card className="filters-card">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Reviews
          </button>
          <button
            className={`filter-tab ${filter === 'Completed' ? 'active' : ''}`}
            onClick={() => setFilter('Completed')}
          >
            Pending Acknowledgment
          </button>
          <button
            className={`filter-tab ${filter === 'Acknowledged' ? 'active' : ''}`}
            onClick={() => setFilter('Acknowledged')}
          >
            Acknowledged
          </button>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="reviews-list">
        {filteredReviews.map(review => (
          <Card key={review.id} className="review-card">
            <div className="review-header">
              <div className="review-title">
                <h3>{review.period} Performance Review</h3>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: `${getStatusColor(review.status)}20`,
                    color: getStatusColor(review.status),
                  }}
                >
                  <FontAwesomeIcon icon={getStatusIcon(review.status)} />
                  {review.status}
                </span>
              </div>
              <div className="review-meta">
                <span>
                  <FontAwesomeIcon icon={faUser} /> {review.reviewer}
                </span>
                <span>
                  <FontAwesomeIcon icon={faCalendarAlt} /> {formatDate(review.date)}
                </span>
              </div>
            </div>

            <div className="review-rating">
              <span className="label">Overall Rating:</span>
              {renderStars(review.overallRating)}
              <span className="rating-value">{review.overallRating}/5</span>
            </div>

            <div className="review-summary">
              <div className="summary-item">
                <h4>Achievements</h4>
                <p>{review.achievements}</p>
              </div>
              <div className="summary-item">
                <h4>Areas for Improvement</h4>
                <p>{review.improvements}</p>
              </div>
            </div>

            <div className="review-footer">
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedReview(review);
                  setShowDetailsModal(true);
                }}
              >
                <FontAwesomeIcon icon={faEye} /> View Details
              </Button>
              {review.status === 'Completed' && (
                <Button
                  variant="success"
                  onClick={() => handleAcknowledge(review.id)}
                >
                  <FontAwesomeIcon icon={faCheckCircle} /> Acknowledge
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Details Modal */}
      {selectedReview && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedReview(null);
          }}
          title={`${selectedReview.period} Performance Review`}
          size="large"
        >
          <div className="review-details-modal">
            <div className="modal-section">
              <h4>Review Information</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Reviewer:</span>
                  <span className="value">{selectedReview.reviewer}</span>
                </div>
                <div className="info-item">
                  <span className="label">Date:</span>
                  <span className="value">{formatDate(selectedReview.date)}</span>
                </div>
                <div className="info-item">
                  <span className="label">Overall Rating:</span>
                  <span className="value">{renderStars(selectedReview.overallRating)}</span>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h4>Detailed Ratings</h4>
              <table className="ratings-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Rating</th>
                    <th>Weight</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReview.ratings.map((rating, index) => (
                    <tr key={index}>
                      <td>{rating.category}</td>
                      <td>
                        <div className="rating-cell">
                          {renderStars(rating.rating)}
                          <span>({rating.rating})</span>
                        </div>
                      </td>
                      <td>{rating.weight}%</td>
                      <td>{rating.comments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-section">
              <h4>Goals</h4>
              <p>{selectedReview.goals}</p>
            </div>

            <div className="modal-section">
              <h4>Achievements</h4>
              <p>{selectedReview.achievements}</p>
            </div>

            <div className="modal-section">
              <h4>Areas for Improvement</h4>
              <p>{selectedReview.improvements}</p>
            </div>

            <div className="modal-section">
              <h4>Reviewer Comments</h4>
              <div className="comments-box">
                {selectedReview.comments}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            {selectedReview.status === 'Completed' && (
              <Button variant="success" onClick={() => handleAcknowledge(selectedReview.id)}>
                <FontAwesomeIcon icon={faCheckCircle} /> Acknowledge Review
              </Button>
            )}
            <Button variant="secondary">
              <FontAwesomeIcon icon={faDownload} /> Download PDF
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyReviews;